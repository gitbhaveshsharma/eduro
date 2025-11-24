# Quick Setup Commands for Branch Manager Components

## PowerShell Commands (Windows)

Run these commands from the root of your project (`e:\eduro`):

```powershell
# Define source and destination paths
$coachPath = "app\(coach-lms)\coach\branch-students\_components"
$managerPath = "app\(branch-manager)\manager\branch-students\_components"

# Copy dialog components from coach to manager
Copy-Item "$coachPath\enroll-student-dialog.tsx" "$managerPath\enroll-student-dialog.tsx"
Copy-Item "$coachPath\edit-enrollment-dialog.tsx" "$managerPath\edit-enrollment-dialog.tsx"
Copy-Item "$coachPath\student-details-dialog.tsx" "$managerPath\student-details-dialog.tsx"
Copy-Item "$coachPath\delete-enrollment-dialog.tsx" "$managerPath\delete-enrollment-dialog.tsx"

# Copy students table
Copy-Item "$coachPath\students-table.tsx" "$managerPath\students-table.tsx"

Write-Host "✅ Files copied successfully!" -ForegroundColor Green
Write-Host "⚠️  Remember to modify the copied files according to branch manager requirements" -ForegroundColor Yellow
```

---

## Modifications After Copying

### 1. Modify `enroll-student-dialog.tsx`

**Add branchId prop:**

```typescript
interface EnrollStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: string; // ADD THIS
}

export function EnrollStudentDialog({ open, onOpenChange, branchId }: EnrollStudentDialogProps) {
```

**Pre-fill branchId in form:**

```typescript
const form = useForm<EnrollStudentInput>({
  resolver: zodResolver(enrollStudentSchema),
  defaultValues: {
    student_id: "",
    branch_id: branchId, // CHANGE THIS - use prop instead of empty string
    class_id: null,
    // ... rest
  },
});
```

**Remove branch selection UI:**

```typescript
// REMOVE OR COMMENT OUT the BranchSearchSelect component
{
  /* Branch managers can only enroll in their own branch */
}
```

**Filter classes to branch only:**

```typescript
// When fetching classes, filter by branchId
const classes = await getClassesByBranch(branchId);
```

---

### 2. Modify `edit-enrollment-dialog.tsx`

**Change update method:**

```typescript
// FIND this line:
const success = await updateEnrollment(enrollmentId, updateData);

// REPLACE WITH:
const success = await updateEnrollmentByManager(enrollmentId, updateData);
```

**Restrict branch changes:**

```typescript
// If there's a branch selection field, disable it
<Input
  {...field}
  disabled // ADD THIS
  placeholder="Branch cannot be changed"
/>
```

---

### 3. `student-details-dialog.tsx`

**No changes needed!** This is a read-only dialog.

---

### 4. `delete-enrollment-dialog.tsx`

**No changes needed!** Deletion works the same for all roles.

---

### 5. Modify `students-table.tsx`

**Add branchId prop:**

```typescript
interface StudentsTableProps {
    branchId: string; // ADD THIS
}

export function StudentsTable({ branchId }: StudentsTableProps) {
```

**Fetch students for specific branch:**

```typescript
const { fetchBranchStudents, branchStudents, listLoading } =
  useBranchStudentsStore();

useEffect(() => {
  if (branchId) {
    fetchBranchStudents(branchId); // ADD branchId parameter
  }
}, [branchId, fetchBranchStudents]);
```

---

## Bash Commands (Linux/Mac)

```bash
# Define source and destination paths
COACH_PATH="app/(coach-lms)/coach/branch-students/_components"
MANAGER_PATH="app/(branch-manager)/manager/branch-students/_components"

# Create directory if it doesn't exist
mkdir -p "$MANAGER_PATH"

# Copy dialog components
cp "$COACH_PATH/enroll-student-dialog.tsx" "$MANAGER_PATH/enroll-student-dialog.tsx"
cp "$COACH_PATH/edit-enrollment-dialog.tsx" "$MANAGER_PATH/edit-enrollment-dialog.tsx"
cp "$COACH_PATH/student-details-dialog.tsx" "$MANAGER_PATH/student-details-dialog.tsx"
cp "$COACH_PATH/delete-enrollment-dialog.tsx" "$MANAGER_PATH/delete-enrollment-dialog.tsx"
cp "$COACH_PATH/students-table.tsx" "$MANAGER_PATH/students-table.tsx"

echo "✅ Files copied successfully!"
echo "⚠️  Remember to modify the copied files according to branch manager requirements"
```

---

## VS Code Multi-Cursor Editing Tips

After copying files, use these VS Code shortcuts for quick editing:

1. **Find and Replace in File**: `Ctrl+H` (Windows) / `Cmd+H` (Mac)

   - Find: `interface.*Props`
   - Add `branchId: string;` to props

2. **Multi-cursor**: `Ctrl+Alt+Down` (Windows) / `Cmd+Alt+Down` (Mac)

   - Select multiple lines
   - Edit all at once

3. **Find in Files**: `Ctrl+Shift+F` (Windows) / `Cmd+Shift+F` (Mac)
   - Search across all copied files
   - Replace common patterns

---

## Verification Checklist

After copying and modifying, verify:

### enroll-student-dialog.tsx

- [ ] Has `branchId` prop
- [ ] Form pre-fills with `branchId`
- [ ] Branch selection UI removed or hidden
- [ ] Classes filtered by branch

### edit-enrollment-dialog.tsx

- [ ] Uses `updateEnrollmentByManager`
- [ ] Branch field is read-only/disabled
- [ ] All other fields editable

### student-details-dialog.tsx

- [ ] Works as-is (no changes needed)
- [ ] Displays all student information

### delete-enrollment-dialog.tsx

- [ ] Works as-is (no changes needed)
- [ ] Shows confirmation dialog
- [ ] Performs soft delete

### students-table.tsx

- [ ] Has `branchId` prop
- [ ] Calls `fetchBranchStudents(branchId)`
- [ ] Table renders correctly
- [ ] Actions work (view, edit, delete)

---

## Testing After Setup

```typescript
// In your branch manager page
import { StudentsTable } from "./_components/students-table";
import { EnrollStudentDialog } from "./_components/enroll-student-dialog";

function BranchManagerPage() {
  const branchId = "your-branch-id"; // Get from auth context

  return (
    <div>
      <StudentsTable branchId={branchId} />
      <EnrollStudentDialog
        open={true}
        onOpenChange={setOpen}
        branchId={branchId}
      />
    </div>
  );
}
```

---

## Common Issues and Solutions

### Issue: "Property 'branchId' is missing"

**Solution**: Make sure you added the prop to the component interface and passed it when using the component.

### Issue: "Cannot read property of undefined"

**Solution**: Ensure branchId is loaded from auth context before rendering components.

### Issue: Students from all branches showing

**Solution**: Verify you're calling `fetchBranchStudents(branchId)` not `fetchCoachingCenterStudents(centerId)`.

### Issue: Manager can edit branch field

**Solution**: Add `disabled` prop to branch input field in edit dialog.

---

## Time Estimates

- Copy files: **2 minutes**
- Modify enroll-student-dialog.tsx: **10 minutes**
- Modify edit-enrollment-dialog.tsx: **5 minutes**
- Modify students-table.tsx: **5 minutes**
- Testing: **15 minutes**

**Total**: ~35-40 minutes

---

## Support Files Created

1. ✅ `BRANCH_STUDENTS_IMPLEMENTATION_GUIDE.md` - Complete guide
2. ✅ `IMPLEMENTATION_SUMMARY.md` - Quick summary
3. ✅ `README_DIALOGS.tsx` - Dialog instructions
4. ✅ `QUICK_SETUP_COMMANDS.md` - This file

You now have everything you need to complete the branch manager implementation! 🚀
