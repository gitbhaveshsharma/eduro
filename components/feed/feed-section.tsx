/**
 * Feed Section Component
 * 
 * Refactored to use the new GetPostService and reusable components
 * Production-ready implementation with proper state management
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import FeedContainer, {
    SmartFeedContainer,
    FollowingFeedContainer,
    TrendingFeedContainer,
    RecentFeedContainer,
    PopularFeedContainer,
    SearchFeedContainer
} from "./feed-container";
import type { FeedSortType } from "../layout/headers/feed-header";
import type { GetPostsParams } from "@/lib/service/getpost.service";

export interface FeedSectionProps {
    sortType?: FeedSortType;
    searchQuery?: string;
    category?: string;
    tags?: string[];
    authorId?: string;
    showEngagementScores?: boolean;
    compact?: boolean;
    className?: string;
}

export function FeedSection({
    sortType = 'recent',
    searchQuery = '',
    category,
    tags,
    authorId,
    showEngagementScores = false,
    compact = false,
    className = ''
}: FeedSectionProps) {
    const router = useRouter();

    // Handle navigation events
    const handlePostClick = (postId: string) => {
        router.push(`/feed/posts/${postId}`);
    };

    const handleAuthorClick = (authorId: string) => {
        router.push(`/profile/${authorId}`);
    };

    const handleLocationClick = (location: string, coordinates?: { latitude: number; longitude: number }) => {
        if (coordinates) {
            router.push(`/explore?lat=${coordinates.latitude}&lng=${coordinates.longitude}`);
        } else {
            router.push(`/explore?location=${encodeURIComponent(location)}`);
        }
    };

    const handleTagClick = (tag: string) => {
        router.push(`/explore/tags/${tag}`);
    };

    const handleCategoryClick = (category: string) => {
        router.push(`/explore/categories/${category}`);
    };

    // Build filters based on props
    const buildFilters = (): Omit<GetPostsParams, 'feed_type' | 'search_query'> => {
        const filters: Omit<GetPostsParams, 'feed_type' | 'search_query'> = {};

        if (category) filters.category = category;
        if (tags && tags.length > 0) filters.tags = tags;
        if (authorId) filters.author_id = authorId;

        return filters;
    };

    const commonProps = {
        showEngagementScores,
        compact,
        className,
        onPostClick: handlePostClick,
        onAuthorClick: handleAuthorClick,
        onLocationClick: handleLocationClick,
        onTagClick: handleTagClick,
        onCategoryClick: handleCategoryClick
    };

    // If search query is provided, use search feed
    if (searchQuery.trim()) {
        return (
            <SearchFeedContainer
                {...commonProps}
                query={searchQuery.trim()}
                filters={buildFilters()}
            />
        );
    }

    // Map sortType to appropriate feed component
    switch (sortType) {
        case 'trending':
            return (
                <TrendingFeedContainer
                    {...commonProps}
                    filters={{
                        ...buildFilters(),
                        time_window_hours: 24, // Trending posts from last 24 hours
                        min_engagement_score: 5 // Only high engagement posts
                    }}
                />
            );

        case 'popular':
            return (
                <PopularFeedContainer
                    {...commonProps}
                    filters={{
                        ...buildFilters(),
                        time_window_hours: 168 // Popular posts from last week
                    }}
                />
            );

        case 'following':
            return (
                <FollowingFeedContainer
                    {...commonProps}
                    filters={buildFilters()}
                />
            );

        case 'recent':
        default:
            return (
                <RecentFeedContainer
                    {...commonProps}
                    filters={buildFilters()}
                />
            );
    }
}

// Specialized feed components for specific use cases

export interface SmartFeedSectionProps extends Omit<FeedSectionProps, 'sortType'> {
    personalizeForUser?: boolean;
}

export function SmartFeedSection({
    personalizeForUser = true,
    ...props
}: SmartFeedSectionProps) {
    const router = useRouter();

    const commonProps = {
        showEngagementScores: props.showEngagementScores,
        compact: props.compact,
        className: props.className,
        onPostClick: (postId: string) => router.push(`/feed/posts/${postId}`),
        onAuthorClick: (authorId: string) => router.push(`/profile/${authorId}`),
        onLocationClick: (location: string, coordinates?: { latitude: number; longitude: number }) => {
            if (coordinates) {
                router.push(`/explore?lat=${coordinates.latitude}&lng=${coordinates.longitude}`);
            } else {
                router.push(`/explore?location=${encodeURIComponent(location)}`);
            }
        },
        onTagClick: (tag: string) => router.push(`/explore/tags/${tag}`),
        onCategoryClick: (category: string) => router.push(`/explore/categories/${category}`)
    };

    if (personalizeForUser) {
        return (
            <FeedContainer
                {...commonProps}
                feedType="personalized"
                filters={{
                    exclude_seen: false, // Show some seen posts for personalization
                    include_sensitive: false
                }}
            />
        );
    }

    return (
        <SmartFeedContainer
            {...commonProps}
            filters={{
                exclude_seen: false,
                include_sensitive: false
            }}
        />
    );
}

export interface TrendingFeedSectionProps extends Omit<FeedSectionProps, 'sortType'> {
    timeWindow?: 'hour' | 'day' | 'week';
    minEngagementScore?: number;
}

export function TrendingFeedSection({
    timeWindow = 'day',
    minEngagementScore = 5,
    ...props
}: TrendingFeedSectionProps) {
    const router = useRouter();

    const timeWindowHours = {
        hour: 1,
        day: 24,
        week: 168
    };

    const commonProps = {
        showEngagementScores: props.showEngagementScores ?? true, // Show scores for trending
        compact: props.compact,
        className: props.className,
        onPostClick: (postId: string) => router.push(`/feed/posts/${postId}`),
        onAuthorClick: (authorId: string) => router.push(`/profile/${authorId}`),
        onLocationClick: (location: string, coordinates?: { latitude: number; longitude: number }) => {
            if (coordinates) {
                router.push(`/explore?lat=${coordinates.latitude}&lng=${coordinates.longitude}`);
            } else {
                router.push(`/explore?location=${encodeURIComponent(location)}`);
            }
        },
        onTagClick: (tag: string) => router.push(`/explore/tags/${tag}`),
        onCategoryClick: (category: string) => router.push(`/explore/categories/${category}`)
    };

    return (
        <TrendingFeedContainer
            {...commonProps}
            filters={{
                time_window_hours: timeWindowHours[timeWindow],
                min_engagement_score: minEngagementScore,
                category: props.category,
                tags: props.tags,
                author_id: props.authorId
            }}
        />
    );
}

export interface LocationFeedSectionProps extends Omit<FeedSectionProps, 'sortType'> {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
}

export function LocationFeedSection({
    latitude,
    longitude,
    radius = 10,
    ...props
}: LocationFeedSectionProps) {
    const router = useRouter();

    const commonProps = {
        showEngagementScores: props.showEngagementScores,
        compact: props.compact,
        className: props.className,
        onPostClick: (postId: string) => router.push(`/feed/posts/${postId}`),
        onAuthorClick: (authorId: string) => router.push(`/profile/${authorId}`),
        onLocationClick: (location: string, coordinates?: { latitude: number; longitude: number }) => {
            if (coordinates) {
                router.push(`/explore?lat=${coordinates.latitude}&lng=${coordinates.longitude}`);
            } else {
                router.push(`/explore?location=${encodeURIComponent(location)}`);
            }
        },
        onTagClick: (tag: string) => router.push(`/explore/tags/${tag}`),
        onCategoryClick: (category: string) => router.push(`/explore/categories/${category}`)
    };

    return (
        <SmartFeedContainer
            {...commonProps}
            filters={{
                user_coordinates: { latitude, longitude },
                location_radius_km: radius,
                category: props.category,
                tags: props.tags
            }}
        />
    );
}

// Export the main component as default
export default FeedSection;