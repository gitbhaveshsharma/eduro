# Branch Students Management - Complete Implementation Guide

## Overview

This document provides a comprehensive guide for implementing branch student management across different user roles: Coaches (Coaching Center Owners), Branch Managers, and Teachers.

## Features Implemented

### 1. Service Layer Enhancements

**File**: `lib/branch-system/services/branch-students.service.ts`

#### New Method: `getCoachingCenterStudents`

Fetches all students across all branches of a coaching center.

```typescript
async getCoachingCenterStudents(
    coachingCenterId: string,
    filters?: BranchStudentFilters,
    sort?: BranchStudentSort,
    pagination?: PaginationOptions
): Promise<BranchStudentOperationResult<BranchStudentSearchResult>>
```

**Key Features**:

- Joins with `coaching_branches` table to filter by `coaching_center_id`
- Supports all standard filters (status, payment, attendance, etc.)
- Includes pagination and sorting
- Returns aggregated results from all branches

### 2. Store Layer Enhancements

**File**: `lib/branch-system/stores/branch-students.store.ts`

#### New Method: `fetchCoachingCenterStudents`

Store action to fetch and cache coaching center students.

```typescript
fetchCoachingCenterStudents: (
  coachingCenterId: string,
  filters?: BranchStudentFilters,
  sort?: BranchStudentSort,
  pagination?: PaginationOptions
) => Promise<void>;
```

## Implementation by User Role

### For Coaches (Coaching Center Owners)

#### Usage in Coach Dashboard

**Location**: `app/(coach-lms)/coach/branch-students/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useBranchStudentsStore } from "@/lib/branch-system/stores/branch-students.store";
import { useAuth } from "@/hooks/use-auth"; // Your auth hook

export default function CoachBranchStudentsPage() {
  const { user } = useAuth();
  const { fetchCoachingCenterStudents, branchStudents, listLoading } =
    useBranchStudentsStore();

  useEffect(() => {
    if (user?.coaching_center_id) {
      // Fetch ALL students across all branches
      fetchCoachingCenterStudents(user.coaching_center_id);
    }
  }, [user, fetchCoachingCenterStudents]);

  // Display students from ALL branches
  return (
    <div>
      <h1>All Students Across Your Coaching Center</h1>
      {/* Your students table component */}
    </div>
  );
}
```

#### Key Features for Coaches:

- View students from **all branches** in their coaching center
- Filter across all branches
- Aggregate statistics
- Enroll students into any branch they own

---

### For Branch Managers

#### File Structure Created:

```
app/
└── (branch-manager)/
    └── manager/
        └── branch-students/
            ├── page.tsx
            └── _components/
                ├── dashboard.tsx
                ├── student-filters.tsx
                ├── students-table.tsx      (to create)
                ├── enroll-student-dialog.tsx (to create)
                ├── edit-enrollment-dialog.tsx (to create)
                ├── student-details-dialog.tsx (to create)
                └── delete-enrollment-dialog.tsx (to create)
```

#### Main Page Implementation

**File**: `app/(branch-manager)/manager/branch-students/page.tsx`

```typescript
export default function BranchManagerStudentsPage() {
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    // Get branch manager's assigned branch
    // TODO: Implement based on your auth system
    // Example:
    // const managerProfile = await getManagerProfile();
    // setBranchId(managerProfile.assigned_branch_id);
  }, []);

  return (
    <div>
      <BranchStudentsDashboard branchId={branchId} />
      <StudentsTable branchId={branchId} />
    </div>
  );
}
```

#### Key Features for Branch Managers:

- View students **only from their assigned branch**
- Full CRUD operations (Create, Read, Update, Delete enrollments)
- Track attendance and payments for their branch
- Manage academic performance

---

### For Teachers

#### File Structure to Create:

```
app/
└── (coach-lms)/
    └── teacher/
        └── class-students/
            ├── page.tsx
            └── _components/
                ├── class-students-table.tsx
                ├── student-academic-card.tsx
                ├── attendance-tracker.tsx
                └── performance-update-dialog.tsx
```

#### Implementation Example

**File**: `app/(coach-lms)/teacher/class-students/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useBranchStudentsStore } from "@/lib/branch-system/stores/branch-students.store";
import { useAuth } from "@/hooks/use-auth";

export default function TeacherClassStudentsPage() {
  const { user } = useAuth();
  const { fetchClassStudents, studentEnrollments } = useBranchStudentsStore();

  useEffect(() => {
    if (user?.assigned_class_id) {
      // Fetch students from teacher's assigned class
      fetchClassStudents(user.assigned_class_id);
    }
  }, [user, fetchClassStudents]);

  return (
    <div>
      <h1>My Class Students</h1>
      {/* Display students in teacher's class */}
    </div>
  );
}
```

#### Key Features for Teachers:

- View students **only from their assigned class(es)**
- Update academic fields:
  - Current grade
  - Performance notes
  - Attendance percentage
- Limited permissions (cannot modify financial or enrollment status)

---

## Permission Matrix

| Feature                  | Coach (Owner) | Branch Manager  | Teacher        |
| ------------------------ | ------------- | --------------- | -------------- |
| View all center students | ✅            | ❌              | ❌             |
| View branch students     | ✅            | ✅ (own branch) | ❌             |
| View class students      | ✅            | ✅              | ✅ (own class) |
| Enroll students          | ✅            | ✅              | ❌             |
| Update enrollment status | ✅            | ✅              | ❌             |
| Update payment info      | ✅            | ✅              | ❌             |
| Update academic info     | ✅            | ✅              | ✅             |
| Delete enrollment        | ✅            | ✅              | ❌             |
| View financial stats     | ✅            | ✅              | ❌             |

---

## Components to Create

### 1. Students Table (Branch Manager Version)

**File**: `app/(branch-manager)/manager/branch-students/_components/students-table.tsx`

Copy from coach version and modify:

```typescript
interface StudentsTableProps {
  branchId: string; // Required for branch managers
}

export function StudentsTable({ branchId }: StudentsTableProps) {
  const { fetchBranchStudents, branchStudents } = useBranchStudentsStore();

  useEffect(() => {
    fetchBranchStudents(branchId);
  }, [branchId]);

  // Rest is similar to coach version
}
```

### 2. Enroll Student Dialog (Branch Manager Version)

**File**: `app/(branch-manager)/manager/branch-students/_components/enroll-student-dialog.tsx`

Key differences:

- Pre-fill `branchId` (not selectable)
- Manager can only enroll in their branch
- Class selection limited to branch classes

### 3. Edit Enrollment Dialog (Branch Manager Version)

**File**: `app/(branch-manager)/manager/branch-students/_components/edit-enrollment-dialog.tsx`

Uses `updateEnrollmentByManager` which allows:

- Changing class (within branch)
- Updating payment info
- Modifying academic fields
- Changing enrollment status

### 4. Similar dialogs for:

- `student-details-dialog.tsx` - View full student information
- `delete-enrollment-dialog.tsx` - Soft delete (mark as DROPPED)

---

## Database Schema Reference

### Key Tables

#### `branch_students`

```sql
- id (UUID)
- student_id (UUID) -> auth.users
- branch_id (UUID) -> coaching_branches
- class_id (UUID) -> branch_classes (nullable)
- enrollment_status (ENUM)
- payment_status (ENUM)
- attendance_percentage (DECIMAL)
- total_fees_due (DECIMAL)
- total_fees_paid (DECIMAL)
- [... other fields]
```

#### `coaching_branches`

```sql
- id (UUID)
- coaching_center_id (UUID)
- manager_id (UUID) -> auth.users (nullable)
- name (VARCHAR)
- is_active (BOOLEAN)
- [... other fields]
```

---

## Testing Checklist

### Coach (Coaching Center Owner)

- [ ] Can view students from all branches
- [ ] Filters work across all branches
- [ ] Can enroll students in any branch
- [ ] Dashboard shows aggregated stats
- [ ] Can edit any student enrollment

### Branch Manager

- [ ] Only sees students from assigned branch
- [ ] Cannot see students from other branches
- [ ] Can enroll students in their branch only
- [ ] Dashboard shows branch-specific stats
- [ ] Can manage all aspects of their branch students

### Teacher

- [ ] Only sees students from assigned class
- [ ] Can update academic fields only
- [ ] Cannot modify financial information
- [ ] Cannot enroll or delete students
- [ ] Cannot change enrollment status

---

## Next Steps (TODO)

### Immediate

1. **Authentication Integration**: Implement proper role detection

   - Detect if user is Coach/Manager/Teacher
   - Get assigned branch_id for managers
   - Get assigned class_id for teachers

2. **Create Missing Components**:

   ```
   Branch Manager:
   - students-table.tsx
   - enroll-student-dialog.tsx
   - edit-enrollment-dialog.tsx
   - student-details-dialog.tsx
   - delete-enrollment-dialog.tsx

   Teacher:
   - Complete teacher section (all components)
   ```

3. **RLS Policies**: Ensure Supabase RLS policies enforce:
   - Coaches can access all branches they own
   - Managers can only access their assigned branch
   - Teachers can only access their assigned class

### Future Enhancements

1. **Bulk Operations**:

   - Bulk enroll students
   - Bulk update status
   - Export to CSV

2. **Analytics**:

   - Attendance trends
   - Payment collection rates
   - Performance analytics

3. **Notifications**:
   - Payment reminders
   - Low attendance alerts
   - Enrollment approvals

---

## Code Reuse Strategy

Many components are similar across roles. Use composition:

```typescript
// Base component
function StudentsTableBase({ students, actions, permissions }) {
  // Core table logic
}

// Coach version
function CoachStudentsTable() {
  return (
    <StudentsTableBase
      students={allCenterStudents}
      actions={fullActions}
      permissions={fullPermissions}
    />
  );
}

// Manager version
function ManagerStudentsTable({ branchId }) {
  return (
    <StudentsTableBase
      students={branchStudents}
      actions={managerActions}
      permissions={managerPermissions}
    />
  );
}

// Teacher version
function TeacherStudentsTable({ classId }) {
  return (
    <StudentsTableBase
      students={classStudents}
      actions={teacherActions}
      permissions={teacherPermissions}
    />
  );
}
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: Branch Manager sees no students

- **Fix**: Ensure branch_id is correctly set from user profile

**Issue**: Coach sees students from only one branch

- **Fix**: Use `fetchCoachingCenterStudents` not `fetchBranchStudents`

**Issue**: Teacher can modify payment info

- **Fix**: Use `updateEnrollmentByTeacher` which restricts fields

---

## Summary

This implementation provides a complete, role-based student management system:

- **Coaches** get a bird's-eye view of all students across branches
- **Branch Managers** focus on their specific branch operations
- **Teachers** manage academic aspects of their class students

All roles use the same underlying service layer with appropriate filtering and permission enforcement.
