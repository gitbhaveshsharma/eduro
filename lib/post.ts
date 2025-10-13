/**
 * Post System Index
 * 
 * Main entry point for the post system
 * Exports all components for easy importing
 */

// Re-export everything from the post modules
export * from './schema/post.types';
export * from './service/post.service';
export * from './store/post.store';
export * from './utils/post.utils';

// New get_posts specific exports
export { default as GetPostService } from './service/getpost.service';
export { default as useGetPostStore } from './store/getpost.store';

// Export additional types from new services
export type {
    GetPostsParams,
    GetPostsResult,
    EnhancedPost,
    FeedAlgorithmType,
    FeedAnalytics
} from './service/getpost.service';

export type {
    LoadingState,
    FeedError
} from './store/getpost.store';