# Branch Classes Authorization Guide

## Overview

The Branch Classes system implements **multi-layer authorization** with service-level filtering as the primary control and Row Level Security (RLS) as the backup security layer.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React)                       │
│  - Forms, dialogs, tables                                   │
│  - Calls service methods via API                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Service Layer (Primary Security)               │
│  - Branch Classes Service                                   │
│  - Authorization Service (Helper Methods)                   │
│  - Role-based filtering BEFORE queries                      │
│  - Post-query filtering for complex cases                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│            Database Layer (RLS - Backup Security)           │
│  - PostgreSQL Row Level Security Policies                   │
│  - Defense-in-depth protection                              │
│  - Prevents direct database access bypasses                 │
└─────────────────────────────────────────────────────────────┘
```

## Service-Level Authorization

### Key Files

- **Authorization Service**: `lib/branch-system/services/branch-classes-auth.service.ts`
- **Main Service**: `lib/branch-system/services/branch-classes.service.ts`

### Authorization Helpers

#### 1. `getUserAccessScope(userId)`

Gets comprehensive access scope for a user.

```typescript
import { getUserAccessScope } from "@/lib/branch-system/branch-classes";

const scope = await getUserAccessScope(userId);
// Returns:
// {
//   userId: string,
//   role: 'SA' | 'A' | 'C' | 'T' | 'S',
//   coaching_center_ids: string[],      // Centers user owns/manages
//   managed_branch_ids: string[],       // Branches user manages
//   teaching_class_ids: string[],       // Classes user teaches
//   enrolled_class_ids: string[],       // Classes user is enrolled in
//   is_admin: boolean                   // Admin (A/SA) = full access
// }
```

**When to use:**

- When you need to understand what a user can access
- Before building complex queries
- For UI conditional rendering (show/hide actions)

#### 2. `canUserAccessClass(userId, classId)`

Checks if user can view a specific class.

```typescript
import { canUserAccessClass } from "@/lib/branch-system/branch-classes";

const hasAccess = await canUserAccessClass(userId, classId);
if (!hasAccess) {
  throw new Error("Access denied");
}
```

**Access granted if:**

- User is admin
- User owns/manages the coaching center
- User manages the branch
- User is the teacher
- User is enrolled (student)
- Class is public (active + visible)

#### 3. `canUserManageClass(userId, classId)`

Checks if user can edit/delete a class (more restrictive than viewing).

```typescript
import { canUserManageClass } from "@/lib/branch-system/branch-classes";

const canManage = await canUserManageClass(userId, classId);
if (!canManage) {
  return { error: "You cannot manage this class" };
}
```

**Management granted if:**

- User is admin
- User owns/manages the coaching center
- User manages the branch
- User is the teacher

**NOT granted for:**

- Students (even if enrolled)
- Public access

#### 4. `validateBranchAccess(userId, branchId)`

Throws error if user cannot access a branch.

```typescript
import { validateBranchAccess } from "@/lib/branch-system/branch-classes";

try {
  await validateBranchAccess(userId, branchId);
  // Proceed with operation
} catch (error) {
  return { error: error.message };
}
```

**Use this for:**

- Creating classes in a branch
- Fetching all classes in a branch
- Any operation scoped to a specific branch

#### 5. `validateCoachingCenterAccess(userId, centerId)`

Throws error if user cannot access a coaching center.

```typescript
import { validateCoachingCenterAccess } from "@/lib/branch-system/branch-classes";

await validateCoachingCenterAccess(userId, centerId);
```

### Helper Utilities

```typescript
import {
  getCurrentUserId,
  requireAuth,
} from "@/lib/branch-system/branch-classes";

// Get current user ID (returns null if not authenticated)
const userId = await getCurrentUserId();

// Require authentication (throws error if not authenticated)
const userId = await requireAuth();
```

## Service Method Authorization

All service methods now include authorization checks:

### 1. `searchClasses(filters, sort, pagination)`

**Authorization Logic:**

1. Get current user ID
2. If unauthenticated: Return only active, visible classes
3. If authenticated: Get user access scope
4. Apply authorization filters:
   - Coaching centers user owns/manages
   - Branches user manages
   - Classes user teaches
   - Classes user is enrolled in
   - Public classes (active + visible)
5. Post-filter results to ensure authorization

**Example:**

```typescript
// Coach searching classes
const result = await branchClassesService.searchClasses({
  subject: "Mathematics",
  grade_level: "10th",
});
// Returns only classes in their coaching centers + public classes

// Student searching classes
const result = await branchClassesService.searchClasses({});
// Returns enrolled classes + public classes
```

### 2. `getClassesByBranch(branchId, includeInactive)`

**Authorization Logic:**

1. Get current user ID
2. Validate branch access using `validateBranchAccess()`
3. If unauthenticated: Force `includeInactive = false` and `is_visible = true`
4. Fetch classes with appropriate filters

**Example:**

```typescript
// Branch manager fetching their branch classes
const result = await branchClassesService.getClassesByBranch(branchId, true);
// ✅ Success - sees all classes (including inactive)

// Unauthenticated user
const result = await branchClassesService.getClassesByBranch(branchId);
// ✅ Success - sees only active, visible classes

// User without access
const result = await branchClassesService.getClassesByBranch(branchId);
// ❌ Error: "You do not have permission to access this branch"
```

### 3. `getClassById(classId)`

**Authorization Logic:**

1. Fetch class from database
2. Get current user ID
3. If authenticated: Check access using `canUserAccessClass()`
4. If unauthenticated: Only allow if class is visible and active

**Example:**

```typescript
// Teacher viewing their class
const result = await branchClassesService.getClassById(teacherClassId);
// ✅ Success

// Student viewing public class
const result = await branchClassesService.getClassById(publicClassId);
// ✅ Success

// Student viewing private class
const result = await branchClassesService.getClassById(privateClassId);
// ❌ Error: "You do not have permission to access this class"
```

### 4. `createClass(input)`

**Authorization Logic:**

1. Require authentication
2. Validate input
3. Validate branch access using `validateBranchAccess()`
4. Create class

**Example:**

```typescript
// Branch manager creating class
const result = await branchClassesService.createClass({
  branch_id: "their-branch-id",
  class_name: "Math 101",
  // ... other fields
});
// ✅ Success

// User without branch access
const result = await branchClassesService.createClass({
  branch_id: "other-branch-id",
  // ...
});
// ❌ Error: "You do not have permission to create classes in this branch"
```

### 5. `updateClass(classId, input)`

**Authorization Logic:**

1. Require authentication
2. Check management access using `canUserManageClass()`
3. Validate input
4. Update class

**Example:**

```typescript
// Coach updating class in their center
const result = await branchClassesService.updateClass(classId, {
    max_students: 35
});
// ✅ Success

// Teacher updating their class
const result = await branchClassesService.updateClass(classId, {
    description: 'Updated description'
});
// ✅ Success

// Student attempting to update
const result = await branchClassesService.updateClass(classId, {...});
// ❌ Error: "You do not have permission to update this class"
```

### 6. `deleteClass(classId)`

**Authorization Logic:**

1. Require authentication
2. Check management access using `canUserManageClass()`
3. Delete class

**Example:**

```typescript
// Branch manager deleting class
const result = await branchClassesService.deleteClass(classId);
// ✅ Success

// Teacher attempting to delete (teachers can update, not delete via policy)
const result = await branchClassesService.deleteClass(classId);
// Result depends on business rules - currently allowed for teachers managing their classes
```

## Authorization Flow Examples

### Example 1: Coach Viewing Dashboard

```typescript
// Coach opens dashboard
const userId = await getCurrentUserId();
const scope = await getUserAccessScope(userId);

// Scope includes:
// - coaching_center_ids: ['center-1', 'center-2']
// - managed_branch_ids: ['branch-1', 'branch-2']
// - teaching_class_ids: []
// - role: 'C'

// Dashboard calls searchClasses()
const result = await branchClassesService.searchClasses({});

// Authorization filter applied:
// - Classes in center-1 or center-2
// - Classes in branch-1 or branch-2
// - Public classes

// Result: Coach sees all classes in their centers
```

### Example 2: Teacher Viewing Their Classes

```typescript
const userId = await getCurrentUserId();
const scope = await getUserAccessScope(userId);

// Scope includes:
// - teaching_class_ids: ['class-a', 'class-b', 'class-c']
// - role: 'T'

const result = await branchClassesService.searchClasses({
  teacher_id: userId,
});

// Result: Teacher sees their assigned classes + public classes
```

### Example 3: Student Enrolling in Class

```typescript
// Student views public class
const classId = "public-class-123";
const result = await branchClassesService.getClassById(classId);
// ✅ Success - class is public

// After enrollment (handled by branch_students service)
// Student's enrolled_class_ids now includes 'public-class-123'

// Student views class again
const result2 = await branchClassesService.getClassById(classId);
// ✅ Success - now via enrollment access path
```

### Example 4: Branch Manager Creating Class

```typescript
const userId = await getCurrentUserId();

// Manager wants to create class in their branch
const input = {
  branch_id: "managed-branch-id",
  class_name: "Physics 101",
  // ... other fields
};

// Authorization flow:
// 1. requireAuth() - ✅ User is authenticated
// 2. validateBranchAccess(userId, 'managed-branch-id')
//    - Checks if user manages this branch - ✅ Yes
// 3. Create class - ✅ Success

const result = await branchClassesService.createClass(input);
```

## UI Integration

### Conditional Rendering

```typescript
import { canUserManageClass } from "@/lib/branch-system/branch-classes";

function ClassCard({ classItem }) {
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      const userId = await getCurrentUserId();
      if (userId) {
        const result = await canUserManageClass(userId, classItem.id);
        setCanManage(result);
      }
    }
    checkPermissions();
  }, [classItem.id]);

  return (
    <Card>
      <h3>{classItem.class_name}</h3>
      {canManage && (
        <>
          <Button onClick={handleEdit}>Edit</Button>
          <Button onClick={handleDelete}>Delete</Button>
        </>
      )}
    </Card>
  );
}
```

### Error Handling

```typescript
async function handleUpdateClass(classId, updates) {
  try {
    const result = await BranchClassesAPI.update(classId, updates);

    if (!result.success) {
      if (result.error?.includes("permission")) {
        toast.error("You do not have permission to update this class");
      } else {
        toast.error(result.error || "Failed to update class");
      }
      return;
    }

    toast.success("Class updated successfully");
  } catch (error) {
    console.error("Update failed:", error);
    toast.error("An unexpected error occurred");
  }
}
```

## Performance Considerations

### Caching Access Scope

```typescript
// Cache user access scope to avoid repeated DB calls
let cachedScope: UserAccessScope | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedAccessScope(userId: string): Promise<UserAccessScope> {
  const now = Date.now();

  if (cachedScope && cacheExpiry > now && cachedScope.userId === userId) {
    return cachedScope;
  }

  cachedScope = await getUserAccessScope(userId);
  cacheExpiry = now + CACHE_TTL;

  return cachedScope;
}
```

### Batch Permission Checks

```typescript
// Instead of checking each class individually
for (const classItem of classes) {
  const canManage = await canUserManageClass(userId, classItem.id);
  classItem._canManage = canManage;
}

// Use access scope once
const scope = await getUserAccessScope(userId);
const accessFilters = getUserAccessibleClassFilters(scope);

for (const classItem of classes) {
  classItem._canManage =
    scope.is_admin ||
    accessFilters.centerIds.includes(classItem.coaching_center_id) ||
    accessFilters.branchIds.includes(classItem.branch_id) ||
    accessFilters.teacherClassIds.includes(classItem.id);
}
```

## Testing Authorization

### Unit Tests

```typescript
describe("Branch Classes Authorization", () => {
  it("should allow coach to access classes in their center", async () => {
    const coachId = "coach-user-id";
    const classId = "class-in-their-center";

    const hasAccess = await canUserAccessClass(coachId, classId);

    expect(hasAccess).toBe(true);
  });

  it("should deny student access to private class", async () => {
    const studentId = "student-user-id";
    const privateClassId = "private-class-id";

    const hasAccess = await canUserAccessClass(studentId, privateClassId);

    expect(hasAccess).toBe(false);
  });

  it("should allow public access to visible classes", async () => {
    const result = await branchClassesService.searchClasses({});

    // All results should be active and visible
    result.data?.classes.forEach((cls) => {
      expect(cls.status).toBe("ACTIVE");
      expect(cls.is_visible).toBe(true);
    });
  });
});
```

## Security Best Practices

1. **Always require authentication for write operations**

   - Use `requireAuth()` in create/update/delete methods

2. **Validate access before operations**

   - Check permissions BEFORE modifying data
   - Don't rely on RLS alone

3. **Use typed errors**

   - Return structured errors for better UX
   - Distinguish between "not found" and "no permission"

4. **Log authorization failures**

   - Monitor for suspicious access attempts
   - Track patterns of denied access

5. **Keep authorization logic DRY**

   - Use helper functions consistently
   - Don't duplicate permission checks

6. **Test all access paths**

   - Test as each role (Coach, Manager, Teacher, Student)
   - Test edge cases (mixed roles, unauthenticated)

7. **Defense in depth**
   - Service-level + RLS policies
   - Client-side + server-side validation

## Troubleshooting

### Common Issues

**Q: User can't see classes they should access**

- Check their role in profiles table
- Verify coaching center/branch relationships
- Check if classes are active and visible
- Review getUserAccessScope() output

**Q: "Permission denied" errors**

- Ensure user is authenticated
- Check if user has required relationships (owner, manager, teacher)
- Verify branch/center IDs are correct

**Q: Performance degradation**

- Cache user access scope
- Use batch permission checks
- Monitor query performance with EXPLAIN ANALYZE
- Consider materialized views for complex permission checks

## References

- **Authorization Service**: `lib/branch-system/services/branch-classes-auth.service.ts`
- **Main Service**: `lib/branch-system/services/branch-classes.service.ts`
- **RLS Policies**: `lib/branch-system/BRANCH_CLASSES_RLS_POLICIES.md`
- **API Documentation**: `lib/branch-system/BRANCH_CLASSES_README.md`
