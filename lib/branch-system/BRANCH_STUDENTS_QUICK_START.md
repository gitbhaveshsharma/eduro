# Branch Students - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Import What You Need

```typescript
// For React components (using Zustand store)
import { useBranchStudentsStore } from "@/lib/branch-system/branch-students";

// For server-side or direct API calls (using service)
import { branchStudentsService } from "@/lib/branch-system/branch-students";

// For utilities
import {
  calculateOutstandingBalance,
  getPaymentUrgency,
  formatCurrency,
} from "@/lib/branch-system/branch-students";
```

### Step 2: Choose Your Approach

#### Approach A: Using Zustand Store (Recommended for Components)

```typescript
"use client";

import { useBranchStudentsStore } from "@/lib/branch-system/branch-students";
import { useEffect } from "react";

export default function BranchStudentsPage({ branchId }: { branchId: string }) {
  const { branchStudents, loading, error, fetchBranchStudents, enrollStudent } =
    useBranchStudentsStore();

  useEffect(() => {
    fetchBranchStudents(branchId);
  }, [branchId]);

  const handleEnroll = async (studentId: string) => {
    const success = await enrollStudent({
      student_id: studentId,
      branch_id: branchId,
    });

    if (success) {
      alert("Student enrolled successfully!");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Branch Students ({branchStudents.length})</h1>
      {branchStudents.map((student) => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

#### Approach B: Using Service Directly (Server-side or API Routes)

```typescript
import { branchStudentsService } from "@/lib/branch-system/branch-students";

export async function POST(request: Request) {
  const body = await request.json();

  const result = await branchStudentsService.enrollStudent({
    student_id: body.studentId,
    branch_id: body.branchId,
    class_id: body.classId,
    emergency_contact_name: body.emergencyContactName,
    emergency_contact_phone: body.emergencyContactPhone,
  });

  if (result.success) {
    return Response.json({ success: true, data: result.data });
  } else {
    return Response.json(
      {
        success: false,
        error: result.error,
        validation_errors: result.validation_errors,
      },
      { status: 400 }
    );
  }
}
```

## 📝 Common Use Cases

### 1. Enroll a Student

```typescript
const result = await branchStudentsService.enrollStudent({
  student_id: "uuid-student",
  branch_id: "uuid-branch",
  class_id: "uuid-class", // Optional

  // Contact info (optional but recommended)
  emergency_contact_name: "John Doe",
  emergency_contact_phone: "+911234567890", // Must be E.164 format
  parent_guardian_name: "Jane Doe",
  parent_guardian_phone: "+919876543210",

  // Preferences (optional)
  preferred_batch: "Morning Batch",
  special_requirements: "Wheelchair accessible seating required",
  student_notes: "Prefers front row seats",
});

if (result.success) {
  console.log("Enrolled:", result.data);
} else {
  console.error("Error:", result.error);
  // Show validation errors to user
  result.validation_errors?.forEach((err) => {
    console.error(`${err.field}: ${err.message}`);
  });
}
```

### 2. Get Student's Own Enrollment

```typescript
// Student viewing their own enrollment
const result = await branchStudentsService.getStudentEnrollmentInBranch(
  "student-id", // Current user's ID
  "branch-id"
);

if (result.success) {
  const enrollment = result.data;
  console.log("Enrollment status:", enrollment.enrollment_status);
  console.log("Attendance:", enrollment.attendance_percentage + "%");
  console.log("Payment status:", enrollment.payment_status);
}
```

### 3. Student Updates Their Contact Info

```typescript
// Only students can do this for their own enrollment
const result = await branchStudentsService.updateEnrollmentByStudent(
  "enrollment-id",
  "student-id", // Must match current user
  {
    emergency_contact_phone: "+911234567890",
    parent_guardian_name: "Jane Smith",
    parent_guardian_phone: "+919876543210",
    preferred_batch: "Evening Batch",
    student_notes: "I prefer evening classes due to work",
  }
);
```

### 4. Teacher Updates Student's Grades

```typescript
// Teachers can only update academic fields for their class students
const result = await branchStudentsService.updateEnrollmentByTeacher(
  "enrollment-id",
  {
    current_grade: "A",
    attendance_percentage: 92.5,
    performance_notes:
      "Excellent improvement in last month. Shows great potential.",
  }
);
```

### 5. Manager Updates Everything

```typescript
// Branch managers have full control
const result = await branchStudentsService.updateEnrollmentByManager(
  "enrollment-id",
  {
    class_id: "new-class-id", // Move to different class
    enrollment_status: "ENROLLED",
    payment_status: "PAID",
    total_fees_due: 10000,
    total_fees_paid: 10000,
    last_payment_date: "2024-06-15",
    next_payment_due: "2024-07-15",
    current_grade: "A+",
    attendance_percentage: 95.0,
  }
);
```

### 6. Search Students with Filters

```typescript
const result = await branchStudentsService.getBranchStudents(
  "branch-id",
  // Filters
  {
    enrollment_status: ["ENROLLED", "PENDING"],
    payment_status: "OVERDUE",
    attendance_min: 60, // Only students with 60%+ attendance
    has_overdue_payment: true,
  },
  // Sort
  {
    field: "attendance_percentage",
    direction: "asc", // Lowest attendance first
  },
  // Pagination
  {
    page: 1,
    limit: 20,
  }
);

if (result.success) {
  console.log("Found students:", result.data.students);
  console.log("Total count:", result.data.total_count);
  console.log("Has more pages:", result.data.has_more);
}
```

### 7. Get Class Students (for Teachers)

```typescript
// Teachers viewing students in their class
const result = await branchStudentsService.getClassStudents(
  "class-id",
  {
    enrollment_status: "ENROLLED", // Only active students
  },
  {
    field: "attendance_percentage",
    direction: "desc", // Best attendance first
  }
);

if (result.success) {
  result.data.forEach((student) => {
    console.log(`${student.student_id}: ${student.attendance_percentage}%`);
  });
}
```

### 8. Check Payment Status

```typescript
import {
  calculateOutstandingBalance,
  getPaymentUrgency,
  calculateDaysUntilPayment,
  formatCurrency,
} from "@/lib/branch-system/branch-students";

// Get enrollment
const result = await branchStudentsService.getEnrollmentById("enrollment-id");

if (result.success) {
  const student = result.data;

  // Calculate outstanding balance
  const balance = calculateOutstandingBalance(
    student.total_fees_due,
    student.total_fees_paid
  );

  // Check urgency
  const urgency = getPaymentUrgency(student.next_payment_due);

  // Days remaining
  const daysLeft = calculateDaysUntilPayment(student.next_payment_due);

  // Format for display
  console.log("Outstanding:", formatCurrency(balance)); // ₹3,000.00
  console.log("Urgency:", urgency); // 'overdue' | 'urgent' | 'warning' | etc.
  console.log("Days left:", daysLeft); // -5 (overdue), 3 (urgent), etc.

  // Show appropriate message
  if (urgency === "overdue") {
    alert(`Payment overdue by ${Math.abs(daysLeft!)} days!`);
  } else if (urgency === "urgent") {
    alert(`Payment due in ${daysLeft} days!`);
  }
}
```

### 9. Get Statistics Dashboard

```typescript
// For branch managers
const statsResult = await branchStudentsService.getBranchStudentStats(
  "branch-id"
);

if (statsResult.success) {
  const stats = statsResult.data;

  console.log("Total students:", stats.total_students);
  console.log("Enrolled:", stats.enrolled_students);
  console.log("Avg attendance:", stats.average_attendance + "%");
  console.log("Overdue payments:", stats.students_with_overdue_payments);
  console.log("Fees collected:", formatCurrency(stats.total_fees_collected));
  console.log("Outstanding:", formatCurrency(stats.total_outstanding_fees));
}

// Get students needing attention
const attentionResult = await branchStudentsService.getStudentsNeedingAttention(
  "branch-id"
);

if (attentionResult.success) {
  console.log("Students needing attention:", attentionResult.data.length);
  attentionResult.data.forEach((student) => {
    if (student.is_payment_overdue) {
      console.log(`${student.id}: Payment overdue!`);
    }
    if (student.attendance_percentage < 60) {
      console.log(
        `${student.id}: Poor attendance (${student.attendance_percentage}%)`
      );
    }
  });
}
```

### 10. Complete React Component Example

```typescript
"use client";

import { useBranchStudentsStore } from "@/lib/branch-system/branch-students";
import {
  formatCurrency,
  formatDate,
} from "@/lib/branch-system/branch-students";
import { useEffect } from "react";

interface Props {
  branchId: string;
}

export default function BranchStudentsDashboard({ branchId }: Props) {
  const {
    branchStudents,
    stats,
    loading,
    listLoading,
    statsLoading,
    error,
    fetchBranchStudents,
    fetchBranchStats,
    setFilters,
  } = useBranchStudentsStore();

  useEffect(() => {
    fetchBranchStudents(branchId);
    fetchBranchStats(branchId);
  }, [branchId]);

  const handleFilterChange = (filter: string) => {
    if (filter === "overdue") {
      setFilters({ has_overdue_payment: true });
      fetchBranchStudents(branchId, { has_overdue_payment: true });
    } else if (filter === "low-attendance") {
      setFilters({ attendance_max: 60 });
      fetchBranchStudents(branchId, { attendance_max: 60 });
    } else {
      setFilters(null);
      fetchBranchStudents(branchId);
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      {/* Statistics Cards */}
      {statsLoading ? (
        <div>Loading stats...</div>
      ) : (
        stats && (
          <div className="stats-grid">
            <StatCard
              title="Total Students"
              value={stats.total_students}
              color="blue"
            />
            <StatCard
              title="Enrolled"
              value={stats.enrolled_students}
              color="green"
            />
            <StatCard
              title="Avg Attendance"
              value={`${stats.average_attendance}%`}
              color="purple"
            />
            <StatCard
              title="Overdue Payments"
              value={stats.students_with_overdue_payments}
              color="red"
            />
            <StatCard
              title="Fees Collected"
              value={formatCurrency(stats.total_fees_collected)}
              color="green"
            />
            <StatCard
              title="Outstanding"
              value={formatCurrency(stats.total_outstanding_fees)}
              color="orange"
            />
          </div>
        )
      )}

      {/* Filters */}
      <div className="filters">
        <button onClick={() => handleFilterChange("all")}>All Students</button>
        <button onClick={() => handleFilterChange("overdue")}>
          Overdue Payments
        </button>
        <button onClick={() => handleFilterChange("low-attendance")}>
          Low Attendance
        </button>
      </div>

      {/* Student List */}
      {listLoading ? (
        <div>Loading students...</div>
      ) : (
        <div className="students-grid">
          {branchStudents.map((student) => (
            <div key={student.id} className="student-card">
              <h3>Student ID: {student.student_id}</h3>
              <p>Status: {student.enrollment_status}</p>
              <p>Attendance: {student.attendance_percentage}%</p>
              <p>Payment: {student.payment_status}</p>
              <p>Balance: {formatCurrency(student.outstanding_balance)}</p>
              {student.next_payment_due && (
                <p>Next Payment: {formatDate(student.next_payment_due)}</p>
              )}
              {student.is_payment_overdue && (
                <span className="badge-danger">Payment Overdue!</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`stat-card stat-${color}`}>
      <h4>{title}</h4>
      <div className="value">{value}</div>
    </div>
  );
}
```

## ⚠️ Common Pitfalls to Avoid

### 1. Phone Number Format

```typescript
// ❌ WRONG
emergency_contact_phone: "1234567890"; // Missing country code
emergency_contact_phone: "12-345-67890"; // Contains hyphens
emergency_contact_phone: "(123) 456-7890"; // Contains parentheses

// ✅ CORRECT
emergency_contact_phone: "+911234567890"; // E.164 format
emergency_contact_phone: "+14155552671"; // E.164 format
```

### 2. Date Format

```typescript
// ❌ WRONG
enrollment_date: new Date(); // Date object
enrollment_date: "15/06/2024"; // Wrong format

// ✅ CORRECT
enrollment_date: "2024-06-15"; // ISO date string (YYYY-MM-DD)
enrollment_date: new Date().toISOString().split("T")[0];
```

### 3. Financial Values

```typescript
// ❌ WRONG
total_fees_paid: "5000"; // String
total_fees_paid: 5000.999; // More than 2 decimals

// ✅ CORRECT
total_fees_paid: 5000; // Number
total_fees_paid: 5000.5; // Max 2 decimals
```

### 4. Role-based Updates

```typescript
// ❌ WRONG - Student trying to update payment status
await branchStudentsService.updateEnrollmentByStudent(
  "enrollment-id",
  "student-id",
  {
    payment_status: "PAID", // This will fail!
  }
);

// ✅ CORRECT - Manager updating payment status
await branchStudentsService.updateEnrollmentByManager("enrollment-id", {
  payment_status: "PAID",
  total_fees_paid: 10000,
});
```

## 🎯 Best Practices

1. **Always check result.success** before accessing result.data
2. **Show validation errors** to users for better UX
3. **Use formatters** for display (currency, dates, phone numbers)
4. **Fetch statistics separately** from list data for better performance
5. **Use filters and pagination** for large datasets
6. **Clear errors** when user retries
7. **Handle loading states** properly
8. **Use Zustand store** in components, service in API routes

## 🔗 Next Steps

- Read the [Full README](./BRANCH_STUDENTS_README.md) for comprehensive documentation
- Check [Database Schema](../../supabase/migrations/016_create_branch_student_system.sql)
- Explore [Type Definitions](./types/branch-students.types.ts)
- Review [Validation Rules](./validations/branch-students.validation.ts)

---

**Need Help?** Check the full documentation or ask in the team chat!
