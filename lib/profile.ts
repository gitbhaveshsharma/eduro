/**
 * Profile Module Index
 * 
 * Centralized exports for all profile-related functionality
 * Provides a clean and organized API for importing profile components
 */

// Types and Schemas
export * from './schema/profile.types';

// Services
export { ProfileService } from './service/profile.service';

// Store and Hooks
export {
  useProfileStore,
  useCurrentProfile,
  useCurrentProfileLoading,
  useCurrentProfileError,
  useSearchResults,
  useSearchLoading,
  useSearchError,
  useProfileStats,
  useProfileStatsLoading,
  useEditMode,
  useEditFormData,
  useAvatarUpload,
  useProfileFromCache,
  useProfileCacheLoading,
  useProfileCacheError
} from './store/profile.store';

// Utilities
export {
  ProfileDisplayUtils,
  ProfileValidationUtils,
  ProfileCompletionUtils,
  ProfileFilterUtils,
  ProfileSearchUtils,
  ProfileTransformUtils,
  ProfilePermissionUtils,
  ProfileUrlUtils
} from './utils/profile.utils';

// Import store for internal use
import { useProfileStore } from './store/profile.store';
import type { ProfileUpdate, ProfileFilters, ProfileSort } from './schema/profile.types';

/**
 * Main Profile API
 * 
 * Convenient wrapper around the profile service and store
 * for common operations
 */
export class ProfileAPI {
  /**
   * Initialize profile system for current user
   */
  static async initialize() {
    const store = useProfileStore.getState();
    await store.loadCurrentProfile();
  }

  /**
   * Get current user profile
   */
  static getCurrentProfile() {
    return useProfileStore.getState().currentProfile;
  }

  /**
   * Update current user profile
   */
  static async updateProfile(updates: ProfileUpdate) {
    const store = useProfileStore.getState();
    return await store.updateCurrentProfile(updates);
  }

  /**
   * Search profiles
   */
  static async searchProfiles(
    filters?: ProfileFilters,
    sort?: ProfileSort,
    page?: number,
    perPage?: number
  ) {
    // console.log('🟠 ProfileAPI.searchProfiles - Called with:', { filters, sort, page, perPage });
    
    // Call the ProfileService directly instead of using the store
    // This ensures we get fresh results and avoid timing issues
    const { ProfileService } = await import('./service/profile.service');
    
    try {
      const result = await ProfileService.searchProfiles(filters, sort, page, perPage);
      
      // console.log('🟠 ProfileAPI.searchProfiles - Service result:', {
      //   success: result.success,
      //   profileCount: result.data?.profiles?.length || 0,
      //   error: result.error,
      // });
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('🔴 ProfileAPI.searchProfiles - Service returned error:', result.error);
        throw new Error(result.error || 'Failed to search profiles');
      }
    } catch (error) {
      console.error('🔴 ProfileAPI.searchProfiles - Exception caught:', error);
      throw error;
    }
  }

  /**
   * Get profile by username
   */
  static async getProfileByUsername(username: string) {
    const store = useProfileStore.getState();
    return await store.loadProfileByUsername(username);
  }

  /**
   * Upload avatar
   */
  static async uploadAvatar(file: File) {
    const store = useProfileStore.getState();
    return await store.uploadAvatar(file);
  }

  /**
   * Check username availability
   */
  static async checkUsernameAvailability(username: string) {
    const store = useProfileStore.getState();
    return await store.checkUsernameAvailability(username);
  }

  /**
   * Update online status
   */
  static async setOnlineStatus(isOnline: boolean) {
    const store = useProfileStore.getState();
    await store.updateOnlineStatus(isOnline);
  }

  /**
   * Get profile statistics
   */
  static async getStats() {
    const store = useProfileStore.getState();
    await store.loadStats();
    return store.stats;
  }

  /**
   * Clear all profile data (logout)
   */
  static clearAll() {
    const store = useProfileStore.getState();
    store.clearCurrentProfile();
    store.clearProfileCache();
    store.clearSearch();
  }
}

/**
 * Profile Constants
 * 
 * Commonly used constants for profile operations
 */
export const PROFILE_CONSTANTS = {
  // Validation limits
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  BIO_MAX_LENGTH: 500,
  FULL_NAME_MAX_LENGTH: 100,
  
  // File upload limits
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  AVATAR_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Search limits
  SEARCH_MIN_QUERY_LENGTH: 2,
  SEARCH_MAX_RESULTS: 1000,
  
  // Cache settings
  PROFILE_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  SEARCH_CACHE_TTL: 2 * 60 * 1000, // 2 minutes
  
  // Role permissions
  ROLES_CAN_VIEW_PRIVATE: ['SA', 'A'],
  ROLES_CAN_EDIT_OTHERS: ['SA', 'A'],
  ROLES_CAN_VIEW_ALL: ['SA', 'A', 'C'],
  
  // Completion thresholds
  COMPLETION_EXCELLENT: 90,
  COMPLETION_GOOD: 70,
  COMPLETION_FAIR: 50,
  
  // Reputation levels
  REPUTATION_NOVICE: 0,
  REPUTATION_INTERMEDIATE: 100,
  REPUTATION_ADVANCED: 500,
  REPUTATION_EXPERT: 1000,
} as const;

/**
 * Profile Error Codes
 * 
 * Standardized error codes for profile operations
 */
export const PROFILE_ERROR_CODES = {
  // Authentication errors
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  INVALID_USERNAME: 'INVALID_USERNAME',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_URL: 'INVALID_URL',
  
  // Upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Database errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * Profile Event Types
 * 
 * Event types for profile-related notifications and webhooks
 */
export const PROFILE_EVENTS = {
  PROFILE_CREATED: 'profile.created',
  PROFILE_UPDATED: 'profile.updated',
  PROFILE_DELETED: 'profile.deleted',
  AVATAR_UPDATED: 'profile.avatar.updated',
  ROLE_CHANGED: 'profile.role.changed',
  VERIFICATION_STATUS_CHANGED: 'profile.verification.changed',
  ONBOARDING_COMPLETED: 'profile.onboarding.completed',
  COMPLETION_MILESTONE: 'profile.completion.milestone',
} as const;