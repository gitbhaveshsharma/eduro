# File Upload Service - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FILE UPLOAD FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Client UI  │
│  (Teacher/   │
│   Student)   │
└──────┬───────┘
       │
       │ uploadFile({ file, assignmentId, uploadType, studentId? })
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    FileUploadService                                      │
│                                                                           │
│  1. Validate User Authentication                                         │
│     ├─ Get current user from Supabase Auth                              │
│     └─ Return error if not authenticated                                │
│                                                                           │
│  2. Validate File                                                        │
│     ├─ Check file size (max 100MB)                                      │
│     ├─ Check MIME type (allowed types only)                             │
│     └─ Validate studentId if uploadType === 'submission'                │
│                                                                           │
│  3. Generate RLS-Compliant Path                                          │
│     ├─ instruction: instruction/{assignmentId}/{timestamp}_file         │
│     ├─ submission: submission/{assignmentId}/{studentId}/{timestamp}    │
│     └─ temp_instruction: assignment_instruction/temp_{userId}/file      │
│                                                                           │
│  4. Upload to Storage                                                    │
│     └─ supabase.storage.from('assignments').upload(filePath, file)     │
│                                                                           │
│  5. Insert Database Record                                               │
│     └─ supabase.from('files').insert({ metadata })                      │
│                                                                           │
│  6. Handle Errors with Rollback                                          │
│     └─ If DB insert fails → Delete uploaded file from storage           │
│                                                                           │
│  7. Return Result                                                        │
│     └─ { success, data: { id, fileName, filePath, ... } }              │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Supabase Storage                                       │
│                                                                           │
│  Bucket: 'assignments' (PRIVATE)                                         │
│                                                                           │
│  ├─ instruction/                                                         │
│  │   └─ {assignmentId}/                                                 │
│  │       └─ {timestamp}_{filename}                                      │
│  │                                                                       │
│  ├─ submission/                                                          │
│  │   └─ {assignmentId}/                                                 │
│  │       └─ {studentId}/                                                │
│  │           └─ {timestamp}_{filename}                                  │
│  │                                                                       │
│  └─ assignment_instruction/                                              │
│      └─ temp_{userId}/                                                   │
│          └─ {timestamp}_{filename}                                       │
│                                                                           │
│  RLS Policies Enforce:                                                   │
│  ✓ Teachers can upload to instruction/ and temp_                        │
│  ✓ Students can upload to submission/{assignmentId}/{their_id}/         │
│  ✓ Users can only read files they have permission for                   │
│  ✓ Admins have full access                                              │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Database: files table                                  │
│                                                                           │
│  Record Created:                                                         │
│  {                                                                        │
│    id: UUID,                          ← Store this in assignments/       │
│    file_name: string,                    submissions tables              │
│    file_path: string,                 ← Full storage path                │
│    file_size: number,                 ← In bytes                         │
│    mime_type: string,                 ← File type                        │
│    storage_provider: 'supabase',                                         │
│    uploaded_by: UUID,                 ← User who uploaded                │
│    context_type: string,              ← 'assignment_instruction' etc     │
│    context_id: UUID,                  ← Assignment ID                    │
│    is_permanent: boolean,             ← false for temp files             │
│    expires_at: timestamp,             ← Auto-cleanup date                │
│    created_at: timestamp,                                                │
│    updated_at: timestamp                                                 │
│  }                                                                        │
│                                                                           │
│  RLS Policies Enforce:                                                   │
│  ✓ Teachers can view their assignment files                             │
│  ✓ Students can view their submission files                             │
│  ✓ Admins/Coaches/Managers have hierarchical access                     │
└──────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      FILE DELETION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Client UI  │
└──────┬───────┘
       │
       │ deleteFileById(fileId) OR deleteFile(filePath)
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    FileUploadService                                      │
│                                                                           │
│  1. Get File Path (if using fileId)                                      │
│     └─ Query files table for file_path by id                            │
│                                                                           │
│  2. Delete from Database                                                 │
│     └─ supabase.from('files').delete().eq('file_path', path)           │
│                                                                           │
│  3. Delete from Storage                                                  │
│     └─ supabase.storage.from('assignments').remove([path])              │
│                                                                           │
│  4. Return Result                                                        │
│     └─ { success: true/false, error?: string }                          │
└──────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      UPLOAD TYPE DECISION TREE                           │
└─────────────────────────────────────────────────────────────────────────┘

                         Upload File?
                              │
                ┌─────────────┼─────────────┐
                │             │             │
           Teacher?      Student?      Admin?
                │             │             │
        ┌───────┴───────┐     │             │
        │               │     │             │
  Creating        Existing    │         Any Type
  Assignment?   Assignment?   │         (All Access)
        │               │     │
        │               │     └─────────────────────┐
        │               │                           │
 temp_instruction   instruction              submission
        │               │                    (requires studentId)
        │               │                           │
        │               │                           │
  Auto-expires    Permanent                   Based on
  in 7 days       (never deleted)             assignment
                                               cleanup
                                               settings


┌─────────────────────────────────────────────────────────────────────────┐
│                      RLS POLICY ENFORCEMENT                              │
└─────────────────────────────────────────────────────────────────────────┘

Path: instruction/{assignmentId}/file.pdf
│
├─ Teacher owns assignment? ✓ Allow Upload/Read/Delete
├─ Student enrolled in class? ✓ Allow Read (if published)
├─ Coach owns coaching center? ✓ Allow Upload/Read/Delete
├─ Manager owns branch? ✓ Allow Upload/Read/Delete
└─ Admin? ✓ Allow All

Path: submission/{assignmentId}/{studentId}/file.pdf
│
├─ studentId === current user? ✓ Allow Upload/Read
├─ Teacher owns assignment? ✓ Allow Read/Delete
├─ Coach owns coaching center? ✓ Allow Read/Delete
├─ Manager owns branch? ✓ Allow Read/Delete
└─ Admin? ✓ Allow All

Path: assignment_instruction/temp_{userId}/file.pdf
│
├─ userId === current user? ✓ Allow Upload/Read/Delete
└─ Admin? ✓ Allow All


┌─────────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING & ROLLBACK                           │
└─────────────────────────────────────────────────────────────────────────┘

Upload Flow:
│
├─ File validation fails
│  └─ Return error (no storage upload)
│
├─ Storage upload fails
│  └─ Return error (no database record)
│
├─ Database insert fails
│  ├─ Delete file from storage ← AUTOMATIC ROLLBACK
│  └─ Return error
│
└─ Success
   └─ Return file metadata with ID


┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA FLOW SUMMARY                                   │
└─────────────────────────────────────────────────────────────────────────┘

1. User uploads file through UI
2. Service validates authentication & file
3. Service generates RLS-compliant path
4. File uploaded to Supabase Storage
5. Record inserted into files table
6. File ID returned to client
7. Client stores file ID in relevant table (assignments/submissions)

For Retrieval:
1. Client has file ID
2. Service queries files table for metadata
3. Service generates signed URL for preview
4. Client displays file with download link

For Deletion:
1. Client requests deletion by file ID
2. Service deletes from files table
3. Service deletes from storage
4. Both operations must succeed
```
