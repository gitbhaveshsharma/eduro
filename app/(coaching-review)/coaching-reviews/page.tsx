/**
 * Coaching Reviews Page
 * 
 * Main page for displaying and managing coaching center reviews
 * Includes filters, rating summary, and review list
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, X } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReviewFilters } from '@/components/reviews/review-filters';
import { RatingSummary } from '@/components/reviews/rating-summary';
import { ReviewList } from '@/components/reviews/review-list';
import { CreateReviewDialog } from '@/components/reviews/create-review-dialog';
import { showSuccessToast, showErrorToast, showLoadingToast } from '@/lib/toast';
import {
    useReviewStore,
    useSearchResults,
    useSearchLoading,
    useSearchError,
    useRatingSummary,
    useRatingSummaryLoading,
    useCurrentPage,
    useCurrentFilters
} from '@/lib/review';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import type { ReviewSearchFilters } from '@/lib/validations/review.validation';
import type { ReviewWithDetails } from '@/lib/schema/review.types';

interface CoachingReviewsPageProps {
    branchId: string;
    branchName?: string;
    centerName?: string;
    // Remove currentUserId prop - we'll get it from auth state
}

export function CoachingReviewsPage({
    branchId,
    branchName = 'This Coaching Center',
    centerName
}: CoachingReviewsPageProps) {

    // Use the auth guard hook for authentication logic
    const { profile, getCurrentUserId, getCurrentUserRole, requireAuth, createAuthAsyncHandler } = useAuthGuard();
    const currentUserId = getCurrentUserId();
    const currentUserRole = getCurrentUserRole && getCurrentUserRole();
    // Zustand store
    const reviews = useSearchResults();
    const loading = useSearchLoading();
    const error = useSearchError();
    const ratingSummary = useRatingSummary();
    const ratingSummaryLoading = useRatingSummaryLoading();
    const currentPage = useCurrentPage();
    const currentFilters = useCurrentFilters();

    const {
        loadBranchReviews,
        loadRatingSummary,
        searchReviews,
        toggleHelpfulVote,
        deleteReview,
        setPage
    } = useReviewStore();

    // UI State
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<ReviewWithDetails | null>(null);
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        loadRatingSummary(branchId);
        loadBranchReviews(branchId, 'recent', 1, 20);
    }, [branchId, loadRatingSummary, loadBranchReviews]);

    // Handle filter changes
    const handleFiltersChange = (filters: ReviewSearchFilters) => {
        searchReviews(
            { ...filters, branch_id: branchId },
            1,
            20
        );
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setPage(page);
        searchReviews(
            { ...currentFilters, branch_id: branchId },
            page,
            20
        );
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle review actions
    const handleReviewAction = async (
        reviewId: string,
        action: 'helpful' | 'edit' | 'delete' | 'report'
    ) => {
        switch (action) {
            case 'helpful':
                await handleHelpfulVote(reviewId);
                break;

            case 'edit':
                const reviewToEdit = reviews?.reviews.find(r => r.id === reviewId);
                if (reviewToEdit) {
                    setEditingReview(reviewToEdit);
                    setCreateDialogOpen(true);
                }
                break;

            case 'delete':
                setDeletingReviewId(reviewId);
                break;

            case 'report':
                // Implement report functionality
                showErrorToast('Report functionality coming soon');
                break;
        }
    };

    // Handle helpful vote with auth protection
    const handleHelpfulVote = createAuthAsyncHandler(
        'vote on reviews',
        async (reviewId: string) => {
            const voted = await toggleHelpfulVote(reviewId);
            if (voted !== undefined) {
                showSuccessToast(
                    voted
                        ? 'Marked as helpful'
                        : 'Removed helpful vote'
                );
            } else {
                showErrorToast('Failed to update vote');
            }
        },
        `/coaching-reviews/${branchId}`
    );

    // Handle delete review
    const handleDeleteReview = async () => {
        if (!deletingReviewId) return;

        const toastId = showLoadingToast('Deleting review...');

        const success = await deleteReview(deletingReviewId);

        // Dismiss loading toast
        if (toastId) {
            // toast.dismiss(toastId); // You might need to import toast.dismiss
        }

        if (success) {
            showSuccessToast('Review deleted successfully');
            setDeletingReviewId(null);
            // Reload reviews
            loadBranchReviews(branchId, 'recent', currentPage, 20);
            loadRatingSummary(branchId, true);
        } else {
            showErrorToast('Failed to delete review');
        }
    };

    // Handle review created/updated
    const handleReviewSuccess = () => {
        setEditingReview(null);
        // Reload reviews and summary
        loadBranchReviews(branchId, 'recent', currentPage, 20);
        loadRatingSummary(branchId, true);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Reviews for {branchName}
                            </h1>
                            {centerName && (
                                <p className="text-muted-foreground">{centerName}</p>
                            )}
                        </div>

                        <Button
                            onClick={() => {
                                if (!requireAuth('write a review', `/coaching-reviews/${branchId}`)) {
                                    return;
                                }
                                setEditingReview(null);
                                setCreateDialogOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Write a Review
                        </Button>
                    </div>
                </div>

                {/* Layout */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Sidebar - Rating Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        {ratingSummaryLoading && !ratingSummary ? (
                            <div className="border rounded-lg p-6 animate-pulse space-y-4">
                                <div className="h-8 bg-muted rounded w-3/4" />
                                <div className="h-32 bg-muted rounded" />
                            </div>
                        ) : ratingSummary ? (
                            <RatingSummary summary={ratingSummary} />
                        ) : null}

                        {/* Quick Stats */}
                        {ratingSummary && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 text-center">
                                    <p className="text-3xl font-bold text-primary">
                                        {ratingSummary.total_reviews}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Total Reviews
                                    </p>
                                </div>
                                <div className="border rounded-lg p-4 text-center">
                                    <p className="text-3xl font-bold text-green-600">
                                        {ratingSummary.verified_reviews}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Verified
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content - Reviews */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Filters */}
                        <ReviewFilters onFiltersChange={handleFiltersChange} />

                        {/* Review List */}
                        <ReviewList
                            reviews={reviews}
                            loading={loading}
                            error={error}
                            onPageChange={handlePageChange}
                            onReviewAction={handleReviewAction}
                            currentUserId={currentUserId}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Review Dialog */}
            <CreateReviewDialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                    setCreateDialogOpen(open);
                    if (!open) setEditingReview(null);
                }}
                branchId={branchId}
                branchName={branchName}
                existingReview={editingReview || undefined}
                userProfile={profile}
                userRole={currentUserRole}
                onSuccess={handleReviewSuccess}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deletingReviewId}
                onOpenChange={(open) => !open && setDeletingReviewId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Review?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Your review will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteReview}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Next.js requires a default export for pages in the app directory.
export default CoachingReviewsPage;
