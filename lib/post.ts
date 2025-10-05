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