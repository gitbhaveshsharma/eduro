/**
 * Review Store
 * 
 * Zustand store for managing review state with caching and optimistic updates
 * Follows the pattern from profile.store.ts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReviewService } from '@/lib/service/review.service';
import type {
  Review,
  ReviewWithDetails,
  ReviewResponse,
  PaginatedReviews,
  RatingSummaryResponse,
  ReviewSortBy
} from '@/lib/schema/review.types';
import { REVIEW_CONSTANTS } from '@/lib/schema/review.types';
import type {
  CreateReviewInput,
  UpdateReviewInput,
  CreateReviewResponseInput,
  ReviewSearchFilters
} from '@/lib/validations/review.validation';

// ============================================================
// TYPES
// ============================================================

interface ReviewCache {
  [reviewId: string]: {
    data: ReviewWithDetails;
    timestamp: number;
  };
}

interface RatingSummaryCache {
  [branchId: string]: {
    data: RatingSummaryResponse;
    timestamp: number;
  };
}

interface SearchCache {
  [key: string]: {
    data: PaginatedReviews;
    timestamp: number;
  };
}

interface ReviewStoreState {
  // Current review (when viewing details)
  currentReview: ReviewWithDetails | null;
  currentReviewLoading: boolean;
  currentReviewError: string | null;

  // Search results
  searchResults: PaginatedReviews | null;
  searchLoading: boolean;
  searchError: string | null;
  currentFilters: ReviewSearchFilters;
  currentPage: number;
  currentPerPage: number;

  // Rating summary
  ratingSummary: RatingSummaryResponse | null;
  ratingSummaryLoading: boolean;
  ratingSummaryError: string | null;
  currentBranchId: string | null;

  // User's reviews
  myReviews: ReviewWithDetails[];
  myReviewsLoading: boolean;
  myReviewsError: string | null;

  // Helpful votes (optimistic updates)
  helpfulVotes: Set<string>; // Review IDs user has voted as helpful

  // Form state
  isSubmitting: boolean;
  submitError: string | null;

  // Cache
  reviewCache: ReviewCache;
  ratingSummaryCache: RatingSummaryCache;
  searchCache: SearchCache;
}

interface ReviewStoreActions {
  // Review CRUD
  loadReview: (reviewId: string, forceRefresh?: boolean) => Promise<ReviewWithDetails | null>;
  createReview: (input: CreateReviewInput) => Promise<Review | null>;
  updateReview: (reviewId: string, updates: UpdateReviewInput) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;

  // Search & Filtering
  searchReviews: (
    filters?: ReviewSearchFilters,
    page?: number,
    perPage?: number,
    forceRefresh?: boolean
  ) => Promise<void>;
  loadBranchReviews: (
    branchId: string,
    sortBy?: ReviewSortBy,
    page?: number,
    perPage?: number
  ) => Promise<void>;
  loadLocationReviews: (
    location: { state?: string; district?: string; city?: string },
    sortBy?: ReviewSortBy,
    page?: number,
    perPage?: number
  ) => Promise<void>;

  // Rating summary
  loadRatingSummary: (branchId: string, forceRefresh?: boolean) => Promise<void>;

  // User's reviews
  loadMyReviews: () => Promise<void>;

  // Helpful votes
  toggleHelpfulVote: (reviewId: string) => Promise<boolean>;

  // Review responses
  createResponse: (input: CreateReviewResponseInput) => Promise<ReviewResponse | null>;

  // Pagination
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Cache management
  clearReviewCache: () => void;
  clearSearchCache: () => void;
  clearRatingSummaryCache: () => void;
  clearAllCaches: () => void;

  // State resets
  clearCurrentReview: () => void;
  clearSearch: () => void;
  resetStore: () => void;
}

type ReviewStore = ReviewStoreState & ReviewStoreActions;

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: ReviewStoreState = {
  currentReview: null,
  currentReviewLoading: false,
  currentReviewError: null,

  searchResults: null,
  searchLoading: false,
  searchError: null,
  currentFilters: {},
  currentPage: 1,
  currentPerPage: REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE,

  ratingSummary: null,
  ratingSummaryLoading: false,
  ratingSummaryError: null,
  currentBranchId: null,

  myReviews: [],
  myReviewsLoading: false,
  myReviewsError: null,

  helpfulVotes: new Set(),

  isSubmitting: false,
  submitError: null,

  reviewCache: {},
  ratingSummaryCache: {},
  searchCache: {}
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if cached data is still valid
 */
function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

/**
 * Generate cache key for search
 */
function generateSearchCacheKey(
  filters: ReviewSearchFilters,
  page: number,
  perPage: number
): string {
  return JSON.stringify({ filters, page, perPage });
}

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================================
      // REVIEW CRUD
      // ============================================================

      loadReview: async (reviewId: string, forceRefresh = false) => {
        const state = get();

        // Check cache first
        if (!forceRefresh && state.reviewCache[reviewId]) {
          const cached = state.reviewCache[reviewId];
          if (isCacheValid(cached.timestamp, REVIEW_CONSTANTS.REVIEW_CACHE_TTL)) {
            set({
              currentReview: cached.data,
              currentReviewLoading: false,
              currentReviewError: null
            });
            return cached.data;
          }
        }

        set({ currentReviewLoading: true, currentReviewError: null });

        try {
          const result = await ReviewService.getReviewById(reviewId);

          if (result.success && result.data) {
            // Update cache
            set(state => ({
              currentReview: result.data,
              currentReviewLoading: false,
              reviewCache: {
                ...state.reviewCache,
                [reviewId]: {
                  data: result.data!,
                  timestamp: Date.now()
                }
              }
            }));

            // Update helpful votes
            if (result.data.user_has_voted) {
              set(state => ({
                helpfulVotes: new Set([...state.helpfulVotes, reviewId])
              }));
            }

            return result.data;
          } else {
            set({
              currentReviewLoading: false,
              currentReviewError: result.error || 'Failed to load review'
            });
            return null;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            currentReviewLoading: false,
            currentReviewError: errorMessage
          });
          return null;
        }
      },

      createReview: async (input: CreateReviewInput) => {
        set({ isSubmitting: true, submitError: null });

        try {
          const result = await ReviewService.createReview(input);

          if (result.success && result.data) {
            set({ isSubmitting: false });

            // Clear caches as new review affects listings
            get().clearSearchCache();
            get().clearRatingSummaryCache();

            return result.data;
          } else {
            set({
              isSubmitting: false,
              submitError: result.error || 'Failed to create review'
            });
            return null;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isSubmitting: false,
            submitError: errorMessage
          });
          return null;
        }
      },

      updateReview: async (reviewId: string, updates: UpdateReviewInput) => {
        set({ isSubmitting: true, submitError: null });

        try {
          const result = await ReviewService.updateReview(reviewId, updates);

          if (result.success) {
            set({ isSubmitting: false });

            // Clear cache for this review
            set(state => {
              const newCache = { ...state.reviewCache };
              delete newCache[reviewId];
              return { reviewCache: newCache };
            });

            // Reload current review if it's the one being updated
            if (get().currentReview?.id === reviewId) {
              await get().loadReview(reviewId, true);
            }

            return true;
          } else {
            set({
              isSubmitting: false,
              submitError: result.error || 'Failed to update review'
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isSubmitting: false,
            submitError: errorMessage
          });
          return false;
        }
      },

      deleteReview: async (reviewId: string) => {
        set({ isSubmitting: true, submitError: null });

        try {
          const result = await ReviewService.deleteReview(reviewId);

          if (result.success) {
            set({ isSubmitting: false });

            // Remove from cache
            set(state => {
              const newCache = { ...state.reviewCache };
              delete newCache[reviewId];
              return { reviewCache: newCache };
            });

            // Clear search caches
            get().clearSearchCache();
            get().clearRatingSummaryCache();

            // Clear current review if it's the one being deleted
            if (get().currentReview?.id === reviewId) {
              set({ currentReview: null });
            }

            return true;
          } else {
            set({
              isSubmitting: false,
              submitError: result.error || 'Failed to delete review'
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isSubmitting: false,
            submitError: errorMessage
          });
          return false;
        }
      },

      // ============================================================
      // SEARCH & FILTERING
      // ============================================================

      searchReviews: async (
        filters = {},
        page = 1,
        perPage = REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE,
        forceRefresh = false
      ) => {
        const cacheKey = generateSearchCacheKey(filters, page, perPage);
        const state = get();

        // Check cache first
        if (!forceRefresh && state.searchCache[cacheKey]) {
          const cached = state.searchCache[cacheKey];
          if (isCacheValid(cached.timestamp, REVIEW_CONSTANTS.SEARCH_CACHE_TTL)) {
            set({
              searchResults: cached.data,
              searchLoading: false,
              searchError: null,
              currentFilters: filters,
              currentPage: page,
              currentPerPage: perPage
            });
            return;
          }
        }

        set({
          searchLoading: true,
          searchError: null,
          currentFilters: filters,
          currentPage: page,
          currentPerPage: perPage
        });

        try {
          const result = await ReviewService.searchReviews(filters, page, perPage);

          if (result.success && result.data) {
            // Update helpful votes from results
            const votedReviewIds = result.data.reviews
              .filter(r => r.user_has_voted)
              .map(r => r.id);

            set(state => ({
              searchResults: result.data,
              searchLoading: false,
              searchCache: {
                ...state.searchCache,
                [cacheKey]: {
                  data: result.data!,
                  timestamp: Date.now()
                }
              },
              helpfulVotes: new Set([...state.helpfulVotes, ...votedReviewIds])
            }));
          } else {
            set({
              searchLoading: false,
              searchError: result.error || 'Failed to search reviews'
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            searchLoading: false,
            searchError: errorMessage
          });
        }
      },

      loadBranchReviews: async (
        branchId: string,
        sortBy = 'recent' as ReviewSortBy,
        page = 1,
        perPage = REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE
      ) => {
        await get().searchReviews(
          { branch_id: branchId, sort_by: sortBy },
          page,
          perPage
        );
      },

      loadLocationReviews: async (
        location: { state?: string; district?: string; city?: string },
        sortBy = 'recent' as ReviewSortBy,
        page = 1,
        perPage = REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE
      ) => {
        await get().searchReviews(
          { ...location, sort_by: sortBy },
          page,
          perPage
        );
      },

      // ============================================================
      // RATING SUMMARY
      // ============================================================

      loadRatingSummary: async (branchId: string, forceRefresh = false) => {
        const state = get();

        // Check cache first
        if (!forceRefresh && state.ratingSummaryCache[branchId]) {
          const cached = state.ratingSummaryCache[branchId];
          if (isCacheValid(cached.timestamp, REVIEW_CONSTANTS.RATING_SUMMARY_CACHE_TTL)) {
            set({
              ratingSummary: cached.data,
              ratingSummaryLoading: false,
              ratingSummaryError: null,
              currentBranchId: branchId
            });
            return;
          }
        }

        set({
          ratingSummaryLoading: true,
          ratingSummaryError: null,
          currentBranchId: branchId
        });

        try {
          const result = await ReviewService.getBranchRatingSummary(branchId);

          if (result.success && result.data) {
            set(state => ({
              ratingSummary: result.data,
              ratingSummaryLoading: false,
              ratingSummaryCache: {
                ...state.ratingSummaryCache,
                [branchId]: {
                  data: result.data!,
                  timestamp: Date.now()
                }
              }
            }));
          } else {
            set({
              ratingSummaryLoading: false,
              ratingSummaryError: result.error || 'Failed to load rating summary'
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            ratingSummaryLoading: false,
            ratingSummaryError: errorMessage
          });
        }
      },

      // ============================================================
      // USER'S REVIEWS
      // ============================================================

      loadMyReviews: async () => {
        set({ myReviewsLoading: true, myReviewsError: null });

        try {
          // Search for reviews by current user
          // This requires the user ID which we get from the service
          const result = await ReviewService.searchReviews(
            {}, // No filters - service will filter by current user
            1,
            100 // Get all user's reviews
          );

          if (result.success && result.data) {
            set({
              myReviews: result.data.reviews,
              myReviewsLoading: false
            });
          } else {
            set({
              myReviewsLoading: false,
              myReviewsError: result.error || 'Failed to load your reviews'
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            myReviewsLoading: false,
            myReviewsError: errorMessage
          });
        }
      },

      // ============================================================
      // HELPFUL VOTES
      // ============================================================

      toggleHelpfulVote: async (reviewId: string) => {
        const state = get();
        const wasVoted = state.helpfulVotes.has(reviewId);

        // Optimistic update
        set(state => ({
          helpfulVotes: wasVoted
            ? new Set([...state.helpfulVotes].filter(id => id !== reviewId))
            : new Set([...state.helpfulVotes, reviewId])
        }));

        // Update helpful count in current review optimistically
        if (state.currentReview?.id === reviewId) {
          set(state => ({
            currentReview: state.currentReview ? {
              ...state.currentReview,
              helpful_count: wasVoted
                ? state.currentReview.helpful_count - 1
                : state.currentReview.helpful_count + 1,
              user_has_voted: !wasVoted
            } : null
          }));
        }

        // Update in search results optimistically
        if (state.searchResults) {
          set(state => ({
            searchResults: state.searchResults ? {
              ...state.searchResults,
              reviews: state.searchResults.reviews.map(r =>
                r.id === reviewId
                  ? {
                      ...r,
                      helpful_count: wasVoted ? r.helpful_count - 1 : r.helpful_count + 1,
                      user_has_voted: !wasVoted
                    }
                  : r
              )
            } : null
          }));
        }

        try {
          const result = await ReviewService.toggleHelpfulVote(reviewId);

          if (result.success && result.data) {
            // Update with actual count from server
            if (state.currentReview?.id === reviewId) {
              set(state => ({
                currentReview: state.currentReview ? {
                  ...state.currentReview,
                  helpful_count: result.data!.helpful_count,
                  user_has_voted: result.data!.voted
                } : null
              }));
            }

            return true;
          } else {
            // Revert optimistic update on error
            set(state => ({
              helpfulVotes: wasVoted
                ? new Set([...state.helpfulVotes, reviewId])
                : new Set([...state.helpfulVotes].filter(id => id !== reviewId))
            }));

            if (state.currentReview?.id === reviewId) {
              set(state => ({
                currentReview: state.currentReview ? {
                  ...state.currentReview,
                  helpful_count: wasVoted
                    ? state.currentReview.helpful_count + 1
                    : state.currentReview.helpful_count - 1,
                  user_has_voted: wasVoted
                } : null
              }));
            }

            return false;
          }
        } catch (error) {
          // Revert on error
          set(state => ({
            helpfulVotes: wasVoted
              ? new Set([...state.helpfulVotes, reviewId])
              : new Set([...state.helpfulVotes].filter(id => id !== reviewId))
          }));
          return false;
        }
      },

      // ============================================================
      // REVIEW RESPONSES
      // ============================================================

      createResponse: async (input: CreateReviewResponseInput) => {
        set({ isSubmitting: true, submitError: null });

        try {
          const result = await ReviewService.createReviewResponse(input);

          if (result.success && result.data) {
            set({ isSubmitting: false });

            // Clear cache for the review
            set(state => {
              const newCache = { ...state.reviewCache };
              delete newCache[input.review_id];
              return { reviewCache: newCache };
            });

            // Reload current review if it's the one with the response
            if (get().currentReview?.id === input.review_id) {
              await get().loadReview(input.review_id, true);
            }

            return result.data;
          } else {
            set({
              isSubmitting: false,
              submitError: result.error || 'Failed to create response'
            });
            return null;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            isSubmitting: false,
            submitError: errorMessage
          });
          return null;
        }
      },

      // ============================================================
      // PAGINATION
      // ============================================================

      setPage: (page: number) => {
        const state = get();
        get().searchReviews(
          state.currentFilters,
          page,
          state.currentPerPage
        );
      },

      nextPage: () => {
        const state = get();
        if (state.searchResults?.has_next) {
          get().setPage(state.currentPage + 1);
        }
      },

      previousPage: () => {
        const state = get();
        if (state.searchResults?.has_previous) {
          get().setPage(state.currentPage - 1);
        }
      },

      // ============================================================
      // CACHE MANAGEMENT
      // ============================================================

      clearReviewCache: () => {
        set({ reviewCache: {} });
      },

      clearSearchCache: () => {
        set({ searchCache: {} });
      },

      clearRatingSummaryCache: () => {
        set({ ratingSummaryCache: {} });
      },

      clearAllCaches: () => {
        set({
          reviewCache: {},
          searchCache: {},
          ratingSummaryCache: {}
        });
      },

      // ============================================================
      // STATE RESETS
      // ============================================================

      clearCurrentReview: () => {
        set({
          currentReview: null,
          currentReviewLoading: false,
          currentReviewError: null
        });
      },

      clearSearch: () => {
        set({
          searchResults: null,
          searchLoading: false,
          searchError: null,
          currentFilters: {},
          currentPage: 1
        });
      },

      resetStore: () => {
        set(initialState);
      }
    }),
    {
      name: 'review-store',
      partialize: (state) => ({
        // Only persist helpful votes
        helpfulVotes: Array.from(state.helpfulVotes)
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.helpfulVotes)) {
          state.helpfulVotes = new Set(state.helpfulVotes);
        }
      }
    }
  )
);

// ============================================================
// SELECTOR HOOKS
// ============================================================

export const useCurrentReview = () => useReviewStore(state => state.currentReview);
export const useCurrentReviewLoading = () => useReviewStore(state => state.currentReviewLoading);
export const useCurrentReviewError = () => useReviewStore(state => state.currentReviewError);

export const useSearchResults = () => useReviewStore(state => state.searchResults);
export const useSearchLoading = () => useReviewStore(state => state.searchLoading);
export const useSearchError = () => useReviewStore(state => state.searchError);
export const useCurrentPage = () => useReviewStore(state => state.currentPage);
export const useCurrentFilters = () => useReviewStore(state => state.currentFilters);

export const useRatingSummary = () => useReviewStore(state => state.ratingSummary);
export const useRatingSummaryLoading = () => useReviewStore(state => state.ratingSummaryLoading);
export const useRatingSummaryError = () => useReviewStore(state => state.ratingSummaryError);

export const useMyReviews = () => useReviewStore(state => state.myReviews);
export const useMyReviewsLoading = () => useReviewStore(state => state.myReviewsLoading);
export const useMyReviewsError = () => useReviewStore(state => state.myReviewsError);

export const useIsSubmitting = () => useReviewStore(state => state.isSubmitting);
export const useSubmitError = () => useReviewStore(state => state.submitError);

export const useHasVotedHelpful = (reviewId: string) => 
  useReviewStore(state => state.helpfulVotes.has(reviewId));

// Cache selector
export const useReviewFromCache = (reviewId: string) => 
  useReviewStore(state => state.reviewCache[reviewId]?.data || null);

export const useRatingSummaryFromCache = (branchId: string) =>
  useReviewStore(state => state.ratingSummaryCache[branchId]?.data || null);
