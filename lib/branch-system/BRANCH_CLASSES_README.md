# Branch Classes System - Complete Documentation

## 📚 Overview

A comprehensive, production-ready implementation of the branch classes system with clean architecture, type safety, and state management.

## 🏗️ Architecture

```
lib/branch-system/
├── branch-classes.ts              # Main export file
├── types/
│   └── branch-classes.types.ts    # TypeScript interfaces & types
├── validations/
│   └── branch-classes.validation.ts # Zod validation schemas
├── services/
│   └── branch-classes.service.ts  # Database operations & API
├── stores/
│   └── branch-classes.store.ts    # Zustand state management
└── utils/
    └── branch-classes.utils.ts    # Helper functions & formatters
```

## ✨ Features

### ✅ Type Safety

- Complete TypeScript definitions matching database schema
- Type-safe service methods
- Inferred types from Zod schemas

### ✅ Validation

- Comprehensive Zod schemas
- Server-side and client-side validation
- Detailed error messages

### ✅ State Management

- Zustand store with normalized caching
- Optimistic updates
- Loading and error states
- UI state management

### ✅ Clean Code

- Single Responsibility Principle
- Pure functions with no side effects
- Well-documented with JSDoc comments
- Consistent naming conventions

## 📖 Database Schema

### Table: `branch_classes`

| Column             | Type         | Description                        |
| ------------------ | ------------ | ---------------------------------- |
| id                 | UUID         | Primary key                        |
| branch_id          | UUID         | References coaching_branches       |
| class_name         | TEXT         | Class name                         |
| subject            | TEXT         | Subject taught                     |
| description        | TEXT         | Class description                  |
| grade_level        | TEXT         | Grade level (e.g., "10th", "12th") |
| batch_name         | TEXT         | Batch identifier                   |
| start_date         | DATE         | Class start date                   |
| end_date           | DATE         | Class end date                     |
| class_days         | TEXT[]       | Days of week                       |
| start_time         | TIME         | Class start time                   |
| end_time           | TIME         | Class end time                     |
| max_students       | INTEGER      | Maximum capacity (default: 30)     |
| current_enrollment | INTEGER      | Current enrolled count             |
| fees_frequency     | TEXT         | MONTHLY, QUARTERLY, YEARLY         |
| teacher_id         | UUID         | Assigned teacher                   |
| status             | class_status | ACTIVE, INACTIVE, FULL, COMPLETED  |
| is_visible         | BOOLEAN      | Visibility flag                    |
| prerequisites      | TEXT[]       | Required prerequisites             |
| materials_required | TEXT[]       | Required materials                 |
| metadata           | JSONB        | Additional data                    |
| created_at         | TIMESTAMPTZ  | Creation timestamp                 |
| updated_at         | TIMESTAMPTZ  | Update timestamp                   |

## 🚀 Quick Start

### 1. Import the Module

```typescript
import {
  // Types
  BranchClass,
  CreateBranchClassInput,

  // API
  BranchClassesAPI,

  // Hooks
  useClassesByBranch,
  useClassesLoading,

  // Utilities
  formatClassSchedule,
  getClassAvailability,
} from "@/lib/branch-system/branch-classes";
```

### 2. Fetch Classes

```typescript
import { useEffect } from "react";
import {
  useClassesByBranch,
  BranchClassesAPI,
} from "@/lib/branch-system/branch-classes";

function BranchClassesList({ branchId }: { branchId: string }) {
  const classes = useClassesByBranch(branchId);
  const { fetchClasses } = useClassesLoading();

  useEffect(() => {
    BranchClassesAPI.fetchBranchClasses(branchId);
  }, [branchId]);

  if (fetchClasses) return <div>Loading...</div>;

  return (
    <div>
      {classes.map((cls) => (
        <div key={cls.id}>
          <h3>{cls.class_name}</h3>
          <p>
            {cls.subject} - {cls.grade_level}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Create a Class

```typescript
import {
  BranchClassesAPI,
  validateCreateBranchClass,
} from "@/lib/branch-system/branch-classes";

async function handleCreateClass(formData: unknown) {
  // Validate input
  const validation = validateCreateBranchClass(formData);

  if (!validation.success) {
    console.error("Validation errors:", validation.error);
    return;
  }

  // Create class
  const success = await BranchClassesAPI.create(validation.data);

  if (success) {
    console.log("Class created successfully!");
  } else {
    console.error("Failed to create class");
  }
}

// Example usage
handleCreateClass({
  branch_id: "uuid-here",
  class_name: "Mathematics Grade 10",
  subject: "Mathematics",
  grade_level: "10th",
  batch_name: "Morning Batch",
  start_date: "2024-01-01",
  end_date: "2024-12-31",
  class_days: ["Monday", "Wednesday", "Friday"],
  start_time: "09:00",
  end_time: "11:00",
  max_students: 30,
  fees_frequency: "MONTHLY",
  status: "ACTIVE",
});
```

### 4. Update a Class

```typescript
const success = await BranchClassesAPI.update(classId, {
  status: "INACTIVE",
  max_students: 35,
});
```

### 5. Use Utilities

```typescript
import {
  formatClassSchedule,
  getClassAvailability,
  calculateUtilization,
} from "@/lib/branch-system/branch-classes";

function ClassCard({ class: cls }: { class: BranchClass }) {
  const schedule = formatClassSchedule(cls);
  const availability = getClassAvailability(cls);
  const utilization = calculateUtilization(cls);

  return (
    <div className="class-card">
      <h3>{cls.class_name}</h3>
      <p>{schedule}</p>
      <p>Available: {availability.available_seats} seats</p>
      <p>Utilization: {utilization}%</p>
      {!availability.can_enroll && (
        <span className="badge">{availability.reason}</span>
      )}
    </div>
  );
}
```

## 🎯 API Reference

### BranchClassesAPI

Unified API for all operations:

```typescript
BranchClassesAPI.fetchClass(classId, forceRefresh?)
BranchClassesAPI.fetchBranchClasses(branchId, forceRefresh?)
BranchClassesAPI.fetchTeacherClasses(teacherId, forceRefresh?)
BranchClassesAPI.search(filters?, sort?, pagination?)
BranchClassesAPI.fetchStats(branchId, forceRefresh?)

BranchClassesAPI.create(input)
BranchClassesAPI.update(classId, input)
BranchClassesAPI.delete(classId)
BranchClassesAPI.updateStatus(classId, status)
BranchClassesAPI.updateVisibility(classId, isVisible)

BranchClassesAPI.clearCache()
BranchClassesAPI.clearBranchCache(branchId)
BranchClassesAPI.invalidateClass(classId)
```

### React Hooks

```typescript
// Get data from cache
useClass(classId);
useClassesByBranch(branchId);
useClassesByTeacher(teacherId);
useSearchResults();
useBranchStats(branchId);

// Get state
useClassesLoading();
useClassesErrors();
useClassesUI();
useSelectedClass();
```

### Service Methods

Direct service access (bypasses cache):

```typescript
import { branchClassesService } from "@/lib/branch-system/branch-classes";

const result = await branchClassesService.getClassById(classId);
const result = await branchClassesService.createClass(input);
const result = await branchClassesService.searchClasses(
  filters,
  sort,
  pagination
);
// ... and more
```

## 🔧 Utilities Reference

### Formatting

```typescript
formatTime(time); // "02:30 PM"
formatTime24(time); // "14:30"
formatDate(date, format); // "January 15, 2024"
formatClassDays(days); // "Mon, Wed, Fri"
formatClassSchedule(cls); // "Mon, Wed, Fri • 09:00 AM - 11:00 AM"
formatFeeFrequency(freq); // "Monthly"
formatClassStatus(status); // { label, color, description }
formatClassDuration(start, end); // "2h 30m"
```

### Calculations

```typescript
calculateAvailableSeats(cls); // number
calculateUtilization(cls); // 0-100
calculateClassDuration(start, end); // minutes
calculateWeeklyHours(cls); // total hours per week
```

### Validation & Checking

```typescript
isClassFull(cls); // boolean
isClassAvailable(cls); // boolean
getClassAvailability(cls); // ClassAvailability object
hasClassStarted(cls); // boolean
hasClassEnded(cls); // boolean
getClassTimeStatus(cls); // 'upcoming' | 'ongoing' | 'completed'
```

### Transformations

```typescript
toPublicBranchClass(cls); // Converts to public class
createClassScheduleInfo(cls, teacherName); // Array of schedule info
```

### Filtering & Sorting

```typescript
filterClassesBySearch(classes, query);
sortClasses(classes, field, direction);
groupClassesBySubject(classes);
groupClassesByGrade(classes);
```

### Statistics

```typescript
calculateClassStats(classes); // BranchClassStats
```

### Display Helpers

```typescript
getClassDisplayName(cls); // "Math Class (Morning Batch)"
getClassSubtitle(cls); // "Mathematics • 10th"
getCapacityDisplay(cls); // "25/30 students"
getAvailabilityBadgeText(cls); // "5 seats left"
```

## 📝 Validation

### Create Class Validation

```typescript
import { validateCreateBranchClass } from "@/lib/branch-system/branch-classes";

const validation = validateCreateBranchClass({
  branch_id: "uuid",
  class_name: "Mathematics",
  subject: "Math",
  grade_level: "10th",
  // ... more fields
});

if (validation.success) {
  // Use validation.data (typed and validated)
} else {
  // Handle validation.error
}
```

### Update Class Validation

```typescript
import { validateUpdateBranchClass } from "@/lib/branch-system/branch-classes";

const validation = validateUpdateBranchClass({
  status: "INACTIVE",
  max_students: 35,
});
```

### Custom Validation Schemas

```typescript
import {
  classNameSchema,
  timeRangeSchema,
  classDaysSchema,
} from "@/lib/branch-system/branch-classes";

// Use individual schemas for custom forms
```

## 🎨 UI Examples

### Class List with Search

```typescript
function ClassList() {
  const searchResults = useSearchResults();
  const { search: isSearching } = useClassesLoading();
  const { currentFilters, currentSort } = useClassesUI();

  const handleSearch = (query: string) => {
    BranchClassesAPI.search({ search_query: query }, currentSort);
  };

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      {isSearching ? (
        <Spinner />
      ) : (
        <div>
          {searchResults?.classes.map((cls) => (
            <ClassCard key={cls.id} class={cls} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Create Class Form

```typescript
function CreateClassForm({ branchId }: { branchId: string }) {
  const { isCreating } = useClassesUI();
  const { createClass: isCreating } = useClassesLoading();

  useEffect(() => {
    BranchClassesAPI.startCreating(branchId);
    return () => BranchClassesAPI.cancelCreating();
  }, [branchId]);

  const handleSubmit = async (formData: CreateBranchClassInput) => {
    const success = await BranchClassesAPI.create(formData);
    if (success) {
      // Navigate or show success message
    }
  };

  return <ClassForm onSubmit={handleSubmit} loading={isCreating} />;
}
```

## 🔍 Advanced Usage

### Custom Filters

```typescript
const filters: BranchClassFilters = {
  branch_id: "uuid",
  status: ["ACTIVE", "FULL"],
  grade_level: "10th",
  has_available_seats: true,
  class_days: ["Monday", "Wednesday"],
  search_query: "math",
};

await BranchClassesAPI.search(filters);
```

### Pagination

```typescript
const pagination = { page: 2, limit: 10 };
await BranchClassesAPI.search({}, undefined, pagination);
```

### Direct Service Access

```typescript
import { branchClassesService } from "@/lib/branch-system/branch-classes";

// Get with relations (includes branch and teacher info)
const result = await branchClassesService.getClassWithRelations(classId);

if (result.success && result.data) {
  console.log(result.data.branch);
  console.log(result.data.teacher);
}
```

## 🧪 Testing Examples

### Mock Data

```typescript
import { BranchClass } from "@/lib/branch-system/branch-classes";

const mockClass: BranchClass = {
  id: "test-uuid",
  branch_id: "branch-uuid",
  class_name: "Test Class",
  subject: "Mathematics",
  grade_level: "10th",
  status: "ACTIVE",
  max_students: 30,
  current_enrollment: 15,
  // ... rest of fields
};
```

### Test Utilities

```typescript
import {
  calculateAvailableSeats,
  isClassFull,
} from "@/lib/branch-system/branch-classes";

describe("Class Utilities", () => {
  it("should calculate available seats", () => {
    const seats = calculateAvailableSeats(mockClass);
    expect(seats).toBe(15);
  });

  it("should detect full class", () => {
    const fullClass = { ...mockClass, current_enrollment: 30 };
    expect(isClassFull(fullClass)).toBe(true);
  });
});
```

## 📊 Performance Optimizations

### Caching Strategy

- Normalized cache by ID for O(1) lookups
- Separate caches for branches and teachers
- Automatic cache invalidation on updates
- Manual cache control available

### Best Practices

```typescript
// ✅ Good: Use cache for repeated access
const classes = useClassesByBranch(branchId);

// ❌ Avoid: Fetching same data multiple times
useEffect(() => {
  BranchClassesAPI.fetchBranchClasses(branchId);
}, [branchId]);

// ✅ Better: Check cache first
useEffect(() => {
  if (classes.length === 0) {
    BranchClassesAPI.fetchBranchClasses(branchId);
  }
}, [branchId, classes]);
```

## 🔒 Security & Permissions

RLS policies are enforced at the database level:

- **Students**: READ-ONLY access to active, visible classes
- **Teachers**: Can view and update their assigned classes
- **Branch Managers**: Full CRUD on classes in their branch
- **Coaches**: Full access to all classes
- **Admins**: Full access to everything

## 🐛 Error Handling

All operations return a result object:

```typescript
const result = await BranchClassesAPI.create(input);

if (result.success) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  console.error(result.error);
  console.error(result.validation_errors);
}
```

## 📦 Dependencies

- `zod`: Schema validation
- `zustand`: State management
- `@supabase/supabase-js`: Database client

## 🤝 Contributing

When extending this system:

1. **Add types** to `types/branch-classes.types.ts`
2. **Add validation** to `validations/branch-classes.validation.ts`
3. **Add utilities** to `utils/branch-classes.utils.ts`
4. **Add service methods** to `services/branch-classes.service.ts`
5. **Update store** if needed in `stores/branch-classes.store.ts`
6. **Export** in `branch-classes.ts`

## 📝 License

Part of the Eduro project.
