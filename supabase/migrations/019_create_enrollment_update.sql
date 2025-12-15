-- ============================================
-- SIMPLIFIED MIGRATION: Only Structure Changes
-- NO RLS modifications needed
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Create class_enrollments Table
-- ============================================

CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Relationships
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES branch_classes(id) ON DELETE CASCADE,
  
  -- Link to branch_students (optional, for tracking)
  branch_student_id UUID REFERENCES branch_students(id) ON DELETE CASCADE,
  
  -- Enrollment Details
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  enrollment_status enrollment_status DEFAULT 'ENROLLED',
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Academic Tracking (per class)
  attendance_percentage DECIMAL(5,2) DEFAULT 0.0,
  current_grade TEXT,
  performance_notes TEXT,
  
  -- Class-specific preferences
  preferred_batch TEXT,
  special_requirements TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_attendance CHECK (attendance_percentage >= 0.0 AND attendance_percentage <= 100.0),
  
  -- Student cannot enroll in same class twice
  CONSTRAINT class_enrollments_student_class_unique UNIQUE(student_id, class_id)
);

-- Indexes for performance
CREATE INDEX idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_branch_id ON class_enrollments(branch_id);
CREATE INDEX idx_class_enrollments_branch_student_id ON class_enrollments(branch_student_id);
CREATE INDEX idx_class_enrollments_status ON class_enrollments(enrollment_status);
CREATE INDEX idx_class_enrollments_student_branch ON class_enrollments(student_id, branch_id);
CREATE INDEX idx_class_enrollments_enrollment_date ON class_enrollments(enrollment_date);

COMMENT ON TABLE class_enrollments IS 'Junction table tracking which classes students are enrolled in. One student can enroll in multiple classes.';

-- ============================================
-- STEP 2: Migrate Data from branch_students to class_enrollments
-- ============================================

INSERT INTO class_enrollments (
  student_id,
  branch_id,
  class_id,
  branch_student_id,
  enrollment_date,
  enrollment_status,
  expected_completion_date,
  actual_completion_date,
  attendance_percentage,
  current_grade,
  performance_notes,
  preferred_batch,
  special_requirements,
  metadata,
  created_at,
  updated_at
)
SELECT 
  bs.student_id,
  bs.branch_id,
  bs.class_id,
  bs.id as branch_student_id,
  COALESCE(bs.enrollment_date, bs.created_at::date) as enrollment_date,
  COALESCE(bs.enrollment_status, 'ENROLLED') as enrollment_status,
  bs.expected_completion_date,
  bs.actual_completion_date,
  COALESCE(bs.attendance_percentage, 0.0) as attendance_percentage,
  bs.current_grade,
  bs.performance_notes,
  bs.preferred_batch,
  bs.special_requirements,
  bs.metadata,
  bs.created_at,
  bs.updated_at
FROM branch_students bs
WHERE bs.class_id IS NOT NULL
ON CONFLICT (student_id, class_id) DO NOTHING;

-- ============================================
-- STEP 3: Update fee_receipts Foreign Key
-- ============================================

-- Add temporary column
ALTER TABLE fee_receipts 
ADD COLUMN IF NOT EXISTS new_enrollment_id UUID;

-- Map old enrollment_id to new class_enrollments.id
UPDATE fee_receipts fr
SET new_enrollment_id = ce.id
FROM class_enrollments ce
WHERE fr.enrollment_id = ce.branch_student_id
AND fr.student_id = ce.student_id 
AND fr.class_id = ce.class_id;

-- Drop old foreign key constraint
ALTER TABLE fee_receipts 
DROP CONSTRAINT IF EXISTS fee_receipts_enrollment_id_fkey;

-- Drop old enrollment_id column
ALTER TABLE fee_receipts 
DROP COLUMN enrollment_id;

-- Rename new column
ALTER TABLE fee_receipts 
RENAME COLUMN new_enrollment_id TO enrollment_id;

-- Add new foreign key pointing to class_enrollments
ALTER TABLE fee_receipts
ADD CONSTRAINT fee_receipts_enrollment_id_fkey 
FOREIGN KEY (enrollment_id) 
REFERENCES class_enrollments(id) 
ON DELETE CASCADE;

-- Make enrollment_id NOT NULL
ALTER TABLE fee_receipts 
ALTER COLUMN enrollment_id SET NOT NULL;

-- ============================================
-- STEP 4: Drop Dependencies that Reference class_id
-- ============================================

-- Drop the old view
DROP VIEW IF EXISTS student_enrollment_details CASCADE;

-- Drop trigger that depends on class_id
DROP TRIGGER IF EXISTS update_class_enrollment_on_student_change ON branch_students;

-- Drop the RLS policies that reference class_id
DROP POLICY IF EXISTS "teachers_select_class_students" ON branch_students;
DROP POLICY IF EXISTS "students_insert_self_enrollment" ON branch_students;
DROP POLICY IF EXISTS "teachers_update_class_students_limited" ON branch_students;

-- ============================================
-- STEP 5: Modify branch_students Table
-- ============================================

-- Remove unique constraint
ALTER TABLE branch_students 
DROP CONSTRAINT IF EXISTS branch_students_student_id_branch_id_key;

-- Drop columns with CASCADE
ALTER TABLE branch_students 
DROP COLUMN IF EXISTS class_id CASCADE,
DROP COLUMN IF EXISTS enrollment_date CASCADE,
DROP COLUMN IF EXISTS enrollment_status CASCADE,
DROP COLUMN IF EXISTS expected_completion_date CASCADE,
DROP COLUMN IF EXISTS actual_completion_date CASCADE,
DROP COLUMN IF EXISTS attendance_percentage CASCADE,
DROP COLUMN IF EXISTS current_grade CASCADE,
DROP COLUMN IF EXISTS performance_notes CASCADE,
DROP COLUMN IF EXISTS preferred_batch CASCADE,
DROP COLUMN IF EXISTS special_requirements CASCADE;

-- Add registration_date if not exists
ALTER TABLE branch_students 
ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;

COMMENT ON TABLE branch_students IS 'Student profile information per branch. No uniqueness constraint - can have multiple records if needed.';

-- ============================================
-- STEP 6: Recreate RLS Policies (Only the ones we dropped)
-- ============================================

-- Teachers can view students in branches they have access to (simplified, no class_id)
CREATE POLICY "teachers_select_branch_students"
    ON branch_students FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND branch_id IN (
            SELECT DISTINCT bc.branch_id 
            FROM branch_classes bc
            WHERE bc.teacher_id = auth.uid()
        )
    );

-- Students: Can enroll themselves (simplified)
CREATE POLICY "students_insert_self_enrollment"
    ON branch_students FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
    );

-- Teachers: Can update students in their accessible branches
CREATE POLICY "teachers_update_branch_students"
    ON branch_students FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND branch_id IN (
            SELECT DISTINCT bc.branch_id 
            FROM branch_classes bc
            WHERE bc.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND branch_id IN (
            SELECT DISTINCT bc.branch_id 
            FROM branch_classes bc
            WHERE bc.teacher_id = auth.uid()
        )
    );

-- ============================================
-- STEP 7: Add Triggers for class_enrollments
-- ============================================

-- Updated_at trigger
CREATE TRIGGER update_class_enrollments_updated_at
    BEFORE UPDATE ON class_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_system_updated_at();

-- Update class enrollment count
CREATE OR REPLACE FUNCTION update_class_enrollment_count_v2()
RETURNS TRIGGER AS $$
DECLARE
    old_class_id UUID;
    new_class_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_class_id := NEW.class_id;
    ELSIF TG_OP = 'DELETE' THEN
        old_class_id := OLD.class_id;
    ELSIF TG_OP = 'UPDATE' THEN
        old_class_id := OLD.class_id;
        new_class_id := NEW.class_id;
    END IF;
    
    -- Update old class enrollment count
    IF old_class_id IS NOT NULL THEN
        UPDATE branch_classes 
        SET current_enrollment = (
            SELECT COUNT(*)
            FROM class_enrollments 
            WHERE class_id = old_class_id 
            AND enrollment_status = 'ENROLLED'
        ),
        updated_at = NOW()
        WHERE id = old_class_id;
    END IF;
    
    -- Update new class enrollment count
    IF new_class_id IS NOT NULL THEN
        UPDATE branch_classes 
        SET current_enrollment = (
            SELECT COUNT(*)
            FROM class_enrollments 
            WHERE class_id = new_class_id 
            AND enrollment_status = 'ENROLLED'
        ),
        updated_at = NOW()
        WHERE id = new_class_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_class_enrollment_on_enrollment_change
    AFTER INSERT OR UPDATE OF class_id, enrollment_status OR DELETE ON class_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_class_enrollment_count_v2();

-- ============================================
-- STEP 8: Enable RLS on class_enrollments
-- ============================================

ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Admins: Full access
CREATE POLICY "admins_full_access_enrollments"
ON class_enrollments FOR ALL
USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- Coaches: Full access
CREATE POLICY "coaches_manage_all_enrollments"
ON class_enrollments FOR ALL
USING (
    public.get_user_role(auth.uid()) = 'C'
    AND branch_id IN (
        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
    )
)
WITH CHECK (
    public.get_user_role(auth.uid()) = 'C'
    AND branch_id IN (
        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
    )
);

-- Branch Managers: Full access to enrollments in their branch
CREATE POLICY "managers_manage_enrollments"
ON class_enrollments FOR ALL
USING (
    branch_id IN (
        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
    )
)
WITH CHECK (
    branch_id IN (
        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
    )
);

-- Teachers: Read enrollments in their classes
CREATE POLICY "teachers_read_class_enrollments"
ON class_enrollments FOR SELECT
USING (
    public.get_user_role(auth.uid()) = 'T' 
    AND class_id IN (
        SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
    )
);

-- Teachers: Update academic fields
CREATE POLICY "teachers_update_class_enrollments"
ON class_enrollments FOR UPDATE
USING (
    public.get_user_role(auth.uid()) = 'T' 
    AND class_id IN (
        SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
    )
)
WITH CHECK (
    public.get_user_role(auth.uid()) = 'T' 
    AND class_id IN (
        SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
    )
);

-- Students: Read own enrollments
CREATE POLICY "students_read_own_enrollments"
ON class_enrollments FOR SELECT
USING (
    public.get_user_role(auth.uid()) = 'S'
    AND student_id = auth.uid()
);

-- ============================================
-- STEP 9: Recreate student_enrollment_details View
-- ============================================

CREATE OR REPLACE VIEW student_enrollment_details AS
SELECT 
    -- Enrollment identifiers
    ce.id as enrollment_id,
    ce.student_id,
    ce.branch_id,
    ce.class_id,
    
    -- Student basic info (from profiles table)
    p.full_name as student_name,
    p.email as student_email,
    p.phone as student_phone,
    p.username as student_username,
    p.avatar_url,
    p.date_of_birth,
    p.gender,
    
    -- Student profile from branch_students
    bs.student_name as branch_student_name,
    bs.student_email as branch_student_email,
    bs.student_phone as branch_student_phone,
    
    -- Student Address Information
    sa.id as student_address_id,
    sa.address_type as student_address_type,
    sa.label as student_address_label,
    sa.address_line_1 as student_address_line_1,
    sa.address_line_2 as student_address_line_2,
    sa.city as student_city,
    sa.district as student_district,
    sa.sub_district as student_sub_district,
    sa.village_town as student_village_town,
    sa.state as student_state,
    sa.pin_code as student_pin_code,
    sa.country as student_country,
    sa.postal_address as student_postal_address,
    sa.latitude as student_latitude,
    sa.longitude as student_longitude,
    sa.google_maps_url as student_google_maps_url,
    sa.is_primary as student_address_is_primary,
    
    -- Branch details
    cb.name as branch_name,
    cb.phone as branch_phone,
    cb.email as branch_email,
    cb.is_main_branch,
    cb.description as branch_description,
    
    -- Branch Address Information
    ba.id as branch_address_id,
    ba.address_type as branch_address_type,
    ba.label as branch_address_label,
    ba.address_line_1 as branch_address_line_1,
    ba.address_line_2 as branch_address_line_2,
    ba.city as branch_city,
    ba.district as branch_district,
    ba.sub_district as branch_sub_district,
    ba.village_town as branch_village_town,
    ba.state as branch_state,
    ba.pin_code as branch_pin_code,
    ba.country as branch_country,
    ba.postal_address as branch_postal_address,
    ba.latitude as branch_latitude,
    ba.longitude as branch_longitude,
    ba.google_maps_url as branch_google_maps_url,
    ba.delivery_instructions as branch_delivery_instructions,
    
    -- Branch Manager Details
    bm.full_name as branch_manager_name,
    bm.email as branch_manager_email,
    bm.phone as branch_manager_phone,
    
    -- Class details
    bc.class_name,
    bc.subject,
    bc.grade_level,
    bc.batch_name,
    bc.start_date as class_start_date,
    bc.end_date as class_end_date,
    bc.start_time as class_start_time,
    bc.end_time as class_end_time,
    bc.class_days,
    bc.max_students as class_max_students,
    bc.current_enrollment as class_current_enrollment,
    bc.fees_amount as class_fees_amount,
    bc.fees_frequency as class_fees_frequency,
    bc.status as class_status,
    bc.prerequisites as class_prerequisites,
    bc.materials_required as class_materials_required,
    
    -- Teacher details
    bc.teacher_id,
    tp.full_name as teacher_name,
    tp.email as teacher_email,
    tp.phone as teacher_phone,
    tp.avatar_url as teacher_avatar_url,
    
    -- Enrollment dates
    ce.enrollment_date,
    ce.expected_completion_date,
    ce.actual_completion_date,
    
    -- Status tracking
    ce.enrollment_status,
    
    -- Academic tracking
    ce.attendance_percentage,
    ce.current_grade,
    ce.performance_notes,
    
    -- Financial tracking (from branch_students if exists)
    bs.total_fees_due,
    bs.total_fees_paid,
    bs.last_payment_date,
    bs.next_payment_due,
    bs.payment_status,
    CASE 
        WHEN bs.total_fees_due > 0 THEN 
            (bs.total_fees_due - bs.total_fees_paid)
        ELSE 0 
    END as outstanding_balance,
    CASE 
        WHEN bs.total_fees_due > 0 THEN 
            ROUND((bs.total_fees_paid / bs.total_fees_due) * 100, 2)
        ELSE 0 
    END as payment_completion_percentage,
    
    -- Emergency and parent/guardian contact
    bs.emergency_contact_name,
    bs.emergency_contact_phone,
    bs.parent_guardian_name,
    bs.parent_guardian_phone,
    
    -- Student preferences and notes
    ce.preferred_batch,
    ce.special_requirements,
    bs.student_notes,
    
    -- Payment insights
    CASE 
        WHEN bs.next_payment_due IS NOT NULL AND bs.next_payment_due < CURRENT_DATE 
        THEN TRUE 
        ELSE FALSE 
    END as is_payment_overdue,
    CASE 
        WHEN bs.next_payment_due IS NOT NULL 
        THEN (bs.next_payment_due - CURRENT_DATE) 
        ELSE NULL 
    END as days_until_payment_due,
    
    -- Enrollment duration
    (CURRENT_DATE - ce.enrollment_date) as days_enrolled,
    CASE 
        WHEN ce.expected_completion_date IS NOT NULL 
        THEN (ce.expected_completion_date - CURRENT_DATE) 
        ELSE NULL 
    END as days_until_completion,
    
    -- Aggregate statistics
    (
        SELECT COUNT(*)
        FROM student_attendance sa2
        WHERE sa2.student_id = ce.student_id 
        AND sa2.class_id = ce.class_id
        AND sa2.attendance_status = 'PRESENT'
    ) as total_days_present,
    (
        SELECT COUNT(*)
        FROM student_attendance sa2
        WHERE sa2.student_id = ce.student_id 
        AND sa2.class_id = ce.class_id
        AND sa2.attendance_status = 'ABSENT'
    ) as total_days_absent,
    (
        SELECT COUNT(*)
        FROM fee_receipts fr
        WHERE fr.enrollment_id = ce.id
        AND fr.receipt_status = 'PAID'
    ) as total_receipts_paid,
    (
        SELECT COUNT(*)
        FROM fee_receipts fr
        WHERE fr.enrollment_id = ce.id
        AND fr.receipt_status = 'PENDING'
    ) as total_receipts_pending,
    (
        SELECT SUM(fr.amount_paid)
        FROM fee_receipts fr
        WHERE fr.enrollment_id = ce.id
    ) as total_amount_paid_via_receipts,
    
    -- Metadata
    ce.metadata,
    ce.created_at,
    ce.updated_at

FROM 
    class_enrollments ce
    LEFT JOIN profiles p ON p.id = ce.student_id
    LEFT JOIN branch_students bs ON bs.id = ce.branch_student_id
    LEFT JOIN LATERAL (
        SELECT *
        FROM addresses
        WHERE user_id = ce.student_id
        AND is_active = true
        ORDER BY is_primary DESC, created_at DESC
        LIMIT 1
    ) sa ON true
    LEFT JOIN coaching_branches cb ON cb.id = ce.branch_id
    LEFT JOIN profiles bm ON bm.id = cb.manager_id
    LEFT JOIN LATERAL (
        SELECT *
        FROM addresses
        WHERE branch_id = ce.branch_id
        AND is_active = true
        ORDER BY is_primary DESC, created_at DESC
        LIMIT 1
    ) ba ON true
    LEFT JOIN branch_classes bc ON bc.id = ce.class_id
    LEFT JOIN profiles tp ON tp.id = bc.teacher_id;

GRANT SELECT ON student_enrollment_details TO authenticated;
COMMENT ON VIEW student_enrollment_details IS 'Comprehensive view of student enrollments using class_enrollments junction table. Updated on 2025-12-15.';

-- ============================================
-- STEP 10: Grant Permissions
-- ============================================

GRANT SELECT ON class_enrollments TO authenticated;
GRANT ALL ON class_enrollments TO service_role;

-- ============================================
-- STEP 11: Verification
-- ============================================

DO $$
DECLARE
    enrollment_count INTEGER;
    receipt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enrollment_count FROM class_enrollments;
    SELECT COUNT(*) INTO receipt_count FROM fee_receipts WHERE enrollment_id IS NOT NULL;
    
    RAISE NOTICE '✓ Migration completed successfully!';
    RAISE NOTICE '✓ Total class enrollments: %', enrollment_count;
    RAISE NOTICE '✓ Total fee receipts linked: %', receipt_count;
END $$;

COMMIT;
