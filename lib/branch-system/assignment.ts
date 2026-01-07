/**
 * Assignment System - Central Export
 * 
 * Main export file for the assignment system.
 * Provides centralized access to all assignment-related functionality including
 * types, validations, utilities, services, and stores.
 * 
 * @module branch-system/assignment
 */

import { assignmentService } from './services/assignment.service';
import {
    useAssignmentStore,
    useAssignments,
    useCurrentAssignment,
    useAssignmentLoading,
    useAssignmentError,
    useAssignmentActions,
} from './stores/assignment.store';
import {
    createAssignmentSchema,
    updateAssignmentSchema,
    publishAssignmentSchema,
    closeAssignmentSchema,
    submitAssignmentSchema,
    saveDraftSchema,
    gradeSubmissionSchema,
    updateGradeSchema,
    uploadFileSchema,
    assignmentListParamsSchema,
} from './validations/assignment.validation';

// ============================================================
// SERVICE & STORE EXPORTS
// ============================================================

export {
    AssignmentService,
    assignmentService,
    type AssignmentOperationResult,
    type AssignmentValidationError,
} from './services/assignment.service';

export {
    useAssignmentStore,
    // Selector hooks
    useAssignments,
    useSubmissions,
    useCurrentAssignment,
    useCurrentSubmission,
    useSubmissionsForGrading,
    useStudentStatusList,
    useAssignmentStatistics,
    useStudentAssignmentSummary,
    useClassAssignmentReport,
    useAssignmentToDelete,
    useIsDeleteDialogOpen,
    useSubmissionToGrade,
    useIsGradingDialogOpen,
    useAssignmentFilters,
    useAssignmentPagination,
    useAssignmentSort,
    useAssignmentLoading,
    useAssignmentError,
    useAssignmentSuccessMessage,
    // Action hooks
    useCreateAssignment,
    useUpdateAssignment,
    usePublishAssignment,
    useCloseAssignment,
    useDeleteAssignment,
    useFetchAssignments,
    useFetchAssignmentById,
    useSubmitAssignment,
    useSaveDraft,
    useFetchStudentSubmission,
    useFetchSubmissions,
    useFetchSubmissionsForGrading,
    useFetchStudentStatusList,
    useGradeSubmission,
    useUpdateGrade,
    useRequestRegrade,
    useFetchAssignmentStatistics,
    useFetchStudentSummary,
    useFetchClassReport,
    useUploadFile,
    useDeleteFile,
    useAttachFileToAssignment,
    useSetCurrentAssignment,
    useSetCurrentSubmission,
    useOpenDeleteDialog,
    useCloseDeleteDialog,
    useOpenGradingDialog,
    useCloseGradingDialog,
    useSetAssignmentFilters,
    useResetAssignmentFilters,
    useSetAssignmentPagination,
    useSetAssignmentSort,
    useClearAssignmentError,
    useClearAssignmentSuccessMessage,
    useInvalidateAssignmentCache,
    useResetAssignmentStore,
    // Combined actions hook
    useAssignmentActions,
} from './stores/assignment.store';

// ============================================================
// TYPE EXPORTS
// ============================================================

export {
    // Enums
    AssignmentSubmissionType,
    AssignmentStatus,
    GradingStatus,
    CleanupFrequency,
    StudentSubmissionStatus,
    // File types
    type FileContextType,
    type StorageProvider,
    type FileRow,
    type AssignmentFile,
    // Assignment types
    type RubricItem,
    type AssignmentRow,
    type Assignment,
    type AssignmentListItem,
    // Submission types
    type AssignmentSubmissionRow,
    type AssignmentSubmission,
    type SubmissionForGrading,
    type StudentSubmissionStatusItem,
    // DTO types - Create/Update
    type CreateAssignmentDTO,
    type UpdateAssignmentDTO,
    type PublishAssignmentDTO,
    type CloseAssignmentDTO,
    // DTO types - Submission
    type SubmitAssignmentDTO,
    type SaveDraftDTO,
    // DTO types - Grading
    type GradeSubmissionDTO,
    type UpdateGradeDTO,
    type RegradeRequestDTO,
    // DTO types - File
    type UploadFileDTO,
    type FileUploadResult,
    // Filter & List types
    type AssignmentFilters,
    type AssignmentListParams,
    type AssignmentListResponse,
    type SubmissionFilters,
    type SubmissionListParams,
    type SubmissionListResponse,
    // Statistics types
    type AssignmentStatistics,
    type StudentAssignmentSummary,
    type ClassAssignmentReport,
    // Cleanup types
    type CleanupLogEntry,
    type StorageUsageStats,
} from './types/assignment.types';

// ============================================================
// VALIDATION EXPORTS
// ============================================================

export {
    // Enum schemas
    assignmentSubmissionTypeSchema,
    assignmentStatusSchema,
    gradingStatusSchema,
    cleanupFrequencySchema,
    // Rubric schemas
    rubricItemSchema,
    rubricScoresSchema,
    // Assignment schemas
    createAssignmentSchema,
    updateAssignmentSchema,
    publishAssignmentSchema,
    closeAssignmentSchema,
    // Submission schemas
    submitAssignmentSchema,
    saveDraftSchema,
    // Grading schemas
    gradeSubmissionSchema,
    updateGradeSchema,
    regradeRequestSchema,
    // File schemas
    fileContextTypeSchema,
    uploadFileSchema,
    // Filter schemas
    assignmentFiltersSchema,
    assignmentListParamsSchema,
    submissionFiltersSchema,
    submissionListParamsSchema,
    // Schema types
    type CreateAssignmentSchema,
    type UpdateAssignmentSchema,
    type PublishAssignmentSchema,
    type CloseAssignmentSchema,
    type SubmitAssignmentSchema,
    type SaveDraftSchema,
    type GradeSubmissionSchema,
    type UpdateGradeSchema,
    type RegradeRequestSchema,
    type UploadFileSchema,
    type AssignmentFiltersSchema,
    type AssignmentListParamsSchema,
    type SubmissionFiltersSchema,
    type SubmissionListParamsSchema,
    type RubricItemSchema,
    type RubricScoresSchema,
} from './validations/assignment.validation';

// ============================================================
// UTILITY EXPORTS
// ============================================================

export {
    // Constants
    ASSIGNMENT_STATUS_CONFIG,
    SUBMISSION_TYPE_CONFIG,
    GRADING_STATUS_CONFIG,
    STUDENT_STATUS_CONFIG,
    CLEANUP_FREQUENCY_CONFIG,
    SCORE_THRESHOLDS,
    DEFAULT_ALLOWED_EXTENSIONS,
    FILE_SIZE_CONSTANTS,
    // Status utilities
    getAssignmentStatusConfig,
    getSubmissionTypeConfig,
    getGradingStatusConfig,
    getStudentStatusConfig,
    formatAssignmentStatus,
    formatGradingStatus,
    formatStudentStatus,
    // Date utilities
    getCurrentDateTime,
    getCurrentDateString,
    isPastDateTime,
    isFutureDateTime,
    isToday,
    calculateMinutesDifference,
    formatDateTime,
    formatRelativeTime,
    getDueDateStatus,
    calculateCleanupDate,
    // Score utilities
    calculatePercentage,
    getScorePerformanceLevel,
    getScoreColor,
    calculateLatePenalty,
    calculateRubricTotal,
    formatScore,
    // File utilities
    formatFileSize,
    getFileExtension,
    isExtensionAllowed,
    validateFileSize,
    getMimeTypeIcon,
    // Submission status utilities
    determineStudentStatus,
    canSubmit,
    canEditAssignment,
    // Statistics utilities
    calculateAssignmentStatistics,
    calculateStudentSummary,
    calculateClassReport,
    // Transformation utilities
    createSubmissionForGrading,
    createStudentStatusItem,
    // Query utilities
    buildAssignmentQueryFilters,
    validateAssignmentDates,
} from './utils/assignment.utils';

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

/**
 * Pre-configured service instance for immediate use
 */
export { assignmentService as assignmentServiceInstance } from './services/assignment.service';

/**
 * Complete assignment system bundle
 * Contains all essential parts of the assignment system
 */
export const assignmentSystem = {
    // Service instance
    service: assignmentService,
    // Store hook
    useStore: useAssignmentStore,
    // Combined actions hook
    useActions: useAssignmentActions,
    // Data hooks
    useAssignments,
    useCurrentAssignment,
    useLoading: useAssignmentLoading,
    useError: useAssignmentError,
    // Validation schemas
    validation: {
        createAssignment: createAssignmentSchema,
        updateAssignment: updateAssignmentSchema,
        publishAssignment: publishAssignmentSchema,
        closeAssignment: closeAssignmentSchema,
        submitAssignment: submitAssignmentSchema,
        saveDraft: saveDraftSchema,
        gradeSubmission: gradeSubmissionSchema,
        updateGrade: updateGradeSchema,
        uploadFile: uploadFileSchema,
        listParams: assignmentListParamsSchema,
    },
} as const;

// ============================================================
// QUICK START EXAMPLE
// ============================================================

/**
 * Quick Start Usage Examples
 * 
 * @example
 * ```typescript
 * import {
 *   assignmentService,
 *   useAssignmentActions,
 *   useAssignments,
 *   useCurrentAssignment,
 *   AssignmentStatus,
 *   AssignmentSubmissionType,
 * } from '@/lib/branch-system/assignment';
 * 
 * // ============================================================
 * // TEACHER - Creating an Assignment
 * // ============================================================
 * function CreateAssignmentForm() {
 *   const { createAssignment, publishAssignment } = useAssignmentActions();
 *   
 *   const handleCreate = async () => {
 *     const success = await createAssignment({
 *       class_id: "class-uuid",
 *       teacher_id: "teacher-uuid",
 *       branch_id: "branch-uuid",
 *       title: "Week 5 Essay",
 *       description: "Write a 500-word essay on climate change",
 *       instructions: "Use proper citations...",
 *       submission_type: AssignmentSubmissionType.TEXT,
 *       max_score: 100,
 *       due_date: "2024-02-15T23:59:59Z",
 *       allow_late_submission: true,
 *       late_penalty_percentage: 10,
 *     });
 *     
 *     if (success) {
 *       // Optionally publish immediately
 *       await publishAssignment({ id: "new-assignment-id" });
 *     }
 *   };
 *   
 *   return <button onClick={handleCreate}>Create Assignment</button>;
 * }
 * 
 * // ============================================================
 * // TEACHER - Grading Submissions
 * // ============================================================
 * function GradingView() {
 *   const { 
 *     fetchSubmissionsForGrading, 
 *     gradeSubmission,
 *     openGradingDialog 
 *   } = useAssignmentActions();
 *   const submissions = useSubmissionsForGrading();
 *   
 *   useEffect(() => {
 *     fetchSubmissionsForGrading("assignment-uuid");
 *   }, []);
 *   
 *   const handleGrade = async (submissionId: string) => {
 *     await gradeSubmission({
 *       submission_id: submissionId,
 *       graded_by: "teacher-uuid",
 *       score: 85,
 *       feedback: "Good work! Consider adding more examples.",
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       {submissions.map(sub => (
 *         <div key={sub.id}>
 *           <span>{sub.student_name}</span>
 *           <button onClick={() => handleGrade(sub.id)}>Grade</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // ============================================================
 * // STUDENT - Viewing and Submitting
 * // ============================================================
 * function StudentAssignmentView() {
 *   const { 
 *     fetchAssignments, 
 *     submitAssignment,
 *     saveDraft 
 *   } = useAssignmentActions();
 *   const assignments = useAssignments();
 *   
 *   useEffect(() => {
 *     // Fetch published assignments for student's class
 *     fetchAssignments({ 
 *       class_id: "student-class-uuid",
 *       status: AssignmentStatus.PUBLISHED 
 *     });
 *   }, []);
 *   
 *   const handleSubmit = async (assignmentId: string, text: string) => {
 *     await submitAssignment({
 *       assignment_id: assignmentId,
 *       student_id: "student-uuid",
 *       class_id: "class-uuid",
 *       submission_text: text,
 *       is_final: true,
 *     });
 *   };
 *   
 *   const handleSaveDraft = async (assignmentId: string, text: string) => {
 *     await saveDraft({
 *       assignment_id: assignmentId,
 *       student_id: "student-uuid",
 *       class_id: "class-uuid",
 *       submission_text: text,
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       {assignments.map(a => (
 *         <AssignmentCard 
 *           key={a.id} 
 *           assignment={a}
 *           onSubmit={handleSubmit}
 *           onSaveDraft={handleSaveDraft}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // ============================================================
 * // Direct Service Usage (outside React)
 * // ============================================================
 * async function fetchAssignmentData() {
 *   const result = await assignmentService.getAssignmentById("assignment-uuid");
 *   
 *   if (result.success) {
 *     console.log('Assignment:', result.data);
 *   } else {
 *     console.error('Error:', result.error);
 *   }
 * }
 * 
 * // Get statistics
 * const statsResult = await assignmentService.getAssignmentStatistics("assignment-uuid");
 * if (statsResult.success) {
 *   console.log('Submission rate:', statsResult.data.submission_rate + '%');
 *   console.log('Average score:', statsResult.data.average_score);
 * }
 * ```
 */

// ============================================================
// DEFAULT EXPORT
// ============================================================

/**
 * Default export - complete assignment system
 */
export default assignmentSystem;
