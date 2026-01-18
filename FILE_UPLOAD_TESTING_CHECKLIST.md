# File Upload Service - Testing & Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Review

- [x] FileUploadService updated with RLS-compliant paths
- [x] Files table insert/update/delete operations implemented
- [x] Assignment service integration updated
- [x] Test component updated
- [x] No TypeScript compilation errors
- [x] All imports and exports correct

### ✅ Documentation

- [x] Implementation guide created (FILE_UPLOAD_RLS_IMPLEMENTATION.md)
- [x] Quick reference guide created (FILE_UPLOAD_QUICK_REFERENCE.md)
- [x] Architecture diagram created (FILE_UPLOAD_ARCHITECTURE.md)
- [x] Summary document created (FILE_UPLOAD_SUMMARY.md)

## Database Verification

### Tables

- [ ] `files` table exists with correct schema
- [ ] `assignments` table has `instruction_file` column (UUID reference to files)
- [ ] `assignment_submissions` table has `submission_file` column (UUID reference to files)
- [ ] All foreign key constraints in place

### RLS Policies - Files Table

- [ ] Admins can select/insert/update/delete all files
- [ ] Coaches can manage files in their coaching centers
- [ ] Managers can manage files in their managed branches
- [ ] Teachers can manage files for their classes
- [ ] Students can view their own submission files
- [ ] Students can view instruction files for enrolled classes

### RLS Policies - Storage Bucket

- [ ] Storage bucket 'assignments' exists and is PRIVATE
- [ ] Bucket size limit: 100MB
- [ ] Allowed MIME types configured
- [ ] Teachers can upload to `instruction/` and `assignment_instruction/temp_`
- [ ] Students can upload to `submission/{assignmentId}/{studentId}/`
- [ ] Read policies match expected access patterns

## Functional Testing

### Teacher Upload Tests

#### Test 1: Upload Assignment Instruction

```typescript
const file = new File(["test"], "instruction.pdf", { type: "application/pdf" });
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "valid-assignment-id",
  uploadType: "instruction",
});
```

- [ ] File uploads successfully
- [ ] Path format: `instruction/{assignmentId}/{timestamp}_instruction.pdf`
- [ ] Database record created in files table
- [ ] `is_permanent` = true
- [ ] `expires_at` = null
- [ ] `context_type` = 'assignment_instruction'
- [ ] File ID returned in response
- [ ] Signed URL generated

#### Test 2: Upload Temp File

```typescript
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "temp",
  uploadType: "temp_instruction",
});
```

- [ ] File uploads successfully
- [ ] Path format: `assignment_instruction/temp_{userId}/{timestamp}_file.pdf`
- [ ] `is_permanent` = false
- [ ] `expires_at` = 7 days from now
- [ ] Teacher can read their own temp files
- [ ] Other users cannot access temp files

### Student Upload Tests

#### Test 3: Upload Submission

```typescript
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "assignment-id",
  uploadType: "submission",
  studentId: "student-user-id",
});
```

- [ ] File uploads successfully
- [ ] Path format: `submission/{assignmentId}/{studentId}/{timestamp}_file.pdf`
- [ ] Database record created
- [ ] Student can read their own submission
- [ ] Teacher can read student submission
- [ ] Other students cannot read this submission

#### Test 4: Student Cannot Upload Wrong studentId

```typescript
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "assignment-id",
  uploadType: "submission",
  studentId: "different-student-id", // Wrong ID
});
```

- [ ] Upload fails with RLS error
- [ ] Error message indicates permission denied

### Multiple File Upload Tests

#### Test 5: Upload Multiple Files

```typescript
const result = await fileUploadService.uploadFiles({
  files: [file1, file2, file3],
  assignmentId: "assignment-id",
  uploadType: "instruction",
});
```

- [ ] All files upload successfully
- [ ] All database records created
- [ ] All file IDs returned
- [ ] Partial failure handled correctly (some succeed, some fail)

### File Deletion Tests

#### Test 6: Delete by File Path

```typescript
const result = await fileUploadService.deleteFile(
  "instruction/abc/123_file.pdf"
);
```

- [ ] File deleted from storage
- [ ] Database record deleted
- [ ] Returns success: true

#### Test 7: Delete by File ID

```typescript
const result = await fileUploadService.deleteFileById("file-uuid");
```

- [ ] File record found
- [ ] File deleted from storage
- [ ] Database record deleted
- [ ] Returns success: true

#### Test 8: Unauthorized Deletion

- [ ] Student cannot delete teacher's instruction files
- [ ] Student cannot delete other student's submissions
- [ ] Teacher can delete files for their assignments

### File Retrieval Tests

#### Test 9: Get File by ID

```typescript
const result = await fileUploadService.getFileById("file-uuid");
```

- [ ] File metadata returned
- [ ] Signed URL generated
- [ ] URL is valid and accessible

#### Test 10: Generate Signed URL

```typescript
const result = await fileUploadService.getSignedUrl("path/to/file", 3600);
```

- [ ] Signed URL generated
- [ ] URL expires after specified time (1 hour)
- [ ] URL provides access to file

### Validation Tests

#### Test 11: File Size Limit

```typescript
const largeFile = new File([new ArrayBuffer(101 * 1024 * 1024)], "large.pdf");
const result = await fileUploadService.uploadFile({
  file: largeFile,
  assignmentId: "test",
  uploadType: "instruction",
});
```

- [ ] Upload rejected
- [ ] Error: "File size exceeds 100MB limit"

#### Test 12: Invalid MIME Type

```typescript
const file = new File(["test"], "test.exe", {
  type: "application/x-msdownload",
});
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "test",
  uploadType: "instruction",
});
```

- [ ] Upload rejected
- [ ] Error: "File type not allowed"

#### Test 13: Missing studentId for Submission

```typescript
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "test",
  uploadType: "submission",
  // studentId missing
});
```

- [ ] Upload rejected
- [ ] Error: "studentId is required for submission uploads"

### Error Handling & Rollback Tests

#### Test 14: Database Insert Failure

```typescript
// Simulate by temporarily breaking files table permissions
const result = await fileUploadService.uploadFile({
  file,
  assignmentId: "test",
  uploadType: "instruction",
});
```

- [ ] Upload fails
- [ ] File is automatically deleted from storage (rollback)
- [ ] Error message indicates database issue

### RLS Policy Enforcement Tests

#### Test 15: Student Access to Published Assignment

- [ ] Student can read instruction files for enrolled class
- [ ] Student can read instruction files only if assignment is published
- [ ] Student cannot read draft assignment files

#### Test 16: Cross-Class Access Prevention

- [ ] Student A cannot read Student B's submission files
- [ ] Teacher cannot read submissions for other teacher's assignments
- [ ] Files are properly isolated by class/assignment

#### Test 17: Coaching Hierarchy Access

- [ ] Coach can access all files in their coaching center
- [ ] Manager can access files in their managed branches
- [ ] Admin can access all files

## Performance Testing

### Test 18: Concurrent Uploads

- [ ] Multiple users can upload simultaneously
- [ ] No race conditions in database inserts
- [ ] File names are unique (timestamp prevents collisions)

### Test 19: Large File Upload

- [ ] 50MB file uploads successfully
- [ ] 100MB file uploads successfully
- [ ] Progress tracking works (if implemented)

### Test 20: Batch Operations

- [ ] Uploading 10 files works efficiently
- [ ] Partial failures don't block successful uploads
- [ ] Error messages clearly indicate which files failed

## Integration Testing

### Test 21: Assignment Creation Flow

1. Teacher uploads temp file
2. Teacher creates assignment
3. File moves from temp to instruction path (or re-upload)
4. File ID stored in assignments table
5. Students can access instruction file

### Test 22: Submission Flow

1. Student views assignment instructions
2. Student uploads submission file
3. File ID stored in assignment_submissions table
4. Teacher can view submission
5. Teacher can download submission file

### Test 23: File Cleanup

- [ ] Temp files expire after 7 days
- [ ] Expired files are automatically cleaned
- [ ] Cleanup logs created in cleanup_logs table

## Security Testing

### Test 24: Authentication Required

- [ ] Unauthenticated users cannot upload
- [ ] Unauthenticated users cannot download
- [ ] Auth tokens are validated

### Test 25: Path Manipulation Prevention

- [ ] Users cannot upload to arbitrary paths
- [ ] Path traversal attacks prevented (`../` in filename)
- [ ] RLS policies block unauthorized paths

### Test 26: SQL Injection Prevention

- [ ] File names with SQL characters handled safely
- [ ] Database queries use parameterized statements

## UI Testing

### Test 27: File Upload Component

- [ ] File picker works
- [ ] Upload progress displayed
- [ ] Success message shown
- [ ] Error messages user-friendly
- [ ] File preview works with signed URL

### Test 28: File List Display

- [ ] Uploaded files displayed correctly
- [ ] File metadata shown (name, size, date)
- [ ] Download links work
- [ ] Delete button works (with confirmation)

## Migration Testing (if applicable)

### Test 29: Existing Files

- [ ] Plan for existing files without database records
- [ ] Data migration script tested
- [ ] Old file paths mapped to new structure

## Documentation Testing

### Test 30: Documentation Accuracy

- [ ] Quick reference examples work as written
- [ ] Code samples copy-paste and run successfully
- [ ] API documentation matches actual implementation
- [ ] Error messages match documentation

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Code reviewed by team
- [ ] Documentation reviewed
- [ ] Database migrations ready

### Deployment Steps

1. [ ] Run database migrations
2. [ ] Verify RLS policies applied
3. [ ] Deploy new code
4. [ ] Verify no runtime errors
5. [ ] Monitor error logs

### Post-Deployment

- [ ] Test file upload in production
- [ ] Monitor storage bucket usage
- [ ] Check database for file records
- [ ] Verify RLS policies work
- [ ] Test with real users (limited rollout)

### Rollback Plan

- [ ] Previous version tagged in git
- [ ] Database rollback script ready
- [ ] Know how to revert storage bucket policies
- [ ] Communication plan for users

## Monitoring & Alerts

### Metrics to Track

- [ ] Upload success rate
- [ ] Upload failure reasons
- [ ] Storage bucket usage
- [ ] Files table row count
- [ ] RLS policy violations
- [ ] Average upload time
- [ ] Peak upload times

### Alerts to Set Up

- [ ] Upload failure rate > 5%
- [ ] Storage bucket > 80% full
- [ ] Unusual file sizes
- [ ] High number of RLS violations
- [ ] Database connection errors

## User Acceptance Testing

### Teacher UAT

- [ ] Can create assignments with instructions
- [ ] Can upload multiple instruction files
- [ ] Can view student submissions
- [ ] Can download submission files
- [ ] Can delete their own files

### Student UAT

- [ ] Can view assignment instructions
- [ ] Can upload submissions
- [ ] Can view their own submissions
- [ ] Can re-upload if allowed
- [ ] Cannot access other students' files

## Sign-Off

### Development

- [ ] Lead developer approval
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing

### QA

- [ ] All test cases executed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security review completed

### Product

- [ ] Feature matches requirements
- [ ] User experience acceptable
- [ ] Documentation complete
- [ ] Training materials ready

### DevOps

- [ ] Infrastructure ready
- [ ] Monitoring in place
- [ ] Backup strategy confirmed
- [ ] Rollback plan tested

---

**Testing Status**: 🟡 PENDING MANUAL TESTING  
**Ready for Deployment**: ⏸️ AFTER TESTING COMPLETE  
**Last Updated**: January 15, 2026
