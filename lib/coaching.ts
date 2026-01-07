/**
 * Coaching System Index
 * 
 * Central export file for the coaching system
 * Provides easy access to all coaching-related functionality
 */

// Import dependencies for API creation
import { CoachingService } from './service/coaching.service';
import { useCoachingStore } from './store/coaching.store';

// Types and Schemas
export type {
  CoachingCenter,
  CoachingBranch,
  PublicCoachingCenter,
  PublicCoachingBranch,
  CoachingCenterUpdate,
  CoachingBranchUpdate,
  CoachingCenterCreate,
  CoachingBranchCreate,
  CoachingCenterFilters,
  CoachingBranchFilters,
  CoachingCenterSort,
  CoachingBranchSort,
  CoachingCenterSearchResult,
  CoachingBranchSearchResult,
  CoachingCenterStats,
  CoachingCenterRPCStats,
  CoachingCenterWithBranches,
  CoachingCenterDashboard,
  CoachingCenterPermissions,
  CoachingBranchPermissions,
  CoachingOperationResult,
  CoachingCategory,
  CoachingStatus,
  CoachingCategoryGroup,
  CoachingCategoryMeta,
  CoachingContactInfo,
  CoachingMediaInfo,
  CoachingBusinessInfo,
  CoachingValidationError,
  StudentEnrollment,
  TeacherAssignment
} from './schema/coaching.types';

export {
  COACHING_CATEGORIES,
  COACHING_STATUS,
  DEFAULT_COACHING_CENTER_VALUES,
  DEFAULT_COACHING_BRANCH_VALUES,
  COACHING_CATEGORY_METADATA
} from './schema/coaching.types';

// Service
export { CoachingService } from './service/coaching.service';

// Store and Hooks
export {
  useCoachingStore,
  // My coaching centers
  useMyCoachingCenters,
  useMyCoachingCentersLoading,
  useMyCoachingCentersError,
  // Current center
  useCurrentCoachingCenter,
  useCurrentCoachingCenterLoading,
  useCurrentCoachingCenterError,
  // Dashboard
  useCurrentDashboard,
  useCurrentDashboardLoading,
  useCurrentDashboardError,
  // Search
  useCenterSearchResults,
  useCenterSearchLoading,
  useCenterSearchError,
  // Statistics
  useCoachingStats,
  useCoachingStatsLoading,
  // UI State
  useEditMode,
  useCreateMode,
  useEditFormData,
  useBranchEditFormData,
  // Uploads
  useLogoUpload,
  useCoverUpload,
  // Featured and categories
  useFeaturedCenters,
  useFeaturedCentersLoading,
  // Cache selectors
  useCoachingCenterFromCache,
  useCoachingCenterCacheLoading,
  useCoachingCenterCacheError,
  useBranchesFromCache,
  useBranchesCacheLoading,
  useCentersByCategory,
  useCentersByCategoryLoading,
  // Enrollments and assignments
  useStudentEnrollments,
  useStudentEnrollmentsLoading,
  useStudentEnrollmentsError,
  useTeacherAssignments,
  useTeacherAssignmentsLoading,
  useTeacherAssignmentsError
} from './store/coaching.store';

// Utilities
export {
  CoachingDisplayUtils,
  CoachingValidationUtils,
  CoachingSearchUtils,
  CoachingFilterUtils,
  CoachingTransformUtils,
  CoachingUrlUtils,
  CoachingAnalyticsUtils,
  EnrollmentUtils,
  COACHING_CONSTANTS,
  COACHING_ERROR_CODES
} from './utils/coaching.utils';

// API Interface (for easy service access)
export const CoachingAPI = {
  // Center operations
  getCenter: CoachingService.getCoachingCenter,
  getPublicCenter: CoachingService.getPublicCoachingCenter,
  getCenterBySlug: CoachingService.getCoachingCenterBySlug,
  getMyCenters: CoachingService.getMyCoachingCenters,
  getManagedCenters: CoachingService.getManagedCoachingCenters,
  createCenter: CoachingService.createCoachingCenter,
  updateCenter: CoachingService.updateCoachingCenter,
  deleteCenter: CoachingService.deleteCoachingCenter,
  searchCenters: CoachingService.searchCoachingCenters,
  getCenterWithBranches: CoachingService.getCoachingCenterWithBranches,
  getCenterDashboard: CoachingService.getCoachingCenterDashboard,

  // Branch operations
  getBranch: CoachingService.getCoachingBranch,
  getBranchesByCenter: CoachingService.getBranchesByCenter,
  getMyManagedBranches: CoachingService.getMyManagedBranches,
  getAllAccessibleBranches: CoachingService.getAllAccessibleBranches,
  createBranch: CoachingService.createCoachingBranch,
  updateBranch: CoachingService.updateCoachingBranch,
  deleteBranch: CoachingService.deleteCoachingBranch,

  // Statistics
  getStats: CoachingService.getCoachingCenterStats,
  getCenterStats: CoachingService.getCoachingCenterStatsFromFunction,
  getCenterDetailedStats: CoachingService.getCoachingCenterDetailedStats,

  // Permissions
  getCenterPermissions: CoachingService.getCoachingCenterPermissions,
  getBranchPermissions: CoachingService.getCoachingBranchPermissions,

  // Uploads
  uploadLogo: CoachingService.uploadCoachingLogo,
  uploadCover: CoachingService.uploadCoachingCover,

  // Enrollments and assignments
  getStudentEnrollments: CoachingService.getStudentEnrollments,
  getTeacherAssignments: CoachingService.getTeacherAssignments,

  // Utilities
  isSlugAvailable: CoachingService.isSlugAvailable
};

// Store API (for easy store access)
export const CoachingStoreAPI = {
  // Initialize
  initialize: async () => {
    const store = useCoachingStore.getState();
    await store.loadMyCoachingCenters();
    await store.loadStats();
    await store.loadFeaturedCenters();
  },

  // Common operations
  createCenter: (data: any) => useCoachingStore.getState().createCoachingCenter(data),
  updateCenter: (id: string, data: any) => useCoachingStore.getState().updateCoachingCenter(id, data),
  deleteCenter: (id: string) => useCoachingStore.getState().deleteCoachingCenter(id),
  
  loadCenter: (id: string) => useCoachingStore.getState().loadCoachingCenter(id),
  loadDashboard: (id: string) => useCoachingStore.getState().loadCoachingCenterDashboard(id),
  
  search: (filters?: any, sort?: any, page?: number, perPage?: number) => 
    useCoachingStore.getState().searchCoachingCenters(filters, sort, page, perPage),
    
  uploadLogo: (centerId: string, file: File) => 
    useCoachingStore.getState().uploadLogo(centerId, file),
  uploadCover: (centerId: string, file: File) => 
    useCoachingStore.getState().uploadCover(centerId, file),

  // Enrollments and assignments
  loadStudentEnrollments: (studentId?: string) => 
    useCoachingStore.getState().loadStudentEnrollments(studentId),
  loadTeacherAssignments: (teacherId?: string) => 
    useCoachingStore.getState().loadTeacherAssignments(teacherId),
  clearStudentEnrollments: () => useCoachingStore.getState().clearStudentEnrollments(),
  clearTeacherAssignments: () => useCoachingStore.getState().clearTeacherAssignments(),

  // UI state
  setEditMode: (enabled: boolean) => useCoachingStore.getState().setEditMode(enabled),
  setCreateMode: (enabled: boolean) => useCoachingStore.getState().setCreateMode(enabled),
  
  // Clear data
  clearAll: () => {
    const store = useCoachingStore.getState();
    store.clearMyCoachingCenters();
    store.clearCurrentCoachingCenter();
    store.clearCurrentDashboard();
    store.clearCoachingCenterCache();
    store.clearBranchCache();
    store.clearCenterSearch();
    store.clearBranchSearch();
  }
};