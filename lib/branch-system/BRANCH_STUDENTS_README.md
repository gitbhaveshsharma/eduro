# Branch Students System - Complete Implementation

## 📋 Overview

This module provides a comprehensive, production-ready implementation for managing student enrollments in coaching branches. It includes complete CRUD operations, role-based access control, statistics, and analytics.

## 🏗️ Architecture

```
lib/branch-system/
├── types/
│   └── branch-students.types.ts      # TypeScript types & interfaces
├── validations/
│   └── branch-students.validation.ts # Zod validation schemas
├── utils/
│   └── branch-students.utils.ts      # Helper & utility functions
├── services/
│   └── branch-students.service.ts    # Database operations & API layer
└── stores/
    └── branch-students.store.ts      # Zustand state management
```

## 📊 Database Schema

Based on `branch_students` table from migration `016_create_branch_student_system.sql`:

### Key Features:

- ✅ Unique constraint: One enrollment per student per branch
- ✅ Automatic enrollment count updates
- ✅ Role-based RLS policies (Student, Teacher, Manager, Coach, Admin)
- ✅ Comprehensive validation triggers
- ✅ Phone number validation (E.164 format)
- ✅ Financial tracking (fees due, paid, balance)
- ✅ Academic tracking (attendance, grades, performance)

### RLS Policies:

- **Students**: READ-ONLY own data, UPDATE contact info only
- **Teachers**: READ class students, UPDATE academic fields only
- **Branch Managers**: Full CRUD for their branch
- **Coaches**: Full access to all enrollments
- **Admins**: Full system access

## 🎯 Features

### Core Operations

- ✅ Enroll student in branch (with optional class assignment)
- ✅ Update enrollment (role-based: student, teacher, manager)
- ✅ Fetch enrollments (by ID, student, branch, class)
- ✅ Soft delete (mark as DROPPED)
- ✅ Search & filter with pagination
- ✅ Sort by multiple fields

### Role-Based Updates

1. **Student** can update:
   - Contact information (emergency, parent/guardian)
   - Preferences & notes
2. **Teacher** can update:

   - Current grade
   - Performance notes
   - Attendance percentage

3. **Manager** can update:
   - All student fields
   - Enrollment status
   - Payment status
   - Financial data
   - Academic data

### Statistics & Analytics

- ✅ Student enrollment summary
- ✅ Branch student statistics
- ✅ Students needing attention (poor attendance/overdue payments)
- ✅ Students with upcoming payments
- ✅ Payment compliance rate
- ✅ Attendance categorization

## 🔧 Usage Examples

### 1. Enrolling a Student

```typescript
import { branchStudentsService } from "@/lib/branch-system/services/branch-students.service";

const result = await branchStudentsService.enrollStudent({
  student_id: "uuid-student",
  branch_id: "uuid-branch",
  class_id: "uuid-class", // Optional
  emergency_contact_name: "John Doe",
  emergency_contact_phone: "+911234567890",
  parent_guardian_name: "Jane Doe",
  parent_guardian_phone: "+919876543210",
  preferred_batch: "Morning",
  special_requirements: "Needs wheelchair access",
});

if (result.success) {
  console.log("Enrolled:", result.data);
} else {
  console.error("Error:", result.error);
  console.error("Validation:", result.validation_errors);
}
```

### 2. Using Zustand Store

```typescript
import { useBranchStudentsStore } from "@/lib/branch-system/stores/branch-students.store";

function StudentEnrollmentComponent() {
  const { enrollStudent, fetchBranchStudents, branchStudents, loading, error } =
    useBranchStudentsStore();

  // Enroll student
  const handleEnroll = async (data) => {
    const success = await enrollStudent(data);
    if (success) {
      // Handle success
    }
  };

  // Fetch students
  useEffect(() => {
    fetchBranchStudents("branch-id", {
      enrollment_status: "ENROLLED",
      payment_status: ["PAID", "PARTIAL"],
    });
  }, []);

  return (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error} />}
      {branchStudents.map((student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

### 3. Updating Enrollment (Student)

```typescript
const result = await branchStudentsService.updateEnrollmentByStudent(
  "enrollment-id",
  "student-id",
  {
    emergency_contact_phone: "+911234567890",
    preferred_batch: "Evening",
    student_notes: "Prefer evening classes",
  }
);
```

### 4. Updating Enrollment (Teacher)

```typescript
const result = await branchStudentsService.updateEnrollmentByTeacher(
  "enrollment-id",
  {
    current_grade: "A",
    attendance_percentage: 92.5,
    performance_notes: "Excellent progress in mathematics",
  }
);
```

### 5. Updating Enrollment (Manager)

```typescript
const result = await branchStudentsService.updateEnrollmentByManager(
  "enrollment-id",
  {
    enrollment_status: "ENROLLED",
    payment_status: "PAID",
    total_fees_paid: 5000,
    attendance_percentage: 95.0,
    current_grade: "A+",
  }
);
```

### 6. Fetching Students with Filters

```typescript
const result = await branchStudentsService.getBranchStudents(
  "branch-id",
  {
    enrollment_status: ["ENROLLED", "PENDING"],
    payment_status: "OVERDUE",
    attendance_min: 75,
    has_overdue_payment: true,
  },
  {
    field: "attendance_percentage",
    direction: "asc",
  },
  {
    page: 1,
    limit: 20,
  }
);

if (result.success) {
  console.log("Students:", result.data.students);
  console.log("Total:", result.data.total_count);
  console.log("Pages:", result.data.total_pages);
}
```

### 7. Getting Statistics

```typescript
// Student summary
const summaryResult = await branchStudentsService.getStudentEnrollmentSummary(
  "student-id"
);

// Branch statistics
const statsResult = await branchStudentsService.getBranchStudentStats(
  "branch-id"
);

// Students needing attention
const attentionResult = await branchStudentsService.getStudentsNeedingAttention(
  "branch-id"
);

// Upcoming payments
const paymentsResult =
  await branchStudentsService.getStudentsWithUpcomingPayments("branch-id", 7);
```

## 🛡️ Validation

All inputs are validated using **Zod schemas** with comprehensive rules:

### Phone Number Validation

- E.164 international format: `+[country code][number]`
- Example: `+911234567890` or `+14155552671`
- Must be 10-15 digits (excluding country code +)

### Financial Validation

- Non-negative amounts
- Maximum 2 decimal places
- Total paid cannot exceed total due
- Proper payment status transitions

### Date Validation

- Enrollment date cannot be in the future
- Expected completion after enrollment
- Actual completion on or after expected
- Date range: 2000 - (current year + 10)

### Contact Validation

- Name: 2-200 characters, letters only
- Cannot be only numbers or whitespace
- If name provided, phone required

## 📊 Utility Functions

### Financial Calculations

```typescript
import {
  calculateOutstandingBalance,
  checkPaymentOverdue,
  calculateDaysUntilPayment,
  getPaymentUrgency,
  calculatePaymentComplianceRate,
} from "@/lib/branch-system/utils/branch-students.utils";

const balance = calculateOutstandingBalance(10000, 7000); // 3000
const isOverdue = checkPaymentOverdue("2024-01-01"); // true/false
const daysLeft = calculateDaysUntilPayment("2024-12-31"); // number or null
const urgency = getPaymentUrgency("2024-12-31"); // 'overdue' | 'urgent' | 'warning' | ...
```

### Academic Calculations

```typescript
import {
  calculateEnrollmentDuration,
  getAttendanceStatus,
  studentNeedsAttention,
  isStudentOnTrack,
} from "@/lib/branch-system/utils/branch-students.utils";

const days = calculateEnrollmentDuration("2024-01-01", null);
const status = getAttendanceStatus(85); // 'excellent' | 'good' | ...
const needsAttention = studentNeedsAttention(student); // boolean
const onTrack = isStudentOnTrack(student); // boolean
```

### Data Transformation

```typescript
import {
  toPublicBranchStudent,
  toPublicBranchStudents,
} from "@/lib/branch-system/utils/branch-students.utils";

const publicStudent = toPublicBranchStudent(student);
const publicStudents = toPublicBranchStudents(students);
```

## 🎨 Constants & Enums

### Enrollment Status

```typescript
type EnrollmentStatus =
  | "ENROLLED" // Actively enrolled
  | "PENDING" // Pending approval
  | "SUSPENDED" // Temporarily suspended
  | "DROPPED" // Dropped from class
  | "COMPLETED"; // Completed the class
```

### Payment Status

```typescript
type PaymentStatus =
  | "PAID" // Fully paid
  | "PARTIAL" // Partially paid
  | "PENDING" // Payment pending
  | "OVERDUE"; // Payment overdue
```

### Attendance Thresholds

```typescript
const ATTENDANCE_THRESHOLDS = {
  EXCELLENT: 90, // >= 90%
  GOOD: 75, // 75-89%
  NEEDS_IMPROVEMENT: 60, // 60-74%
  POOR: 0, // < 60%
};
```

### Payment Warning Days

```typescript
const PAYMENT_WARNING_DAYS = {
  URGENT: 3, // Payment due in 3 days
  WARNING: 7, // Payment due in 7 days
  REMINDER: 14, // Payment due in 14 days
};
```

## 🔒 Security & RLS

### Student Access

- **READ**: Own enrollment data only
- **UPDATE**: Contact info and preferences only
- **CANNOT** modify: Financial data, academic data, status

### Teacher Access

- **READ**: Students in their assigned classes
- **UPDATE**: Academic fields (grades, performance notes, attendance)
- **CANNOT** modify: Financial data, enrollment status

### Manager Access

- **READ**: All students in their branch
- **UPDATE**: All fields except student_id and branch_id
- **CREATE**: New enrollments
- **DELETE**: Soft delete (mark as DROPPED)

### RPC Functions Available

1. `enroll_student_in_branch(student_uuid, branch_uuid, class_uuid)` - With validation
2. `get_student_enrollment_summary(student_uuid)` - Aggregated statistics

## ⚡ Performance Optimizations

### Indexes

- `idx_branch_students_student_id` - Fast student lookups
- `idx_branch_students_branch_id` - Fast branch queries
- `idx_branch_students_class_id` - Fast class queries
- `idx_branch_students_enrollment_status` - Status filtering
- `idx_branch_students_payment_status` - Payment filtering
- `idx_branch_students_next_payment_due` - Payment alerts

### Store Optimizations

- Singleton service pattern
- Zustand state management with persistence
- Selective state persistence (pagination, filters, sort)
- Optimized selectors for component access

## 🧪 Type Safety

All operations are fully typed with TypeScript:

- ✅ Strict input validation
- ✅ Inferred types from Zod schemas
- ✅ Type-safe store actions
- ✅ Comprehensive error handling
- ✅ Validation error details

## 📝 Error Handling

All service methods return standardized result objects:

```typescript
interface BranchStudentOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validation_errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}
```

## 🚀 Best Practices

1. **Always validate input** using Zod schemas
2. **Use service layer** for all database operations
3. **Use Zustand store** for component state management
4. **Handle errors gracefully** with proper user feedback
5. **Respect RLS policies** - operations will fail if unauthorized
6. **Use utility functions** for calculations and transformations
7. **Never hardcode** - use constants and enums
8. **Test thoroughly** - especially financial calculations

## 🔄 Migration Path

If you need to modify the schema:

1. Create new migration file
2. Update types in `branch-students.types.ts`
3. Update validation in `branch-students.validation.ts`
4. Update service methods if needed
5. Update store actions if needed
6. Update utility functions if needed
7. Test thoroughly!

## 📚 Related Documentation

- Database Migration: `supabase/migrations/016_create_branch_student_system.sql`
- Branch Classes: `lib/branch-system/BRANCH_CLASSES_README.md`
- Authentication: `lib/auth-service.ts`
- Permissions: `lib/permissions/`

## 🤝 Contributing

When adding new features:

1. Add types to `types/branch-students.types.ts`
2. Add validation to `validations/branch-students.validation.ts`
3. Add service methods to `services/branch-students.service.ts`
4. Add store actions to `stores/branch-students.store.ts`
5. Add utilities if needed to `utils/branch-students.utils.ts`
6. Update this README

## ⚠️ Important Notes

- **Unique Constraint**: One student can have only ONE enrollment per branch
- **Soft Delete**: Deletion marks status as 'DROPPED' (data preserved)
- **RPC Fallback**: Service tries RPC first, falls back to direct queries
- **Phone Format**: Must be E.164 international format
- **Financial Integrity**: Triggers ensure total_paid ≤ total_due

---

**Created**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
