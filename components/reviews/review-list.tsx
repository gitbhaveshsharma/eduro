/**
 * Review List Component
 * 
 * Displays paginated list of reviews with loading states
 * Handles empty states and error states
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, MessageSquare } from 'lucide-react';
import { ReviewCard } from './review-card';
import { cn } from '@/lib/utils';
import type { ReviewWithDetails, PaginatedReviews } from '@/lib/schema/review.types';

interface ReviewListProps {
    reviews: PaginatedReviews | null;
    loading?: boolean;
    error?: string | null;
    onPageChange?: (page: number) => void;
    onReviewAction?: (reviewId: string, action: 'helpful' | 'edit' | 'delete' | 'report') => void;
    currentUserId?: string;
    className?: string;
}

export function ReviewList({
    reviews,
    loading = false,
    error = null,
    onPageChange,
    onReviewAction,
    currentUserId,
    className
}: ReviewListProps) {
    // Loading State
    if (loading && !reviews) {
        return (
            <div className={cn('space-y-4', className)}>
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="border rounded-lg p-6 animate-pulse"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-muted rounded-full" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-muted rounded w-1/4" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                                <div className="h-20 bg-muted rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className={cn('flex flex-col items-center justify-center py-12', className)}>
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Reviews</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    {error}
                </p>
            </div>
        );
    }

    // Empty State
    if (!reviews || reviews.reviews.length === 0) {
        return (
            <div className={cn('flex flex-col items-center justify-center py-12', className)}>
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                    Be the first to share your experience with this coaching center!
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Review Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {((reviews.page - 1) * reviews.per_page) + 1} - {Math.min(reviews.page * reviews.per_page, reviews.total_count)} of {reviews.total_count} reviews
                </p>
                {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Reviews */}
            <div className="space-y-4">
                {reviews.reviews.map((review) => (
                    <ReviewCard
                        key={review.id}
                        review={review}
                        isOwner={currentUserId === review.reviewer_id}
                        onHelpfulClick={() => onReviewAction?.(review.id, 'helpful')}
                        onEditClick={() => onReviewAction?.(review.id, 'edit')}
                        onDeleteClick={() => onReviewAction?.(review.id, 'delete')}
                        onReportClick={() => onReviewAction?.(review.id, 'report')}
                    />
                ))}
            </div>

            {/* Pagination */}
            {reviews.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(reviews.page - 1)}
                        disabled={!reviews.has_previous || loading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-1">
                        {/* Show page numbers */}
                        {Array.from({ length: Math.min(5, reviews.total_pages) }, (_, i) => {
                            let pageNum: number;

                            if (reviews.total_pages <= 5) {
                                pageNum = i + 1;
                            } else if (reviews.page <= 3) {
                                pageNum = i + 1;
                            } else if (reviews.page >= reviews.total_pages - 2) {
                                pageNum = reviews.total_pages - 4 + i;
                            } else {
                                pageNum = reviews.page - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={reviews.page === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => onPageChange?.(pageNum)}
                                    disabled={loading}
                                    className="w-10"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(reviews.page + 1)}
                        disabled={!reviews.has_next || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
