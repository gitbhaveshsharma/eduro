/**
 * Individual Post Page
 * 
 * Displays a single post with comments, reactions, and full interaction capabilities
 * Supports direct linking and sharing of specific posts
 */

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { CommentsSection } from "@/components/feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePostStore } from "@/lib/store/post.store";
import { useGetPostStore, useRealtimePosts } from "@/lib/store/getpost.store";
import { PostService } from "@/lib/service/post.service";
import { GetPostService } from "@/lib/service/getpost.service";
import type { EnhancedPost } from "@/lib/service/getpost.service";
import type { PublicReaction } from "@/components/reactions";

export default function PostPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        postCache,
        cachePost,
        toggleSavedPost,
        recordPostView
    } = usePostStore();

    const {
        posts,
        togglePostLike,
        togglePostSave,
        incrementPostShareCount,
        addPost,
        lastUpdateTime
    } = useGetPostStore();

    // Enable real-time subscriptions for this specific post
    const { subscribeToPost, subscribeToEngagement, unsubscribeFromPost } = useRealtimePosts(false);

    // Get post from store (with real-time updates)
    const post = posts.find(p => p.id === postId);

    // Load post data and setup real-time subscriptions
    useEffect(() => {
        const loadPost = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check if post is already in store
                const existingPost = posts.find(p => p.id === postId);
                if (existingPost) {
                    setLoading(false);
                    // Setup real-time subscriptions
                    subscribeToPost(postId);
                    subscribeToEngagement(postId);
                    recordPostView(postId);
                    return;
                }

                // Check cache first
                const cachedPost = postCache.get(postId);
                if (cachedPost) {
                    // Convert cached post to EnhancedPost format and add to store
                    const enhancedPost: EnhancedPost = {
                        ...cachedPost,
                        author_is_verified: false, // This would need to be fetched from profile
                    };

                    // Add to store for real-time updates
                    addPost(enhancedPost);

                    setLoading(false);
                    // Setup real-time subscriptions
                    subscribeToPost(postId);
                    subscribeToEngagement(postId);
                    recordPostView(postId);
                    return;
                }

                // Fetch from database using GetPostService
                const result = await GetPostService.getPostById(postId);

                if (!result.success) {
                    setError(result.error || 'Failed to load post');
                    setLoading(false);
                    return;
                }

                if (!result.data) {
                    setError('Post not found');
                    setLoading(false);
                    return;
                }

                // Add to store for real-time updates
                addPost(result.data);

                // Cache the post
                cachePost(result.data);
                setLoading(false);

                // Setup real-time subscriptions
                subscribeToPost(postId);
                subscribeToEngagement(postId);

                // Record view
                recordPostView(postId);

            } catch (err) {
                console.error('Error loading post:', err);
                setError(err instanceof Error ? err.message : 'Failed to load post');
                setLoading(false);
            }
        };

        if (postId) {
            loadPost();
        }

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribeFromPost(postId);
        };
    }, [postId, postCache, recordPostView, cachePost, posts, subscribeToPost, subscribeToEngagement, unsubscribeFromPost, addPost]);

    // Handle post interactions
    const handlePostLike = async (postId: string, liked: boolean) => {
        togglePostLike(postId);

        try {
            await PostService.toggleReaction('POST', postId, 1); // Assuming reaction ID 1 is "like"
        } catch (error) {
            // Revert on error
            togglePostLike(postId);
            console.error('Failed to sync like:', error);
        }
    };

    const handlePostSave = async (postId: string, saved: boolean) => {
        togglePostSave(postId);

        try {
            await PostService.toggleSavedPost(postId);
        } catch (error) {
            // Revert on error
            togglePostSave(postId);
            console.error('Failed to sync save:', error);
        }
    };

    const handlePostShare = async (postId: string) => {
        try {
            // Optimistically update share count
            incrementPostShareCount(postId);

            // Record share in database
            await PostService.recordPostShare(postId, 'external');

            // Native share if available
            if (navigator.share) {
                await navigator.share({
                    title: post?.title || 'Check out this post',
                    text: post?.content_preview || 'Interesting post on Eduro',
                    url: `${window.location.origin}/feed/posts/${postId}`
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(`${window.location.origin}/feed/posts/${postId}`);

                // You could show a toast notification here
                console.log('Link copied to clipboard');
            }
        } catch (error) {
            console.error('Failed to share post:', error);

            // Fallback to just copying the link
            try {
                await navigator.clipboard.writeText(`${window.location.origin}/feed/posts/${postId}`);
                console.log('Link copied to clipboard');
            } catch (clipboardError) {
                console.error('Failed to copy to clipboard:', clipboardError);
            }
        }
    };

    const handleAuthorClick = (authorId: string) => {
        router.push(`/profile/${authorId}`);
    };

    const handleLocationClick = (location: string, coordinates?: { latitude: number; longitude: number }) => {
        // Navigate to location or open maps
        if (coordinates) {
            window.open(`https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`, '_blank');
        }
    };

    const handleTagClick = (tag: string) => {
        router.push(`/search?tag=${encodeURIComponent(tag)}`);
    };

    const handleCategoryClick = (category: string) => {
        router.push(`/search?category=${encodeURIComponent(category)}`);
    };

    const handleReactionChange = async (postId: string, reaction: PublicReaction, action: 'add' | 'remove') => {
        try {
            // The real-time system will handle optimistic updates
            const result = await PostService.toggleReaction('POST', postId, reaction.id);

            if (!result.success) {
                console.error('Failed to update reaction:', result.error);
            }
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        }
    };

    const handleDeletePost = async (postId: string): Promise<boolean> => {
        try {
            const getPostStore = useGetPostStore.getState();
            const success = await getPostStore.deletePost(postId);
            if (success) {
                // Navigate back to feed after successful deletion
                router.push('/feed');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete post:', error);
            return false;
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    {/* Post skeleton */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments skeleton */}
                    <div className="mt-6 space-y-4">
                        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3 p-4 bg-white rounded-lg">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    {/* Error message */}
                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>

                    <div className="text-center py-12">
                        <Button onClick={() => router.push('/feed')}>
                            Go to Feed
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Post not found
    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
                        <p className="text-gray-600 mb-6">
                            The post you're looking for doesn't exist or has been removed.
                        </p>
                        <Button onClick={() => router.push('/feed')}>
                            Go to Feed
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Post */}
                <div className="mb-6">
                    <PostCard
                        key={`post-${post.id}-${lastUpdateTime}`}
                        post={post}
                        onLike={handlePostLike}
                        onSave={handlePostSave}
                        onShare={handlePostShare}
                        onComment={() => { }} // Comments are handled below
                        onDelete={handleDeletePost}
                        onAuthorClick={handleAuthorClick}
                        onLocationClick={handleLocationClick}
                        onTagClick={handleTagClick}
                        onCategoryClick={handleCategoryClick}
                        onReactionChange={handleReactionChange}
                        showEngagementScores={true}
                    />
                </div>

                {/* Comments Section */}
                <CommentsSection postId={post.id} />
            </div>
        </div>
    );
}
