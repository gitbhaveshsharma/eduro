# Upcoming Classes - Quick Reference Guide

## 🚀 Quick Start

### For Students Dashboard

```tsx
import {
  useBranchClassesStore,
  useUpcomingClasses,
} from "@/lib/branch-system/stores/branch-classes.store";
import { mapUpcomingClassData } from "@/lib/branch-system/utils/branch-classes.utils";

function StudentDashboard({ studentId }) {
  const fetchUpcomingClasses = useBranchClassesStore(
    (state) => state.fetchUpcomingClasses
  );
  const upcomingData = useUpcomingClasses(studentId);
  const loading = useBranchClassesStore(
    (state) => state.loading.upcomingClasses
  );

  useEffect(() => {
    fetchUpcomingClasses(studentId);
  }, [studentId, fetchUpcomingClasses]);

  const classes = upcomingData ? upcomingData.map(mapUpcomingClassData) : [];

  return <UpcomingClasses classes={classes} loading={loading} />;
}
```

## 📊 API Reference

### Service Method

```typescript
branchClassesService.getUpcomingClasses(studentId: string)
  → Promise<BranchClassOperationResult<UpcomingClassData[]>>
```

### Store Actions

```typescript
// Fetch with cache (5-min TTL)
fetchUpcomingClasses(studentId: string, forceRefresh?: boolean): Promise<void>

// Get cached data
getUpcomingClasses(studentId: string): UpcomingClassData[] | null
```

### Store Hooks

```typescript
// Get upcoming classes data
useUpcomingClasses(studentId: string | null): UpcomingClassData[] | null

// Get loading state
useBranchClassesStore(state => state.loading.upcomingClasses): boolean

// Get error state
useBranchClassesStore(state => state.errors.upcomingClasses): string | null
```

## 🎨 Data Mapping

### Transform RPC → UI

```typescript
import { mapUpcomingClassData } from "@/lib/branch-system/utils/branch-classes.utils";

const uiClasses = rpcData.map(mapUpcomingClassData);
// Returns: UpcomingClass[]
```

### Subject Mapping

```typescript
import {
  mapSubjectToId,
  getSubjectColor,
} from "@/lib/branch-system/utils/branch-classes.utils";

const subjectId = mapSubjectToId("Mathematics"); // → 'mathematics'
const colorClass = getSubjectColor("mathematics"); // → 'bg-blue-100 text-blue-800'
```

## 🔄 Cache Control

### Auto Cache (Default)

```tsx
// Uses cache if < 5 minutes old
fetchUpcomingClasses(studentId);
```

### Force Refresh

```tsx
// Bypass cache, fetch fresh data
fetchUpcomingClasses(studentId, true);
```

### Manual Cache Clear

```tsx
const clearCache = useBranchClassesStore((state) => state.clearCache);
clearCache(); // Clears all caches including upcoming classes
```

## 📝 Type Reference

### UpcomingClassData (RPC Response)

```typescript
interface UpcomingClassData {
  // Enrollment
  enrollment_id: string;
  enrollment_status: EnrollmentStatus;
  attendance_percentage: number;
  current_grade: string | null;
  preferred_batch: string | null;

  // Class Info
  class_id: string;
  class_name: string;
  subject: string;
  description: string | null;
  grade_level: string;
  batch_name: string | null;

  // Schedule
  start_date: string;
  end_date: string;
  class_days: DayOfWeek[];
  start_time: string;
  end_time: string;

  // Relations
  teacher_id: string | null;
  branch_id: string;
}
```

### UpcomingClass (UI Component)

```typescript
interface UpcomingClass {
  id: string;
  title: string;
  subject: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  startTime: string;
  participants: {
    avatars: string[];
    count: number;
  };
}
```

## 🎯 Common Patterns

### Pattern 1: Fetch & Display

```tsx
function MyComponent({ studentId }) {
  const { fetchUpcomingClasses } = useBranchClassesStore();
  const classes = useUpcomingClasses(studentId);

  useEffect(() => {
    fetchUpcomingClasses(studentId);
  }, [studentId]);

  return <ClassList classes={classes} />;
}
```

### Pattern 2: With Loading State

```tsx
function MyComponent({ studentId }) {
  const { fetchUpcomingClasses } = useBranchClassesStore();
  const classes = useUpcomingClasses(studentId);
  const loading = useBranchClassesStore((s) => s.loading.upcomingClasses);

  useEffect(() => {
    fetchUpcomingClasses(studentId);
  }, [studentId]);

  if (loading) return <Skeleton />;
  if (!classes) return <EmptyState />;
  return <ClassList classes={classes} />;
}
```

### Pattern 3: With Error Handling

```tsx
function MyComponent({ studentId }) {
  const { fetchUpcomingClasses } = useBranchClassesStore();
  const classes = useUpcomingClasses(studentId);
  const error = useBranchClassesStore((s) => s.errors.upcomingClasses);

  useEffect(() => {
    fetchUpcomingClasses(studentId);
  }, [studentId]);

  if (error) return <ErrorMessage error={error} />;
  return <ClassList classes={classes} />;
}
```

### Pattern 4: With Refresh Button

```tsx
function MyComponent({ studentId }) {
  const { fetchUpcomingClasses } = useBranchClassesStore();
  const classes = useUpcomingClasses(studentId);
  const loading = useBranchClassesStore((s) => s.loading.upcomingClasses);

  const handleRefresh = () => {
    fetchUpcomingClasses(studentId, true); // Force refresh
  };

  return (
    <>
      <button onClick={handleRefresh} disabled={loading}>
        Refresh
      </button>
      <ClassList classes={classes} />
    </>
  );
}
```

## 🐛 Debugging

### Check Cache State

```tsx
const cache = useBranchClassesStore((state) => state.upcomingClassesCache);
console.log("Cache:", cache);
```

### Check Cache Age

```tsx
const cache = useBranchClassesStore(
  (state) => state.upcomingClassesCache[studentId]
);
if (cache) {
  const age = Date.now() - cache.timestamp;
  console.log("Cache age (seconds):", Math.round(age / 1000));
}
```

### Check Inflight Requests

```tsx
const inflight = useBranchClassesStore((state) => state.inflightRequests);
console.log("Inflight requests:", inflight);
```

## ⚡ Performance Tips

1. **Cache First**: Default behavior uses cache, reducing API calls
2. **Conditional Fetch**: Only fetch for students (`if (isStudent && studentId)`)
3. **Single Hook**: Use `useUpcomingClasses` hook instead of multiple selectors
4. **Memoization**: Results are memoized by Zustand automatically
5. **Inflight Tracking**: Multiple calls deduplicated automatically

## 🔧 Configuration

### Adjust Cache TTL

```typescript
// In branch-classes.store.ts
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (default)
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL = 60 * 1000; // 1 minute
```

### Custom Subject Colors

```typescript
// In branch-classes.utils.ts
export function getSubjectColor(subjectId: string): string {
  const colorMap: Record<string, string> = {
    mathematics: "bg-blue-100 text-blue-800",
    // Add your custom colors here
  };
  return colorMap[subjectId] || "bg-gray-100 text-gray-800";
}
```

## 📚 Related Files

| File                           | Purpose           |
| ------------------------------ | ----------------- |
| `branch-classes.types.ts`      | Type definitions  |
| `branch-classes.service.ts`    | API service layer |
| `branch-classes.store.ts`      | State management  |
| `branch-classes.utils.ts`      | Helper functions  |
| `branch-classes.validation.ts` | Zod schemas       |
| `learning-dashboard/index.tsx` | UI integration    |

## 🎓 Best Practices

✅ **DO**:

- Use the store hooks for reactive updates
- Map data with `mapUpcomingClassData` for UI consistency
- Handle loading and error states
- Use cache for better performance
- Force refresh only when necessary (user action)

❌ **DON'T**:

- Call service directly from components (use store)
- Fetch repeatedly without cache checks
- Forget to handle empty states
- Hardcode subject mappings
- Ignore error states

## 🔗 Quick Links

- Main Implementation: `UPCOMING_CLASSES_IMPLEMENTATION.md`
- Dashboard Component: `components/dashboard/learning-dashboard/index.tsx`
- Store Documentation: `lib/branch-system/stores/branch-classes.store.ts`
- Utils Documentation: `lib/branch-system/utils/branch-classes.utils.ts`
