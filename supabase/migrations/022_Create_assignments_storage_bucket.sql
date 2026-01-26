-- =============================================================
-- CREATE ASSIGNMENTS STORAGE BUCKET
-- Migration: 022
-- Description: Creates the 'assignments' storage bucket for file uploads
-- WARNING: If bucket already exists as PUBLIC, you need to recreate it as PRIVATE
-- =============================================================

-- Check if bucket exists and is public (needs to be private for RLS)
DO $$
BEGIN
    -- If bucket exists and is public, warn the user
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'assignments' AND public = true) THEN
        RAISE WARNING 'Bucket "assignments" exists but is PUBLIC. For proper RLS, it should be PRIVATE.';
        RAISE WARNING 'Please delete and recreate the bucket, or update it to private in Supabase Dashboard.';
    END IF;
END $$;

-- Create the assignments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignments',
    'assignments',
    false, -- IMPORTANT: Must be private for RLS policies to work
    104857600, -- 100MB limit per file
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-zip-compressed'
    ]
) 
ON CONFLICT (id) DO UPDATE SET
    public = false, -- Ensure it's private
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify bucket creation and settings
DO $$
DECLARE
    bucket_public boolean;
BEGIN
    SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'assignments';
    
    IF bucket_public IS NULL THEN
        RAISE EXCEPTION 'Bucket "assignments" was not created';
    ELSIF bucket_public = true THEN
        RAISE WARNING 'Bucket "assignments" is PUBLIC but should be PRIVATE for security';
    ELSE
        RAISE NOTICE 'Bucket "assignments" created/updated successfully as PRIVATE';
    END IF;
END $$;
