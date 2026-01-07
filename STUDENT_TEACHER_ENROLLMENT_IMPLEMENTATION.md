# Student & Teacher Enrollment System Implementation

## Overview
This implementation adds functionality to track and display coaching center enrollments for students and teaching assignments for teachers. The system uses two RPC functions from the database to retrieve enrollment data and provides reusable card components for display.

## Files Modified/Created

### 1. **Types** (`lib/schema/coaching.types.ts`)
Added two new interfaces:

```typescript
export interface StudentEnrollment {
  coaching_center_id: string;
  coaching_name: string;
  coaching_logo: string | null;
  coaching_description: string | null;
  branch_id: string;
  branch_name: string;
  enrollment_id: string;
  registration_date: string; // ISO date string
}

export interface TeacherAssignment {
  coaching_center_id: string;
  coaching_name: string;
  coaching_logo: string | null;
  coaching_description: string | null;
  branch_id: string;
  branch_name: string;
  assignment_id: string;
  assignment_date: string; // ISO date string
  assignment_end_date: string | null; // ISO date string
  is_active: boolean;
  teaching_subjects: string[] | null;
}
```

### 2. **Service Layer** (`lib/service/coaching.service.ts`)
Added two new methods:

```typescript
// Get student enrollments using RPC
static async getStudentEnrollments(studentId?: string): Promise<CoachingOperationResult<StudentEnrollment[]>>

// Get teacher assignments using RPC
static async getTeacherAssignments(teacherId?: string): Promise<CoachingOperationResult<TeacherAssignment[]>>
```

### 3. **Store Layer** (`lib/store/coaching.store.ts`)
Added state and actions:

**State:**
```typescript
studentEnrollments: StudentEnrollment[];
studentEnrollmentsLoading: boolean;
studentEnrollmentsError: string | null;

teacherAssignments: TeacherAssignment[];
teacherAssignmentsLoading: boolean;
teacherAssignmentsError: string | null;
```

**Actions:**
```typescript
loadStudentEnrollments: (studentId?: string) => Promise<void>;
loadTeacherAssignments: (teacherId?: string) => Promise<void>;
clearStudentEnrollments: () => void;
clearTeacherAssignments: () => void;
```

**Hooks:**
```typescript
useStudentEnrollments()
useStudentEnrollmentsLoading()
useStudentEnrollmentsError()
useTeacherAssignments()
useTeacherAssignmentsLoading()
useTeacherAssignmentsError()
```

### 4. **Utility Functions** (`lib/utils/coaching.utils.ts`)
Added `EnrollmentUtils` class with helper methods:

```typescript
export class EnrollmentUtils {
  // Format registration/assignment date (e.g., "2 days ago", "3 months ago")
  static formatDate(dateString: string): string

  // Get enrollment status badge color
  static getEnrollmentBadgeColor(isActive: boolean): string

  // Check if assignment is currently active
  static isAssignmentActive(assignment: { is_active: boolean; assignment_end_date: string | null }): boolean

  // Get subjects display text with truncation
  static getSubjectsDisplay(subjects: string[] | null, maxDisplay: number = 3): string

  // Get enrollment/assignment duration text
  static getDurationText(startDate: string, endDate?: string | null): string
}
```

### 5. **Components**

#### **Student Enrollment Card** (`app/(lms)/lms/_components/student-enrollment-card.tsx`)
A card component to display student enrollments with:
- Coaching center logo and name
- Branch information
- Registration date
- Interactive "View Enrollment" button
- Blue-themed styling

#### **Teacher Assignment Card** (`app/(lms)/lms/_components/teacher-assignment-card.tsx`)
A card component to display teacher assignments with:
- Coaching center logo and name
- Branch information
- Assignment status (Active/Inactive badge)
- Teaching subjects list
- Assignment date and duration
- Interactive "View Assignment" button
- Green-themed for active, gray for inactive

### 6. **Central Export** (`lib/coaching.ts`)
Updated to export all new functionality:
- Types
- Hooks
- Service methods
- Utility functions

## Usage Examples

### For Students

```typescript
'use client';

import { useEffect } from 'react';
import { useStudentEnrollments, useStudentEnrollmentsLoading, CoachingStoreAPI } from '@/lib/coaching';
import { StudentEnrollmentCard } from '@/app/(lms)/lms/_components/student-enrollment-card';

export function StudentEnrollmentsPage() {
  const enrollments = useStudentEnrollments();
  const loading = useStudentEnrollmentsLoading();

  useEffect(() => {
    // Load enrollments for current user
    CoachingStoreAPI.loadStudentEnrollments();
  }, []);

  const handleSelectEnrollment = (enrollment) => {
    console.log('Selected enrollment:', enrollment);
    // Navigate to coaching center or show details
  };

  if (loading) return <div>Loading enrollments...</div>;

  if (enrollments.length === 0) {
    return <div>No enrollments found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enrollments.map((enrollment) => (
        <StudentEnrollmentCard
          key={enrollment.enrollment_id}
          enrollment={enrollment}
          onSelect={handleSelectEnrollment}
        />
      ))}
    </div>
  );
}
```

### For Teachers

```typescript
'use client';

import { useEffect } from 'react';
import { useTeacherAssignments, useTeacherAssignmentsLoading, CoachingStoreAPI } from '@/lib/coaching';
import { TeacherAssignmentCard } from '@/app/(lms)/lms/_components/teacher-assignment-card';

export function TeacherAssignmentsPage() {
  const assignments = useTeacherAssignments();
  const loading = useTeacherAssignmentsLoading();

  useEffect(() => {
    // Load assignments for current user
    CoachingStoreAPI.loadTeacherAssignments();
  }, []);

  const handleSelectAssignment = (assignment) => {
    console.log('Selected assignment:', assignment);
    // Navigate to coaching center or show details
  };

  if (loading) return <div>Loading assignments...</div>;

  if (assignments.length === 0) {
    return <div>No assignments found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignments.map((assignment) => (
        <TeacherAssignmentCard
          key={assignment.assignment_id}
          assignment={assignment}
          onSelect={handleSelectAssignment}
        />
      ))}
    </div>
  );
}
```

### Using Service Directly (without store)

```typescript
import { CoachingAPI } from '@/lib/coaching';

// Get student enrollments
const result = await CoachingAPI.getStudentEnrollments();
if (result.success) {
  console.log('Enrollments:', result.data);
}

// Get teacher assignments
const result2 = await CoachingAPI.getTeacherAssignments();
if (result2.success) {
  console.log('Assignments:', result2.data);
}

// Get enrollments for specific user
const result3 = await CoachingAPI.getStudentEnrollments('user-uuid');
```

### Using Utility Functions

```typescript
import { EnrollmentUtils } from '@/lib/coaching';

// Format dates
const dateText = EnrollmentUtils.formatDate('2024-01-15T10:00:00Z');
// Returns: "2 weeks ago"

// Check if assignment is active
const isActive = EnrollmentUtils.isAssignmentActive({
  is_active: true,
  assignment_end_date: '2025-12-31'
});

// Get subjects display
const subjectsText = EnrollmentUtils.getSubjectsDisplay(
  ['Math', 'Physics', 'Chemistry', 'Biology'],
  3
);
// Returns: "Math, Physics, Chemistry +1 more"

// Get duration
const duration = EnrollmentUtils.getDurationText(
  '2024-01-01',
  '2024-06-01'
);
// Returns: "5 months"
```

## Database Requirements

This implementation requires two PostgreSQL RPC functions to be created in Supabase:

### 1. `get_student_enrollments(student_uuid UUID)`
Should return:
- `coaching_center_id`: UUID
- `coaching_name`: text
- `coaching_logo`: text (nullable)
- `coaching_description`: text (nullable)
- `branch_id`: UUID
- `branch_name`: text
- `enrollment_id`: UUID
- `registration_date`: date

### 2. `get_teacher_assignments(teacher_uuid UUID)`
Should return:
- `coaching_center_id`: UUID
- `coaching_name`: text
- `coaching_logo`: text (nullable)
- `coaching_description`: text (nullable)
- `branch_id`: UUID
- `branch_name`: text
- `assignment_id`: UUID
- `assignment_date`: date
- `assignment_end_date`: date (nullable)
- `is_active`: boolean
- `teaching_subjects`: text[] (nullable)

## Key Features

### ✅ Type Safety
- Full TypeScript type definitions
- Proper typing for all RPC responses
- Type-safe hooks and utility functions

### ✅ Reusable Components
- Card components follow existing design patterns
- Consistent with `assigned-branch-card.tsx`
- Responsive and accessible

### ✅ State Management
- Zustand store integration
- Loading and error states
- Easy to use hooks

### ✅ Utility Functions
- Date formatting
- Status checking
- Display text formatting
- No hardcoded values

### ✅ No Code Duplication
- Reuses existing coaching utilities
- Follows established patterns
- DRY principles applied

## Integration Checklist

- [x] Add types to `coaching.types.ts`
- [x] Add service methods to `coaching.service.ts`
- [x] Add store state and actions to `coaching.store.ts`
- [x] Add utility functions to `coaching.utils.ts`
- [x] Create student enrollment card component
- [x] Create teacher assignment card component
- [x] Export all new functionality from `coaching.ts`
- [x] Verify no TypeScript errors

## Next Steps

1. **Database Setup**: Ensure the RPC functions exist in your Supabase project
2. **Testing**: Test the components with real data
3. **UI Integration**: Add the enrollment cards to your LMS pages
4. **Error Handling**: Add proper error boundaries and fallback UI
5. **Loading States**: Add skeleton loaders for better UX

## Notes

- All utility functions use proper type definitions
- No hardcoded values - everything uses utils and constants
- Components are memoized for performance
- Follows the same pattern as existing coaching system components
- Full integration with the existing coaching.ts module
