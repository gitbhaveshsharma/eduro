-- =============================================================
-- STORAGE BUCKET POLICIES FOR 'assignments' BUCKET
-- Fixed version - compatible with existing get_user_accessible_branch_ids function
-- =============================================================

-- First, enable RLS on storage bucket (if not already)
-- Bucket should be PRIVATE (not public)

-- =============================================================
-- 1. BUCKET-LEVEL POLICIES
-- =============================================================

-- Drop existing bucket policies if any
DROP POLICY IF EXISTS "Admins can read any file" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can read center files" ON storage.objects;
DROP POLICY IF EXISTS "Managers can read branch files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can read class files" ON storage.objects;
DROP POLICY IF EXISTS "Students can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Managers can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete center files" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete branch files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- =============================================================
-- 2. SELECT/READ POLICIES (Who can view files)
-- =============================================================

-- 2.1 ADMIN/SUPER ADMIN: Can read any file in bucket
CREATE POLICY "Admins can read any file"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignments'
    AND (
        auth.role() = 'authenticated'
        AND public.get_user_role(auth.uid()) IN ('A', 'SA')
    )
);

-- 2.2 COACHES: Can read files from their coaching centers
-- Simplified version - coaches can read files from their branches
CREATE POLICY "Coaches can read center files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'C'
    AND (
        -- Files in instruction/attachment folders for their branches
        (
            (storage.foldername(name))[1] IN ('instruction', 'attachment')
            AND (
                -- Check if assignment/quiz belongs to their branch
                EXISTS (
                    SELECT 1 FROM assignments a
                    WHERE a.id::text = (storage.foldername(name))[2]
                    AND a.branch_id IN (
                        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                    )
                )
                OR
                EXISTS (
                    SELECT 1 FROM quizzes q
                    WHERE q.id::text = (storage.foldername(name))[2]
                    AND q.branch_id IN (
                        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                    )
                )
            )
        )
        OR
        -- Files in submission folders for their branches
        (
            (storage.foldername(name))[1] = 'submission'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments a
                WHERE a.id::text = (storage.foldername(name))[2]
                AND a.branch_id IN (
                    SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                )
            )
        )
        OR
        -- Files they uploaded
        owner = auth.uid()
    )
);

-- 2.3 BRANCH MANAGERS: Can read files from their managed branches
CREATE POLICY "Managers can read branch files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM coaching_branches 
        WHERE manager_id = auth.uid()
    )
    AND (
        -- Files in instruction/attachment folders for their managed branches
        (
            (storage.foldername(name))[1] IN ('instruction', 'attachment')
            AND (
                -- Check if assignment/quiz belongs to their managed branch
                EXISTS (
                    SELECT 1 FROM assignments a
                    JOIN coaching_branches cb ON cb.id = a.branch_id
                    WHERE a.id::text = (storage.foldername(name))[2]
                    AND cb.manager_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM quizzes q
                    JOIN coaching_branches cb ON cb.id = q.branch_id
                    WHERE q.id::text = (storage.foldername(name))[2]
                    AND cb.manager_id = auth.uid()
                )
            )
        )
        OR
        -- Files in submission folders for their managed branches
        (
            (storage.foldername(name))[1] = 'submission'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments a
                JOIN coaching_branches cb ON cb.id = a.branch_id
                WHERE a.id::text = (storage.foldername(name))[2]
                AND cb.manager_id = auth.uid()
            )
        )
        OR
        -- Files they uploaded
        owner = auth.uid()
    )
);

-- 2.4 TEACHERS: Can read files for their classes
CREATE POLICY "Teachers can read class files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'T'
    AND (
        -- Assignment instruction files they created
        (
            (storage.foldername(name))[1] = 'instruction'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments 
                WHERE id::text = (storage.foldername(name))[2]
                AND teacher_id = auth.uid()
            )
        )
        OR
        -- Submission files for their assignments
        (
            (storage.foldername(name))[1] = 'submission'
            AND array_length(storage.foldername(name), 1) >= 3
            AND EXISTS (
                SELECT 1 FROM assignment_submissions s
                JOIN assignments a ON a.id = s.assignment_id
                WHERE a.teacher_id = auth.uid()
                AND s.assignment_id::text = (storage.foldername(name))[2]
                AND s.student_id::text = (storage.foldername(name))[3]
            )
        )
        OR
        -- Quiz attachment files they created
        (
            (storage.foldername(name))[1] = 'attachment'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM quizzes 
                WHERE id::text = (storage.foldername(name))[2]
                AND teacher_id = auth.uid()
            )
        )
        OR
        -- Files they uploaded
        owner = auth.uid()
    )
);

-- 2.5 STUDENTS: Can read their own files and assignment instructions
CREATE POLICY "Students can read own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'S'
    AND (
        -- Their own submission files
        (
            (storage.foldername(name))[1] = 'submission'
            AND array_length(storage.foldername(name), 1) >= 3
            AND (storage.foldername(name))[3] = auth.uid()::text
        )
        OR
        -- Assignment instruction files for their enrolled classes
        (
            (storage.foldername(name))[1] = 'instruction'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments a
                JOIN class_enrollments ce ON ce.class_id = a.class_id
                WHERE a.id::text = (storage.foldername(name))[2]
                AND ce.student_id = auth.uid()
                AND a.is_visible = TRUE
            )
        )
        OR
        -- Files they uploaded
        owner = auth.uid()
    )
);

-- =============================================================
-- 3. INSERT/UPLOAD POLICIES (Who can upload files)
-- =============================================================

-- 3.1 ADMIN/SUPER ADMIN: Can upload any file
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) IN ('A', 'SA')
);

-- 3.2 COACHES: Can upload to their coaching centers
CREATE POLICY "Coaches can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'C'
    AND (
        -- Can upload to instruction/attachment folders for assignments/quizzes in their branches
        (
            (storage.foldername(name))[1] IN ('instruction', 'attachment')
            AND array_length(storage.foldername(name), 1) >= 2
            AND (
                EXISTS (
                    SELECT 1 FROM assignments a
                    WHERE a.id::text = (storage.foldername(name))[2]
                    AND a.branch_id IN (
                        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                    )
                )
                OR
                EXISTS (
                    SELECT 1 FROM quizzes q
                    WHERE q.id::text = (storage.foldername(name))[2]
                    AND q.branch_id IN (
                        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                    )
                )
            )
        )
        OR
        -- Can upload for testing/management (use sparingly)
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('A', 'SA', 'C'))
    )
);

-- 3.3 BRANCH MANAGERS: Can upload to their managed branches
CREATE POLICY "Managers can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM coaching_branches 
        WHERE manager_id = auth.uid()
    )
    AND (
        -- Can upload to instruction/attachment folders in their managed branches
        (
            (storage.foldername(name))[1] IN ('instruction', 'attachment')
            AND array_length(storage.foldername(name), 1) >= 2
            AND (
                EXISTS (
                    SELECT 1 FROM assignments a
                    JOIN coaching_branches cb ON cb.id = a.branch_id
                    WHERE a.id::text = (storage.foldername(name))[2]
                    AND cb.manager_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM quizzes q
                    JOIN coaching_branches cb ON cb.id = q.branch_id
                    WHERE q.id::text = (storage.foldername(name))[2]
                    AND cb.manager_id = auth.uid()
                )
            )
        )
    )
);

-- 3.4 TEACHERS: Can upload assignment/quiz files
CREATE POLICY "Teachers can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'T'
    AND (
        -- Assignment instruction files
        (
            (storage.foldername(name))[1] = 'instruction'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments 
                WHERE id::text = (storage.foldername(name))[2]
                AND teacher_id = auth.uid()
            )
        )
        OR
        -- Quiz attachment files
        (
            (storage.foldername(name))[1] = 'attachment'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM quizzes 
                WHERE id::text = (storage.foldername(name))[2]
                AND teacher_id = auth.uid()
            )
        )
    )
);

-- 3.5 STUDENTS: Can upload only to their own submission folder
CREATE POLICY "Students can upload submissions"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'S'
    AND (
        -- Only to submission folder with their user ID
        (storage.foldername(name))[1] = 'submission'
        AND array_length(storage.foldername(name), 1) >= 3
        AND (storage.foldername(name))[3] = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id::text = (storage.foldername(name))[2]
            AND a.is_visible = TRUE
            AND a.status = 'PUBLISHED'
            AND a.class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = auth.uid()
            )
            AND (a.close_date IS NULL OR a.close_date > NOW())
        )
    )
);

-- =============================================================
-- 4. UPDATE POLICIES (Who can update files)
-- =============================================================

-- 4.1 ADMIN/SUPER ADMIN: Can update any file
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) IN ('A', 'SA')
)
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) IN ('A', 'SA')
);

-- 4.2 File owners can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
)
WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
);

-- =============================================================
-- 5. DELETE POLICIES (Who can delete files)
-- =============================================================

-- 5.1 ADMIN/SUPER ADMIN: Can delete any file
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) IN ('A', 'SA')
);

-- 5.2 COACHES: Can delete files from their coaching centers
CREATE POLICY "Coaches can delete center files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND public.get_user_role(auth.uid()) = 'C'
    AND (
        -- Files in instruction/attachment folders for their branches
        (
            (storage.foldername(name))[1] IN ('instruction', 'attachment')
            AND array_length(storage.foldername(name), 1) >= 2
            AND (
                EXISTS (
                    SELECT 1 FROM assignments a
                    WHERE a.id::text = (storage.foldername(name))[2]
                    AND a.branch_id IN (
                        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                    )
                )
                OR
                EXISTS (
                    SELECT 1 FROM quizzes q
                    WHERE q.id::text = (storage.foldername(name))[2]
                    AND q.branch_id IN (
                        SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                    )
                )
            )
        )
        OR
        -- Files in submission folders for their branches
        (
            (storage.foldername(name))[1] = 'submission'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments a
                WHERE a.id::text = (storage.foldername(name))[2]
                AND a.branch_id IN (
                    SELECT branch_id FROM public.get_user_accessible_branch_ids(auth.uid())
                )
            )
        )
        OR
        -- Files they own
        owner = auth.uid()
    )
);

-- 5.3 BRANCH MANAGERS: Can delete files from their branches
CREATE POLICY "Managers can delete branch files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM coaching_branches 
        WHERE manager_id = auth.uid()
    )
    AND (
        -- Files in instruction/attachment folders for their managed branches
        (
            (storage.foldername(name))[1] IN ('instruction', 'attachment')
            AND array_length(storage.foldername(name), 1) >= 2
            AND (
                EXISTS (
                    SELECT 1 FROM assignments a
                    JOIN coaching_branches cb ON cb.id = a.branch_id
                    WHERE a.id::text = (storage.foldername(name))[2]
                    AND cb.manager_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM quizzes q
                    JOIN coaching_branches cb ON cb.id = q.branch_id
                    WHERE q.id::text = (storage.foldername(name))[2]
                    AND cb.manager_id = auth.uid()
                )
            )
        )
        OR
        -- Files in submission folders for their managed branches
        (
            (storage.foldername(name))[1] = 'submission'
            AND array_length(storage.foldername(name), 1) >= 2
            AND EXISTS (
                SELECT 1 FROM assignments a
                JOIN coaching_branches cb ON cb.id = a.branch_id
                WHERE a.id::text = (storage.foldername(name))[2]
                AND cb.manager_id = auth.uid()
            )
        )
        OR
        -- Files they own
        owner = auth.uid()
    )
);

-- 5.4 File owners can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
);

-- =============================================================
-- 6. SIMPLE ACCESS CHECK FUNCTION (Optional)
-- =============================================================

-- Simplified function to check file access without complex logic
CREATE OR REPLACE FUNCTION public.check_storage_access(
    user_id UUID,
    file_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin/super admin
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role IN ('A', 'SA')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- For other users, rely on RLS policies
    -- This function just returns TRUE and lets RLS handle the rest
    RETURN TRUE;
END;
$$;

-- =============================================================
-- 7. CREATE BUCKET IF NOT EXISTS
-- =============================================================

-- Create bucket first (run this separately)
/*
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'assignments',
        'assignments',
        false,
        52428800, -- 50MB limit
        ARRAY[
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/zip',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Bucket "assignments" created/verified';
END $$;
*/

-- =============================================================
-- 8. INSTALLATION STEPS
-- =============================================================

/*
STEP 1: Create the bucket (run once)
------------------------------------
Run this in Supabase SQL Editor:

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assignments', 'assignments', false, 52428800);

STEP 2: Create the RLS policies
--------------------------------
Copy and run all the CREATE POLICY statements above.

STEP 3: Test the setup
----------------------
-- Test as admin
SELECT * FROM storage.objects 
WHERE bucket_id = 'assignments';

-- Test upload (from your application code)
const { data, error } = await supabase.storage
  .from('assignments')
  .upload('instruction/assignment-uuid/filename.pdf', file);

STEP 4: Update your service
---------------------------
Update your AssignmentService to use storage instead of BYTEA.
*/