/**
 * Coaching Store
 * 
 * Zustand store for managing coaching state across the application
 * Handles caching, optimistic updates, and real-time synchronization
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Map and Set support for Immer
enableMapSet();

import { CoachingService } from '../service/coaching.service';
import type {
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
  CoachingCenterSearchItem,
  CoachingBranchSearchResult,
  CoachingCenterStats,
  CoachingCenterWithBranches,
  CoachingCenterDashboard,
  CoachingCenterPermissions,
  CoachingBranchPermissions,
  CoachingCategory,
  CoachingCenterSortBy
} from '../schema/coaching.types';

// Store state interface
interface CoachingState {
  // My coaching centers (owned or managed)
  myCoachingCenters: CoachingCenter[];
  myCoachingCentersLoading: boolean;
  myCoachingCentersError: string | null;

  // Current coaching center (for detail view/editing)
  currentCoachingCenter: CoachingCenter | null;
  currentCoachingCenterLoading: boolean;
  currentCoachingCenterError: string | null;

  // Current coaching center dashboard
  currentDashboard: CoachingCenterDashboard | null;
  currentDashboardLoading: boolean;
  currentDashboardError: string | null;

  // Coaching center cache for public centers
  coachingCenterCache: Map<string, PublicCoachingCenter>;
  coachingCenterCacheLoading: Set<string>;
  coachingCenterCacheErrors: Map<string, string>;

  // Coaching branch cache
  coachingBranchCache: Map<string, CoachingBranch>;
  coachingBranchCacheLoading: Set<string>;
  coachingBranchCacheErrors: Map<string, string>;

  // Branches by center cache
  branchesByCenter: Map<string, CoachingBranch[]>;
  branchesByCenterLoading: Set<string>;
  branchesByCenterErrors: Map<string, string>;

  // Search and filtering for centers
  centerSearchResults: CoachingCenterSearchResult | null;
  centerSearchLoading: boolean;
  centerSearchError: string | null;
  currentCenterFilters: CoachingCenterFilters;
  currentCenterSortBy: CoachingCenterSortBy;

  // ADD: Search result cache
  centerSearchCache: Map<string, {
    result: CoachingCenterSearchResult;
    timestamp: number;
    expiresAt: number;
  }>;

  // Search and filtering for branches
  branchSearchResults: CoachingBranchSearchResult | null;
  branchSearchLoading: boolean;
  branchSearchError: string | null;
  currentBranchFilters: CoachingBranchFilters;
  currentBranchSort: CoachingBranchSort;

  // Statistics
  stats: CoachingCenterStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Permissions cache
  centerPermissionsCache: Map<string, CoachingCenterPermissions>;
  branchPermissionsCache: Map<string, CoachingBranchPermissions>;

  // UI state
  isCreateMode: boolean;
  isEditMode: boolean;
  editFormData: CoachingCenterUpdate | null;
  branchEditFormData: CoachingBranchUpdate | null;
  uploadingLogo: boolean;
  logoUploadProgress: number;
  uploadingCover: boolean;
  coverUploadProgress: number;

  // Featured and categories
  featuredCenters: PublicCoachingCenter[];
  featuredCentersLoading: boolean;
  centersByCategory: Map<CoachingCategory, PublicCoachingCenter[]>;
  centersByCategoryLoading: Set<CoachingCategory>;
}

// Store actions interface
interface CoachingActions {
  // My coaching centers actions
  loadMyCoachingCenters: () => Promise<void>;
  clearMyCoachingCenters: () => void;

  // Current coaching center actions
  loadCoachingCenter: (centerId: string) => Promise<void>;
  loadCoachingCenterBySlug: (slug: string) => Promise<void>;
  setCurrentCoachingCenter: (center: CoachingCenter | null) => void;
  clearCurrentCoachingCenter: () => void;

  // Dashboard actions
  loadCoachingCenterDashboard: (centerId: string) => Promise<void>;
  clearCurrentDashboard: () => void;

  // CRUD operations for centers
  createCoachingCenter: (centerData: CoachingCenterCreate) => Promise<boolean>;
  updateCoachingCenter: (centerId: string, updates: CoachingCenterUpdate) => Promise<boolean>;
  updateCurrentCoachingCenterOptimistic: (updates: CoachingCenterUpdate) => void;
  revertCurrentCoachingCenterOptimistic: () => void;
  deleteCoachingCenter: (centerId: string) => Promise<boolean>;

  // Coaching center cache actions
  loadPublicCoachingCenter: (centerId: string) => Promise<PublicCoachingCenter | null>;
  cacheCoachingCenter: (center: PublicCoachingCenter) => void;
  clearCoachingCenterCache: () => void;
  removeFromCoachingCenterCache: (centerId: string) => void;

  // Branch actions
  loadCoachingBranch: (branchId: string) => Promise<CoachingBranch | null>;
  loadBranchesByCenter: (centerId: string, activeOnly?: boolean) => Promise<CoachingBranch[]>;
  createCoachingBranch: (branchData: CoachingBranchCreate) => Promise<CoachingBranch | null>;
  updateCoachingBranch: (branchId: string, updates: CoachingBranchUpdate) => Promise<boolean>;
  deleteCoachingBranch: (branchId: string) => Promise<boolean>;
  cacheBranchesByCenter: (centerId: string, branches: CoachingBranch[]) => void;
  clearBranchCache: () => void;

  // Search and filtering actions for centers
  searchCoachingCenters: (
    filters?: CoachingCenterFilters,
    sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'distance',
    page?: number,
    perPage?: number
  ) => Promise<void>;
  updateCenterFilters: (filters: Partial<CoachingCenterFilters>) => void;
  updateCenterSortBy: (sortBy: 'recent' | 'rating_high' | 'rating_low' | 'distance') => void;
  clearCenterSearch: () => void;

  // ADD: Cache management actions
  clearCenterSearchCache: () => void;
  invalidateCenterSearchCache: (centerId?: string) => void;

  // Search and filtering actions for branches
  searchCoachingBranches: (
    filters?: CoachingBranchFilters,
    sort?: CoachingBranchSort,
    page?: number,
    perPage?: number
  ) => Promise<void>;
  updateBranchFilters: (filters: Partial<CoachingBranchFilters>) => void;
  updateBranchSort: (sort: CoachingBranchSort) => void;
  clearBranchSearch: () => void;
  
  // ADD: Search branches by name
  searchBranchesByName: (searchQuery: string, limit?: number) => Promise<CoachingBranch[]>;

  // Statistics actions
  loadStats: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Permissions actions
  loadCenterPermissions: (centerId: string) => Promise<CoachingCenterPermissions | null>;
  loadBranchPermissions: (branchId: string) => Promise<CoachingBranchPermissions | null>;
  cacheCenterPermissions: (centerId: string, permissions: CoachingCenterPermissions) => void;
  cacheBranchPermissions: (branchId: string, permissions: CoachingBranchPermissions) => void;

  // Upload actions
  uploadLogo: (centerId: string, file: File) => Promise<boolean>;
  uploadCover: (centerId: string, file: File) => Promise<boolean>;
  setLogoUploadProgress: (progress: number) => void;
  setCoverUploadProgress: (progress: number) => void;

  // Featured and category actions
  loadFeaturedCenters: () => Promise<void>;
  loadCentersByCategory: (category: CoachingCategory) => Promise<void>;

  // Utility actions
  checkSlugAvailability: (slug: string, excludeCenterId?: string) => Promise<boolean>;

  // UI state actions
  setCreateMode: (enabled: boolean) => void;
  setEditMode: (enabled: boolean) => void;
  setEditFormData: (data: CoachingCenterUpdate | null) => void;
  setBranchEditFormData: (data: CoachingBranchUpdate | null) => void;
  resetEditForms: () => void;
}

type CoachingStore = CoachingState & CoachingActions;

// Helper function to generate cache key
const generateSearchCacheKey = (
  filters: CoachingCenterFilters,
  sortBy: CoachingCenterSortBy,
  page: number,
  perPage: number
): string => {
  return JSON.stringify({ filters, sortBy, page, perPage });
};

// Initial state
const initialState: CoachingState = {
  myCoachingCenters: [],
  myCoachingCentersLoading: false,
  myCoachingCentersError: null,

  currentCoachingCenter: null,
  currentCoachingCenterLoading: false,
  currentCoachingCenterError: null,

  currentDashboard: null,
  currentDashboardLoading: false,
  currentDashboardError: null,

  coachingCenterCache: new Map(),
  coachingCenterCacheLoading: new Set(),
  coachingCenterCacheErrors: new Map(),

  coachingBranchCache: new Map(),
  coachingBranchCacheLoading: new Set(),
  coachingBranchCacheErrors: new Map(),

  branchesByCenter: new Map(),
  branchesByCenterLoading: new Set(),
  branchesByCenterErrors: new Map(),

  centerSearchResults: null,
  centerSearchLoading: false,
  centerSearchError: null,
  currentCenterFilters: {},
  currentCenterSortBy: 'recent',

  // ADD: Initialize search cache
  centerSearchCache: new Map(),

  branchSearchResults: null,
  branchSearchLoading: false,
  branchSearchError: null,
  currentBranchFilters: {},
  currentBranchSort: { field: 'created_at', direction: 'desc' },

  stats: null,
  statsLoading: false,
  statsError: null,

  centerPermissionsCache: new Map(),
  branchPermissionsCache: new Map(),

  isCreateMode: false,
  isEditMode: false,
  editFormData: null,
  branchEditFormData: null,
  uploadingLogo: false,
  logoUploadProgress: 0,
  uploadingCover: false,
  coverUploadProgress: 0,

  featuredCenters: [],
  featuredCentersLoading: false,
  centersByCategory: new Map(),
  centersByCategoryLoading: new Set(),
};

export const useCoachingStore = create<CoachingStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // My coaching centers actions
        loadMyCoachingCenters: async () => {
          console.log('[CoachingStore] Loading my coaching centers...');
          set((state) => {
            state.myCoachingCentersLoading = true;
            state.myCoachingCentersError = null;
          });

          const result = await CoachingService.getMyCoachingCenters();

          console.log('[CoachingStore] getMyCoachingCenters result:', {
            success: result.success,
            dataLength: result.data?.length,
            error: result.error
          });

          set((state) => {
            state.myCoachingCentersLoading = false;
            if (result.success && result.data) {
              state.myCoachingCenters = result.data;
              state.myCoachingCentersError = null;
              console.log('[CoachingStore] Successfully loaded coaching centers:', result.data.length);
            } else {
              state.myCoachingCentersError = result.error || 'Failed to load coaching centers';
              console.error('[CoachingStore] Failed to load coaching centers:', result.error);
            }
          });
        },

        clearMyCoachingCenters: () => {
          set((state) => {
            state.myCoachingCenters = [];
            state.myCoachingCentersError = null;
            state.myCoachingCentersLoading = false;
          });
        },

        // Current coaching center actions
        loadCoachingCenter: async (centerId: string) => {
          set((state) => {
            state.currentCoachingCenterLoading = true;
            state.currentCoachingCenterError = null;
          });

          const result = await CoachingService.getCoachingCenter(centerId);

          set((state) => {
            state.currentCoachingCenterLoading = false;
            if (result.success && result.data) {
              state.currentCoachingCenter = result.data;
              state.currentCoachingCenterError = null;
            } else {
              state.currentCoachingCenterError = result.error || 'Failed to load coaching center';
            }
          });
        },

        loadCoachingCenterBySlug: async (slug: string) => {
          set((state) => {
            state.currentCoachingCenterLoading = true;
            state.currentCoachingCenterError = null;
          });

          const result = await CoachingService.getCoachingCenterBySlug(slug);

          set((state) => {
            state.currentCoachingCenterLoading = false;
            if (result.success && result.data) {
              state.coachingCenterCache.set(result.data.id, result.data);
              state.coachingCenterCacheErrors.delete(result.data.id);
              state.currentCoachingCenter = result.data as unknown as CoachingCenter;
              state.currentCoachingCenterError = null;
            } else {
              state.currentCoachingCenterError = result.error || 'Coaching center not found';
              state.currentCoachingCenter = null;
            }
          });
        },

        setCurrentCoachingCenter: (center: CoachingCenter | null) => {
          set((state) => {
            state.currentCoachingCenter = center;
            state.currentCoachingCenterError = null;
          });
        },

        clearCurrentCoachingCenter: () => {
          set((state) => {
            state.currentCoachingCenter = null;
            state.currentCoachingCenterError = null;
            state.currentCoachingCenterLoading = false;
            state.editFormData = null;
            state.isEditMode = false;
          });
        },

        // Dashboard actions
        loadCoachingCenterDashboard: async (centerId: string) => {
          set((state) => {
            state.currentDashboardLoading = true;
            state.currentDashboardError = null;
          });

          const result = await CoachingService.getCoachingCenterDashboard(centerId);

          set((state) => {
            state.currentDashboardLoading = false;
            if (result.success && result.data) {
              state.currentDashboard = result.data;
              state.currentDashboardError = null;
            } else {
              state.currentDashboardError = result.error || 'Failed to load dashboard';
            }
          });
        },

        clearCurrentDashboard: () => {
          set((state) => {
            state.currentDashboard = null;
            state.currentDashboardError = null;
            state.currentDashboardLoading = false;
          });
        },

        // CRUD operations for centers
        createCoachingCenter: async (centerData: CoachingCenterCreate) => {
          const result = await CoachingService.createCoachingCenter(centerData);

          if (result.success && result.data) {
            set((state) => {
              state.myCoachingCenters.unshift(result.data!);
              state.currentCoachingCenter = result.data!;
            });
            
            // Invalidate search cache
            get().invalidateCenterSearchCache();
            
            return true;
          }

          return false;
        },

        updateCoachingCenter: async (centerId: string, updates: CoachingCenterUpdate) => {
          const currentCenter = get().currentCoachingCenter;
          if (currentCenter && currentCenter.id === centerId) {
            get().updateCurrentCoachingCenterOptimistic(updates);
          }

          const result = await CoachingService.updateCoachingCenter(centerId, updates);

          if (result.success && result.data) {
            set((state) => {
              const index = state.myCoachingCenters.findIndex(c => c.id === centerId);
              if (index !== -1) {
                state.myCoachingCenters[index] = result.data!;
              }

              if (state.currentCoachingCenter?.id === centerId) {
                state.currentCoachingCenter = result.data!;
              }

              state.editFormData = null;
            });
            
            // Invalidate cache for this center
            get().invalidateCenterSearchCache(centerId);
            
            return true;
          } else {
            if (currentCenter && currentCenter.id === centerId) {
              get().revertCurrentCoachingCenterOptimistic();
            }
            return false;
          }
        },

        updateCurrentCoachingCenterOptimistic: (updates: CoachingCenterUpdate) => {
          set((state) => {
            if (state.currentCoachingCenter) {
              if (!state.editFormData) {
                state.editFormData = { ...updates };
              }
              Object.assign(state.currentCoachingCenter, updates);
            }
          });
        },

        revertCurrentCoachingCenterOptimistic: () => {
          const centerId = get().currentCoachingCenter?.id;
          if (centerId) {
            get().loadCoachingCenter(centerId);
          }
        },

        deleteCoachingCenter: async (centerId: string) => {
          const result = await CoachingService.deleteCoachingCenter(centerId);

          if (result.success) {
            set((state) => {
              state.myCoachingCenters = state.myCoachingCenters.filter(c => c.id !== centerId);

              if (state.currentCoachingCenter?.id === centerId) {
                state.currentCoachingCenter = null;
                state.editFormData = null;
                state.isEditMode = false;
              }

              state.coachingCenterCache.delete(centerId);
              state.coachingCenterCacheErrors.delete(centerId);
              state.coachingCenterCacheLoading.delete(centerId);
            });
            
            // Invalidate cache
            get().invalidateCenterSearchCache(centerId);
            
            return true;
          }

          return false;
        },

        // Coaching center cache actions
        loadPublicCoachingCenter: async (centerId: string) => {
          const cache = get().coachingCenterCache;
          if (cache.has(centerId)) {
            return cache.get(centerId)!;
          }

          const loading = get().coachingCenterCacheLoading;
          if (loading.has(centerId)) {
            return null;
          }

          set((state) => {
            state.coachingCenterCacheLoading.add(centerId);
            state.coachingCenterCacheErrors.delete(centerId);
          });

          const result = await CoachingService.getPublicCoachingCenter(centerId);

          set((state) => {
            state.coachingCenterCacheLoading.delete(centerId);
            if (result.success && result.data) {
              state.coachingCenterCache.set(centerId, result.data);
            } else {
              state.coachingCenterCacheErrors.set(centerId, result.error || 'Failed to load center');
            }
          });

          return result.success && result.data ? result.data : null;
        },

        cacheCoachingCenter: (center: PublicCoachingCenter) => {
          set((state) => {
            state.coachingCenterCache.set(center.id, center);
            state.coachingCenterCacheErrors.delete(center.id);
          });
        },

        clearCoachingCenterCache: () => {
          set((state) => {
            state.coachingCenterCache.clear();
            state.coachingCenterCacheLoading.clear();
            state.coachingCenterCacheErrors.clear();
          });
        },

        removeFromCoachingCenterCache: (centerId: string) => {
          set((state) => {
            state.coachingCenterCache.delete(centerId);
            state.coachingCenterCacheErrors.delete(centerId);
            state.coachingCenterCacheLoading.delete(centerId);
          });
        },

        // Branch actions
        loadCoachingBranch: async (branchId: string) => {
          const cache = get().coachingBranchCache;
          if (cache.has(branchId)) {
            return cache.get(branchId)!;
          }

          const loading = get().coachingBranchCacheLoading;
          if (loading.has(branchId)) {
            return null;
          }

          set((state) => {
            state.coachingBranchCacheLoading.add(branchId);
            state.coachingBranchCacheErrors.delete(branchId);
          });

          const result = await CoachingService.getCoachingBranch(branchId);

          set((state) => {
            state.coachingBranchCacheLoading.delete(branchId);
            if (result.success && result.data) {
              state.coachingBranchCache.set(branchId, result.data);
            } else {
              state.coachingBranchCacheErrors.set(branchId, result.error || 'Failed to load branch');
            }
          });

          return result.success && result.data ? result.data : null;
        },

        loadBranchesByCenter: async (centerId: string, activeOnly: boolean = true) => {
          const cacheKey = `${centerId}-${activeOnly}`;
          const cache = get().branchesByCenter;

          if (cache.has(cacheKey)) {
            return cache.get(cacheKey)!;
          }

          const loading = get().branchesByCenterLoading;
          if (loading.has(centerId)) {
            return [];
          }

          set((state) => {
            state.branchesByCenterLoading.add(centerId);
            state.branchesByCenterErrors.delete(centerId);
          });

          const result = await CoachingService.getBranchesByCenter(centerId, activeOnly);

          set((state) => {
            state.branchesByCenterLoading.delete(centerId);
            if (result.success && result.data) {
              state.branchesByCenter.set(cacheKey, result.data);
            } else {
              state.branchesByCenterErrors.set(centerId, result.error || 'Failed to load branches');
            }
          });

          return result.success && result.data ? result.data : [];
        },

        createCoachingBranch: async (branchData: CoachingBranchCreate) => {
          const result = await CoachingService.createCoachingBranch(branchData);

          if (result.success && result.data) {
            const centerId = branchData.coaching_center_id;
            set((state) => {
              state.branchesByCenter.delete(`${centerId}-true`);
              state.branchesByCenter.delete(`${centerId}-false`);
              state.branchesByCenterErrors.delete(centerId);
            });

            if (get().currentDashboard?.center.id === centerId) {
              await get().loadCoachingCenterDashboard(centerId);
            }

            return result.data;
          }

          return null;
        },

        updateCoachingBranch: async (branchId: string, updates: CoachingBranchUpdate) => {
          const result = await CoachingService.updateCoachingBranch(branchId, updates);

          if (result.success && result.data) {
            set((state) => {
              state.coachingBranchCache.set(branchId, result.data!);

              const centerId = result.data!.coaching_center_id;
              state.branchesByCenter.delete(`${centerId}-true`);
              state.branchesByCenter.delete(`${centerId}-false`);
            });

            return true;
          }

          return false;
        },

        deleteCoachingBranch: async (branchId: string) => {
          const branch = get().coachingBranchCache.get(branchId);
          const result = await CoachingService.deleteCoachingBranch(branchId);

          if (result.success) {
            set((state) => {
              state.coachingBranchCache.delete(branchId);
              state.coachingBranchCacheErrors.delete(branchId);
              state.coachingBranchCacheLoading.delete(branchId);

              if (branch) {
                const centerId = branch.coaching_center_id;
                state.branchesByCenter.delete(`${centerId}-true`);
                state.branchesByCenter.delete(`${centerId}-false`);
              }
            });

            return true;
          }

          return false;
        },

        cacheBranchesByCenter: (centerId: string, branches: CoachingBranch[]) => {
          set((state) => {
            state.branchesByCenter.set(`${centerId}-true`, branches.filter(b => b.is_active));
            state.branchesByCenter.set(`${centerId}-false`, branches);
            state.branchesByCenterErrors.delete(centerId);
          });
        },

        clearBranchCache: () => {
          set((state) => {
            state.coachingBranchCache.clear();
            state.coachingBranchCacheLoading.clear();
            state.coachingBranchCacheErrors.clear();
            state.branchesByCenter.clear();
            state.branchesByCenterLoading.clear();
            state.branchesByCenterErrors.clear();
          });
        },

        // UPDATED: Search and filtering actions for centers with caching
        searchCoachingCenters: async (
          filters: CoachingCenterFilters = {},
          sortBy: CoachingCenterSortBy = 'recent',
          page: number = 1,
          perPage: number = 20
        ) => {
          const cacheKey = generateSearchCacheKey(filters, sortBy, page, perPage);
          const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
          
          // Check cache first
          const cached = get().centerSearchCache.get(cacheKey);
          const now = Date.now();
          
          if (cached && cached.expiresAt > now) {
            console.log('[CoachingStore] Using cached search results');
            set((state) => {
              state.centerSearchResults = cached.result;
              state.currentCenterFilters = filters;
              state.currentCenterSortBy = sortBy;
              state.centerSearchLoading = false;
              state.centerSearchError = null;
            });
            return;
          }
          
          // Cache miss or expired - fetch fresh data
          console.log('[CoachingStore] Cache miss or expired, fetching fresh results');
          set((state) => {
            state.centerSearchLoading = true;
            state.centerSearchError = null;
            state.currentCenterFilters = filters;
            state.currentCenterSortBy = sortBy;
          });

          const result = await CoachingService.searchCoachingCenters(filters, sortBy, page, perPage);

          set((state) => {
            state.centerSearchLoading = false;
            if (result.success && result.data) {
              state.centerSearchResults = result.data;
              
              // Store in cache with timestamp
              state.centerSearchCache.set(cacheKey, {
                result: result.data,
                timestamp: now,
                expiresAt: now + CACHE_DURATION
              });
              
              // Cache individual center items
              result.data.results.forEach((item: CoachingCenterSearchItem) => {
                state.coachingCenterCache.set(item.center_id, {
                  id: item.center_id,
                  slug: item.center_slug,
                  name: item.center_name,
                  category: item.center_category,
                  subjects: item.center_subjects || [],
                  logo_url: item.center_logo_url,
                  is_verified: item.center_is_verified,
                } as any);
              });
            } else {
              state.centerSearchError = result.error || 'Failed to search centers';
            }
          });
        },

        updateCenterFilters: (filters: Partial<CoachingCenterFilters>) => {
          set((state) => {
            state.currentCenterFilters = { ...state.currentCenterFilters, ...filters };
          });
        },

        updateCenterSortBy: (sortBy: CoachingCenterSortBy) => {
          set((state) => {
            state.currentCenterSortBy = sortBy;
          });
        },

        clearCenterSearch: () => {
          set((state) => {
            state.centerSearchResults = null;
            state.centerSearchError = null;
            state.currentCenterSortBy = 'recent';
          });
        },

        // NEW: Cache management actions
        clearCenterSearchCache: () => {
          console.log('[CoachingStore] Clearing all search cache');
          set((state) => {
            state.centerSearchCache.clear();
          });
        },

        invalidateCenterSearchCache: (centerId?: string) => {
          console.log('[CoachingStore] Invalidating search cache', centerId ? `for center: ${centerId}` : '(all)');
          set((state) => {
            if (centerId) {
              // Clear all cache entries when a center changes
              // In production, you could be more selective
              state.centerSearchCache.clear();
            } else {
              // Clear entire cache
              state.centerSearchCache.clear();
            }
          });
        },

        // Search and filtering actions for branches
        searchCoachingBranches: async (
          filters: CoachingBranchFilters = {},
          sort: CoachingBranchSort = { field: 'created_at', direction: 'desc' },
          page: number = 1,
          perPage: number = 20
        ) => {
          set((state) => {
            state.branchSearchLoading = true;
            state.branchSearchError = null;
            state.currentBranchFilters = filters;
            state.currentBranchSort = sort;
          });

          set((state) => {
            state.branchSearchLoading = false;
            state.branchSearchError = 'Branch search not implemented yet';
          });
        },

        updateBranchFilters: (filters: Partial<CoachingBranchFilters>) => {
          set((state) => {
            state.currentBranchFilters = { ...state.currentBranchFilters, ...filters };
          });
        },

        updateBranchSort: (sort: CoachingBranchSort) => {
          set((state) => {
            state.currentBranchSort = sort;
          });
        },

        clearBranchSearch: () => {
          set((state) => {
            state.branchSearchResults = null;
            state.branchSearchError = null;
            state.currentBranchFilters = {};
            state.currentBranchSort = { field: 'created_at', direction: 'desc' };
          });
        },

        // ADD: Search branches by name
        searchBranchesByName: async (searchQuery: string, limit: number = 10) => {
          console.log('[CoachingStore] Searching branches by name:', searchQuery);
          
          if (!searchQuery || searchQuery.trim().length === 0) {
            return [];
          }

          const result = await CoachingService.searchBranchesByName(searchQuery.trim(), limit);

          if (result.success && result.data) {
            console.log('[CoachingStore] Found branches:', result.data.length);
            return result.data;
          }

          console.error('[CoachingStore] Failed to search branches:', result.error);
          return [];
        },

        // Statistics actions
        loadStats: async () => {
          set((state) => {
            state.statsLoading = true;
            state.statsError = null;
          });

          const result = await CoachingService.getCoachingCenterStats();

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
        loadCenterPermissions: async (centerId: string) => {
          const cache = get().centerPermissionsCache;
          if (cache.has(centerId)) {
            return cache.get(centerId)!;
          }

          const result = await CoachingService.getCoachingCenterPermissions(centerId);

          if (result.success && result.data) {
            get().cacheCenterPermissions(centerId, result.data);
            return result.data;
          }

          return null;
        },

        loadBranchPermissions: async (branchId: string) => {
          const cache = get().branchPermissionsCache;
          if (cache.has(branchId)) {
            return cache.get(branchId)!;
          }

          const result = await CoachingService.getCoachingBranchPermissions(branchId);

          if (result.success && result.data) {
            get().cacheBranchPermissions(branchId, result.data);
            return result.data;
          }

          return null;
        },

        cacheCenterPermissions: (centerId: string, permissions: CoachingCenterPermissions) => {
          set((state) => {
            state.centerPermissionsCache.set(centerId, permissions);
          });
        },

        cacheBranchPermissions: (branchId: string, permissions: CoachingBranchPermissions) => {
          set((state) => {
            state.branchPermissionsCache.set(branchId, permissions);
          });
        },

        // Upload actions
        uploadLogo: async (centerId: string, file: File) => {
          set((state) => {
            state.uploadingLogo = true;
            state.logoUploadProgress = 0;
          });

          const progressInterval = setInterval(() => {
            set((state) => {
              state.logoUploadProgress = Math.min(state.logoUploadProgress + 10, 90);
            });
          }, 100);

          const result = await CoachingService.uploadCoachingLogo(centerId, file);

          clearInterval(progressInterval);

          set((state) => {
            state.uploadingLogo = false;
            state.logoUploadProgress = result.success ? 100 : 0;
          });

          if (result.success) {
            if (get().currentCoachingCenter?.id === centerId) {
              await get().loadCoachingCenter(centerId);
            }
            if (get().currentDashboard?.center.id === centerId) {
              await get().loadCoachingCenterDashboard(centerId);
            }
            return true;
          }

          return false;
        },

        uploadCover: async (centerId: string, file: File) => {
          set((state) => {
            state.uploadingCover = true;
            state.coverUploadProgress = 0;
          });

          const progressInterval = setInterval(() => {
            set((state) => {
              state.coverUploadProgress = Math.min(state.coverUploadProgress + 10, 90);
            });
          }, 100);

          const result = await CoachingService.uploadCoachingCover(centerId, file);

          clearInterval(progressInterval);

          set((state) => {
            state.uploadingCover = false;
            state.coverUploadProgress = result.success ? 100 : 0;
          });

          if (result.success) {
            if (get().currentCoachingCenter?.id === centerId) {
              await get().loadCoachingCenter(centerId);
            }
            if (get().currentDashboard?.center.id === centerId) {
              await get().loadCoachingCenterDashboard(centerId);
            }
            return true;
          }

          return false;
        },

        setLogoUploadProgress: (progress: number) => {
          set((state) => {
            state.logoUploadProgress = progress;
          });
        },

        setCoverUploadProgress: (progress: number) => {
          set((state) => {
            state.coverUploadProgress = progress;
          });
        },

        // Featured and category actions
        loadFeaturedCenters: async () => {
          set((state) => {
            state.featuredCentersLoading = true;
          });

          const result = await CoachingService.searchCoachingCenters(
            { is_verified: true },
            'recent',
            1,
            10
          );

          set((state) => {
            state.featuredCentersLoading = false;
            if (result.success && result.data) {
              state.featuredCenters = result.data.results.map((item: CoachingCenterSearchItem) => ({
                id: item.center_id,
                slug: item.center_slug,
                name: item.center_name,
                category: item.center_category,
                subjects: item.center_subjects || [],
                logo_url: item.center_logo_url,
                is_verified: item.center_is_verified,
              })) as any[];
            }
          });
        },

        loadCentersByCategory: async (category: CoachingCategory) => {
          set((state) => {
            state.centersByCategoryLoading.add(category);
          });

          const result = await CoachingService.searchCoachingCenters(
            { category },
            'recent',
            1,
            20
          );

          set((state) => {
            state.centersByCategoryLoading.delete(category);
            if (result.success && result.data) {
              const centers = result.data.results.map((item: CoachingCenterSearchItem) => ({
                id: item.center_id,
                slug: item.center_slug,
                name: item.center_name,
                category: item.center_category,
                subjects: item.center_subjects || [],
                logo_url: item.center_logo_url,
                is_verified: item.center_is_verified,
              }));
              state.centersByCategory.set(category, centers as any[]);
            }
          });
        },

        // Utility actions
        checkSlugAvailability: async (slug: string, excludeCenterId?: string) => {
          const result = await CoachingService.isSlugAvailable(slug, excludeCenterId);
          return result.success ? result.data || false : false;
        },

        // UI state actions
        setCreateMode: (enabled: boolean) => {
          set((state) => {
            state.isCreateMode = enabled;
            if (!enabled) {
              state.editFormData = null;
            }
          });
        },

        setEditMode: (enabled: boolean) => {
          set((state) => {
            state.isEditMode = enabled;
            if (!enabled) {
              state.editFormData = null;
            }
          });
        },

        setEditFormData: (data: CoachingCenterUpdate | null) => {
          set((state) => {
            state.editFormData = data;
          });
        },

        setBranchEditFormData: (data: CoachingBranchUpdate | null) => {
          set((state) => {
            state.branchEditFormData = data;
          });
        },

        resetEditForms: () => {
          set((state) => {
            state.editFormData = null;
            state.branchEditFormData = null;
            state.isCreateMode = false;
            state.isEditMode = false;
          });
        },
      })),
      {
        name: 'coaching-store',
        partialize: (state) => ({
          currentCenterFilters: state.currentCenterFilters,
          currentCenterSortBy: state.currentCenterSortBy,
          currentBranchFilters: state.currentBranchFilters,
          currentBranchSort: state.currentBranchSort,
        }),
      }
    ),
    {
      name: 'coaching-store',
    }
  )
);

// Selector hooks (same as before)
export const useMyCoachingCenters = () => useCoachingStore(state => state.myCoachingCenters);
export const useMyCoachingCentersLoading = () => useCoachingStore(state => state.myCoachingCentersLoading);
export const useMyCoachingCentersError = () => useCoachingStore(state => state.myCoachingCentersError);

export const useCurrentCoachingCenter = () => useCoachingStore(state => state.currentCoachingCenter);
export const useCurrentCoachingCenterLoading = () => useCoachingStore(state => state.currentCoachingCenterLoading);
export const useCurrentCoachingCenterError = () => useCoachingStore(state => state.currentCoachingCenterError);

export const useCurrentDashboard = () => useCoachingStore(state => state.currentDashboard);
export const useCurrentDashboardLoading = () => useCoachingStore(state => state.currentDashboardLoading);
export const useCurrentDashboardError = () => useCoachingStore(state => state.currentDashboardError);

export const useCenterSearchResults = () => useCoachingStore(state => state.centerSearchResults);
export const useCenterSearchLoading = () => useCoachingStore(state => state.centerSearchLoading);
export const useCenterSearchError = () => useCoachingStore(state => state.centerSearchError);

export const useCoachingStats = () => useCoachingStore(state => state.stats);
export const useCoachingStatsLoading = () => useCoachingStore(state => state.statsLoading);

export const useEditMode = () => useCoachingStore(state => state.isEditMode);
export const useCreateMode = () => useCoachingStore(state => state.isCreateMode);
export const useEditFormData = () => useCoachingStore(state => state.editFormData);
export const useBranchEditFormData = () => useCoachingStore(state => state.branchEditFormData);

export const useLogoUpload = () => useCoachingStore(state => ({
  uploading: state.uploadingLogo,
  progress: state.logoUploadProgress,
}));

export const useCoverUpload = () => useCoachingStore(state => ({
  uploading: state.uploadingCover,
  progress: state.coverUploadProgress,
}));

export const useFeaturedCenters = () => useCoachingStore(state => state.featuredCenters);
export const useFeaturedCentersLoading = () => useCoachingStore(state => state.featuredCentersLoading);

export const useCoachingCenterFromCache = (centerId: string) => {
  return useCoachingStore(state => state.coachingCenterCache.get(centerId));
};

export const useCoachingCenterCacheLoading = (centerId: string) => {
  return useCoachingStore(state => state.coachingCenterCacheLoading.has(centerId));
};

export const useCoachingCenterCacheError = (centerId: string) => {
  return useCoachingStore(state => state.coachingCenterCacheErrors.get(centerId));
};

export const useBranchesFromCache = (centerId: string, activeOnly: boolean = true) => {
  const cacheKey = `${centerId}-${activeOnly}`;
  return useCoachingStore(state => state.branchesByCenter.get(cacheKey));
};

export const useBranchesCacheLoading = (centerId: string) => {
  return useCoachingStore(state => state.branchesByCenterLoading.has(centerId));
};

export const useCentersByCategory = (category: CoachingCategory) => {
  return useCoachingStore(state => state.centersByCategory.get(category));
};

export const useCentersByCategoryLoading = (category: CoachingCategory) => {
  return useCoachingStore(state => state.centersByCategoryLoading.has(category));
};
