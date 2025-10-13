/**
 * Profile Store
 * 
 * Zustand store for managing profile state across the application
 * Handles caching, optimistic updates, and real-time synchronization
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Map and Set support for Immer when using immer middleware in Zustand
enableMapSet();
import { ProfileService } from '../service/profile.service';
import type {
  Profile,
  PublicProfile,
  ProfileUpdate,
  ProfileFilters,
  ProfileSort,
  ProfileSearchResult,
  ProfileStats,
  OnboardingLevel,
  ProfilePermissions
} from '../schema/profile.types';

// Store state interface
interface ProfileState {
  // Current user profile
  currentProfile: Profile | null;
  currentProfileLoading: boolean;
  currentProfileError: string | null;

  // Profile cache for other users
  profileCache: Map<string, PublicProfile>;
  profileCacheLoading: Set<string>;
  profileCacheErrors: Map<string, string>;

  // Search and filtering
  searchResults: ProfileSearchResult | null;
  searchLoading: boolean;
  searchError: string | null;
  currentFilters: ProfileFilters;
  currentSort: ProfileSort;

  // Profile statistics
  stats: ProfileStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Permissions cache
  permissionsCache: Map<string, ProfilePermissions>;

  // UI state
  isEditMode: boolean;
  editFormData: ProfileUpdate | null;
  uploadingAvatar: boolean;
  avatarUploadProgress: number;
}

// Store actions interface
interface ProfileActions {
  // Current user profile actions
  loadCurrentProfile: () => Promise<void>;
  updateCurrentProfile: (updates: ProfileUpdate) => Promise<boolean>;
  updateCurrentProfileOptimistic: (updates: ProfileUpdate) => void;
  revertCurrentProfileOptimistic: () => void;
  clearCurrentProfile: () => void;

  // Profile cache actions
  loadProfile: (userId: string) => Promise<PublicProfile | null>;
  loadProfileByUsername: (username: string) => Promise<PublicProfile | null>;
  cacheProfile: (profile: PublicProfile) => void;
  clearProfileCache: () => void;
  removeFromCache: (userId: string) => void;

  // Search and filtering actions
  searchProfiles: (
    filters?: ProfileFilters,
    sort?: ProfileSort,
    page?: number,
    perPage?: number
  ) => Promise<void>;
  updateFilters: (filters: Partial<ProfileFilters>) => void;
  updateSort: (sort: ProfileSort) => void;
  clearSearch: () => void;

  // Statistics actions
  loadStats: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Permissions actions
  loadPermissions: (targetUserId: string) => Promise<ProfilePermissions | null>;
  cachePermissions: (userId: string, permissions: ProfilePermissions) => void;

  // Avatar upload actions
  uploadAvatar: (file: File) => Promise<boolean>;
  setAvatarUploadProgress: (progress: number) => void;

  // Onboarding actions
  updateOnboardingLevel: (level: OnboardingLevel) => Promise<boolean>;
  
  // Online status actions
  updateOnlineStatus: (isOnline: boolean) => Promise<void>;

  // Username availability
  checkUsernameAvailability: (username: string) => Promise<boolean>;

  // UI state actions
  setEditMode: (enabled: boolean) => void;
  setEditFormData: (data: ProfileUpdate | null) => void;
  resetEditForm: () => void;

  // Utility actions
  recalculateCompletion: (userId?: string) => Promise<number>;
  deactivateProfile: () => Promise<boolean>;
}

type ProfileStore = ProfileState & ProfileActions;

// Initial state
const initialState: ProfileState = {
  currentProfile: null,
  currentProfileLoading: false,
  currentProfileError: null,

  profileCache: new Map(),
  profileCacheLoading: new Set(),
  profileCacheErrors: new Map(),

  searchResults: null,
  searchLoading: false,
  searchError: null,
  currentFilters: {},
  currentSort: { field: 'created_at', direction: 'desc' },

  stats: null,
  statsLoading: false,
  statsError: null,

  permissionsCache: new Map(),

  isEditMode: false,
  editFormData: null,
  uploadingAvatar: false,
  avatarUploadProgress: 0,
};

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Current user profile actions
        loadCurrentProfile: async () => {
          set((state) => {
            state.currentProfileLoading = true;
            state.currentProfileError = null;
          });

          const result = await ProfileService.getCurrentProfile();

          set((state) => {
            state.currentProfileLoading = false;
            if (result.success && result.data) {
              state.currentProfile = result.data;
              state.currentProfileError = null;
            } else {
              state.currentProfileError = result.error || 'Failed to load profile';
            }
          });
        },

        updateCurrentProfile: async (updates: ProfileUpdate) => {
          console.log('Store updateCurrentProfile called with:', updates);
          const currentProfile = get().currentProfile;
          if (!currentProfile) {
            console.error('No current profile found');
            return false;
          }

          // Optimistic update
          get().updateCurrentProfileOptimistic(updates);

          console.log('Calling ProfileService.updateProfile with:', updates);
          const result = await ProfileService.updateProfile(updates);
          console.log('ProfileService.updateProfile result:', result);

          if (result.success && result.data) {
            set((state) => {
              state.currentProfile = result.data!;
              state.editFormData = null;
            });
            console.log('Profile updated successfully in store');
            return true;
          } else {
            // Revert optimistic update on failure
            console.error('Profile update failed:', result.error);
            get().revertCurrentProfileOptimistic();
            set((state) => {
              state.currentProfileError = result.error || 'Failed to update profile';
            });
            return false;
          }
        },

        updateCurrentProfileOptimistic: (updates: ProfileUpdate) => {
          set((state) => {
            if (state.currentProfile) {
              // Store original for potential revert
              if (!state.editFormData) {
                state.editFormData = { ...updates };
              }
              
              // Apply optimistic updates
              Object.assign(state.currentProfile, updates);
            }
          });
        },

        revertCurrentProfileOptimistic: () => {
          // This would require storing the original state
          // For now, just reload the profile
          get().loadCurrentProfile();
        },

        clearCurrentProfile: () => {
          set((state) => {
            state.currentProfile = null;
            state.currentProfileError = null;
            state.currentProfileLoading = false;
            state.editFormData = null;
            state.isEditMode = false;
          });
        },

        // Profile cache actions
        loadProfile: async (userId: string) => {
          const cache = get().profileCache;
          if (cache.has(userId)) {
            return cache.get(userId)!;
          }

          const loading = get().profileCacheLoading;
          if (loading.has(userId)) {
            // Already loading, wait for it
            return null;
          }

          set((state) => {
            state.profileCacheLoading.add(userId);
            state.profileCacheErrors.delete(userId);
          });

          const result = await ProfileService.getPublicProfile(userId);

          set((state) => {
            state.profileCacheLoading.delete(userId);
            if (result.success && result.data) {
              state.profileCache.set(userId, result.data);
            } else {
              state.profileCacheErrors.set(userId, result.error || 'Failed to load profile');
            }
          });

          return result.success && result.data ? result.data : null;
        },

        loadProfileByUsername: async (username: string) => {
          const result = await ProfileService.getProfileByUsername(username);
          
          if (result.success && result.data) {
            // Cache the result
            get().cacheProfile(result.data);
            return result.data;
          }
          
          return null;
        },

        cacheProfile: (profile: PublicProfile) => {
          set((state) => {
            state.profileCache.set(profile.id, profile);
            state.profileCacheErrors.delete(profile.id);
          });
        },

        clearProfileCache: () => {
          set((state) => {
            state.profileCache.clear();
            state.profileCacheLoading.clear();
            state.profileCacheErrors.clear();
          });
        },

        removeFromCache: (userId: string) => {
          set((state) => {
            state.profileCache.delete(userId);
            state.profileCacheErrors.delete(userId);
            state.profileCacheLoading.delete(userId);
          });
        },

        // Search and filtering actions
        searchProfiles: async (
          filters: ProfileFilters = {},
          sort: ProfileSort = { field: 'created_at', direction: 'desc' },
          page: number = 1,
          perPage: number = 20
        ) => {
          set((state) => {
            state.searchLoading = true;
            state.searchError = null;
            state.currentFilters = filters;
            state.currentSort = sort;
          });

          const result = await ProfileService.searchProfiles(filters, sort, page, perPage);

          set((state) => {
            state.searchLoading = false;
            if (result.success && result.data) {
              state.searchResults = result.data;
              // Cache the profiles
              result.data.profiles.forEach(profile => {
                state.profileCache.set(profile.id, profile);
              });
            } else {
              state.searchError = result.error || 'Failed to search profiles';
            }
          });
        },

        updateFilters: (filters: Partial<ProfileFilters>) => {
          set((state) => {
            state.currentFilters = { ...state.currentFilters, ...filters };
          });
        },

        updateSort: (sort: ProfileSort) => {
          set((state) => {
            state.currentSort = sort;
          });
        },

        clearSearch: () => {
          set((state) => {
            state.searchResults = null;
            state.searchError = null;
            state.currentFilters = {};
            state.currentSort = { field: 'created_at', direction: 'desc' };
          });
        },

        // Statistics actions
        loadStats: async () => {
          set((state) => {
            state.statsLoading = true;
            state.statsError = null;
          });

          const result = await ProfileService.getProfileStats();

          set((state) => {
            state.statsLoading = false;
            if (result.success && result.data) {
              state.stats = result.data;
            } else {
              state.statsError = result.error || 'Failed to load statistics';
            }
          });
        },

        refreshStats: async () => {
          await get().loadStats();
        },

        // Permissions actions
        loadPermissions: async (targetUserId: string) => {
          const cache = get().permissionsCache;
          if (cache.has(targetUserId)) {
            return cache.get(targetUserId)!;
          }

          const result = await ProfileService.getProfilePermissions(targetUserId);
          
          if (result.success && result.data) {
            get().cachePermissions(targetUserId, result.data);
            return result.data;
          }
          
          return null;
        },

        cachePermissions: (userId: string, permissions: ProfilePermissions) => {
          set((state) => {
            state.permissionsCache.set(userId, permissions);
          });
        },

        // Avatar upload actions
        uploadAvatar: async (file: File) => {
          set((state) => {
            state.uploadingAvatar = true;
            state.avatarUploadProgress = 0;
          });

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            set((state) => {
              state.avatarUploadProgress = Math.min(state.avatarUploadProgress + 10, 90);
            });
          }, 100);

          const result = await ProfileService.updateAvatar(file);

          clearInterval(progressInterval);

          set((state) => {
            state.uploadingAvatar = false;
            state.avatarUploadProgress = result.success ? 100 : 0;
          });

          if (result.success) {
            // Refresh current profile to get new avatar
            await get().loadCurrentProfile();
            return true;
          }

          return false;
        },

        setAvatarUploadProgress: (progress: number) => {
          set((state) => {
            state.avatarUploadProgress = progress;
          });
        },

        // Onboarding actions
        updateOnboardingLevel: async (level: OnboardingLevel) => {
          const result = await ProfileService.updateOnboardingLevel(level);
          
          if (result.success && result.data) {
            set((state) => {
              state.currentProfile = result.data!;
            });
            return true;
          }
          
          return false;
        },

        // Online status actions
        updateOnlineStatus: async (isOnline: boolean) => {
          // Optimistic update
          set((state) => {
            if (state.currentProfile) {
              state.currentProfile.is_online = isOnline;
            }
          });

          const result = await ProfileService.updateOnlineStatus(isOnline);
          
          if (!result.success) {
            // Revert on failure
            set((state) => {
              if (state.currentProfile) {
                state.currentProfile.is_online = !isOnline;
              }
            });
          }
        },

        // Username availability
        checkUsernameAvailability: async (username: string) => {
          const result = await ProfileService.isUsernameAvailable(username);
          return result.success ? result.data || false : false;
        },

        // UI state actions
        setEditMode: (enabled: boolean) => {
          set((state) => {
            state.isEditMode = enabled;
            if (!enabled) {
              state.editFormData = null;
            }
          });
        },

        setEditFormData: (data: ProfileUpdate | null) => {
          set((state) => {
            state.editFormData = data;
          });
        },

        resetEditForm: () => {
          set((state) => {
            state.editFormData = null;
            state.isEditMode = false;
          });
        },

        // Utility actions
        recalculateCompletion: async (userId?: string) => {
          const result = await ProfileService.recalculateProfileCompletion(userId);
          
          if (result.success) {
            // Refresh current profile if it was updated
            if (!userId || userId === get().currentProfile?.id) {
              await get().loadCurrentProfile();
            }
            return result.data || 0;
          }
          
          return 0;
        },

        deactivateProfile: async () => {
          const result = await ProfileService.deactivateProfile();
          
          if (result.success) {
            get().clearCurrentProfile();
            return true;
          }
          
          return false;
        },
      })),
      {
        name: 'profile-store',
        partialize: (state) => ({
          // Only persist UI preferences and some cache
          currentFilters: state.currentFilters,
          currentSort: state.currentSort,
        }),
      }
    ),
    {
      name: 'profile-store',
    }
  )
);

// Selector hooks for better performance
export const useCurrentProfile = () => useProfileStore(state => state.currentProfile);
export const useCurrentProfileLoading = () => useProfileStore(state => state.currentProfileLoading);
export const useCurrentProfileError = () => useProfileStore(state => state.currentProfileError);

export const useSearchResults = () => useProfileStore(state => state.searchResults);
export const useSearchLoading = () => useProfileStore(state => state.searchLoading);
export const useSearchError = () => useProfileStore(state => state.searchError);

export const useProfileStats = () => useProfileStore(state => state.stats);
export const useProfileStatsLoading = () => useProfileStore(state => state.statsLoading);

export const useEditMode = () => useProfileStore(state => state.isEditMode);
export const useEditFormData = () => useProfileStore(state => state.editFormData);

export const useAvatarUpload = () => useProfileStore(state => ({
  uploading: state.uploadingAvatar,
  progress: state.avatarUploadProgress,
}));

// Profile cache selectors
export const useProfileFromCache = (userId: string) => {
  return useProfileStore(state => state.profileCache.get(userId));
};

export const useProfileCacheLoading = (userId: string) => {
  return useProfileStore(state => state.profileCacheLoading.has(userId));
};

export const useProfileCacheError = (userId: string) => {
  return useProfileStore(state => state.profileCacheErrors.get(userId));
};