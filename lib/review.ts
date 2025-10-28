/**
 * Review Module Index
 * 
 * Centralized exports for all review-related functionality
 * Provides a clean and organized API for importing review components
 */

// Types and Schemas (excluding validation types which are re-exported from validations)
export type {
  ReviewUserType,
  ReviewStatus,
  RatingScale,
  MediaType,
  ReviewSortBy,
  Review,
  ReviewMedia,
  ReviewHelpfulVote,
  ReviewResponse,
  ReviewWithDetails,
  ReviewSearchResult,
  BranchRatingSummary,
  PaginatedReviews,
  RatingSummaryResponse,
  ServiceResponse,
  RateLimitCheckResponse
} from './schema/review.types';
export {
  REVIEW_ERROR_CODES,
  REVIEW_CONSTANTS
} from './schema/review.types';

// Validation Schemas and Input Types
export {
  ReviewUserTypeEnum,
  ReviewStatusEnum,
  RatingScaleEnum,
  MediaTypeEnum,
  ReviewSortByEnum,
  REVIEW_VALIDATION,
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewSearchFiltersSchema,
  AddReviewMediaSchema,
  CreateReviewResponseSchema,
  HelpfulVoteSchema,
  validateTitle,
  validateComment,
  validateRating,
  validateResponseText,
  isCommentRequired
} from './validations/review.validation';
export type {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewSearchFilters,
  AddReviewMediaInput,
  CreateReviewResponseInput,
  HelpfulVoteInput
} from './validations/review.validation';

// Service
export { ReviewService } from './service/review.service';

// Store and Hooks
export {
  useReviewStore,
  useCurrentReview,
  useCurrentReviewLoading,
  useCurrentReviewError,
  useSearchResults,
  useSearchLoading,
  useSearchError,
  useCurrentPage,
  useCurrentFilters,
  useRatingSummary,
  useRatingSummaryLoading,
  useRatingSummaryError,
  useMyReviews,
  useMyReviewsLoading,
  useMyReviewsError,
  useIsSubmitting,
  useSubmitError,
  useHasVotedHelpful,
  useReviewFromCache,
  useRatingSummaryFromCache
} from './store/review.store';

// Utilities
export {
  ReviewDisplayUtils,
  ReviewValidationUtils,
  ReviewFilterUtils,
  ReviewAnalyticsUtils
} from './utils/review.utils';

// Import store for internal use
import { useReviewStore } from './store/review.store';
import type { ReviewSortBy } from './schema/review.types';
import type {
  ReviewSearchFilters,
  CreateReviewInput,
  UpdateReviewInput,
  CreateReviewResponseInput
} from './validations/review.validation';

/**
 * Main Review API
 * 
 * Convenient wrapper around the review service and store
 * for common operations
 */
export class ReviewAPI {
  /**
   * Create a new review
   */
  static async createReview(input: CreateReviewInput) {
    const store = useReviewStore.getState();
    return await store.createReview(input);
  }

  /**
   * Update an existing review
   */
  static async updateReview(reviewId: string, updates: UpdateReviewInput) {
    const store = useReviewStore.getState();
    return await store.updateReview(reviewId, updates);
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string) {
    const store = useReviewStore.getState();
    return await store.deleteReview(reviewId);
  }

  /**
   * Load a specific review
   */
  static async getReview(reviewId: string, forceRefresh = false) {
    const store = useReviewStore.getState();
    return await store.loadReview(reviewId, forceRefresh);
  }

  /**
   * Search reviews with filters
   */
  static async searchReviews(
    filters?: ReviewSearchFilters,
    page?: number,
    perPage?: number,
    forceRefresh?: boolean
  ) {
    const store = useReviewStore.getState();
    await store.searchReviews(filters, page, perPage, forceRefresh);
    return store.searchResults;
  }

  /**
   * Get reviews for a specific branch
   */
  static async getBranchReviews(
    branchId: string,
    sortBy?: ReviewSortBy,
    page?: number,
    perPage?: number
  ) {
    const store = useReviewStore.getState();
    await store.loadBranchReviews(branchId, sortBy, page, perPage);
    return store.searchResults;
  }

  /**
   * Get reviews by location
   */
  static async getReviewsByLocation(
    location: { state?: string; district?: string; city?: string },
    sortBy?: ReviewSortBy,
    page?: number,
    perPage?: number
  ) {
    const store = useReviewStore.getState();
    await store.loadLocationReviews(location, sortBy, page, perPage);
    return store.searchResults;
  }

  /**
   * Get rating summary for a branch
   */
  static async getRatingSummary(branchId: string, forceRefresh = false) {
    const store = useReviewStore.getState();
    await store.loadRatingSummary(branchId, forceRefresh);
    return store.ratingSummary;
  }

  /**
   * Toggle helpful vote on a review
   */
  static async toggleHelpfulVote(reviewId: string) {
    const store = useReviewStore.getState();
    return await store.toggleHelpfulVote(reviewId);
  }

  /**
   * Create a response to a review (coaching center staff)
   */
  static async createResponse(input: CreateReviewResponseInput) {
    const store = useReviewStore.getState();
    return await store.createResponse(input);
  }

  /**
   * Load current user's reviews
   */
  static async getMyReviews() {
    const store = useReviewStore.getState();
    await store.loadMyReviews();
    return store.myReviews;
  }

  /**
   * Check if user can review a branch
   */
  static async canReviewBranch(branchId: string) {
    const { ReviewService } = await import('./service/review.service');
    return await ReviewService.canUserReviewBranch(branchId);
  }

  /**
   * Navigate to next page of results
   */
  static nextPage() {
    const store = useReviewStore.getState();
    store.nextPage();
  }

  /**
   * Navigate to previous page of results
   */
  static previousPage() {
    const store = useReviewStore.getState();
    store.previousPage();
  }

  /**
   * Go to specific page
   */
  static goToPage(page: number) {
    const store = useReviewStore.getState();
    store.setPage(page);
  }

  /**
   * Clear all review data
   */
  static clearAll() {
    const store = useReviewStore.getState();
    store.resetStore();
  }

  /**
   * Clear all caches
   */
  static clearCaches() {
    const store = useReviewStore.getState();
    store.clearAllCaches();
  }

  /**
   * Refresh rating summary cache (admin/scheduled task)
   */
  static async refreshRatingSummaryCache() {
    const { ReviewService } = await import('./service/review.service');
    return await ReviewService.refreshRatingSummaryCache();
  }
}
