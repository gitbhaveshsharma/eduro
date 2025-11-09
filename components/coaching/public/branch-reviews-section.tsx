/**
 * Branch Reviews Section - Complete Review Display for Branch Pages
 * 
 * Displays comprehensive review information for a specific coaching branch
 * Including rating summary, individual reviews, and interactive features
 */

'use client';

import { memo, useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    useReviewStore,
    ReviewDisplayUtils,
    type RatingSummaryResponse,
    type ReviewWithDetails,
    type ReviewSortBy
} from '@/lib/review';
import {
    Star,
    MessageSquare,
    TrendingUp,
    ThumbsUp,
    Calendar,
    User,
    CheckCircle2,
    Filter,
    SortAsc
} from 'lucide-react';

interface BranchReviewsSectionProps {
    branchId: string;
    branchName: string;
    className?: string;
}

export const BranchReviewsSection = memo(function BranchReviewsSection({
    branchId,
    branchName,
    className = ''
}: BranchReviewsSectionProps) {
    // Review store hooks
    const loadBranchReviewsWithSummary = useReviewStore(state => state.loadBranchReviewsWithSummary);
    const loadRatingSummary = useReviewStore(state => state.loadRatingSummary);
    const loadBranchReviews = useReviewStore(state => state.loadBranchReviews);
    const ratingSummary = useReviewStore(state => state.ratingSummary);
    const ratingSummaryLoading = useReviewStore(state => state.ratingSummaryLoading);
    const searchResults = useReviewStore(state => state.searchResults);
    const searchLoading = useReviewStore(state => state.searchLoading);
    const toggleHelpfulVote = useReviewStore(state => state.toggleHelpfulVote);

    // Local state for pagination and filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<ReviewSortBy>('recent');
    const [reviewsVisible, setReviewsVisible] = useState(false);

    // Ref for intersection observer
    const reviewsListRef = useRef<HTMLDivElement>(null);

    // Load data on mount and when branchId changes
    useEffect(() => {
        if (branchId) {
            // Load only rating summary initially for faster page load
            loadRatingSummary(branchId);
        }
    }, [branchId, loadRatingSummary]);

    // Intersection observer for lazy loading reviews
    useEffect(() => {
        if (!reviewsListRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !reviewsVisible && ratingSummary && ratingSummary.total_reviews > 0) {
                        setReviewsVisible(true);
                        loadBranchReviews(branchId, sortBy, currentPage, 10);
                    }
                });
            },
            {
                rootMargin: '100px', // Start loading 100px before the element is visible
                threshold: 0.1
            }
        );

        observer.observe(reviewsListRef.current);

        return () => {
            observer.disconnect();
        };
    }, [reviewsListRef, reviewsVisible, ratingSummary, branchId, sortBy, currentPage, loadBranchReviews]);

    // Reload only reviews when sort or page changes (only if reviews are visible)
    useEffect(() => {
        if (branchId && reviewsVisible) {
            loadBranchReviews(branchId, sortBy, currentPage, 10);
        }
    }, [sortBy, currentPage, branchId, reviewsVisible, loadBranchReviews]);

    // Handle helpful vote toggle
    const handleHelpfulVote = useCallback(async (reviewId: string) => {
        await toggleHelpfulVote(reviewId);
    }, [toggleHelpfulVote]);

    // Handle sort change
    const handleSortChange = useCallback((newSort: typeof sortBy) => {
        setSortBy(newSort);
        setCurrentPage(1); // Reset to first page
    }, []);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // Render rating stars
    const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <Star key={i} className={`${iconSize} fill-amber-400 text-amber-400`} />
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <div key={i} className="relative">
                        <Star className={`${iconSize} text-gray-300`} />
                        <Star
                            className={`${iconSize} fill-amber-400 text-amber-400 absolute top-0 left-0`}
                            style={{ clipPath: 'inset(0 50% 0 0)' }}
                        />
                    </div>
                );
            } else {
                stars.push(
                    <Star key={i} className={`${iconSize} text-gray-300`} />
                );
            }
        }

        return <div className="flex items-center gap-0.5">{stars}</div>;
    };

    // Render rating breakdown
    const renderRatingBreakdown = () => {
        if (!ratingSummary || ratingSummaryLoading) {
            return (
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm w-4">{rating}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Skeleton className="h-2 flex-1" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                    ))}
                </div>
            );
        }

        const totalReviews = ratingSummary.total_reviews;
        if (totalReviews === 0) return null;

        return (
            <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                    const count = ratingSummary.rating_breakdown[rating.toString() as keyof typeof ratingSummary.rating_breakdown] || 0;
                    const percentage = (count / totalReviews) * 100;

                    return (
                        <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm w-4">{rating}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Progress value={percentage} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground w-8">{count}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render individual review
    const renderReview = (review: ReviewWithDetails) => {
        return (
            <Card key={review.id} className="border-0 border-b border-border last:border-b-0 rounded-none">
                <CardContent className="p-6">
                    {/* Review Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                        {review.reviewer_name || 'Anonymous'}
                                    </p>
                                    {review.is_verified_reviewer && (
                                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {ReviewDisplayUtils.formatReviewDate(review.created_at)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {renderStars(parseInt(review.overall_rating))}
                            <span className="text-sm font-medium ml-1">
                                {review.overall_rating}/5
                            </span>
                        </div>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                        <h4 className="font-semibold mb-2 text-foreground">
                            {review.title}
                        </h4>
                    )}

                    {/* Review Content */}
                    {review.comment && (
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                            {review.comment}
                        </p>
                    )}

                    {/* Category Ratings */}
                    {(review.teaching_quality || review.infrastructure || review.staff_support || review.value_for_money) && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                            {review.teaching_quality && (
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Teaching</p>
                                    <div className="flex items-center justify-center gap-1">
                                        {renderStars(parseInt(review.teaching_quality), 'sm')}
                                        <span className="text-xs ml-1">{review.teaching_quality}</span>
                                    </div>
                                </div>
                            )}
                            {review.infrastructure && (
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Infrastructure</p>
                                    <div className="flex items-center justify-center gap-1">
                                        {renderStars(parseInt(review.infrastructure), 'sm')}
                                        <span className="text-xs ml-1">{review.infrastructure}</span>
                                    </div>
                                </div>
                            )}
                            {review.staff_support && (
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Staff Support</p>
                                    <div className="flex items-center justify-center gap-1">
                                        {renderStars(parseInt(review.staff_support), 'sm')}
                                        <span className="text-xs ml-1">{review.staff_support}</span>
                                    </div>
                                </div>
                            )}
                            {review.value_for_money && (
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Value</p>
                                    <div className="flex items-center justify-center gap-1">
                                        {renderStars(parseInt(review.value_for_money), 'sm')}
                                        <span className="text-xs ml-1">{review.value_for_money}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review Actions */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHelpfulVote(review.id)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <ThumbsUp className={`h-4 w-4 mr-1 ${review.user_has_voted ? 'fill-current' : ''}`} />
                            Helpful ({review.helpful_count})
                        </Button>

                        {review.reviewer_role_snapshot && (
                            <Badge variant="secondary" className="text-xs">
                                {review.reviewer_role_snapshot}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Rating Summary Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Reviews for {branchName}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {ratingSummaryLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="text-center space-y-4">
                                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24 mx-auto" />
                                    <Skeleton className="h-4 w-32 mx-auto" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-32" />
                                {Array(5).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    ) : ratingSummary && ratingSummary.total_reviews > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Overall Rating */}
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200">
                                    <span className="text-2xl font-bold text-amber-600">
                                        {ratingSummary.average_rating.toFixed(1)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {renderStars(ratingSummary.average_rating, 'md')}
                                    <p className="text-sm text-muted-foreground">
                                        Based on {ratingSummary.total_reviews} review{ratingSummary.total_reviews !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {ratingSummary.verified_reviews > 0 && (
                                    <div className="flex items-center justify-center gap-1 text-sm text-blue-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {ratingSummary.verified_reviews} verified review{ratingSummary.verified_reviews !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            {/* Rating Breakdown */}
                            <div>
                                <h4 className="font-semibold mb-3">Rating Breakdown</h4>
                                {renderRatingBreakdown()}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-semibold text-lg mb-1">No Reviews Yet</h3>
                            <p className="text-muted-foreground">
                                Be the first to share your experience with {branchName}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reviews List Section */}
            {ratingSummary && ratingSummary.total_reviews > 0 && (
                <Card ref={reviewsListRef}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Student Reviews
                            </CardTitle>

                            {/* Sort Options - Only show if reviews are visible */}
                            {reviewsVisible && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={sortBy === 'recent' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleSortChange('recent')}
                                    >
                                        <Calendar className="h-4 w-4 mr-1" />
                                        Recent
                                    </Button>
                                    <Button
                                        variant={sortBy === 'highest_rated' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleSortChange('highest_rated')}
                                    >
                                        <Star className="h-4 w-4 mr-1" />
                                        Rating
                                    </Button>
                                    <Button
                                        variant={sortBy === 'helpful' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleSortChange('helpful')}
                                    >
                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                        Helpful
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!reviewsVisible ? (
                            <div className="text-center py-12">
                                <div className="animate-pulse">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">Loading reviews...</p>
                                </div>
                            </div>
                        ) : searchLoading ? (
                            <div className="space-y-4 p-6">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        ) : searchResults && searchResults.reviews.length > 0 ? (
                            <div>
                                {searchResults.reviews.map(renderReview)}

                                {/* Pagination */}
                                {searchResults.total_pages > 1 && (
                                    <div className="p-6 border-t">
                                        <div className="flex justify-center items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!searchResults.has_previous}
                                                onClick={() => handlePageChange(currentPage - 1)}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground px-4">
                                                Page {currentPage} of {searchResults.total_pages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!searchResults.has_next}
                                                onClick={() => handlePageChange(currentPage + 1)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No reviews found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
});