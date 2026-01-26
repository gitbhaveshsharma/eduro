/**
 * Assignment System Utility Functions
 * 
 * Pure utility functions for assignment calculations, formatting, and transformations.
 * All functions are pure (no side effects) and follow functional programming principles.
 * 
 * @module branch-system/utils/assignment
 */

import type {
    Assignment,
    AssignmentRow,
    AssignmentSubmission,
    AssignmentSubmissionRow,
    AssignmentStatistics,
    StudentAssignmentSummary,
    ClassAssignmentReport,
    AssignmentFilters,
    AssignmentStatus,
    AssignmentSubmissionType,
    GradingStatus,
    CleanupFrequency,
    SubmissionForGrading,
    StudentSubmissionStatusItem,
    AssignmentFile,
    RubricItem,
} from '../types/assignment.types';
import { StudentSubmissionStatus } from '../types/assignment.types';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Assignment status display configurations
 * Icon names from lucide-react
 */
export const ASSIGNMENT_STATUS_CONFIG = {
    DRAFT: {
        label: 'Draft',
        variant: 'secondary' as const,
        priority: 1,
        icon: 'FileEdit',
        description: 'Not visible to students',
    },
    PUBLISHED: {
        label: 'Published',
        variant: 'success' as const,
        priority: 2,
        icon: 'CheckCircle2',
        description: 'Visible to students',
    },
    CLOSED: {
        label: 'Closed',
        variant: 'destructive' as const,
        priority: 3,
        icon: 'Lock',
        description: 'No more submissions accepted',
    },
} as const;

/**
 * Submission type display configurations
 * Icon names from lucide-react
 */
export const SUBMISSION_TYPE_CONFIG = {
    FILE: {
        label: 'File Upload',
        variant: 'outline' as const,
        icon: 'FileUp',
        description: 'Submit a file',
    },
    TEXT: {
        label: 'Text Entry',
        variant: 'outline' as const,
        icon: 'FileText',
        description: 'Write your submission',
    },
} as const;

/**
 * Grading status display configurations
 * Icon names from lucide-react
 */
export const GRADING_STATUS_CONFIG = {
    NOT_GRADED: {
        label: 'Awaiting Grading',
        variant: 'warning' as const,
        priority: 1,
        icon: 'Clock',
    },
    AUTO_GRADED: {
        label: 'Auto Graded',
        variant: 'outline' as const,
        priority: 2,
        icon: 'Cpu',
    },
    MANUAL_GRADED: {
        label: 'Graded',
        variant: 'success' as const,
        priority: 3,
        icon: 'CheckCircle',
    },
} as const;

/**
 * Student submission status display configurations
 * Icon names from lucide-react
 */
export const STUDENT_STATUS_CONFIG = {
    NOT_STARTED: {
        label: 'Not Started',
        variant: 'secondary' as const,
        priority: 1,
        icon: 'Circle',
    },
    DRAFT_SAVED: {
        label: 'Draft Saved',
        variant: 'warning' as const,
        priority: 2,
        icon: 'Save',
    },
    SUBMITTED: {
        label: 'Submitted',
        variant: 'success' as const,
        priority: 3,
        icon: 'CheckCircle',
    },
    LATE: {
        label: 'Late Submission',
        variant: 'destructive' as const,
        priority: 4,
        icon: 'AlertCircle',
    },
    GRADED: {
        label: 'Graded',
        variant: 'success' as const,
        priority: 5,
        icon: 'BarChart3',
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
        description: 'Keep permanently (not recommended)',
    },
} as const;

/**
 * Score thresholds for grading display
 */
export const SCORE_THRESHOLDS = {
    EXCELLENT: 90,   // >= 90%
    GOOD: 80,        // 80-89%
    SATISFACTORY: 70, // 70-79%
    PASSING: 60,     // 60-69%
    FAILING: 60,     // < 60%
} as const;

/**
 * Default allowed file extensions
 */
export const DEFAULT_ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'txt', 'rtf',
    'jpg', 'jpeg', 'png', 'gif',
    'xls', 'xlsx', 'csv',
    'ppt', 'pptx',
    'zip', 'rar',
] as const;

/**
 * File size constants
 */
export const FILE_SIZE_CONSTANTS = {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    DEFAULT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_ALLOWED_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

// ============================================================
// STATUS UTILITIES
// ============================================================

/**
 * Gets assignment status configuration
 */
export function getAssignmentStatusConfig(status: AssignmentStatus) {
    return ASSIGNMENT_STATUS_CONFIG[status];
}

/**
 * Gets submission type configuration
 */
export function getSubmissionTypeConfig(type: AssignmentSubmissionType) {
    return SUBMISSION_TYPE_CONFIG[type];
}

/**
 * Gets grading status configuration
 */
export function getGradingStatusConfig(status: GradingStatus) {
    return GRADING_STATUS_CONFIG[status];
}

/**
 * Gets student submission status configuration
 */
export function getStudentStatusConfig(status: StudentSubmissionStatus) {
    return STUDENT_STATUS_CONFIG[status];
}

/**
 * Formats assignment status for display
 */
export function formatAssignmentStatus(status: AssignmentStatus, includeIcon = false): string {
    const config = getAssignmentStatusConfig(status);
    return includeIcon ? `${config.icon} ${config.label}` : config.label;
}

/**
 * Formats grading status for display
 */
export function formatGradingStatus(status: GradingStatus, includeIcon = false): string {
    const config = getGradingStatusConfig(status);
    return includeIcon ? `${config.icon} ${config.label}` : config.label;
}

/**
 * Formats student submission status for display
 */
export function formatStudentStatus(status: StudentSubmissionStatus, includeIcon = false): string {
    const config = getStudentStatusConfig(status);
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
 * Checks if a date is today
 */
export function isToday(dateTime: string): boolean {
    const date = new Date(dateTime).toISOString().split('T')[0];
    return date === getCurrentDateString();
}

/**
 * Calculates minutes between two date-times
 */
export function calculateMinutesDifference(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.floor((endTime - startTime) / (1000 * 60));
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
 * Formats relative time (e.g., "2 hours ago", "in 3 days")
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
 * Gets due date status info
 */
export function getDueDateStatus(dueDate: string): {
    isOverdue: boolean;
    isDueSoon: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    minutesRemaining: number;
} {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();

    const isOverdue = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const minutesRemaining = Math.floor(absDiffMs / (1000 * 60));
    const hoursRemaining = Math.floor(absDiffMs / (1000 * 60 * 60));
    const daysRemaining = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

    // Due soon = within 24 hours
    const isDueSoon = !isOverdue && hoursRemaining < 24;

    return {
        isOverdue,
        isDueSoon,
        daysRemaining: isOverdue ? -daysRemaining : daysRemaining,
        hoursRemaining: isOverdue ? -hoursRemaining : hoursRemaining,
        minutesRemaining: isOverdue ? -minutesRemaining : minutesRemaining,
    };
}

/**
 * Calculates cleanup date based on due date and cleanup frequency
 */
export function calculateCleanupDate(
    dueDate: string,
    cleanupFrequency: CleanupFrequency
): string | null {
    const config = CLEANUP_FREQUENCY_CONFIG[cleanupFrequency];
    if (!config.days) return null;

    const due = new Date(dueDate);
    due.setDate(due.getDate() + config.days);
    return due.toISOString();
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
 * Calculates late penalty
 */
export function calculateLatePenalty(
    originalScore: number,
    penaltyPercentage: number,
    lateMinutes: number
): { penaltyAmount: number; adjustedScore: number } {
    if (penaltyPercentage <= 0 || lateMinutes <= 0) {
        return { penaltyAmount: 0, adjustedScore: originalScore };
    }

    const penaltyAmount = Number(((originalScore * penaltyPercentage) / 100).toFixed(2));
    const adjustedScore = Math.max(0, Number((originalScore - penaltyAmount).toFixed(2)));

    return { penaltyAmount, adjustedScore };
}

/**
 * Calculates rubric total score
 */
export function calculateRubricTotal(
    rubricScores: { rubric_item_id: string; points_awarded: number }[],
    rubricItems: RubricItem[]
): { earned: number; total: number; percentage: number } {
    const total = rubricItems.reduce((sum, item) => sum + item.max_points, 0);
    const earned = rubricScores.reduce((sum, score) => sum + score.points_awarded, 0);
    const percentage = total > 0 ? calculatePercentage(earned, total) : 0;

    return { earned, total, percentage };
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

// ============================================================
// FILE UTILITIES
// ============================================================

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < FILE_SIZE_CONSTANTS.KB) {
        return `${bytes} B`;
    } else if (bytes < FILE_SIZE_CONSTANTS.MB) {
        return `${(bytes / FILE_SIZE_CONSTANTS.KB).toFixed(1)} KB`;
    } else if (bytes < FILE_SIZE_CONSTANTS.GB) {
        return `${(bytes / FILE_SIZE_CONSTANTS.MB).toFixed(1)} MB`;
    } else {
        return `${(bytes / FILE_SIZE_CONSTANTS.GB).toFixed(2)} GB`;
    }
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Checks if file extension is allowed
 */
export function isExtensionAllowed(
    fileName: string,
    allowedExtensions: string[] | null
): boolean {
    const extensions = allowedExtensions ?? DEFAULT_ALLOWED_EXTENSIONS as unknown as string[];
    if (extensions.length === 0) return true;

    const extension = getFileExtension(fileName);
    return extensions.map(e => e.toLowerCase()).includes(extension);
}

/**
 * Validates file size
 */
export function validateFileSize(
    fileSize: number,
    maxSize: number = FILE_SIZE_CONSTANTS.DEFAULT_MAX_SIZE
): { isValid: boolean; error?: string } {
    if (fileSize <= 0) {
        return { isValid: false, error: 'File size must be positive' };
    }
    if (fileSize > maxSize) {
        return {
            isValid: false,
            error: `File size exceeds limit of ${formatFileSize(maxSize)}`,
        };
    }
    return { isValid: true };
}

/**
 * Gets MIME type icon
 */
export function getMimeTypeIcon(mimeType: string | null): string {
    if (!mimeType) return '📄';

    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📙';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    if (mimeType.includes('text')) return '📝';

    return '📄';
}

// ============================================================
// SUBMISSION STATUS UTILITIES
// ============================================================

/**
 * Determines student submission status from submission data
 */
export function determineStudentStatus(
    submission: AssignmentSubmission | null,
    assignment: Assignment
): StudentSubmissionStatus {
    if (!submission) {
        return StudentSubmissionStatus.NOT_STARTED;
    }

    if (submission.grading_status === 'MANUAL_GRADED' ||
        submission.grading_status === 'AUTO_GRADED') {
        return StudentSubmissionStatus.GRADED;
    }

    if (submission.is_late) {
        return StudentSubmissionStatus.LATE;
    }

    if (submission.is_final) {
        return StudentSubmissionStatus.SUBMITTED;
    }

    return StudentSubmissionStatus.DRAFT_SAVED;
}

/**
 * Checks if student can submit to assignment
 */
export function canSubmit(
    assignment: Assignment,
    existingSubmission: AssignmentSubmission | null
): { canSubmit: boolean; reason?: string } {
    // Check assignment status
    if (assignment.status !== 'PUBLISHED') {
        return { canSubmit: false, reason: 'Assignment is not published' };
    }

    // Check visibility
    if (!assignment.is_visible) {
        return { canSubmit: false, reason: 'Assignment is not visible' };
    }

    // Check close date
    if (assignment.close_date && isPastDateTime(assignment.close_date)) {
        return { canSubmit: false, reason: 'Submission period has closed' };
    }

    // Check due date
    const isOverdue = isPastDateTime(assignment.due_date);
    if (isOverdue && !assignment.allow_late_submission) {
        return { canSubmit: false, reason: 'Due date has passed and late submissions are not allowed' };
    }

    // Check max submissions
    if (existingSubmission && existingSubmission.is_final) {
        const attemptNumber = existingSubmission.attempt_number;
        if (attemptNumber >= assignment.max_submissions) {
            return { canSubmit: false, reason: 'Maximum submissions reached' };
        }
    }

    // Can submit (possibly late)
    if (isOverdue) {
        return { canSubmit: true, reason: 'Late submission allowed with penalty' };
    }

    return { canSubmit: true };
}

/**
 * Checks if assignment can be edited by teacher
 */
export function canEditAssignment(
    assignment: Assignment,
    hasSubmissions: boolean
): { canEdit: boolean; restrictions: string[] } {
    const restrictions: string[] = [];

    if (assignment.status === 'CLOSED') {
        restrictions.push('Cannot edit closed assignment');
        return { canEdit: false, restrictions };
    }

    if (hasSubmissions) {
        restrictions.push('Cannot change submission type after students submit');
        restrictions.push('Cannot reduce max score after grading starts');
    }

    return { canEdit: true, restrictions };
}

// ============================================================
// STATISTICS UTILITIES
// ============================================================

/**
 * Calculates assignment statistics from submissions
 */
export function calculateAssignmentStatistics(
    totalStudents: number,
    submissions: AssignmentSubmission[]
): AssignmentStatistics {
    const finalSubmissions = submissions.filter(s => s.is_final);
    const draftSubmissions = submissions.filter(s => !s.is_final);
    const lateSubmissions = finalSubmissions.filter(s => s.is_late);
    const gradedSubmissions = finalSubmissions.filter(
        s => s.grading_status === 'MANUAL_GRADED' || s.grading_status === 'AUTO_GRADED'
    );

    const scores = gradedSubmissions
        .filter(s => s.score !== null)
        .map(s => s.score!);

    const averageScore = scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;

    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

    const submittedCount = finalSubmissions.length;
    const submissionRate = totalStudents > 0
        ? Number(((submittedCount / totalStudents) * 100).toFixed(2))
        : 0;

    const onTimeCount = finalSubmissions.filter(s => !s.is_late).length;
    const onTimeRate = submittedCount > 0
        ? Number(((onTimeCount / submittedCount) * 100).toFixed(2))
        : 0;

    return {
        total_students: totalStudents,
        submitted_count: submittedCount,
        not_submitted_count: totalStudents - submittedCount,
        draft_count: draftSubmissions.length,
        late_count: lateSubmissions.length,
        graded_count: gradedSubmissions.length,
        not_graded_count: submittedCount - gradedSubmissions.length,
        average_score: averageScore,
        highest_score: highestScore,
        lowest_score: lowestScore,
        submission_rate: submissionRate,
        on_time_rate: onTimeRate,
    };
}

/**
 * Calculates student assignment summary
 */
export function calculateStudentSummary(
    assignments: Assignment[],
    submissions: AssignmentSubmission[]
): StudentAssignmentSummary {
    const submissionMap = new Map(
        submissions.filter(s => s.is_final).map(s => [s.assignment_id, s])
    );

    const submittedCount = submissionMap.size;
    const pendingCount = assignments.length - submittedCount;

    const gradedSubmissions = Array.from(submissionMap.values()).filter(
        s => s.grading_status === 'MANUAL_GRADED' || s.grading_status === 'AUTO_GRADED'
    );

    const scores = gradedSubmissions.filter(s => s.score !== null);
    const totalPointsEarned = scores.reduce((sum, s) => sum + (s.score ?? 0), 0);
    const totalPointsPossible = scores.reduce((sum, s) => sum + (s.max_score ?? 0), 0);

    const averageScore = scores.length > 0
        ? Number((totalPointsEarned / scores.length).toFixed(2))
        : null;

    const onTimeSubmissions = Array.from(submissionMap.values()).filter(s => !s.is_late).length;
    const lateSubmissions = Array.from(submissionMap.values()).filter(s => s.is_late).length;

    return {
        total_assignments: assignments.length,
        submitted_count: submittedCount,
        pending_count: pendingCount,
        graded_count: gradedSubmissions.length,
        average_score: averageScore,
        total_points_earned: Number(totalPointsEarned.toFixed(2)),
        total_points_possible: Number(totalPointsPossible.toFixed(2)),
        on_time_submissions: onTimeSubmissions,
        late_submissions: lateSubmissions,
    };
}

/**
 * Calculates class assignment report
 */
export function calculateClassReport(
    classId: string,
    className: string,
    assignments: Assignment[],
    allSubmissions: AssignmentSubmission[],
    totalStudents: number
): ClassAssignmentReport {
    const publishedAssignments = assignments.filter(a => a.status === 'PUBLISHED');

    const submissionRates: number[] = [];
    const scores: number[] = [];
    let studentsWithSubmissions = new Set<string>();
    let studentsWithPerfectScores = new Set<string>();

    publishedAssignments.forEach(assignment => {
        const assignmentSubmissions = allSubmissions.filter(
            s => s.assignment_id === assignment.id && s.is_final
        );

        // Track submission rate
        const rate = totalStudents > 0
            ? (assignmentSubmissions.length / totalStudents) * 100
            : 0;
        submissionRates.push(rate);

        // Track students and scores
        assignmentSubmissions.forEach(s => {
            studentsWithSubmissions.add(s.student_id);
            if (s.score !== null) {
                scores.push(s.score);
                if (s.max_score && s.score >= s.max_score) {
                    studentsWithPerfectScores.add(s.student_id);
                }
            }
        });
    });

    const avgSubmissionRate = submissionRates.length > 0
        ? Number((submissionRates.reduce((a, b) => a + b, 0) / submissionRates.length).toFixed(2))
        : 0;

    const avgScore = scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;

    return {
        class_id: classId,
        class_name: className,
        total_assignments: assignments.length,
        published_assignments: publishedAssignments.length,
        average_submission_rate: avgSubmissionRate,
        average_score: avgScore,
        students_summary: {
            total: totalStudents,
            with_submissions: studentsWithSubmissions.size,
            with_perfect_scores: studentsWithPerfectScores.size,
        },
    };
}

// ============================================================
// TRANSFORMATION UTILITIES
// ============================================================

/**
 * Creates submission for grading view from submission data
 */
export function createSubmissionForGrading(
    submission: AssignmentSubmission
): SubmissionForGrading {
    return {
        id: submission.id,
        student_id: submission.student_id,
        student_name: submission.student?.full_name ?? 'Unknown Student',
        student_username: submission.student?.username ?? null,
        student_avatar: submission.student?.avatar_url ?? null,
        submitted_at: submission.submitted_at,
        is_late: submission.is_late,
        late_minutes: submission.late_minutes,
        grading_status: submission.grading_status,
        score: submission.score,
        feedback: submission.feedback,
        private_notes: submission.private_notes,
        attempt_number: submission.attempt_number,
        is_final: submission.is_final,
        submission_text: submission.submission_text,
        submission_file: submission.submission_file,
    };
}

/**
 * Creates student submission status item
 */
export function createStudentStatusItem(
    studentInfo: { id: string; full_name: string | null; username: string | null },
    submission: AssignmentSubmission | null
): StudentSubmissionStatusItem {
    return {
        student_id: studentInfo.id,
        student_name: studentInfo.full_name ?? 'Unknown Student',
        student_username: studentInfo.username,
        has_submitted: submission?.is_final ?? false,
        is_final: submission?.is_final ?? false,
        submitted_at: submission?.submitted_at ?? null,
        is_late: submission?.is_late ?? false,
        grading_status: submission?.grading_status ?? null,
        score: submission?.score ?? null,
    };
}

// ============================================================
// QUERY FILTER UTILITIES
// ============================================================

/**
 * Builds assignment query filters for Supabase
 */
export function buildAssignmentQueryFilters(filters: AssignmentFilters) {
    const queryFilters: Record<string, unknown> = {};

    if (filters.class_id) queryFilters.class_id = filters.class_id;
    if (filters.teacher_id) queryFilters.teacher_id = filters.teacher_id;
    if (filters.branch_id) queryFilters.branch_id = filters.branch_id;
    if (filters.status) queryFilters.status = filters.status;
    if (filters.submission_type) queryFilters.submission_type = filters.submission_type;
    if (filters.is_visible !== undefined) queryFilters.is_visible = filters.is_visible;

    return queryFilters;
}

/**
 * Validates assignment date range
 */
export function validateAssignmentDates(
    publishAt: string | null | undefined,
    dueDate: string,
    closeDate: string | null | undefined
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (publishAt && dueDate) {
        if (new Date(publishAt) > new Date(dueDate)) {
            errors.push('Publish date must be before or equal to due date');
        }
    }

    if (closeDate && dueDate) {
        if (new Date(dueDate) > new Date(closeDate)) {
            errors.push('Due date must be before or equal to close date');
        }
    }

    return { isValid: errors.length === 0, errors };
}

// ============================================================
// EXPORT ALL TYPES FOR CONVENIENCE
// ============================================================

export type {
    Assignment,
    AssignmentRow,
    AssignmentSubmission,
    AssignmentSubmissionRow,
    AssignmentStatistics,
    StudentAssignmentSummary,
    ClassAssignmentReport,
    AssignmentFilters,
    AssignmentFile,
    RubricItem,
    SubmissionForGrading,
    StudentSubmissionStatusItem,
};
