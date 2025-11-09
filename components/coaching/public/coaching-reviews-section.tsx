/**
 * Coaching Reviews Section - Compact Sidebar Design
 * Optimized for sticky sidebar placement
 */

'use client';

import { memo, useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Star,
    MessageSquare,
    TrendingUp,
    ChevronRight,
    Edit3
} from 'lucide-react';
import Link from 'next/link';
import {
    useReviewStore,
    ReviewDisplayUtils,
    ReviewAnalyticsUtils,
    type RatingSummaryResponse
} from '@/lib/review';

interface CoachingReviewsSectionProps {
    coachingCenterId: string;
    centerName: string;
    centerSlug: string;
    branchIds?: string[];
}

export const CoachingReviewsSection = memo(function CoachingReviewsSection({
    coachingCenterId,
    centerName,
    centerSlug,
    branchIds = []
}: CoachingReviewsSectionProps) {
    const { loadRatingSummary } = useReviewStore();
    const [ratingSummary, setRatingSummary] = useState<RatingSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReviewData = async () => {
            setLoading(true);
            try {
                if (branchIds.length > 0) {
                    await loadRatingSummary(branchIds[0]);
                    const storeState = useReviewStore.getState();
                    setRatingSummary(storeState.ratingSummary);
                }
            } catch (error) {
                console.error('Failed to load review data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadReviewData();
    }, [coachingCenterId, branchIds, loadRatingSummary]);

    const hasReviews = useMemo(
        () => ratingSummary && ratingSummary.total_reviews > 0,
        [ratingSummary]
    );

    const sortedRatings = useMemo(() => {
        if (!ratingSummary) return [];
        return Object.entries(ratingSummary.rating_breakdown)
            .sort(([a], [b]) => parseInt(b) - parseInt(a));
    }, [ratingSummary]);

    if (loading) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Star className="h-5 w-5 text-amber-500" />
                        </div>
                        Reviews
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-lg">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Star className="h-5 w-5 text-amber-500" />
                    </div>
                    Reviews
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {!hasReviews ? (
                    <div className="text-center py-8 space-y-3">
                        <div className="inline-flex p-4 bg-muted rounded-2xl mb-2">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No reviews yet</p>
                        <p className="text-xs text-muted-foreground">
                            Be the first to review {centerName}
                        </p>
                        <Button variant="default" size="sm" asChild className="mt-4 rounded-xl">
                            <Link href={`/coaching/${centerSlug}/reviews/new`}>
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Write Review
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Overall Rating */}
                        <div className="text-center space-y-3">
                            <div className="inline-flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl">
                                <div className="text-5xl font-bold text-foreground mb-2">
                                    {ratingSummary!.average_rating.toFixed(1)}
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-5 w-5 ${star <= Math.round(ratingSummary!.average_rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {ratingSummary!.total_reviews} {ratingSummary!.total_reviews === 1 ? 'review' : 'reviews'}
                                </p>
                            </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2.5">
                            {sortedRatings.map(([rating, count]) => {
                                const percentage = ReviewDisplayUtils.calculateRatingPercentage(
                                    count,
                                    ratingSummary!.total_reviews
                                );
                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 w-12 shrink-0">
                                            <span className="text-xs font-semibold">{rating}</span>
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        </div>
                                        <Progress value={percentage} className="flex-1 h-2" />
                                        <span className="text-xs text-muted-foreground w-8 text-right font-medium">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Trust Score */}
                        {ratingSummary!.verified_reviews > 0 && (
                            <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">
                                        {ReviewAnalyticsUtils.getTrustScore(
                                            ratingSummary!.verified_reviews,
                                            ratingSummary!.total_reviews
                                        ).label}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2 pt-2">
                            <Button variant="outline" className="w-full rounded-xl" asChild>
                                <Link href={`/coaching/${centerSlug}/reviews`}>
                                    View All Reviews
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            </Button>
                            <Button variant="default" className="w-full rounded-xl" asChild>
                                <Link href={`/coaching/${centerSlug}/reviews/new`}>
                                    <Edit3 className="h-3.5 w-3.5 mr-2" />
                                    Write a Review
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
});
