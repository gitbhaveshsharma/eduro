'use client';

/**
 * Public Profile Posts Component
 * 
 * Displays a user's posts on their public profile page.
 * Uses the getpost store to fetch author-specific posts.
 */

import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/feed/post-card';
import { useGetPostStore } from '@/lib/store/getpost.store';
import { FileText, ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicProfile } from '@/lib/schema/profile.types';

interface PublicProfilePostsProps {
    profile: PublicProfile;
    className?: string;
    initialPostCount?: number;
}

export const PublicProfilePosts = memo(function PublicProfilePosts({
    profile,
    className,
    initialPostCount = 3,
}: PublicProfilePostsProps) {
    const [showAll, setShowAll] = useState(false);
    const { posts, loadingState, loadAuthorFeed } = useGetPostStore();
    const [hasLoaded, setHasLoaded] = useState(false);

    const isLoading = loadingState === 'loading';

    useEffect(() => {
        if (!hasLoaded && profile.id) {
            loadAuthorFeed(profile.id);
            setHasLoaded(true);
        }
    }, [profile.id, loadAuthorFeed, hasLoaded]);

    // Filter posts for this author
    const authorPosts = posts.filter(post => post.author_id === profile.id);
    const displayedPosts = showAll ? authorPosts : authorPosts.slice(0, initialPostCount);
    const hasMorePosts = authorPosts.length > initialPostCount;

    if (isLoading) {
        return (
            <Card className={cn('', className)}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Posts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <PostSkeleton key={i} />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (authorPosts.length === 0) {
        return (
            <Card className={cn('', className)}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Posts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">
                            No posts yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {profile.full_name || profile.username} hasn't shared any posts
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Posts
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                            ({authorPosts.length})
                        </span>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {displayedPosts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        compact
                        className="border shadow-none"
                    />
                ))}

                {hasMorePosts && !showAll && (
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowAll(true)}
                    >
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show all {authorPosts.length} posts
                    </Button>
                )}

                {showAll && hasMorePosts && (
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowAll(false)}
                    >
                        Show less
                    </Button>
                )}
            </CardContent>
        </Card>
    );
});

function PostSkeleton() {
    return (
        <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>
    );
}
