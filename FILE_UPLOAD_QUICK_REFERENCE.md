# File Upload Service - Quick Reference Guide

## Import

```typescript
import { fileUploadService } from "@/lib/branch-system/services/file-upload.service";
import type {
  UploadType,
  UploadFileParams,
  UploadedFileData,
} from "@/lib/branch-system/services/file-upload.service";
```

## Upload Types

| Type                 | Path                                           | Who Can Use | When To Use                                 |
| -------------------- | ---------------------------------------------- | ----------- | ------------------------------------------- |
| `'instruction'`      | `instruction/{assignmentId}/{file}`            | Teachers    | Final assignment instructions               |
| `'submission'`       | `submission/{assignmentId}/{studentId}/{file}` | Students    | Assignment submissions                      |
| `'temp_instruction'` | `assignment_instruction/temp_{userId}/{file}`  | Teachers    | Draft/temp files before assignment creation |

## Common Use Cases

### 1. Teacher Uploads Assignment Instructions

```typescript
const result = await fileUploadService.uploadFile({
  file: instructionFile,
  assignmentId: "assignment-uuid",
  uploadType: "instruction",
});

if (result.success) {
  const fileId = result.data.id; // Store this in assignments table
  const signedUrl = result.data.signedUrl; // Use for preview
}
```

### 2. Student Submits Assignment

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();

const result = await fileUploadService.uploadFile({
  file: submissionFile,
  assignmentId: "assignment-uuid",
  uploadType: "submission",
  studentId: user.id, // REQUIRED
});

if (result.success) {
  // Store result.data.id in assignment_submissions table
}
```

### 3. Teacher Draft Upload (Before Assignment Creation)

```typescript
const result = await fileUploadService.uploadFile({
  file: draftFile,
  assignmentId: "temp", // Any placeholder
  uploadType: "temp_instruction",
});

// Auto-expires in 7 days
```

### 4. Multiple Files Upload

```typescript
const result = await fileUploadService.uploadFiles({
  files: [file1, file2, file3],
  assignmentId: "assignment-uuid",
  uploadType: "instruction",
});

if (result.success) {
  const fileIds = result.data.map((f) => f.id);
}
```

## Deleting Files

### By File Path

```typescript
await fileUploadService.deleteFile("instruction/abc/123_file.pdf");
```

### By File ID (Recommended)

```typescript
await fileUploadService.deleteFileById("file-uuid");
```

## Getting File Info

```typescript
const result = await fileUploadService.getFileById("file-uuid");

if (result.success) {
  console.log(result.data.fileName);
  console.log(result.data.signedUrl); // Preview URL
}
```

## Generating Signed URLs

```typescript
const result = await fileUploadService.getSignedUrl(
  "instruction/abc/file.pdf",
  3600 // Expires in 1 hour
);

if (result.success) {
  const url = result.data; // Use for download/preview
}
```

## Assignment Service Helper

```typescript
import { assignmentService } from "@/lib/branch-system/services/assignment.service";

// For instructions
const result = await assignmentService.uploadFile(
  file,
  assignmentId,
  "instruction"
);

// For submissions
const result = await assignmentService.uploadFile(
  file,
  assignmentId,
  "submission",
  studentId
);
```

## Error Handling

```typescript
const result = await fileUploadService.uploadFile(params);

if (!result.success) {
  switch (true) {
    case result.error?.includes("size"):
      toast.error("File too large (max 100MB)");
      break;
    case result.error?.includes("type"):
      toast.error("File type not allowed");
      break;
    case result.error?.includes("studentId"):
      toast.error("Student ID required for submissions");
      break;
    default:
      toast.error(result.error || "Upload failed");
  }
  return;
}

// Success
toast.success("File uploaded successfully");
```

## Validation

### File Size

- **Max**: 100MB
- **Enforced**: Service + Bucket level

### Allowed File Types

- Documents: PDF, Word, TXT, RTF
- Images: JPEG, PNG, GIF
- Spreadsheets: Excel, CSV
- Presentations: PowerPoint
- Archives: ZIP

### Required Parameters

| Upload Type        | Required Parameters                         |
| ------------------ | ------------------------------------------- |
| `instruction`      | `file`, `assignmentId`                      |
| `submission`       | `file`, `assignmentId`, `studentId`         |
| `temp_instruction` | `file`, `assignmentId` (can be placeholder) |

## Return Data Structure

```typescript
interface UploadedFileData {
  id: string; // File record UUID (store this!)
  fileName: string; // Original file name
  filePath: string; // Storage path
  fileSize: number; // Size in bytes
  mimeType: string; // File MIME type
  publicUrl: string; // Public URL (requires auth)
  signedUrl?: string; // Temporary signed URL (1 hour)
  contextType: string; // 'assignment_instruction' or 'submission'
  contextId: string; // Assignment ID
}
```

## Best Practices

✅ **DO:**

- Store `result.data.id` in your database
- Use `signedUrl` for previews
- Check `result.success` before accessing `result.data`
- Pass `studentId` for submission uploads
- Use `temp_instruction` for drafts
- Handle errors gracefully with user feedback

❌ **DON'T:**

- Store file paths directly (use IDs)
- Forget to pass `studentId` for submissions
- Ignore validation errors
- Upload without checking file size/type
- Use `publicUrl` for direct access (requires auth)
- Mix up upload types

## Troubleshooting

### "File type not allowed"

- Check file MIME type matches allowed list
- Verify file extension is correct

### "File size exceeds 100MB limit"

- Compress large files before upload
- Split into multiple smaller files

### "studentId is required for submission uploads"

- Always pass `studentId` when `uploadType: 'submission'`
- Get user ID from `supabase.auth.getUser()`

### "Upload failed" (RLS Error)

- Verify user has correct role in profiles table
- Check if user is enrolled in the class (for students)
- Verify teacher owns the assignment (for teachers)
- Check assignment status (must be PUBLISHED for student submissions)

### "Failed to create database record"

- File was uploaded but database insert failed
- Service automatically deletes the uploaded file
- Check Supabase logs for RLS policy issues
- Verify files table permissions

## Testing Checklist

- [ ] Teacher can upload instruction files
- [ ] Student can upload submission files
- [ ] Temp uploads work and expire correctly
- [ ] Multiple file uploads work
- [ ] File deletion removes from both storage and database
- [ ] RLS policies block unauthorized access
- [ ] File size validation works
- [ ] MIME type validation works
- [ ] Signed URLs are generated correctly
- [ ] Error messages are user-friendly

## Related Documentation

- Full Implementation Guide: `FILE_UPLOAD_RLS_IMPLEMENTATION.md`
- RLS Policies: `supabase/migrations/021_021_RLS assignment and bucket.sql`
- Files Table Schema: `supabase/migrations/020_Create assignment and quiz tables.sql`
