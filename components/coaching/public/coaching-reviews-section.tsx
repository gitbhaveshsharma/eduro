/**
 * Coaching Reviews Section Component
 * 
 * Displays review summary and recent reviews for a coaching center
 * Integrates with review.store to show ratings and reviews
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Star,
    MessageSquare,
    TrendingUp,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import {
    useReviewStore,
    ReviewDisplayUtils,
    ReviewAnalyticsUtils,
    type RatingSummaryResponse,
    type ReviewWithDetails
} from '@/lib/review';

interface CoachingReviewsSectionProps {
    coachingCenterId: string;
    centerName: string;
    centerSlug: string;
    // Optional: aggregate reviews from all branches
    branchIds?: string[];
}

export function CoachingReviewsSection({
    coachingCenterId,
    centerName,
    centerSlug,
    branchIds = []
}: CoachingReviewsSectionProps) {
    const { loadRatingSummary, searchReviews } = useReviewStore();
    const [ratingSummary, setRatingSummary] = useState<RatingSummaryResponse | null>(null);
    const [recentReviews, setRecentReviews] = useState<ReviewWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviewData();
    }, [coachingCenterId, branchIds]);

    const loadReviewData = async () => {
        setLoading(true);
        try {
            // If there are specific branches, load their reviews
            // For now, we'll load reviews for the first main branch if available
            if (branchIds.length > 0) {
                // Load rating summary for the main branch or first branch
                await loadRatingSummary(branchIds[0]);

                // Load recent reviews
                await searchReviews(
                    { branch_id: branchIds[0], sort_by: 'recent' },
                    1,
                    3
                );
            }

            // Get the data from store (this is simplified, you might need to aggregate from multiple branches)
            // For this implementation, we're showing data from the first branch
        } catch (error) {
            console.error('Failed to load review data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Reviews & Ratings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const summary = ratingSummary;
    const hasReviews = summary && summary.total_reviews > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Reviews & Ratings
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {!hasReviews ? (
                    <div className="text-center py-8 space-y-2">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">No reviews yet</p>
                        <p className="text-sm text-muted-foreground">
                            Be the first to review {centerName}
                        </p>
                        <Button variant="outline" size="sm" asChild className="mt-4">
                            <Link href={`/coaching/${centerSlug}/reviews/new`}>
                                Write a Review
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Rating Summary */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Overall Rating */}
                            <div className="space-y-4">
                                <div className="flex items-end gap-4">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-primary">
                                            {summary!.average_rating.toFixed(1)}
                                        </div>
                                        <div className="flex items-center justify-center gap-1 mt-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-5 w-5 ${star <= Math.round(summary!.average_rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {summary!.total_reviews} {summary!.total_reviews === 1 ? 'review' : 'reviews'}
                                        </p>
                                    </div>
                                </div>

                                {/* Category Ratings */}
                                {summary!.category_ratings && (
                                    <div className="space-y-2 text-sm">
                                        {summary!.category_ratings.teaching_quality && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Teaching Quality</span>
                                                <span className="font-medium">{summary!.category_ratings.teaching_quality.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {summary!.category_ratings.infrastructure && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Infrastructure</span>
                                                <span className="font-medium">{summary!.category_ratings.infrastructure.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {summary!.category_ratings.staff_support && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Staff Support</span>
                                                <span className="font-medium">{summary!.category_ratings.staff_support.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {summary!.category_ratings.value_for_money && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Value for Money</span>
                                                <span className="font-medium">{summary!.category_ratings.value_for_money.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Rating Distribution */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Rating Distribution</h4>
                                {Object.entries(summary!.rating_breakdown)
                                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                                    .map(([rating, count]) => {
                                        const percentage = ReviewDisplayUtils.calculateRatingPercentage(
                                            count,
                                            summary!.total_reviews
                                        );
                                        return (
                                            <div key={rating} className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 w-12">
                                                    <span className="text-sm font-medium">{rating}</span>
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                </div>
                                                <Progress value={percentage} className="flex-1 h-2" />
                                                <span className="text-sm text-muted-foreground w-12 text-right">
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Trust Score */}
                        {summary!.verified_reviews > 0 && (
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">
                                        {ReviewAnalyticsUtils.getTrustScore(
                                            summary!.verified_reviews,
                                            summary!.total_reviews
                                        ).label}
                                    </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {summary!.verified_reviews} verified {summary!.verified_reviews === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>
                        )}

                        {/* View All Reviews Button */}
                        <div className="flex justify-center pt-4">
                            <Button variant="outline" asChild>
                                <Link href={`/coaching/${centerSlug}/reviews`}>
                                    View All Reviews
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
