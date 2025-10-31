/**
 * Profile Store
 * 
 * Optimized Zustand store for managing profile state across the application
 * Handles caching, optimistic updates, and real-time synchronization with performance optimizations
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

// Request debouncing utility
const debounceMap = new Map();

const debouncedFetch = <T>(key: string, fn: () => Promise<T>, delay: number = 100): Promise<T> => {
  return new Promise((resolve, reject) => {
    // Clear existing timeout for this key
    if (debounceMap.has(key)) {
      clearTimeout(debounceMap.get(key));
    }

    const timeoutId = setTimeout(async () => {
      debounceMap.delete(key);
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);

    debounceMap.set(key, timeoutId);
  });
};

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PROFILE_CACHE_TTL = 30 * 1000; // 30 seconds for current profile

// Enhanced interfaces with cache metadata
interface CachedProfile extends Profile {
  _lastUpdated?: number;
  _cached?: boolean;
}

interface CachedPublicProfile extends PublicProfile {
  _lastUpdated?: number;
  _cached?: boolean;
}

// Store state interface
interface ProfileState {
  // Current user profile
  currentProfile: CachedProfile | null;
  currentProfileLoading: boolean;
  currentProfileError: string | null;
  lastProfileLoad: number;

  // Profile cache for other users
  profileCache: Map<string, CachedPublicProfile>;
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
  lastStatsLoad: number;

  // Permissions cache
  permissionsCache: Map<string, ProfilePermissions>;

  // UI state
  isEditMode: boolean;
  editFormData: ProfileUpdate | null;
  uploadingAvatar: boolean;
  avatarUploadProgress: number;

  // Optimistic update backup
  optimisticBackup: Profile | null;
}

// Store actions interface
interface ProfileActions {
  // Current user profile actions
  hydrateCurrentProfile: (profile: Profile) => void;
  loadCurrentProfile: (force?: boolean) => Promise<void>;
  updateCurrentProfile: (updates: ProfileUpdate) => Promise<boolean>;
  updateCurrentProfileOptimistic: (updates: ProfileUpdate) => void;
  revertCurrentProfileOptimistic: () => void;
  clearCurrentProfile: () => void;

  // Profile cache actions
  loadProfile: (userId: string, force?: boolean) => Promise<PublicProfile | null>;
  loadProfileByUsername: (username: string) => Promise<PublicProfile | null>;
  cacheProfile: (profile: PublicProfile) => void;
  clearProfileCache: () => void;
  removeFromCache: (userId: string) => void;
  preloadProfiles: (userIds: string[]) => void;

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
  loadStats: (force?: boolean) => Promise<void>;
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

  // Performance utilities
  isProfileStale: () => boolean;
  preloadEssentialData: () => Promise<void>;
}

type ProfileStore = ProfileState & ProfileActions;

// Initial state
const initialState: ProfileState = {
  currentProfile: null,
  currentProfileLoading: false,
  currentProfileError: null,
  lastProfileLoad: 0,

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
  lastStatsLoad: 0,

  permissionsCache: new Map(),

  isEditMode: false,
  editFormData: null,
  uploadingAvatar: false,
  avatarUploadProgress: 0,

  optimisticBackup: null,
};

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Performance checkers
        isProfileStale: () => {
          const state = get();
          return !state.currentProfile ||
            Date.now() - state.lastProfileLoad > PROFILE_CACHE_TTL;
        },

        // Current user profile actions
        loadCurrentProfile: async (force: boolean = false) => {
          const state = get();

          // ✅ Enhanced cache validation with TTL
          if (!force && state.currentProfile && !state.currentProfileLoading) {
            const isStale = Date.now() - state.lastProfileLoad > PROFILE_CACHE_TTL;
            if (!isStale) {
              return; // Use cached data
            }
          }

          // ✅ Prevent concurrent requests
          if (state.currentProfileLoading) {
            return;
          }

          set((state) => {
            state.currentProfileLoading = true;
            state.currentProfileError = null;
          });

          try {
            // ✅ Use debouncing for API calls
            const result = await debouncedFetch(
              'currentProfile',
              () => ProfileService.getCurrentProfile(),
              50 // Minimal debounce for user-initiated actions
            );

            set((state) => {
              state.currentProfileLoading = false;
              state.lastProfileLoad = Date.now();

              if (result.success && result.data) {
                state.currentProfile = {
                  ...result.data,
                  _lastUpdated: Date.now(),
                  _cached: false
                };
                state.currentProfileError = null;
              } else {
                state.currentProfileError = result.error || 'Failed to load profile';
              }
            });
          } catch (error) {
            set((state) => {
              state.currentProfileLoading = false;
              state.currentProfileError = 'Network error loading profile';
            });
          }
        },

        hydrateCurrentProfile: (profile: Profile) => {
          set((state) => {
            if (!state.currentProfile) {
              state.currentProfile = {
                ...profile,
                _lastUpdated: Date.now(),
                _cached: true
              };
              state.lastProfileLoad = Date.now();
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

          // Store backup for optimistic update
          set((state) => {
            state.optimisticBackup = { ...state.currentProfile! };
          });

          // Optimistic update
          get().updateCurrentProfileOptimistic(updates);

          console.log('Calling ProfileService.updateProfile with:', updates);
          const result = await ProfileService.updateProfile(updates);
          console.log('ProfileService.updateProfile result:', result);

          if (result.success && result.data) {
            set((state) => {
              state.currentProfile = {
                ...result.data!,
                _lastUpdated: Date.now(),
                _cached: false
              };
              state.editFormData = null;
              state.optimisticBackup = null;
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
              // Apply optimistic updates
              Object.assign(state.currentProfile, updates);
              state.currentProfile._lastUpdated = Date.now();
            }
          });
        },

        revertCurrentProfileOptimistic: () => {
          set((state) => {
            if (state.optimisticBackup) {
              state.currentProfile = {
                ...state.optimisticBackup,
                _lastUpdated: Date.now()
              };
              state.optimisticBackup = null;
            }
          });
        },

        clearCurrentProfile: () => {
          set((state) => {
            state.currentProfile = null;
            state.currentProfileError = null;
            state.currentProfileLoading = false;
            state.editFormData = null;
            state.isEditMode = false;
            state.lastProfileLoad = 0;
            state.optimisticBackup = null;
          });
        },

        // Profile cache actions
        loadProfile: async (userId: string, force: boolean = false) => {
          const state = get();
          const cache = state.profileCache;

          // ✅ Check cache with TTL
          if (!force && cache.has(userId)) {
            const cachedProfile = cache.get(userId)!;
            if (Date.now() - (cachedProfile._lastUpdated || 0) < CACHE_TTL) {
              return cachedProfile;
            }
          }

          const loading = state.profileCacheLoading;
          if (loading.has(userId)) {
            // Already loading, wait for it
            return null;
          }

          set((state) => {
            state.profileCacheLoading.add(userId);
            state.profileCacheErrors.delete(userId);
          });

          try {
            const result = await debouncedFetch(
              `profile-${userId}`,
              () => ProfileService.getPublicProfile(userId),
              100
            );

            set((state) => {
              state.profileCacheLoading.delete(userId);
              if (result.success && result.data) {
                const cachedProfile: CachedPublicProfile = {
                  ...result.data,
                  _lastUpdated: Date.now(),
                  _cached: true
                };
                state.profileCache.set(userId, cachedProfile);
              } else {
                state.profileCacheErrors.set(userId, result.error || 'Failed to load profile');
              }
            });

            return result.success && result.data ? result.data : null;
          } catch (error) {
            set((state) => {
              state.profileCacheLoading.delete(userId);
              state.profileCacheErrors.set(userId, 'Network error loading profile');
            });
            return null;
          }
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
            const cachedProfile: CachedPublicProfile = {
              ...profile,
              _lastUpdated: Date.now(),
              _cached: true
            };
            state.profileCache.set(profile.id, cachedProfile);
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

        preloadProfiles: (userIds: string[]) => {
          // Preload multiple profiles in background
          userIds.forEach(userId => {
            if (!get().profileCache.has(userId) && !get().profileCacheLoading.has(userId)) {
              get().loadProfile(userId);
            }
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

          try {
            const result = await ProfileService.searchProfiles(filters, sort, page, perPage);

            set((state) => {
              state.searchLoading = false;
              if (result.success && result.data) {
                state.searchResults = result.data;
                // Cache the profiles with timestamps
                result.data.profiles.forEach(profile => {
                  const cachedProfile: CachedPublicProfile = {
                    ...profile,
                    _lastUpdated: Date.now(),
                    _cached: true
                  };
                  state.profileCache.set(profile.id, cachedProfile);
                });
              } else {
                state.searchError = result.error || 'Failed to search profiles';
              }
            });
          } catch (error) {
            set((state) => {
              state.searchLoading = false;
              state.searchError = 'Network error searching profiles';
            });
          }
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
        loadStats: async (force: boolean = false) => {
          const state = get();

          // ✅ Cache stats with TTL
          if (!force && state.stats && Date.now() - state.lastStatsLoad < CACHE_TTL) {
            return;
          }

          set((state) => {
            state.statsLoading = true;
            state.statsError = null;
          });

          try {
            const result = await ProfileService.getProfileStats();

            set((state) => {
              state.statsLoading = false;
              if (result.success && result.data) {
                state.stats = result.data;
                state.lastStatsLoad = Date.now();
              } else {
                state.statsError = result.error || 'Failed to load statistics';
              }
            });
          } catch (error) {
            set((state) => {
              state.statsLoading = false;
              state.statsError = 'Network error loading statistics';
            });
          }
        },

        refreshStats: async () => {
          await get().loadStats(true); // Force refresh
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

          try {
            const result = await ProfileService.updateAvatar(file);

            clearInterval(progressInterval);

            set((state) => {
              state.uploadingAvatar = false;
              state.avatarUploadProgress = result.success ? 100 : 0;
            });

            if (result.success) {
              // Refresh current profile to get new avatar with cache busting
              await get().loadCurrentProfile(true);
              return true;
            }

            return false;
          } catch (error) {
            clearInterval(progressInterval);
            set((state) => {
              state.uploadingAvatar = false;
              state.avatarUploadProgress = 0;
            });
            return false;
          }
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
              state.currentProfile = {
                ...result.data!,
                _lastUpdated: Date.now(),
                _cached: false
              };
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
              state.currentProfile._lastUpdated = Date.now();
            }
          });

          const result = await ProfileService.updateOnlineStatus(isOnline);

          if (!result.success) {
            // Revert on failure
            set((state) => {
              if (state.currentProfile) {
                state.currentProfile.is_online = !isOnline;
                state.currentProfile._lastUpdated = Date.now();
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
              await get().loadCurrentProfile(true); // Force refresh
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

        // Performance utilities
        preloadEssentialData: async () => {
          // Preload essential data in parallel
          await Promise.allSettled([
            get().loadCurrentProfile(),
            get().loadStats()
          ]);
        },

      })),
      {
        name: 'profile-store',
        partialize: (state) => ({
          // Only persist minimal data to reduce storage overhead
          currentFilters: state.currentFilters,
          currentSort: state.currentSort,
          // Don't persist large cache objects or profile data
        }),
        version: 2, // Increment version when store structure changes
      }
    ),
    {
      name: 'profile-store',
      trace: process.env.NODE_ENV === 'development', // Only trace in dev
    }
  )
);

// Enhanced selector hooks with memoization
export const useCurrentProfile = () => useProfileStore(state => state.currentProfile);
export const useCurrentProfileLoading = () => useProfileStore(state => state.currentProfileLoading);
export const useCurrentProfileError = () => useProfileStore(state => state.currentProfileError);
export const useProfileStale = () => useProfileStore(state => state.isProfileStale());

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

// Enhanced profile cache selectors with stale checking
export const useProfileFromCache = (userId: string) => {
  return useProfileStore(state => {
    const profile = state.profileCache.get(userId);
    if (profile && Date.now() - (profile._lastUpdated || 0) > CACHE_TTL) {
      return null; // Consider stale
    }
    return profile;
  });
};

export const useProfileCacheLoading = (userId: string) => {
  return useProfileStore(state => state.profileCacheLoading.has(userId));
};

export const useProfileCacheError = (userId: string) => {
  return useProfileStore(state => state.profileCacheErrors.get(userId));
};

// Optimized hook for settings page
export const useProfileData = () => {
  const profile = useCurrentProfile();
  const loading = useCurrentProfileLoading();
  const isStale = useProfileStale();

  return {
    profile,
    loading: loading || !profile,
    isStale,
    hasCoachingAccess: profile?.role === 'C' || profile?.role === 'SA' || profile?.role === 'A'
  };
};