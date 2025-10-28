-- ============================================================
-- BRANCH STUDENT SYSTEM - MVP VERSION
-- Migration 016: Create branch_classes and branch_students tables
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Class status for managing class availability
CREATE TYPE class_status AS ENUM (
  'ACTIVE',    -- Class is currently active and accepting students
  'INACTIVE',  -- Class is temporarily inactive
  'FULL',      -- Class has reached maximum capacity
  'COMPLETED'  -- Class has been completed
);

-- Student enrollment status
CREATE TYPE enrollment_status AS ENUM (
  'ENROLLED',   -- Student is actively enrolled
  'PENDING',    -- Enrollment is pending approval
  'SUSPENDED',  -- Student is temporarily suspended
  'DROPPED',    -- Student has dropped from the class
  'COMPLETED'   -- Student has completed the class
);

-- Payment status for tracking fees
CREATE TYPE payment_status AS ENUM (
  'PAID',       -- Fees are fully paid
  'PARTIAL',    -- Partial payment made
  'PENDING',    -- Payment is pending
  'OVERDUE'     -- Payment is overdue
);

-- Payment method for fee receipts
CREATE TYPE payment_method AS ENUM (
  'MANUAL',     -- Manual/Cash payment
  'UPI',        -- UPI payment
  'CARD',       -- Credit/Debit card
  'BANK_TRANSFER', -- Bank transfer
  'CHEQUE',     -- Cheque payment
  'OTHER'       -- Other payment methods
);

-- Fee receipt status
CREATE TYPE receipt_status AS ENUM (
  'PENDING',    -- Receipt generated but payment pending
  'PAID',       -- Payment completed
  'CANCELLED',  -- Receipt cancelled
  'REFUNDED'    -- Payment refunded
);

-- Attendance status
CREATE TYPE attendance_status AS ENUM (
  'PRESENT',    -- Student was present
  'ABSENT',     -- Student was absent
  'LATE',       -- Student came late
  'EXCUSED',    -- Excused absence
  'HOLIDAY'     -- Holiday/No class
);

-- ============================================================
-- BRANCH CLASSES TABLE (READ-ONLY FOR STUDENTS)
-- ============================================================

CREATE TABLE branch_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Branch relationship
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  
  -- Class details
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  
  -- Class specifications
  grade_level TEXT NOT NULL, -- e.g., "10th", "12th", "Graduate"
  batch_name TEXT, -- e.g., "Morning Batch", "Evening Batch"
  
  -- Scheduling
  start_date DATE,
  end_date DATE,
  class_days TEXT[], -- e.g., ['Monday', 'Wednesday', 'Friday']
  start_time TIME,
  end_time TIME,
  
  -- Capacity and pricing
  max_students INTEGER DEFAULT 30,
  current_enrollment INTEGER DEFAULT 0,
  fees_amount DECIMAL(10,2),
  fees_frequency TEXT DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, YEARLY
  
  -- Teacher assignment
  teacher_id UUID REFERENCES auth.users(id),
  
  -- Status and visibility
  status class_status DEFAULT 'ACTIVE',
  is_visible BOOLEAN DEFAULT TRUE,
  
  -- Requirements
  prerequisites TEXT[],
  materials_required TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
  CONSTRAINT valid_capacity CHECK (max_students > 0),
  CONSTRAINT valid_current_enrollment CHECK (current_enrollment >= 0 AND current_enrollment <= max_students)
);

-- ============================================================
-- BRANCH STUDENTS TABLE (READ/WRITE OWN DATA ONLY)
-- ============================================================

CREATE TABLE branch_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES branch_classes(id) ON DELETE SET NULL,
  
  -- Enrollment details
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Status tracking
  enrollment_status enrollment_status DEFAULT 'ENROLLED',
  payment_status payment_status DEFAULT 'PENDING',
  
  -- Academic tracking
  attendance_percentage DECIMAL(5,2) DEFAULT 0.0,
  current_grade TEXT,
  performance_notes TEXT,
  
  -- Financial tracking
  total_fees_due DECIMAL(10,2) DEFAULT 0.0,
  total_fees_paid DECIMAL(10,2) DEFAULT 0.0,
  last_payment_date DATE,
  next_payment_due DATE,
  
  -- Contact and emergency info (student-specific)
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  parent_guardian_name TEXT,
  parent_guardian_phone TEXT,
  
  -- Student preferences and notes
  preferred_batch TEXT,
  special_requirements TEXT,
  student_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_attendance CHECK (attendance_percentage >= 0.0 AND attendance_percentage <= 100.0),
  CONSTRAINT valid_fees CHECK (total_fees_paid >= 0.0 AND total_fees_due >= 0.0),
  CONSTRAINT valid_phone_emergency CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~ '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT valid_phone_parent CHECK (parent_guardian_phone IS NULL OR parent_guardian_phone ~ '^\+?[1-9]\d{1,14}$'),
  
  -- Unique constraint: one enrollment per student per branch
  UNIQUE(student_id, branch_id)
);

-- ============================================================
-- FEE RECEIPTS TABLE (MANAGED BY BRANCH MANAGERS ONLY)
-- ============================================================

CREATE TABLE fee_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES branch_classes(id) ON DELETE SET NULL,
  enrollment_id UUID NOT NULL REFERENCES branch_students(id) ON DELETE CASCADE,
  
  -- Receipt details
  receipt_number TEXT UNIQUE NOT NULL, -- Auto-generated unique receipt number
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Fee breakdown
  base_fee_amount DECIMAL(10,2) NOT NULL,
  late_fee_amount DECIMAL(10,2) DEFAULT 0.0,
  discount_amount DECIMAL(10,2) DEFAULT 0.0,
  tax_amount DECIMAL(10,2) DEFAULT 0.0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment tracking
  amount_paid DECIMAL(10,2) DEFAULT 0.0,
  balance_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method,
  payment_reference TEXT, -- UPI transaction ID, card reference, etc.
  payment_date DATE,
  
  -- Status and management
  receipt_status receipt_status DEFAULT 'PENDING',
  is_auto_generated BOOLEAN DEFAULT TRUE,
  
  -- Fee period
  fee_month INTEGER CHECK (fee_month >= 1 AND fee_month <= 12),
  fee_year INTEGER CHECK (fee_year >= 1000),
  fee_period_start DATE,
  fee_period_end DATE,
  
  -- Branch manager who processed
  processed_by UUID REFERENCES auth.users(id), -- Branch manager/admin who processed
  
  -- Receipt notes and details
  description TEXT,
  internal_notes TEXT, -- For branch management use
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (
    base_fee_amount >= 0 AND 
    late_fee_amount >= 0 AND 
    discount_amount >= 0 AND 
    tax_amount >= 0 AND
    total_amount >= 0 AND
    amount_paid >= 0 AND
    balance_amount >= 0
  ),
  CONSTRAINT valid_balance CHECK (balance_amount = total_amount - amount_paid),
  CONSTRAINT valid_payment_date CHECK (
    payment_date IS NULL OR 
    (payment_date >= receipt_date AND receipt_status IN ('PAID', 'REFUNDED'))
  )
);

-- ============================================================
-- STUDENT ATTENDANCE TABLE (MANAGED BY TEACHERS ONLY)
-- ============================================================

CREATE TABLE student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES branch_classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  
  -- Attendance details
  attendance_date DATE NOT NULL,
  attendance_status attendance_status DEFAULT 'PRESENT',
  
  -- Time tracking
  check_in_time TIME,
  check_out_time TIME,
  total_duration INTERVAL, -- Calculated duration
  
  -- Additional info
  late_by_minutes INTEGER DEFAULT 0,
  early_leave_minutes INTEGER DEFAULT 0,
  
  -- Notes and remarks
  teacher_remarks TEXT,
  excuse_reason TEXT, -- For excused absences
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (
    check_in_time IS NULL OR check_out_time IS NULL OR check_in_time <= check_out_time
  ),
  CONSTRAINT valid_late_minutes CHECK (late_by_minutes >= 0),
  CONSTRAINT valid_early_leave CHECK (early_leave_minutes >= 0),
  
  -- Unique constraint: one attendance record per student per class per date
  UNIQUE(student_id, class_id, attendance_date)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Branch Classes Indexes
CREATE INDEX IF NOT EXISTS idx_branch_classes_branch_id ON branch_classes(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_classes_teacher_id ON branch_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_branch_classes_status ON branch_classes(status);
CREATE INDEX IF NOT EXISTS idx_branch_classes_subject ON branch_classes(subject);
CREATE INDEX IF NOT EXISTS idx_branch_classes_grade_level ON branch_classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_branch_classes_start_date ON branch_classes(start_date);
CREATE INDEX IF NOT EXISTS idx_branch_classes_is_visible ON branch_classes(is_visible);
CREATE INDEX IF NOT EXISTS idx_branch_classes_current_enrollment ON branch_classes(current_enrollment);

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_branch_classes_class_days ON branch_classes USING GIN(class_days);
CREATE INDEX IF NOT EXISTS idx_branch_classes_prerequisites ON branch_classes USING GIN(prerequisites);

-- Branch Students Indexes
CREATE INDEX IF NOT EXISTS idx_branch_students_student_id ON branch_students(student_id);
CREATE INDEX IF NOT EXISTS idx_branch_students_branch_id ON branch_students(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_students_class_id ON branch_students(class_id);
CREATE INDEX IF NOT EXISTS idx_branch_students_enrollment_status ON branch_students(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_branch_students_payment_status ON branch_students(payment_status);
CREATE INDEX IF NOT EXISTS idx_branch_students_enrollment_date ON branch_students(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_branch_students_next_payment_due ON branch_students(next_payment_due);

-- Fee Receipts Indexes
CREATE INDEX IF NOT EXISTS idx_fee_receipts_student_id ON fee_receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_branch_id ON fee_receipts(branch_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_class_id ON fee_receipts(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_enrollment_id ON fee_receipts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_receipt_number ON fee_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_receipt_date ON fee_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_due_date ON fee_receipts(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_status ON fee_receipts(receipt_status);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_payment_method ON fee_receipts(payment_method);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_processed_by ON fee_receipts(processed_by);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_fee_period ON fee_receipts(fee_year, fee_month);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_is_auto_generated ON fee_receipts(is_auto_generated);

-- Student Attendance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON student_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON student_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_id ON student_attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON student_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON student_attendance(attendance_status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON student_attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_class ON student_attendance(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON student_attendance(teacher_id, attendance_date);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_branch_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update class enrollment count when student enrollment changes
CREATE OR REPLACE FUNCTION update_class_enrollment_count()
RETURNS TRIGGER AS $$
DECLARE
    old_class_id UUID;
    new_class_id UUID;
BEGIN
    -- Handle different trigger operations
    IF TG_OP = 'INSERT' THEN
        new_class_id := NEW.class_id;
    ELSIF TG_OP = 'DELETE' THEN
        old_class_id := OLD.class_id;
    ELSIF TG_OP = 'UPDATE' THEN
        old_class_id := OLD.class_id;
        new_class_id := NEW.class_id;
    END IF;
    
    -- Update old class enrollment count (for UPDATE and DELETE)
    IF old_class_id IS NOT NULL THEN
        UPDATE branch_classes 
        SET current_enrollment = (
            SELECT COUNT(*)
            FROM branch_students 
            WHERE class_id = old_class_id 
            AND enrollment_status = 'ENROLLED'
        ),
        updated_at = NOW()
        WHERE id = old_class_id;
    END IF;
    
    -- Update new class enrollment count (for INSERT and UPDATE)
    IF new_class_id IS NOT NULL THEN
        UPDATE branch_classes 
        SET current_enrollment = (
            SELECT COUNT(*)
            FROM branch_students 
            WHERE class_id = new_class_id 
            AND enrollment_status = 'ENROLLED'
        ),
        updated_at = NOW()
        WHERE id = new_class_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Validate student role before enrollment
CREATE OR REPLACE FUNCTION validate_student_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user has student role
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.student_id 
        AND role = 'S'
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Only active students can be enrolled in branches';
    END IF;
    
    -- Check if teacher exists and has appropriate role
    IF NEW.class_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM branch_classes bc
            JOIN profiles p ON p.id = bc.teacher_id
            WHERE bc.id = NEW.class_id 
            AND p.role IN ('T', 'C', 'A', 'SA')
            AND p.is_active = TRUE
        ) THEN
            RAISE EXCEPTION 'Class must have a valid active teacher assigned';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate unique receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    branch_code TEXT;
    receipt_count INTEGER;
    year_short TEXT;
    month_str TEXT;
BEGIN
    -- Get branch info for receipt number generation
    SELECT COALESCE(cb.name, 'BR') INTO branch_code
    FROM coaching_branches cb 
    WHERE cb.id = NEW.branch_id;
    
    -- Get short branch code (first 3 characters, uppercase)
    branch_code := UPPER(LEFT(regexp_replace(branch_code, '[^A-Za-z0-9]', '', 'g'), 3));
    
    -- Get current year (last 2 digits) and month
    year_short := RIGHT(EXTRACT(YEAR FROM NEW.receipt_date)::TEXT, 2);
    month_str := LPAD(EXTRACT(MONTH FROM NEW.receipt_date)::TEXT, 2, '0');
    
    -- Get count of receipts for this branch in current month
    SELECT COUNT(*) + 1 INTO receipt_count
    FROM fee_receipts
    WHERE branch_id = NEW.branch_id
    AND EXTRACT(YEAR FROM receipt_date) = EXTRACT(YEAR FROM NEW.receipt_date)
    AND EXTRACT(MONTH FROM receipt_date) = EXTRACT(MONTH FROM NEW.receipt_date);
    
    -- Generate receipt number: BRANCH-YY-MM-NNNN
    NEW.receipt_number := branch_code || '-' || year_short || '-' || month_str || '-' || LPAD(receipt_count::TEXT, 4, '0');
    
    -- Calculate balance amount
    NEW.balance_amount := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update balance amount when payment is made
CREATE OR REPLACE FUNCTION update_receipt_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate balance
    NEW.balance_amount := NEW.total_amount - COALESCE(NEW.amount_paid, 0);
    
    -- Update status based on payment
    IF NEW.balance_amount <= 0 THEN
        NEW.receipt_status := 'PAID';
        IF NEW.payment_date IS NULL THEN
            NEW.payment_date := CURRENT_DATE;
        END IF;
    ELSIF NEW.amount_paid > 0 THEN
        NEW.receipt_status := 'PENDING'; -- Partial payment
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate teacher role for attendance
CREATE OR REPLACE FUNCTION validate_teacher_attendance()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the teacher has appropriate role
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.teacher_id 
        AND role IN ('T', 'C', 'A', 'SA')
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Only active teachers, coaches, or admins can manage attendance';
    END IF;
    
    -- Verify teacher is assigned to the class or has admin privileges
    IF NOT EXISTS (
        SELECT 1 FROM branch_classes bc
        WHERE bc.id = NEW.class_id 
        AND (bc.teacher_id = NEW.teacher_id OR EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = NEW.teacher_id 
            AND p.role IN ('C', 'A', 'SA')
        ))
    ) THEN
        RAISE EXCEPTION 'Teacher must be assigned to this class or have admin privileges';
    END IF;
    
    -- Verify student is enrolled in the class
    IF NOT EXISTS (
        SELECT 1 FROM branch_students bs
        WHERE bs.student_id = NEW.student_id 
        AND bs.class_id = NEW.class_id
        AND bs.enrollment_status = 'ENROLLED'
    ) THEN
        RAISE EXCEPTION 'Student must be enrolled in this class';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate attendance duration
CREATE OR REPLACE FUNCTION calculate_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total duration if both times are provided
    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
        NEW.total_duration := NEW.check_out_time - NEW.check_in_time;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Updated_at triggers
CREATE TRIGGER update_branch_classes_updated_at
    BEFORE UPDATE ON branch_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_system_updated_at();

CREATE TRIGGER update_branch_students_updated_at
    BEFORE UPDATE ON branch_students
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_system_updated_at();

-- Enrollment count triggers
CREATE TRIGGER update_class_enrollment_on_student_change
    AFTER INSERT OR UPDATE OF class_id, enrollment_status OR DELETE ON branch_students
    FOR EACH ROW
    EXECUTE FUNCTION update_class_enrollment_count();

-- Validation triggers
CREATE TRIGGER validate_student_enrollment_trigger
    BEFORE INSERT OR UPDATE OF student_id ON branch_students
    FOR EACH ROW
    EXECUTE FUNCTION validate_student_enrollment();

-- Fee Receipts Triggers
CREATE TRIGGER update_fee_receipts_updated_at
    BEFORE UPDATE ON fee_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_system_updated_at();

CREATE TRIGGER generate_receipt_number_trigger
    BEFORE INSERT ON fee_receipts
    FOR EACH ROW
    EXECUTE FUNCTION generate_receipt_number();

CREATE TRIGGER update_receipt_balance_trigger
    BEFORE INSERT OR UPDATE OF amount_paid, total_amount ON fee_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_receipt_balance();

-- Student Attendance Triggers
CREATE TRIGGER update_student_attendance_updated_at
    BEFORE UPDATE ON student_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_system_updated_at();

CREATE TRIGGER validate_teacher_attendance_trigger
    BEFORE INSERT OR UPDATE ON student_attendance
    FOR EACH ROW
    EXECUTE FUNCTION validate_teacher_attendance();

CREATE TRIGGER calculate_attendance_duration_trigger
    BEFORE INSERT OR UPDATE OF check_in_time, check_out_time ON student_attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_attendance_duration();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE branch_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES FOR BRANCH_CLASSES
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "students_read_active_classes" ON branch_classes;
DROP POLICY IF EXISTS "teachers_read_assigned_classes" ON branch_classes;
DROP POLICY IF EXISTS "teachers_update_own_classes" ON branch_classes;
DROP POLICY IF EXISTS "coaches_manage_all_classes" ON branch_classes;
DROP POLICY IF EXISTS "admins_full_access_classes" ON branch_classes;

-- 1. Students: READ-ONLY access to active, visible classes
CREATE POLICY "students_read_active_classes"
    ON branch_classes FOR SELECT
    USING (
        status = 'ACTIVE' 
        AND is_visible = true
        AND public.get_user_role() = 'S'
    );

-- 2. Teachers: Can view their assigned classes and all active visible classes
CREATE POLICY "teachers_read_assigned_classes"
    ON branch_classes FOR SELECT
    USING (
        public.get_user_role() = 'T' AND (
            teacher_id = auth.uid()
            OR (status = 'ACTIVE' AND is_visible = true)
        )
    );

-- 3. Teachers: Can only update their own assigned classes (limited fields)
CREATE POLICY "teachers_update_own_classes"
    ON branch_classes FOR UPDATE
    USING (
        teacher_id = auth.uid() 
        AND public.get_user_role() = 'T'
    )
    WITH CHECK (
        teacher_id = auth.uid() 
        AND public.get_user_role() = 'T'
    );

-- 4. Coaches: Full access to all classes in their coaching center
CREATE POLICY "coaches_manage_all_classes"
    ON branch_classes FOR ALL
    USING (
        public.get_user_role() = 'C'
    );

-- 5. Branch Managers: Can manage classes in their branch
CREATE POLICY "branch_managers_manage_classes"
    ON branch_classes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = branch_classes.branch_id
            AND cb.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = branch_classes.branch_id
            AND cb.manager_id = auth.uid()
        )
    );

-- 6. Admins: Full access to all classes
CREATE POLICY "admins_full_access_classes"
    ON branch_classes FOR ALL
    USING (public.get_user_role() IN ('A', 'SA'))
    WITH CHECK (public.get_user_role() IN ('A', 'SA'));

-- ============================================================
-- RLS POLICIES FOR BRANCH_STUDENTS
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "students_read_own_enrollment" ON branch_students;
DROP POLICY IF EXISTS "students_update_own_enrollment" ON branch_students;
DROP POLICY IF EXISTS "teachers_read_class_students" ON branch_students;
DROP POLICY IF EXISTS "teachers_update_class_students" ON branch_students;
DROP POLICY IF EXISTS "branch_managers_manage_branch_students" ON branch_students;
DROP POLICY IF EXISTS "coaches_manage_all_students" ON branch_students;
DROP POLICY IF EXISTS "admins_full_access_students" ON branch_students;

-- 1. Students: Can view their own enrollment records ONLY
CREATE POLICY "students_read_own_enrollment"
    ON branch_students FOR SELECT
    USING (
        student_id = auth.uid() 
        AND public.get_user_role() = 'S'
    );

-- 2. Students: Can update only specific fields of their own enrollment
CREATE POLICY "students_update_own_enrollment"
    ON branch_students FOR UPDATE
    USING (
        student_id = auth.uid() 
        AND public.get_user_role() = 'S'
    )
    WITH CHECK (
        student_id = auth.uid() 
        AND public.get_user_role() = 'S'
        -- Students can only update contact info and preferences, not financial/academic fields
        AND enrollment_status IS NOT DISTINCT FROM enrollment_status
        AND payment_status IS NOT DISTINCT FROM payment_status
        AND attendance_percentage IS NOT DISTINCT FROM attendance_percentage
        AND total_fees_due IS NOT DISTINCT FROM total_fees_due
        AND total_fees_paid IS NOT DISTINCT FROM total_fees_paid
    );

-- 3. Teachers: Can view students enrolled in their assigned classes
CREATE POLICY "teachers_read_class_students"
    ON branch_students FOR SELECT
    USING (
        public.get_user_role() = 'T' AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = branch_students.class_id
            AND bc.teacher_id = auth.uid()
        )
    );

-- 4. Teachers: Can update academic fields (grades, performance notes) for their students
CREATE POLICY "teachers_update_class_students"
    ON branch_students FOR UPDATE
    USING (
        public.get_user_role() = 'T' AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = branch_students.class_id
            AND bc.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        public.get_user_role() = 'T' AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = branch_students.class_id
            AND bc.teacher_id = auth.uid()
        )
        -- Teachers cannot modify financial fields
        AND total_fees_due IS NOT DISTINCT FROM total_fees_due
        AND total_fees_paid IS NOT DISTINCT FROM total_fees_paid
        AND payment_status IS NOT DISTINCT FROM payment_status
    );

-- 5. Branch Managers: Can manage students in their branch only
CREATE POLICY "branch_managers_manage_branch_students"
    ON branch_students FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = branch_students.branch_id
            AND cb.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = branch_students.branch_id
            AND cb.manager_id = auth.uid()
        )
    );

-- 6. Coaches: Full access to all student enrollments
CREATE POLICY "coaches_manage_all_students"
    ON branch_students FOR ALL
    USING (public.get_user_role() = 'C')
    WITH CHECK (public.get_user_role() = 'C');

-- 7. Admins: Full access
CREATE POLICY "admins_full_access_students"
    ON branch_students FOR ALL
    USING (public.get_user_role() IN ('A', 'SA'))
    WITH CHECK (public.get_user_role() IN ('A', 'SA'));

-- ============================================================
-- RLS POLICIES FOR FEE_RECEIPTS
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "students_read_own_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "teachers_read_class_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "branch_managers_manage_branch_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "coaches_manage_all_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "admins_full_access_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "students_cannot_modify_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "students_cannot_update_receipts" ON fee_receipts;
DROP POLICY IF EXISTS "students_cannot_delete_receipts" ON fee_receipts;

-- 1. Students: READ-ONLY access to their own receipts
CREATE POLICY "students_read_own_receipts"
    ON fee_receipts FOR SELECT
    USING (
        student_id = auth.uid() 
        AND public.get_user_role() = 'S'
    );

-- 2. Teachers: Can view receipts for students in their classes (READ-ONLY)
CREATE POLICY "teachers_read_class_receipts"
    ON fee_receipts FOR SELECT
    USING (
        public.get_user_role() = 'T' AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = fee_receipts.class_id
            AND bc.teacher_id = auth.uid()
        )
    );

-- 3. Branch Managers: Full CRUD on receipts for their branch only
CREATE POLICY "branch_managers_manage_branch_receipts"
    ON fee_receipts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = fee_receipts.branch_id
            AND cb.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = fee_receipts.branch_id
            AND cb.manager_id = auth.uid()
        )
    );

-- 4. Coaches: Full access to all receipts in their coaching centers
CREATE POLICY "coaches_manage_all_receipts"
    ON fee_receipts FOR ALL
    USING (public.get_user_role() = 'C')
    WITH CHECK (public.get_user_role() = 'C');

-- 5. Admins: Full access
CREATE POLICY "admins_full_access_receipts"
    ON fee_receipts FOR ALL
    USING (public.get_user_role() IN ('A', 'SA'))
    WITH CHECK (public.get_user_role() IN ('A', 'SA'));

-- 6. Prevent students from modifying receipts (security layer)
CREATE POLICY "students_cannot_modify_receipts"
    ON fee_receipts FOR INSERT
    WITH CHECK (false);

CREATE POLICY "students_cannot_update_receipts"
    ON fee_receipts FOR UPDATE
    USING (false);

CREATE POLICY "students_cannot_delete_receipts"
    ON fee_receipts FOR DELETE
    USING (false);

-- ============================================================
-- RLS POLICIES FOR STUDENT_ATTENDANCE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "students_read_own_attendance" ON student_attendance;
DROP POLICY IF EXISTS "teachers_read_class_attendance" ON student_attendance;
DROP POLICY IF EXISTS "teachers_create_class_attendance" ON student_attendance;
DROP POLICY IF EXISTS "teachers_update_own_attendance" ON student_attendance;
DROP POLICY IF EXISTS "teachers_delete_own_attendance" ON student_attendance;
DROP POLICY IF EXISTS "branch_managers_manage_branch_attendance" ON student_attendance;
DROP POLICY IF EXISTS "coaches_manage_all_attendance" ON student_attendance;
DROP POLICY IF EXISTS "admins_full_access_attendance" ON student_attendance;

-- 1. Students: READ-ONLY access to their own attendance
CREATE POLICY "students_read_own_attendance"
    ON student_attendance FOR SELECT
    USING (
        student_id = auth.uid() 
        AND public.get_user_role() = 'S'
    );

-- 2. Teachers: Can view attendance for students in their classes
CREATE POLICY "teachers_read_class_attendance"
    ON student_attendance FOR SELECT
    USING (
        public.get_user_role() = 'T' AND (
            teacher_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM branch_classes bc
                WHERE bc.id = student_attendance.class_id
                AND bc.teacher_id = auth.uid()
            )
        )
    );

-- 3. Teachers: Can INSERT attendance ONLY for their assigned classes
CREATE POLICY "teachers_create_class_attendance"
    ON student_attendance FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'T' 
        AND teacher_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = class_id
            AND bc.teacher_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM branch_students bs
            WHERE bs.student_id = student_attendance.student_id
            AND bs.class_id = student_attendance.class_id
            AND bs.enrollment_status = 'ENROLLED'
        )
    );

-- 4. Teachers: Can UPDATE attendance records they created
CREATE POLICY "teachers_update_own_attendance"
    ON student_attendance FOR UPDATE
    USING (
        teacher_id = auth.uid() 
        AND public.get_user_role() = 'T'
        AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = student_attendance.class_id
            AND bc.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        teacher_id = auth.uid() 
        AND public.get_user_role() = 'T'
        AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = student_attendance.class_id
            AND bc.teacher_id = auth.uid()
        )
    );

-- 5. Teachers: Can DELETE their own attendance records (within time limits - handled by app)
CREATE POLICY "teachers_delete_own_attendance"
    ON student_attendance FOR DELETE
    USING (
        teacher_id = auth.uid() 
        AND public.get_user_role() = 'T'
        AND EXISTS (
            SELECT 1 FROM branch_classes bc
            WHERE bc.id = student_attendance.class_id
            AND bc.teacher_id = auth.uid()
        )
    );

-- 6. Branch Managers: Can view and manage attendance for their branch
CREATE POLICY "branch_managers_manage_branch_attendance"
    ON student_attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = student_attendance.branch_id
            AND cb.manager_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = student_attendance.branch_id
            AND cb.manager_id = auth.uid()
        )
    );

-- 7. Coaches: Full access to all attendance records
CREATE POLICY "coaches_manage_all_attendance"
    ON student_attendance FOR ALL
    USING (public.get_user_role() = 'C')
    WITH CHECK (public.get_user_role() = 'C');

-- 8. Admins: Full access
CREATE POLICY "admins_full_access_attendance"
    ON student_attendance FOR ALL
    USING (public.get_user_role() IN ('A', 'SA'))
    WITH CHECK (public.get_user_role() IN ('A', 'SA'));

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if user is branch manager for specific branch
CREATE OR REPLACE FUNCTION public.is_branch_manager(branch_uuid UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM coaching_branches
        WHERE id = branch_uuid
        AND manager_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if teacher is assigned to specific class
CREATE OR REPLACE FUNCTION public.is_class_teacher(class_uuid UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM branch_classes
        WHERE id = class_uuid
        AND teacher_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if student is enrolled in specific class
CREATE OR REPLACE FUNCTION public.is_student_in_class(class_uuid UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM branch_students
        WHERE class_id = class_uuid
        AND student_id = user_id
        AND enrollment_status = 'ENROLLED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get branch ID for a class
CREATE OR REPLACE FUNCTION public.get_class_branch_id(class_uuid UUID)
RETURNS UUID AS $$
DECLARE
    branch_uuid UUID;
BEGIN
    SELECT branch_id INTO branch_uuid
    FROM branch_classes
    WHERE id = class_uuid;
    
    RETURN branch_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student enrollment summary
CREATE OR REPLACE FUNCTION get_student_enrollment_summary(student_uuid UUID)
RETURNS JSON AS $$
DECLARE
    summary JSON;
BEGIN
    SELECT json_build_object(
        'total_enrollments', COUNT(*),
        'active_enrollments', COUNT(*) FILTER (WHERE enrollment_status = 'ENROLLED'),
        'completed_enrollments', COUNT(*) FILTER (WHERE enrollment_status = 'COMPLETED'),
        'total_fees_due', COALESCE(SUM(total_fees_due), 0),
        'total_fees_paid', COALESCE(SUM(total_fees_paid), 0),
        'average_attendance', ROUND(AVG(attendance_percentage), 2)
    )
    INTO summary
    FROM branch_students
    WHERE student_id = student_uuid;
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get branch class summary
CREATE OR REPLACE FUNCTION get_branch_class_summary(branch_uuid UUID)
RETURNS JSON AS $$
DECLARE
    summary JSON;
BEGIN
    SELECT json_build_object(
        'total_classes', COUNT(*),
        'active_classes', COUNT(*) FILTER (WHERE status = 'ACTIVE'),
        'total_students_enrolled', COALESCE(SUM(current_enrollment), 0),
        'total_capacity', COALESCE(SUM(max_students), 0),
        'average_utilization', CASE 
            WHEN SUM(max_students) > 0 
            THEN ROUND((SUM(current_enrollment)::DECIMAL / SUM(max_students)) * 100, 2)
            ELSE 0 
        END
    )
    INTO summary
    FROM branch_classes
    WHERE branch_id = branch_uuid;
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enroll student in branch (with validation)
CREATE OR REPLACE FUNCTION enroll_student_in_branch(
    student_uuid UUID,
    branch_uuid UUID,
    class_uuid UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    enrollment_id UUID;
BEGIN
    -- Validate student exists and has correct role
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = student_uuid 
        AND role = 'S' 
        AND is_active = TRUE
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or inactive student');
    END IF;
    
    -- Validate branch exists
    IF NOT EXISTS (
        SELECT 1 FROM coaching_branches 
        WHERE id = branch_uuid 
        AND is_active = TRUE
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or inactive branch');
    END IF;
    
    -- Check if already enrolled
    IF EXISTS (
        SELECT 1 FROM branch_students 
        WHERE student_id = student_uuid 
        AND branch_id = branch_uuid
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Student already enrolled in this branch');
    END IF;
    
    -- Validate class if provided
    IF class_uuid IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM branch_classes 
            WHERE id = class_uuid 
            AND branch_id = branch_uuid
            AND status = 'ACTIVE'
            AND current_enrollment < max_students
        ) THEN
            RETURN json_build_object('success', false, 'error', 'Class is full or not available');
        END IF;
    END IF;
    
    -- Create enrollment
    INSERT INTO branch_students (student_id, branch_id, class_id)
    VALUES (student_uuid, branch_uuid, class_uuid)
    RETURNING id INTO enrollment_id;
    
    RETURN json_build_object(
        'success', true, 
        'enrollment_id', enrollment_id,
        'message', 'Student successfully enrolled'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-generate fee receipts for upcoming payments
CREATE OR REPLACE FUNCTION generate_upcoming_fee_receipts()
RETURNS JSON AS $$
DECLARE
    receipt_count INTEGER := 0;
    student_record RECORD;
    receipt_id UUID;
BEGIN
    -- Generate receipts for students whose next payment is due within 3 days
    FOR student_record IN
        SELECT 
            bs.id as enrollment_id,
            bs.student_id,
            bs.branch_id,
            bs.class_id,
            bs.next_payment_due,
            bc.fees_amount,
            bc.fees_frequency
        FROM branch_students bs
        LEFT JOIN branch_classes bc ON bc.id = bs.class_id
        WHERE bs.next_payment_due IS NOT NULL
        AND bs.next_payment_due <= CURRENT_DATE + INTERVAL '3 days'
        AND bs.enrollment_status = 'ENROLLED'
        AND NOT EXISTS (
            -- Don't create duplicate receipts for the same period
            SELECT 1 FROM fee_receipts fr
            WHERE fr.enrollment_id = bs.id
            AND fr.due_date = bs.next_payment_due
            AND fr.receipt_status IN ('PENDING', 'PAID')
        )
    LOOP
        -- Insert fee receipt
        INSERT INTO fee_receipts (
            student_id,
            branch_id,
            class_id,
            enrollment_id,
            due_date,
            base_fee_amount,
            total_amount,
            balance_amount,
            fee_month,
            fee_year,
            description
        ) VALUES (
            student_record.student_id,
            student_record.branch_id,
            student_record.class_id,
            student_record.enrollment_id,
            student_record.next_payment_due,
            COALESCE(student_record.fees_amount, 0),
            COALESCE(student_record.fees_amount, 0),
            COALESCE(student_record.fees_amount, 0),
            EXTRACT(MONTH FROM student_record.next_payment_due)::INTEGER,
            EXTRACT(YEAR FROM student_record.next_payment_due)::INTEGER,
            'Auto-generated fee receipt for ' || 
            CASE student_record.fees_frequency
                WHEN 'MONTHLY' THEN 'monthly'
                WHEN 'QUARTERLY' THEN 'quarterly'
                WHEN 'YEARLY' THEN 'yearly'
                ELSE 'fee'
            END || ' payment'
        ) RETURNING id INTO receipt_id;
        
        receipt_count := receipt_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'receipts_generated', receipt_count,
        'message', 'Generated ' || receipt_count || ' fee receipts'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student attendance summary
CREATE OR REPLACE FUNCTION get_student_attendance_summary(
    student_uuid UUID,
    class_uuid UUID DEFAULT NULL,
    from_date DATE DEFAULT NULL,
    to_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    summary JSON;
BEGIN
    SELECT json_build_object(
        'total_days', COUNT(*),
        'present_days', COUNT(*) FILTER (WHERE attendance_status = 'PRESENT'),
        'absent_days', COUNT(*) FILTER (WHERE attendance_status = 'ABSENT'),
        'late_days', COUNT(*) FILTER (WHERE attendance_status = 'LATE'),
        'excused_days', COUNT(*) FILTER (WHERE attendance_status = 'EXCUSED'),
        'attendance_percentage', CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE attendance_status IN ('PRESENT', 'LATE'))::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0 
        END,
        'average_late_minutes', COALESCE(AVG(late_by_minutes) FILTER (WHERE late_by_minutes > 0), 0)
    )
    INTO summary
    FROM student_attendance
    WHERE student_id = student_uuid
    AND (class_uuid IS NULL OR class_id = class_uuid)
    AND (from_date IS NULL OR attendance_date >= from_date)
    AND (to_date IS NULL OR attendance_date <= to_date);
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get class attendance report
CREATE OR REPLACE FUNCTION get_class_attendance_report(
    class_uuid UUID,
    from_date DATE DEFAULT NULL,
    to_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    report JSON;
BEGIN
    SELECT json_build_object(
        'class_id', class_uuid,
        'total_sessions', COUNT(DISTINCT attendance_date),
        'total_student_records', COUNT(*),
        'average_attendance', ROUND(
            (COUNT(*) FILTER (WHERE attendance_status IN ('PRESENT', 'LATE'))::DECIMAL / 
             NULLIF(COUNT(*), 0)) * 100, 2
        ),
        'students_with_perfect_attendance', (
            SELECT COUNT(DISTINCT student_id)
            FROM student_attendance sa
            WHERE sa.class_id = class_uuid
            AND (from_date IS NULL OR sa.attendance_date >= from_date)
            AND (to_date IS NULL OR sa.attendance_date <= to_date)
            AND NOT EXISTS (
                SELECT 1 FROM student_attendance sa2
                WHERE sa2.student_id = sa.student_id
                AND sa2.class_id = class_uuid
                AND sa2.attendance_status = 'ABSENT'
                AND (from_date IS NULL OR sa2.attendance_date >= from_date)
                AND (to_date IS NULL OR sa2.attendance_date <= to_date)
            )
        )
    )
    INTO report
    FROM student_attendance
    WHERE class_id = class_uuid
    AND (from_date IS NULL OR attendance_date >= from_date)
    AND (to_date IS NULL OR attendance_date <= to_date);
    
    RETURN report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEWS FOR EASY DATA ACCESS
-- ============================================================

-- View for student enrollment details
CREATE OR REPLACE VIEW student_enrollment_details AS
SELECT 
    bs.id as enrollment_id,
    bs.student_id,
    p.full_name as student_name,
    p.username as student_username,
    bs.branch_id,
    cb.name as branch_name,
    cc.name as coaching_center_name,
    bs.class_id,
    bc.class_name,
    bc.subject,
    bc.grade_level,
    bs.enrollment_date,
    bs.enrollment_status,
    bs.payment_status,
    bs.attendance_percentage,
    bs.total_fees_due,
    bs.total_fees_paid,
    bs.next_payment_due,
    bs.created_at,
    bs.updated_at
FROM branch_students bs
LEFT JOIN profiles p ON p.id = bs.student_id
LEFT JOIN coaching_branches cb ON cb.id = bs.branch_id
LEFT JOIN coaching_centers cc ON cc.id = cb.coaching_center_id
LEFT JOIN branch_classes bc ON bc.id = bs.class_id;

-- View for class enrollment details
CREATE OR REPLACE VIEW class_enrollment_details AS
SELECT 
    bc.id as class_id,
    bc.class_name,
    bc.subject,
    bc.grade_level,
    bc.batch_name,
    bc.max_students,
    bc.current_enrollment,
    bc.fees_amount,
    bc.status as class_status,
    cb.name as branch_name,
    cc.name as coaching_center_name,
    p.full_name as teacher_name,
    bc.start_date,
    bc.end_date,
    bc.start_time,
    bc.end_time,
    bc.class_days,
    bc.created_at,
    bc.updated_at
FROM branch_classes bc
LEFT JOIN coaching_branches cb ON cb.id = bc.branch_id
LEFT JOIN coaching_centers cc ON cc.id = cb.coaching_center_id
LEFT JOIN profiles p ON p.id = bc.teacher_id;

-- View for fee receipt details
CREATE OR REPLACE VIEW fee_receipt_details AS
SELECT 
    fr.id as receipt_id,
    fr.receipt_number,
    fr.receipt_date,
    fr.due_date,
    fr.student_id,
    p.full_name as student_name,
    p.username as student_username,
    fr.branch_id,
    cb.name as branch_name,
    cc.name as coaching_center_name,
    fr.class_id,
    bc.class_name,
    bc.subject,
    fr.base_fee_amount,
    fr.late_fee_amount,
    fr.discount_amount,
    fr.tax_amount,
    fr.total_amount,
    fr.amount_paid,
    fr.balance_amount,
    fr.payment_method,
    fr.payment_reference,
    fr.payment_date,
    fr.receipt_status,
    fr.fee_month,
    fr.fee_year,
    fr.description,
    pm.full_name as processed_by_name,
    fr.created_at,
    fr.updated_at
FROM fee_receipts fr
LEFT JOIN profiles p ON p.id = fr.student_id
LEFT JOIN coaching_branches cb ON cb.id = fr.branch_id
LEFT JOIN coaching_centers cc ON cc.id = cb.coaching_center_id
LEFT JOIN branch_classes bc ON bc.id = fr.class_id
LEFT JOIN profiles pm ON pm.id = fr.processed_by;

-- View for attendance details
CREATE OR REPLACE VIEW attendance_details AS
SELECT 
    sa.id as attendance_id,
    sa.attendance_date,
    sa.student_id,
    p.full_name as student_name,
    p.username as student_username,
    sa.class_id,
    bc.class_name,
    bc.subject,
    bc.grade_level,
    sa.teacher_id,
    tp.full_name as teacher_name,
    sa.branch_id,
    cb.name as branch_name,
    cc.name as coaching_center_name,
    sa.attendance_status,
    sa.check_in_time,
    sa.check_out_time,
    sa.total_duration,
    sa.late_by_minutes,
    sa.early_leave_minutes,
    sa.teacher_remarks,
    sa.excuse_reason,
    sa.created_at,
    sa.updated_at
FROM student_attendance sa
LEFT JOIN profiles p ON p.id = sa.student_id
LEFT JOIN branch_classes bc ON bc.id = sa.class_id
LEFT JOIN profiles tp ON tp.id = sa.teacher_id
LEFT JOIN coaching_branches cb ON cb.id = sa.branch_id
LEFT JOIN coaching_centers cc ON cc.id = cb.coaching_center_id;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE branch_classes IS 'Classes offered at coaching branches - READ-ONLY for students, managed by coaches/admins';
COMMENT ON TABLE branch_students IS 'Student enrollments in branches - students can only access their own data';
COMMENT ON TABLE fee_receipts IS 'Auto-generated fee receipts - managed only by branch managers and admins';
COMMENT ON TABLE student_attendance IS 'Student attendance records - managed only by teachers for their classes';

COMMENT ON COLUMN branch_classes.current_enrollment IS 'Automatically updated count of enrolled students';
COMMENT ON COLUMN branch_students.attendance_percentage IS 'Student attendance percentage (0-100)';
COMMENT ON COLUMN branch_students.total_fees_due IS 'Total outstanding fees amount';
COMMENT ON COLUMN branch_students.total_fees_paid IS 'Total fees paid by student';
COMMENT ON COLUMN fee_receipts.receipt_number IS 'Auto-generated unique receipt number (BRANCH-YY-MM-NNNN format)';
COMMENT ON COLUMN fee_receipts.balance_amount IS 'Automatically calculated: total_amount - amount_paid';
COMMENT ON COLUMN fee_receipts.is_auto_generated IS 'True if receipt was auto-generated by system';
COMMENT ON COLUMN student_attendance.total_duration IS 'Automatically calculated duration between check-in and check-out';

COMMENT ON FUNCTION update_class_enrollment_count() IS 'Automatically updates class enrollment count when student enrollment changes';
COMMENT ON FUNCTION validate_student_enrollment() IS 'Validates student role and teacher assignment before enrollment';
COMMENT ON FUNCTION generate_receipt_number() IS 'Auto-generates unique receipt numbers and calculates balance';
COMMENT ON FUNCTION update_receipt_balance() IS 'Updates receipt balance and status based on payments';
COMMENT ON FUNCTION validate_teacher_attendance() IS 'Validates teacher permissions and student enrollment for attendance';
COMMENT ON FUNCTION calculate_attendance_duration() IS 'Calculates total duration from check-in/check-out times';
COMMENT ON FUNCTION enroll_student_in_branch(UUID, UUID, UUID) IS 'Safely enrolls a student in a branch with validation';
COMMENT ON FUNCTION generate_upcoming_fee_receipts() IS 'Auto-generates fee receipts 3 days before payment due date';
COMMENT ON FUNCTION get_student_attendance_summary(UUID, UUID, DATE, DATE) IS 'Returns attendance statistics for a student';
COMMENT ON FUNCTION get_class_attendance_report(UUID, DATE, DATE) IS 'Returns attendance report for a class';

COMMENT ON VIEW student_enrollment_details IS 'Comprehensive view of student enrollments with related data';
COMMENT ON VIEW class_enrollment_details IS 'Comprehensive view of class details with enrollment information';
COMMENT ON VIEW fee_receipt_details IS 'Comprehensive view of fee receipts with related student and branch data';
COMMENT ON VIEW attendance_details IS 'Comprehensive view of attendance records with related data';