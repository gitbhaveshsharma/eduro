/**
 * Feed Container Component
 * 
 * Main container component that manages feed state and renders posts
 * Integrates with the GetPostStore for data management
 */

"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import PostCard from "./post-card";
import FeedLoading, {
    LoadMoreLoading,
    RefreshLoading,
    SearchEmpty,
    FollowingEmpty
} from "./feed-loading";
import { useGetPostStore, useRealtimePosts } from "@/lib/store/getpost.store";
import type {
    GetPostsParams,
    FeedAlgorithmType,
} from "@/lib/service/getpost.service";
import { PostService } from "@/lib/service/post.service";
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import type { PublicReaction } from "@/components/reactions";

export interface FeedContainerProps {
    // Feed configuration
    feedType?: FeedAlgorithmType;
    filters?: Omit<GetPostsParams, 'feed_type'>;

    // Display options
    compact?: boolean;
    showEngagementScores?: boolean;
    enableInfiniteScroll?: boolean;

    // Event handlers
    onPostClick?: (postId: string) => void;
    onAuthorClick?: (authorId: string) => void;
    onLocationClick?: (location: string, coordinates?: { latitude: number; longitude: number }) => void;
    onTagClick?: (tag: string) => void;
    onCategoryClick?: (category: string) => void;

    // Styling
    className?: string;
}

export function FeedContainer({
    feedType = 'smart',
    filters = {},
    compact = false,
    showEngagementScores = false,
    enableInfiniteScroll = true,
    onPostClick,
    onAuthorClick,
    onLocationClick,
    onTagClick,
    onCategoryClick,
    className = ""
}: FeedContainerProps) {
    const {
        posts,
        loadingState,
        refreshing,
        loadingMore,
        hasMore,
        error,
        searchQuery,
        loadFeed,
        refreshFeed,
        loadMorePosts,
        markPostViewed,
        togglePostLike,
        togglePostSave,
        incrementPostShareCount,
        deletePost,
        clearError
    } = useGetPostStore();

    // Enable real-time updates for the feed
    const { lastUpdateTime } = useRealtimePosts(true);

    const observerRef = useRef<IntersectionObserver>();
    const lastPostRef = useCallback((node: HTMLDivElement) => {
        if (loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && enableInfiniteScroll) {
                loadMorePosts();
            }
        });

        if (node) observerRef.current.observe(node);
    }, [loadingMore, hasMore, enableInfiniteScroll, loadMorePosts]);

    // Load feed when component mounts or filters change
    useEffect(() => {
        const params: GetPostsParams = {
            ...filters,
            feed_type: feedType
        };
        loadFeed(params);
    }, [feedType, JSON.stringify(filters), loadFeed]);

    // Handle post interactions
    const handlePostLike = useCallback(async (postId: string, liked: boolean) => {
        togglePostLike(postId);

        // Sync with backend
        try {
            await PostService.toggleReaction('POST', postId, 1); // Assuming reaction ID 1 is "like"
        } catch (error) {
            // Revert on error
            togglePostLike(postId);
            console.error('Failed to sync like:', error);
        }
    }, [togglePostLike]);

    const handlePostSave = useCallback(async (postId: string, saved: boolean) => {
        togglePostSave(postId);

        // Sync with backend
        try {
            await PostService.toggleSavedPost(postId);
        } catch (error) {
            // Revert on error
            togglePostSave(postId);
            console.error('Failed to sync save:', error);
        }
    }, [togglePostSave]);

    const handlePostShare = useCallback(async (postId: string) => {
        try {
            // Record share in database first
            const shareResult = await PostService.recordPostShare(postId, 'external');

            if (!shareResult.success) {
                console.error('Failed to record share:', shareResult.error);
                // Continue with sharing even if recording fails
            }

            // Share functionality - native share or fallback to clipboard
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this post',
                    text: 'Interesting post on Tutrsy',
                    url: `${window.location.origin}/feed/posts/${postId}`
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(`${window.location.origin}/feed/posts/${postId}`);

                // You could show a toast notification here
                // toast({ title: "Link copied to clipboard!" });
                console.log('Post link copied to clipboard');
            }
        } catch (error) {
            console.error('Failed to share post:', error);

            // Fallback - still try to record the share attempt
            try {
                await PostService.recordPostShare(postId, 'external');
            } catch (recordError) {
                console.error('Failed to record share attempt:', recordError);
            }

            // Try to copy link as fallback
            try {
                await navigator.clipboard.writeText(`${window.location.origin}/feed/posts/${postId}`);
                console.log('Post link copied to clipboard as fallback');
            } catch (clipboardError) {
                console.error('Failed to copy to clipboard:', clipboardError);
            }
        }
    }, []);

    const handlePostComment = useCallback((postId: string) => {
        // Navigate to the individual post page to show comments
        if (onPostClick) {
            onPostClick(postId);
        } else {
            // Fallback navigation if no custom handler is provided
            window.location.href = `/feed/posts/${postId}`;
        }
    }, [onPostClick]);

    const handlePostView = useCallback((postId: string) => {
        markPostViewed(postId);
    }, [markPostViewed]);

    const handleDeletePost = useCallback(async (postId: string) => {
        try {
            const success = await deletePost(postId);
            if (success) {
                showSuccessToast('Post deleted');
                return true;
            } else {
                showErrorToast('Failed to delete post');
                return false;
            }
        } catch (error) {
            showErrorToast(error instanceof Error ? error.message : 'Failed to delete post');
            return false;
        }
    }, [deletePost]);

    const handleReactionChange = useCallback(async (postId: string, reaction: PublicReaction, action: 'add' | 'remove') => {
        try {
            // Import the reaction store dynamically
            const { useReactionStore } = await import('@/lib/reaction');
            const store = useReactionStore.getState();

            // Optimistically update UI immediately
            store.loadReactionAnalytics('POST', postId, true);

            // Call the PostService to toggle the reaction
            const result = await PostService.toggleReaction('POST', postId, reaction.id);

            if (!result.success) {
                console.error('Failed to update reaction:', result.error);
                // Revert optimistic update by reloading from server
                await store.loadReactionAnalytics('POST', postId, true);
                return;
            }

            // Reload reaction analytics to ensure consistency with server
            await store.loadReactionAnalytics('POST', postId, true);
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
            // Reload from server on error
            const { useReactionStore } = await import('@/lib/reaction');
            await useReactionStore.getState().loadReactionAnalytics('POST', postId, true);
        }
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        clearError();
        refreshFeed();
    }, [clearError, refreshFeed]);

    // Render loading state
    if (loadingState === 'loading' && posts.length === 0) {
        return (
            <div className={className}>
                <FeedLoading
                    state="loading"
                    compact={compact}
                />
            </div>
        );
    }

    // Render error state
    if (loadingState === 'error' && posts.length === 0) {
        return (
            <div className={className}>
                <FeedLoading
                    state="error"
                    error={error?.message}
                    onRetry={handleRefresh}
                />
            </div>
        );
    }

    // Render empty state
    if (loadingState === 'success' && posts.length === 0) {
        let emptyComponent;

        if (searchQuery) {
            emptyComponent = <SearchEmpty query={searchQuery} />;
        } else if (feedType === 'following') {
            emptyComponent = <FollowingEmpty />;
        } else {
            emptyComponent = (
                <FeedLoading
                    state="empty"
                    emptyTitle="No posts found"
                    emptyDescription="There are no posts to display. Try following some users or check back later."
                />
            );
        }

        return (
            <div className={className}>
                {emptyComponent}
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Refresh indicator */}
            {refreshing && <RefreshLoading />}

            {/* Error banner (if error with existing posts) */}
            {error && posts.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-red-700">{error.message}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            {/* Posts list */}
            <div className="space-y-6">
                {posts.map((post, index) => (
                    <div
                        key={post.id}
                        ref={index === posts.length - 1 ? lastPostRef : undefined}
                    >
                        <PostCard
                            post={post}
                            onLike={handlePostLike}
                            onSave={handlePostSave}
                            onShare={handlePostShare}
                            onComment={handlePostComment}
                            onView={handlePostView}
                            onDelete={handleDeletePost}
                            onAuthorClick={onAuthorClick}
                            onLocationClick={onLocationClick}
                            onTagClick={onTagClick}
                            onCategoryClick={onCategoryClick}
                            onReactionChange={handleReactionChange}
                            showEngagementScores={showEngagementScores}
                            compact={compact}
                        />
                    </div>
                ))}
            </div>

            {/* Load more button or indicator */}
            {hasMore && (
                <div className="mt-8">
                    {loadingMore ? (
                        <LoadMoreLoading />
                    ) : !enableInfiniteScroll ? (
                        <div className="text-center">
                            <Button
                                onClick={loadMorePosts}
                                variant="outline"
                                disabled={loadingMore}
                            >
                                Load More Posts
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}

            {/* End of feed indicator */}
            {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    You've reached the end of the feed
                </div>
            )}
        </div>
    );
}

// Specialized feed containers for different feed types
export function SmartFeedContainer(props: Omit<FeedContainerProps, 'feedType'>) {
    return <FeedContainer {...props} feedType="smart" />;
}

export function FollowingFeedContainer(props: Omit<FeedContainerProps, 'feedType'>) {
    return <FeedContainer {...props} feedType="following" />;
}

export function TrendingFeedContainer(props: Omit<FeedContainerProps, 'feedType'>) {
    return <FeedContainer {...props} feedType="trending" />;
}

export function RecentFeedContainer(props: Omit<FeedContainerProps, 'feedType'>) {
    return <FeedContainer {...props} feedType="recent" />;
}

export function PopularFeedContainer(props: Omit<FeedContainerProps, 'feedType'>) {
    return <FeedContainer {...props} feedType="popular" />;
}

export function PersonalizedFeedContainer(props: Omit<FeedContainerProps, 'feedType'>) {
    return <FeedContainer {...props} feedType="personalized" />;
}

// Search-specific feed container
export interface SearchFeedContainerProps extends Omit<FeedContainerProps, 'feedType' | 'filters'> {
    query: string;
    filters?: Omit<GetPostsParams, 'search_query' | 'feed_type'>;
}

export function SearchFeedContainer({
    query,
    filters,
    ...props
}: SearchFeedContainerProps) {
    const searchFilters: GetPostsParams = {
        ...filters,
        search_query: query,
        feed_type: 'smart'
    };

    return (
        <FeedContainer
            {...props}
            feedType="smart"
            filters={searchFilters}
        />
    );
}

// Category-specific feed container
export interface CategoryFeedContainerProps extends Omit<FeedContainerProps, 'feedType' | 'filters'> {
    category: string;
    filters?: Omit<GetPostsParams, 'category' | 'feed_type'>;
}

export function CategoryFeedContainer({
    category,
    filters,
    ...props
}: CategoryFeedContainerProps) {
    const categoryFilters: GetPostsParams = {
        ...filters,
        category,
        feed_type: 'smart'
    };

    return (
        <FeedContainer
            {...props}
            feedType="smart"
            filters={categoryFilters}
        />
    );
}

// Author-specific feed container
export interface AuthorFeedContainerProps extends Omit<FeedContainerProps, 'feedType' | 'filters'> {
    authorId: string;
    filters?: Omit<GetPostsParams, 'author_id' | 'feed_type'>;
}

export function AuthorFeedContainer({
    authorId,
    filters,
    ...props
}: AuthorFeedContainerProps) {
    const authorFilters: GetPostsParams = {
        ...filters,
        author_id: authorId,
        feed_type: 'recent'
    };

    return (
        <FeedContainer
            {...props}
            feedType="recent"
            filters={authorFilters}
        />
    );
}

export default FeedContainer;