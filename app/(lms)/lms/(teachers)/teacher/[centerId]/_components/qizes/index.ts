/**
 * Quiz Components Index
 * 
 * Barrel export for all quiz-related components.
 * Provides convenient imports for the quiz system.
 */

// Main dashboard
export { TeacherQuizzesDashboard } from './teacher-quizzes-dashboard';
export type { TeacherQuizzesDashboardProps } from './teacher-quizzes-dashboard';

// Header and filters
export { QuizzesHeader } from './quizzes-header';
export type { QuizzesHeaderProps } from './quizzes-header';

export { QuizzesFilters } from './quizzes-filters';
export type { QuizzesFiltersProps } from './quizzes-filters';

// Views
export { QuizzesListView } from './quizzes-list-view';
export type { QuizzesListViewProps } from './quizzes-list-view';

export { QuizCard } from './quiz-card';
export type { QuizCardProps } from './quiz-card';

// Forms
export { QuizForm } from './quiz-form';
export type { QuizFormProps } from './quiz-form';

// Dialogs
export { CreateQuizDialog } from './create-quiz-dialog';
export type { CreateQuizDialogProps } from './create-quiz-dialog';

export { EditQuizDialog } from './edit-quiz-dialog';
export type { EditQuizDialogProps } from './edit-quiz-dialog';

export { DeleteQuizDialog } from './delete-quiz-dialog';
export type { DeleteQuizDialogProps } from './delete-quiz-dialog';
