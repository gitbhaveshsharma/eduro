# 📚 Assignment & Quiz System - Implementation Guide

> **Complete implementation of the Assignment & Quiz management system for the Eduro LMS platform**

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Detailed Documentation](#detailed-documentation)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Assignment System is a comprehensive solution for managing assignments in an educational platform. It supports both **FILE** and **TEXT** submission types, with features for grading, late submissions, rubric-based assessment, and automated cleanup.

### Business Logic

#### **Teacher Workflow**

1. Create assignments (draft mode)
2. Configure submission settings (type, due dates, late penalties)
3. Publish assignments to students
4. Grade submissions with feedback
5. Track class performance

#### **Student Workflow**

1. View published assignments
2. Submit assignments (files or text)
3. Save drafts before final submission
4. Check grades and feedback
5. Request regrading if needed

#### **System Features**

- Auto-cleanup of old submissions
- Late penalty calculation
- Rubric-based grading
- Statistics and reports
- File management with size limits

---

## 🏗️ Architecture

### Design Patterns

1. **Singleton Pattern**: Service layer for database operations
2. **State Management**: Zustand with Immer for React state
3. **Validation**: Zod schemas for runtime type safety
4. **Pure Functions**: Utility functions without side effects
5. **Type Safety**: Full TypeScript coverage

### Technology Stack

- **Database**: Supabase/PostgreSQL with RLS
- **State**: Zustand v4+ (with devtools, persist, immer)
- **Validation**: Zod for schema validation
- **Framework**: Next.js with App Router
- **Language**: TypeScript 5.0+

---

## 📁 File Structure

```
lib/branch-system/
├── assignment.ts                    # 🎯 Central export file (~300 lines)
├── types/
│   └── assignment.types.ts         # 📝 Type definitions (~350 lines)
├── validations/
│   └── assignment.validation.ts    # ✅ Zod schemas (~300 lines)
├── utils/
│   └── assignment.utils.ts         # 🔧 Utility functions (~500 lines)
├── services/
│   └── assignment.service.ts       # 💾 Database service (~700 lines)
└── stores/
    └── assignment.store.ts         # 🗃️ State management (~850 lines)
```

### File Breakdown

| File                         | Purpose                       | Lines | Key Exports                             |
| ---------------------------- | ----------------------------- | ----- | --------------------------------------- |
| **assignment.types.ts**      | All TypeScript types & enums  | ~350  | 5 enums, 20+ interfaces, 15+ DTOs       |
| **assignment.validation.ts** | Zod validation schemas        | ~300  | 15+ schemas with cross-field validation |
| **assignment.utils.ts**      | Pure utility functions        | ~500  | 50+ utility functions                   |
| **assignment.service.ts**    | Singleton database service    | ~700  | 30+ database methods                    |
| **assignment.store.ts**      | Zustand state management      | ~850  | 40+ actions, 30+ hooks                  |
| **assignment.ts**            | Central exports + convenience | ~300  | Re-exports + bundled system             |

**Total**: ~3,000 lines of clean, well-documented code

---

## ✨ Key Features

### 1. Assignment Management

- ✅ Draft/Published/Closed status lifecycle
- ✅ Two submission types: FILE or TEXT
- ✅ Configurable max submissions (1-10)
- ✅ Late submission handling with penalties
- ✅ Auto-publish scheduling
- ✅ Assignment visibility controls

### 2. Grading System

- ✅ Manual and auto-grading support
- ✅ Rubric-based assessment (up to 20 criteria)
- ✅ Score ranges: 0-10,000 points
- ✅ Feedback and comments
- ✅ Grade update history
- ✅ Regrade requests

### 3. Submission Features

- ✅ Draft save before final submission
- ✅ Multiple attempt support
- ✅ Late submission detection
- ✅ File upload with validation
- ✅ Text editor submission
- ✅ Submission history tracking

### 4. File Management

- ✅ File size limits (default 10MB, max 100MB)
- ✅ Extension whitelist (configurable)
- ✅ Multiple file attachments
- ✅ Instruction file attachment
- ✅ Automatic compression
- ✅ Storage provider abstraction (local/S3/GCS)

### 5. Statistics & Reports

- ✅ Assignment statistics (submission rates, scores)
- ✅ Student summary (all assignments)
- ✅ Class report (performance overview)
- ✅ Real-time calculation
- ✅ Export-ready data

### 6. Auto-Cleanup

- ✅ Configurable cleanup frequency (30/60/90 days, semester, never)
- ✅ Separate settings for submissions and instructions
- ✅ Cleanup logs and tracking
- ✅ Storage usage monitoring

---

## 🚀 Quick Start

### Installation

```bash
# No installation needed - files are already in the codebase
# Just import and use!
```

### Basic Usage

#### 1. Import the System

```typescript
import {
  useAssignmentActions,
  useAssignments,
  useCurrentAssignment,
  AssignmentStatus,
  AssignmentSubmissionType,
} from "@/lib/branch-system/assignment";
```

#### 2. Teacher: Create an Assignment

```typescript
"use client";

import { useAssignmentActions } from "@/lib/branch-system/assignment";

export default function CreateAssignmentPage() {
  const { createAssignment, publishAssignment } = useAssignmentActions();

  const handleCreateAssignment = async () => {
    const success = await createAssignment({
      class_id: "uuid-here",
      teacher_id: "teacher-uuid",
      branch_id: "branch-uuid",
      title: "Week 5: Climate Change Essay",
      description: "Write a comprehensive essay about climate change impacts",
      instructions: "Must be 500-1000 words, use proper citations...",
      submission_type: "TEXT",
      max_score: 100,
      due_date: "2024-12-31T23:59:59Z",
      allow_late_submission: true,
      late_penalty_percentage: 10,
    });

    if (success) {
      console.log("Assignment created successfully!");
    }
  };

  return <button onClick={handleCreateAssignment}>Create Assignment</button>;
}
```

#### 3. Student: Submit an Assignment

```typescript
"use client";

import {
  useAssignmentActions,
  useAssignments,
} from "@/lib/branch-system/assignment";
import { useEffect } from "react";

export default function StudentAssignmentView() {
  const { fetchAssignments, submitAssignment } = useAssignmentActions();
  const assignments = useAssignments();

  useEffect(() => {
    fetchAssignments({
      class_id: "student-class-uuid",
      status: "PUBLISHED",
    });
  }, []);

  const handleSubmit = async (assignmentId: string, text: string) => {
    const success = await submitAssignment({
      assignment_id: assignmentId,
      student_id: "student-uuid",
      class_id: "class-uuid",
      submission_text: text,
      is_final: true,
    });

    if (success) {
      console.log("Assignment submitted!");
    }
  };

  return (
    <div>
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onSubmit={(text) => handleSubmit(assignment.id, text)}
        />
      ))}
    </div>
  );
}
```

#### 4. Teacher: Grade Submissions

```typescript
"use client";

import {
  useAssignmentActions,
  useSubmissionsForGrading,
} from "@/lib/branch-system/assignment";
import { useEffect } from "react";

export default function GradingView({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const { fetchSubmissionsForGrading, gradeSubmission } =
    useAssignmentActions();
  const submissions = useSubmissionsForGrading();

  useEffect(() => {
    fetchSubmissionsForGrading(assignmentId);
  }, [assignmentId]);

  const handleGrade = async (submissionId: string) => {
    const success = await gradeSubmission({
      submission_id: submissionId,
      graded_by: "teacher-uuid",
      score: 85,
      feedback: "Excellent work! Consider adding more examples in section 2.",
    });

    if (success) {
      console.log("Submission graded!");
    }
  };

  return (
    <div>
      {submissions.map((sub) => (
        <div key={sub.id}>
          <h3>{sub.student_name}</h3>
          <p>Submitted: {sub.submitted_at}</p>
          <button onClick={() => handleGrade(sub.id)}>Grade Submission</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 📖 Detailed Documentation

### 1. Types & Enums (`assignment.types.ts`)

#### Core Enums

```typescript
// Submission type
enum AssignmentSubmissionType {
  FILE = "FILE", // Students upload files
  TEXT = "TEXT", // Students write text
}

// Assignment lifecycle
enum AssignmentStatus {
  DRAFT = "DRAFT", // Not visible to students
  PUBLISHED = "PUBLISHED", // Active, students can submit
  CLOSED = "CLOSED", // No more submissions
}

// Grading state
enum GradingStatus {
  NOT_GRADED = "NOT_GRADED", // Awaiting teacher review
  AUTO_GRADED = "AUTO_GRADED", // Graded by system
  MANUAL_GRADED = "MANUAL_GRADED", // Graded by teacher
}

// Student view status
enum StudentSubmissionStatus {
  NOT_STARTED = "NOT_STARTED", // No submission yet
  DRAFT_SAVED = "DRAFT_SAVED", // Draft saved
  SUBMITTED = "SUBMITTED", // Final submission
  LATE = "LATE", // Late submission
  GRADED = "GRADED", // Teacher graded
}

// Cleanup frequency
enum CleanupFrequency {
  DAYS_30 = "30_DAYS",
  DAYS_60 = "60_DAYS",
  DAYS_90 = "90_DAYS",
  SEMESTER_END = "SEMESTER_END",
  NEVER = "NEVER",
}
```

#### Key Interfaces

```typescript
// Main assignment type
interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  branch_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  submission_type: AssignmentSubmissionType;
  max_score: number;
  due_date: string;
  status: AssignmentStatus;
  is_visible: boolean;
  // ... 20+ more fields

  // Relations
  class?: {
    id: string;
    class_name: string;
    subject: string;
    grade_level: string;
  };
  teacher?: { id: string; full_name: string; avatar_url: string | null };
  branch?: { id: string; name: string };
  instruction_file?: AssignmentFile | null;
  attachments?: AssignmentFile[];
}

// Submission type
interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  class_id: string;
  submission_text: string | null;
  submission_file_id: string | null;
  is_final: boolean;
  is_late: boolean;
  late_minutes: number;
  grading_status: GradingStatus;
  score: number | null;
  feedback: string | null;
  // ... more fields

  // Relations
  assignment?: Partial<Assignment>;
  student?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  submission_file?: AssignmentFile | null;
}
```

#### DTOs (Data Transfer Objects)

```typescript
// Create assignment
interface CreateAssignmentDTO {
  class_id: string;
  teacher_id: string;
  branch_id: string;
  title: string;
  description?: string;
  instructions?: string;
  submission_type: AssignmentSubmissionType;
  max_score: number;
  due_date: string;
  allow_late_submission?: boolean;
  late_penalty_percentage?: number;
  // ... more fields
}

// Submit assignment
interface SubmitAssignmentDTO {
  assignment_id: string;
  student_id: string;
  class_id: string;
  submission_text?: string;
  submission_file_id?: string;
  is_final: boolean;
}

// Grade submission
interface GradeSubmissionDTO {
  submission_id: string;
  graded_by: string;
  score: number;
  feedback?: string;
  rubric_scores?: Array<{
    rubric_item_id: string;
    points_awarded: number;
    comment?: string;
  }>;
}
```

### 2. Validation Schemas (`assignment.validation.ts`)

All DTOs have corresponding Zod schemas for runtime validation:

```typescript
// Create assignment validation
const createAssignmentSchema = z
  .object({
    class_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    branch_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    submission_type: z.nativeEnum(AssignmentSubmissionType),
    max_score: z.number().positive().max(10000),
    due_date: z.string().refine((val) => !isNaN(Date.parse(val))),
    late_penalty_percentage: z.number().min(0).max(100).default(0),
    // ... more fields with validation rules
  })
  .refine(
    (data) => {
      // Cross-field validation: publish_at <= due_date
      if (data.publish_at && data.due_date) {
        return new Date(data.publish_at) <= new Date(data.due_date);
      }
      return true;
    },
    { message: "Publish date must be before or equal to due date" }
  );
```

**Key Validation Rules:**

- UUIDs for all IDs
- String length limits (title: 200, description: 2000, instructions: 10000)
- Score range: 0-10,000
- Late penalty: 0-100%
- File size: max 100MB
- Max submissions: 1-10
- Date validation with cross-field checks

### 3. Utility Functions (`assignment.utils.ts`)

50+ pure utility functions organized by category:

#### Status Utilities

```typescript
getAssignmentStatusConfig(status: AssignmentStatus)
getGradingStatusConfig(status: GradingStatus)
formatAssignmentStatus(status: AssignmentStatus, includeIcon?: boolean)
```

#### Date & Time Utilities

```typescript
getCurrentDateTime(): string
formatDateTime(dateTime: string, format: 'short' | 'long' | 'full' | 'relative')
formatRelativeTime(dateTime: string)
getDueDateStatus(dueDate: string): { isOverdue, isDueSoon, daysRemaining, ... }
calculateCleanupDate(dueDate: string, frequency: CleanupFrequency)
```

#### Score & Grading Utilities

```typescript
calculatePercentage(score: number, maxScore: number): number
getScorePerformanceLevel(percentage: number): string
calculateLatePenalty(originalScore: number, penaltyPercentage: number, lateMinutes: number)
calculateRubricTotal(rubricScores, rubricItems)
formatScore(score: number | null, maxScore: number, showPercentage?: boolean)
```

#### File Utilities

```typescript
formatFileSize(bytes: number): string
getFileExtension(fileName: string): string
isExtensionAllowed(fileName: string, allowedExtensions: string[] | null): boolean
validateFileSize(fileSize: number, maxSize?: number)
getMimeTypeIcon(mimeType: string | null): string
```

#### Statistics Utilities

```typescript
calculateAssignmentStatistics(totalStudents: number, submissions: AssignmentSubmission[])
calculateStudentSummary(assignments: Assignment[], submissions: AssignmentSubmission[])
calculateClassReport(classId, className, assignments, allSubmissions, totalStudents)
```

#### Submission Status Utilities

```typescript
determineStudentStatus(submission: AssignmentSubmission | null, assignment: Assignment)
canSubmit(assignment: Assignment, existingSubmission: AssignmentSubmission | null)
canEditAssignment(assignment: Assignment, hasSubmissions: boolean)
```

### 4. Service Layer (`assignment.service.ts`)

Singleton service with 30+ database methods:

#### CRUD Operations

```typescript
class AssignmentService {
  // Create & Update
  createAssignment(input: CreateAssignmentDTO): Promise<AssignmentOperationResult<Assignment>>
  updateAssignment(input: UpdateAssignmentDTO): Promise<AssignmentOperationResult<Assignment>>
  publishAssignment(input: PublishAssignmentDTO): Promise<AssignmentOperationResult<Assignment>>
  closeAssignment(input: CloseAssignmentDTO): Promise<AssignmentOperationResult<Assignment>>
  deleteAssignment(assignmentId: string): Promise<AssignmentOperationResult<{ id: string }>>

  // Read
  getAssignmentById(assignmentId: string, includeSubmissions?: boolean): Promise<...>
  listAssignments(params: AssignmentListParams): Promise<AssignmentOperationResult<AssignmentListResponse>>

  // Submission Operations
  submitAssignment(input: SubmitAssignmentDTO): Promise<AssignmentOperationResult<AssignmentSubmission>>
  saveDraft(input: SaveDraftDTO): Promise<AssignmentOperationResult<AssignmentSubmission>>
  getStudentSubmission(assignmentId: string, studentId: string): Promise<...>
  listSubmissions(params: SubmissionListParams): Promise<...>

  // Grading Operations
  gradeSubmission(input: GradeSubmissionDTO): Promise<AssignmentOperationResult<AssignmentSubmission>>
  updateGrade(input: UpdateGradeDTO): Promise<AssignmentOperationResult<AssignmentSubmission>>
  requestRegrade(input: RegradeRequestDTO): Promise<...>

  // Statistics
  getAssignmentStatistics(assignmentId: string): Promise<...>
  getStudentSummary(studentId: string, classId?: string): Promise<...>
  getClassReport(classId: string): Promise<...>

  // File Operations
  uploadFile(input: UploadFileDTO): Promise<AssignmentOperationResult<FileUploadResult>>
  deleteFile(fileId: string, userId: string): Promise<...>
  attachFileToAssignment(assignmentId: string, fileId: string, type: 'instruction' | 'attachment'): Promise<...>

  // Helper Methods
  getSubmissionsForGrading(assignmentId: string): Promise<...>
  getStudentSubmissionStatusList(assignmentId: string, classId: string): Promise<...>
}

// Singleton instance
export const assignmentService = AssignmentService.getInstance();
```

**Operation Result Pattern:**

```typescript
interface AssignmentOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validation_errors?: Array<{ field: string; message: string }>;
}
```

### 5. State Management (`assignment.store.ts`)

Zustand store with 40+ actions and 30+ hooks:

#### State Structure

```typescript
interface AssignmentState {
  // Data
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  currentAssignment: Assignment | null;
  currentSubmission: AssignmentSubmission | null;
  submissionsForGrading: SubmissionForGrading[];
  studentStatusList: StudentSubmissionStatusItem[];
  assignmentStatistics: AssignmentStatistics | null;
  studentSummary: StudentAssignmentSummary | null;
  classReport: ClassAssignmentReport | null;

  // UI State
  assignmentToDelete: Assignment | null;
  isDeleteDialogOpen: boolean;
  submissionToGrade: SubmissionForGrading | null;
  isGradingDialogOpen: boolean;

  // Filters & Pagination
  filters: AssignmentFilters;
  pagination: { page; limit; total; has_more };
  sort: { sort_by; sort_order };

  // Loading & Errors
  loading: {
    list;
    submissions;
    create;
    update;
    delete;
    publish;
    grade;
    statistics;
    upload;
  };
  error: string | null;
  successMessage: string | null;

  // Cache
  _cacheMetadata: CacheMetadata;
  _lastQueryHash: string | null;

  // Actions (40+)
  createAssignment: (input: CreateAssignmentDTO) => Promise<boolean>;
  updateAssignment: (input: UpdateAssignmentDTO) => Promise<boolean>;
  // ... all other actions
}
```

#### Selector Hooks (30+)

```typescript
// Data selectors
const useAssignments = () => useAssignmentStore((state) => state.assignments);
const useCurrentAssignment = () =>
  useAssignmentStore((state) => state.currentAssignment);
const useSubmissions = () => useAssignmentStore((state) => state.submissions);
const useSubmissionsForGrading = () =>
  useAssignmentStore((state) => state.submissionsForGrading);

// UI selectors
const useIsDeleteDialogOpen = () =>
  useAssignmentStore((state) => state.isDeleteDialogOpen);
const useIsGradingDialogOpen = () =>
  useAssignmentStore((state) => state.isGradingDialogOpen);

// Filter/Pagination selectors
const useAssignmentFilters = () => useAssignmentStore((state) => state.filters);
const useAssignmentPagination = () =>
  useAssignmentStore((state) => state.pagination);

// Loading/Error selectors
const useAssignmentLoading = () => useAssignmentStore((state) => state.loading);
const useAssignmentError = () => useAssignmentStore((state) => state.error);
```

#### Action Hooks

```typescript
const useCreateAssignment = () =>
  useAssignmentStore((state) => state.createAssignment);
const useUpdateAssignment = () =>
  useAssignmentStore((state) => state.updateAssignment);
const usePublishAssignment = () =>
  useAssignmentStore((state) => state.publishAssignment);
const useDeleteAssignment = () =>
  useAssignmentStore((state) => state.deleteAssignment);
const useFetchAssignments = () =>
  useAssignmentStore((state) => state.fetchAssignments);
const useSubmitAssignment = () =>
  useAssignmentStore((state) => state.submitAssignment);
const useGradeSubmission = () =>
  useAssignmentStore((state) => state.gradeSubmission);
// ... 30+ more
```

#### Combined Actions Hook

```typescript
const useAssignmentActions = () => {
  return {
    // CRUD
    createAssignment: useCreateAssignment(),
    updateAssignment: useUpdateAssignment(),
    publishAssignment: usePublishAssignment(),
    deleteAssignment: useDeleteAssignment(),
    fetchAssignments: useFetchAssignments(),
    // Submissions
    submitAssignment: useSubmitAssignment(),
    saveDraft: useSaveDraft(),
    // Grading
    gradeSubmission: useGradeSubmission(),
    updateGrade: useUpdateGrade(),
    // Statistics
    fetchAssignmentStatistics: useFetchAssignmentStatistics(),
    // ... all actions in one hook
  };
};
```

#### Cache Management

The store implements intelligent caching with different TTLs:

```typescript
const CACHE_DURATION = {
  LIST: 2 * 60 * 1000, // 2 minutes for list data
  SUBMISSIONS: 1 * 60 * 1000, // 1 minute for submissions
  STATISTICS: 5 * 60 * 1000, // 5 minutes for statistics
  SINGLE: 3 * 60 * 1000, // 3 minutes for single record
};
```

**Cache Features:**

- Automatic invalidation on mutations
- Per-assignment cache tracking
- Query hash-based cache keys
- Force refresh option
- Manual cache invalidation

### 6. Central Export (`assignment.ts`)

Convenience exports and bundles:

```typescript
// Individual exports
export { assignmentService } from './services/assignment.service';
export { useAssignmentStore, useAssignments, ... } from './stores/assignment.store';
export { Assignment, AssignmentStatus, ... } from './types/assignment.types';
export { createAssignmentSchema, ... } from './validations/assignment.validation';
export { formatDateTime, calculateLatePenalty, ... } from './utils/assignment.utils';

// Bundled system
export const assignmentSystem = {
  service: assignmentService,
  useStore: useAssignmentStore,
  useActions: useAssignmentActions,
  useAssignments,
  useCurrentAssignment,
  useLoading: useAssignmentLoading,
  useError: useAssignmentError,
  validation: {
    createAssignment: createAssignmentSchema,
    updateAssignment: updateAssignmentSchema,
    submitAssignment: submitAssignmentSchema,
    gradeSubmission: gradeSubmissionSchema,
    // ... all schemas
  },
};

export default assignmentSystem;
```

---

## 💡 Usage Examples

### Example 1: Complete Teacher Workflow

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  useAssignmentActions,
  useAssignments,
  useAssignmentLoading,
  useAssignmentError,
  AssignmentStatus,
} from "@/lib/branch-system/assignment";

export default function TeacherAssignmentDashboard() {
  const {
    fetchAssignments,
    createAssignment,
    publishAssignment,
    fetchSubmissionsForGrading,
    gradeSubmission,
  } = useAssignmentActions();

  const assignments = useAssignments();
  const loading = useAssignmentLoading();
  const error = useAssignmentError();

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Fetch teacher's assignments
  useEffect(() => {
    fetchAssignments({ teacher_id: "teacher-uuid" });
  }, []);

  // Create new assignment
  const handleCreate = async () => {
    const success = await createAssignment({
      class_id: "class-uuid",
      teacher_id: "teacher-uuid",
      branch_id: "branch-uuid",
      title: "Final Project",
      description: "Complete project with documentation",
      submission_type: "FILE",
      max_score: 100,
      due_date: "2024-12-31T23:59:59Z",
      allow_late_submission: true,
      late_penalty_percentage: 10,
    });

    if (success) {
      alert("Assignment created!");
    }
  };

  // Publish assignment
  const handlePublish = async (assignmentId: string) => {
    const success = await publishAssignment({
      id: assignmentId,
      notify_students: true,
    });

    if (success) {
      alert("Assignment published!");
    }
  };

  // View submissions for grading
  const handleViewSubmissions = async (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    await fetchSubmissionsForGrading(assignmentId);
  };

  if (loading.list) return <div>Loading assignments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>My Assignments</h1>
      <button onClick={handleCreate}>Create New Assignment</button>

      <div>
        {assignments.map((assignment) => (
          <div key={assignment.id}>
            <h2>{assignment.title}</h2>
            <p>Status: {assignment.status}</p>
            <p>Due: {assignment.due_date}</p>
            <p>
              Submissions: {assignment.total_submissions}/
              {assignment.class?.students_count || 0}
            </p>

            {assignment.status === AssignmentStatus.DRAFT && (
              <button onClick={() => handlePublish(assignment.id)}>
                Publish
              </button>
            )}

            {assignment.status === AssignmentStatus.PUBLISHED && (
              <button onClick={() => handleViewSubmissions(assignment.id)}>
                View Submissions ({assignment.total_submissions})
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Student Submission with Draft

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  useAssignmentActions,
  useCurrentAssignment,
  useCurrentSubmission,
  canSubmit,
} from "@/lib/branch-system/assignment";

export default function StudentSubmissionPage({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const {
    fetchAssignmentById,
    fetchStudentSubmission,
    submitAssignment,
    saveDraft,
  } = useAssignmentActions();

  const assignment = useCurrentAssignment();
  const submission = useCurrentSubmission();

  const [text, setText] = useState("");
  const [isDraft, setIsDraft] = useState(true);

  useEffect(() => {
    fetchAssignmentById(assignmentId);
    fetchStudentSubmission(assignmentId, "student-uuid");
  }, [assignmentId]);

  useEffect(() => {
    // Load existing draft
    if (submission?.submission_text) {
      setText(submission.submission_text);
      setIsDraft(!submission.is_final);
    }
  }, [submission]);

  const handleSaveDraft = async () => {
    const success = await saveDraft({
      assignment_id: assignmentId,
      student_id: "student-uuid",
      class_id: assignment!.class_id,
      submission_text: text,
    });

    if (success) {
      alert("Draft saved!");
    }
  };

  const handleSubmit = async () => {
    const submitCheck = canSubmit(assignment!, submission);

    if (!submitCheck.canSubmit) {
      alert(submitCheck.reason);
      return;
    }

    const success = await submitAssignment({
      assignment_id: assignmentId,
      student_id: "student-uuid",
      class_id: assignment!.class_id,
      submission_text: text,
      is_final: true,
    });

    if (success) {
      alert("Assignment submitted successfully!");
      setIsDraft(false);
    }
  };

  if (!assignment) return <div>Loading...</div>;

  return (
    <div>
      <h1>{assignment.title}</h1>
      <p>{assignment.description}</p>
      <p>Due: {assignment.due_date}</p>
      <p>Max Score: {assignment.max_score}</p>

      {submission?.is_final ? (
        <div>
          <h2>Your Submission</h2>
          <p>Submitted at: {submission.submitted_at}</p>
          {submission.is_late && (
            <p className="text-red-500">Late Submission</p>
          )}
          {submission.score !== null ? (
            <p>
              Score: {submission.score}/{assignment.max_score}
            </p>
          ) : (
            <p>Awaiting grading...</p>
          )}
          {submission.feedback && (
            <div>
              <h3>Feedback</h3>
              <p>{submission.feedback}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>Write Your Submission</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your assignment here..."
            rows={20}
            className="w-full p-2 border"
          />

          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveDraft}>Save Draft</button>
            <button onClick={handleSubmit} className="bg-blue-500 text-white">
              Submit Final
            </button>
          </div>

          {isDraft && (
            <p className="text-sm text-gray-500 mt-2">
              This is a draft. Click "Submit Final" to submit for grading.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Grading Interface

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  useAssignmentActions,
  useSubmissionsForGrading,
  formatDateTime,
  formatScore,
} from "@/lib/branch-system/assignment";

export default function GradingInterface({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const { fetchSubmissionsForGrading, gradeSubmission } =
    useAssignmentActions();
  const submissions = useSubmissionsForGrading();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchSubmissionsForGrading(assignmentId);
  }, [assignmentId]);

  const handleGrade = async () => {
    if (!selectedSubmission) return;

    const success = await gradeSubmission({
      submission_id: selectedSubmission.id,
      graded_by: "teacher-uuid",
      score: score,
      feedback: feedback,
    });

    if (success) {
      alert("Submission graded!");
      setSelectedSubmission(null);
      setScore(0);
      setFeedback("");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Submissions List */}
      <div>
        <h2>Submissions ({submissions.length})</h2>
        <div>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setSelectedSubmission(sub)}
              className={`p-4 border cursor-pointer ${
                selectedSubmission?.id === sub.id ? "bg-blue-100" : ""
              }`}
            >
              <h3>{sub.student_name}</h3>
              <p>Submitted: {formatDateTime(sub.submitted_at, "short")}</p>
              {sub.is_late && <span className="text-red-500">LATE</span>}
              {sub.grading_status === "MANUAL_GRADED" ? (
                <p>Score: {formatScore(sub.score, 100)}</p>
              ) : (
                <p className="text-orange-500">Needs Grading</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grading Panel */}
      <div>
        {selectedSubmission ? (
          <div>
            <h2>Grade: {selectedSubmission.student_name}</h2>
            <p>Attempt: #{selectedSubmission.attempt_number}</p>

            <div className="mt-4">
              <h3>Submission</h3>
              <div className="p-4 bg-gray-100 rounded">
                {selectedSubmission.submission_text}
              </div>
            </div>

            <div className="mt-4">
              <label>Score (0-100):</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full p-2 border"
              />
            </div>

            <div className="mt-4">
              <label>Feedback:</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
                rows={6}
                className="w-full p-2 border"
              />
            </div>

            <button
              onClick={handleGrade}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            >
              Submit Grade
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a submission to grade
          </div>
        )}
      </div>
    </div>
  );
}
```

### Example 4: Statistics Dashboard

```typescript
"use client";

import { useEffect } from "react";
import {
  useAssignmentActions,
  useAssignmentStatistics,
  useClassAssignmentReport,
  formatScore,
} from "@/lib/branch-system/assignment";

export default function StatisticsDashboard({
  assignmentId,
  classId,
}: {
  assignmentId: string;
  classId: string;
}) {
  const { fetchAssignmentStatistics, fetchClassReport } =
    useAssignmentActions();
  const stats = useAssignmentStatistics();
  const classReport = useClassAssignmentReport();

  useEffect(() => {
    fetchAssignmentStatistics(assignmentId);
    fetchClassReport(classId);
  }, [assignmentId, classId]);

  if (!stats || !classReport) return <div>Loading statistics...</div>;

  return (
    <div className="space-y-6">
      {/* Assignment Statistics */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Assignment Statistics</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.submission_rate}%
            </p>
            <p className="text-gray-600">Submission Rate</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats.average_score?.toFixed(1) || "N/A"}
            </p>
            <p className="text-gray-600">Average Score</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {stats.on_time_rate}%
            </p>
            <p className="text-gray-600">On-Time Rate</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>Total Students: {stats.total_students}</p>
            <p>Submitted: {stats.submitted_count}</p>
            <p>Not Submitted: {stats.not_submitted_count}</p>
            <p>Draft: {stats.draft_count}</p>
          </div>
          <div>
            <p>Graded: {stats.graded_count}</p>
            <p>Awaiting Grading: {stats.not_graded_count}</p>
            <p>Late Submissions: {stats.late_count}</p>
            <p>Highest: {stats.highest_score}</p>
            <p>Lowest: {stats.lowest_score}</p>
          </div>
        </div>
      </div>

      {/* Class Report */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Class Overview</h2>
        <p className="text-lg mb-2">{classReport.class_name}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>Total Assignments: {classReport.total_assignments}</p>
            <p>Published: {classReport.published_assignments}</p>
            <p>Avg Submission Rate: {classReport.average_submission_rate}%</p>
          </div>
          <div>
            <p>Total Students: {classReport.students_summary.total}</p>
            <p>
              With Submissions: {classReport.students_summary.with_submissions}
            </p>
            <p>
              Perfect Scores: {classReport.students_summary.with_perfect_scores}
            </p>
          </div>
        </div>

        {classReport.average_score && (
          <p className="mt-4 text-xl">
            Class Average:{" "}
            <span className="font-bold">{classReport.average_score}</span>
          </p>
        )}
      </div>
    </div>
  );
}
```

### Example 5: Direct Service Usage (Outside React)

```typescript
import { assignmentService } from "@/lib/branch-system/assignment";

// Server-side or API route usage
async function getAssignmentData(assignmentId: string) {
  const result = await assignmentService.getAssignmentById(assignmentId, true);

  if (result.success) {
    console.log("Assignment:", result.data);
    return result.data;
  } else {
    console.error("Error:", result.error);
    return null;
  }
}

// Bulk operations
async function publishAllDraftAssignments(teacherId: string) {
  const listResult = await assignmentService.listAssignments({
    teacher_id: teacherId,
    status: "DRAFT",
  });

  if (!listResult.success) return;

  const publishResults = await Promise.all(
    listResult.data!.assignments.map((assignment) =>
      assignmentService.publishAssignment({
        id: assignment.id,
        notify_students: true,
      })
    )
  );

  const successCount = publishResults.filter((r) => r.success).length;
  console.log(`Published ${successCount} assignments`);
}
```

---

## 📚 API Reference

### Service Methods

#### Assignment CRUD

##### `createAssignment(input: CreateAssignmentDTO)`

Creates a new assignment in DRAFT status.

**Returns:** `Promise<AssignmentOperationResult<Assignment>>`

**Example:**

```typescript
const result = await assignmentService.createAssignment({
  class_id: "uuid",
  teacher_id: "uuid",
  branch_id: "uuid",
  title: "Homework 1",
  submission_type: "TEXT",
  max_score: 100,
  due_date: "2024-12-31T23:59:59Z",
});
```

##### `updateAssignment(input: UpdateAssignmentDTO)`

Updates an existing assignment. Cannot modify if closed or after submissions.

**Returns:** `Promise<AssignmentOperationResult<Assignment>>`

##### `publishAssignment(input: PublishAssignmentDTO)`

Publishes a DRAFT assignment to make it visible to students.

**Returns:** `Promise<AssignmentOperationResult<Assignment>>`

##### `closeAssignment(input: CloseAssignmentDTO)`

Closes an assignment, preventing new submissions.

**Returns:** `Promise<AssignmentOperationResult<Assignment>>`

##### `deleteAssignment(assignmentId: string)`

Soft deletes draft assignments, hard deletes if no submissions.

**Returns:** `Promise<AssignmentOperationResult<{ id: string }>>`

##### `getAssignmentById(assignmentId: string, includeSubmissions?: boolean)`

Fetches a single assignment with optional submissions.

**Returns:** `Promise<AssignmentOperationResult<Assignment>>`

##### `listAssignments(params: AssignmentListParams)`

Fetches assignments with filtering, sorting, and pagination.

**Params:**

- `class_id?: string`
- `teacher_id?: string`
- `branch_id?: string`
- `status?: AssignmentStatus`
- `submission_type?: AssignmentSubmissionType`
- `is_visible?: boolean`
- `page?: number` (default: 1)
- `limit?: number` (default: 20)
- `sort_by?: 'due_date' | 'created_at' | 'title'`
- `sort_order?: 'asc' | 'desc'`

**Returns:** `Promise<AssignmentOperationResult<AssignmentListResponse>>`

#### Submission Operations

##### `submitAssignment(input: SubmitAssignmentDTO)`

Submits a final assignment (student action).

**Returns:** `Promise<AssignmentOperationResult<AssignmentSubmission>>`

##### `saveDraft(input: SaveDraftDTO)`

Saves a draft submission (student action).

**Returns:** `Promise<AssignmentOperationResult<AssignmentSubmission>>`

##### `getStudentSubmission(assignmentId: string, studentId: string)`

Gets a student's submission for an assignment.

**Returns:** `Promise<AssignmentOperationResult<AssignmentSubmission | null>>`

##### `listSubmissions(params: SubmissionListParams)`

Lists submissions with filtering and pagination.

**Returns:** `Promise<AssignmentOperationResult<SubmissionListResponse>>`

#### Grading Operations

##### `gradeSubmission(input: GradeSubmissionDTO)`

Grades a student submission (teacher action).

**Params:**

- `submission_id: string`
- `graded_by: string`
- `score: number`
- `feedback?: string`
- `rubric_scores?: Array<{ rubric_item_id, points_awarded, comment }>`

**Returns:** `Promise<AssignmentOperationResult<AssignmentSubmission>>`

##### `updateGrade(input: UpdateGradeDTO)`

Updates an existing grade.

**Returns:** `Promise<AssignmentOperationResult<AssignmentSubmission>>`

##### `requestRegrade(input: RegradeRequestDTO)`

Student requests a regrade with justification.

**Returns:** `Promise<AssignmentOperationResult<{ id: string; message: string }>>`

#### Statistics Operations

##### `getAssignmentStatistics(assignmentId: string)`

Calculates comprehensive statistics for an assignment.

**Returns:** `Promise<AssignmentOperationResult<AssignmentStatistics>>`

**Statistics Returned:**

- `total_students`
- `submitted_count`
- `not_submitted_count`
- `draft_count`
- `late_count`
- `graded_count`
- `not_graded_count`
- `average_score`
- `highest_score`
- `lowest_score`
- `submission_rate`
- `on_time_rate`

##### `getStudentSummary(studentId: string, classId?: string)`

Gets a student's assignment summary across all or specific class.

**Returns:** `Promise<AssignmentOperationResult<StudentAssignmentSummary>>`

##### `getClassReport(classId: string)`

Generates a comprehensive class report.

**Returns:** `Promise<AssignmentOperationResult<ClassAssignmentReport>>`

#### File Operations

##### `uploadFile(input: UploadFileDTO)`

Uploads a file to the system.

**Returns:** `Promise<AssignmentOperationResult<FileUploadResult>>`

##### `deleteFile(fileId: string, userId: string)`

Deletes a file (with permission check).

**Returns:** `Promise<AssignmentOperationResult<{ id: string }>>`

##### `attachFileToAssignment(assignmentId: string, fileId: string, type: 'instruction' | 'attachment')`

Attaches an uploaded file to an assignment.

**Returns:** `Promise<AssignmentOperationResult<Assignment>>`

### Store Hooks

#### Data Selectors

```typescript
useAssignments(): Assignment[]
useSubmissions(): AssignmentSubmission[]
useCurrentAssignment(): Assignment | null
useCurrentSubmission(): AssignmentSubmission | null
useSubmissionsForGrading(): SubmissionForGrading[]
useStudentStatusList(): StudentSubmissionStatusItem[]
useAssignmentStatistics(): AssignmentStatistics | null
useStudentAssignmentSummary(): StudentAssignmentSummary | null
useClassAssignmentReport(): ClassAssignmentReport | null
```

#### UI State Selectors

```typescript
useAssignmentToDelete(): Assignment | null
useIsDeleteDialogOpen(): boolean
useSubmissionToGrade(): SubmissionForGrading | null
useIsGradingDialogOpen(): boolean
```

#### Filter/Pagination Selectors

```typescript
useAssignmentFilters(): AssignmentFilters
useAssignmentPagination(): { page, limit, total, has_more }
useAssignmentSort(): { sort_by, sort_order }
```

#### Loading/Error Selectors

```typescript
useAssignmentLoading(): {
  list: boolean;
  submissions: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  publish: boolean;
  grade: boolean;
  statistics: boolean;
  upload: boolean;
}
useAssignmentError(): string | null
useAssignmentSuccessMessage(): string | null
```

#### Action Hooks

All actions return `Promise<boolean>` for success/failure:

```typescript
useCreateAssignment(): (input: CreateAssignmentDTO) => Promise<boolean>
useUpdateAssignment(): (input: UpdateAssignmentDTO) => Promise<boolean>
usePublishAssignment(): (input: PublishAssignmentDTO) => Promise<boolean>
useCloseAssignment(): (input: CloseAssignmentDTO) => Promise<boolean>
useDeleteAssignment(): (assignmentId: string) => Promise<boolean>
useFetchAssignments(): (params?: AssignmentListParams, forceRefresh?: boolean) => Promise<void>
useFetchAssignmentById(): (assignmentId: string, forceRefresh?: boolean) => Promise<void>
useSubmitAssignment(): (input: SubmitAssignmentDTO) => Promise<boolean>
useSaveDraft(): (input: SaveDraftDTO) => Promise<boolean>
useGradeSubmission(): (input: GradeSubmissionDTO) => Promise<boolean>
// ... 30+ more
```

---

## ⚡ Best Practices

### 1. Error Handling

Always check operation results:

```typescript
const result = await assignmentService.createAssignment(input);

if (result.success) {
  console.log("Created:", result.data);
} else {
  if (result.validation_errors) {
    // Handle validation errors
    result.validation_errors.forEach((err) => {
      console.error(`${err.field}: ${err.message}`);
    });
  } else {
    // Handle general error
    console.error(result.error);
  }
}
```

### 2. Type Safety

Use TypeScript types for compile-time safety:

```typescript
import type { CreateAssignmentDTO } from "@/lib/branch-system/assignment";

const input: CreateAssignmentDTO = {
  // TypeScript will enforce all required fields
  class_id: "...",
  teacher_id: "...",
  // ...
};
```

### 3. Validation

Validate inputs before service calls:

```typescript
import { createAssignmentSchema } from "@/lib/branch-system/assignment";

const validation = createAssignmentSchema.safeParse(input);

if (!validation.success) {
  console.error(validation.error.errors);
  return;
}

// Proceed with validated data
const result = await assignmentService.createAssignment(validation.data);
```

### 4. Cache Management

Use force refresh when needed:

```typescript
// Normal fetch (uses cache if valid)
await fetchAssignments({ class_id: "..." });

// Force refresh (bypasses cache)
await fetchAssignments({ class_id: "..." }, true);

// Manual cache invalidation
const { invalidateCache } = useAssignmentActions();
invalidateCache();
```

### 5. Loading States

Handle loading states properly:

```typescript
const loading = useAssignmentLoading();

if (loading.list) {
  return <Skeleton />;
}

if (loading.create) {
  return <Button disabled>Creating...</Button>;
}
```

### 6. Optimistic Updates

For better UX, show optimistic updates:

```typescript
const handleDelete = async (id: string) => {
  // Optimistic UI update
  setAssignments((prev) => prev.filter((a) => a.id !== id));

  const success = await deleteAssignment(id);

  if (!success) {
    // Rollback on failure
    fetchAssignments();
  }
};
```

### 7. Date Handling

Always use ISO 8601 format:

```typescript
import { getCurrentDateTime } from "@/lib/branch-system/assignment";

const dueDate = getCurrentDateTime(); // "2024-01-06T10:30:00.000Z"
```

### 8. Permission Checks

Check permissions before operations:

```typescript
import { canSubmit, canEditAssignment } from "@/lib/branch-system/assignment";

const submitCheck = canSubmit(assignment, existingSubmission);
if (!submitCheck.canSubmit) {
  alert(submitCheck.reason);
  return;
}

const editCheck = canEditAssignment(assignment, hasSubmissions);
if (!editCheck.canEdit) {
  console.warn("Cannot edit:", editCheck.restrictions);
}
```

### 9. Batch Operations

Use Promise.all for parallel operations:

```typescript
const assignments = await Promise.all(
  ids.map((id) => assignmentService.getAssignmentById(id))
);

const successful = assignments.filter((r) => r.success);
```

### 10. Memory Management

Clean up on unmount:

```typescript
useEffect(() => {
  fetchAssignments({ class_id: "..." });

  return () => {
    // Reset store on unmount if needed
    const { reset } = useAssignmentActions();
    reset();
  };
}, []);
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Problem:** Import paths not resolving

**Solution:** Check your `tsconfig.json` has correct path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./"]
    }
  }
}
```

#### 2. Validation errors on create

**Problem:** Schema validation failing

**Solution:** Check all required fields and types:

```typescript
// ❌ Wrong
const input = {
  title: "Assignment", // Missing required fields
};

// ✅ Correct
const input: CreateAssignmentDTO = {
  class_id: "uuid",
  teacher_id: "uuid",
  branch_id: "uuid",
  title: "Assignment",
  submission_type: "TEXT",
  max_score: 100,
  due_date: "2024-12-31T23:59:59Z",
};
```

#### 3. Cache not updating

**Problem:** UI not reflecting latest data

**Solution:** Force refresh or invalidate cache:

```typescript
// Force refresh
await fetchAssignments(params, true);

// Or invalidate cache
const { invalidateCache } = useAssignmentActions();
invalidateCache();
```

#### 4. Type errors with enums

**Problem:** Enum values not matching

**Solution:** Import and use enum constants:

```typescript
import { AssignmentStatus } from "@/lib/branch-system/assignment";

// ❌ Wrong
status: "PUBLISHED";

// ✅ Correct
status: AssignmentStatus.PUBLISHED;
```

#### 5. Date format issues

**Problem:** Invalid date format errors

**Solution:** Use utility functions for dates:

```typescript
import { getCurrentDateTime } from "@/lib/branch-system/assignment";

due_date: getCurrentDateTime(); // Always correct format
```

#### 6. Permission denied errors

**Problem:** Database RLS blocking operations

**Solution:** Ensure user is authenticated and has correct role:

```typescript
// Check Supabase auth
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
}
```

#### 7. Store not persisting

**Problem:** State resets on page reload

**Solution:** Check Zustand persist configuration:

```typescript
// Store is configured with persist middleware
// But ensure localStorage is available (not SSR)
if (typeof window === "undefined") {
  // Server-side: use service directly
  const result = await assignmentService.getAssignmentById(id);
} else {
  // Client-side: use store
  useFetchAssignmentById()(id);
}
```

### Debug Tips

1. **Enable Zustand DevTools:**

   ```typescript
   // Already enabled in the store
   // Open Redux DevTools in browser to inspect state
   ```

2. **Log Service Results:**

   ```typescript
   const result = await assignmentService.createAssignment(input);
   console.log("Service result:", result);
   ```

3. **Check Network Requests:**

   - Open browser DevTools → Network tab
   - Filter by "supabase" to see API calls
   - Check request/response data

4. **Validate Input Data:**

   ```typescript
   import { createAssignmentSchema } from "@/lib/branch-system/assignment";

   const validation = createAssignmentSchema.safeParse(input);
   console.log("Validation:", validation);
   ```

5. **Check Database Schema:**
   ```sql
   -- Verify table exists and has correct columns
   SELECT * FROM assignments LIMIT 1;
   SELECT * FROM assignment_submissions LIMIT 1;
   ```

---

## 🎓 Learning Path

### For New Developers

1. **Start with Types** (`assignment.types.ts`)

   - Understand enums and their values
   - Review interface structures
   - Learn DTO patterns

2. **Study Validation** (`assignment.validation.ts`)

   - See how Zod schemas work
   - Understand validation rules
   - Learn cross-field validation

3. **Explore Utils** (`assignment.utils.ts`)

   - Pure functions are easy to understand
   - See real-world calculations
   - Learn functional patterns

4. **Use the Store** (`assignment.store.ts`)

   - Start with selector hooks
   - Use action hooks
   - Understand state management

5. **Call the Service** (`assignment.service.ts`)
   - See database operations
   - Understand error handling
   - Learn async patterns

### For Component Development

1. Import what you need from central export
2. Use hooks for React components
3. Use service for server-side or API routes
4. Follow the examples in this README
5. Check return types and handle errors

---

## 📝 Contributing

### Code Style

- Use TypeScript strict mode
- Document all public functions with JSDoc
- Follow existing naming conventions
- Keep functions pure when possible
- Handle all edge cases

### Adding New Features

1. Add types to `assignment.types.ts`
2. Add validation to `assignment.validation.ts`
3. Add utilities to `assignment.utils.ts` (if needed)
4. Add service method to `assignment.service.ts`
5. Add store action to `assignment.store.ts`
6. Export from `assignment.ts`
7. Update this README

### Testing Checklist

- [ ] Types compile without errors
- [ ] Validation schemas cover all cases
- [ ] Service methods handle errors
- [ ] Store actions update state correctly
- [ ] Cache invalidation works
- [ ] Loading states toggle properly
- [ ] Database queries are optimized
- [ ] RLS policies are respected

---

## 📄 License

This code is part of the Eduro LMS platform.

---

## 🤝 Support

For questions or issues:

1. Check this README first
2. Review the code comments
3. Check TypeScript types for hints
4. Test with minimal examples
5. Contact the development team

---

## 📌 Quick Reference Card

### Most Used Imports

```typescript
import {
  // Hooks
  useAssignmentActions,
  useAssignments,
  useCurrentAssignment,
  useAssignmentLoading,

  // Types
  Assignment,
  AssignmentSubmission,
  AssignmentStatus,
  AssignmentSubmissionType,
  GradingStatus,

  // Utils
  formatDateTime,
  formatScore,
  canSubmit,
  calculateLatePenalty,

  // Service (for server-side)
  assignmentService,
} from "@/lib/branch-system/assignment";
```

### Most Used Actions

```typescript
const {
  // Teacher actions
  createAssignment,
  publishAssignment,
  gradeSubmission,
  fetchSubmissionsForGrading,

  // Student actions
  fetchAssignments,
  submitAssignment,
  saveDraft,
  fetchStudentSubmission,

  // Common actions
  fetchAssignmentById,
  fetchAssignmentStatistics,
} = useAssignmentActions();
```

### Common Patterns

```typescript
// Fetch and display
useEffect(() => {
  fetchAssignments({ class_id: "..." });
}, []);
const assignments = useAssignments();

// Create with validation
const success = await createAssignment(input);
if (success) {
  /* ... */
}

// Check loading
const loading = useAssignmentLoading();
if (loading.list) return <Spinner />;

// Handle errors
const error = useAssignmentError();
if (error) return <ErrorMessage message={error} />;
```

---

**Last Updated:** January 6, 2026  
**Version:** 1.0.0  
**Total Lines of Code:** ~3,000  
**Files:** 6  
**Status:** ✅ Production Ready
