-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE coaching_category AS ENUM (
  -- Academic & School Level
  'SCHOOL_COACHING',
  'COLLEGE_TUITION',
  'HOME_TUITION',
  'ONLINE_TUITION',

  -- Competitive Exams
  'COMPETITIVE_EXAM',
  'ENTRANCE_EXAM',
  'TEST_PREPARATION',

  -- Skill & Career Development
  'LANGUAGE_TRAINING',
  'SKILL_DEVELOPMENT',
  'IT_AND_PROGRAMMING',
  'DESIGN_AND_CREATIVE',
  'BUSINESS_AND_MARKETING',
  'ACCOUNTING_AND_FINANCE',

  -- Hobby & Talent
  'HOBBY_CLASSES',
  'MUSIC_AND_DANCE',
  'ART_AND_CRAFT',
  'SPORTS_AND_FITNESS',

  -- Professional & Certification
  'PROFESSIONAL_CERTIFICATION',
  'GOVERNMENT_EXAM_PREPARATION',
  'UPSC_AND_DEFENCE',
  'BANKING_AND_INSURANCE',
  'MEDICAL_AND_ENGINEERING_ENTRANCE',

  -- Coaching Type & Mode
  'TUTORING',
  'MENTORSHIP',
  'WORKSHOP_OR_BOOTCAMP',
  'CAREER_COUNSELLING',
  'OTHER'
);



CREATE TYPE coaching_status AS ENUM (
  'DRAFT',
  'ACTIVE',
  'INACTIVE'
);

-- ============================================================
-- COACHING CENTERS
-- ============================================================

CREATE TABLE coaching_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  established_year INT,

  -- Media
  logo_url TEXT,
  cover_url TEXT,

  -- Category
  category coaching_category NOT NULL DEFAULT 'OTHER',
  subjects TEXT[],  -- e.g. ['Maths', 'Physics']
  target_audience TEXT[], -- e.g. ['Grade 10-12', 'Adults']

  -- Management
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  manager_id UUID REFERENCES auth.users(id), -- optional manager
  status coaching_status DEFAULT 'DRAFT',

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Flags
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Meta
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COACHING BRANCHES
-- ============================================================

CREATE TABLE coaching_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  coaching_center_id UUID REFERENCES coaching_centers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Each branch can have its own manager (optional)
  manager_id UUID REFERENCES auth.users(id),

  -- Contact
  phone TEXT,
  email TEXT,

  -- Branch info
  is_main_branch BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Drop indexes that reference non-existent columns
DROP INDEX IF EXISTS idx_coaching_centers_average_rating;
DROP INDEX IF EXISTS idx_coaching_centers_subjects_offered;
DROP INDEX IF EXISTS idx_coaching_centers_search_vector;
DROP INDEX IF EXISTS idx_coaching_branches_address_id;
DROP INDEX IF EXISTS idx_coaching_branches_branch_code;
DROP INDEX IF EXISTS idx_coaching_centers_one_headquarters;

-- Drop triggers
DROP TRIGGER IF EXISTS update_coaching_centers_updated_at ON coaching_centers;
DROP TRIGGER IF EXISTS generate_coaching_centers_slug ON coaching_centers;
DROP TRIGGER IF EXISTS update_coaching_centers_search_vector ON coaching_centers;
DROP TRIGGER IF EXISTS validate_coaching_centers_manager ON coaching_centers;
DROP TRIGGER IF EXISTS update_coaching_branches_updated_at ON coaching_branches;
DROP TRIGGER IF EXISTS enforce_coaching_branches_single_main ON coaching_branches;
DROP TRIGGER IF EXISTS validate_coaching_branches_manager ON coaching_branches;
DROP TRIGGER IF EXISTS update_coaching_activity_on_branch_change ON coaching_branches;

-- Drop functions
DROP FUNCTION IF EXISTS update_coaching_updated_at();
DROP FUNCTION IF EXISTS generate_coaching_slug();
DROP FUNCTION IF EXISTS update_coaching_search_vector();
DROP FUNCTION IF EXISTS enforce_single_main_branch();
DROP FUNCTION IF EXISTS validate_coaching_manager();
DROP FUNCTION IF EXISTS update_coaching_activity();
DROP FUNCTION IF EXISTS get_coaching_center_stats(UUID);
DROP FUNCTION IF EXISTS search_coaching_centers(TEXT, coaching_category, TEXT, INTEGER, INTEGER);

-- Drop view
DROP VIEW IF EXISTS coaching_center_details;

-- ============================================================
-- CREATE INDEXES FOR COACHING_CENTERS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_coaching_centers_owner_id ON coaching_centers(owner_id);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_manager_id ON coaching_centers(manager_id);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_category ON coaching_centers(category);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_status ON coaching_centers(status);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_is_verified ON coaching_centers(is_verified);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_is_featured ON coaching_centers(is_featured);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_created_at ON coaching_centers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_slug ON coaching_centers(slug);

-- GIN index for array columns
CREATE INDEX IF NOT EXISTS idx_coaching_centers_subjects ON coaching_centers USING GIN(subjects);
CREATE INDEX IF NOT EXISTS idx_coaching_centers_target_audience ON coaching_centers USING GIN(target_audience);

-- ============================================================
-- CREATE INDEXES FOR COACHING_BRANCHES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_coaching_branches_coaching_center_id ON coaching_branches(coaching_center_id);
CREATE INDEX IF NOT EXISTS idx_coaching_branches_manager_id ON coaching_branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_coaching_branches_is_main_branch ON coaching_branches(is_main_branch);
CREATE INDEX IF NOT EXISTS idx_coaching_branches_is_active ON coaching_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_coaching_branches_created_at ON coaching_branches(created_at DESC);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

-- Ensure only one main branch per coaching center
CREATE UNIQUE INDEX IF NOT EXISTS idx_coaching_centers_one_main_branch 
ON coaching_branches(coaching_center_id) 
WHERE is_main_branch = TRUE;

-- ============================================================
-- CREATE TRIGGER FUNCTIONS
-- ============================================================

-- 1. Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coaching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Generate slug from name
CREATE OR REPLACE FUNCTION generate_coaching_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(
            regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ));
        
        base_slug := NEW.slug;
        
        -- Ensure uniqueness by appending number if needed
        WHILE EXISTS (
            SELECT 1 FROM coaching_centers 
            WHERE slug = NEW.slug 
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) LOOP
            NEW.slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure only one main branch per coaching center
CREATE OR REPLACE FUNCTION enforce_single_main_branch()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this branch as main, unset others
    IF NEW.is_main_branch = TRUE THEN
        UPDATE coaching_branches 
        SET is_main_branch = FALSE, updated_at = NOW()
        WHERE coaching_center_id = NEW.coaching_center_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Validate manager role
CREATE OR REPLACE FUNCTION validate_coaching_manager()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if manager has appropriate role
    IF NEW.manager_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = NEW.manager_id 
            AND role IN ('C', 'A', 'SA', 'T')
        ) THEN
            RAISE EXCEPTION 'Manager must have Coach, Teacher, Admin, or Super Admin role';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CREATE TRIGGERS FOR COACHING_CENTERS
-- ============================================================

CREATE TRIGGER update_coaching_centers_updated_at
    BEFORE UPDATE ON coaching_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_coaching_updated_at();

CREATE TRIGGER generate_coaching_centers_slug
    BEFORE INSERT OR UPDATE OF name ON coaching_centers
    FOR EACH ROW
    EXECUTE FUNCTION generate_coaching_slug();

CREATE TRIGGER validate_coaching_centers_manager
    BEFORE INSERT OR UPDATE OF manager_id ON coaching_centers
    FOR EACH ROW
    EXECUTE FUNCTION validate_coaching_manager();

-- ============================================================
-- CREATE TRIGGERS FOR COACHING_BRANCHES
-- ============================================================

CREATE TRIGGER update_coaching_branches_updated_at
    BEFORE UPDATE ON coaching_branches
    FOR EACH ROW
    EXECUTE FUNCTION update_coaching_updated_at();

CREATE TRIGGER enforce_coaching_branches_single_main
    BEFORE INSERT OR UPDATE OF is_main_branch ON coaching_branches
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_main_branch();

CREATE TRIGGER validate_coaching_branches_manager
    BEFORE INSERT OR UPDATE OF manager_id ON coaching_branches
    FOR EACH ROW
    EXECUTE FUNCTION validate_coaching_manager();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
-- Function to get coaching center statistics
-- Enhanced get_coaching_center_stats RPC with all required metrics
CREATE OR REPLACE FUNCTION get_coaching_center_stats(center_id UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_students', COALESCE((
            SELECT COUNT(DISTINCT bs.student_id)
            FROM branch_students bs
            JOIN coaching_branches cb ON bs.branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND cb.is_active = TRUE
            AND bs.enrollment_status = 'ENROLLED'
        ), 0),
        
        'total_teachers', COALESCE((
            SELECT COUNT(DISTINCT bc.teacher_id)
            FROM branch_classes bc
            JOIN coaching_branches cb ON bc.branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND cb.is_active = TRUE
            AND bc.status = 'ACTIVE'
            AND bc.teacher_id IS NOT NULL
        ), 0),
        
        'total_classes', COALESCE((
            SELECT COUNT(*)
            FROM branch_classes bc
            JOIN coaching_branches cb ON bc.branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND cb.is_active = TRUE
            AND bc.status = 'ACTIVE'
        ), 0),
        
        'active_branches', COALESCE((
            SELECT COUNT(*)
            FROM coaching_branches
            WHERE coaching_center_id = center_id
            AND is_active = TRUE
        ), 0),
        
        'total_branches', COALESCE((
            SELECT COUNT(*)
            FROM coaching_branches
            WHERE coaching_center_id = center_id
        ), 0),
        
        'pending_fees', COALESCE((
            SELECT COALESCE(SUM(balance_amount), 0)
            FROM fee_receipts fr
            JOIN coaching_branches cb ON fr.branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND fr.receipt_status IN ('PENDING', 'OVERDUE')
        ), 0),
        
        'attendance_rate', COALESCE((
            SELECT ROUND(AVG(bs.attendance_percentage::DECIMAL / 100), 4)
            FROM branch_students bs
            JOIN coaching_branches cb ON bs.branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND cb.is_active = TRUE
            AND bs.enrollment_status = 'ENROLLED'
            AND bs.attendance_percentage IS NOT NULL
        ), 0),
        
        'avg_rating', COALESCE((
            SELECT ROUND(AVG(r.overall_rating::DECIMAL), 2)
            FROM reviews r
            JOIN coaching_branches cb ON r.coaching_branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND r.status = 'APPROVED'
        ), 0),
        
        'total_reviews', COALESCE((
            SELECT COUNT(*)
            FROM reviews r
            JOIN coaching_branches cb ON r.coaching_branch_id = cb.id
            WHERE cb.coaching_center_id = center_id
            AND r.status = 'APPROVED'
        ), 0)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search coaching centers
CREATE OR REPLACE FUNCTION search_coaching_centers(
    search_query TEXT DEFAULT NULL,
    category_filter coaching_category DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    category coaching_category,
    logo_url TEXT,
    is_featured BOOLEAN,
    branch_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.name,
        cc.slug,
        cc.description,
        cc.category,
        cc.logo_url,
        cc.is_featured,
        COUNT(cb.id) as branch_count
    FROM coaching_centers cc
    LEFT JOIN coaching_branches cb ON cc.id = cb.coaching_center_id AND cb.is_active = TRUE
    WHERE 
        cc.status = 'ACTIVE' 
        AND cc.is_verified = TRUE
        AND (search_query IS NULL OR 
             cc.name ILIKE '%' || search_query || '%' OR 
             cc.description ILIKE '%' || search_query || '%')
        AND (category_filter IS NULL OR cc.category = category_filter)
    GROUP BY cc.id, cc.name, cc.slug, cc.description, cc.category, 
             cc.logo_url, cc.is_featured
    ORDER BY 
        cc.is_featured DESC,
        cc.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CREATE VIEW
-- ============================================================

-- Create a view for coaching center details with aggregated data
CREATE OR REPLACE VIEW coaching_center_details AS
SELECT 
    cc.*,
    COUNT(cb.id) as total_branches,
    COUNT(cb.id) FILTER (WHERE cb.is_active = TRUE) as active_branches
FROM coaching_centers cc
LEFT JOIN coaching_branches cb ON cc.id = cb.coaching_center_id
GROUP BY cc.id;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE coaching_centers IS 'Main table for coaching centers/institutes with comprehensive business information';
COMMENT ON TABLE coaching_branches IS 'Branch locations for coaching centers with operational details';
COMMENT ON COLUMN coaching_centers.metadata IS 'Extensible JSON field for future custom attributes';
COMMENT ON COLUMN coaching_centers.subjects IS 'Array of subjects offered by the coaching center';
COMMENT ON COLUMN coaching_centers.target_audience IS 'Array of target audience groups';
COMMENT ON COLUMN coaching_branches.metadata IS 'Extensible JSON field for branch-specific attributes';
COMMENT ON FUNCTION update_coaching_updated_at() IS 'Automatically updates the updated_at timestamp on record modification';
COMMENT ON FUNCTION generate_coaching_slug() IS 'Generates URL-friendly slug from coaching center name with uniqueness guarantee';
COMMENT ON FUNCTION enforce_single_main_branch() IS 'Ensures only one branch is marked as main branch per coaching center';
COMMENT ON FUNCTION validate_coaching_manager() IS 'Validates that assigned managers have appropriate roles (Coach, Teacher, Admin, or Super Admin)';
COMMENT ON FUNCTION get_coaching_center_stats(UUID) IS 'Returns aggregated statistics for a coaching center';
COMMENT ON FUNCTION search_coaching_centers(TEXT, coaching_category, INTEGER, INTEGER) IS 'Search function with filtering capabilities for coaching centers';