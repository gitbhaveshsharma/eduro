-- ============================================================
-- CLASS ASSIGNMENT & QUIZ SYSTEM - MVP VERSION
-- Migration 017: Create assignment and quiz tables with auto-cleanup
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Assignment submission types
CREATE TYPE assignment_submission_type AS ENUM (
  'FILE',      -- File upload submission
  'TEXT'       -- Text entry submission
);

-- Assignment status
CREATE TYPE assignment_status AS ENUM (
  'DRAFT',     -- Assignment is draft, not visible to students
  'PUBLISHED', -- Assignment is published and visible
  'CLOSED'     -- Assignment is closed for submissions
);

-- Quiz question types (MVP: Only multiple choice)
CREATE TYPE question_type AS ENUM (
  'MCQ_SINGLE', -- Single choice multiple choice question
  'MCQ_MULTI'   -- Multiple choice question (not for MVP, but future)
);

-- Quiz attempt status
CREATE TYPE attempt_status AS ENUM (
  'IN_PROGRESS', -- Quiz is being attempted
  'COMPLETED',   -- Quiz submitted and graded
  'TIMEOUT',     -- Quiz timed out
  'ABANDONED'    -- Quiz abandoned by student
);

-- Grading status
CREATE TYPE grading_status AS ENUM (
  'NOT_GRADED',   -- Not graded yet
  'AUTO_GRADED',  -- Auto-graded (for quizzes)
  'MANUAL_GRADED' -- Manually graded by teacher
);

-- Cleanup frequency options for teachers
CREATE TYPE cleanup_frequency AS ENUM (
  '30_DAYS',   -- Clean after 30 days
  '60_DAYS',   -- Clean after 60 days
  '90_DAYS',   -- Clean after 90 days
  'SEMESTER_END', -- Clean at semester end
  'NEVER'      -- Never clean (not recommended)
);

-- ============================================================
-- CENTRAL FILES TABLE (For all uploads with auto-cleanup)
-- ============================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- S3 key or local path
  file_size BIGINT NOT NULL, -- in bytes
  mime_type TEXT,
  storage_provider TEXT DEFAULT 'local', -- 'local', 's3', 'gcs'
  
  -- File content/context
  preview_url TEXT,   -- For images/PDFs
  thumbnail_url TEXT, -- For faster loading
  
  -- Who uploaded and for what
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context tracking (what this file is for)
  context_type TEXT, -- 'assignment_instruction', 'submission', 'quiz_attachment'
  context_id UUID,   -- ID of the related record (assignment_id, quiz_id, etc.)
  
  -- Auto-cleanup tracking (CRITICAL)
  expires_at TIMESTAMPTZ, -- When this file should be deleted
  is_permanent BOOLEAN DEFAULT FALSE, -- Never auto-delete (for important files)
  cleanup_notes TEXT, -- Why/when this will be cleaned
  
  -- Metadata
  is_compressed BOOLEAN DEFAULT FALSE,
  compression_ratio DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_file_size CHECK (file_size >= 0),
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- ============================================================
-- ASSIGNMENTS TABLE (Created by teachers)
-- ============================================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  class_id UUID NOT NULL REFERENCES branch_classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  
  -- Assignment details
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Submission settings
  submission_type assignment_submission_type DEFAULT 'FILE',
  max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
  allowed_extensions TEXT[], -- ['pdf', 'docx', 'jpg', 'png']
  max_submissions INTEGER DEFAULT 1, -- Number of allowed submissions
  allow_late_submission BOOLEAN DEFAULT FALSE,
  late_penalty_percentage DECIMAL(5,2) DEFAULT 0.0, -- e.g., 10.00 for 10%
  
  -- Grading
  max_score DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  grading_rubric JSONB, -- Simple rubric structure
  show_rubric_to_students BOOLEAN DEFAULT FALSE,
  
  -- Dates and timing
  publish_at TIMESTAMPTZ, -- When to make visible (NULL = immediately)
  due_date TIMESTAMPTZ NOT NULL,
  close_date TIMESTAMPTZ, -- When submissions close (NULL = no close)
  
  -- Auto-cleanup settings (Teacher configurable)
  clean_submissions_after cleanup_frequency DEFAULT '90_DAYS',
  clean_instructions_after cleanup_frequency DEFAULT '30_DAYS',
  
  -- Attachments (linked to files table)
  instruction_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  attachment_ids UUID[] DEFAULT '{}', -- Array of file IDs
  
  -- Status and visibility
  status assignment_status DEFAULT 'DRAFT',
  is_visible BOOLEAN DEFAULT FALSE, -- Controlled by publish_at
  
  -- Tracking
  total_submissions INTEGER DEFAULT 0,
  average_score DECIMAL(10,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (
    (publish_at IS NULL OR publish_at <= due_date) AND
    (close_date IS NULL OR due_date <= close_date)
  ),
  CONSTRAINT valid_max_score CHECK (max_score > 0),
  CONSTRAINT valid_late_penalty CHECK (late_penalty_percentage >= 0 AND late_penalty_percentage <= 100),
  CONSTRAINT valid_file_size_limit CHECK (max_file_size > 0)
);

-- ============================================================
-- ASSIGNMENT SUBMISSIONS TABLE (Submitted by students)
-- ============================================================
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES branch_classes(id) ON DELETE CASCADE,
  
  -- Submission content (choose one based on assignment type)
  submission_text TEXT, -- For text submissions
  submission_file_id UUID REFERENCES files(id) ON DELETE SET NULL, -- For file submissions
  
  -- Submission metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Grading information
  score DECIMAL(10,2),
  max_score DECIMAL(10,2), -- Copy from assignment for reference
  grading_status grading_status DEFAULT 'NOT_GRADED',
  graded_by UUID REFERENCES auth.users(id), -- Teacher who graded
  graded_at TIMESTAMPTZ,
  
  -- Late submission tracking
  is_late BOOLEAN DEFAULT FALSE,
  late_minutes INTEGER, -- How many minutes late
  penalty_applied DECIMAL(10,2) DEFAULT 0.0,
  
  -- Feedback
  feedback TEXT,
  private_notes TEXT, -- Teacher's private notes
  
  -- Version tracking (for multiple submissions)
  attempt_number INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT TRUE,
  
  -- Auto-cleanup tracking
  auto_delete_after TIMESTAMPTZ, -- Calculated from assignment.clean_submissions_after
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= max_score)),
  CONSTRAINT one_submission_type CHECK (
    (submission_text IS NOT NULL AND submission_file_id IS NULL) OR
    (submission_text IS NULL AND submission_file_id IS NOT NULL) OR
    (submission_text IS NULL AND submission_file_id IS NULL) -- Draft submission
  )
);

-- Add a partial unique index for only one final submission per student per assignment
CREATE UNIQUE INDEX unique_final_submission_idx 
ON assignment_submissions(assignment_id, student_id) 
WHERE is_final = TRUE;
-- ============================================================
-- QUIZZES TABLE (Created by teachers)
-- ============================================================

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  class_id UUID NOT NULL REFERENCES branch_classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES coaching_branches(id) ON DELETE CASCADE,
  
  -- Quiz details
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Timing and availability
  available_from TIMESTAMPTZ NOT NULL,
  available_to TIMESTAMPTZ NOT NULL,
  time_limit_minutes INTEGER, -- NULL = no time limit
  submission_window_minutes INTEGER DEFAULT 5, -- Grace period after time limit
  
  -- Settings
  shuffle_questions BOOLEAN DEFAULT FALSE,
  shuffle_options BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT FALSE, -- After quiz completion
  show_score_immediately BOOLEAN DEFAULT TRUE,
  allow_multiple_attempts BOOLEAN DEFAULT FALSE,
  max_attempts INTEGER DEFAULT 1,
  require_webcam BOOLEAN DEFAULT FALSE, -- For proctoring (future)
  
  -- Grading
  max_score DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  passing_score DECIMAL(10,2), -- NULL = no passing requirement
  
  -- Auto-cleanup settings
  clean_attempts_after cleanup_frequency DEFAULT '90_DAYS', -- Keep detailed attempts longer
  clean_questions_after cleanup_frequency DEFAULT 'NEVER', -- Keep questions forever
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  total_questions INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  average_score DECIMAL(10,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (available_from < available_to),
  CONSTRAINT valid_time_limit CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  CONSTRAINT valid_attempts CHECK (max_attempts >= 1),
  CONSTRAINT valid_passing_score CHECK (passing_score IS NULL OR passing_score <= max_score)
);

-- ============================================================
-- QUIZ QUESTIONS TABLE
-- ============================================================

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  -- Question details
  question_text TEXT NOT NULL,
  question_type question_type DEFAULT 'MCQ_SINGLE',
  
  -- Options for MCQ (JSON structure for flexibility)
  options JSONB NOT NULL, -- {"A": "Option 1 text", "B": "Option 2 text", ...}
  correct_answers TEXT[] NOT NULL, -- ['A'] for single, ['A', 'C'] for multi
  
  -- Grading
  points DECIMAL(10,2) DEFAULT 1.00,
  negative_points DECIMAL(10,2) DEFAULT 0.00, -- For wrong answers
  
  -- Explanation
  explanation TEXT, -- Shown after quiz if enabled
  
  -- Order and grouping
  question_order INTEGER NOT NULL,
  topic TEXT,
  
  -- Media (linked to files table)
  media_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_points CHECK (points > 0),
  CONSTRAINT valid_negative_points CHECK (negative_points >= 0),
  CONSTRAINT unique_question_order UNIQUE(quiz_id, question_order)
);

-- ============================================================
-- QUIZ ATTEMPTS TABLE (Student attempts)
-- ============================================================

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES branch_classes(id) ON DELETE CASCADE,
  
  -- Attempt details
  attempt_number INTEGER NOT NULL DEFAULT 1,
  attempt_status attempt_status DEFAULT 'IN_PROGRESS',
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_taken_seconds INTEGER, -- Auto-calculated on submission
  
  -- Grading results
  score DECIMAL(10,2),
  max_score DECIMAL(10,2), -- Copy from quiz
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  
  -- Auto-cleanup tracking
  expires_at TIMESTAMPTZ, -- When detailed responses should be cleaned
  
  -- Session info (for security/audit)
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_attempt_number CHECK (attempt_number >= 1),
  CONSTRAINT unique_attempt_number UNIQUE(quiz_id, student_id, attempt_number),
  CONSTRAINT valid_submission_time CHECK (submitted_at IS NULL OR submitted_at >= started_at)
);

-- ============================================================
-- QUIZ RESPONSES TABLE (Detailed student answers)
-- ============================================================

CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  -- Student's answer
  selected_answers TEXT[], -- ['A', 'C'] for multiple choice
  answer_text TEXT, -- For future text-based questions
  
  -- Grading (auto-calculated for MCQ)
  is_correct BOOLEAN,
  points_earned DECIMAL(10,2) DEFAULT 0.00,
  points_deducted DECIMAL(10,2) DEFAULT 0.00,
  
  -- Time tracking per question
  time_spent_seconds INTEGER DEFAULT 0,
  question_started_at TIMESTAMPTZ,
  question_answered_at TIMESTAMPTZ,
  
  -- Auto-cleanup flag
  is_detailed BOOLEAN DEFAULT TRUE, -- If FALSE, only keep score, not detailed answers
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_points CHECK (points_earned >= 0 AND points_deducted >= 0)
);

-- ============================================================
-- AUTO-CLEANUP LOG TABLE (Track what was cleaned)
-- ============================================================

CREATE TABLE cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was cleaned
  entity_type TEXT NOT NULL, -- 'file', 'quiz_response', 'submission'
  entity_id UUID NOT NULL,
  entity_name TEXT,
  
  -- Cleanup details
  cleanup_reason TEXT NOT NULL, -- 'auto_cleanup', 'manual', 'storage_limit'
  cleanup_trigger TEXT, -- 'daily_job', 'teacher_request', 'system'
  cleaned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Storage saved
  storage_saved_bytes BIGINT,
  rows_deleted INTEGER,
  
  -- Who triggered (if manual)
  triggered_by UUID REFERENCES auth.users(id),
  
  -- Metadata for rollback (if needed)
  backup_location TEXT,
  backup_available_until TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Files indexes
CREATE INDEX idx_files_expires_at ON files(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_files_context ON files(context_type, context_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_is_permanent ON files(is_permanent);

-- Assignments indexes
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_branch_id ON assignments(branch_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_is_visible ON assignments(is_visible);
CREATE INDEX idx_assignments_publish_at ON assignments(publish_at) WHERE publish_at IS NOT NULL;

-- Assignment submissions indexes
CREATE INDEX idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_class_id ON assignment_submissions(class_id);
CREATE INDEX idx_submissions_submitted_at ON assignment_submissions(submitted_at);
CREATE INDEX idx_submissions_grading_status ON assignment_submissions(grading_status);
CREATE INDEX idx_submissions_auto_delete ON assignment_submissions(auto_delete_after) WHERE auto_delete_after IS NOT NULL;
CREATE INDEX idx_submissions_student_assignment ON assignment_submissions(student_id, assignment_id);

-- Quizzes indexes
CREATE INDEX idx_quizzes_class_id ON quizzes(class_id);
CREATE INDEX idx_quizzes_teacher_id ON quizzes(teacher_id);
CREATE INDEX idx_quizzes_branch_id ON quizzes(branch_id);
CREATE INDEX idx_quizzes_available_from ON quizzes(available_from);
CREATE INDEX idx_quizzes_available_to ON quizzes(available_to);
CREATE INDEX idx_quizzes_is_active ON quizzes(is_active);

-- Quiz questions indexes
CREATE INDEX idx_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_questions_question_order ON quiz_questions(quiz_id, question_order);
CREATE INDEX idx_questions_topic ON quiz_questions(topic) WHERE topic IS NOT NULL;

-- Quiz attempts indexes
CREATE INDEX idx_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_attempts_class_id ON quiz_attempts(class_id);
CREATE INDEX idx_attempts_started_at ON quiz_attempts(started_at);
CREATE INDEX idx_attempts_submitted_at ON quiz_attempts(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_attempts_status ON quiz_attempts(attempt_status);
CREATE INDEX idx_attempts_expires_at ON quiz_attempts(expires_at) WHERE expires_at IS NOT NULL;

-- Quiz responses indexes
CREATE INDEX idx_responses_attempt_id ON quiz_responses(attempt_id);
CREATE INDEX idx_responses_question_id ON quiz_responses(question_id);
CREATE INDEX idx_responses_is_detailed ON quiz_responses(is_detailed);
CREATE INDEX idx_responses_created_at ON quiz_responses(created_at);

-- Cleanup logs indexes
CREATE INDEX idx_cleanup_logs_cleaned_at ON cleanup_logs(cleaned_at);
CREATE INDEX idx_cleanup_logs_entity ON cleanup_logs(entity_type, entity_id);
CREATE INDEX idx_cleanup_logs_triggered_by ON cleanup_logs(triggered_by) WHERE triggered_by IS NOT NULL;

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_academic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate submission auto_delete_after based on assignment settings
CREATE OR REPLACE FUNCTION set_submission_cleanup_date()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment assignments;
    v_cleanup_date TIMESTAMPTZ;
BEGIN
    -- Get assignment details
    SELECT * INTO v_assignment FROM assignments WHERE id = NEW.assignment_id;
    
    -- Calculate cleanup date based on assignment settings
    CASE v_assignment.clean_submissions_after
        WHEN '30_DAYS' THEN
            v_cleanup_date := v_assignment.due_date + INTERVAL '30 days';
        WHEN '60_DAYS' THEN
            v_cleanup_date := v_assignment.due_date + INTERVAL '60 days';
        WHEN '90_DAYS' THEN
            v_cleanup_date := v_assignment.due_date + INTERVAL '90 days';
        WHEN 'SEMESTER_END' THEN
            -- You'll need to define semester end logic
            v_cleanup_date := v_assignment.due_date + INTERVAL '120 days'; -- Placeholder
        WHEN 'NEVER' THEN
            v_cleanup_date := NULL;
        ELSE
            v_cleanup_date := v_assignment.due_date + INTERVAL '90 days'; -- Default
    END CASE;
    
    NEW.auto_delete_after := v_cleanup_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate quiz attempt expiry date
CREATE OR REPLACE FUNCTION set_quiz_attempt_expiry()
RETURNS TRIGGER AS $$
DECLARE
    v_quiz quizzes;
BEGIN
    -- Get quiz details
    SELECT * INTO v_quiz FROM quizzes WHERE id = NEW.quiz_id;
    
    -- Calculate expiry date based on quiz settings
    IF NEW.submitted_at IS NOT NULL THEN
        CASE v_quiz.clean_attempts_after
            WHEN '30_DAYS' THEN
                NEW.expires_at := NEW.submitted_at + INTERVAL '30 days';
            WHEN '60_DAYS' THEN
                NEW.expires_at := NEW.submitted_at + INTERVAL '60 days';
            WHEN '90_DAYS' THEN
                NEW.expires_at := NEW.submitted_at + INTERVAL '90 days';
            WHEN '180_DAYS' THEN
                NEW.expires_at := NEW.submitted_at + INTERVAL '180 days';
            WHEN 'SEMESTER_END' THEN
                NEW.expires_at := NEW.submitted_at + INTERVAL '120 days'; -- Placeholder
            WHEN 'NEVER' THEN
                NEW.expires_at := NULL;
            ELSE
                NEW.expires_at := NEW.submitted_at + INTERVAL '180 days'; -- Default
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-grade MCQ questions
CREATE OR REPLACE FUNCTION auto_grade_mcq_response()
RETURNS TRIGGER AS $$
DECLARE
    v_question quiz_questions;
    v_correct_count INTEGER;
    v_selected_count INTEGER;
    v_matched_count INTEGER;
BEGIN
    -- Get question details
    SELECT * INTO v_question FROM quiz_questions WHERE id = NEW.question_id;
    
    -- Only auto-grade MCQ questions
    IF v_question.question_type IN ('MCQ_SINGLE', 'MCQ_MULTI') THEN
        -- Count correct answers
        v_correct_count := array_length(v_question.correct_answers, 1);
        v_selected_count := array_length(NEW.selected_answers, 1);
        
        -- Count matched answers
        v_matched_count := (
            SELECT COUNT(*)
            FROM unnest(NEW.selected_answers) AS selected
            WHERE selected = ANY(v_question.correct_answers)
        );
        
        -- Determine if correct (based on question type)
        IF v_question.question_type = 'MCQ_SINGLE' THEN
            -- Single choice: must match exactly one correct answer
            NEW.is_correct := (v_selected_count = 1 AND v_matched_count = 1);
        ELSE
            -- Multi-choice: all selected must be correct and all correct must be selected
            NEW.is_correct := (v_selected_count = v_correct_count AND v_matched_count = v_correct_count);
        END IF;
        
        -- Calculate points
        IF NEW.is_correct THEN
            NEW.points_earned := v_question.points;
            NEW.points_deducted := 0;
        ELSE
            NEW.points_earned := 0;
            NEW.points_deducted := v_question.negative_points;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update quiz attempt score when responses are submitted
CREATE OR REPLACE FUNCTION update_quiz_attempt_score()
RETURNS TRIGGER AS $$
DECLARE
    v_attempt_id UUID;
    v_total_score DECIMAL(10,2);
    v_total_points DECIMAL(10,2);
    v_percentage DECIMAL(5,2);
    v_quiz quizzes;
BEGIN
    -- Determine which attempt to update
    IF TG_OP = 'INSERT' THEN
        v_attempt_id := NEW.attempt_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_attempt_id := OLD.attempt_id;
    ELSE
        v_attempt_id := NEW.attempt_id;
    END IF;
    
    -- Get quiz details
    SELECT * INTO v_quiz 
    FROM quizzes q
    JOIN quiz_attempts a ON a.quiz_id = q.id
    WHERE a.id = v_attempt_id;
    
    -- Calculate total score and points
    SELECT 
        COALESCE(SUM(points_earned - points_deducted), 0),
        COALESCE(SUM(points), 0)
    INTO v_total_score, v_total_points
    FROM quiz_responses r
    JOIN quiz_questions q ON q.id = r.question_id
    WHERE r.attempt_id = v_attempt_id;
    
    -- Calculate percentage
    IF v_total_points > 0 THEN
        v_percentage := (v_total_score / v_total_points) * 100;
    ELSE
        v_percentage := 0;
    END IF;
    
    -- Update attempt
    UPDATE quiz_attempts
    SET 
        score = v_total_score,
        max_score = v_quiz.max_score,
        percentage = v_percentage,
        passed = CASE 
            WHEN v_quiz.passing_score IS NULL THEN NULL
            WHEN v_total_score >= v_quiz.passing_score THEN TRUE
            ELSE FALSE
        END,
        updated_at = NOW()
    WHERE id = v_attempt_id;
    
    -- Update quiz statistics
    UPDATE quizzes
    SET 
        total_attempts = total_attempts + CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE -1 END,
        average_score = (
            SELECT AVG(percentage)
            FROM quiz_attempts 
            WHERE quiz_id = v_quiz.id 
            AND submitted_at IS NOT NULL
        ),
        updated_at = NOW()
    WHERE id = v_quiz.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate time taken for quiz attempt
CREATE OR REPLACE FUNCTION calculate_quiz_time_taken()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.submitted_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.time_taken_seconds := EXTRACT(EPOCH FROM (NEW.submitted_at - NEW.started_at));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update assignment statistics when submissions change
CREATE OR REPLACE FUNCTION update_assignment_statistics()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment_id UUID;
    v_total_submissions INTEGER;
    v_avg_score DECIMAL(10,2);
BEGIN
    -- Determine which assignment to update
    IF TG_OP = 'INSERT' THEN
        v_assignment_id := NEW.assignment_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_assignment_id := OLD.assignment_id;
    ELSE
        v_assignment_id := NEW.assignment_id;
    END IF;
    
    -- Calculate new statistics
    SELECT 
        COUNT(*),
        AVG(score)
    INTO v_total_submissions, v_avg_score
    FROM assignment_submissions
    WHERE assignment_id = v_assignment_id
    AND is_final = TRUE
    AND score IS NOT NULL;
    
    -- Update assignment
    UPDATE assignments
    SET 
        total_submissions = v_total_submissions,
        average_score = v_avg_score,
        updated_at = NOW()
    WHERE id = v_assignment_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Set file expiry based on context
CREATE OR REPLACE FUNCTION set_file_expiry()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment assignments;
    v_cleanup_frequency cleanup_frequency;
BEGIN
    -- Only set expiry if not permanent
    IF NEW.is_permanent = FALSE THEN
        -- Set expiry based on context type
        IF NEW.context_type = 'assignment_instruction' THEN
            -- Get assignment cleanup setting for instructions
            SELECT clean_instructions_after INTO v_cleanup_frequency
            FROM assignments WHERE id = NEW.context_id;
            
            NEW.expires_at := NOW() + 
                CASE v_cleanup_frequency
                    WHEN '30_DAYS' THEN INTERVAL '30 days'
                    WHEN '60_DAYS' THEN INTERVAL '60 days'
                    WHEN '90_DAYS' THEN INTERVAL '90 days'
                    WHEN 'SEMESTER_END' THEN INTERVAL '120 days'
                    ELSE INTERVAL '30 days' -- Default
                END;
                
            NEW.cleanup_notes := 'Assignment instructions - auto-cleanup scheduled';
            
        ELSIF NEW.context_type = 'submission' THEN
            -- Get submission and its assignment
            SELECT a.clean_submissions_after INTO v_cleanup_frequency
            FROM assignment_submissions s
            JOIN assignments a ON a.id = s.assignment_id
            WHERE s.id = NEW.context_id;
            
            NEW.expires_at := NOW() + 
                CASE v_cleanup_frequency
                    WHEN '30_DAYS' THEN INTERVAL '30 days'
                    WHEN '60_DAYS' THEN INTERVAL '60 days'
                    WHEN '90_DAYS' THEN INTERVAL '90 days'
                    WHEN 'SEMESTER_END' THEN INTERVAL '120 days'
                    WHEN 'NEVER' THEN NULL
                    ELSE INTERVAL '90 days' -- Default
                END;
                
            NEW.cleanup_notes := 'Student submission - auto-cleanup scheduled';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Updated_at triggers
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_updated_at();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_updated_at();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_updated_at();

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_updated_at();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_updated_at();

CREATE TRIGGER update_attempts_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_academic_updated_at();

-- Auto-cleanup triggers
CREATE TRIGGER set_submission_cleanup_trigger
    BEFORE INSERT OR UPDATE OF assignment_id ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION set_submission_cleanup_date();

CREATE TRIGGER set_quiz_attempt_expiry_trigger
    BEFORE INSERT OR UPDATE OF submitted_at ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION set_quiz_attempt_expiry();

CREATE TRIGGER set_file_expiry_trigger
    BEFORE INSERT ON files
    FOR EACH ROW
    EXECUTE FUNCTION set_file_expiry();

-- Auto-grading triggers
CREATE TRIGGER auto_grade_mcq_trigger
    BEFORE INSERT OR UPDATE OF selected_answers ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION auto_grade_mcq_response();

CREATE TRIGGER update_quiz_score_trigger
    AFTER INSERT OR UPDATE OR DELETE ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_attempt_score();

CREATE TRIGGER calculate_quiz_time_trigger
    BEFORE UPDATE OF submitted_at ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quiz_time_taken();

-- Statistics update triggers
CREATE TRIGGER update_assignment_stats_trigger
    AFTER INSERT OR UPDATE OF score OR DELETE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_statistics();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;






-- ============================================================
-- HELPER FUNCTIONS FOR AUTO-CLEANUP
-- ============================================================

-- Function to clean expired files
CREATE OR REPLACE FUNCTION clean_expired_files()
RETURNS JSON AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_freed_bytes BIGINT := 0;
    v_file_record RECORD;
BEGIN
    -- Find files that have expired and are not permanent
    FOR v_file_record IN
        SELECT id, file_name, file_path, file_size
        FROM files
        WHERE expires_at IS NOT NULL
        AND expires_at <= NOW()
        AND is_permanent = FALSE
        FOR UPDATE SKIP LOCKED
        LIMIT 1000 -- Batch size to prevent long locks
    LOOP
        -- Delete from storage (pseudo-code - implement based on your storage)
        -- Example for local files:
        -- PERFORM pg_ls_dir(v_file_record.file_path);
        -- Actual deletion depends on your storage system
        
        -- Delete file record
        DELETE FROM files WHERE id = v_file_record.id;
        
        -- Log the cleanup
        INSERT INTO cleanup_logs (
            entity_type,
            entity_id,
            entity_name,
            cleanup_reason,
            cleanup_trigger,
            storage_saved_bytes,
            rows_deleted
        ) VALUES (
            'file',
            v_file_record.id,
            v_file_record.file_name,
            'auto_cleanup',
            'daily_job',
            v_file_record.file_size,
            1
        );
        
        v_deleted_count := v_deleted_count + 1;
        v_freed_bytes := v_freed_bytes + v_file_record.file_size;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'files_deleted', v_deleted_count,
        'storage_freed_bytes', v_freed_bytes,
        'message', 'Cleaned ' || v_deleted_count || ' expired files'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old quiz responses (keep only scores)
CREATE OR REPLACE FUNCTION clean_old_quiz_responses()
RETURNS JSON AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
    v_attempt_record RECORD;
BEGIN
    -- Find quiz attempts where detailed responses should be cleaned
    FOR v_attempt_record IN
        SELECT id
        FROM quiz_attempts
        WHERE expires_at IS NOT NULL
        AND expires_at <= NOW()
        AND EXISTS (
            SELECT 1 FROM quiz_responses 
            WHERE attempt_id = quiz_attempts.id 
            AND is_detailed = TRUE
        )
        LIMIT 500
    LOOP
        -- Mark responses as non-detailed (keep only scores)
        UPDATE quiz_responses
        SET 
            selected_answers = NULL,
            answer_text = NULL,
            is_detailed = FALSE,
            metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{cleaned_at}',
                to_jsonb(NOW())
            )
        WHERE attempt_id = v_attempt_record.id
        AND is_detailed = TRUE;
        
        -- Update the attempt to remove expiry (already cleaned)
        UPDATE quiz_attempts
        SET expires_at = NULL
        WHERE id = v_attempt_record.id;
        
        v_cleaned_count := v_cleaned_count + 1;
        
        -- Log the cleanup
        INSERT INTO cleanup_logs (
            entity_type,
            entity_id,
            entity_name,
            cleanup_reason,
            cleanup_trigger,
            rows_deleted
        ) VALUES (
            'quiz_response',
            v_attempt_record.id,
            'Quiz attempt responses',
            'auto_cleanup',
            'daily_job',
            1
        );
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'attempts_cleaned', v_cleaned_count,
        'message', 'Cleaned detailed responses from ' || v_cleaned_count || ' quiz attempts'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS JSON AS $$
DECLARE
    v_total_files BIGINT;
    v_total_size BIGINT;
    v_expiring_soon BIGINT;
    v_expired_size BIGINT;
BEGIN
    -- Get total files and size
    SELECT 
        COUNT(*),
        COALESCE(SUM(file_size), 0)
    INTO v_total_files, v_total_size
    FROM files;
    
    -- Get files expiring in next 7 days
    SELECT 
        COUNT(*),
        COALESCE(SUM(file_size), 0)
    INTO v_expiring_soon, v_expired_size
    FROM files
    WHERE expires_at IS NOT NULL
    AND expires_at <= NOW() + INTERVAL '7 days'
    AND is_permanent = FALSE;
    
    RETURN json_build_object(
        'total_files', v_total_files,
        'total_size_bytes', v_total_size,
        'total_size_mb', ROUND(v_total_size / 1048576.0, 2),
        'files_expiring_soon', v_expiring_soon,
        'storage_to_be_freed_bytes', v_expired_size,
        'storage_to_be_freed_mb', ROUND(v_expired_size / 1048576.0, 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually extend file expiry
CREATE OR REPLACE FUNCTION extend_file_expiry(
    p_file_id UUID,
    p_days INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_file_exists BOOLEAN;
BEGIN
    -- Check if file exists
    SELECT EXISTS(SELECT 1 FROM files WHERE id = p_file_id) INTO v_file_exists;
    
    IF NOT v_file_exists THEN
        RETURN json_build_object('success', false, 'error', 'File not found');
    END IF;
    
    -- Extend expiry
    UPDATE files
    SET 
        expires_at = COALESCE(expires_at, NOW()) + (p_days || ' days')::INTERVAL,
        is_permanent = FALSE,
        cleanup_notes = COALESCE(cleanup_notes, '') || ' Manually extended by ' || p_days || ' days',
        updated_at = NOW()
    WHERE id = p_file_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'File expiry extended by ' || p_days || ' days',
        'new_expiry', (SELECT expires_at FROM files WHERE id = p_file_id)
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEWS FOR EASY DATA ACCESS
-- ============================================================

-- View for assignment details with class info
CREATE OR REPLACE VIEW assignment_details AS
SELECT 
    a.id,
    a.title,
    a.description,
    a.instructions,
    a.submission_type,
    a.max_score,
    a.due_date,
    a.close_date,
    a.status,
    a.total_submissions,
    a.average_score,
    
    -- Class info
    a.class_id,
    bc.class_name,
    bc.subject,
    bc.grade_level,
    
    -- Teacher info
    a.teacher_id,
    p.full_name as teacher_name,
    
    -- Branch info
    a.branch_id,
    cb.name as branch_name,
    
    -- Cleanup info
    a.clean_submissions_after,
    a.clean_instructions_after,
    
    a.created_at,
    a.updated_at
FROM assignments a
JOIN branch_classes bc ON bc.id = a.class_id
JOIN profiles p ON p.id = a.teacher_id
JOIN coaching_branches cb ON cb.id = a.branch_id;

-- View for student assignment submissions
CREATE OR REPLACE VIEW student_submission_details AS
SELECT 
    s.id,
    s.assignment_id,
    a.title as assignment_title,
    s.student_id,
    p.full_name as student_name,
    s.submitted_at,
    s.score,
    s.max_score,
    s.grading_status,
    s.feedback,
    s.is_late,
    s.late_minutes,
    s.penalty_applied,
    
    -- Cleanup info
    s.auto_delete_after,
    
    s.created_at,
    s.updated_at
FROM assignment_submissions s
JOIN assignments a ON a.id = s.assignment_id
JOIN profiles p ON p.id = s.student_id;

-- View for quiz details
CREATE OR REPLACE VIEW quiz_details AS
SELECT 
    q.id,
    q.title,
    q.description,
    q.instructions,
    q.time_limit_minutes,
    q.available_from,
    q.available_to,
    q.max_score,
    q.passing_score,
    q.total_questions,
    q.total_attempts,
    q.average_score,
    
    -- Class info
    q.class_id,
    bc.class_name,
    bc.subject,
    bc.grade_level,
    
    -- Teacher info
    q.teacher_id,
    p.full_name as teacher_name,
    
    -- Branch info
    q.branch_id,
    cb.name as branch_name,
    
    q.created_at,
    q.updated_at
FROM quizzes q
JOIN branch_classes bc ON bc.id = q.class_id
JOIN profiles p ON p.id = q.teacher_id
JOIN coaching_branches cb ON cb.id = q.branch_id;

-- View for student quiz attempts
CREATE OR REPLACE VIEW student_quiz_attempts AS
SELECT 
    a.id,
    a.quiz_id,
    q.title as quiz_title,
    a.student_id,
    p.full_name as student_name,
    a.attempt_number,
    a.attempt_status,
    a.started_at,
    a.submitted_at,
    a.time_taken_seconds,
    a.score,
    a.max_score,
    a.percentage,
    a.passed,
    
    -- Cleanup info
    a.expires_at,
    
    a.created_at,
    a.updated_at
FROM quiz_attempts a
JOIN quizzes q ON q.id = a.quiz_id
JOIN profiles p ON p.id = a.student_id;

-- View for storage usage by context
CREATE OR REPLACE VIEW storage_usage_by_context AS
SELECT 
    context_type,
    COUNT(*) as file_count,
    COALESCE(SUM(file_size), 0) as total_size_bytes,
    ROUND(COALESCE(SUM(file_size), 0) / 1048576.0, 2) as total_size_mb,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW()) as expired_count,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW() + INTERVAL '7 days') as expiring_soon_count
FROM files
GROUP BY context_type
ORDER BY total_size_bytes DESC;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE files IS 'Central file storage with auto-cleanup. Files are automatically deleted based on expiry dates.';
COMMENT ON TABLE assignments IS 'Class assignments created by teachers. Supports auto-cleanup of submissions and instructions.';
COMMENT ON TABLE assignment_submissions IS 'Student assignment submissions with auto-cleanup scheduling.';
COMMENT ON TABLE quizzes IS 'Class quizzes with timing and auto-cleanup settings.';
COMMENT ON TABLE quiz_questions IS 'Quiz questions (MCQ only for MVP).';
COMMENT ON TABLE quiz_attempts IS 'Student quiz attempts with auto-expiry for detailed responses.';
COMMENT ON TABLE quiz_responses IS 'Detailed quiz responses that get cleaned after expiry.';
COMMENT ON TABLE cleanup_logs IS 'Audit log of all auto-cleanup operations.';

COMMENT ON COLUMN files.expires_at IS 'When this file should be automatically deleted. NULL = never auto-delete.';
COMMENT ON COLUMN files.is_permanent IS 'If TRUE, file will never be auto-deleted regardless of expires_at.';
COMMENT ON COLUMN assignments.clean_submissions_after IS 'Teacher setting: when to auto-clean student submissions.';
COMMENT ON COLUMN assignments.clean_instructions_after IS 'Teacher setting: when to auto-clean assignment instruction files.';
COMMENT ON COLUMN assignment_submissions.auto_delete_after IS 'Calculated date when this submission should be cleaned.';
COMMENT ON COLUMN quiz_attempts.expires_at IS 'When detailed responses for this attempt should be cleaned.';
COMMENT ON COLUMN quiz_responses.is_detailed IS 'If FALSE, only score is kept, detailed answers are cleaned.';

COMMENT ON FUNCTION clean_expired_files() IS 'Daily job: deletes expired files and logs the cleanup.';
COMMENT ON FUNCTION clean_old_quiz_responses() IS 'Cleans detailed quiz responses while keeping scores.';
COMMENT ON FUNCTION get_storage_usage() IS 'Returns storage usage statistics for monitoring.';
COMMENT ON FUNCTION extend_file_expiry(UUID, INTEGER) IS 'Manually extends file expiry for important files.';

-- COMMENT ON VIEW assignment_details IS 'Assignment details with class, teacher, and branch information.';
-- COMMENT ON VIEW student_submission_details IS 'Student assignment submissions with assignment and student info.';
-- COMMENT ON VIEW quiz_details IS 'Quiz details with class and teacher information.';
-- COMMENT ON VIEW student_quiz_attempts IS 'Student quiz attempts with quiz and student information.';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================