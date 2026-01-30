-- Drop existing versions
DROP FUNCTION IF EXISTS get_student_dashboard_stats_v2(UUID);
DROP FUNCTION IF EXISTS get_student_dashboard_stats_v2(UUID, UUID);

CREATE OR REPLACE FUNCTION get_student_dashboard_stats_v2(
  p_student_id UUID,
  p_coaching_center_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result JSON;
  v_today DATE := CURRENT_DATE;
  v_current_day TEXT := TRIM(TO_CHAR(v_today, 'Day'));
  v_current_time TIME := LOCALTIME;
  v_branch_ids UUID[];
BEGIN
  -- Get all branch IDs for the coaching center (if provided)
  IF p_coaching_center_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_branch_ids
    FROM coaching_branches
    WHERE coaching_center_id = p_coaching_center_id
      AND is_active = TRUE;
  END IF;
  
  SELECT json_build_object(
    -- Core enrollment stats - REMOVED total_fees_due and total_fees_paid
    'enrollment_stats', (
      SELECT json_build_object(
        'total_enrollments', COUNT(*),
        'active_enrollments', COUNT(*) FILTER (WHERE ce.enrollment_status = 'ENROLLED'),
        'completed_enrollments', COUNT(*) FILTER (WHERE ce.enrollment_status = 'COMPLETED'),
        'average_attendance', ROUND(AVG(ce.attendance_percentage), 2)
      )
      FROM class_enrollments ce
      WHERE ce.student_id = p_student_id
        AND (p_coaching_center_id IS NULL OR ce.branch_id = ANY(v_branch_ids))
    ),
    
    -- Today's classes schedule - only essential fields
    'today_schedule', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'class_id', bc.id,
          'class_name', bc.class_name,
          'subject', bc.subject,
          'start_time', bc.start_time,
          'end_time', bc.end_time,
          'teacher_name', p.full_name,
          'is_current_class', v_current_time BETWEEN bc.start_time AND bc.end_time,
          'branch_id', bc.branch_id
        ) ORDER BY bc.start_time
      ), '[]'::json)
      FROM branch_classes bc
      INNER JOIN class_enrollments ce ON bc.id = ce.class_id
      LEFT JOIN profiles p ON bc.teacher_id = p.id
      WHERE ce.student_id = p_student_id
        AND ce.enrollment_status = 'ENROLLED'
        AND bc.status = 'ACTIVE'
        AND (p_coaching_center_id IS NULL OR bc.branch_id = ANY(v_branch_ids))
        AND v_current_day = ANY(bc.class_days)
        AND (bc.start_date IS NULL OR bc.start_date <= v_today)
        AND (bc.end_date IS NULL OR bc.end_date >= v_today)
    ),
    
    -- Recent fee receipts - only necessary columns
    'recent_fee_receipts', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'receipt_id', fr.id,
          'receipt_number', fr.receipt_number,
          'receipt_date', fr.receipt_date,
          'due_date', fr.due_date,
          'total_amount', fr.total_amount,
          'amount_paid', fr.amount_paid,
          'balance_amount', fr.balance_amount,
          'receipt_status', fr.receipt_status,
          'days_overdue', CASE 
            WHEN fr.due_date < v_today AND fr.balance_amount > 0 
            THEN (v_today - fr.due_date)::INTEGER 
            ELSE NULL 
          END,
          'branch_id', fr.branch_id
        ) ORDER BY fr.receipt_date DESC, fr.created_at DESC
      ), '[]'::json)
      FROM fee_receipts fr
      WHERE fr.student_id = p_student_id
        AND fr.receipt_date >= NOW() - INTERVAL '6 months'
        AND (p_coaching_center_id IS NULL OR fr.branch_id = ANY(v_branch_ids))
      LIMIT 10
    ),
    
    -- Fee summary
    'fee_summary', (
      SELECT json_build_object(
        'total_receipts', COUNT(*),
        'total_due', COALESCE(SUM(fr.total_amount), 0),
        'total_paid', COALESCE(SUM(fr.amount_paid), 0),
        'total_balance', COALESCE(SUM(fr.balance_amount), 0),
        'pending_receipts', COUNT(*) FILTER (WHERE fr.receipt_status = 'PENDING'),
        'overdue_receipts', COUNT(*) FILTER (
          WHERE fr.due_date < v_today 
          AND fr.balance_amount > 0 
          AND fr.receipt_status != 'CANCELLED'
        )
      )
      FROM fee_receipts fr
      WHERE fr.student_id = p_student_id
        AND fr.receipt_date >= NOW() - INTERVAL '12 months'
        AND (p_coaching_center_id IS NULL OR fr.branch_id = ANY(v_branch_ids))
    ),
    
    -- Upcoming assignments - minimal columns
    'upcoming_assignments', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'assignment_id', a.id,
          'title', a.title,
          'class_name', bc.class_name,
          'subject', bc.subject,
          'due_date', a.due_date,
          'days_remaining', CEILING(EXTRACT(EPOCH FROM (a.due_date - NOW())) / 86400)::INTEGER,
          'max_score', a.max_score,
          'branch_id', a.branch_id,
          'is_submitted', EXISTS (
            SELECT 1 FROM assignment_submissions asub 
            WHERE asub.assignment_id = a.id 
            AND asub.student_id = p_student_id 
            AND asub.is_final = TRUE
          ),
          'submission_score', (
            SELECT score FROM assignment_submissions asub 
            WHERE asub.assignment_id = a.id 
            AND asub.student_id = p_student_id 
            AND asub.is_final = TRUE 
            LIMIT 1
          ),
          'submission_status', (
            SELECT grading_status::TEXT FROM assignment_submissions asub
            WHERE asub.assignment_id = a.id 
            AND asub.student_id = p_student_id 
            AND asub.is_final = TRUE 
            LIMIT 1
          )
        ) ORDER BY a.due_date
      ), '[]'::json)
      FROM assignments a
      INNER JOIN branch_classes bc ON a.class_id = bc.id
      INNER JOIN class_enrollments ce ON bc.id = ce.class_id
      WHERE ce.student_id = p_student_id
        AND ce.enrollment_status = 'ENROLLED'
        AND (p_coaching_center_id IS NULL OR a.branch_id = ANY(v_branch_ids))
        AND a.status = 'PUBLISHED'
        AND a.due_date >= NOW()
        AND (a.close_date IS NULL OR a.close_date >= NOW())
      LIMIT 10
    ),
    
    -- Upcoming quizzes - minimal columns
    'upcoming_quizzes', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'quiz_id', q.id,
          'title', q.title,
          'class_name', bc.class_name,
          'subject', bc.subject,
          'available_from', q.available_from,
          'available_to', q.available_to,
          'time_limit_minutes', q.time_limit_minutes,
          'hours_remaining', CEILING(EXTRACT(EPOCH FROM (q.available_to - NOW())) / 3600)::INTEGER,
          'max_score', q.max_score,
          'total_questions', q.total_questions,
          'branch_id', q.branch_id,
          'attempts_used', (
            SELECT COUNT(*) FROM quiz_attempts qa 
            WHERE qa.quiz_id = q.id 
            AND qa.student_id = p_student_id
          ),
          'best_score', (
            SELECT MAX(percentage) FROM quiz_attempts qa 
            WHERE qa.quiz_id = q.id 
            AND qa.student_id = p_student_id
            AND qa.attempt_status = 'COMPLETED'
          ),
          'can_attempt', (
            q.is_active = TRUE 
            AND NOW() BETWEEN q.available_from AND q.available_to
            AND (
              SELECT COUNT(*) FROM quiz_attempts qa 
              WHERE qa.quiz_id = q.id 
              AND qa.student_id = p_student_id
            ) < q.max_attempts
          )
        ) ORDER BY q.available_from
      ), '[]'::json)
      FROM quizzes q
      INNER JOIN branch_classes bc ON q.class_id = bc.id
      INNER JOIN class_enrollments ce ON bc.id = ce.class_id
      WHERE ce.student_id = p_student_id
        AND ce.enrollment_status = 'ENROLLED'
        AND (p_coaching_center_id IS NULL OR q.branch_id = ANY(v_branch_ids))
        AND q.is_active = TRUE
        AND q.available_to >= NOW()
      LIMIT 10
    ),
    
    -- Recent submissions - minimal columns
    'recent_submissions', (
      SELECT COALESCE(json_agg(submission_item), '[]'::json)
      FROM (
        SELECT json_build_object(
          'type', item.type,
          'id', item.id,
          'title', item.title,
          'class_name', item.class_name,
          'submitted_at', item.submitted_at,
          'score', item.score,
          'max_score', item.max_score,
          'percentage', item.percentage,
          'status', item.status,
          'branch_id', item.branch_id
        ) as submission_item
        FROM (
          -- Assignment submissions
          SELECT 
            'assignment' as type,
            asub.id,
            a.title,
            bc.class_name,
            asub.submitted_at,
            asub.score,
            a.max_score,
            CASE 
              WHEN asub.score IS NOT NULL AND a.max_score > 0 
              THEN ROUND((asub.score / a.max_score) * 100, 2)
              ELSE NULL 
            END as percentage,
            asub.grading_status::TEXT as status,
            a.branch_id
          FROM assignment_submissions asub
          INNER JOIN assignments a ON asub.assignment_id = a.id
          INNER JOIN branch_classes bc ON a.class_id = bc.id
          WHERE asub.student_id = p_student_id
            AND asub.is_final = TRUE
            AND (p_coaching_center_id IS NULL OR a.branch_id = ANY(v_branch_ids))
            AND asub.submitted_at >= NOW() - INTERVAL '30 days'
          
          UNION ALL
          
          -- Quiz submissions
          SELECT 
            'quiz' as type,
            qa.id,
            q.title,
            bc.class_name,
            qa.submitted_at,
            qa.score,
            q.max_score,
            qa.percentage,
            qa.attempt_status::TEXT as status,
            q.branch_id
          FROM quiz_attempts qa
          INNER JOIN quizzes q ON qa.quiz_id = q.id
          INNER JOIN branch_classes bc ON q.class_id = bc.id
          WHERE qa.student_id = p_student_id
            AND qa.attempt_status = 'COMPLETED'
            AND (p_coaching_center_id IS NULL OR q.branch_id = ANY(v_branch_ids))
            AND qa.submitted_at >= NOW() - INTERVAL '30 days'
        ) as item
        WHERE item.submitted_at IS NOT NULL
        ORDER BY item.submitted_at DESC
        LIMIT 15
      ) as ordered_items
    ),
    
    -- Performance summary
    'performance_summary', (
      SELECT json_build_object(
        'assignments', json_build_object(
          'total_submitted', COUNT(DISTINCT asub.id) FILTER (WHERE asub.id IS NOT NULL),
          'total_graded', COUNT(DISTINCT asub.id) FILTER (WHERE asub.grading_status IN ('AUTO_GRADED', 'MANUAL_GRADED')),
          'pending_grading', COUNT(DISTINCT asub.id) FILTER (WHERE asub.grading_status = 'NOT_GRADED'),
          'average_score', ROUND(AVG(asub.score) FILTER (
            WHERE asub.grading_status IN ('AUTO_GRADED', 'MANUAL_GRADED') AND a.max_score > 0
          ), 2)
        ),
        'quizzes', json_build_object(
          'total_attempted', COUNT(DISTINCT qa.id) FILTER (WHERE qa.id IS NOT NULL),
          'completed', COUNT(DISTINCT qa.id) FILTER (WHERE qa.attempt_status = 'COMPLETED'),
          'average_percentage', ROUND(AVG(qa.percentage) FILTER (WHERE qa.attempt_status = 'COMPLETED'), 2)
        ),
        'overall', json_build_object(
          'average_attendance', ROUND(AVG(ce.attendance_percentage), 2),
          'enrolled_classes', COUNT(DISTINCT ce.class_id) FILTER (WHERE ce.enrollment_status = 'ENROLLED')
        )
      )
      FROM class_enrollments ce
      LEFT JOIN assignments a ON a.class_id = ce.class_id 
        AND a.status = 'PUBLISHED'
        AND (p_coaching_center_id IS NULL OR a.branch_id = ANY(v_branch_ids))
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id 
        AND asub.student_id = p_student_id 
        AND asub.is_final = TRUE
      LEFT JOIN quizzes q ON q.class_id = ce.class_id 
        AND q.is_active = TRUE
        AND (p_coaching_center_id IS NULL OR q.branch_id = ANY(v_branch_ids))
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id 
        AND qa.student_id = p_student_id
      WHERE ce.student_id = p_student_id
        AND ce.enrollment_status = 'ENROLLED'
        AND (p_coaching_center_id IS NULL OR ce.branch_id = ANY(v_branch_ids))
    ),
    
    -- Overdue items count
    'overdue_items', (
      SELECT json_build_object(
        'overdue_assignments', (
          SELECT COUNT(DISTINCT a.id)
          FROM assignments a
          INNER JOIN branch_classes bc ON a.class_id = bc.id
          INNER JOIN class_enrollments ce ON bc.id = ce.class_id
          WHERE ce.student_id = p_student_id
            AND ce.enrollment_status = 'ENROLLED'
            AND (p_coaching_center_id IS NULL OR a.branch_id = ANY(v_branch_ids))
            AND a.status = 'PUBLISHED'
            AND a.due_date < NOW()
            AND NOT EXISTS (
              SELECT 1 FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id 
              AND asub.student_id = p_student_id 
              AND asub.is_final = TRUE
            )
            AND (a.close_date IS NULL OR a.close_date >= NOW())
        ),
        'expiring_quizzes', (
          SELECT COUNT(DISTINCT q.id)
          FROM quizzes q
          INNER JOIN branch_classes bc ON q.class_id = bc.id
          INNER JOIN class_enrollments ce ON bc.id = ce.class_id
          WHERE ce.student_id = p_student_id
            AND ce.enrollment_status = 'ENROLLED'
            AND (p_coaching_center_id IS NULL OR q.branch_id = ANY(v_branch_ids))
            AND q.is_active = TRUE
            AND q.available_to BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
            AND (
              SELECT COUNT(*) FROM quiz_attempts qa 
              WHERE qa.quiz_id = q.id 
              AND qa.student_id = p_student_id
            ) < q.max_attempts
        ),
        'overdue_fees', (
          SELECT COUNT(*)
          FROM fee_receipts fr
          WHERE fr.student_id = p_student_id
            AND fr.due_date < v_today
            AND fr.balance_amount > 0
            AND fr.receipt_status NOT IN ('PAID', 'CANCELLED')
            AND (p_coaching_center_id IS NULL OR fr.branch_id = ANY(v_branch_ids))
        )
      )
    ),
    
    -- Class progress - REMOVED average_assignment_score and average_quiz_percentage
    'class_progress', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'class_id', bc.id,
          'class_name', bc.class_name,
          'subject', bc.subject,
          'branch_id', bc.branch_id,
          'attendance_percentage', ce.attendance_percentage,
          'assignments_completed', (
            SELECT COUNT(DISTINCT a.id)
            FROM assignments a
            INNER JOIN assignment_submissions asub ON asub.assignment_id = a.id 
              AND asub.student_id = p_student_id 
              AND asub.is_final = TRUE
            WHERE a.class_id = bc.id
              AND a.status = 'PUBLISHED'
          ),
          'assignments_total', (
            SELECT COUNT(DISTINCT a.id)
            FROM assignments a
            WHERE a.class_id = bc.id
              AND a.status = 'PUBLISHED'
          ),
          'quizzes_completed', (
            SELECT COUNT(DISTINCT q.id)
            FROM quizzes q
            INNER JOIN quiz_attempts qa ON qa.quiz_id = q.id 
              AND qa.student_id = p_student_id
              AND qa.attempt_status = 'COMPLETED'
            WHERE q.class_id = bc.id
              AND q.is_active = TRUE
          ),
          'quizzes_total', (
            SELECT COUNT(DISTINCT q.id)
            FROM quizzes q
            WHERE q.class_id = bc.id
              AND q.is_active = TRUE
          )
        )
      ), '[]'::json)
      FROM class_enrollments ce
      INNER JOIN branch_classes bc ON ce.class_id = bc.id
      WHERE ce.student_id = p_student_id
        AND ce.enrollment_status = 'ENROLLED'
        AND (p_coaching_center_id IS NULL OR bc.branch_id = ANY(v_branch_ids))
        AND bc.status = 'ACTIVE'
    )
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE,
    'hint', 'Check student ID and coaching center ID parameters'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_student_dashboard_stats_v2(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION get_student_dashboard_stats_v2 IS 
'Optimized student dashboard statistics - Removed specific heavy fields.
REMOVED:
- today_attendance (entire section)
- enrollment_stats.total_fees_due and total_fees_paid (removed branch_students join)
- class_progress.average_assignment_score
- class_progress.average_quiz_percentage
This reduces payload size and improves performance by removing unnecessary joins and calculations.';