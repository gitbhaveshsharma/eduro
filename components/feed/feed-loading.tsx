/**
 * Feed Loading Component
 * 
 * Reusable loading states for feed components
 * Includes skeleton loaders, error states, and empty states
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Search, Users } from "lucide-react";

export interface FeedLoadingProps {
    state: 'loading' | 'error' | 'empty';
    error?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: React.ReactNode;
    onRetry?: () => void;
    skeletonCount?: number;
    compact?: boolean;
}

export function FeedLoading({
    state,
    error,
    emptyTitle = "No posts found",
    emptyDescription = "There are no posts to display",
    emptyIcon,
    onRetry,
    skeletonCount = 3,
    compact = false
}: FeedLoadingProps) {
    if (state === 'loading') {
        return (
            <div className="space-y-6">
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <PostSkeleton key={i} compact={compact} />
                ))}
            </div>
        );
    }

    if (state === 'error') {
        return (
            <FeedError
                message={error || "Something went wrong"}
                onRetry={onRetry}
            />
        );
    }

    if (state === 'empty') {
        return (
            <FeedEmpty
                title={emptyTitle}
                description={emptyDescription}
                icon={emptyIcon}
            />
        );
    }

    return null;
}

// Post skeleton loader
export function PostSkeleton({ compact = false }: { compact?: boolean }) {
    return (
        <Card className="animate-pulse">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                    <div className={`bg-gray-200 rounded-full ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    {!compact && <div className="h-4 bg-gray-200 rounded w-1/2"></div>}
                </div>

                {/* Media placeholder */}
                {!compact && (
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
            </CardContent>
        </Card>
    );
}

// Error state component
export function FeedError({
    message,
    onRetry
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <Card className="border-red-200">
            <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Something went wrong
                </h3>
                <p className="text-gray-600 mb-4">
                    {message}
                </p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Empty state component
export function FeedEmpty({
    title,
    description,
    icon
}: {
    title: string;
    description: string;
    icon?: React.ReactNode;
}) {
    const defaultIcon = <Users className="h-12 w-12 text-gray-400" />;

    return (
        <Card>
            <CardContent className="p-12 text-center">
                <div className="mb-4">
                    {icon || defaultIcon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {title}
                </h3>
                <p className="text-gray-600">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

// Search empty state
export function SearchEmpty({ query }: { query: string }) {
    return (
        <FeedEmpty
            title="No posts found"
            description={`No posts found for "${query}". Try adjusting your search terms.`}
            icon={<Search className="h-12 w-12 text-gray-400" />}
        />
    );
}

// Following empty state
export function FollowingEmpty() {
    return (
        <FeedEmpty
            title="Your feed is empty"
            description="Follow some users to see their posts in your feed."
            icon={<Users className="h-12 w-12 text-gray-400" />}
        />
    );
}

// Load more loading indicator
export function LoadMoreLoading() {
    return (
        <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading more posts...</span>
            </div>
        </div>
    );
}

// Refresh loading indicator
export function RefreshLoading() {
    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <Card className="shadow-lg">
                <CardContent className="p-3">
                    <div className="flex items-center space-x-2 text-gray-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Refreshing feed...</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default FeedLoading;