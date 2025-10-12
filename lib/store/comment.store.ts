/**
 * Comment Store
 * 
 * Zustand store for comment state management with real-time updates
 * Handles optimistic updates, caching, and Supabase real-time subscriptions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { CommentService, type CommentsResponse } from '@/lib/service/comment.service';
import type { PublicComment, CommentCreate, CommentUpdate } from '@/lib/schema/post.types';

// Enable Map and Set support for Immer
enableMapSet();

// Store state interface
interface CommentState {
    // Comments cache by post ID
    commentsByPost: Map<string, PublicComment[]>;
    commentsLoading: Set<string>; // postIds currently loading
    commentsError: Map<string, string>; // postId -> error message
    
    // Pagination state
    commentsPagination: Map<string, { page: number; hasMore: boolean; totalCount: number }>;
    
    // Submission state
    submittingComments: Set<string>; // postIds with comments being submitted
    submittingReplies: Set<string>; // commentIds with replies being submitted
    
    // Editing state
    editingComment: string | null;
    editingContent: string | null;
    
    // Composition (unsent text)
    commentComposition: Map<string, string>; // postId -> comment text
    replyComposition: Map<string, string>; // commentId -> reply text
    
    // Real-time subscriptions
    subscriptions: Map<string, any>; // postId -> channel
    reactionSubscriptions: Map<string, any>; // commentId -> channel
    
    // Optimistic updates tracking
    optimisticComments: Map<string, PublicComment>; // tempId -> comment
}

// Store actions interface
interface CommentActions {
    // Comment CRUD
    loadComments: (postId: string, page?: number) => Promise<void>;
    loadMoreComments: (postId: string) => Promise<void>;
    refreshComments: (postId: string) => Promise<void>;
    createComment: (postId: string, content: string, parentCommentId?: string) => Promise<boolean>;
    updateComment: (commentId: string, updates: CommentUpdate) => Promise<boolean>;
    deleteComment: (commentId: string) => Promise<boolean>;
    
    // Optimistic updates
    addOptimisticComment: (postId: string, content: string, parentCommentId?: string) => string;
    removeOptimisticComment: (tempId: string) => void;
    updateCommentInCache: (postId: string, commentId: string, updates: Partial<PublicComment>) => void;
    removeCommentFromCache: (postId: string, commentId: string) => void;
    
    // Reactions
    toggleCommentReaction: (postId: string, commentId: string, reactionId: number) => Promise<boolean>;
    
    // Composition helpers
    setCommentComposition: (postId: string, content: string) => void;
    clearCommentComposition: (postId: string) => void;
    setReplyComposition: (commentId: string, content: string) => void;
    clearReplyComposition: (commentId: string) => void;
    
    // Editing
    startEditingComment: (commentId: string, currentContent: string) => void;
    cancelEditingComment: () => void;
    
    // Real-time subscriptions
    subscribeToComments: (postId: string) => void;
    unsubscribeFromComments: (postId: string) => void;
    subscribeToCommentReactions: (commentId: string) => void;
    unsubscribeFromCommentReactions: (commentId: string) => void;
    unsubscribeAll: () => void;
    
    // Cache management
    clearCommentsCache: (postId?: string) => void;
    clearErrors: () => void;
}

type CommentStore = CommentState & CommentActions;

// Initial state
const initialState: CommentState = {
    commentsByPost: new Map(),
    commentsLoading: new Set(),
    commentsError: new Map(),
    commentsPagination: new Map(),
    submittingComments: new Set(),
    submittingReplies: new Set(),
    editingComment: null,
    editingContent: null,
    commentComposition: new Map(),
    replyComposition: new Map(),
    subscriptions: new Map(),
    reactionSubscriptions: new Map(),
    optimisticComments: new Map(),
};

export const useCommentStore = create<CommentStore>()(
    devtools(
        immer((set, get) => ({
            // Initialize state directly instead of spreading initialState to avoid Map recreation
            commentsByPost: new Map<string, PublicComment[]>(),
            commentsLoading: new Set<string>(),
            commentsError: new Map<string, string>(),
            commentsPagination: new Map<string, { page: number; hasMore: boolean; totalCount: number }>(),
            submittingComments: new Set<string>(),
            submittingReplies: new Set<string>(),
            editingComment: null,
            editingContent: null,
            commentComposition: new Map<string, string>(),
            replyComposition: new Map<string, string>(),
            subscriptions: new Map<string, any>(),
            reactionSubscriptions: new Map<string, any>(),
            optimisticComments: new Map<string, PublicComment>(),

            // ========== COMMENT LOADING ==========

                loadComments: async (postId: string, page: number = 1) => {
                    set((state) => {
                        state.commentsLoading.add(postId);
                        state.commentsError.delete(postId);
                    });

                    try {
                        const result = await CommentService.getCommentsByPostId(postId, page);

                        set((state) => {
                            state.commentsLoading.delete(postId);
                            
                            if (result.success && result.data) {
                                // Replace comments if it's page 1, otherwise append
                                if (page === 1) {
                                    state.commentsByPost.set(postId, result.data.comments);
                                } else {
                                    const existing = state.commentsByPost.get(postId);
                                    if (existing) {
                                        state.commentsByPost.set(postId, [...existing, ...result.data.comments]);
                                    } else {
                                        state.commentsByPost.set(postId, result.data.comments);
                                    }
                                }
                                
                                state.commentsPagination.set(postId, {
                                    page: result.data.page,
                                    hasMore: result.data.has_more,
                                    totalCount: result.data.total_count
                                });
                                state.commentsError.delete(postId);
                            } else {
                                state.commentsError.set(postId, result.error || 'Failed to load comments');
                            }
                        });
                    } catch (error) {
                        set((state) => {
                            state.commentsLoading.delete(postId);
                            state.commentsError.set(postId, error instanceof Error ? error.message : 'Unknown error');
                        });
                    }
                },

                loadMoreComments: async (postId: string) => {
                    const pagination = get().commentsPagination.get(postId);
                    if (!pagination || !pagination.hasMore) return;

                    await get().loadComments(postId, pagination.page + 1);
                },

                refreshComments: async (postId: string) => {
                    await get().loadComments(postId, 1);
                },

                // ========== COMMENT CRUD ==========

                createComment: async (postId: string, content: string, parentCommentId?: string) => {
                    const tempId = `temp-${Date.now()}`;
                    
                    // Add optimistic comment
                    get().addOptimisticComment(postId, content, parentCommentId);
                    
                    set((state) => {
                        if (parentCommentId) {
                            state.submittingReplies.add(parentCommentId);
                        } else {
                            state.submittingComments.add(postId);
                        }
                    });

                    try {
                        const commentData: CommentCreate = {
                            post_id: postId,
                            author_id: '', // Will be set by service
                            content,
                            parent_comment_id: parentCommentId || null,
                        };

                        const result = await CommentService.createComment(commentData);

                        set((state) => {
                            if (parentCommentId) {
                                state.submittingReplies.delete(parentCommentId);
                            } else {
                                state.submittingComments.delete(postId);
                            }
                        });

                        if (result.success && result.data) {
                            // Remove optimistic comment
                            get().removeOptimisticComment(tempId);
                            
                            // Add real comment to cache with type safety
                            set((state) => {
                                const comments = state.commentsByPost.get(postId);
                                const newComment = result.data!; // We know it exists from the check above
                                // Add to beginning (newest first)
                                if (comments) {
                                    state.commentsByPost.set(postId, [newComment, ...comments]);
                                } else {
                                    state.commentsByPost.set(postId, [newComment]);
                                }
                                
                                // Update pagination
                                const pagination = state.commentsPagination.get(postId);
                                if (pagination) {
                                    pagination.totalCount++;
                                }
                            });

                            return true;
                        } else {
                            // Remove optimistic comment on error
                            get().removeOptimisticComment(tempId);
                            return false;
                        }
                    } catch (error) {
                        set((state) => {
                            if (parentCommentId) {
                                state.submittingReplies.delete(parentCommentId);
                            } else {
                                state.submittingComments.delete(postId);
                            }
                        });
                        
                        // Remove optimistic comment on error
                        get().removeOptimisticComment(tempId);
                        return false;
                    }
                },

                updateComment: async (commentId: string, updates: CommentUpdate) => {
                    try {
                        // Find the post this comment belongs to
                        let postId: string | null = null;
                        for (const [pid, comments] of get().commentsByPost) {
                            if (comments.some(c => c.id === commentId)) {
                                postId = pid;
                                break;
                            }
                        }

                        if (!postId) {
                            console.error('Comment not found in cache');
                            return false;
                        }

                        // Optimistic update
                        get().updateCommentInCache(postId, commentId, updates);

                        const result = await CommentService.updateComment(commentId, updates);

                        if (result.success && result.data) {
                            // Update with server data
                            get().updateCommentInCache(postId, commentId, result.data);
                            return true;
                        } else {
                            // Revert optimistic update - would need original data
                            return false;
                        }
                    } catch (error) {
                        console.error('Failed to update comment:', error);
                        return false;
                    }
                },

                deleteComment: async (commentId: string) => {
                    try {
                        // Try to find the post this comment belongs to in the cache
                        let postId: string | null = null;
                        for (const [pid, comments] of get().commentsByPost) {
                            if (comments.some(c => c.id === commentId)) {
                                postId = pid;
                                break;
                            }
                        }

                        if (postId) {
                            // Optimistic remove from that post's cache
                            get().removeCommentFromCache(postId, commentId);
                        } else {
                            // Not found in per-post cache; log and continue — we'll attempt server delete anyway
                            console.warn('deleteComment: comment not found in per-post cache, will attempt server delete anyway', commentId);
                        }

                        const result = await CommentService.deleteComment(commentId);

                        if (result.success) {
                            // Ensure comment is removed from all caches (in case of stale indexing)
                            set((state) => {
                                for (const [pid, comments] of state.commentsByPost) {
                                    state.commentsByPost.set(
                                        pid,
                                        comments.filter(c => c.id !== commentId)
                                    );
                                }
                            });

                            return true;
                        } else {
                            // If server-side delete failed, we should log the error so maintainers can inspect
                            console.error('Server failed to delete comment:', result.error, commentId);

                            // Optionally restore optimistic deletion if we removed it earlier
                            // (Restoration requires original data; user experience will prompt refresh)
                            return false;
                        }
                    } catch (error) {
                        console.error('Failed to delete comment (unexpected):', error, commentId);
                        return false;
                    }
                },

                // ========== OPTIMISTIC UPDATES ==========

                addOptimisticComment: (postId: string, content: string, parentCommentId?: string) => {
                    const tempId = `temp-${Date.now()}`;
                    const now = new Date().toISOString();
                    
                    const optimisticComment: PublicComment = {
                        id: tempId,
                        post_id: postId,
                        author_id: 'temp',
                        parent_comment_id: parentCommentId || null,
                        content,
                        thread_level: 0,
                        thread_path: null,
                        like_count: 0,
                        reply_count: 0,
                        status: 'PUBLISHED',
                        is_pinned: false,
                        is_highlighted: false,
                        created_at: now,
                        updated_at: now,
                        author_username: 'You',
                        author_full_name: 'You',
                        author_avatar_url: null,
                        author_is_verified: false,
                        author_reputation_score: 0,
                        user_has_liked: false,
                    };

                    set((state) => {
                        state.optimisticComments.set(tempId, optimisticComment);
                        
                        // Add to comments list
                        const comments = state.commentsByPost.get(postId);
                        if (comments) {
                            state.commentsByPost.set(postId, [optimisticComment, ...comments]);
                        } else {
                            state.commentsByPost.set(postId, [optimisticComment]);
                        }
                    });

                    return tempId;
                },

                removeOptimisticComment: (tempId: string) => {
                    set((state) => {
                        const optimisticComment = state.optimisticComments.get(tempId);
                        if (optimisticComment) {
                            // Remove from optimistic tracking
                            state.optimisticComments.delete(tempId);
                            
                            // Remove from comments list
                            const postId = optimisticComment.post_id;
                            const comments = state.commentsByPost.get(postId);
                            if (comments) {
                                state.commentsByPost.set(
                                    postId,
                                    comments.filter(c => c.id !== tempId)
                                );
                            }
                        }
                    });
                },

                updateCommentInCache: (postId: string, commentId: string, updates: Partial<PublicComment>) => {
                    set((state) => {
                        const comments = state.commentsByPost.get(postId);
                        if (comments) {
                            const comment = comments.find(c => c.id === commentId);
                            if (comment) {
                                Object.assign(comment, updates);
                            }
                        }
                    });
                },

                removeCommentFromCache: (postId: string, commentId: string) => {
                    set((state) => {
                        const comments = state.commentsByPost.get(postId);
                        if (comments) {
                            state.commentsByPost.set(
                                postId,
                                comments.filter(c => c.id !== commentId)
                            );
                            
                            // Update pagination
                            const pagination = state.commentsPagination.get(postId);
                            if (pagination) {
                                pagination.totalCount = Math.max(0, pagination.totalCount - 1);
                            }
                        }
                    });
                },

                // ========== REACTIONS ==========

                toggleCommentReaction: async (postId: string, commentId: string, reactionId: number) => {
                    try {
                        const result = await CommentService.toggleCommentReaction(commentId, reactionId);

                        if (result.success) {
                            // Update comment reaction count optimistically
                            get().updateCommentInCache(postId, commentId, {
                                like_count: result.data ? 
                                    (get().commentsByPost.get(postId)?.find(c => c.id === commentId)?.like_count || 0) + 1 :
                                    Math.max(0, (get().commentsByPost.get(postId)?.find(c => c.id === commentId)?.like_count || 0) - 1),
                                user_has_liked: result.data || false
                            });
                            
                            return true;
                        }
                        
                        return false;
                    } catch (error) {
                        console.error('Failed to toggle comment reaction:', error);
                        return false;
                    }
                },

                // ========== COMPOSITION ==========

                setCommentComposition: (postId: string, content: string) => {
                    set((state) => {
                        state.commentComposition.set(postId, content);
                    });
                },

                clearCommentComposition: (postId: string) => {
                    set((state) => {
                        state.commentComposition.delete(postId);
                    });
                },

                setReplyComposition: (commentId: string, content: string) => {
                    set((state) => {
                        state.replyComposition.set(commentId, content);
                    });
                },

                clearReplyComposition: (commentId: string) => {
                    set((state) => {
                        state.replyComposition.delete(commentId);
                    });
                },

                // ========== EDITING ==========

                startEditingComment: (commentId: string, currentContent: string) => {
                    set((state) => {
                        state.editingComment = commentId;
                        state.editingContent = currentContent;
                    });
                },

                cancelEditingComment: () => {
                    set((state) => {
                        state.editingComment = null;
                        state.editingContent = null;
                    });
                },

                // ========== REAL-TIME SUBSCRIPTIONS ==========

                subscribeToComments: (postId: string) => {
                    // Don't subscribe if already subscribed
                    if (get().subscriptions.has(postId)) {
                        return;
                    }

                    const channel = CommentService.subscribeToPostComments(
                        postId,
                        // On INSERT
                        async (newComment) => {
                            // Fetch full comment with profile data
                            const result = await CommentService.getCommentById(newComment.id);
                            if (result.success && result.data) {
                                const newCommentData = result.data;
                                set((state) => {
                                    const comments = state.commentsByPost.get(postId);
                                    
                                    // Check if comment already exists (to avoid duplicates)
                                    if (comments && !comments.some(c => c.id === newCommentData.id)) {
                                        // Add to beginning (newest first)
                                        state.commentsByPost.set(postId, [newCommentData, ...comments]);
                                        
                                        // Update pagination
                                        const pagination = state.commentsPagination.get(postId);
                                        if (pagination) {
                                            pagination.totalCount++;
                                        }
                                    } else if (!comments) {
                                        // First comment for this post
                                        state.commentsByPost.set(postId, [newCommentData]);
                                        
                                        // Update pagination
                                        const pagination = state.commentsPagination.get(postId);
                                        if (pagination) {
                                            pagination.totalCount = 1;
                                        }
                                    }
                                });
                            }
                        },
                        // On UPDATE
                        (updatedComment) => {
                            get().updateCommentInCache(postId, updatedComment.id, updatedComment);
                        },
                        // On DELETE
                        (deletedComment) => {
                            get().removeCommentFromCache(postId, deletedComment.id);
                        }
                    );

                    set((state) => {
                        state.subscriptions.set(postId, channel);
                    });
                },

                unsubscribeFromComments: (postId: string) => {
                    const channel = get().subscriptions.get(postId);
                    if (channel) {
                        CommentService.unsubscribe(channel);
                        set((state) => {
                            state.subscriptions.delete(postId);
                        });
                    }
                },

                subscribeToCommentReactions: (commentId: string) => {
                    // Don't subscribe if already subscribed
                    if (get().reactionSubscriptions.has(commentId)) {
                        return;
                    }

                    const channel = CommentService.subscribeToCommentReactions(
                        commentId,
                        async () => {
                            // Reload reactions for this comment
                            // This is a simple approach; could be optimized
                            // Find the post this comment belongs to
                            for (const [postId, comments] of get().commentsByPost) {
                                const comment = comments.find(c => c.id === commentId);
                                if (comment) {
                                    // Reload the comment
                                    const result = await CommentService.getCommentById(commentId);
                                    if (result.success && result.data) {
                                        get().updateCommentInCache(postId, commentId, result.data);
                                    }
                                    break;
                                }
                            }
                        }
                    );

                    set((state) => {
                        state.reactionSubscriptions.set(commentId, channel);
                    });
                },

                unsubscribeFromCommentReactions: (commentId: string) => {
                    const channel = get().reactionSubscriptions.get(commentId);
                    if (channel) {
                        CommentService.unsubscribe(channel);
                        set((state) => {
                            state.reactionSubscriptions.delete(commentId);
                        });
                    }
                },

                unsubscribeAll: () => {
                    const state = get();
                    
                    // Unsubscribe from all comment subscriptions
                    state.subscriptions.forEach(channel => {
                        CommentService.unsubscribe(channel);
                    });
                    
                    // Unsubscribe from all reaction subscriptions
                    state.reactionSubscriptions.forEach(channel => {
                        CommentService.unsubscribe(channel);
                    });

                    set((state) => {
                        state.subscriptions.clear();
                        state.reactionSubscriptions.clear();
                    });
                },

                // ========== CACHE MANAGEMENT ==========

                clearCommentsCache: (postId?: string) => {
                    set((state) => {
                        if (postId) {
                            state.commentsByPost.delete(postId);
                            state.commentsPagination.delete(postId);
                            state.commentsError.delete(postId);
                        } else {
                            state.commentsByPost.clear();
                            state.commentsPagination.clear();
                            state.commentsError.clear();
                        }
                    });
                },

                clearErrors: () => {
                    set((state) => {
                        state.commentsError.clear();
                    });
                },
            })),
        {
            name: 'comment-store',
        }
    )
);

// Convenience hooks - CRITICAL: These must return stable references to prevent infinite loops
// Create stable empty values outside the selectors to avoid creating new references
const EMPTY_COMMENTS: PublicComment[] = [];
const EMPTY_STRING = '';

export const useCommentsForPost = (postId: string) => {
    return useCommentStore(state => {
        const comments = state.commentsByPost.get(postId);
        return comments ?? EMPTY_COMMENTS; // Use nullish coalescing with stable reference
    });
};

export const useCommentsLoading = (postId: string) => 
    useCommentStore(state => state.commentsLoading.has(postId));

export const useCommentsError = (postId: string) => 
    useCommentStore(state => state.commentsError.get(postId) ?? null);

export const useCommentsPagination = (postId: string) => 
    useCommentStore(state => state.commentsPagination.get(postId) ?? undefined);

export const useCommentComposition = (postId: string) => 
    useCommentStore(state => state.commentComposition.get(postId) ?? EMPTY_STRING);

export const useReplyComposition = (commentId: string) => 
    useCommentStore(state => state.replyComposition.get(commentId) ?? EMPTY_STRING);
