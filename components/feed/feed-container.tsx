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
import { useGetPostStore } from "@/lib/store/getpost.store";
import type {
    GetPostsParams,
    FeedAlgorithmType,
    EnhancedPost
} from "@/lib/service/getpost.service";
import type { PostType } from "@/lib/schema/post.types";
import { PostService } from "@/lib/service/post.service";

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
        clearError
    } = useGetPostStore();

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

    const handlePostShare = useCallback((postId: string) => {
        // Share functionality - could open share modal or copy link
        if (navigator.share) {
            navigator.share({
                title: 'Check out this post',
                url: `${window.location.origin}/posts/${postId}`
            });
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
        }
    }, []);

    const handlePostComment = useCallback((postId: string) => {
        onPostClick?.(postId);
    }, [onPostClick]);

    const handlePostView = useCallback((postId: string) => {
        markPostViewed(postId);
    }, [markPostViewed]);

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
                            onAuthorClick={onAuthorClick}
                            onLocationClick={onLocationClick}
                            onTagClick={onTagClick}
                            onCategoryClick={onCategoryClick}
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