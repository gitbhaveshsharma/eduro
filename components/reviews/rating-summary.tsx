/**
 * Rating Summary Component
 * 
 * Displays aggregated rating statistics for a coaching branch
 * Responsive design with rating distribution bars
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ReviewDisplayUtils, ReviewAnalyticsUtils } from '@/lib/utils/review.utils';
import type { RatingSummaryResponse } from '@/lib/schema/review.types';

interface RatingSummaryProps {
    summary: RatingSummaryResponse;
    className?: string;
}

export function RatingSummary({ summary, className }: RatingSummaryProps) {
    const distribution = ReviewAnalyticsUtils.getRatingDistribution(summary.rating_breakdown);
    const trustScore = ReviewAnalyticsUtils.getTrustScore(
        summary.verified_reviews,
        summary.total_reviews
    );

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600';
        if (rating >= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Reviews & Ratings</span>
                    <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {trustScore.label}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Overall Rating */}
                <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center">
                        <div className={cn('text-5xl font-bold', getRatingColor(summary.average_rating))}>
                            {summary.average_rating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        'h-5 w-5',
                                        i < Math.round(summary.average_rating)
                                            ? 'fill-current'
                                            : 'stroke-current fill-none',
                                        getRatingColor(summary.average_rating)
                                    )}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {summary.total_reviews} {summary.total_reviews === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 min-w-[60px]">
                                    <span className="text-sm font-medium">{rating}</span>
                                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                                </div>
                                <Progress
                                    value={distribution[rating as keyof typeof distribution]}
                                    className="h-2 flex-1"
                                />
                                <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                                    {summary.rating_breakdown[rating.toString() as keyof typeof summary.rating_breakdown]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Ratings */}
                {(summary.category_ratings.teaching_quality ||
                    summary.category_ratings.infrastructure ||
                    summary.category_ratings.staff_support ||
                    summary.category_ratings.value_for_money) && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold text-sm mb-3">Category Ratings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {summary.category_ratings.teaching_quality && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Teaching Quality</p>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={(summary.category_ratings.teaching_quality / 5) * 100}
                                                className="h-2"
                                            />
                                            <span className="text-sm font-medium min-w-[30px]">
                                                {summary.category_ratings.teaching_quality.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {summary.category_ratings.infrastructure && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Infrastructure</p>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={(summary.category_ratings.infrastructure / 5) * 100}
                                                className="h-2"
                                            />
                                            <span className="text-sm font-medium min-w-[30px]">
                                                {summary.category_ratings.infrastructure.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {summary.category_ratings.staff_support && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Staff Support</p>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={(summary.category_ratings.staff_support / 5) * 100}
                                                className="h-2"
                                            />
                                            <span className="text-sm font-medium min-w-[30px]">
                                                {summary.category_ratings.staff_support.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {summary.category_ratings.value_for_money && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Value for Money</p>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={(summary.category_ratings.value_for_money / 5) * 100}
                                                className="h-2"
                                            />
                                            <span className="text-sm font-medium min-w-[30px]">
                                                {summary.category_ratings.value_for_money.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                {/* Stats */}
                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Verified Reviews</p>
                        <p className="text-lg font-semibold">
                            {summary.verified_reviews}
                            <span className="text-sm text-muted-foreground ml-1">
                                ({Math.round((summary.verified_reviews / summary.total_reviews) * 100)}%)
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Recent Activity</p>
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold">{summary.recent_activity}</p>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                    </div>
                </div>

                {summary.last_review_date && (
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                        Last reviewed {ReviewDisplayUtils.formatTimeAgo(summary.last_review_date)}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
