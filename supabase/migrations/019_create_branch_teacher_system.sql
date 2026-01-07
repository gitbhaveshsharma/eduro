-- ============================================================
-- BRANCH TEACHER TABLE (TEACHER SNAPSHOT FOR BRANCHES)
-- ============================================================

CREATE TABLE branch_teacher (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  
  -- Teacher snapshot details (copied from profiles at assignment time)
  teacher_name TEXT NOT NULL,
  teacher_email TEXT NOT NULL,
  teacher_phone TEXT,
  teacher_username TEXT,
  teacher_qualification TEXT,
  teacher_specialization TEXT[],
  
  -- Assignment details
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assignment_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Teaching details
  teaching_subjects TEXT[] NOT NULL, -- Subjects this teacher teaches at this branch
  teaching_experience_years INTEGER,
  hourly_rate DECIMAL(10,2),
  
  -- Availability at this branch
  available_days TEXT[], -- Days teacher is available at this branch
  available_start_time TIME,
  available_end_time TIME,
  
  -- Notes
  assignment_notes TEXT,
  performance_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (available_start_time IS NULL OR available_end_time IS NULL OR available_start_time < available_end_time),
  CONSTRAINT valid_experience CHECK (teaching_experience_years IS NULL OR teaching_experience_years >= 0),
  CONSTRAINT valid_hourly_rate CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  
  -- Unique constraint: one assignment per teacher per branch
  UNIQUE(teacher_id, branch_id)
);

-- ============================================================
-- INDEXES FOR BRANCH TEACHER TABLE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_branch_teacher_teacher_id ON branch_teacher(teacher_id);
CREATE INDEX IF NOT EXISTS idx_branch_teacher_branch_id ON branch_teacher(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_teacher_is_active ON branch_teacher(is_active);
CREATE INDEX IF NOT EXISTS idx_branch_teacher_assignment_date ON branch_teacher(assignment_date);
CREATE INDEX IF NOT EXISTS idx_branch_teacher_available_days ON branch_teacher(available_days);

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_branch_teacher_teaching_subjects ON branch_teacher USING GIN(teaching_subjects);

-- ============================================================
-- TRIGGER FUNCTIONS FOR BRANCH TEACHER
-- ============================================================

-- Update updated_at timestamp for branch_teacher
CREATE OR REPLACE FUNCTION update_branch_teacher_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Update the trigger function to handle NULL values properly
CREATE OR REPLACE FUNCTION populate_teacher_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    teacher_profile profiles;
    teacher_user auth.users;
BEGIN
    -- Get teacher profile information
    SELECT * INTO teacher_profile
    FROM profiles 
    WHERE id = NEW.teacher_id 
    AND role IN ('T', 'C', 'A', 'SA')
    AND is_active = TRUE;
    
    -- Check if the user has teacher/coach/admin role
    IF teacher_profile.id IS NULL THEN
        RAISE EXCEPTION 'Only active teachers, coaches, or admins can be assigned to branches';
    END IF;
    
    -- Get user information from auth.users for email
    SELECT * INTO teacher_user
    FROM auth.users 
    WHERE id = NEW.teacher_id;
    
    -- Auto-populate teacher details from profile with fallbacks for NULL values
    -- Use COALESCE to provide fallback values when profile data is NULL
    NEW.teacher_name := COALESCE(
        teacher_profile.full_name, 
        teacher_user.raw_user_meta_data->>'full_name',
        teacher_user.email,
        'Unnamed Teacher'
    );
    
    NEW.teacher_username := teacher_profile.username; -- Can be null
    
    NEW.teacher_email := COALESCE(
        teacher_profile.email, 
        teacher_user.email,
        'no-email@example.com'
    );
    
    NEW.teacher_phone := teacher_profile.phone; -- Can be null
    NEW.teacher_qualification := NULL;
    
    -- Set specialization from expertise_areas if available
    IF teacher_profile.expertise_areas IS NOT NULL AND array_length(teacher_profile.expertise_areas, 1) > 0 THEN
        NEW.teacher_specialization := teacher_profile.expertise_areas;
    ELSE
        NEW.teacher_specialization := NULL;
    END IF;
    
    -- Populate teaching_experience_years from profiles if not already set
    IF NEW.teaching_experience_years IS NULL THEN
        NEW.teaching_experience_years := teacher_profile.years_of_experience;
    END IF;
    
    -- Populate hourly_rate from profiles if not already set
    IF NEW.hourly_rate IS NULL THEN
        NEW.hourly_rate := teacher_profile.hourly_rate;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS FOR BRANCH TEACHER
-- ============================================================

-- Updated_at trigger
CREATE TRIGGER update_branch_teacher_updated_at
    BEFORE UPDATE ON branch_teacher
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_teacher_updated_at();

-- Populate teacher snapshot trigger
CREATE TRIGGER populate_teacher_snapshot_trigger
    BEFORE INSERT OR UPDATE OF teacher_id ON branch_teacher
    FOR EACH ROW
    EXECUTE FUNCTION populate_teacher_snapshot();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE branch_teacher IS 'Teacher assignments to branches - stores snapshot of teacher details at time of assignment';
COMMENT ON COLUMN branch_teacher.teacher_name IS 'Snapshot of teacher name at assignment time';
COMMENT ON COLUMN branch_teacher.teacher_email IS 'Snapshot of teacher email at assignment time';
COMMENT ON COLUMN branch_teacher.teaching_subjects IS 'Subjects teacher is qualified to teach at this branch';
COMMENT ON COLUMN branch_teacher.available_days IS 'Days teacher is available at this branch';

-- ============================================================
-- ROW LEVEL SECURITY FOR BRANCH TEACHER TABLE
-- ============================================================

-- Enable RLS
ALTER TABLE branch_teacher ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES FOR BRANCH TEACHER TABLE
-- ============================================================

-- SUPER ADMINS & ADMINS: Full CRUD access
CREATE POLICY super_admins_full_access ON branch_teacher
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('SA', 'A'));

-- COACHES: Can view all branch teachers in their accessible branches
-- Can manage teachers only in branches they manage
CREATE POLICY coaches_select_branch_teacher ON branch_teacher
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

CREATE POLICY coaches_insert_branch_teacher ON branch_teacher
    FOR INSERT WITH CHECK (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

CREATE POLICY coaches_update_branch_teacher ON branch_teacher
    FOR UPDATE USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    ) WITH CHECK (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

CREATE POLICY coaches_delete_branch_teacher ON branch_teacher
    FOR DELETE USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- BRANCH MANAGERS: Can view all teachers in their branches
-- Can only update/delete teachers they manage
CREATE POLICY managers_select_branch_teacher ON branch_teacher
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

CREATE POLICY managers_insert_branch_teacher ON branch_teacher
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

CREATE POLICY managers_update_branch_teacher ON branch_teacher
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    ) WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

CREATE POLICY managers_delete_branch_teacher ON branch_teacher
    FOR DELETE USING (
        branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- TEACHERS: Can view their own assignments only (read-only)
CREATE POLICY teachers_select_own_assignments ON branch_teacher
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    );

-- TEACHERS: Can update their own availability and teaching details
CREATE POLICY teachers_update_own_availability ON branch_teacher
    FOR UPDATE USING (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    ) WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    );


-- STUDENTS: Can view teachers assigned to their enrolled branches
CREATE POLICY students_view_branch_teachers ON branch_teacher
    FOR SELECT USING (
        public.get_user_role(auth.uid()) = 'S'
        AND branch_id IN (
            SELECT DISTINCT bs.branch_id
            FROM branch_students bs
            WHERE bs.student_id = auth.uid()
            AND bs.enrollment_status IN ('ENROLLED', 'PENDING', 'SUSPENDED')
        )
        AND is_active = TRUE  -- Only show active teachers to students
    );
-- ============================================================
-- HELPER FUNCTIONS FOR BRANCH TEACHER RLS
-- ============================================================

-- Function to check if user can manage teacher assignments in a branch
CREATE OR REPLACE FUNCTION can_manage_branch_teachers(p_branch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    accessible_branches UUID[];
BEGIN
    user_role := public.get_user_role(auth.uid());
    
    -- Super Admins and Admins can manage all
    IF user_role IN ('SA', 'A') THEN
        RETURN TRUE;
    END IF;
    
    -- Get user's accessible branches
    SELECT array_agg(branch_id) INTO accessible_branches
    FROM public.get_user_accessible_branch_ids(auth.uid());
    
    -- Check if requested branch is in accessible branches
    RETURN p_branch_id = ANY(accessible_branches);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teachers accessible by user
CREATE OR REPLACE FUNCTION get_accessible_teacher_ids()
RETURNS SETOF UUID AS $$
BEGIN
    -- Super Admins and Admins can access all teachers
    IF public.get_user_role(auth.uid()) IN ('SA', 'A') THEN
        RETURN QUERY SELECT DISTINCT teacher_id FROM branch_teacher;
    
    -- Coaches can access teachers in their branches
    ELSIF public.get_user_role(auth.uid()) = 'C' THEN
        RETURN QUERY 
        SELECT DISTINCT bt.teacher_id
        FROM branch_teacher bt
        WHERE bt.branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        );
    
    -- Branch Managers can access teachers in their branches
    ELSE
        RETURN QUERY 
        SELECT DISTINCT bt.teacher_id
        FROM branch_teacher bt
        WHERE bt.branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION TO GET TEACHER ASSIGNMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION get_teacher_assignments(teacher_uuid uuid)
RETURNS TABLE (
  coaching_center_id uuid,
  coaching_name text,
  coaching_logo text,
  coaching_description text,
  branch_id uuid,
  branch_name text,
  assignment_id uuid,
  assignment_date date,
  assignment_end_date date,
  is_active boolean,
  teaching_subjects text[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id as coaching_center_id,
    cc.name as coaching_name,
    cc.logo_url as coaching_logo,
    cc.description as coaching_description,
    cb.id as branch_id,
    cb.name as branch_name,
    bt.id as assignment_id,
    bt.assignment_date,
    bt.assignment_end_date,
    bt.is_active,
    bt.teaching_subjects
  FROM branch_teacher bt
  INNER JOIN coaching_branches cb ON bt.branch_id = cb.id
  INNER JOIN coaching_centers cc ON cb.coaching_center_id = cc.id
  WHERE bt.teacher_id = teacher_uuid
    AND cb.is_active = true
    AND cc.status = 'ACTIVE'
  ORDER BY bt.assignment_date DESC;
END;
$$;


-- ============================================================
-- VIEW FOR TEACHER ASSIGNMENT AUDITING
-- ============================================================

-- CREATE OR REPLACE VIEW branch_teacher_audit AS
-- SELECT 
--     bt.*,
--     cb.branch_name,
--     cb.branch_code,
--     p.full_name as current_teacher_name,
--     p.email as current_teacher_email,
--     -- Calculate tenure in days
--     CASE 
--         WHEN bt.assignment_end_date IS NULL THEN 
--             CURRENT_DATE - bt.assignment_date
--         ELSE 
--             bt.assignment_end_date - bt.assignment_date
--     END as tenure_days
-- FROM branch_teacher bt
-- LEFT JOIN coaching_branches cb ON bt.branch_id = cb.id
-- LEFT JOIN profiles p ON bt.teacher_id = p.id
-- WHERE bt.is_active = TRUE;

-- -- Secure the audit view
-- ALTER VIEW branch_teacher_audit SET (security_invoker = true);

-- -- Grant permissions
-- GRANT SELECT ON branch_teacher_audit TO authenticated;

-- ============================================================
-- COMMENTS FOR RLS
-- ============================================================

COMMENT ON POLICY super_admins_full_access ON branch_teacher IS 'Super Admins and Admins have full CRUD access to all branch teacher assignments';
COMMENT ON POLICY coaches_select_branch_teacher ON branch_teacher IS 'Coaches can view teacher assignments in branches they manage';
COMMENT ON POLICY managers_select_branch_teacher ON branch_teacher IS 'Branch Managers can view teacher assignments in their branches';
COMMENT ON POLICY teachers_select_own_assignments ON branch_teacher IS 'Teachers can view their own branch assignments';
COMMENT ON POLICY students_view_branch_teachers ON branch_teacher IS 'Students can view active teachers in branches where they are enrolled';
