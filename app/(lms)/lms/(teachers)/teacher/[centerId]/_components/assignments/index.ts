/**
 * Assignment Components Index
 * 
 * Barrel export for all assignment-related components.
 * Provides convenient imports for the assignment system.
 */

// Main dashboard
export { TeacherAssignmentsDashboard } from './teacher-assignments-dashboard';
export type { TeacherAssignmentsDashboardProps } from './teacher-assignments-dashboard';

// Header and filters
export { AssignmentsHeader } from './assignments-header';
export type { AssignmentsHeaderProps } from './assignments-header';

export { AssignmentsFilters } from './assignments-filters';
export type { AssignmentsFiltersProps } from './assignments-filters';

// Views
export { AssignmentsListView } from './assignments-list-view';
export type { AssignmentsListViewProps } from './assignments-list-view';

export { AssignmentCard } from './assignment-card';
export type { AssignmentCardProps } from './assignment-card';

// Forms
export { AssignmentForm } from './assignment-form';
export type { AssignmentFormProps } from './assignment-form';

// Dialogs
export { CreateAssignmentDialog } from './create-assignment-dialog';
export type { CreateAssignmentDialogProps } from './create-assignment-dialog';

export { EditAssignmentDialog } from './edit-assignment-dialog';
export type { EditAssignmentDialogProps } from './edit-assignment-dialog';

export { DeleteAssignmentDialog } from './delete-assignment-dialog';
export type { DeleteAssignmentDialogProps } from './delete-assignment-dialog';

// Detail views
export { AssignmentDetailDialog } from './assignment-detail-sheet';
export type { AssignmentDetailDialogProps } from './assignment-detail-sheet';

// Submissions and grading
export { SubmissionsList } from './submissions-list';
export type { SubmissionsListProps } from './submissions-list';

export { GradingDialog } from './grading-dialog';
export type { GradingDialogProps } from './grading-dialog';
