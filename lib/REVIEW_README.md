# Review System Documentation

This documentation covers the comprehensive coaching branch review system implemented for the Tutrsy platform. The system provides a complete solution for managing coaching center reviews with advanced search, rating aggregation, caching, and location-based filtering.

## Architecture Overview

The review system is organized into four main components:

- **Schema** (`lib/schema/review.types.ts`) - TypeScript interfaces, types, and Zod validation schemas
- **Service** (`lib/service/review.service.ts`) - Database operations, RPC function calls, and business logic
- **Store** (`lib/store/review.store.ts`) - State management with Zustand and caching
- **API** (`lib/review.ts`) - Main module index with convenience wrappers and utilities

## Quick Start

### 1. Import the Review System

```typescript
import { 
  ReviewAPI,
  useReviewStore,
  useSearchResults,
  useRatingSummary,
  ReviewDisplayUtils,
  ReviewValidationUtils
} from '@/lib/review';
```

### 2. Search for Reviews by Location

```tsx
import { useEffect } from 'react';
import { ReviewAPI, useSearchResults, useSearchLoading } from '@/lib/review';

function LocationReviews({ state, district, city }) {
  const reviews = useSearchResults();
  const loading = useSearchLoading();

  useEffect(() => {
    ReviewAPI.getReviewsByLocation({ state, district, city });
  }, [state, district, city]);

  if (loading) return <div>Loading reviews...</div>;
  
  return (
    <div>
      {reviews?.reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
```

### 3. Get Branch Rating Summary

```tsx
import { useEffect } from 'react';
import { ReviewAPI, useRatingSummary, ReviewDisplayUtils } from '@/lib/review';

function BranchRating({ branchId }) {
  const summary = useRatingSummary();

  useEffect(() => {
    ReviewAPI.getRatingSummary(branchId);
  }, [branchId]);

  if (!summary) return null;

  return (
    <div>
      <h3>{ReviewDisplayUtils.getRatingSummaryText(summary)}</h3>
      <div className="rating-breakdown">
        {Object.entries(summary.rating_breakdown).map(([rating, count]) => (
          <div key={rating}>
            {ReviewDisplayUtils.formatRatingStars(rating)}: {count} reviews
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Create a Review

```tsx
import { useState } from 'react';
import { ReviewAPI, CreateReviewInput } from '@/lib/review';

function CreateReviewForm({ branchId }) {
  const [formData, setFormData] = useState<CreateReviewInput>({
    coaching_branch_id: branchId,
    reviewer_user_type: 'STUDENT',
    title: '',
    comment: '',
    overall_rating: '5',
    is_anonymous: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const review = await ReviewAPI.createReview(formData);
    
    if (review) {
      alert('Review submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Review title"
        required
      />
      
      <textarea
        value={formData.comment}
        onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
        placeholder="Tell us about your experience..."
      />
      
      <select
        value={formData.overall_rating}
        onChange={(e) => setFormData(prev => ({ 
          ...prev, 
          overall_rating: e.target.value as any 
        }))}
      >
        <option value="5">5 Stars - Excellent</option>
        <option value="4">4 Stars - Good</option>
        <option value="3">3 Stars - Average</option>
        <option value="2">2 Stars - Poor</option>
        <option value="1">1 Star - Terrible</option>
      </select>
      
      <label>
        <input
          type="checkbox"
          checked={formData.is_anonymous}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            is_anonymous: e.target.checked 
          }))}
        />
        Post anonymously
      </label>
      
      <button type="submit">Submit Review</button>
    </form>
  );
}
```

## Database Schema

### Reviews Table

The main reviews table includes:

- **Branch/Center References**: Links to coaching_branches and coaching_centers
- **Reviewer Info**: Supports both authenticated and anonymous reviews
- **Rating System**: 1-5 scale for overall and category-specific ratings
- **Status Management**: PENDING, APPROVED, FLAGGED, REMOVED
- **User Snapshots**: Preserves reviewer name/role at time of review
- **Engagement Metrics**: Helpful votes and report counts

### Key Features

- **Anonymity Support**: Users can review anonymously with snapshot data preserved
- **Rate Limiting**: Prevents spam with hourly/daily limits and one-review-per-branch constraint
- **Edit/Delete Windows**: 24-hour edit window, 1-hour delete window
- **Materialized Views**: Cached rating aggregations for high performance
- **Full-Text Search**: PostgreSQL GIN indexes for fast text search
- **Location Filtering**: State/district/city filtering with address joins

## API Reference

### ReviewService

The service layer provides all database operations with Zod validation:

```typescript
// Create a review (with validation)
const result = await ReviewService.createReview({
  coaching_branch_id: 'uuid',
  reviewer_user_type: 'STUDENT',
  title: 'Great coaching center!',
  comment: 'Excellent teachers and infrastructure',
  overall_rating: '5',
  teaching_quality: '5',
  infrastructure: '4',
  is_anonymous: false
});

// Search reviews with filters
const searchResult = await ReviewService.searchReviews(
  {
    state: 'Maharashtra',
    city: 'Mumbai',
    min_rating: 4,
    has_media: true,
    sort_by: 'recent'
  },
  1, // page
  20  // per page
);

// Get rating summary (uses materialized view)
const summary = await ReviewService.getBranchRatingSummary(branchId);

// Toggle helpful vote
const voteResult = await ReviewService.toggleHelpfulVote(reviewId);

// Check if user can review
const canReview = await ReviewService.canUserReviewBranch(branchId);
```

### ReviewStore (Zustand)

State management with intelligent caching:

```typescript
const { 
  searchReviews,
  loadBranchReviews,
  loadLocationReviews,
  loadRatingSummary,
  toggleHelpfulVote,
  createReview,
  updateReview,
  deleteReview
} = useReviewStore();

// Load reviews for a branch with caching
await loadBranchReviews(branchId, 'helpful', 1, 20);

// Search by location
await loadLocationReviews(
  { state: 'Gujarat', city: 'Ahmedabad' },
  'recent'
);

// Get rating summary with cache
await loadRatingSummary(branchId);

// Optimistic helpful vote toggle
await toggleHelpfulVote(reviewId);
```

### Review Hooks

Convenient React hooks for common operations:

```typescript
// Review data
const review = useCurrentReview();
const loading = useCurrentReviewLoading();
const error = useCurrentReviewError();

// Search results
const results = useSearchResults();
const searchLoading = useSearchLoading();
const currentPage = useCurrentPage();

// Rating summary
const summary = useRatingSummary();
const summaryLoading = useRatingSummaryLoading();

// User's reviews
const myReviews = useMyReviews();

// Form state
const isSubmitting = useIsSubmitting();
const submitError = useSubmitError();

// Helpful votes
const hasVoted = useHasVotedHelpful(reviewId);

// Cache selectors
const cachedReview = useReviewFromCache(reviewId);
const cachedSummary = useRatingSummaryFromCache(branchId);
```

## Utility Functions

### Display Utilities

```typescript
import { ReviewDisplayUtils } from '@/lib/review';

// Get reviewer name (handles anonymous)
const name = ReviewDisplayUtils.getReviewerName(review);

// Format rating as stars
const stars = ReviewDisplayUtils.formatRatingStars(5); // "★★★★★"

// Get rating color
const color = ReviewDisplayUtils.getRatingColor(4); // "text-green-600"

// Format time
const timeAgo = ReviewDisplayUtils.formatTimeAgo(review.created_at);
const fullDate = ReviewDisplayUtils.formatReviewDate(review.created_at);

// Rating summary text
const summaryText = ReviewDisplayUtils.getRatingSummaryText(summary);
// "4.5 out of 5 stars (150 reviews)"
```

### Validation Utilities

```typescript
import { ReviewValidationUtils } from '@/lib/review';

// Check edit/delete permissions
const canEdit = ReviewValidationUtils.canEdit(review.created_at);
const canDelete = ReviewValidationUtils.canDelete(review.created_at);

// Get time remaining
const timeLeft = ReviewValidationUtils.getEditTimeRemaining(review.created_at);

// Validate inputs
const titleValid = ReviewValidationUtils.isValidTitle(title);
const commentValid = ReviewValidationUtils.isValidComment(comment);
const ratingValid = ReviewValidationUtils.isValidRating(rating);
```

### Filter Utilities

```typescript
import { ReviewFilterUtils } from '@/lib/review';

// Build filters
const locationFilter = ReviewFilterUtils.buildLocationFilter(
  'Maharashtra', 'Mumbai', 'Andheri'
);

const ratingFilter = ReviewFilterUtils.buildRatingFilter(4, 5);
const verifiedFilter = ReviewFilterUtils.buildVerifiedFilter();
const recentFilter = ReviewFilterUtils.buildRecentFilter(30); // Last 30 days
const mediaFilter = ReviewFilterUtils.buildMediaFilter();

// Combine filters
const combinedFilter = ReviewFilterUtils.combineFilters(
  locationFilter,
  ratingFilter,
  verifiedFilter
);
```

### Analytics Utilities

```typescript
import { ReviewAnalyticsUtils } from '@/lib/review';

// Calculate averages
const categoryAvg = ReviewAnalyticsUtils.calculateCategoryAverage({
  teaching_quality: 4.5,
  infrastructure: 4.0,
  staff_support: 4.8,
  value_for_money: 4.2
});

// Get distribution percentages
const distribution = ReviewAnalyticsUtils.getRatingDistribution(
  summary.rating_breakdown
);

// Determine trend
const trend = ReviewAnalyticsUtils.getRatingTrend(
  summary.recent_activity,
  summary.total_reviews
);

// Get trust score
const trust = ReviewAnalyticsUtils.getTrustScore(
  summary.verified_reviews,
  summary.total_reviews
);
```

## Usage Examples

### Advanced Search with Multiple Filters

```tsx
import { useState, useEffect } from 'react';
import { 
  ReviewAPI, 
  useSearchResults, 
  useSearchLoading,
  ReviewFilterUtils 
} from '@/lib/review';

function AdvancedReviewSearch() {
  const [filters, setFilters] = useState({
    state: 'Maharashtra',
    city: '',
    minRating: 1,
    verified: false,
    hasMedia: false,
    daysAgo: undefined
  });

  const results = useSearchResults();
  const loading = useSearchLoading();

  useEffect(() => {
    const searchFilters = ReviewFilterUtils.combineFilters(
      ReviewFilterUtils.buildLocationFilter(filters.state, undefined, filters.city),
      ReviewFilterUtils.buildRatingFilter(filters.minRating),
      filters.verified ? ReviewFilterUtils.buildVerifiedFilter() : {},
      filters.hasMedia ? ReviewFilterUtils.buildMediaFilter() : {},
      filters.daysAgo ? ReviewFilterUtils.buildRecentFilter(filters.daysAgo) : {}
    );

    ReviewAPI.searchReviews(searchFilters, 1, 20);
  }, [filters]);

  return (
    <div>
      <div className="filters">
        <select 
          value={filters.state}
          onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
        >
          <option value="">All States</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Gujarat">Gujarat</option>
          {/* More states */}
        </select>

        <input
          type="text"
          placeholder="City"
          value={filters.city}
          onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
        />

        <select
          value={filters.minRating}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            minRating: parseInt(e.target.value) 
          }))}
        >
          <option value="1">1+ Stars</option>
          <option value="2">2+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="4">4+ Stars</option>
          <option value="5">5 Stars Only</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              verified: e.target.checked 
            }))}
          />
          Verified only
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.hasMedia}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              hasMedia: e.target.checked 
            }))}
          />
          With photos/videos
        </label>
      </div>

      {loading ? (
        <div>Searching...</div>
      ) : (
        <div className="results">
          <p>Found {results?.total_count || 0} reviews</p>
          {results?.reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Review Card Component

```tsx
import { 
  ReviewWithDetails,
  ReviewDisplayUtils,
  ReviewValidationUtils,
  ReviewAPI
} from '@/lib/review';

function ReviewCard({ review }: { review: ReviewWithDetails }) {
  const handleHelpfulVote = async () => {
    await ReviewAPI.toggleHelpfulVote(review.id);
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div>
          <h4>{ReviewDisplayUtils.getReviewerName(review)}</h4>
          {review.is_verified_reviewer && (
            <span className="verified-badge">✓ Verified</span>
          )}
          {review.is_anonymous && (
            <span className="anonymous-badge">Anonymous</span>
          )}
        </div>
        <div>
          <span className={ReviewDisplayUtils.getRatingColor(review.overall_rating)}>
            {ReviewDisplayUtils.formatRatingStars(review.overall_rating)}
          </span>
          <span className="text-sm text-gray-500">
            {ReviewDisplayUtils.formatTimeAgo(review.created_at)}
          </span>
        </div>
      </div>

      <div className="review-content">
        <h3>{review.title}</h3>
        <p>{review.comment}</p>

        {review.has_media && (
          <div className="review-media">
            {/* Display media */}
          </div>
        )}

        {(review.teaching_quality || review.infrastructure || 
          review.staff_support || review.value_for_money) && (
          <div className="category-ratings">
            {review.teaching_quality && (
              <div>Teaching: {ReviewDisplayUtils.formatRatingStars(review.teaching_quality)}</div>
            )}
            {review.infrastructure && (
              <div>Infrastructure: {ReviewDisplayUtils.formatRatingStars(review.infrastructure)}</div>
            )}
            {review.staff_support && (
              <div>Support: {ReviewDisplayUtils.formatRatingStars(review.staff_support)}</div>
            )}
            {review.value_for_money && (
              <div>Value: {ReviewDisplayUtils.formatRatingStars(review.value_for_money)}</div>
            )}
          </div>
        )}
      </div>

      <div className="review-footer">
        <button onClick={handleHelpfulVote}>
          👍 Helpful ({review.helpful_count})
        </button>

        {review.response_exists && (
          <div className="response-indicator">
            ✉️ Coaching center responded
          </div>
        )}
      </div>

      {review.branch_city && (
        <div className="location">
          📍 {review.branch_city}, {review.branch_district}, {review.branch_state}
        </div>
      )}
    </div>
  );
}
```

## Error Handling

The review system provides comprehensive error handling with standardized error codes:

```typescript
import { ReviewAPI, REVIEW_ERROR_CODES } from '@/lib/review';

const review = await ReviewAPI.createReview(input);

if (!review) {
  const error = useReviewStore.getState().submitError;
  
  // Handle specific errors
  switch (error) {
    case REVIEW_ERROR_CODES.RATE_LIMIT_EXCEEDED:
      alert('You can only submit 3 reviews per hour');
      break;
    case REVIEW_ERROR_CODES.ALREADY_REVIEWED:
      alert('You have already reviewed this branch');
      break;
    case REVIEW_ERROR_CODES.SELF_REVIEW_NOT_ALLOWED:
      alert('You cannot review your own coaching branch');
      break;
    default:
      alert('Failed to submit review');
  }
}
```

## Performance Considerations

### Caching Strategy
- **Review Cache**: 5-minute TTL for individual reviews
- **Rating Summary Cache**: 10-minute TTL (uses materialized views)
- **Search Cache**: 2-minute TTL for search results
- **Optimistic Updates**: Immediate UI feedback for helpful votes

### Materialized Views
- Branch rating summaries are pre-calculated
- Automatically refreshed (can be scheduled via cron)
- Fallback to real-time calculation if cache miss

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Cursor-based pagination support

### Database Optimization
- Composite indexes for common queries
- GIN indexes for full-text search
- Partial indexes for approved reviews only
- Query optimization with proper JOIN strategies

## Security Features

### Row Level Security (RLS)
- Public can view approved reviews only
- Users can edit/delete own reviews within time windows
- Coaching center staff can respond to reviews
- Admins can manage all reviews

### Rate Limiting
- Database-level rate limiting via RPC functions
- Hourly limits (3 reviews per hour)
- Daily limits (10 reviews per day)
- One review per branch per user

### Data Privacy
- Anonymous review support
- User snapshot preservation
- Personal data protection

### Validation
- Server-side Zod validation
- SQL constraint validation
- Time-window enforcement
- Self-review prevention

## Server-Side vs Client-Side

### Server-Side (via Service)
- ✅ Review creation/updates
- ✅ Rating summary calculation
- ✅ Full-text search (RPC function)
- ✅ Rate limit checking
- ✅ Permission validation

### Client-Side (via Store)
- ✅ Caching and state management
- ✅ Optimistic updates
- ✅ Pagination
- ✅ Filter management
- ✅ Display logic

This architecture ensures:
- **Fast page loads**: Server-side data fetching
- **Responsive UI**: Client-side caching
- **Security**: Server-side validation
- **Performance**: Intelligent caching strategies

## Scheduled Maintenance

### Materialized View Refresh
```sql
-- Run hourly via cron
SELECT refresh_branch_ratings();
```

### Cache Cleanup
```typescript
// Run daily to clear old caches
ReviewAPI.clearCaches();
```

### Rating Summary Refresh
```typescript
// Admin endpoint or scheduled task
await ReviewAPI.refreshRatingSummaryCache();
```

This review system provides a complete, production-ready solution for managing coaching center reviews with excellent performance, security, and developer experience.
