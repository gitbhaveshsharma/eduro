# Student & Teacher Navigation Configuration Fix

## Problem
The student and teacher portals had incorrect navigation paths. The sidebar items were pointing to absolute paths like `/lms/student` instead of per-center paths like `/lms/student/{centerId}/dashboard` (similar to how the manager portal works).

## Solution Applied

### 1. Updated Sidebar Item Configuration
Changed sidebar items to use **relative paths** instead of absolute paths:

**Before:**
```typescript
{
    id: 'dashboard',
    label: 'Dashboard',
    href: '/lms/student',  // ❌ Absolute path
}
```

**After:**
```typescript
{
    id: 'dashboard',
    label: 'Dashboard',
    href: 'dashboard',  // ✅ Relative path
}
```

### 2. Added Helper Methods to LayoutUtils
Added two new helper methods similar to `getBranchManagerSidebarItems()`:

```typescript
/**
 * Get student sidebar items with dynamic hrefs based on centerId
 */
static getStudentSidebarItems(centerId: string): SidebarItem[] {
    return LMS_STUDENT_SIDEBAR_ITEMS.map(item => ({
        ...item,
        href: `/lms/student/${centerId}/${item.href}`,
    }));
}

/**
 * Get teacher sidebar items with dynamic hrefs based on centerId
 */
static getTeacherSidebarItems(centerId: string): SidebarItem[] {
    return LMS_TEACHER_SIDEBAR_ITEMS.map(item => ({
        ...item,
        href: `/lms/teacher/${centerId}/${item.href}`,
    }));
}
```

### 3. Updated Layouts
Updated both student and teacher layouts to use the new helper methods:

**Student Layout:**
```typescript
const sidebarItems: SidebarItem[] = LayoutUtils.getStudentSidebarItems(centerId);
```

**Teacher Layout:**
```typescript
const sidebarItems: SidebarItem[] = LayoutUtils.getTeacherSidebarItems(centerId);
```

### 4. Created Dashboard Pages
Created new dashboard route pages:
- `app/(lms)/lms/(students)/student/[centerId]/dashboard/page.tsx`
- `app/(lms)/lms/(teachers)/teacher/[centerId]/dashboard/page.tsx`

### 5. Added Redirects from Index Pages
Updated the index pages to redirect to the dashboard:

```typescript
export default function StudentCenterPage() {
    const router = useRouter();
    const { centerId } = useStudentContext();

    useEffect(() => {
        router.replace(`/lms/student/${centerId}/dashboard`);
    }, [router, centerId]);

    return null;
}
```

## URL Structure Comparison

### Before (Incorrect)
- Student: `http://localhost:3000/lms/student/38df114c-1f4e-4065-950b-0b0e2db0380c`
- Sidebar links: `/lms/student`, `/lms/student/classes` (no centerId)

### After (Correct) ✅
- Student: `http://localhost:3000/lms/student/38df114c-1f4e-4065-950b-0b0e2db0380c/dashboard`
- Sidebar links:
  - Dashboard: `/lms/student/38df114c-1f4e-4065-950b-0b0e2db0380c/dashboard`
  - Classes: `/lms/student/38df114c-1f4e-4065-950b-0b0e2db0380c/classes`
  - Assignments: `/lms/student/38df114c-1f4e-4065-950b-0b0e2db0380c/assignments`
  - etc.

### Manager Structure (Reference)
- Manager: `http://localhost:3000/lms/manager/branches/7cd2f87d-19b6-4277-9218-27a93f79b4a9/dashboard`
- Sidebar links:
  - Dashboard: `/lms/manager/branches/{branchId}/dashboard`
  - Students: `/lms/manager/branches/{branchId}/students`
  - etc.

## Files Modified

### Configuration
- ✅ `components/layout/config.ts`
  - Updated `LMS_STUDENT_SIDEBAR_ITEMS` (relative paths)
  - Updated `LMS_TEACHER_SIDEBAR_ITEMS` (relative paths)
  - Added `getStudentSidebarItems()` method
  - Added `getTeacherSidebarItems()` method

### Student Portal
- ✅ `app/(lms)/lms/(students)/student/[centerId]/layout.tsx`
  - Uses `LayoutUtils.getStudentSidebarItems(centerId)`
  - Passes `sidebarItems` to `ConditionalLayout`
- ✅ `app/(lms)/lms/(students)/student/[centerId]/page.tsx`
  - Redirects to `/dashboard`
- ✅ `app/(lms)/lms/(students)/student/[centerId]/dashboard/page.tsx` (NEW)
  - Student dashboard content

### Teacher Portal
- ✅ `app/(lms)/lms/(teachers)/teacher/[centerId]/layout.tsx`
  - Uses `LayoutUtils.getTeacherSidebarItems(centerId)`
  - Passes `sidebarItems` to `ConditionalLayout`
- ✅ `app/(lms)/lms/(teachers)/teacher/[centerId]/page.tsx`
  - Redirects to `/dashboard`
- ✅ `app/(lms)/lms/(teachers)/teacher/[centerId]/dashboard/page.tsx` (NEW)
  - Teacher dashboard content

## Navigation Items

### Student Sidebar Items
All relative paths, prefixed with `/lms/student/{centerId}/`:
- `dashboard` → `/lms/student/{centerId}/dashboard`
- `classes` → `/lms/student/{centerId}/classes`
- `assignments` → `/lms/student/{centerId}/assignments`
- `calendar` → `/lms/student/{centerId}/calendar`
- `attendance` → `/lms/student/{centerId}/attendance`
- `fees` → `/lms/student/{centerId}/fees`

### Teacher Sidebar Items
All relative paths, prefixed with `/lms/teacher/{centerId}/`:
- `dashboard` → `/lms/teacher/{centerId}/dashboard`
- `classes` → `/lms/teacher/{centerId}/classes`
- `students` → `/lms/teacher/{centerId}/students`
- `assignments` → `/lms/teacher/{centerId}/assignments`
- `attendance` → `/lms/teacher/{centerId}/attendance`
- `analytics` → `/lms/teacher/{centerId}/analytics`

## TypeScript Validation
✅ All files pass TypeScript compilation with no errors

## Testing Checklist
- [ ] Navigate to student portal: `/lms/student/{centerId}`
- [ ] Should redirect to `/lms/student/{centerId}/dashboard`
- [ ] Sidebar links should include centerId in URL
- [ ] Same for teacher portal
- [ ] Header navigation items work correctly
- [ ] Bottom nav (mobile) works correctly
- [ ] Branding displays from coaching center data

## Notes
- The home link (`/dashboard`) remains unchanged - it points to the main dashboard, not per-center
- The pattern now matches the manager portal structure exactly
- Each coaching center has its own isolated navigation context
- All navigation is type-safe with proper TypeScript support
