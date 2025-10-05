/**
 * Post Store
 * 
 * Zustand store for managing post state across the application
 * Handles caching, optimistic updates, real-time synchronization, and subscriptions
 * NOTE: Get/Feed functions removed - use separate feed service for algorithmic feeds
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { supabase } from '../supabase';
import { PostService } from '../service/post.service';
import type {
  PublicPost,
  PostCreate,
  PostUpdate,
  PublicComment,
  CommentCreate,
  CommentUpdate,
  PostReaction,
  ReactionTargetType,
  MediaUploadProgress,
  PostCoordinates,
  PostPermissions,
  PostRealtimeEvent
} from '../schema/post.types';

// Import constants as values
import {
  POST_CONSTANTS
} from '../schema/post.types';

// Enable Map and Set support for Immer
enableMapSet();

// Store state interface
interface PostState {
  // Post cache for individual posts
  postCache: Map<string, PublicPost>;
  postCacheLoading: Set<string>;
  postCacheErrors: Map<string, string>;

  // Comments
  commentsCache: Map<string, PublicComment[]>; // postId -> comments
  commentsLoading: Set<string>;
  commentsErrors: Map<string, string>;
  commentsHasMore: Map<string, boolean>;
  commentsPage: Map<string, number>;

  // Reactions
  userReactions: Map<string, PostReaction>; // targetId -> reaction
  reactionsLoading: Set<string>;

  // Saved posts
  savedPosts: PublicPost[];
  savedPostsLoading: boolean;
  savedPostsError: string | null;
  savedPostsHasMore: boolean;
  savedPostsPage: number;
  savedCollections: string[]; // Collection names

  // Permissions cache
  permissionsCache: Map<string, PostPermissions>;

  // Real-time subscriptions
  subscriptions: Map<string, any>; // subscription type -> subscription
  isSubscribed: boolean;

  // UI state
  isCreatingPost: boolean;
  createPostError: string | null;
  editingPostId: string | null;
  editFormData: PostUpdate | null;
  
  // Media upload state
  mediaUploads: Map<string, MediaUploadProgress>; // fileId -> progress
  uploadingMedia: boolean;

  // Comment composition
  commentComposition: Map<string, string>; // postId -> comment text
  replyComposition: Map<string, string>; // commentId -> reply text
  submittingComment: Set<string>; // postIds currently submitting

  // Geographic state
  userLocation: PostCoordinates | null;
  nearbyPosts: PublicPost[];
  nearbyPostsLoading: boolean;
}

// Store actions interface
interface PostActions {
  // Post CRUD actions
  createPost: (postData: PostCreate) => Promise<boolean>;
  updatePost: (postId: string, updates: PostUpdate) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  
  // Post cache actions
  cachePost: (post: PublicPost) => void;
  removeFromPostCache: (postId: string) => void;
  clearPostCache: () => void;

  // Comment actions
  loadComments: (postId: string, refresh?: boolean) => Promise<void>;
  loadMoreComments: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string, parentCommentId?: string) => Promise<boolean>;
  updateComment: (commentId: string, updates: CommentUpdate) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  setCommentComposition: (postId: string, content: string) => void;
  setReplyComposition: (commentId: string, content: string) => void;
  clearCommentComposition: (postId: string) => void;
  clearReplyComposition: (commentId: string) => void;

  // Reaction actions
  toggleReaction: (targetType: ReactionTargetType, targetId: string, reactionId: number) => Promise<boolean>;
  loadUserReaction: (targetType: ReactionTargetType, targetId: string) => Promise<void>;
  clearReactionsCache: () => void;

  // Saved posts actions
  toggleSavedPost: (postId: string, collectionName?: string) => Promise<boolean>;
  loadSavedPosts: (collectionName?: string, refresh?: boolean) => Promise<void>;
  loadMoreSavedPosts: () => Promise<void>;
  loadSavedCollections: () => Promise<void>;

  // Analytics actions
  recordPostView: (postId: string, viewDuration?: number) => Promise<void>;

  // Permission actions
  loadPermissions: (postId: string) => Promise<PostPermissions | null>;
  cachePermissions: (postId: string, permissions: PostPermissions) => void;

  // Media upload actions
  uploadMedia: (file: File, postId?: string) => Promise<string | null>;
  setMediaUploadProgress: (fileId: string, progress: MediaUploadProgress) => void;
  removeMediaUpload: (fileId: string) => void;
  clearMediaUploads: () => void;

  // Real-time subscription actions
  subscribeToComments: (postId: string) => void;
  unsubscribeFromComments: (postId: string) => void;
  unsubscribeAll: () => void;

  // Geographic actions
  setUserLocation: (coordinates: PostCoordinates) => void;
  clearUserLocation: () => void;

  // UI state actions
  setEditingPost: (postId: string | null) => void;
  setEditFormData: (data: PostUpdate | null) => void;
  resetEditForm: () => void;
  clearErrors: () => void;

  // Real-time event handler
  handleRealtimeEvent: (event: PostRealtimeEvent) => void;

  // Optimistic update helpers
  updatePostOptimistic: (postId: string, updates: Partial<PublicPost>) => void;
  revertPostOptimistic: (postId: string, originalPost: PublicPost) => void;
  updateCommentOptimistic: (commentId: string, updates: Partial<PublicComment>) => void;
  revertCommentOptimistic: (commentId: string, originalComment: PublicComment) => void;
}

type PostStore = PostState & PostActions;

// Initial state
const initialState: PostState = {
  postCache: new Map(),
  postCacheLoading: new Set(),
  postCacheErrors: new Map(),

  commentsCache: new Map(),
  commentsLoading: new Set(),
  commentsErrors: new Map(),
  commentsHasMore: new Map(),
  commentsPage: new Map(),

  userReactions: new Map(),
  reactionsLoading: new Set(),

  savedPosts: [],
  savedPostsLoading: false,
  savedPostsError: null,
  savedPostsHasMore: true,
  savedPostsPage: 1,
  savedCollections: ['default'],

  permissionsCache: new Map(),

  subscriptions: new Map(),
  isSubscribed: false,

  isCreatingPost: false,
  createPostError: null,
  editingPostId: null,
  editFormData: null,

  mediaUploads: new Map(),
  uploadingMedia: false,

  commentComposition: new Map(),
  replyComposition: new Map(),
  submittingComment: new Set(),

  userLocation: null,
  nearbyPosts: [],
  nearbyPostsLoading: false,
};

export const usePostStore = create<PostStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Post CRUD actions
        createPost: async (postData: PostCreate) => {
          set((state) => {
            state.isCreatingPost = true;
            state.createPostError = null;
          });

          const result = await PostService.createPost(postData);

          set((state) => {
            state.isCreatingPost = false;
            if (result.success && result.data) {
              // Add to cache if successful
              const publicPost: PublicPost = {
                ...result.data,
                author_username: null, // Will be populated by real-time or separate fetch
                author_full_name: null,
                author_avatar_url: null,
                user_has_liked: false,
                user_has_saved: false,
              };
              state.postCache.set(publicPost.id, publicPost);
              state.createPostError = null;
            } else {
              state.createPostError = result.error || 'Failed to create post';
            }
          });

          return result.success;
        },

        updatePost: async (postId: string, updates: PostUpdate) => {
          const originalPost = get().postCache.get(postId);

          // Optimistic update
          if (originalPost) {
            get().updatePostOptimistic(postId, updates);
          }

          const result = await PostService.updatePost(postId, updates);

          if (result.success && result.data) {
            // Update cache with real data
            const updatedPost: PublicPost = {
              ...result.data,
              author_username: originalPost?.author_username || null,
              author_full_name: originalPost?.author_full_name || null,
              author_avatar_url: originalPost?.author_avatar_url || null,
              user_has_liked: originalPost?.user_has_liked || false,
              user_has_saved: originalPost?.user_has_saved || false,
            };
            get().cachePost(updatedPost);
            
            return true;
          } else {
            // Revert optimistic update
            if (originalPost) {
              get().revertPostOptimistic(postId, originalPost);
            }
            return false;
          }
        },

        deletePost: async (postId: string) => {
          const result = await PostService.deletePost(postId);

          if (result.success) {
            set((state) => {
              // Remove from cache
              state.postCache.delete(postId);
              // Remove comments
              state.commentsCache.delete(postId);
            });
            return true;
          }

          return false;
        },

        // Cache actions
        cachePost: (post: PublicPost) => {
          set((state) => {
            state.postCache.set(post.id, post);
          });
        },

        removeFromPostCache: (postId: string) => {
          set((state) => {
            state.postCache.delete(postId);
          });
        },

        clearPostCache: () => {
          set((state) => {
            state.postCache.clear();
            state.postCacheLoading.clear();
            state.postCacheErrors.clear();
          });
        },

        // Comment actions
        loadComments: async (postId: string, refresh: boolean = false) => {
          if (refresh) {
            set((state) => {
              state.commentsPage.set(postId, 1);
              state.commentsHasMore.set(postId, true);
              state.commentsCache.delete(postId);
            });
          }

          set((state) => {
            state.commentsLoading.add(postId);
            state.commentsErrors.delete(postId);
          });

          const page = get().commentsPage.get(postId) || 1;
          const result = await PostService.getPostComments(postId, page, POST_CONSTANTS.DEFAULT_PAGE_SIZE);

          set((state) => {
            state.commentsLoading.delete(postId);
            if (result.success && result.data) {
              const existingComments = state.commentsCache.get(postId) || [];
              if (refresh || page === 1) {
                state.commentsCache.set(postId, result.data.comments);
              } else {
                state.commentsCache.set(postId, [...existingComments, ...result.data.comments]);
              }
              state.commentsHasMore.set(postId, result.data.has_more);
              state.commentsErrors.delete(postId);
            } else {
              state.commentsErrors.set(postId, result.error || 'Failed to load comments');
            }
          });
        },

        loadMoreComments: async (postId: string) => {
          const hasMore = get().commentsHasMore.get(postId);
          const loading = get().commentsLoading.has(postId);
          
          if (!hasMore || loading) return;

          const currentPage = get().commentsPage.get(postId) || 1;
          set((state) => {
            state.commentsPage.set(postId, currentPage + 1);
          });

          await get().loadComments(postId, false);
        },

        createComment: async (postId: string, content: string, parentCommentId?: string) => {
          set((state) => {
            state.submittingComment.add(postId);
          });

          const commentData: CommentCreate = {
            post_id: postId,
            author_id: '', // Will be set by service
            content,
            parent_comment_id: parentCommentId || null,
          };

          const result = await PostService.createComment(commentData);

          set((state) => {
            state.submittingComment.delete(postId);
            if (result.success) {
              // Clear comment composition
              state.commentComposition.delete(postId);
              // Refresh comments to get the new one
              // Note: In real implementation, you might want to optimistically add the comment
            }
          });

          return result.success;
        },

        updateComment: async (commentId: string, updates: CommentUpdate) => {
          const result = await PostService.updateComment(commentId, updates);
          
          if (result.success) {
            // Find and update comment in cache
            set((state) => {
              for (const [postId, comments] of state.commentsCache) {
                const commentIndex = comments.findIndex(c => c.id === commentId);
                if (commentIndex !== -1) {
                  Object.assign(comments[commentIndex], updates);
                  break;
                }
              }
            });
          }

          return result.success;
        },

        deleteComment: async (commentId: string) => {
          const result = await PostService.deleteComment(commentId);

          if (result.success) {
            // Remove comment from cache
            set((state) => {
              for (const [postId, comments] of state.commentsCache) {
                const filteredComments = comments.filter(c => c.id !== commentId);
                if (filteredComments.length !== comments.length) {
                  state.commentsCache.set(postId, filteredComments);
                  break;
                }
              }
            });
          }

          return result.success;
        },

        // Comment composition actions
        setCommentComposition: (postId: string, content: string) => {
          set((state) => {
            state.commentComposition.set(postId, content);
          });
        },

        setReplyComposition: (commentId: string, content: string) => {
          set((state) => {
            state.replyComposition.set(commentId, content);
          });
        },

        clearCommentComposition: (postId: string) => {
          set((state) => {
            state.commentComposition.delete(postId);
          });
        },

        clearReplyComposition: (commentId: string) => {
          set((state) => {
            state.replyComposition.delete(commentId);
          });
        },

        // Reaction actions
        toggleReaction: async (targetType: ReactionTargetType, targetId: string, reactionId: number) => {
          const currentReaction = get().userReactions.get(targetId);
          
          // Optimistic update
          set((state) => {
            if (currentReaction && currentReaction.reaction_id === reactionId) {
              // Remove reaction
              state.userReactions.delete(targetId);
              
              // Update post/comment counts optimistically
              if (targetType === 'POST') {
                const post = state.postCache.get(targetId);
                if (post) {
                  post.like_count = Math.max(0, (post.like_count || 0) - 1);
                  post.user_has_liked = false;
                }
              }
            } else {
              // Add/change reaction
              const newReaction: PostReaction = {
                id: `temp-${Date.now()}`,
                user_id: '', // Will be set properly by service
                target_type: targetType,
                target_id: targetId,
                reaction_id: reactionId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              state.userReactions.set(targetId, newReaction);
              
              // Update post/comment counts optimistically
              if (targetType === 'POST') {
                const post = state.postCache.get(targetId);
                if (post) {
                  if (!currentReaction) {
                    post.like_count = (post.like_count || 0) + 1;
                  }
                  post.user_has_liked = true;
                }
              }
            }
          });

          const result = await PostService.toggleReaction(targetType, targetId, reactionId);

          if (!result.success) {
            // Revert optimistic update
            set((state) => {
              if (currentReaction) {
                state.userReactions.set(targetId, currentReaction);
              } else {
                state.userReactions.delete(targetId);
              }
              
              // Revert post/comment counts
              if (targetType === 'POST') {
                const post = state.postCache.get(targetId);
                if (post) {
                  // Re-fetch to get accurate counts
                  // Or implement more sophisticated revert logic
                }
              }
            });
          }

          return result.success;
        },

        loadUserReaction: async (targetType: ReactionTargetType, targetId: string) => {
          const result = await PostService.getUserReaction(targetType, targetId);
          
          if (result.success) {
            set((state) => {
              if (result.data) {
                state.userReactions.set(targetId, result.data);
              } else {
                state.userReactions.delete(targetId);
              }
            });
          }
        },

        clearReactionsCache: () => {
          set((state) => {
            state.userReactions.clear();
            state.reactionsLoading.clear();
          });
        },

        // Saved posts actions
        toggleSavedPost: async (postId: string, collectionName: string = 'default') => {
          const result = await PostService.toggleSavedPost(postId, collectionName);

          if (result.success) {
            set((state) => {
              // Update user_has_saved in cache
              const post = state.postCache.get(postId);
              if (post) {
                post.user_has_saved = result.data || false;
              }
              // If unsaved, remove from saved posts list
              if (!result.data) {
                state.savedPosts = state.savedPosts.filter(p => p.id !== postId);
              }
            });
          }

          return result.success;
        },

        loadSavedPosts: async (collectionName?: string, refresh: boolean = false) => {
          if (refresh) {
            set((state) => {
              state.savedPostsPage = 1;
              state.savedPostsHasMore = true;
              state.savedPosts = [];
            });
          }

          set((state) => {
            state.savedPostsLoading = true;
            state.savedPostsError = null;
          });

          const result = await PostService.getSavedPosts(collectionName, get().savedPostsPage, POST_CONSTANTS.DEFAULT_PAGE_SIZE);

          set((state) => {
            state.savedPostsLoading = false;
            if (result.success && result.data) {
              if (refresh || state.savedPostsPage === 1) {
                state.savedPosts = result.data.posts;
              } else {
                state.savedPosts.push(...result.data.posts);
              }
              state.savedPostsHasMore = result.data.has_more;
              state.savedPostsError = null;
            } else {
              state.savedPostsError = result.error || 'Failed to load saved posts';
            }
          });
        },

        loadMoreSavedPosts: async () => {
          const { savedPostsHasMore, savedPostsLoading } = get();
          if (!savedPostsHasMore || savedPostsLoading) return;

          set((state) => {
            state.savedPostsPage += 1;
          });

          await get().loadSavedPosts(undefined, false);
        },

        loadSavedCollections: async () => {
          // This would need to be implemented in the service
          // For now, just keep the default collection
          set((state) => {
            state.savedCollections = ['default'];
          });
        },

        // Analytics actions
        recordPostView: async (postId: string, viewDuration?: number) => {
          await PostService.recordPostView(postId, viewDuration);
        },

        // Real-time subscription actions
        subscribeToComments: (postId: string) => {
          const channelName = `post-${postId}`;
          if (get().subscriptions.has(channelName)) return;

          const subscription = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
              },
              (payload) => {
                // Handle comment changes
                if (payload.eventType === 'INSERT' && payload.new) {
                  // Optionally add new comment to cache
                }
              }
            )
            .subscribe();

          set((state) => {
            state.subscriptions.set(channelName, subscription);
          });
        },

        unsubscribeFromComments: (postId: string) => {
          const channelName = `post-${postId}`;
          const subscription = get().subscriptions.get(channelName);
          if (subscription) {
            supabase.removeChannel(subscription);
            set((state) => {
              state.subscriptions.delete(channelName);
            });
          }
        },

        unsubscribeAll: () => {
          const subscriptions = get().subscriptions;
          subscriptions.forEach(subscription => {
            supabase.removeChannel(subscription);
          });
          set((state) => {
            state.subscriptions.clear();
            state.isSubscribed = false;
          });
        },

        // Helper method to handle real-time events
        handleRealtimeEvent: (event: PostRealtimeEvent) => {
          if (event.table === 'posts' && event.new_record) {
            if (event.event_type === 'INSERT') {
              // Add new post to cache
              const newPost = event.new_record as any;
              const publicPost: PublicPost = {
                ...newPost,
                author_username: null,
                author_full_name: null,
                author_avatar_url: null,
                user_has_liked: false,
                user_has_saved: false,
              };
              
              set((state) => {
                state.postCache.set(publicPost.id, publicPost);
              });
            } else if (event.event_type === 'UPDATE') {
              // Update existing post in cache
              const updatedPost = event.new_record as any;
              set((state) => {
                const cachedPost = state.postCache.get(updatedPost.id);
                if (cachedPost) {
                  Object.assign(cachedPost, updatedPost);
                }
              });
            } else if (event.event_type === 'DELETE' && event.old_record) {
              // Remove deleted post from cache
              const deletedPostId = event.old_record.id;
              set((state) => {
                state.postCache.delete(deletedPostId);
              });
            }
          }
        },

        // Geographic actions
        setUserLocation: (coordinates: PostCoordinates) => {
          set((state) => {
            state.userLocation = coordinates;
          });
        },

        clearUserLocation: () => {
          set((state) => {
            state.userLocation = null;
            state.nearbyPosts = [];
          });
        },

        // Permission actions
        loadPermissions: async (postId: string) => {
          // This would need to be implemented based on your permission system
          const permissions: PostPermissions = {
            can_view: true,
            can_edit: false,
            can_delete: false,
            can_comment: true,
            can_react: true,
            can_share: true,
            can_moderate: false,
          };
          
          get().cachePermissions(postId, permissions);
          return permissions;
        },

        cachePermissions: (postId: string, permissions: PostPermissions) => {
          set((state) => {
            state.permissionsCache.set(postId, permissions);
          });
        },

        // Media upload actions
        uploadMedia: async (file: File, postId?: string) => {
          const fileId = `${Date.now()}-${file.name}`;
          
          set((state) => {
            state.uploadingMedia = true;
            state.mediaUploads.set(fileId, {
              file_name: file.name,
              progress: 0,
              uploaded_bytes: 0,
              total_bytes: file.size
            });
          });

          try {
            // TODO: Implement actual media upload
            // For now, simulate upload
            for (let progress = 0; progress <= 100; progress += 10) {
              await new Promise(resolve => setTimeout(resolve, 100));
              set((state) => {
                const upload = state.mediaUploads.get(fileId);
                if (upload) {
                  upload.progress = progress;
                  upload.uploaded_bytes = Math.round((progress / 100) * upload.total_bytes);
                  if (progress === 100) {
                    upload.url = `https://example.com/media/${fileId}`;
                  }
                }
              });
            }
            
            return `https://example.com/media/${fileId}`;
          } catch (error) {
            set((state) => {
              const upload = state.mediaUploads.get(fileId);
              if (upload) {
                upload.error = error instanceof Error ? error.message : 'Upload failed';
              }
            });
            return null;
          } finally {
            set((state) => {
              state.uploadingMedia = false;
            });
          }
        },

        setMediaUploadProgress: (fileId: string, progress: MediaUploadProgress) => {
          set((state) => {
            state.mediaUploads.set(fileId, progress);
          });
        },

        removeMediaUpload: (fileId: string) => {
          set((state) => {
            state.mediaUploads.delete(fileId);
          });
        },

        clearMediaUploads: () => {
          set((state) => {
            state.mediaUploads.clear();
            state.uploadingMedia = false;
          });
        },

        // UI state actions
        setEditingPost: (postId: string | null) => {
          set((state) => {
            state.editingPostId = postId;
          });
        },

        setEditFormData: (data: PostUpdate | null) => {
          set((state) => {
            state.editFormData = data;
          });
        },

        resetEditForm: () => {
          set((state) => {
            state.editingPostId = null;
            state.editFormData = null;
          });
        },

        clearErrors: () => {
          set((state) => {
            state.createPostError = null;
            state.savedPostsError = null;
            state.postCacheErrors.clear();
            state.commentsErrors.clear();
          });
        },

        // Optimistic update helpers
        updatePostOptimistic: (postId: string, updates: Partial<PublicPost>) => {
          set((state) => {
            const post = state.postCache.get(postId);
            if (post) {
              Object.assign(post, updates);
            }
          });
        },

        revertPostOptimistic: (postId: string, originalPost: PublicPost) => {
          set((state) => {
            state.postCache.set(postId, originalPost);
          });
        },

        updateCommentOptimistic: (commentId: string, updates: Partial<PublicComment>) => {
          set((state) => {
            for (const comments of state.commentsCache.values()) {
              const comment = comments.find(c => c.id === commentId);
              if (comment) {
                Object.assign(comment, updates);
                break;
              }
            }
          });
        },

        revertCommentOptimistic: (commentId: string, originalComment: PublicComment) => {
          set((state) => {
            for (const comments of state.commentsCache.values()) {
              const commentIndex = comments.findIndex(c => c.id === commentId);
              if (commentIndex !== -1) {
                comments[commentIndex] = originalComment;
                break;
              }
            }
          });
        },
      })),
      {
        name: 'post-store',
        partialize: (state) => ({
          // Only persist UI preferences, not data
          userLocation: state.userLocation,
          savedCollections: state.savedCollections,
        }),
      }
    ),
    {
      name: 'post-store',
    }
  )
);

// Convenience hooks for specific parts of the store
export const usePostCache = () => usePostStore(state => state.postCache);
export const useCommentsCache = () => usePostStore(state => state.commentsCache);
export const useUserReactions = () => usePostStore(state => state.userReactions);
export const useSavedPosts = () => usePostStore(state => state.savedPosts);
export const useMediaUploads = () => usePostStore(state => state.mediaUploads);
export const useCommentComposition = () => usePostStore(state => state.commentComposition);
export const useReplyComposition = () => usePostStore(state => state.replyComposition);
export const useUserLocation = () => usePostStore(state => state.userLocation);
export const useNearbyPosts = () => usePostStore(state => state.nearbyPosts);

// Convenience hook for getting a specific post
export const usePost = (postId: string) => usePostStore(state => state.postCache.get(postId));

// Convenience hook for getting comments for a specific post
export const usePostComments = (postId: string) => usePostStore(state => state.commentsCache.get(postId) || []);

// Convenience hook for getting user's reaction to a specific target
export const useUserReaction = (targetId: string) => usePostStore(state => state.userReactions.get(targetId));

// Convenience hook for checking if user has saved a post
export const useIsPostSaved = (postId: string) => usePostStore(state => {
  const post = state.postCache.get(postId);
  return post?.user_has_saved || false;
});

// Convenience hook for checking if user has liked a post
export const useIsPostLiked = (postId: string) => usePostStore(state => {
  const post = state.postCache.get(postId);
  return post?.user_has_liked || false;
});