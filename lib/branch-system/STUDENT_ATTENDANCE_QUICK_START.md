# 🚀 Student Attendance - Quick Reference

## 📦 Installation & Import

```typescript
// Main imports
import {
  studentAttendanceService,
  useAttendanceActions,
  useAttendanceRecords,
  AttendanceStatus,
} from "@/lib/branch-system/student-attendance";

// Or use the complete bundle
import { studentAttendanceSystem } from "@/lib/branch-system/student-attendance";
```

## ⚡ Quick Actions

### 1. Mark Single Attendance

```typescript
const result = await studentAttendanceService.markAttendance({
  student_id: "uuid",
  class_id: "uuid",
  teacher_id: "uuid",
  branch_id: "uuid",
  attendance_date: "2024-01-15",
  attendance_status: AttendanceStatus.PRESENT,
  check_in_time: "09:00",
  teacher_remarks: "Good participation",
});
```

### 2. Bulk Mark Attendance

```typescript
await studentAttendanceService.bulkMarkAttendance({
  class_id: "uuid",
  teacher_id: "uuid",
  branch_id: "uuid",
  attendance_date: "2024-01-15",
  attendance_records: [
    { student_id: "uuid1", attendance_status: AttendanceStatus.PRESENT },
    {
      student_id: "uuid2",
      attendance_status: AttendanceStatus.LATE,
      late_by_minutes: 10,
    },
    { student_id: "uuid3", attendance_status: AttendanceStatus.ABSENT },
  ],
});
```

### 3. Get Daily Attendance (Teacher View)

```typescript
const { fetchDailyAttendance } = useAttendanceActions();
const dailyRecords = useDailyAttendanceRecords();

// Fetch for today
await fetchDailyAttendance("class-uuid");

// Fetch for specific date
await fetchDailyAttendance("class-uuid", "2024-01-15");
```

### 4. Get Student Summary

```typescript
const summaryResult =
  await studentAttendanceService.getStudentAttendanceSummary({
    student_id: "uuid",
    from_date: "2024-01-01",
    to_date: "2024-01-31",
  });
```

### 5. Get Class Report

```typescript
const reportResult = await studentAttendanceService.getClassAttendanceReport({
  class_id: "uuid",
  from_date: "2024-01-01",
  to_date: "2024-01-31",
});
```

## 🎮 React Hooks

### Basic Data Hooks

```typescript
const records = useAttendanceRecords(); // Current attendance list
const dailyRecords = useDailyAttendanceRecords(); // Today's class attendance
const summary = useAttendanceSummary(); // Student summary stats
const classReport = useClassAttendanceReport(); // Class report stats
const loading = useAttendanceLoading(); // Loading states
const error = useAttendanceError(); // Error state
```

### Action Hooks

```typescript
const {
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  fetchAttendanceList,
  fetchDailyAttendance,
  fetchStudentSummary,
  fetchClassReport,
  setFilters,
  setPagination,
  setSort,
} = useAttendanceActions();
```

### Stats Hook

```typescript
const stats = useDailyAttendanceStats();
// Returns: { total, present, absent, late, excused, marked, unmarked }
```

## 🔧 Filtering & Pagination

```typescript
// Set filters
setFilters({
  class_id: "uuid",
  attendance_status: AttendanceStatus.ABSENT,
  date_from: "2024-01-01",
  date_to: "2024-01-31",
});

// Set pagination
setPagination(2, 25); // page 2, 25 per page

// Set sorting
setSort("attendance_date", "desc");

// Fetch with filters
await fetchAttendanceList();
```

## 📊 Attendance Status Values

```typescript
enum AttendanceStatus {
  PRESENT = "PRESENT", // ✅ Student was present
  ABSENT = "ABSENT", // ❌ Student was absent
  LATE = "LATE", // ⏰ Student came late
  EXCUSED = "EXCUSED", // 📝 Excused absence
  HOLIDAY = "HOLIDAY", // 🏖️ Holiday/No class
}
```

## 🛠️ Utility Functions

```typescript
import {
  formatAttendanceStatus,
  formatTime,
  formatDuration,
  formatAttendanceDate,
  calculateAttendancePercentage,
  getAttendancePerformanceLevel,
  validateAttendanceDate,
  validateAttendanceTimes,
} from "@/lib/branch-system/student-attendance";

// Format status with emoji
formatAttendanceStatus(AttendanceStatus.LATE, true); // "⏰ Late"

// Format time
formatTime("09:15"); // "09:15"

// Calculate percentage
calculateAttendancePercentage(20, 18); // 90%

// Get performance level
getAttendancePerformanceLevel(87.5); // "Good"

// Validate date (not future, max 7 days old)
validateAttendanceDate("2024-01-15", false, 7);

// Validate times
validateAttendanceTimes("09:00", "12:00");
```

## 🎯 Common Patterns

### Teacher Daily Attendance Component

```typescript
function DailyAttendance({ classId }: { classId: string }) {
  const dailyRecords = useDailyAttendanceRecords();
  const stats = useDailyAttendanceStats();
  const { fetchDailyAttendance, markAttendance } = useAttendanceActions();

  useEffect(() => {
    fetchDailyAttendance(classId);
  }, [classId]);

  const markStudent = (studentId: string, status: AttendanceStatus) => {
    markAttendance({
      student_id: studentId,
      class_id: classId,
      teacher_id: getCurrentUserId(),
      branch_id: getCurrentBranchId(),
      attendance_date: getCurrentDateString(),
      attendance_status: status,
    });
  };

  return (
    <div>
      <div>
        Present: {stats.present} | Absent: {stats.absent} | Unmarked:{" "}
        {stats.unmarked}
      </div>
      {dailyRecords.map((record) => (
        <div key={record.student_id}>
          <span>{record.student_name}</span>
          <button
            onClick={() =>
              markStudent(record.student_id, AttendanceStatus.PRESENT)
            }
          >
            Present
          </button>
          <button
            onClick={() =>
              markStudent(record.student_id, AttendanceStatus.ABSENT)
            }
          >
            Absent
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Student Attendance History

```typescript
function StudentHistory({ studentId }: { studentId: string }) {
  const records = useAttendanceRecords();
  const summary = useAttendanceSummary();
  const { fetchStudentAttendance, fetchStudentSummary } =
    useAttendanceActions();

  useEffect(() => {
    fetchStudentAttendance(studentId);
    fetchStudentSummary(studentId);
  }, [studentId]);

  return (
    <div>
      {summary && <div>Attendance Rate: {summary.attendance_percentage}%</div>}
      {records.map((record) => (
        <div key={record.id}>
          {formatAttendanceDate(record.attendance_date)} -{" "}
          {formatAttendanceStatus(record.attendance_status, true)}
        </div>
      ))}
    </div>
  );
}
```

## ⚠️ Error Handling

```typescript
// Always check result.success
const result = await studentAttendanceService.markAttendance(data);

if (result.success) {
  console.log("Success:", result.data);
} else if (result.validation_errors) {
  // Handle validation errors
  result.validation_errors.forEach((err) => {
    console.error(`${err.field}: ${err.message}`);
  });
} else {
  // Handle other errors
  console.error("Error:", result.error);
}
```

## 🔒 Role-Based Access

```typescript
// Students: Read their own attendance only
await fetchStudentAttendance(currentUserId);

// Teachers: Mark attendance for their classes
await fetchTeacherAttendance(currentUserId);

// Branch Managers: View branch attendance
await fetchBranchAttendance(currentBranchId);
```

## 🚀 Performance Tips

1. **Use RPC functions**: System automatically uses DB functions when available
2. **Filter early**: Set filters before fetching large datasets
3. **Paginate**: Use reasonable page sizes (default: 20)
4. **Cache daily records**: Daily attendance is cached in store
5. **Batch operations**: Use bulk mark for multiple students

## 🎨 UI Integration

```typescript
// Get status styling
const statusConfig = getAttendanceStatusConfig(record.attendance_status);
<span className={`status ${statusConfig.color}`}>
  {statusConfig.emoji} {statusConfig.label}
</span>;

// Get performance color
const color = getAttendancePerformanceColor(attendancePercentage);
<div className={`performance ${color}`}>{attendancePercentage}%</div>;
```

## 📱 Quick Commands

```bash
# Check all files exist
ls -la lib/branch-system/student-attendance*
ls -la lib/branch-system/types/student-attendance.types.ts
ls -la lib/branch-system/validations/student-attendance.validation.ts
ls -la lib/branch-system/utils/student-attendance.utils.ts
ls -la lib/branch-system/services/student-attendance.service.ts
ls -la lib/branch-system/stores/student-attendance.store.ts
```

---

## 🎯 Ready to Use!

The Student Attendance System is complete and ready for production use. Just import and start marking attendance! 🚀

**Key Features:**

- ✅ Role-based access control
- ✅ Real-time updates
- ✅ Comprehensive validation
- ✅ Analytics & reporting
- ✅ Bulk operations
- ✅ Mobile-friendly
- ✅ TypeScript safety
- ✅ Error handling
