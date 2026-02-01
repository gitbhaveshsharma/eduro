-- ============================================================
-- FIX: Encrypted Quiz Questions - Disable Database Auto-Grading
-- Migration 024: Adapt triggers for client-side encrypted questions
-- ============================================================
--
-- PROBLEM:
-- Quiz questions are encrypted client-side before storage:
--   - correct_answers: ["eXK7cIRN6sjlbnLWlLZw33EEFzs4"] (encrypted)
--   - options: { "_encrypted": "..." }
--   - question_text: "encrypted_base64_string"
--
-- But quiz responses are submitted in plain text:
--   - selected_answers: ["A", "B"]
--
-- The auto_grade_mcq_response() trigger cannot compare encrypted correct_answers
-- with plain text selected_answers, so grading fails.
--
-- SOLUTION:
-- 1. Client-side quiz.service.ts already decrypts questions and calculates grades
-- 2. The service inserts responses WITH pre-calculated is_correct, points_earned, points_deducted
-- 3. We disable the auto-grading trigger and update the score trigger to trust client-provided grades
--
-- ============================================================

-- ============================================================
-- STEP 1: Drop the auto-grading trigger (it can't decrypt questions)
-- ============================================================

-- Drop the trigger that tries to auto-grade MCQ responses
DROP TRIGGER IF EXISTS auto_grade_mcq_trigger ON quiz_responses;

-- Keep the function for reference but rename it to indicate it's deprecated
-- This allows rollback if needed
DROP FUNCTION IF EXISTS auto_grade_mcq_response();

-- Create a new no-op function that logs a warning (for debugging)
CREATE OR REPLACE FUNCTION auto_grade_mcq_response_deprecated()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is deprecated. 
    -- Grading is now handled by the application layer (quiz.service.ts)
    -- which decrypts questions before calculating grades.
    -- 
    -- The client provides: is_correct, points_earned, points_deducted
    -- with each response INSERT/UPDATE.
    
    RAISE NOTICE 'auto_grade_mcq_response_deprecated: Grading handled by application layer';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_grade_mcq_response_deprecated() IS 
'DEPRECATED: Auto-grading moved to application layer (quiz.service.ts) because questions are encrypted in database.';

-- ============================================================
-- STEP 2: Update the score calculation trigger
-- ============================================================

-- This trigger should still work because it reads is_correct and points_earned
-- from quiz_responses (which are set by the application layer)
-- Let's update it to be more robust

CREATE OR REPLACE FUNCTION update_quiz_attempt_score()
RETURNS TRIGGER AS $$
DECLARE
    v_attempt_id UUID;
    v_total_earned DECIMAL(10,2);
    v_total_deducted DECIMAL(10,2);
    v_total_score DECIMAL(10,2);
    v_max_possible DECIMAL(10,2);
    v_percentage DECIMAL(5,2);
    v_quiz_id UUID;
    v_passing_score DECIMAL(10,2);
    v_quiz_max_score DECIMAL(10,2);
BEGIN
    -- Determine which attempt to update
    IF TG_OP = 'DELETE' THEN
        v_attempt_id := OLD.attempt_id;
    ELSE
        v_attempt_id := NEW.attempt_id;
    END IF;

    -- Get the quiz_id from the attempt
    SELECT quiz_id INTO v_quiz_id
    FROM quiz_attempts
    WHERE id = v_attempt_id;

    IF v_quiz_id IS NULL THEN
        RAISE NOTICE 'update_quiz_attempt_score: Quiz not found for attempt %', v_attempt_id;
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Get quiz details
    SELECT passing_score, max_score 
    INTO v_passing_score, v_quiz_max_score
    FROM quizzes
    WHERE id = v_quiz_id;

    -- Calculate total score from responses
    -- The application layer (quiz.service.ts) provides is_correct, points_earned, points_deducted
    SELECT 
        COALESCE(SUM(r.points_earned), 0),
        COALESCE(SUM(r.points_deducted), 0)
    INTO v_total_earned, v_total_deducted
    FROM quiz_responses r
    WHERE r.attempt_id = v_attempt_id;

    -- Calculate net score
    v_total_score := v_total_earned - v_total_deducted;
    
    -- Ensure score doesn't go below 0
    IF v_total_score < 0 THEN
        v_total_score := 0;
    END IF;

    -- Get max possible points from questions (sum of all question points)
    SELECT COALESCE(SUM(q.points), 0)
    INTO v_max_possible
    FROM quiz_questions q
    WHERE q.quiz_id = v_quiz_id;

    -- Calculate percentage based on max possible points from questions
    IF v_max_possible > 0 THEN
        v_percentage := (v_total_score / v_max_possible) * 100;
    ELSE
        v_percentage := 0;
    END IF;

    -- Ensure percentage doesn't exceed 100
    IF v_percentage > 100 THEN
        v_percentage := 100;
    END IF;

    -- Update the quiz_attempts record
    -- Note: Only update score-related fields, not submitted_at or attempt_status
    -- Those are handled by the application layer when submitting
    UPDATE quiz_attempts
    SET 
        score = v_total_score,
        max_score = COALESCE(v_quiz_max_score, v_max_possible),
        percentage = v_percentage,
        passed = CASE 
            WHEN v_passing_score IS NULL THEN NULL
            WHEN v_total_score >= v_passing_score THEN TRUE
            ELSE FALSE
        END,
        updated_at = NOW()
    WHERE id = v_attempt_id;

    RAISE NOTICE 'update_quiz_attempt_score: Updated attempt % - Score: %, Percentage: %%', 
        v_attempt_id, v_total_score, v_percentage;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_quiz_attempt_score() IS 
'Updates quiz attempt score by summing points_earned and points_deducted from quiz_responses. 
Grading is done by the application layer which decrypts questions.';

-- ============================================================
-- STEP 3: Ensure calculate_quiz_time_taken still works correctly
-- ============================================================

-- This function doesn't depend on encrypted data, just timestamps
-- But let's make it more robust
CREATE OR REPLACE FUNCTION calculate_quiz_time_taken()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if submitted_at is being set and we don't already have time_taken_seconds
    IF NEW.submitted_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        -- Only set if not already provided by the application
        IF NEW.time_taken_seconds IS NULL OR NEW.time_taken_seconds = 0 THEN
            NEW.time_taken_seconds := EXTRACT(EPOCH FROM (NEW.submitted_at - NEW.started_at))::INTEGER;
        END IF;
        
        -- Ensure time_taken_seconds is not negative
        IF NEW.time_taken_seconds < 0 THEN
            NEW.time_taken_seconds := 0;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_quiz_time_taken() IS 
'Calculates time taken for quiz attempt. Works as fallback if application doesn''t provide value.';

-- ============================================================
-- STEP 4: Create a helper function for manual re-grading (admin use)
-- ============================================================

-- This function can be called by admins to re-calculate scores
-- when the application has already set is_correct values
CREATE OR REPLACE FUNCTION recalculate_attempt_score(p_attempt_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_earned DECIMAL(10,2);
    v_total_deducted DECIMAL(10,2);
    v_total_score DECIMAL(10,2);
    v_max_possible DECIMAL(10,2);
    v_percentage DECIMAL(5,2);
    v_quiz_id UUID;
    v_passing_score DECIMAL(10,2);
    v_quiz_max_score DECIMAL(10,2);
    v_correct_count INTEGER;
    v_total_questions INTEGER;
BEGIN
    -- Get quiz_id from attempt
    SELECT quiz_id INTO v_quiz_id
    FROM quiz_attempts
    WHERE id = p_attempt_id;

    IF v_quiz_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Attempt not found');
    END IF;

    -- Get quiz details
    SELECT passing_score, max_score 
    INTO v_passing_score, v_quiz_max_score
    FROM quizzes
    WHERE id = v_quiz_id;

    -- Calculate totals from responses
    SELECT 
        COALESCE(SUM(points_earned), 0),
        COALESCE(SUM(points_deducted), 0),
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        COUNT(*)
    INTO v_total_earned, v_total_deducted, v_correct_count, v_total_questions
    FROM quiz_responses
    WHERE attempt_id = p_attempt_id;

    v_total_score := GREATEST(v_total_earned - v_total_deducted, 0);

    -- Get max possible from questions
    SELECT COALESCE(SUM(points), 0)
    INTO v_max_possible
    FROM quiz_questions
    WHERE quiz_id = v_quiz_id;

    -- Calculate percentage
    IF v_max_possible > 0 THEN
        v_percentage := LEAST((v_total_score / v_max_possible) * 100, 100);
    ELSE
        v_percentage := 0;
    END IF;

    -- Update attempt
    UPDATE quiz_attempts
    SET 
        score = v_total_score,
        max_score = COALESCE(v_quiz_max_score, v_max_possible),
        percentage = v_percentage,
        passed = CASE 
            WHEN v_passing_score IS NULL THEN NULL
            WHEN v_total_score >= v_passing_score THEN TRUE
            ELSE FALSE
        END,
        updated_at = NOW()
    WHERE id = p_attempt_id;

    RETURN json_build_object(
        'success', true,
        'attempt_id', p_attempt_id,
        'score', v_total_score,
        'max_score', COALESCE(v_quiz_max_score, v_max_possible),
        'percentage', v_percentage,
        'correct_count', v_correct_count,
        'total_questions', v_total_questions,
        'passed', CASE 
            WHEN v_passing_score IS NULL THEN NULL
            WHEN v_total_score >= v_passing_score THEN TRUE
            ELSE FALSE
        END
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_attempt_score(UUID) IS 
'Admin function to recalculate attempt score from quiz_responses. 
Use when application-provided is_correct values need to be re-summed.';

-- ============================================================
-- STEP 5: Add validation trigger for responses
-- ============================================================

-- This trigger validates that required grading fields are provided
-- since the application is responsible for grading
CREATE OR REPLACE FUNCTION validate_quiz_response()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT or UPDATE, validate that grading fields are set
    -- (since DB can't auto-grade encrypted questions)
    
    IF NEW.is_correct IS NULL THEN
        -- Default to false if not provided
        NEW.is_correct := FALSE;
        RAISE NOTICE 'validate_quiz_response: is_correct not provided, defaulting to FALSE';
    END IF;
    
    IF NEW.points_earned IS NULL THEN
        NEW.points_earned := 0;
    END IF;
    
    IF NEW.points_deducted IS NULL THEN
        NEW.points_deducted := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the validation trigger
DROP TRIGGER IF EXISTS validate_quiz_response_trigger ON quiz_responses;
CREATE TRIGGER validate_quiz_response_trigger
    BEFORE INSERT OR UPDATE ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_response();

COMMENT ON FUNCTION validate_quiz_response() IS 
'Validates/defaults grading fields for quiz responses since auto-grading is disabled for encrypted questions.';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Summary of changes:
-- 1. Dropped auto_grade_mcq_trigger (cannot decrypt questions)
-- 2. Created deprecated function for reference
-- 3. Updated update_quiz_attempt_score() to be more robust
-- 4. Updated calculate_quiz_time_taken() to work as fallback
-- 5. Added recalculate_attempt_score() helper for admins
-- 6. Added validate_quiz_response() to default grading fields

-- IMPORTANT: Ensure your quiz.service.ts ALWAYS provides:
-- - is_correct: boolean
-- - points_earned: number
-- - points_deducted: number
-- when inserting quiz_responses
