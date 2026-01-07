# Student & Teacher Enrollment - Quick Reference

## Import Statement

```typescript
import {
  // Types
  StudentEnrollment,
  TeacherAssignment,
  
  // Hooks
  useStudentEnrollments,
  useStudentEnrollmentsLoading,
  useStudentEnrollmentsError,
  useTeacherAssignments,
  useTeacherAssignmentsLoading,
  useTeacherAssignmentsError,
  
  // Service API
  CoachingAPI,
  CoachingStoreAPI,
  
  // Utils
  EnrollmentUtils,
} from '@/lib/coaching';

// Components
import { StudentEnrollmentCard } from '@/app/(lms)/lms/_components/student-enrollment-card';
import { TeacherAssignmentCard } from '@/app/(lms)/lms/_components/teacher-assignment-card';
```

## Quick Usage

### Load and Display Student Enrollments

```typescript
function MyStudentPage() {
  const enrollments = useStudentEnrollments();
  const loading = useStudentEnrollmentsLoading();

  useEffect(() => {
    CoachingStoreAPI.loadStudentEnrollments();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {enrollments.map(enrollment => (
        <StudentEnrollmentCard 
          key={enrollment.enrollment_id}
          enrollment={enrollment}
          onSelect={(e) => console.log(e)}
        />
      ))}
    </div>
  );
}
```

### Load and Display Teacher Assignments

```typescript
function MyTeacherPage() {
  const assignments = useTeacherAssignments();
  const loading = useTeacherAssignmentsLoading();

  useEffect(() => {
    CoachingStoreAPI.loadTeacherAssignments();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {assignments.map(assignment => (
        <TeacherAssignmentCard 
          key={assignment.assignment_id}
          assignment={assignment}
          onSelect={(a) => console.log(a)}
        />
      ))}
    </div>
  );
}
```

## Utility Functions

```typescript
// Format date - "2 days ago", "3 months ago"
EnrollmentUtils.formatDate(dateString)

// Check if assignment is active
EnrollmentUtils.isAssignmentActive(assignment)

// Get subjects display - "Math, Physics, Chemistry +2 more"
EnrollmentUtils.getSubjectsDisplay(subjects, maxDisplay)

// Get duration - "5 months", "2 years"
EnrollmentUtils.getDurationText(startDate, endDate)
```

## RPC Functions (Database)

### `get_student_enrollments(student_uuid UUID)`
Returns all coaching centers where student is enrolled

### `get_teacher_assignments(teacher_uuid UUID)`
Returns all coaching centers where teacher is assigned

## API Methods

```typescript
// Using Service API (returns Promise)
const result = await CoachingAPI.getStudentEnrollments();
const result = await CoachingAPI.getTeacherAssignments();

// Using Store API (updates store)
CoachingStoreAPI.loadStudentEnrollments();
CoachingStoreAPI.loadTeacherAssignments();
CoachingStoreAPI.clearStudentEnrollments();
CoachingStoreAPI.clearTeacherAssignments();
```

## Component Props

### StudentEnrollmentCard
```typescript
{
  enrollment: StudentEnrollment;
  onSelect: (enrollment: StudentEnrollment) => void;
}
```

### TeacherAssignmentCard
```typescript
{
  assignment: TeacherAssignment;
  onSelect: (assignment: TeacherAssignment) => void;
}
```

## Data Structure

### StudentEnrollment
```typescript
{
  coaching_center_id: string;
  coaching_name: string;
  coaching_logo: string | null;
  coaching_description: string | null;
  branch_id: string;
  branch_name: string;
  enrollment_id: string;
  registration_date: string;
}
```

### TeacherAssignment
```typescript
{
  coaching_center_id: string;
  coaching_name: string;
  coaching_logo: string | null;
  coaching_description: string | null;
  branch_id: string;
  branch_name: string;
  assignment_id: string;
  assignment_date: string;
  assignment_end_date: string | null;
  is_active: boolean;
  teaching_subjects: string[] | null;
}
```
