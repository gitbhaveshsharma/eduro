/**
 * Quiz System Utility Functions
 * 
 * Pure utility functions for quiz calculations, formatting, and transformations.
 * All functions are pure (no side effects) and follow functional programming principles.
 * 
 * @module branch-system/utils/quiz
 */

import type {
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizResponse,
    QuizStatistics,
    QuestionStatistics,
    StudentQuizSummary,
    ClassQuizReport,
    QuizFilters,
    AttemptStatus,
    QuestionType,
    CleanupFrequency,
    AttemptForTeacher,
    StudentAttemptStatusItem,
    QuizResponseForReview,
    QuizAttemptResult,
    LeaderboardEntry,
    QuizOptions,
} from '../types/quiz.types';
import { StudentQuizStatus } from '../types/quiz.types';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Quiz attempt status display configurations
 */
export const ATTEMPT_STATUS_CONFIG = {
    IN_PROGRESS: {
        label: 'In Progress',
        variant: 'warning' as const,
        priority: 1,
        icon: 'Clock',
        description: 'Quiz is being taken',
    },
    COMPLETED: {
        label: 'Completed',
        variant: 'success' as const,
        priority: 2,
        icon: 'CheckCircle2',
        description: 'Quiz submitted successfully',
    },
    TIMEOUT: {
        label: 'Timed Out',
        variant: 'destructive' as const,
        priority: 3,
        icon: 'Timer',
        description: 'Time limit exceeded',
    },
    ABANDONED: {
        label: 'Abandoned',
        variant: 'secondary' as const,
        priority: 4,
        icon: 'XCircle',
        description: 'Quiz was abandoned',
    },
} as const;

/**
 * Question type display configurations
 */
export const QUESTION_TYPE_CONFIG = {
    MCQ_SINGLE: {
        label: 'Single Choice',
        variant: 'outline' as const,
        icon: 'Circle',
        description: 'Select one correct answer',
    },
    MCQ_MULTI: {
        label: 'Multiple Choice',
        variant: 'outline' as const,
        icon: 'CheckSquare',
        description: 'Select all correct answers',
    },
} as const;

/**
 * Student quiz status display configurations
 */
export const STUDENT_QUIZ_STATUS_CONFIG = {
    NOT_STARTED: {
        label: 'Not Started',
        variant: 'secondary' as const,
        priority: 1,
        icon: 'Circle',
    },
    IN_PROGRESS: {
        label: 'In Progress',
        variant: 'warning' as const,
        priority: 2,
        icon: 'Clock',
    },
    COMPLETED: {
        label: 'Completed',
        variant: 'outline' as const,
        priority: 3,
        icon: 'CheckCircle',
    },
    PASSED: {
        label: 'Passed',
        variant: 'success' as const,
        priority: 4,
        icon: 'Trophy',
    },
    FAILED: {
        label: 'Failed',
        variant: 'destructive' as const,
        priority: 5,
        icon: 'XCircle',
    },
    TIMED_OUT: {
        label: 'Timed Out',
        variant: 'destructive' as const,
        priority: 6,
        icon: 'Timer',
    },
} as const;

/**
 * Cleanup frequency display configurations
 */
export const CLEANUP_FREQUENCY_CONFIG = {
    '30_DAYS': {
        label: '30 Days',
        days: 30,
        description: 'Delete after 30 days',
    },
    '60_DAYS': {
        label: '60 Days',
        days: 60,
        description: 'Delete after 60 days',
    },
    '90_DAYS': {
        label: '90 Days',
        days: 90,
        description: 'Delete after 90 days',
    },
    'SEMESTER_END': {
        label: 'Semester End',
        days: 180,
        description: 'Delete at semester end',
    },
    'NEVER': {
        label: 'Never',
        days: null,
        description: 'Keep permanently',
    },
} as const;

/**
 * Score thresholds for quiz performance
 */
export const SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 80,
    SATISFACTORY: 70,
    PASSING: 60,
    FAILING: 60,
} as const;

/**
 * Time constants
 */
export const TIME_CONSTANTS = {
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    WARNING_THRESHOLD_MINUTES: 5,
    CRITICAL_THRESHOLD_MINUTES: 1,
} as const;

// ============================================================
// STATUS UTILITIES
// ============================================================

/**
 * Gets attempt status configuration
 */
export function getAttemptStatusConfig(status: AttemptStatus) {
    return ATTEMPT_STATUS_CONFIG[status];
}

/**
 * Gets question type configuration
 */
export function getQuestionTypeConfig(type: QuestionType) {
    return QUESTION_TYPE_CONFIG[type];
}

/**
 * Gets student quiz status configuration
 */
export function getStudentQuizStatusConfig(status: StudentQuizStatus) {
    return STUDENT_QUIZ_STATUS_CONFIG[status];
}

/**
 * Formats attempt status for display
 */
export function formatAttemptStatus(status: AttemptStatus, includeIcon = false): string {
    const config = getAttemptStatusConfig(status);
    return includeIcon ? `${config.icon} ${config.label}` : config.label;
}

/**
 * Formats question type for display
 */
export function formatQuestionType(type: QuestionType, includeIcon = false): string {
    const config = getQuestionTypeConfig(type);
    return includeIcon ? `${config.icon} ${config.label}` : config.label;
}

/**
 * Formats student quiz status for display
 */
export function formatStudentQuizStatus(status: StudentQuizStatus, includeIcon = false): string {
    const config = getStudentQuizStatusConfig(status);
    return includeIcon ? `${config.icon} ${config.label}` : config.label;
}

// ============================================================
// DATE & TIME UTILITIES
// ============================================================

/**
 * Gets current date-time in ISO format
 */
export function getCurrentDateTime(): string {
    return new Date().toISOString();
}

/**
 * Gets current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Checks if a date-time is in the past
 */
export function isPastDateTime(dateTime: string): boolean {
    return new Date(dateTime) < new Date();
}

/**
 * Checks if a date-time is in the future
 */
export function isFutureDateTime(dateTime: string): boolean {
    return new Date(dateTime) > new Date();
}

/**
 * Checks if current time is within availability window
 */
export function isWithinAvailability(availableFrom: string, availableTo: string): boolean {
    const now = new Date();
    return new Date(availableFrom) <= now && now <= new Date(availableTo);
}

/**
 * Calculates seconds between two date-times
 */
export function calculateSecondsDifference(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.floor((endTime - startTime) / 1000);
}

/**
 * Formats a date-time for display
 */
export function formatDateTime(
    dateTime: string,
    format: 'short' | 'long' | 'full' | 'relative' = 'short'
): string {
    try {
        const date = new Date(dateTime);

        switch (format) {
            case 'short':
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
            case 'long':
                return date.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
            case 'full':
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                });
            case 'relative':
                return formatRelativeTime(dateTime);
            default:
                return dateTime;
        }
    } catch {
        return dateTime;
    }
}

/**
 * Formats relative time
 */
export function formatRelativeTime(dateTime: string): string {
    const now = new Date();
    const target = new Date(dateTime);
    const diffMs = target.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const isPast = diffMs < 0;
    const absMinutes = Math.abs(diffMinutes);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);

    if (absMinutes < 1) {
        return 'Just now';
    } else if (absMinutes < 60) {
        return isPast ? `${absMinutes}m ago` : `in ${absMinutes}m`;
    } else if (absHours < 24) {
        return isPast ? `${absHours}h ago` : `in ${absHours}h`;
    } else if (absDays < 7) {
        return isPast ? `${absDays}d ago` : `in ${absDays}d`;
    } else {
        return formatDateTime(dateTime, 'short');
    }
}

/**
 * Formats time in seconds to human readable string
 */
export function formatTimeSeconds(seconds: number): string {
    if (seconds < 0) return '0s';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Formats time in minutes to human readable string
 */
export function formatTimeMinutes(minutes: number | null): string {
    if (minutes === null) return 'No limit';
    if (minutes <= 0) return '0 min';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins} min`;
}

/**
 * Gets quiz availability status
 */
export function getQuizAvailabilityStatus(availableFrom: string, availableTo: string): {
    status: 'upcoming' | 'active' | 'ended';
    label: string;
    timeRemaining: string | null;
} {
    const now = new Date();
    const from = new Date(availableFrom);
    const to = new Date(availableTo);

    if (now < from) {
        return {
            status: 'upcoming',
            label: 'Upcoming',
            timeRemaining: `Starts ${formatRelativeTime(availableFrom)}`,
        };
    } else if (now > to) {
        return {
            status: 'ended',
            label: 'Ended',
            timeRemaining: null,
        };
    } else {
        return {
            status: 'active',
            label: 'Active',
            timeRemaining: `Ends ${formatRelativeTime(availableTo)}`,
        };
    }
}

/**
 * Calculates cleanup date based on submission date and cleanup frequency
 */
export function calculateCleanupDate(
    submissionDate: string,
    cleanupFrequency: CleanupFrequency
): string | null {
    const config = CLEANUP_FREQUENCY_CONFIG[cleanupFrequency];
    if (!config.days) return null;

    const date = new Date(submissionDate);
    date.setDate(date.getDate() + config.days);
    return date.toISOString();
}

// ============================================================
// SCORE & GRADING UTILITIES
// ============================================================

/**
 * Calculates percentage score
 */
export function calculatePercentage(score: number, maxScore: number): number {
    if (maxScore <= 0) return 0;
    return Number(((score / maxScore) * 100).toFixed(2));
}

/**
 * Gets score performance level
 */
export function getScorePerformanceLevel(percentage: number): string {
    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent';
    if (percentage >= SCORE_THRESHOLDS.GOOD) return 'Good';
    if (percentage >= SCORE_THRESHOLDS.SATISFACTORY) return 'Satisfactory';
    if (percentage >= SCORE_THRESHOLDS.PASSING) return 'Passing';
    return 'Needs Improvement';
}

/**
 * Gets score color based on percentage
 */
export function getScoreColor(percentage: number): string {
    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) return 'success';
    if (percentage >= SCORE_THRESHOLDS.GOOD) return 'success';
    if (percentage >= SCORE_THRESHOLDS.SATISFACTORY) return 'warning';
    if (percentage >= SCORE_THRESHOLDS.PASSING) return 'warning';
    return 'destructive';
}

/**
 * Checks if score is passing
 */
export function isPassing(score: number, passingScore: number | null): boolean | null {
    if (passingScore === null) return null;
    return score >= passingScore;
}

/**
 * Formats score for display
 */
export function formatScore(
    score: number | null,
    maxScore: number,
    showPercentage = true
): string {
    if (score === null) return 'Not graded';

    const formatted = `${score}/${maxScore}`;
    if (showPercentage) {
        const percentage = calculatePercentage(score, maxScore);
        return `${formatted} (${percentage}%)`;
    }
    return formatted;
}

/**
 * Calculates points from a response
 */
export function calculateResponsePoints(
    selectedAnswers: string[],
    correctAnswers: string[],
    questionType: QuestionType,
    points: number,
    negativePoints: number
): { earned: number; deducted: number; isCorrect: boolean } {
    if (!selectedAnswers || selectedAnswers.length === 0) {
        return { earned: 0, deducted: 0, isCorrect: false };
    }

    if (questionType === 'MCQ_SINGLE') {
        const isCorrect = selectedAnswers.length === 1 &&
            correctAnswers.includes(selectedAnswers[0]);
        return {
            earned: isCorrect ? points : 0,
            deducted: isCorrect ? 0 : negativePoints,
            isCorrect,
        };
    }

    // MCQ_MULTI: all selected must be correct and all correct must be selected
    const allSelectedCorrect = selectedAnswers.every(ans => correctAnswers.includes(ans));
    const allCorrectSelected = correctAnswers.every(ans => selectedAnswers.includes(ans));
    const isCorrect = allSelectedCorrect && allCorrectSelected;

    return {
        earned: isCorrect ? points : 0,
        deducted: isCorrect ? 0 : negativePoints,
        isCorrect,
    };
}

// ============================================================
// QUIZ STATUS UTILITIES
// ============================================================

/**
 * Determines student quiz status from attempt data
 */
export function determineStudentQuizStatus(
    attempt: QuizAttempt | null,
    quiz: Quiz
): StudentQuizStatus {
    if (!attempt) {
        return StudentQuizStatus.NOT_STARTED;
    }

    if (attempt.attempt_status === 'IN_PROGRESS') {
        return StudentQuizStatus.IN_PROGRESS;
    }

    if (attempt.attempt_status === 'TIMEOUT') {
        return StudentQuizStatus.TIMED_OUT;
    }

    if (attempt.attempt_status === 'ABANDONED') {
        return StudentQuizStatus.NOT_STARTED;
    }

    // Completed
    if (attempt.passed === true) {
        return StudentQuizStatus.PASSED;
    } else if (attempt.passed === false) {
        return StudentQuizStatus.FAILED;
    }

    return StudentQuizStatus.COMPLETED;
}

/**
 * Checks if student can attempt quiz
 */
export function canAttemptQuiz(
    quiz: Quiz,
    existingAttempts: QuizAttempt[]
): { canAttempt: boolean; reason?: string } {
    // Check if quiz is active
    if (!quiz.is_active) {
        return { canAttempt: false, reason: 'Quiz is not active' };
    }

    // Check availability window
    const availability = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);
    if (availability.status === 'upcoming') {
        return { canAttempt: false, reason: 'Quiz has not started yet' };
    }
    if (availability.status === 'ended') {
        return { canAttempt: false, reason: 'Quiz has ended' };
    }

    // Check if there's an in-progress attempt
    const inProgressAttempt = existingAttempts.find(a => a.attempt_status === 'IN_PROGRESS');
    if (inProgressAttempt) {
        return { canAttempt: true, reason: 'Resume existing attempt' };
    }

    // Check max attempts
    const completedAttempts = existingAttempts.filter(
        a => a.attempt_status === 'COMPLETED' || a.attempt_status === 'TIMEOUT'
    ).length;

    if (completedAttempts >= quiz.max_attempts) {
        return { canAttempt: false, reason: 'Maximum attempts reached' };
    }

    return { canAttempt: true };
}

/**
 * Gets remaining attempts count
 */
export function getRemainingAttempts(
    maxAttempts: number,
    existingAttempts: QuizAttempt[]
): number {
    const usedAttempts = existingAttempts.filter(
        a => a.attempt_status === 'COMPLETED' || a.attempt_status === 'TIMEOUT'
    ).length;
    return Math.max(0, maxAttempts - usedAttempts);
}

/**
 * Checks if quiz can be edited by teacher
 */
export function canEditQuiz(
    quiz: Quiz,
    hasAttempts: boolean
): { canEdit: boolean; restrictions: string[] } {
    const restrictions: string[] = [];

    if (hasAttempts) {
        restrictions.push('Cannot change max score after students attempt');
        restrictions.push('Cannot remove questions after students attempt');
        restrictions.push('Cannot change question points after students attempt');
    }

    const availability = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);
    if (availability.status === 'active') {
        restrictions.push('Limited editing while quiz is active');
    }

    return { canEdit: true, restrictions };
}

// ============================================================
// TIME LIMIT UTILITIES
// ============================================================

/**
 * Calculates remaining time for an attempt
 */
export function calculateRemainingTime(
    startedAt: string,
    timeLimitMinutes: number | null,
    submissionWindowMinutes: number
): { remainingSeconds: number; isExpired: boolean; isWarning: boolean; isCritical: boolean } {
    if (timeLimitMinutes === null) {
        return { remainingSeconds: Infinity, isExpired: false, isWarning: false, isCritical: false };
    }

    const totalAllowedSeconds = (timeLimitMinutes + submissionWindowMinutes) * 60;
    const elapsedSeconds = calculateSecondsDifference(startedAt, getCurrentDateTime());
    const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    const remainingMinutes = remainingSeconds / 60;
    const isExpired = remainingSeconds <= 0;
    const isWarning = remainingMinutes <= TIME_CONSTANTS.WARNING_THRESHOLD_MINUTES && !isExpired;
    const isCritical = remainingMinutes <= TIME_CONSTANTS.CRITICAL_THRESHOLD_MINUTES && !isExpired;

    return { remainingSeconds, isExpired, isWarning, isCritical };
}

/**
 * Formats remaining time for display
 */
export function formatRemainingTime(remainingSeconds: number): string {
    if (remainingSeconds === Infinity) return 'No limit';
    if (remainingSeconds <= 0) return 'Time expired';

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);

    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================
// QUESTION UTILITIES
// ============================================================

/**
 * Shuffles an array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Shuffles questions if enabled
 */
export function prepareQuestionsForAttempt(
    questions: QuizQuestion[],
    shuffleQuestions: boolean,
    shuffleOptions: boolean
): QuizQuestion[] {
    let prepared = shuffleQuestions
        ? shuffleArray(questions)
        : [...questions].sort((a, b) => a.question_order - b.question_order);

    if (shuffleOptions) {
        prepared = prepared.map(q => ({
            ...q,
            options: shuffleOptions ? shuffleOptionsObject(q.options) : q.options,
        }));
    }

    // SECURITY: Strip sensitive data before sending to client
    return sanitizeQuestionsForStudent(prepared);
}

/**
 * Sanitizes questions for student view by removing sensitive data
 * SECURITY: This prevents students from seeing correct answers in network tab
 */
export function sanitizeQuestionsForStudent(questions: QuizQuestion[]): QuizQuestion[] {
    return questions.map(q => ({
        ...q,
        // Remove correct answers - students should NEVER see this during attempt
        correct_answers: [],
        // Remove explanation - only show after submission
        explanation: null,
        // Remove negative points info (optional, depends on your policy)
        // negative_points: undefined,
    }));
}

/**
 * Shuffles options object
 */
export function shuffleOptionsObject(options: QuizOptions): QuizOptions {
    const entries = Object.entries(options);
    const shuffled = shuffleArray(entries);
    const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    return shuffled.reduce<QuizOptions>((acc, [, value], index) => {
        acc[keys[index] || String.fromCharCode(65 + index)] = value;
        return acc;
    }, {});
}

/**
 * Converts options object to array
 */
export function optionsToArray(options: QuizOptions): { key: string; text: string }[] {
    return Object.entries(options)
        .map(([key, text]) => ({ key, text }))
        .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Convert options array to object
 * Converts array format [{key, text}] to object format {key: text}
 * Used for form submissions
 * 
 * @param options - Array of option items
 * @returns Options object
 */
export function optionsToObject(options: Array<{ key: string; text: string }>): QuizOptions {
    return options.reduce((acc, opt) => {
        acc[opt.key] = opt.text;
        return acc;
    }, {} as QuizOptions);
}

/**
 * Generate option key from index
 * Generates alphabetic keys: A, B, C, D, ..., Z, AA, AB, etc.
 * 
 * @param index - Zero-based index
 * @returns Option key (A, B, C, etc.)
 */
export function generateOptionKey(index: number): string {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
}

/**
 * Validates question structure
 */
export function validateQuestionStructure(
    questionType: QuestionType,
    options: QuizOptions,
    correctAnswers: string[]
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const optionKeys = Object.keys(options);

    if (optionKeys.length < 2) {
        errors.push('At least 2 options required');
    }

    if (correctAnswers.length === 0) {
        errors.push('At least one correct answer required');
    }

    const invalidAnswers = correctAnswers.filter(a => !optionKeys.includes(a));
    if (invalidAnswers.length > 0) {
        errors.push(`Invalid correct answers: ${invalidAnswers.join(', ')}`);
    }

    if (questionType === 'MCQ_SINGLE' && correctAnswers.length !== 1) {
        errors.push('Single choice question must have exactly one correct answer');
    }

    return { isValid: errors.length === 0, errors };
}

// ============================================================
// STATISTICS UTILITIES
// ============================================================

/**
 * Calculates quiz statistics from attempts
 */
export function calculateQuizStatistics(
    totalStudents: number,
    attempts: QuizAttempt[]
): QuizStatistics {
    const completedAttempts = attempts.filter(a => a.attempt_status === 'COMPLETED');
    const inProgressAttempts = attempts.filter(a => a.attempt_status === 'IN_PROGRESS');

    // Get unique students who attempted
    const attemptedStudents = new Set(attempts.map(a => a.student_id));
    const attemptedCount = attemptedStudents.size;

    const scores = completedAttempts
        .filter(a => a.score !== null)
        .map(a => a.score!);

    const times = completedAttempts
        .filter(a => a.time_taken_seconds !== null)
        .map(a => a.time_taken_seconds!);

    const passedCount = completedAttempts.filter(a => a.passed === true).length;
    const failedCount = completedAttempts.filter(a => a.passed === false).length;

    const averageScore = scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;

    const averageTime = times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : null;

    const attemptRate = totalStudents > 0
        ? Number(((attemptedCount / totalStudents) * 100).toFixed(2))
        : 0;

    const passRate = completedAttempts.length > 0
        ? Number(((passedCount / completedAttempts.length) * 100).toFixed(2))
        : 0;

    return {
        total_students: totalStudents,
        attempted_count: attemptedCount,
        not_attempted_count: totalStudents - attemptedCount,
        completed_count: completedAttempts.length,
        in_progress_count: inProgressAttempts.length,
        passed_count: passedCount,
        failed_count: failedCount,
        average_score: averageScore,
        highest_score: scores.length > 0 ? Math.max(...scores) : null,
        lowest_score: scores.length > 0 ? Math.min(...scores) : null,
        average_time_seconds: averageTime,
        attempt_rate: attemptRate,
        pass_rate: passRate,
    };
}

/**
 * Calculates question statistics from responses
 */
export function calculateQuestionStatistics(
    question: QuizQuestion,
    responses: QuizResponse[]
): QuestionStatistics {
    const questionResponses = responses.filter(r => r.question_id === question.id);
    const totalResponses = questionResponses.length;

    const correctCount = questionResponses.filter(r => r.is_correct === true).length;
    const incorrectCount = totalResponses - correctCount;

    const times = questionResponses
        .filter(r => r.time_spent_seconds > 0)
        .map(r => r.time_spent_seconds);

    const averageTime = times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : null;

    // Calculate option distribution
    const optionDistribution: Record<string, number> = {};
    Object.keys(question.options).forEach(key => {
        optionDistribution[key] = 0;
    });

    questionResponses.forEach(r => {
        (r.selected_answers || []).forEach(ans => {
            if (optionDistribution[ans] !== undefined) {
                optionDistribution[ans]++;
            }
        });
    });

    // Find most selected option
    let mostSelectedOption: string | null = null;
    let maxSelections = 0;
    Object.entries(optionDistribution).forEach(([key, count]) => {
        if (count > maxSelections) {
            maxSelections = count;
            mostSelectedOption = key;
        }
    });

    return {
        question_id: question.id,
        question_text: question.question_text,
        total_responses: totalResponses,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        correct_rate: totalResponses > 0 ? Number(((correctCount / totalResponses) * 100).toFixed(2)) : 0,
        average_time_seconds: averageTime,
        most_selected_option: mostSelectedOption,
        option_distribution: optionDistribution,
    };
}

/**
 * Calculates student quiz summary
 */
export function calculateStudentQuizSummary(
    quizzes: Quiz[],
    attempts: QuizAttempt[]
): StudentQuizSummary {
    const attemptedQuizIds = new Set(attempts.map(a => a.quiz_id));
    const attemptedCount = attemptedQuizIds.size;
    const pendingCount = quizzes.length - attemptedCount;

    const completedAttempts = attempts.filter(a => a.attempt_status === 'COMPLETED');
    const passedCount = completedAttempts.filter(a => a.passed === true).length;
    const failedCount = completedAttempts.filter(a => a.passed === false).length;

    const scores = completedAttempts
        .filter(a => a.score !== null)
        .map(a => a.score!);

    const percentages = completedAttempts
        .filter(a => a.percentage !== null)
        .map(a => a.percentage!);

    const times = completedAttempts
        .filter(a => a.time_taken_seconds !== null)
        .map(a => a.time_taken_seconds!);

    const averageScore = scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;

    const averagePercentage = percentages.length > 0
        ? Number((percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2))
        : null;

    const totalTimeSpent = times.reduce((a, b) => a + b, 0);

    // Find best performance
    let bestPerformanceQuizId: string | null = null;
    let bestPercentage = -1;
    completedAttempts.forEach(a => {
        if (a.percentage !== null && a.percentage > bestPercentage) {
            bestPercentage = a.percentage;
            bestPerformanceQuizId = a.quiz_id;
        }
    });

    return {
        total_quizzes: quizzes.length,
        attempted_count: attemptedCount,
        pending_count: pendingCount,
        passed_count: passedCount,
        failed_count: failedCount,
        average_score: averageScore,
        average_percentage: averagePercentage,
        total_time_spent_seconds: totalTimeSpent,
        best_performance_quiz_id: bestPerformanceQuizId,
    };
}

/**
 * Calculates class quiz report
 */
export function calculateClassQuizReport(
    classId: string,
    className: string,
    quizzes: Quiz[],
    allAttempts: QuizAttempt[],
    totalStudents: number
): ClassQuizReport {
    const activeQuizzes = quizzes.filter(q => q.is_active);

    const attemptRates: number[] = [];
    const passRates: number[] = [];
    const scores: number[] = [];
    const studentsWithAttempts = new Set<string>();
    const studentsWithAllPassed = new Set<string>();

    quizzes.forEach(quiz => {
        const quizAttempts = allAttempts.filter(a => a.quiz_id === quiz.id);
        const quizStudents = new Set(quizAttempts.map(a => a.student_id));

        // Track attempt rate
        const rate = totalStudents > 0
            ? (quizStudents.size / totalStudents) * 100
            : 0;
        attemptRates.push(rate);

        // Track pass rate and scores
        const completed = quizAttempts.filter(a => a.attempt_status === 'COMPLETED');
        const passed = completed.filter(a => a.passed === true);

        if (completed.length > 0) {
            passRates.push((passed.length / completed.length) * 100);
        }

        quizAttempts.forEach(a => {
            studentsWithAttempts.add(a.student_id);
            if (a.score !== null) {
                scores.push(a.score);
            }
        });
    });

    // Calculate students with all quizzes passed
    studentsWithAttempts.forEach(studentId => {
        const studentAttempts = allAttempts.filter(a => a.student_id === studentId);
        const allPassed = quizzes.every(quiz => {
            const quizAttempt = studentAttempts.find(
                a => a.quiz_id === quiz.id && a.passed === true
            );
            return quizAttempt !== undefined;
        });
        if (allPassed && quizzes.length > 0) {
            studentsWithAllPassed.add(studentId);
        }
    });

    const avgAttemptRate = attemptRates.length > 0
        ? Number((attemptRates.reduce((a, b) => a + b, 0) / attemptRates.length).toFixed(2))
        : 0;

    const avgPassRate = passRates.length > 0
        ? Number((passRates.reduce((a, b) => a + b, 0) / passRates.length).toFixed(2))
        : 0;

    const avgScore = scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;

    return {
        class_id: classId,
        class_name: className,
        total_quizzes: quizzes.length,
        active_quizzes: activeQuizzes.length,
        average_attempt_rate: avgAttemptRate,
        average_pass_rate: avgPassRate,
        average_score: avgScore,
        students_summary: {
            total: totalStudents,
            with_attempts: studentsWithAttempts.size,
            with_all_passed: studentsWithAllPassed.size,
        },
    };
}

// ============================================================
// TRANSFORMATION UTILITIES
// ============================================================

/**
 * Creates attempt for teacher's view
 */
export function createAttemptForTeacher(attempt: QuizAttempt): AttemptForTeacher {
    return {
        id: attempt.id,
        student_id: attempt.student_id,
        student_name: attempt.student?.full_name ?? 'Unknown Student',
        student_username: attempt.student?.username ?? null,
        student_avatar: attempt.student?.avatar_url ?? null,
        attempt_number: attempt.attempt_number,
        attempt_status: attempt.attempt_status,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        time_taken_seconds: attempt.time_taken_seconds,
        score: attempt.score,
        max_score: attempt.max_score,
        percentage: attempt.percentage,
        passed: attempt.passed,
    };
}

/**
 * Creates student attempt status item
 */
export function createStudentAttemptStatusItem(
    studentInfo: { id: string; full_name: string | null; username: string | null },
    attempts: QuizAttempt[]
): StudentAttemptStatusItem {
    const completedAttempts = attempts.filter(
        a => a.attempt_status === 'COMPLETED' || a.attempt_status === 'TIMEOUT'
    );

    const bestAttempt = completedAttempts.reduce<QuizAttempt | null>((best, current) => {
        if (!best) return current;
        if (current.score !== null && (best.score === null || current.score > best.score)) {
            return current;
        }
        return best;
    }, null);

    const lastAttempt = attempts.length > 0
        ? attempts.reduce((latest, current) =>
            new Date(current.started_at) > new Date(latest.started_at) ? current : latest
        )
        : null;

    return {
        student_id: studentInfo.id,
        student_name: studentInfo.full_name ?? 'Unknown Student',
        student_username: studentInfo.username,
        has_attempted: attempts.length > 0,
        total_attempts: completedAttempts.length,
        best_score: bestAttempt?.score ?? null,
        best_percentage: bestAttempt?.percentage ?? null,
        passed: bestAttempt?.passed ?? null,
        last_attempt_at: lastAttempt?.started_at ?? null,
    };
}

/**
 * Creates response for review
 */
export function createResponseForReview(
    response: QuizResponse,
    question: QuizQuestion,
    showCorrectAnswers: boolean
): QuizResponseForReview {
    return {
        id: response.id,
        question_id: response.question_id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        selected_answers: response.selected_answers,
        correct_answers: showCorrectAnswers ? question.correct_answers : undefined,
        is_correct: response.is_correct,
        points_earned: response.points_earned,
        points_deducted: response.points_deducted,
        explanation: showCorrectAnswers ? question.explanation : undefined,
    };
}

/**
 * Creates quiz attempt result
 */
export function createQuizAttemptResult(
    attempt: QuizAttempt,
    quiz: Quiz,
    responses: QuizResponse[],
    questions: QuizQuestion[]
): QuizAttemptResult {
    const correctCount = responses.filter(r => r.is_correct === true).length;
    const incorrectCount = responses.filter(r => r.is_correct === false).length;
    const unansweredCount = questions.length - responses.length;

    const responsesForReview = quiz.show_correct_answers
        ? responses.map(r => {
            const question = questions.find(q => q.id === r.question_id);
            return question
                ? createResponseForReview(r, question, quiz.show_correct_answers)
                : null;
        }).filter((r): r is QuizResponseForReview => r !== null)
        : undefined;

    return {
        attempt_id: attempt.id,
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        score: attempt.score ?? 0,
        max_score: quiz.max_score,
        percentage: attempt.percentage ?? 0,
        passed: attempt.passed,
        passing_score: quiz.passing_score,
        time_taken_seconds: attempt.time_taken_seconds ?? 0,
        time_limit_minutes: quiz.time_limit_minutes,
        total_questions: questions.length,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
        show_correct_answers: quiz.show_correct_answers,
        responses: responsesForReview,
    };
}

/**
 * Creates leaderboard from attempts
 */
export function createLeaderboard(
    attempts: QuizAttempt[],
    maxEntries = 10
): LeaderboardEntry[] {
    // Get best attempt per student
    const bestAttempts = new Map<string, QuizAttempt>();

    attempts
        .filter(a => a.attempt_status === 'COMPLETED' && a.score !== null)
        .forEach(attempt => {
            const existing = bestAttempts.get(attempt.student_id);
            if (!existing || (attempt.score ?? 0) > (existing.score ?? 0)) {
                bestAttempts.set(attempt.student_id, attempt);
            }
        });

    // Sort by score (desc), then by time (asc)
    const sorted = Array.from(bestAttempts.values()).sort((a, b) => {
        if (a.score !== b.score) {
            return (b.score ?? 0) - (a.score ?? 0);
        }
        return (a.time_taken_seconds ?? Infinity) - (b.time_taken_seconds ?? Infinity);
    });

    return sorted.slice(0, maxEntries).map((attempt, index) => ({
        rank: index + 1,
        student_id: attempt.student_id,
        student_name: attempt.student?.full_name ?? 'Unknown Student',
        student_avatar: attempt.student?.avatar_url ?? null,
        score: attempt.score ?? 0,
        percentage: attempt.percentage ?? 0,
        time_taken_seconds: attempt.time_taken_seconds ?? 0,
        attempt_number: attempt.attempt_number,
    }));
}

// ============================================================
// QUERY FILTER UTILITIES
// ============================================================

/**
 * Builds quiz query filters for Supabase
 */
export function buildQuizQueryFilters(filters: QuizFilters) {
    const queryFilters: Record<string, unknown> = {};

    if (filters.class_id) queryFilters.class_id = filters.class_id;
    if (filters.teacher_id) queryFilters.teacher_id = filters.teacher_id;
    if (filters.branch_id) queryFilters.branch_id = filters.branch_id;
    if (filters.is_active !== undefined) queryFilters.is_active = filters.is_active;

    return queryFilters;
}

/**
 * Validates quiz time range
 */
export function validateQuizTimeRange(
    availableFrom: string,
    availableTo: string
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (new Date(availableFrom) >= new Date(availableTo)) {
        errors.push('Available from must be before available to');
    }

    return { isValid: errors.length === 0, errors };
}

// ============================================================
// EXPORT ALL TYPES FOR CONVENIENCE
// ============================================================

export type {
    Quiz,
    QuizQuestion,
    QuizAttempt,
    QuizResponse,
    QuizStatistics,
    QuestionStatistics,
    StudentQuizSummary,
    ClassQuizReport,
    QuizFilters,
    AttemptForTeacher,
    StudentAttemptStatusItem,
    QuizResponseForReview,
    QuizAttemptResult,
    LeaderboardEntry,
    QuizOptions,
};
