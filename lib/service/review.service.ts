/**
 * Review Service
 * 
 * Handles all review-related database operations and business logic
 * Includes validation, rate limiting, and RPC function calls
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import type {
  Review,
  ReviewWithDetails,
  ReviewMedia,
  ReviewResponse,
  ReviewSearchResult,
  BranchRatingSummary,
  RatingSummaryResponse,
  PaginatedReviews,
  ServiceResponse,
  RateLimitCheckResponse,
  ReviewSortBy
} from '@/lib/schema/review.types';
import {
  REVIEW_ERROR_CODES,
  REVIEW_CONSTANTS
} from '@/lib/schema/review.types';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  AddReviewMediaSchema,
  CreateReviewResponseSchema,
  ReviewSearchFiltersSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
  type AddReviewMediaInput,
  type CreateReviewResponseInput,
  type ReviewSearchFilters
} from '@/lib/validations/review.validation';

export class ReviewService {
  /**
   * Get current authenticated user ID
   */
  private static async getCurrentUserId(): Promise<string | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  /**
   * Validate input using Zod schema
   */
  private static validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): ServiceResponse<T> {
    try {
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          success: false,
          error: firstError.message,
          code: REVIEW_ERROR_CODES.INVALID_INPUT
        };
      }
      return {
        success: false,
        error: 'Invalid input data',
        code: REVIEW_ERROR_CODES.INVALID_INPUT
      };
    }
  }

  // ============================================================
  // REVIEW CRUD OPERATIONS
  // ============================================================

  /**
   * Create a new review
   */
  static async createReview(
    input: CreateReviewInput
  ): Promise<ServiceResponse<Review>> {
    try {
      console.log('ReviewService: Starting createReview with input:', input);
      
      // Validate input
      const validation = this.validateInput(CreateReviewSchema, input);
      if (!validation.success) {
        console.error('ReviewService: Validation failed:', validation.error);
        return validation as ServiceResponse<Review>;
      }

      console.log('ReviewService: Input validation passed');

      const supabase = createClient();
      const userId = await this.getCurrentUserId();
      console.log('ReviewService: Current user ID:', userId);

      if (!userId && !input.is_anonymous) {
        console.error('ReviewService: User not authenticated and review is not anonymous');
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Check rate limit
      console.log('ReviewService: Checking rate limit...');
      const rateLimitCheck = await this.checkRateLimit(
        input.coaching_branch_id,
        userId
      );
      console.log('ReviewService: Rate limit check result:', rateLimitCheck);

      if (!rateLimitCheck.can_review) {
        console.error('ReviewService: Rate limit exceeded:', rateLimitCheck.reason);
        return {
          success: false,
          error: rateLimitCheck.reason || 'Rate limit exceeded',
          code: REVIEW_ERROR_CODES.RATE_LIMIT_EXCEEDED
        };
      }

      // Get user profile data for snapshot if not anonymous
      let reviewerNameSnapshot = input.reviewer_name_snapshot;
      let reviewerRoleSnapshot = input.reviewer_role_snapshot;

      if (!input.is_anonymous && userId) {
        console.log('ReviewService: Fetching user profile...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', userId)
          .single();

        console.log('ReviewService: User profile:', profile);

        if (profile) {
          reviewerNameSnapshot = reviewerNameSnapshot || profile.full_name || 'User';
          reviewerRoleSnapshot = reviewerRoleSnapshot || profile.role;
        }
      }

      // Prepare RPC parameters
      const rpcParams = {
        p_branch_id: input.coaching_branch_id,
        p_reviewer_id: input.is_anonymous ? null : userId,
        p_reviewer_user_type: input.reviewer_user_type,
        p_title: validation.data!.title,
        p_comment: validation.data!.comment || null,
        p_overall_rating: validation.data!.overall_rating,
        p_teaching_quality: validation.data!.teaching_quality || null,
        p_infrastructure: validation.data!.infrastructure || null,
        p_staff_support: validation.data!.staff_support || null,
        p_value_for_money: validation.data!.value_for_money || null,
        p_is_anonymous: input.is_anonymous || false,
        p_reviewer_name_snapshot: reviewerNameSnapshot,
        p_reviewer_role_snapshot: reviewerRoleSnapshot
      };

      console.log('ReviewService: Calling submit_review RPC with params:', rpcParams);

      // Use RPC function to create review with all validations
      const { data, error } = await supabase.rpc('submit_review', rpcParams);

      console.log('ReviewService: RPC submit_review response:', { data, error });

      if (error) {
        console.error('ReviewService: RPC submit_review error:', error);
        
        // Check for specific error messages
        if (error.message.includes('cannot review')) {
          return {
            success: false,
            error: 'You cannot review your own coaching branch',
            code: REVIEW_ERROR_CODES.SELF_REVIEW_NOT_ALLOWED
          };
        }
        
        if (error.message.includes('Rate limit')) {
          return {
            success: false,
            error: error.message,
            code: REVIEW_ERROR_CODES.RATE_LIMIT_EXCEEDED
          };
        }

        return {
          success: false,
          error: error.message || 'Failed to create review',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      console.log('ReviewService: RPC call successful, fetching created review...');

      // Fetch the created review
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', data)
        .single();

      console.log('ReviewService: Fetch review result:', { review, fetchError });

      if (fetchError || !review) {
        console.error('ReviewService: Failed to fetch created review:', fetchError);
        return {
          success: false,
          error: 'Review created but failed to fetch',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      console.log('ReviewService: Review creation completed successfully');
      return {
        success: true,
        data: review
      };

    } catch (error) {
      console.error('ReviewService: Exception in createReview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  /**
   * Update an existing review (within edit window)
   */
  static async updateReview(
    reviewId: string,
    updates: UpdateReviewInput
  ): Promise<ServiceResponse<Review>> {
    try {
      // Validate input
      const validation = this.validateInput(UpdateReviewSchema, updates);
      if (!validation.success) {
        return validation as ServiceResponse<Review>;
      }

      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Check if user owns the review and it's within edit window
      const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('reviewer_id', userId)
        .single();

      if (fetchError || !existingReview) {
        return {
          success: false,
          error: 'Review not found or access denied',
          code: REVIEW_ERROR_CODES.REVIEW_NOT_FOUND
        };
      }

      // Check edit window (24 hours)
      const createdAt = new Date(existingReview.created_at).getTime();
      const now = Date.now();
      const editWindowExpired = now - createdAt > REVIEW_CONSTANTS.EDIT_WINDOW;

      if (editWindowExpired) {
        return {
          success: false,
          error: 'Edit window has expired (24 hours)',
          code: REVIEW_ERROR_CODES.EDIT_WINDOW_EXPIRED
        };
      }

      // Update the review
      const { data, error } = await supabase
        .from('reviews')
        .update(validation.data!)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return {
          success: false,
          error: error.message || 'Failed to update review',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error in updateReview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  /**
   * Delete a review (within delete window)
   */
  static async deleteReview(reviewId: string): Promise<ServiceResponse<void>> {
    try {
      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Check if user owns the review and it's within delete window
      const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('created_at')
        .eq('id', reviewId)
        .eq('reviewer_id', userId)
        .single();

      if (fetchError || !existingReview) {
        return {
          success: false,
          error: 'Review not found or access denied',
          code: REVIEW_ERROR_CODES.REVIEW_NOT_FOUND
        };
      }

      // Check delete window (1 hour)
      const createdAt = new Date(existingReview.created_at).getTime();
      const now = Date.now();
      const deleteWindowExpired = now - createdAt > REVIEW_CONSTANTS.DELETE_WINDOW;

      if (deleteWindowExpired) {
        return {
          success: false,
          error: 'Delete window has expired (1 hour)',
          code: REVIEW_ERROR_CODES.DELETE_WINDOW_EXPIRED
        };
      }

      // Delete the review
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Error deleting review:', error);
        return {
          success: false,
          error: error.message || 'Failed to delete review',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in deleteReview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  /**
   * Get a single review by ID
   */
  static async getReviewById(
    reviewId: string
  ): Promise<ServiceResponse<ReviewWithDetails>> {
    try {
      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (
            full_name,
            avatar_url,
            role
          ),
          coaching_branches:coaching_branch_id (
            name,
            addresses:branch_id (
              state,
              district,
              city,
              pin_code
            )
          ),
          coaching_centers:coaching_center_id (
            name
          ),
          review_media (
            id,
            media_url,
            media_type,
            display_order
          ),
          review_responses (
            id,
            response_text,
            is_public,
            created_at,
            updated_at
          )
        `)
        .eq('id', reviewId)
        .eq('status', 'APPROVED')
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Review not found',
          code: REVIEW_ERROR_CODES.REVIEW_NOT_FOUND
        };
      }

      // Check if user has voted this review as helpful
      let userHasVoted = false;
      if (userId) {
        const { data: voteData } = await supabase
          .from('review_helpful_votes')
          .select('id')
          .eq('review_id', reviewId)
          .eq('user_id', userId)
          .single();

        userHasVoted = !!voteData;
      }

      // Transform to ReviewWithDetails
      const review: ReviewWithDetails = {
        ...data,
        reviewer_name: data.is_anonymous 
          ? data.reviewer_name_snapshot 
          : (data.profiles as any)?.full_name || null,
        has_media: (data.review_media as any[])?.length > 0,
        response_exists: !!data.review_responses,
        branch_name: (data.coaching_branches as any)?.name || null,
        center_name: (data.coaching_centers as any)?.name || null,
        branch_state: (data.coaching_branches as any)?.addresses?.[0]?.state || null,
        branch_district: (data.coaching_branches as any)?.addresses?.[0]?.district || null,
        branch_city: (data.coaching_branches as any)?.addresses?.[0]?.city || null,
        branch_pin_code: (data.coaching_branches as any)?.addresses?.[0]?.pin_code || null,
        media: data.review_media as ReviewMedia[],
        response: data.review_responses as ReviewResponse,
        user_has_voted: userHasVoted
      };

      return {
        success: true,
        data: review
      };

    } catch (error) {
      console.error('Error in getReviewById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  // ============================================================
  // REVIEW SEARCH & FILTERING
  // ============================================================

  /**
   * Search reviews using the optimized RPC function
   */
  static async searchReviews(
    filters: ReviewSearchFilters = {},
    page: number = 1,
    perPage: number = REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<ServiceResponse<PaginatedReviews>> {
    try {
      // Validate filters
      const validation = this.validateInput(ReviewSearchFiltersSchema, filters);
      if (!validation.success) {
        return validation as ServiceResponse<PaginatedReviews>;
      }

      const supabase = createClient();
      const validatedFilters = validation.data!;
      
      // Calculate pagination
      const limit = Math.min(perPage, REVIEW_CONSTANTS.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      // Call the RPC function
      const { data, error } = await supabase.rpc('search_reviews', {
        p_search_query: validatedFilters.search_query || null,
        p_branch_id: validatedFilters.branch_id || null,
        p_center_id: validatedFilters.center_id || null,
        p_state: validatedFilters.state || null,
        p_district: validatedFilters.district || null,
        p_city: validatedFilters.city || null,
        p_min_rating: validatedFilters.min_rating || 1,
        p_max_rating: validatedFilters.max_rating || 5,
        p_has_media: validatedFilters.has_media ?? null,
        p_is_verified: validatedFilters.is_verified ?? null,
        p_days_ago: validatedFilters.days_ago ?? null,
        p_sort_by: validatedFilters.sort_by || 'recent',
        p_limit_count: limit,
        p_offset_count: offset
      }) as { data: ReviewSearchResult[] | null; error: any };

      if (error) {
        console.error('Error searching reviews:', error);
        return {
          success: false,
          error: error.message || 'Failed to search reviews',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          data: {
            reviews: [],
            total_count: 0,
            page,
            per_page: limit,
            total_pages: 0,
            has_next: false,
            has_previous: false
          }
        };
      }

      // Get user ID to check helpful votes
      const userId = await this.getCurrentUserId();

      // Get total count from first row
      const totalCount = data[0]?.total_count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Transform search results to ReviewWithDetails
      const reviews: ReviewWithDetails[] = await Promise.all(
        data.map(async (result) => {
          // Check if user has voted
          let userHasVoted = false;
          if (userId) {
            const { data: voteData } = await supabase
              .from('review_helpful_votes')
              .select('id')
              .eq('review_id', result.review_id)
              .eq('user_id', userId)
              .maybeSingle();

            userHasVoted = !!voteData;
          }

          return {
            id: result.review_id,
            coaching_branch_id: '', // Not needed in list view
            coaching_center_id: '', // Not needed in list view
            reviewer_id: null,
            reviewer_user_type: 'ANONYMOUS' as const,
            title: result.title,
            comment: result.comment,
            overall_rating: result.overall_rating,
            teaching_quality: result.teaching_quality,
            infrastructure: result.infrastructure,
            staff_support: result.staff_support,
            value_for_money: result.value_for_money,
            reviewer_name_snapshot: result.reviewer_name,
            reviewer_role_snapshot: result.reviewer_role_snapshot,
            status: 'APPROVED' as const,
            is_anonymous: result.is_anonymous,
            is_verified_reviewer: result.is_verified_reviewer,
            report_count: 0,
            helpful_count: result.helpful_count,
            created_at: result.created_at,
            updated_at: result.created_at,
            reviewed_date: result.created_at.split('T')[0],
            reviewer_name: result.reviewer_name,
            has_media: result.has_media,
            response_exists: result.response_exists,
            branch_name: result.branch_name,
            center_name: result.center_name,
            branch_state: result.branch_state,
            branch_district: result.branch_district,
            branch_city: result.branch_city,
            branch_pin_code: result.branch_pin_code,
            user_has_voted: userHasVoted
          };
        })
      );

      return {
        success: true,
        data: {
          reviews,
          total_count: totalCount,
          page,
          per_page: limit,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_previous: page > 1
        }
      };

    } catch (error) {
      console.error('Error in searchReviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  /**
   * Get reviews for a specific branch
   */
  static async getReviewsByBranch(
    branchId: string,
    sortBy: ReviewSortBy = 'recent',
    page: number = 1,
    perPage: number = REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<ServiceResponse<PaginatedReviews>> {
    return this.searchReviews(
      { branch_id: branchId, sort_by: sortBy },
      page,
      perPage
    );
  }

  /**
   * Get reviews by location (state, district, city)
   */
  static async getReviewsByLocation(
    location: {
      state?: string;
      district?: string;
      city?: string;
    },
    sortBy: ReviewSortBy = 'recent',
    page: number = 1,
    perPage: number = REVIEW_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<ServiceResponse<PaginatedReviews>> {
    return this.searchReviews(
      { ...location, sort_by: sortBy },
      page,
      perPage
    );
  }

  // ============================================================
  // RATING SUMMARY
  // ============================================================

  /**
   * Get rating summary for a branch (uses materialized view)
   */
  /**
 * Get rating summary for a branch (uses materialized view)
 */
static async getBranchRatingSummary(
  branchId: string
): Promise<ServiceResponse<RatingSummaryResponse>> {
  try {
    const supabase = createClient();

    // Validate that branchId is a valid UUID format
    if (!branchId || typeof branchId !== 'string') {
      return {
        success: false,
        error: 'Invalid branch ID provided',
        code: REVIEW_ERROR_CODES.INVALID_INPUT
      };
    }

    // Trim whitespace and validate UUID format
    const cleanBranchId = branchId.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cleanBranchId)) {
      return {
        success: false,
        error: 'Invalid UUID format for branch ID',
        code: REVIEW_ERROR_CODES.INVALID_INPUT
      };
    }

    console.log('Calling get_branch_rating_summary with branch_id:', cleanBranchId);

    // Use the RPC function that leverages materialized view
    // Try with the exact parameter name from the database function
    let { data, error } = await supabase.rpc('get_branch_rating_summary', {
      branch_id: cleanBranchId
    });

    // If the first call fails with PGRST202, try alternative parameter formats
    if (error && error.code === 'PGRST202') {
      console.warn('First RPC call failed, trying alternative parameter formats...');
      
      // Try with different parameter name variations
      try {
        const result = await supabase.rpc('get_branch_rating_summary', {
          p_branch_id: cleanBranchId
        });
        data = result.data;
        error = result.error;
        
        if (!error) {
          console.log('Success with p_branch_id parameter name');
        }
      } catch (altError) {
        console.log('Alternative parameter format also failed:', altError);
      }
    }

    if (error) {
      console.error('Error fetching rating summary:', error);
      
      // More detailed error logging
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        function_call: 'get_branch_rating_summary',
        parameters: { branch_id: cleanBranchId }
      });
      
      // Handle specific error cases
      if (error.code === 'PGRST202') {
        // Try to provide helpful information about the function signature mismatch
        console.error('Function signature mismatch. Expected: get_branch_rating_summary(branch_id uuid)');
        
        return {
          success: false,
          error: 'Database function not found or parameter mismatch. The function signature may have changed.',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to fetch rating summary',
        code: REVIEW_ERROR_CODES.DATABASE_ERROR
      };
    }

    console.log('RPC function returned data:', data);

    // Handle case where function returns null/empty
    if (!data) {
      console.log('No data returned from RPC function, returning empty summary');
      return {
        success: true,
        data: {
          total_reviews: 0,
          average_rating: 0,
          rating_breakdown: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0
          },
          category_ratings: {
            teaching_quality: null,
            infrastructure: null,
            staff_support: null,
            value_for_money: null
          },
          verified_reviews: 0,
          last_review_date: null,
          recent_activity: 0,
          cached: false
        } as RatingSummaryResponse
      };
    }

    return {
      success: true,
      data: data as RatingSummaryResponse
    };

  } catch (error) {
    console.error('Error in getBranchRatingSummary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
    };
  }
}

// ============================================================
// HELPFUL VOTES
// ============================================================

  /**
   * Toggle helpful vote for a review
   */
  static async toggleHelpfulVote(
    reviewId: string
  ): Promise<ServiceResponse<{ voted: boolean; helpful_count: number }>> {
    try {
      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('review_helpful_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingVote) {
        // Remove vote
        const { error } = await supabase
          .from('review_helpful_votes')
          .delete()
          .eq('id', existingVote.id);

        if (error) {
          return {
            success: false,
            error: 'Failed to remove vote',
            code: REVIEW_ERROR_CODES.DATABASE_ERROR
          };
        }

        // Get updated count
        const { data: review } = await supabase
          .from('reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();

        return {
          success: true,
          data: {
            voted: false,
            helpful_count: review?.helpful_count || 0
          }
        };
      } else {
        // Add vote
        const { error } = await supabase
          .from('review_helpful_votes')
          .insert({
            review_id: reviewId,
            user_id: userId
          });

        if (error) {
          return {
            success: false,
            error: 'Failed to add vote',
            code: REVIEW_ERROR_CODES.DATABASE_ERROR
          };
        }

        // Get updated count
        const { data: review } = await supabase
          .from('reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();

        return {
          success: true,
          data: {
            voted: true,
            helpful_count: review?.helpful_count || 0
          }
        };
      }

    } catch (error) {
      console.error('Error in toggleHelpfulVote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  // ============================================================
  // REVIEW MEDIA
  // ============================================================

  /**
   * Add media to a review
   */
  static async addReviewMedia(
    input: AddReviewMediaInput
  ): Promise<ServiceResponse<ReviewMedia>> {
    try {
      // Validate input
      const validation = this.validateInput(AddReviewMediaSchema, input);
      if (!validation.success) {
        return validation as ServiceResponse<ReviewMedia>;
      }

      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Check if user owns the review and it's within edit window
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('reviewer_id, created_at')
        .eq('id', validation.data!.review_id)
        .single();

      if (reviewError || !review || review.reviewer_id !== userId) {
        return {
          success: false,
          error: 'Review not found or access denied',
          code: REVIEW_ERROR_CODES.REVIEW_NOT_FOUND
        };
      }

      // Check edit window
      const createdAt = new Date(review.created_at).getTime();
      const now = Date.now();
      if (now - createdAt > REVIEW_CONSTANTS.EDIT_WINDOW) {
        return {
          success: false,
          error: 'Cannot add media after 24 hours',
          code: REVIEW_ERROR_CODES.EDIT_WINDOW_EXPIRED
        };
      }

      // Check media count limit
      const { count } = await supabase
        .from('review_media')
        .select('*', { count: 'exact', head: true })
        .eq('review_id', validation.data!.review_id);

      if (count && count >= REVIEW_CONSTANTS.MAX_MEDIA_PER_REVIEW) {
        return {
          success: false,
          error: `Maximum ${REVIEW_CONSTANTS.MAX_MEDIA_PER_REVIEW} media files allowed`,
          code: REVIEW_ERROR_CODES.TOO_MANY_MEDIA_FILES
        };
      }

      // Insert media
      const { data, error } = await supabase
        .from('review_media')
        .insert(validation.data!)
        .select()
        .single();

      if (error) {
        console.error('Error adding review media:', error);
        return {
          success: false,
          error: error.message || 'Failed to add media',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error in addReviewMedia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  /**
   * Remove media from a review
   */
  static async removeReviewMedia(mediaId: string): Promise<ServiceResponse<void>> {
    try {
      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Check ownership through review
      const { data: media, error: mediaError } = await supabase
        .from('review_media')
        .select(`
          review_id,
          reviews:review_id (
            reviewer_id,
            created_at
          )
        `)
        .eq('id', mediaId)
        .single();

      if (mediaError || !media) {
        return {
          success: false,
          error: 'Media not found',
          code: REVIEW_ERROR_CODES.REVIEW_NOT_FOUND
        };
      }

      const review = (media as any).reviews;
      if (!review || review.reviewer_id !== userId) {
        return {
          success: false,
          error: 'Access denied',
          code: REVIEW_ERROR_CODES.INSUFFICIENT_PERMISSIONS
        };
      }

      // Check edit window
      const createdAt = new Date(review.created_at).getTime();
      const now = Date.now();
      if (now - createdAt > REVIEW_CONSTANTS.EDIT_WINDOW) {
        return {
          success: false,
          error: 'Cannot remove media after 24 hours',
          code: REVIEW_ERROR_CODES.EDIT_WINDOW_EXPIRED
        };
      }

      // Delete media
      const { error } = await supabase
        .from('review_media')
        .delete()
        .eq('id', mediaId);

      if (error) {
        console.error('Error removing review media:', error);
        return {
          success: false,
          error: error.message || 'Failed to remove media',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in removeReviewMedia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  // ============================================================
  // REVIEW RESPONSES (For Coaching Centers)
  // ============================================================

  /**
   * Create a response to a review (coaching center staff only)
   */
  static async createReviewResponse(
    input: CreateReviewResponseInput
  ): Promise<ServiceResponse<ReviewResponse>> {
    try {
      // Validate input
      const validation = this.validateInput(CreateReviewResponseSchema, input);
      if (!validation.success) {
        return validation as ServiceResponse<ReviewResponse>;
      }

      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Insert response (RLS policy will check permissions)
      const { data, error } = await supabase
        .from('review_responses')
        .insert({
          ...validation.data!,
          responder_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating review response:', error);
        
        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            error: 'Response already exists for this review',
            code: REVIEW_ERROR_CODES.CONSTRAINT_VIOLATION
          };
        }

        return {
          success: false,
          error: error.message || 'Failed to create response',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error in createReviewResponse:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  /**
   * Update a review response
   */
  static async updateReviewResponse(
    responseId: string,
    responseText: string
  ): Promise<ServiceResponse<ReviewResponse>> {
    try {
      const supabase = createClient();
      const userId = await this.getCurrentUserId();

      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      // Validate response text length
      if (responseText.length < REVIEW_CONSTANTS.RESPONSE_MIN_LENGTH ||
          responseText.length > REVIEW_CONSTANTS.RESPONSE_MAX_LENGTH) {
        return {
          success: false,
          error: `Response must be between ${REVIEW_CONSTANTS.RESPONSE_MIN_LENGTH} and ${REVIEW_CONSTANTS.RESPONSE_MAX_LENGTH} characters`,
          code: REVIEW_ERROR_CODES.INVALID_INPUT
        };
      }

      // Update response (RLS policy will check permissions)
      const { data, error } = await supabase
        .from('review_responses')
        .update({ response_text: responseText })
        .eq('id', responseId)
        .eq('responder_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating review response:', error);
        return {
          success: false,
          error: error.message || 'Failed to update response',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Error in updateReviewResponse:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  // ============================================================
  // RATE LIMITING
  // ============================================================

  /**
   * Check if user can review a branch (rate limiting)
   */
  static async checkRateLimit(
    branchId: string,
    userId: string | null
  ): Promise<RateLimitCheckResponse> {
    try {
      console.log('ReviewService.checkRateLimit: Starting check for branchId:', branchId, 'userId:', userId);
      
      if (!userId) {
        console.log('ReviewService.checkRateLimit: No userId provided');
        return {
          can_review: false,
          reason: 'Authentication required'
        };
      }

      const supabase = createClient();

      console.log('ReviewService.checkRateLimit: Calling check_review_rate_limit RPC...');
      
      // Use the RPC function
      const { data, error } = await supabase.rpc('check_review_rate_limit', {
        user_id: userId,
        branch_id: branchId
      });

      console.log('ReviewService.checkRateLimit: RPC response:', { data, error });

      if (error) {
        console.error('ReviewService.checkRateLimit: RPC error:', error);
        return {
          can_review: false,
          reason: 'Failed to check rate limit'
        };
      }

      if (!data) {
        console.log('ReviewService.checkRateLimit: RPC returned false');
        return {
          can_review: false,
          reason: 'You cannot review this branch'
        };
      }

      console.log('ReviewService.checkRateLimit: Check passed');
      return {
        can_review: true
      };

    } catch (error) {
      console.error('ReviewService.checkRateLimit: Exception:', error);
      return {
        can_review: false,
        reason: 'Rate limit check failed'
      };
    }
  }

  /**
   * Check if user can review a specific branch (frontend helper)
   */
  static async canUserReviewBranch(branchId: string): Promise<ServiceResponse<boolean>> {
    try {
      const userId = await this.getCurrentUserId();
      
      if (!userId) {
        return {
          success: false,
          error: 'Authentication required',
          code: REVIEW_ERROR_CODES.NOT_AUTHENTICATED
        };
      }

      const result = await this.checkRateLimit(branchId, userId);

      return {
        success: true,
        data: result.can_review
      };

    } catch (error) {
      console.error('Error in canUserReviewBranch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }

  // ============================================================
  // MATERIALIZED VIEW REFRESH
  // ============================================================

  /**
   * Refresh the materialized view (admin only, scheduled task)
   */
  static async refreshRatingSummaryCache(): Promise<ServiceResponse<void>> {
    try {
      const supabase = createClient();

      const { error } = await supabase.rpc('refresh_branch_ratings');

      if (error) {
        console.error('Error refreshing materialized view:', error);
        return {
          success: false,
          error: error.message || 'Failed to refresh cache',
          code: REVIEW_ERROR_CODES.DATABASE_ERROR
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in refreshRatingSummaryCache:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: REVIEW_ERROR_CODES.UNKNOWN_ERROR
      };
    }
  }
}
