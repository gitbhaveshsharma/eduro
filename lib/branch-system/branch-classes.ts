/**
 * Branch Classes Module
 * 
 * Central export file for the branch classes system
 * Provides easy access to all branch class functionality
 * 
 * @module branch-system/branch-classes
 */

// ============================================================
// TYPES
// ============================================================
export type {
    // Core types
    BranchClass,
    PublicBranchClass,
    BranchClassWithRelations,

    // Enums
    ClassStatus,
    FeeFrequency,
    DayOfWeek,

    // Input types
    CreateBranchClassInput,
    UpdateBranchClassInput,

    // Filter and search types
    BranchClassFilters,
    BranchClassSort,
    PaginationOptions,
    BranchClassSearchResult,

    // Statistics and analytics
    BranchClassStats,
    ClassScheduleInfo,
    ClassAvailability,
    TeacherClassSummary,
    BranchClassSummary,

    // Operation results
    BranchClassOperationResult,
    BranchClassValidationError,
} from './types/branch-classes.types';

// Constants
export {
    DEFAULT_BRANCH_CLASS_VALUES,
    CLASS_STATUS_OPTIONS,
    FEE_FREQUENCY_OPTIONS,
    DAYS_OF_WEEK,
    COMMON_GRADE_LEVELS,
    COMMON_SUBJECTS,
} from './types/branch-classes.types';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================
export {
    // Main schemas
    createBranchClassSchema,
    updateBranchClassSchema,
    branchClassFilterSchema,
    branchClassSortSchema,
    paginationSchema,
    classIdSchema,

    // Base schemas
    uuidSchema,
    classStatusSchema,
    feeFrequencySchema,
    dayOfWeekSchema,
    classNameSchema,
    subjectSchema,
    descriptionSchema,
    gradeLevelSchema,
    batchNameSchema,
    dateSchema,
    timeSchema,
    classDaysSchema,
    maxStudentsSchema,
    prerequisitesSchema,
    materialsRequiredSchema,
    metadataSchema,
    dateRangeSchema,
    timeRangeSchema,

    // Validation functions
    validateCreateBranchClass,
    validateUpdateBranchClass,
    validateBranchClassFilter,
    validateBranchClassSort,
    validatePagination,
    validateClassId,

    // Constants
    BRANCH_CLASS_LIMITS,
} from './validations/branch-classes.validation';

// ============================================================
// UTILITIES
// ============================================================
export {
    // Formatting utilities
    formatTime,
    formatTime24,
    formatDate,
    formatClassDays,
    formatClassSchedule,
    formatFeeFrequency,
    formatClassStatus,
    formatClassDuration,

    // Calculation utilities
    calculateAvailableSeats,
    calculateUtilization,
    calculateClassDuration,
    calculateWeeklyHours,

    // Validation & checking utilities
    isClassFull,
    isClassAvailable,
    getClassAvailability,
    hasClassStarted,
    hasClassEnded,
    getClassTimeStatus,

    // Transformation utilities
    toPublicBranchClass,
    createClassScheduleInfo,

    // Filtering & sorting utilities
    filterClassesBySearch,
    sortClasses,
    groupClassesBySubject,
    groupClassesByGrade,

    // Statistics utilities
    calculateClassStats,

    // Display helpers
    getClassDisplayName,
    getClassSubtitle,
    getCapacityDisplay,
    getAvailabilityBadgeText,
} from './utils/branch-classes.utils';

// ============================================================
// SERVICE
// ============================================================
export {
    BranchClassesService,
    branchClassesService,
} from './services/branch-classes.service';

// ============================================================
// STORE
// ============================================================
export {
    useBranchClassesStore,

    // Selector hooks
    useClass,
    useClassesByBranch,
    useClassesByTeacher,
    useSearchResults,
    useBranchStats,
    useClassesLoading,
    useClassesErrors,
    useClassesUI,
    useSelectedClass,
} from './stores/branch-classes.store';

// ============================================================
// CONVENIENCE API
// ============================================================

/**
 * Branch Classes API
 * 
 * Provides a simple, unified interface for common operations
 * Use this for basic CRUD operations without accessing the service directly
 */
import { branchClassesService } from './services/branch-classes.service';
import { useBranchClassesStore } from './stores/branch-classes.store';
import type { CreateBranchClassInput, UpdateBranchClassInput } from './types/branch-classes.types';

export const BranchClassesAPI = {
    // Data fetching (uses store cache)
    fetchClass: (classId: string, forceRefresh = false) =>
        useBranchClassesStore.getState().fetchClassById(classId, forceRefresh),

    fetchBranchClasses: (branchId: string, forceRefresh = false) =>
        useBranchClassesStore.getState().fetchClassesByBranch(branchId, forceRefresh),

    fetchTeacherClasses: (teacherId: string, forceRefresh = false) =>
        useBranchClassesStore.getState().fetchClassesByTeacher(teacherId, forceRefresh),

    search: (filters = {}, sort = undefined, pagination = undefined) =>
        useBranchClassesStore.getState().searchClasses(filters, sort, pagination),

    fetchStats: (branchId: string, forceRefresh = false) =>
        useBranchClassesStore.getState().fetchBranchStats(branchId, forceRefresh),

    // CRUD operations
    create: (input: CreateBranchClassInput) =>
        useBranchClassesStore.getState().createClass(input),

    update: (classId: string, input: UpdateBranchClassInput) =>
        useBranchClassesStore.getState().updateClass(classId, input),

    delete: (classId: string) =>
        useBranchClassesStore.getState().deleteClass(classId),

    updateStatus: (classId: string, status: any) =>
        useBranchClassesStore.getState().updateClassStatus(classId, status),

    updateVisibility: (classId: string, isVisible: boolean) =>
        useBranchClassesStore.getState().updateClassVisibility(classId, isVisible),

    // Direct service access (bypasses cache)
    service: branchClassesService,

    // Cache management
    clearCache: () => useBranchClassesStore.getState().clearCache(),
    clearBranchCache: (branchId: string) =>
        useBranchClassesStore.getState().clearBranchCache(branchId),
    clearTeacherCache: (teacherId: string) =>
        useBranchClassesStore.getState().clearTeacherCache(teacherId),
    invalidateClass: (classId: string) =>
        useBranchClassesStore.getState().invalidateClass(classId),
} as const;

// ============================================================
// USAGE EXAMPLES
// ============================================================

/**
 * @example Basic Usage in a Component
 * ```tsx
 * import { useClassesByBranch, BranchClassesAPI } from '@/lib/branch-system/branch-classes';
 * 
 * function BranchClassesList({ branchId }) {
 *   const classes = useClassesByBranch(branchId);
 *   const { fetchClasses } = useClassesLoading();
 *   
 *   useEffect(() => {
 *     BranchClassesAPI.fetchBranchClasses(branchId);
 *   }, [branchId]);
 *   
 *   if (fetchClasses) return <Spinner />;
 *   
 *   return (
 *     <div>
 *       {classes.map(cls => (
 *         <ClassCard key={cls.id} class={cls} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Creating a Class
 * ```tsx
 * import { BranchClassesAPI, validateCreateBranchClass } from '@/lib/branch-system/branch-classes';
 * 
 * async function handleCreateClass(formData) {
 *   const validation = validateCreateBranchClass(formData);
 *   
 *   if (!validation.success) {
 *     // Handle validation errors
 *     return;
 *   }
 *   
 *   const success = await BranchClassesAPI.create(validation.data);
 *   
 *   if (success) {
 *     // Success!
 *   }
 * }
 * ```
 * 
 * @example Using Utilities
 * ```tsx
 * import { formatClassSchedule, getClassAvailability } from '@/lib/branch-system/branch-classes';
 * 
 * function ClassDetails({ class: cls }) {
 *   const schedule = formatClassSchedule(cls);
 *   const availability = getClassAvailability(cls);
 *   
 *   return (
 *     <div>
 *       <p>{schedule}</p>
 *       <p>Available: {availability.available_seats} seats</p>
 *     </div>
 *   );
 * }
 * ```
 */
