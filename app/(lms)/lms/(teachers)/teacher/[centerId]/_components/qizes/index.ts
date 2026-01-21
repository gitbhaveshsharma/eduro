/**
 * Quiz Components Index
 * 
 * Barrel export for all quiz-related components.
 * Provides convenient imports for the quiz system.
 */

// ============================================================
// MAIN DASHBOARD
// ============================================================
export { TeacherQuizzesDashboard } from './teacher-quizzes-dashboard';
export type { TeacherQuizzesDashboardProps } from './teacher-quizzes-dashboard';

// ============================================================
// HEADER AND FILTERS
// ============================================================
export { QuizzesHeader } from './quizzes-header';
export type { QuizzesHeaderProps } from './quizzes-header';

export { QuizzesFilters } from './quizzes-filters';
export type { QuizzesFiltersProps } from './quizzes-filters';

// ============================================================
// QUIZ VIEWS
// ============================================================
export { QuizzesListView } from './quizzes-list-view';
export type { QuizzesListViewProps } from './quizzes-list-view';

export { QuizCard } from './quiz-card';
export type { QuizCardProps } from './quiz-card';

export { QuizDetailView } from './quiz-detail-view';
export type { QuizDetailViewProps } from './quiz-detail-view';

// ============================================================
// QUIZ FORMS
// ============================================================
export { QuizForm } from './quiz-form';
export type { QuizFormProps } from './quiz-form';

// ============================================================
// QUIZ DIALOGS
// ============================================================
export { CreateQuizDialog } from './create-quiz-dialog';
export type { CreateQuizDialogProps } from './create-quiz-dialog';

export { EditQuizDialog } from './edit-quiz-dialog';
export type { EditQuizDialogProps } from './edit-quiz-dialog';

export { DeleteQuizDialog } from './delete-quiz-dialog';
export type { DeleteQuizDialogProps } from './delete-quiz-dialog';

// ============================================================
// QUESTION COMPONENTS
// ============================================================
export { QuestionCard } from './question-card';
export type { QuestionCardProps } from './question-card';

export { QuestionsList } from './questions-list';
export type { QuestionsListProps } from './questions-list';

// ============================================================
// QUESTION FORMS
// ============================================================
export { QuestionForm } from './question-form';
export type { QuestionFormProps } from './question-form';

// ============================================================
// QUESTION DIALOGS
// ============================================================
export { CreateQuestionDialog } from './create-question-dialog';
export type { CreateQuestionDialogProps } from './create-question-dialog';

export { EditQuestionDialog } from './edit-question-dialog';
export type { EditQuestionDialogProps } from './edit-question-dialog';

export { DeleteQuestionDialog } from './delete-question-dialog';
export type { DeleteQuestionDialogProps } from './delete-question-dialog';
