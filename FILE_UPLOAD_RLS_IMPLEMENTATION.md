# File Upload Service - RLS-Compliant Implementation

## Overview

The FileUploadService has been completely refactored to work with Supabase Storage bucket RLS policies and integrate with the `files` table for proper tracking and management.

## What Changed

### 1. **RLS-Compliant File Paths**

The service now generates file paths that match the storage bucket RLS policies:

| Upload Type        | Path Format                                                    | Example                                                    | Use Case                                            |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `instruction`      | `instruction/{assignmentId}/{timestamp}_{filename}`            | `instruction/abc123/1234567890_syllabus.pdf`               | Teacher uploading assignment instructions           |
| `submission`       | `submission/{assignmentId}/{studentId}/{timestamp}_{filename}` | `submission/abc123/user456/1234567890_homework.pdf`        | Student submitting assignment                       |
| `temp_instruction` | `assignment_instruction/temp_{userId}/{timestamp}_{filename}`  | `assignment_instruction/temp_user123/1234567890_draft.pdf` | Teacher temporary upload before assignment creation |

### 2. **Files Table Integration**

Every file upload now creates a record in the `files` table with:

- File metadata (name, size, MIME type, path)
- Context tracking (what the file is for)
- Auto-cleanup settings (expiry dates for temp files)
- Ownership tracking (who uploaded it)

**Files Table Schema:**

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  storage_provider TEXT DEFAULT 'supabase',
  uploaded_by UUID REFERENCES auth.users(id),
  context_type TEXT, -- 'assignment_instruction', 'submission'
  context_id UUID,   -- assignment_id or quiz_id
  expires_at TIMESTAMPTZ, -- Auto-cleanup date
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **Updated Interfaces**

#### UploadFileParams (NEW)

```typescript
export interface UploadFileParams {
  file: File; // File object to upload
  assignmentId: string; // Assignment context
  uploadType: "instruction" | "submission" | "temp_instruction";
  studentId?: string; // Required for 'submission' type
}
```

#### UploadedFileData (UPDATED)

```typescript
export interface UploadedFileData {
  id: string; // NEW: File record ID from files table
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
  signedUrl?: string;
  contextType: string; // NEW: Context type for tracking
  contextId: string; // NEW: Context ID (assignmentId)
}
```

### 4. **New Methods**

#### `deleteFileById(fileId: string)`

Delete a file using its database record ID instead of file path.

```typescript
const result = await fileUploadService.deleteFileById("file-uuid-here");
```

#### `getFileById(fileId: string)`

Retrieve file metadata and generate a signed URL.

```typescript
const result = await fileUploadService.getFileById("file-uuid-here");
// Returns: { id, fileName, filePath, fileSize, mimeType, signedUrl }
```

#### `getSignedUrl(filePath: string, expiresIn: number)`

Generate a signed URL for direct file access.

```typescript
const result = await fileUploadService.getSignedUrl("path/to/file", 3600);
// Returns signed URL valid for 1 hour
```

## Usage Examples

### Teacher Uploading Assignment Instructions

```typescript
import { fileUploadService } from "@/lib/branch-system/services/file-upload.service";

// Upload instruction file
const result = await fileUploadService.uploadFile({
  file: instructionFile,
  assignmentId: "assignment-uuid",
  uploadType: "instruction",
});

if (result.success && result.data) {
  console.log("File ID:", result.data.id);
  console.log("File Path:", result.data.filePath);
  console.log("Signed URL:", result.data.signedUrl);

  // Store file ID in assignment record
  // UPDATE assignments SET instruction_file = result.data.id WHERE id = assignmentId
}
```

### Student Submitting Assignment

```typescript
// Get current user ID
const {
  data: { user },
} = await supabase.auth.getUser();

// Upload submission
const result = await fileUploadService.uploadFile({
  file: submissionFile,
  assignmentId: "assignment-uuid",
  uploadType: "submission",
  studentId: user.id, // REQUIRED for submissions
});

if (result.success && result.data) {
  // Store file ID in submission record
  // UPDATE assignment_submissions
  // SET submission_file = result.data.id
  // WHERE assignment_id = assignmentId AND student_id = user.id
}
```

### Teacher Creating Draft Assignment (Temp Upload)

```typescript
// Upload temp file before assignment is created
const result = await fileUploadService.uploadFile({
  file: draftFile,
  assignmentId: "temp-placeholder", // Can be any string
  uploadType: "temp_instruction",
});

// Later, when assignment is created, move file or upload again with 'instruction' type
```

### Batch Upload (Multiple Files)

```typescript
const result = await fileUploadService.uploadFiles({
  files: [file1, file2, file3],
  assignmentId: "assignment-uuid",
  uploadType: "instruction",
});

if (result.success && result.data) {
  console.log(`Uploaded ${result.data.length} files`);
  result.data.forEach((file) => {
    console.log(`- ${file.fileName} (ID: ${file.id})`);
  });
}
```

### Deleting Files

```typescript
// Delete by file path
await fileUploadService.deleteFile("instruction/abc123/1234567890_file.pdf");

// Delete by file ID (recommended)
await fileUploadService.deleteFileById("file-uuid");
```

## Assignment Service Integration

The `AssignmentService.uploadFile` method has been updated to support the new interface:

```typescript
// Upload with specific type
const result = await assignmentService.uploadFile(
  file,
  assignmentId,
  "instruction" // or 'submission' or 'temp_instruction'
);

// For student submissions
const result = await assignmentService.uploadFile(
  file,
  assignmentId,
  "submission",
  studentId // Required for submissions
);
```

## Storage Bucket RLS Policies

The implementation works with these RLS policies:

### Teachers Can:

- Upload to `instruction/{assignmentId}/*` for their assignments
- Upload to `assignment_instruction/temp_{userId}/*` for drafts
- Read submission files from their students
- Delete their own uploaded files

### Students Can:

- Upload to `submission/{assignmentId}/{studentId}/*` for enrolled classes
- Read instruction files for their enrolled classes
- Read their own submission files
- Cannot delete files (teacher permission required)

### Admins Can:

- Full access to all files
- Upload, read, update, delete any file

### Coaches & Managers Can:

- Access files within their coaching centers/branches
- Manage assignments and submissions for their branches

## Validation & Security

### File Size Limit

- Maximum: 100MB per file
- Enforced at both service and bucket level

### Allowed MIME Types

```typescript
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
];
```

### Automatic Cleanup

- **Instruction files**: Permanent (never auto-deleted)
- **Submission files**: Deleted based on assignment cleanup settings
- **Temp files**: Expire after 7 days

## Error Handling

The service includes comprehensive error handling:

1. **Validation Errors**: Invalid uploadType, missing studentId, file size/type violations
2. **Storage Errors**: Upload failures, bucket access issues
3. **Database Errors**: Failed to create file record (with automatic rollback)
4. **Rollback on Failure**: If database insert fails, uploaded file is automatically deleted

Example error handling:

```typescript
const result = await fileUploadService.uploadFile(params);

if (!result.success) {
  console.error("Upload failed:", result.error);
  // Show error to user
  return;
}

// Success - use result.data
```

## Migration Notes

### Breaking Changes

1. `uploadFile` now requires `uploadType` parameter
2. `uploadFiles` now requires `uploadType` parameter
3. `UploadedFileData` interface includes new fields: `id`, `contextType`, `contextId`
4. File paths have changed format

### Migration Steps

1. Update all calls to `fileUploadService.uploadFile()` to include `uploadType`
2. Update all calls to `fileUploadService.uploadFiles()` to include `uploadType`
3. For student submissions, pass `studentId` parameter
4. Update any code that references `result.data.file_name` to `result.data.fileName`
5. Store `result.data.id` in your database records instead of just file paths

## Testing

Test file available at:
`/app/(lms)/lms/(teachers)/teacher/[centerId]/_components/assignments/AdvancedUploadDiagnostics.tsx`

This component has been updated to use the new interface with `uploadType: 'temp_instruction'`.

## Related Files

- **Service**: `lib/branch-system/services/file-upload.service.tsx`
- **Assignment Service**: `lib/branch-system/services/assignment.service.ts`
- **Migration**: `supabase/migrations/020_Create assignment and quiz tables.sql`
- **RLS Policies**: `supabase/migrations/021_021_RLS assignment and bucket.sql`
- **Bucket Creation**: `supabase/migrations/022_Create_assignments_storage_bucket.sql`

## Benefits

✅ **RLS Compliance**: All uploads respect storage bucket RLS policies  
✅ **Database Tracking**: Every file is tracked in the files table  
✅ **Auto-Cleanup**: Temp files automatically expire after 7 days  
✅ **Type Safety**: Full TypeScript support with proper interfaces  
✅ **Error Recovery**: Automatic rollback on database insert failure  
✅ **Flexible Access**: Support for multiple upload types and contexts  
✅ **Audit Trail**: Track who uploaded what and when  
✅ **Signed URLs**: Secure, temporary access to private files

## Support

For issues or questions:

1. Check the RLS policies in the migration files
2. Verify user has correct role in `profiles` table
3. Check if assignment/class relationships are correct
4. Review storage bucket settings in Supabase dashboard
5. Check console for detailed error messages
