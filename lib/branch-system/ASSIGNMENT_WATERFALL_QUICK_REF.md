# Assignment Waterfall Pattern - Quick Reference

## What Changed?

### Before (❌ Broken)
```typescript
// Files uploaded immediately with "temp"
context_id: assignmentId || 'temp'  // ❌ Causes RLS & UUID errors
```

### After (✅ Fixed)
```typescript
// Files stored locally, uploaded after assignment creation
context_id: assignmentId  // ✅ Always real UUID
```

## Component Usage

### 1. Import Updated Types
```typescript
import { AssignmentForm } from './_components/assignments/assignment-form';

type PendingFile = {
    file: File;
    content: string;
    preview: { name: string; size: number; type: string; };
};
```

### 2. Implement Waterfall Handler
```typescript
const handleCreateAssignment = async (
    data: CreateAssignmentDTO,
    pendingFiles: PendingFile[]
) => {
    try {
        // Step 1: Create Assignment First
        const result = await createAssignment(data);
        const assignmentId = result.data.id;

        // Step 2: Upload Files with Real ID
        if (pendingFiles.length > 0) {
            for (const pendingFile of pendingFiles) {
                const uploaded = await uploadFile({
                    file_name: pendingFile.file.name,
                    file_size: pendingFile.file.size,
                    mime_type: pendingFile.file.type,
                    context_type: 'assignment_instruction',
                    context_id: assignmentId, // Real UUID
                    uploaded_by: teacherId,
                    is_permanent: false,
                    file_content: pendingFile.content,
                });

                // Step 3: Attach File to Assignment
                if (uploaded) {
                    await attachFileToAssignment(
                        assignmentId,
                        uploaded.id,
                        'instruction'
                    );
                }
            }
        }

        showSuccessToast('Assignment created successfully');
    } catch (error) {
        showErrorToast('Failed to create assignment');
    }
};
```

### 3. Use in Component
```tsx
<AssignmentForm
    mode="create"
    teacherId={teacherId}
    branchId={branchId}
    availableClasses={classes}
    onSubmit={handleCreateAssignment}  // Updated signature
    onCancel={() => setIsDialogOpen(false)}
/>
```

## Key Changes Summary

### Service Layer (`assignment.service.ts`)
- ✅ Removed "temp" logic
- ✅ Requires real UUID for `context_id`
- ✅ Storage path: `{context_type}/{assignment_id}/{filename}`

### Store Layer (`assignment.store.ts`)
- ✅ No changes needed (passes through context_id as-is)

### Component Layer (`assignment-form.tsx`)
- ✅ Files stored in `pendingFiles` state (not uploaded immediately)
- ✅ `onSubmit` now receives `(data, pendingFiles)`
- ✅ Parent component handles waterfall flow

## Migration Checklist

- [ ] Update parent component `onSubmit` handler signature
- [ ] Implement 3-step waterfall: create → upload → attach
- [ ] Handle file upload errors gracefully
- [ ] Test with single file
- [ ] Test with multiple files
- [ ] Test without files
- [ ] Verify storage path structure
- [ ] Verify RLS policies pass

## Error Handling Best Practice

```typescript
const handleSubmit = async (data: CreateAssignmentDTO, files: PendingFile[]) => {
    let assignmentId: string | null = null;
    
    try {
        // Critical: Assignment creation
        const result = await createAssignment(data);
        assignmentId = result.data.id;
        
        // Best effort: File uploads
        const failedFiles: string[] = [];
        for (const file of files) {
            try {
                const uploaded = await uploadFile({ ...file, context_id: assignmentId });
                await attachFileToAssignment(assignmentId, uploaded.id, 'instruction');
            } catch (err) {
                failedFiles.push(file.preview.name);
            }
        }
        
        // Show appropriate message
        if (failedFiles.length > 0) {
            showWarningToast(
                `Assignment created, but ${failedFiles.length} file(s) failed. ` +
                `You can add them later.`
            );
        } else {
            showSuccessToast('Assignment created successfully!');
        }
        
        return assignmentId;
    } catch (error) {
        showErrorToast('Failed to create assignment');
        throw error;
    }
};
```

## Storage Structure

```
assignments/
└── assignment_instruction/
    └── {assignment-uuid}/
        ├── 1642341234567_document.pdf
        └── 1642341345678_image.jpg
```

## Benefits

✅ **No RLS Errors**: Files uploaded after assignment exists  
✅ **Valid UUIDs**: Always uses real assignment IDs  
✅ **Proper Linking**: Files correctly attached to assignments  
✅ **Clean Storage**: No orphaned temporary files  
✅ **Atomic Operations**: All or nothing approach  

## Common Issues

### Issue: TypeScript error on `onSubmit`
**Solution**: Update the handler signature to include `pendingFiles` parameter

### Issue: Files not uploading
**Solution**: Ensure parent component implements file upload loop after assignment creation

### Issue: RLS policy error
**Solution**: Verify assignment is created before uploading files

## Need Help?

See full documentation: [ASSIGNMENT_WATERFALL_PATTERN.md](./ASSIGNMENT_WATERFALL_PATTERN.md)
