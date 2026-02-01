-- =============================================================
-- COMPLETE UPDATED RLS POLICIES
-- Changes:
-- 1. BM role removed - using manager_id from coaching_branches
-- 2. class_students replaced with class_enrollments
-- 3. All other roles (C, SA, A, T, S) remain the same
-- =============================================================

-- -------------------------------------------------------------
-- FILES TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_files" ON files;
DROP POLICY IF EXISTS "coaches_select_files" ON files;
DROP POLICY IF EXISTS "managers_select_files" ON files;
DROP POLICY IF EXISTS "teachers_select_files" ON files;
DROP POLICY IF EXISTS "students_select_own_files" ON files;
DROP POLICY IF EXISTS "admins_insert_files" ON files;
DROP POLICY IF EXISTS "coaches_insert_files" ON files;
DROP POLICY IF EXISTS "managers_insert_files" ON files;
DROP POLICY IF EXISTS "teachers_insert_files" ON files;
DROP POLICY IF EXISTS "students_insert_files" ON files;
DROP POLICY IF EXISTS "admins_update_files" ON files;
DROP POLICY IF EXISTS "coaches_update_files" ON files;
DROP POLICY IF EXISTS "users_update_own_files" ON files;
DROP POLICY IF EXISTS "admins_delete_files" ON files;
DROP POLICY IF EXISTS "coaches_delete_files" ON files;
DROP POLICY IF EXISTS "users_delete_own_files" ON files;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access to all files
CREATE POLICY "admins_select_all_files"
    ON files FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view all files in their coaching centers
CREATE POLICY "coaches_select_files"
    ON files FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND (
            -- Files from assignments in their branches
            (context_type = 'assignment_instruction' AND context_id IN (
                SELECT id FROM assignments 
                WHERE branch_id IN (
                    SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                )
            ))
            OR
            -- Files from submissions in their branches
            (context_type = 'submission' AND context_id IN (
                SELECT s.id FROM assignment_submissions s
                JOIN assignments a ON a.id = s.assignment_id
                WHERE a.branch_id IN (
                    SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                )
            ))
            OR
            -- Files from quizzes in their branches
            (context_type = 'quiz_attachment' AND context_id IN (
                SELECT id FROM quizzes 
                WHERE branch_id IN (
                    SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                )
            ))
            OR
            -- Files uploaded by users in their branches
            (uploaded_by IN (
                SELECT student_id FROM branch_students 
                WHERE branch_id IN (
                    SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                )
            ))
        )
    );

-- 3. BRANCH MANAGERS: Can view files in their managed branches
CREATE POLICY "managers_select_files"
    ON files FOR SELECT
    USING (
        -- Files from assignments in their managed branches
        (context_type = 'assignment_instruction' AND context_id IN (
            SELECT id FROM assignments 
            WHERE branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        ))
        OR
        -- Files from submissions in their managed branches
        (context_type = 'submission' AND context_id IN (
            SELECT s.id FROM assignment_submissions s
            JOIN assignments a ON a.id = s.assignment_id
            WHERE a.branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        ))
        OR
        -- Files from quizzes in their managed branches
        (context_type = 'quiz_attachment' AND context_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        ))
    );

-- 4. TEACHERS: Can view files for their classes
CREATE POLICY "teachers_select_files"
    ON files FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND (
            -- Files from their assignments
            (context_type = 'assignment_instruction' AND context_id IN (
                SELECT id FROM assignments WHERE teacher_id = auth.uid()
            ))
            OR
            -- Files from submissions to their assignments
            (context_type = 'submission' AND context_id IN (
                SELECT s.id FROM assignment_submissions s
                JOIN assignments a ON a.id = s.assignment_id
                WHERE a.teacher_id = auth.uid()
            ))
            OR
            -- Files from their quizzes
            (context_type = 'quiz_attachment' AND context_id IN (
                SELECT id FROM quizzes WHERE teacher_id = auth.uid()
            ))
            OR
            -- Files they uploaded
            uploaded_by = auth.uid()
        )
    );

-- 5. STUDENTS: Can view only their own submission files
CREATE POLICY "students_select_own_files"
    ON files FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND (
            uploaded_by = auth.uid()
            OR
            -- Assignment instruction files for assignments visible to them
            (context_type = 'assignment_instruction' AND context_id IN (
                SELECT a.id FROM assignments a
                JOIN branch_classes bc ON bc.id = a.class_id
                JOIN class_enrollments ce ON ce.class_id = bc.id
                WHERE ce.student_id = auth.uid()
                AND a.is_visible = TRUE
            ))
        )
    );

-- INSERT POLICIES (Upload Access)
-- 1. ADMINS & SUPER ADMINS: Can upload any file
CREATE POLICY "admins_insert_files"
    ON files FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can upload files in their coaching centers
CREATE POLICY "coaches_insert_files"
    ON files FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. BRANCH MANAGERS: Can upload files in their managed branches
CREATE POLICY "managers_insert_files"
    ON files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can upload files for their classes
CREATE POLICY "teachers_insert_files"
    ON files FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND uploaded_by = auth.uid()
    );

-- 5. STUDENTS: Can upload submission files
CREATE POLICY "students_insert_files"
    ON files FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND uploaded_by = auth.uid()
        AND context_type = 'submission'
    );

-- UPDATE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can update any file
CREATE POLICY "admins_update_files"
    ON files FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can update files in their coaching centers
CREATE POLICY "coaches_update_files"
    ON files FOR UPDATE
    USING (public.get_user_role(auth.uid()) = 'C')
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. Others: Can only update their own uploaded files
CREATE POLICY "users_update_own_files"
    ON files FOR UPDATE
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

-- DELETE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can delete any file
CREATE POLICY "admins_delete_files"
    ON files FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can delete files in their coaching centers
CREATE POLICY "coaches_delete_files"
    ON files FOR DELETE
    USING (public.get_user_role(auth.uid()) = 'C');

-- 3. Others: Can delete their own uploaded files
CREATE POLICY "users_delete_own_files"
    ON files FOR DELETE
    USING (uploaded_by = auth.uid());

-- -------------------------------------------------------------
-- ASSIGNMENTS TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_assignments" ON assignments;
DROP POLICY IF EXISTS "coaches_select_assignments" ON assignments;
DROP POLICY IF EXISTS "managers_select_assignments" ON assignments;
DROP POLICY IF EXISTS "teachers_select_assignments" ON assignments;
DROP POLICY IF EXISTS "students_select_assignments" ON assignments;
DROP POLICY IF EXISTS "admins_insert_assignments" ON assignments;
DROP POLICY IF EXISTS "coaches_insert_assignments" ON assignments;
DROP POLICY IF EXISTS "managers_insert_assignments" ON assignments;
DROP POLICY IF EXISTS "teachers_insert_assignments" ON assignments;
DROP POLICY IF EXISTS "admins_update_assignments" ON assignments;
DROP POLICY IF EXISTS "coaches_update_assignments" ON assignments;
DROP POLICY IF EXISTS "managers_update_assignments" ON assignments;
DROP POLICY IF EXISTS "teachers_update_assignments" ON assignments;
DROP POLICY IF EXISTS "admins_delete_assignments" ON assignments;
DROP POLICY IF EXISTS "coaches_delete_assignments" ON assignments;
DROP POLICY IF EXISTS "managers_delete_assignments" ON assignments;
DROP POLICY IF EXISTS "teachers_delete_assignments" ON assignments;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_assignments"
    ON assignments FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view all assignments in their coaching centers
CREATE POLICY "coaches_select_assignments"
    ON assignments FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- 3. BRANCH MANAGERS: Can view assignments in their managed branches
CREATE POLICY "managers_select_assignments"
    ON assignments FOR SELECT
    USING (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can view their own assignments and assignments in their classes
CREATE POLICY "teachers_select_assignments"
    ON assignments FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND (
            teacher_id = auth.uid()
            OR class_id IN (
                SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
            )
        )
    );

-- 5. STUDENTS: Can view only published assignments for their enrolled classes
CREATE POLICY "students_select_assignments"
    ON assignments FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND is_visible = TRUE
        AND status = 'PUBLISHED'
        AND class_id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = auth.uid()
        )
    );

-- INSERT POLICIES (Create Access)
-- 1. ADMINS & SUPER ADMINS: Can create any assignment
CREATE POLICY "admins_insert_assignments"
    ON assignments FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can create assignments in their coaching centers
CREATE POLICY "coaches_insert_assignments"
    ON assignments FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- 3. BRANCH MANAGERS: Can create assignments in their managed branches
CREATE POLICY "managers_insert_assignments"
    ON assignments FOR INSERT
    WITH CHECK (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can create assignments for their classes
CREATE POLICY "teachers_insert_assignments"
    ON assignments FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
        AND class_id IN (
            SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
        )
        AND branch_id IN (
            SELECT bc.branch_id FROM branch_classes bc WHERE bc.id = class_id
        )
    );

-- UPDATE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can update any assignment
CREATE POLICY "admins_update_assignments"
    ON assignments FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can update assignments in their coaching centers
CREATE POLICY "coaches_update_assignments"
    ON assignments FOR UPDATE
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

-- 3. BRANCH MANAGERS: Can update assignments in their managed branches
CREATE POLICY "managers_update_assignments"
    ON assignments FOR UPDATE
    USING (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    )
    WITH CHECK (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can update only their own assignments
CREATE POLICY "teachers_update_assignments"
    ON assignments FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    );

-- DELETE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can delete any assignment
CREATE POLICY "admins_delete_assignments"
    ON assignments FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can delete assignments in their coaching centers
CREATE POLICY "coaches_delete_assignments"
    ON assignments FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- 3. BRANCH MANAGERS: Can delete assignments in their managed branches (with restrictions)
CREATE POLICY "managers_delete_assignments"
    ON assignments FOR DELETE
    USING (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
        AND (status = 'DRAFT' OR total_submissions = 0)
    );

-- 4. TEACHERS: Can delete only their own draft assignments with no submissions
CREATE POLICY "teachers_delete_assignments"
    ON assignments FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
        AND status = 'DRAFT'
        AND total_submissions = 0
    );

-- -------------------------------------------------------------
-- ASSIGNMENT_SUBMISSIONS TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "coaches_select_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "managers_select_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "teachers_select_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "students_select_own_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "admins_insert_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "coaches_insert_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "students_insert_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "admins_update_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "coaches_update_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "teachers_update_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "students_update_own_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "admins_delete_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "coaches_delete_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "teachers_delete_submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "students_delete_own_submissions" ON assignment_submissions;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_submissions"
    ON assignment_submissions FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view all submissions in their coaching centers
CREATE POLICY "coaches_select_submissions"
    ON assignment_submissions FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND class_id IN (
            SELECT bc.id FROM branch_classes bc
            WHERE bc.branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

-- 3. BRANCH MANAGERS: Can view submissions in their managed branches
CREATE POLICY "managers_select_submissions"
    ON assignment_submissions FOR SELECT
    USING (
        class_id IN (
            SELECT bc.id FROM branch_classes bc
            WHERE bc.branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        )
    );

-- 4. TEACHERS: Can view submissions to their assignments
CREATE POLICY "teachers_select_submissions"
    ON assignment_submissions FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND assignment_id IN (
            SELECT id FROM assignments WHERE teacher_id = auth.uid()
        )
    );

-- 5. STUDENTS: Can view only their own submissions
CREATE POLICY "students_select_own_submissions"
    ON assignment_submissions FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
    );

-- INSERT POLICIES (Create/Submit Access)
-- 1. ADMINS & SUPER ADMINS: Can create any submission
CREATE POLICY "admins_insert_submissions"
    ON assignment_submissions FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can create submissions in their coaching centers
CREATE POLICY "coaches_insert_submissions"
    ON assignment_submissions FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. STUDENTS: Can submit to assignments in their enrolled classes
CREATE POLICY "students_insert_submissions"
    ON assignment_submissions FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
        AND class_id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = auth.uid()
        )
        AND assignment_id IN (
            SELECT id FROM assignments
            WHERE is_visible = TRUE
            AND status = 'PUBLISHED'
            AND (close_date IS NULL OR close_date > NOW())
        )
    );

-- UPDATE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can update any submission
CREATE POLICY "admins_update_submissions"
    ON assignment_submissions FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can update/grade submissions in their coaching centers
CREATE POLICY "coaches_update_submissions"
    ON assignment_submissions FOR UPDATE
    USING (public.get_user_role(auth.uid()) = 'C')
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. TEACHERS: Can update/grade submissions to their assignments
CREATE POLICY "teachers_update_submissions"
    ON assignment_submissions FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND assignment_id IN (
            SELECT id FROM assignments WHERE teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND assignment_id IN (
            SELECT id FROM assignments WHERE teacher_id = auth.uid()
        )
    );

-- 4. STUDENTS: Can update their own ungraded submissions before deadline
CREATE POLICY "students_update_own_submissions"
    ON assignment_submissions FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
        AND grading_status = 'NOT_GRADED'
        AND assignment_id IN (
            SELECT id FROM assignments
            WHERE close_date IS NULL OR close_date > NOW()
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
    );

-- DELETE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can delete any submission
CREATE POLICY "admins_delete_submissions"
    ON assignment_submissions FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can delete submissions in their coaching centers
CREATE POLICY "coaches_delete_submissions"
    ON assignment_submissions FOR DELETE
    USING (public.get_user_role(auth.uid()) = 'C');

-- 3. TEACHERS: Can delete ungraded submissions to their assignments
CREATE POLICY "teachers_delete_submissions"
    ON assignment_submissions FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND assignment_id IN (
            SELECT id FROM assignments WHERE teacher_id = auth.uid()
        )
        AND grading_status = 'NOT_GRADED'
    );

-- 4. STUDENTS: Can delete their own ungraded submissions before deadline
CREATE POLICY "students_delete_own_submissions"
    ON assignment_submissions FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
        AND grading_status = 'NOT_GRADED'
        AND assignment_id IN (
            SELECT id FROM assignments
            WHERE close_date IS NULL OR close_date > NOW()
        )
    );

-- -------------------------------------------------------------
-- QUIZZES TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_select_quizzes" ON quizzes;
DROP POLICY IF EXISTS "managers_select_quizzes" ON quizzes;
DROP POLICY IF EXISTS "teachers_select_quizzes" ON quizzes;
DROP POLICY IF EXISTS "students_select_quizzes" ON quizzes;
DROP POLICY IF EXISTS "admins_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "managers_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "teachers_insert_quizzes" ON quizzes;
DROP POLICY IF EXISTS "admins_update_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_update_quizzes" ON quizzes;
DROP POLICY IF EXISTS "managers_update_quizzes" ON quizzes;
DROP POLICY IF EXISTS "teachers_update_quizzes" ON quizzes;
DROP POLICY IF EXISTS "admins_delete_quizzes" ON quizzes;
DROP POLICY IF EXISTS "coaches_delete_quizzes" ON quizzes;
DROP POLICY IF EXISTS "managers_delete_quizzes" ON quizzes;
DROP POLICY IF EXISTS "teachers_delete_quizzes" ON quizzes;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_quizzes"
    ON quizzes FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view all quizzes in their coaching centers
CREATE POLICY "coaches_select_quizzes"
    ON quizzes FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- 3. BRANCH MANAGERS: Can view quizzes in their managed branches
CREATE POLICY "managers_select_quizzes"
    ON quizzes FOR SELECT
    USING (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can view their own quizzes and quizzes in their classes
CREATE POLICY "teachers_select_quizzes"
    ON quizzes FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND (
            teacher_id = auth.uid()
            OR class_id IN (
                SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
            )
        )
    );

-- 5. STUDENTS: Can view only active quizzes for their enrolled classes during available time
CREATE POLICY "students_select_quizzes"
    ON quizzes FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND is_active = TRUE
        AND available_from <= NOW()
        AND available_to >= NOW()
        AND class_id IN (
            SELECT class_id FROM class_enrollments 
            WHERE student_id = auth.uid()
        )
    );

-- INSERT POLICIES (Create Access)
-- 1. ADMINS & SUPER ADMINS: Can create any quiz
CREATE POLICY "admins_insert_quizzes"
    ON quizzes FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can create quizzes in their coaching centers
CREATE POLICY "coaches_insert_quizzes"
    ON quizzes FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- 3. BRANCH MANAGERS: Can create quizzes in their managed branches
CREATE POLICY "managers_insert_quizzes"
    ON quizzes FOR INSERT
    WITH CHECK (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can create quizzes for their classes
CREATE POLICY "teachers_insert_quizzes"
    ON quizzes FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
        AND class_id IN (
            SELECT class_id FROM public.get_user_teaching_class_ids(auth.uid())
        )
        AND branch_id IN (
            SELECT bc.branch_id FROM branch_classes bc WHERE bc.id = class_id
        )
    );

-- UPDATE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can update any quiz
CREATE POLICY "admins_update_quizzes"
    ON quizzes FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can update quizzes in their coaching centers
CREATE POLICY "coaches_update_quizzes"
    ON quizzes FOR UPDATE
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

-- 3. BRANCH MANAGERS: Can update quizzes in their managed branches
CREATE POLICY "managers_update_quizzes"
    ON quizzes FOR UPDATE
    USING (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    )
    WITH CHECK (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- 4. TEACHERS: Can update only their own quizzes
CREATE POLICY "teachers_update_quizzes"
    ON quizzes FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
    );

-- DELETE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can delete any quiz
CREATE POLICY "admins_delete_quizzes"
    ON quizzes FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can delete quizzes in their coaching centers
CREATE POLICY "coaches_delete_quizzes"
    ON quizzes FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND branch_id IN (
            SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
        )
    );

-- 3. BRANCH MANAGERS: Can delete quizzes in their managed branches (with restrictions)
CREATE POLICY "managers_delete_quizzes"
    ON quizzes FOR DELETE
    USING (
        branch_id IN (
            SELECT id FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
        AND total_attempts = 0
    );

-- 4. TEACHERS: Can delete only their own quizzes with no attempts
CREATE POLICY "teachers_delete_quizzes"
    ON quizzes FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND teacher_id = auth.uid()
        AND total_attempts = 0
    );

-- -------------------------------------------------------------
-- QUIZ_QUESTIONS TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_questions" ON quiz_questions;
DROP POLICY IF EXISTS "coaches_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "managers_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "teachers_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "students_select_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admins_insert_questions" ON quiz_questions;
DROP POLICY IF EXISTS "coaches_insert_questions" ON quiz_questions;
DROP POLICY IF EXISTS "teachers_insert_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admins_update_questions" ON quiz_questions;
DROP POLICY IF EXISTS "coaches_update_questions" ON quiz_questions;
DROP POLICY IF EXISTS "teachers_update_questions" ON quiz_questions;
DROP POLICY IF EXISTS "admins_delete_questions" ON quiz_questions;
DROP POLICY IF EXISTS "coaches_delete_questions" ON quiz_questions;
DROP POLICY IF EXISTS "teachers_delete_questions" ON quiz_questions;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_questions"
    ON quiz_questions FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view questions for quizzes in their coaching centers
CREATE POLICY "coaches_select_questions"
    ON quiz_questions FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

-- 3. BRANCH MANAGERS: Can view questions in their managed branches
CREATE POLICY "managers_select_questions"
    ON quiz_questions FOR SELECT
    USING (
        quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        )
    );

-- 4. TEACHERS: Can view questions for their quizzes
CREATE POLICY "teachers_select_questions"
    ON quiz_questions FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    );

-- -------------------------------------------------------------
-- QUIZ_QUESTIONS TABLE - RLS POLICIES (UPDATED)
-- -------------------------------------------------------------

-- Drop existing student policy
DROP POLICY IF EXISTS "students_select_questions" ON quiz_questions;

-- SELECT POLICIES (Read Access) - UPDATED FOR STUDENTS
-- 5. STUDENTS: Can view questions only during active quiz attempts OR after quiz period ends (for review)
CREATE POLICY "students_select_questions"
    ON quiz_questions FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND (
            -- Option 1: During active quiz attempt
            quiz_id IN (
                SELECT quiz_id FROM quiz_attempts 
                WHERE student_id = auth.uid()
                AND attempt_status = 'IN_PROGRESS'
            )
            OR
            -- Option 2: After quiz availability period has ended AND quiz is active
            (
                quiz_id IN (
                    SELECT q.id FROM quizzes q
                    WHERE q.is_active = TRUE
                    AND q.available_to < NOW()  -- Quiz period has ended
                    AND q.id IN (
                        SELECT quiz_id FROM quiz_attempts 
                        WHERE student_id = auth.uid()
                        AND attempt_status = 'COMPLETED'
                    )
                )
            )
        )
    );

COMMENT ON POLICY "students_select_questions" ON quiz_questions IS 
'Students can view questions:
1. During active (IN_PROGRESS) quiz attempts
2. AFTER quiz period ends (available_to < NOW()) for completed attempts, if quiz is still active
Allows review of questions after quiz window closes for learning purposes.';

-- INSERT, UPDATE, DELETE POLICIES (Only staff can manage questions)
-- 1. ADMINS & SUPER ADMINS: Full control
CREATE POLICY "admins_insert_questions"
    ON quiz_questions FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

CREATE POLICY "admins_update_questions"
    ON quiz_questions FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

CREATE POLICY "admins_delete_questions"
    ON quiz_questions FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can manage questions in their coaching centers
CREATE POLICY "coaches_insert_questions"
    ON quiz_questions FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'C'
        AND quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

CREATE POLICY "coaches_update_questions"
    ON quiz_questions FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'C'
        AND quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

CREATE POLICY "coaches_delete_questions"
    ON quiz_questions FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

-- 3. TEACHERS: Can manage questions for their quizzes
CREATE POLICY "teachers_insert_questions"
    ON quiz_questions FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    );

CREATE POLICY "teachers_update_questions"
    ON quiz_questions FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    );

CREATE POLICY "teachers_delete_questions"
    ON quiz_questions FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    );

-- -------------------------------------------------------------
-- QUIZ_ATTEMPTS TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "coaches_select_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "managers_select_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "teachers_select_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "students_select_own_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "admins_insert_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "coaches_insert_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "students_insert_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "admins_update_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "coaches_update_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "teachers_update_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "students_update_own_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "admins_delete_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "coaches_delete_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "teachers_delete_attempts" ON quiz_attempts;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_attempts"
    ON quiz_attempts FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view attempts in their coaching centers
CREATE POLICY "coaches_select_attempts"
    ON quiz_attempts FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

-- 3. BRANCH MANAGERS: Can view attempts in their managed branches
CREATE POLICY "managers_select_attempts"
    ON quiz_attempts FOR SELECT
    USING (
        quiz_id IN (
            SELECT id FROM quizzes 
            WHERE branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        )
    );

-- 4. TEACHERS: Can view attempts for their quizzes
CREATE POLICY "teachers_select_attempts"
    ON quiz_attempts FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    );

-- 5. STUDENTS: Can view only their own attempts
CREATE POLICY "students_select_own_attempts"
    ON quiz_attempts FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
    );

-- INSERT POLICIES (Start Quiz)
-- 1. ADMINS & SUPER ADMINS: Can create any attempt
CREATE POLICY "admins_insert_attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can create attempts in their coaching centers
CREATE POLICY "coaches_insert_attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. STUDENTS: Can start quiz attempts for available quizzes
CREATE POLICY "students_insert_attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
        AND quiz_id IN (
            SELECT id FROM quizzes
            WHERE is_active = TRUE
            AND available_from <= NOW()
            AND available_to >= NOW()
            AND class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = auth.uid()
            )
        )
        -- Check max attempts not exceeded
        AND attempt_number <= (SELECT max_attempts FROM quizzes WHERE id = quiz_id)
    );

-- UPDATE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can update any attempt
CREATE POLICY "admins_update_attempts"
    ON quiz_attempts FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can update attempts in their coaching centers
CREATE POLICY "coaches_update_attempts"
    ON quiz_attempts FOR UPDATE
    USING (public.get_user_role(auth.uid()) = 'C')
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. TEACHERS: Can update attempts for their quizzes
CREATE POLICY "teachers_update_attempts"
    ON quiz_attempts FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
    );

-- 4. STUDENTS: Can update/submit their own in-progress attempts
CREATE POLICY "students_update_own_attempts"
    ON quiz_attempts FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
        AND attempt_status = 'IN_PROGRESS'
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND student_id = auth.uid()
    );

-- DELETE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can delete any attempt
CREATE POLICY "admins_delete_attempts"
    ON quiz_attempts FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can delete attempts in their coaching centers
CREATE POLICY "coaches_delete_attempts"
    ON quiz_attempts FOR DELETE
    USING (public.get_user_role(auth.uid()) = 'C');

-- 3. TEACHERS: Can delete incomplete attempts for their quizzes
CREATE POLICY "teachers_delete_attempts"
    ON quiz_attempts FOR DELETE
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND quiz_id IN (
            SELECT id FROM quizzes WHERE teacher_id = auth.uid()
        )
        AND attempt_status IN ('IN_PROGRESS', 'ABANDONED')
    );

-- -------------------------------------------------------------
-- QUIZ_RESPONSES TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_responses" ON quiz_responses;
DROP POLICY IF EXISTS "coaches_select_responses" ON quiz_responses;
DROP POLICY IF EXISTS "managers_select_responses" ON quiz_responses;
DROP POLICY IF EXISTS "teachers_select_responses" ON quiz_responses;
DROP POLICY IF EXISTS "students_select_own_responses" ON quiz_responses;
DROP POLICY IF EXISTS "admins_insert_responses" ON quiz_responses;
DROP POLICY IF EXISTS "coaches_insert_responses" ON quiz_responses;
DROP POLICY IF EXISTS "students_insert_responses" ON quiz_responses;
DROP POLICY IF EXISTS "admins_update_responses" ON quiz_responses;
DROP POLICY IF EXISTS "coaches_update_responses" ON quiz_responses;
DROP POLICY IF EXISTS "students_update_responses" ON quiz_responses;
DROP POLICY IF EXISTS "admins_delete_responses" ON quiz_responses;
DROP POLICY IF EXISTS "coaches_delete_responses" ON quiz_responses;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_responses"
    ON quiz_responses FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view responses in their coaching centers
CREATE POLICY "coaches_select_responses"
    ON quiz_responses FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'C'
        AND attempt_id IN (
            SELECT a.id FROM quiz_attempts a
            JOIN quizzes q ON q.id = a.quiz_id
            WHERE q.branch_id IN (
                SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
            )
        )
    );

-- 3. BRANCH MANAGERS: Can view responses in their managed branches
CREATE POLICY "managers_select_responses"
    ON quiz_responses FOR SELECT
    USING (
        attempt_id IN (
            SELECT a.id FROM quiz_attempts a
            JOIN quizzes q ON q.id = a.quiz_id
            WHERE q.branch_id IN (
                SELECT id FROM coaching_branches 
                WHERE manager_id = auth.uid()
            )
        )
    );

-- 4. TEACHERS: Can view responses for their quizzes
CREATE POLICY "teachers_select_responses"
    ON quiz_responses FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'T'
        AND attempt_id IN (
            SELECT a.id FROM quiz_attempts a
            JOIN quizzes q ON q.id = a.quiz_id
            WHERE q.teacher_id = auth.uid()
        )
    );

-- 5. STUDENTS: Can view their own responses (with restrictions based on quiz settings)
CREATE POLICY "students_select_own_responses"
    ON quiz_responses FOR SELECT
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND attempt_id IN (
            SELECT id FROM quiz_attempts WHERE student_id = auth.uid()
        )
        -- Can view during attempt or after if quiz allows
        AND (
            attempt_id IN (
                SELECT id FROM quiz_attempts 
                WHERE student_id = auth.uid() 
                AND attempt_status = 'IN_PROGRESS'
            )
            OR
            (
                attempt_id IN (
                    SELECT id FROM quiz_attempts 
                    WHERE student_id = auth.uid() 
                    AND attempt_status = 'COMPLETED'
                )
                AND EXISTS (
                    SELECT 1 FROM quiz_attempts qa
                    JOIN quizzes q ON q.id = qa.quiz_id
                    WHERE qa.id = attempt_id
                    AND q.show_correct_answers = TRUE
                )
            )
        )
    );

-- INSERT POLICIES (Answer Questions)
-- 1. ADMINS & SUPER ADMINS: Can create any response
CREATE POLICY "admins_insert_responses"
    ON quiz_responses FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can create responses in their coaching centers
CREATE POLICY "coaches_insert_responses"
    ON quiz_responses FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. STUDENTS: Can answer questions for their in-progress attempts
CREATE POLICY "students_insert_responses"
    ON quiz_responses FOR INSERT
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND attempt_id IN (
            SELECT id FROM quiz_attempts 
            WHERE student_id = auth.uid()
            AND attempt_status = 'IN_PROGRESS'
        )
    );

-- UPDATE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can update any response
CREATE POLICY "admins_update_responses"
    ON quiz_responses FOR UPDATE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can update responses in their coaching centers
CREATE POLICY "coaches_update_responses"
    ON quiz_responses FOR UPDATE
    USING (public.get_user_role(auth.uid()) = 'C')
    WITH CHECK (public.get_user_role(auth.uid()) = 'C');

-- 3. STUDENTS: Can update their responses for in-progress attempts
CREATE POLICY "students_update_responses"
    ON quiz_responses FOR UPDATE
    USING (
        public.get_user_role(auth.uid()) = 'S'
        AND attempt_id IN (
            SELECT id FROM quiz_attempts 
            WHERE student_id = auth.uid()
            AND attempt_status = 'IN_PROGRESS'
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'S'
        AND attempt_id IN (
            SELECT id FROM quiz_attempts 
            WHERE student_id = auth.uid()
            AND attempt_status = 'IN_PROGRESS'
        )
    );

-- DELETE POLICIES
-- 1. ADMINS & SUPER ADMINS: Can delete any response
CREATE POLICY "admins_delete_responses"
    ON quiz_responses FOR DELETE
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can delete responses in their coaching centers
CREATE POLICY "coaches_delete_responses"
    ON quiz_responses FOR DELETE
    USING (public.get_user_role(auth.uid()) = 'C');

-- -------------------------------------------------------------
-- CLEANUP_LOGS TABLE - RLS POLICIES
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select_all_cleanup_logs" ON cleanup_logs;
DROP POLICY IF EXISTS "coaches_select_cleanup_logs" ON cleanup_logs;
DROP POLICY IF EXISTS "managers_select_cleanup_logs" ON cleanup_logs;
DROP POLICY IF EXISTS "system_insert_cleanup_logs" ON cleanup_logs;

-- SELECT POLICIES (Read Access)
-- 1. ADMINS & SUPER ADMINS: Full access
CREATE POLICY "admins_select_all_cleanup_logs"
    ON cleanup_logs FOR SELECT
    USING (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- 2. COACHES: Can view cleanup logs for their coaching centers
CREATE POLICY "coaches_select_cleanup_logs"
    ON cleanup_logs FOR SELECT
    USING (public.get_user_role(auth.uid()) = 'C');

-- 3. BRANCH MANAGERS: Can view cleanup logs
CREATE POLICY "managers_select_cleanup_logs"
    ON cleanup_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM coaching_branches 
            WHERE manager_id = auth.uid()
        )
    );

-- INSERT POLICIES
-- 1. Only system/admins can insert cleanup logs
CREATE POLICY "system_insert_cleanup_logs"
    ON cleanup_logs FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) IN ('A', 'SA'));

-- -------------------------------------------------------------
-- FEE_RECEIPTS TABLE - RLS POLICIES (YOUR EXAMPLE)
-- -------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "managers_insert_branch_receipts" ON fee_receipts;

-- 3. BRANCH MANAGERS: Can insert receipts in their managed branches only
CREATE POLICY "managers_insert_branch_receipts"
    ON fee_receipts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM coaching_branches cb
            WHERE cb.id = fee_receipts.branch_id
            AND cb.manager_id = auth.uid()
        )
    );

-- =============================================================
-- SUMMARY OF CHANGES
-- =============================================================
-- 
-- WHAT CHANGED:
-- 1. ✅ Removed all 'BM' role checks: public.get_user_role(auth.uid()) = 'BM'
-- 2. ✅ Replaced with manager_id checks: manager_id = auth.uid()
-- 3. ✅ Replaced class_students with class_enrollments
-- 4. ✅ Branch managers now identified by coaching_branches.manager_id
-- 5. ✅ All other roles (C, SA, A, T, S) remain unchanged
--
-- TABLES UPDATED:
-- - files
-- - assignments
-- - assignment_submissions
-- - quizzes
-- - quiz_questions
-- - quiz_attempts
-- - quiz_responses
-- - cleanup_logs
-- - fee_receipts
--
-- ACCESS CONTROL HIERARCHY:
-- 1. SUPER ADMINS & ADMINS (A, SA) - Full access
-- 2. COACHES (C) - Access within their coaching centers
-- 3. BRANCH MANAGERS - Identified by manager_id in coaching_branches
-- 4. TEACHERS (T) - Can manage their own content
-- 5. STUDENTS (S) - Can view/submit their own work
-- =============================================================