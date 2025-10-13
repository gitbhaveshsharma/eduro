/**
 * Feed Components Index
 * 
 * Central export point for all feed-related components
 */

// Main components
export { FeedHeader } from '../layout/headers/feed-header';
export { PostComposer } from './post-composer';
export { FeedSection } from './feed-section';
export { SuggestionSection } from './suggestion-section';

// New reusable components
export { default as PostCard } from './post-card';
export { default as FeedContainer } from './feed-container';
export { default as FeedLoading } from './feed-loading';
export { CommentsSection } from './comments-section';

// Named exports from feed-section
export {
    SmartFeedSection,
    TrendingFeedSection,
    LocationFeedSection
} from './feed-section';

// Named exports from feed-container
export {
    SmartFeedContainer,
    FollowingFeedContainer,
    TrendingFeedContainer,
    RecentFeedContainer,
    PopularFeedContainer,
    PersonalizedFeedContainer,
    SearchFeedContainer,
    CategoryFeedContainer,
    AuthorFeedContainer
} from './feed-container';

// Named exports from feed-loading
export {
    PostSkeleton,
    FeedError,
    FeedEmpty,
    SearchEmpty,
    FollowingEmpty,
    LoadMoreLoading,
    RefreshLoading
} from './feed-loading';

// Export types
export type { FeedSortType } from '../layout/headers/feed-header';
export type { PostCardProps } from './post-card';
export type { FeedContainerProps } from './feed-container';
export type { FeedLoadingProps } from './feed-loading';
export type { CommentsSectionProps } from './comments-section';