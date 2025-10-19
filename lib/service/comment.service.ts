/**
 * Comment Service
 * 
 * Dedicated service for comment operations with real-time support
 * Handles threaded comments, replies, reactions, and real-time subscriptions
 */

import { createClient } from '@/lib/supabase/client';

// Get browser client (with cookie storage)
const supabase = createClient();
import type { 
    Comment, 
    CommentCreate, 
    CommentUpdate,
    PublicComment,
    PostOperationResult,
    ReactionTargetType
} from '@/lib/schema/post.types';

// Import constants
const POST_ERROR_CODES = {
    NOT_AUTHENTICATED: 'You must be logged in to perform this action',
    POST_NOT_FOUND: 'Post not found',
    INVALID_CONTENT: 'Invalid content',
    CONTENT_TOO_LONG: 'Content is too long',
    CANNOT_EDIT_POST: 'You do not have permission to edit this',
    CANNOT_DELETE_POST: 'You do not have permission to delete this',
} as const;

export interface CommentWithProfile extends Comment {
    author_username: string | null;
    author_full_name: string | null;
    author_avatar_url: string | null;
    author_is_verified: boolean;
    author_reputation_score: number;
    user_has_liked: boolean;
}

export interface CommentsResponse {
    comments: PublicComment[];
    total_count: number;
    has_more: boolean;
    page: number;
    per_page: number;
}

export interface CommentReactionSummary {
    reaction_id: number;
    reaction_name: string;
    emoji_unicode: string;
    count: number;
    user_reacted: boolean;
}

export class CommentService {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly MAX_PAGE_SIZE = 100;
    private static readonly MAX_COMMENT_LENGTH = 5000;
    private static readonly MAX_THREAD_DEPTH = 5;

    // ========== COMMENT CRUD OPERATIONS ==========

    /**
     * Create a new comment with validation
     */
    static async createComment(commentData: CommentCreate): Promise<PostOperationResult<PublicComment>> {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
            }

            // Validate comment data
            const validationResult = this.validateCommentCreate(commentData);
            if (!validationResult.success) {
                return validationResult as PostOperationResult<PublicComment>;
            }

            // Use the database function that includes proper validation
            const { data: commentId, error } = await supabase.rpc('create_comment', {
                p_post_id: commentData.post_id,
                p_content: commentData.content,
                p_parent_comment_id: commentData.parent_comment_id || null
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // Fetch the created comment with profile data
            const { data: newComment, error: fetchError } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles!inner(
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        reputation_score
                    )
                `)
                .eq('id', commentId)
                .single();

            if (fetchError || !newComment) {
                // Return basic comment structure if fetch fails
                return { 
                    success: true, 
                    data: {
                        id: commentId,
                        post_id: commentData.post_id,
                        author_id: user.id,
                        parent_comment_id: commentData.parent_comment_id || null,
                        content: commentData.content,
                        thread_level: 0,
                        thread_path: null,
                        like_count: 0,
                        reply_count: 0,
                        status: 'PUBLISHED',
                        is_pinned: false,
                        is_highlighted: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        author_username: null,
                        author_full_name: null,
                        author_avatar_url: null,
                        author_is_verified: false,
                        author_reputation_score: 0,
                        user_has_liked: false,
                    }
                };
            }

            // Transform to PublicComment
            const publicComment: PublicComment = {
                ...newComment,
                author_username: newComment.profiles?.username || null,
                author_full_name: newComment.profiles?.full_name || null,
                author_avatar_url: newComment.profiles?.avatar_url || null,
                author_is_verified: newComment.profiles?.is_verified || false,
                author_reputation_score: newComment.profiles?.reputation_score || 0,
                user_has_liked: false,
            };

            // Remove nested profiles object
            delete (publicComment as any).profiles;

            return { success: true, data: publicComment };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Get comments for a post with pagination and threading
     */
    static async getCommentsByPostId(
        postId: string,
        page: number = 1,
        perPage: number = CommentService.DEFAULT_PAGE_SIZE
    ): Promise<PostOperationResult<CommentsResponse>> {
        try {
            // Validate pagination
            if (page < 1) page = 1;
            if (perPage > this.MAX_PAGE_SIZE) perPage = this.MAX_PAGE_SIZE;

            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            const from = (page - 1) * perPage;
            const to = from + perPage - 1;

            // Get comments with profile data and user's like status
            let query = supabase
                .from('comments')
                .select(`
                    *,
                    profiles!inner(
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        reputation_score
                    )
                `, { count: 'exact' })
                .eq('post_id', postId)
                .neq('status', 'DELETED')
                .order('created_at', { ascending: false })
                .range(from, to);

            const { data, error, count } = await query;

            if (error) {
                return { success: false, error: error.message };
            }

            // Transform to PublicComment format
            const comments: PublicComment[] = await Promise.all(
                (data || []).map(async (comment: any) => {
                    // Check if user has liked this comment
                    let userHasLiked = false;
                    if (userId) {
                        const { data: likeData } = await supabase
                            .from('post_reactions')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('target_type', 'COMMENT')
                            .eq('target_id', comment.id)
                            .maybeSingle();
                        
                        userHasLiked = !!likeData;
                    }

                    const publicComment: PublicComment = {
                        ...comment,
                        author_username: comment.profiles?.username || null,
                        author_full_name: comment.profiles?.full_name || null,
                        author_avatar_url: comment.profiles?.avatar_url || null,
                        author_is_verified: comment.profiles?.is_verified || false,
                        author_reputation_score: comment.profiles?.reputation_score || 0,
                        user_has_liked: userHasLiked,
                    };

                    // Remove nested profiles object
                    delete (publicComment as any).profiles;

                    return publicComment;
                })
            );

            const result: CommentsResponse = {
                comments,
                total_count: count || 0,
                has_more: (count || 0) > page * perPage,
                page,
                per_page: perPage,
            };

            return { success: true, data: result };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Get a single comment by ID
     */
    static async getCommentById(commentId: string): Promise<PostOperationResult<PublicComment>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles!inner(
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        reputation_score
                    )
                `)
                .eq('id', commentId)
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            // Check if user has liked this comment
            let userHasLiked = false;
            if (userId) {
                const { data: likeData } = await supabase
                    .from('post_reactions')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('target_type', 'COMMENT')
                    .eq('target_id', commentId)
                    .maybeSingle();
                
                userHasLiked = !!likeData;
            }

            const publicComment: PublicComment = {
                ...data,
                author_username: data.profiles?.username || null,
                author_full_name: data.profiles?.full_name || null,
                author_avatar_url: data.profiles?.avatar_url || null,
                author_is_verified: data.profiles?.is_verified || false,
                author_reputation_score: data.profiles?.reputation_score || 0,
                user_has_liked: userHasLiked,
            };

            // Remove nested profiles object
            delete (publicComment as any).profiles;

            return { success: true, data: publicComment };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Update a comment
     */
    static async updateComment(
        commentId: string, 
        updates: CommentUpdate
    ): Promise<PostOperationResult<PublicComment>> {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
            }

            // Validate updates
            if (updates.content && updates.content.length > this.MAX_COMMENT_LENGTH) {
                return { success: false, error: 'Comment is too long' };
            }

            // Check ownership
            const { data: comment, error: checkError } = await supabase
                .from('comments')
                .select('author_id')
                .eq('id', commentId)
                .single();

            if (checkError || !comment) {
                return { success: false, error: 'Comment not found' };
            }

            if (comment.author_id !== user.id) {
                return { success: false, error: POST_ERROR_CODES.CANNOT_EDIT_POST };
            }

            // Update the comment
            const { data, error } = await supabase
                .from('comments')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', commentId)
                .select(`
                    *,
                    profiles!inner(
                        username,
                        full_name,
                        avatar_url,
                        is_verified,
                        reputation_score
                    )
                `)
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            // Transform to PublicComment
            const publicComment: PublicComment = {
                ...data,
                author_username: data.profiles?.username || null,
                author_full_name: data.profiles?.full_name || null,
                author_avatar_url: data.profiles?.avatar_url || null,
                author_is_verified: data.profiles?.is_verified || false,
                author_reputation_score: data.profiles?.reputation_score || 0,
                user_has_liked: false,
            };

            // Remove nested profiles object
            delete (publicComment as any).profiles;

            return { success: true, data: publicComment };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Delete a comment (soft delete)
     */
    static async deleteComment(commentId: string): Promise<PostOperationResult<void>> {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
            }

            // Check ownership
            const { data: comment, error: checkError } = await supabase
                .from('comments')
                .select('author_id')
                .eq('id', commentId)
                .single();

            if (checkError) {
                // Log full error for debugging (RLS, PostgREST, etc.)
                console.error('deleteComment: error fetching comment ownership', { commentId, checkError });
                return { success: false, error: 'Comment not found or permission denied' };
            }

            if (!comment) {
                console.warn('deleteComment: comment not found', { commentId });
                return { success: false, error: 'Comment not found' };
            }

            if (comment.author_id !== user.id) {
                console.warn('deleteComment: user not owner', { commentId, owner: comment.author_id, user: user.id });
                return { success: false, error: POST_ERROR_CODES.CANNOT_DELETE_POST };
            }

            // Soft delete - log any DB error details
            const { error } = await supabase
                .from('comments')
                .update({ 
                    status: 'DELETED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', commentId)
                .eq('author_id', user.id);

            if (error) {
                console.error('deleteComment: supabase update error', { commentId, error });
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    // ========== COMMENT REACTIONS ==========

    /**
     * Toggle reaction on a comment
     */
    static async toggleCommentReaction(
        commentId: string,
        reactionId: number
    ): Promise<PostOperationResult<boolean>> {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                return { success: false, error: POST_ERROR_CODES.NOT_AUTHENTICATED };
            }

            // Use the database's toggle_reaction RPC function
            const { data, error } = await supabase.rpc('toggle_reaction', {
                target_type_param: 'COMMENT',
                target_id_param: commentId,
                reaction_id_param: reactionId
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // Returns TRUE if reaction was added, FALSE if removed
            return { success: true, data: data || false };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    /**
     * Get reaction summary for a comment
     */
    static async getCommentReactions(
        commentId: string
    ): Promise<PostOperationResult<CommentReactionSummary[]>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            // Get all reactions for the comment with reaction details
            const { data: reactions, error } = await supabase
                .from('post_reactions')
                .select(`
                    reaction_id,
                    user_id,
                    reactions!inner(
                        name,
                        emoji_unicode
                    )
                `)
                .eq('target_type', 'COMMENT')
                .eq('target_id', commentId);

            if (error) {
                return { success: false, error: error.message };
            }

            // Count reactions and check user's reactions
            const reactionCounts = new Map<number, { 
                count: number; 
                reaction: any; 
                userReacted: boolean 
            }>();

            reactions?.forEach(reaction => {
                const reactionId = reaction.reaction_id;
                const isUserReaction = userId && reaction.user_id === userId;
                
                if (reactionCounts.has(reactionId)) {
                    const current = reactionCounts.get(reactionId)!;
                    current.count++;
                    if (isUserReaction) current.userReacted = true;
                } else {
                    reactionCounts.set(reactionId, {
                        count: 1,
                        reaction: reaction.reactions,
                        userReacted: isUserReaction || false
                    });
                }
            });

            // Convert to summary format
            const summary = Array.from(reactionCounts.entries()).map(([reactionId, data]) => ({
                reaction_id: reactionId,
                reaction_name: data.reaction.name,
                emoji_unicode: data.reaction.emoji_unicode,
                count: data.count,
                user_reacted: data.userReacted,
            }));

            // Sort by count
            summary.sort((a, b) => b.count - a.count);

            return { success: true, data: summary };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    // ========== REAL-TIME SUBSCRIPTIONS ==========

    /**
     * Subscribe to comments for a post with real-time updates
     */
    static subscribeToPostComments(
        postId: string,
        onInsert: (comment: any) => void,
        onUpdate: (comment: any) => void,
        onDelete: (comment: any) => void
    ) {
        const channel = supabase
            .channel(`post-comments-${postId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${postId}`
                },
                (payload) => {
                    onInsert(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${postId}`
                },
                (payload) => {
                    onUpdate(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${postId}`
                },
                (payload) => {
                    onDelete(payload.old);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Subscribe to reactions on a comment
     */
    static subscribeToCommentReactions(
        commentId: string,
        onReactionChange: () => void
    ) {
        const channel = supabase
            .channel(`comment-reactions-${commentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'post_reactions',
                    filter: `target_id=eq.${commentId}`
                },
                () => {
                    onReactionChange();
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Unsubscribe from a channel
     */
    static unsubscribe(channel: any) {
        if (channel) {
            supabase.removeChannel(channel);
        }
    }

    // ========== VALIDATION ==========

    private static validateCommentCreate(commentData: CommentCreate): PostOperationResult<void> {
        const errors: any[] = [];

        if (!commentData.content?.trim()) {
            errors.push({ field: 'content', message: 'Comment content is required', code: POST_ERROR_CODES.INVALID_CONTENT });
        }

        if (commentData.content && commentData.content.length > this.MAX_COMMENT_LENGTH) {
            errors.push({ field: 'content', message: 'Comment is too long', code: POST_ERROR_CODES.CONTENT_TOO_LONG });
        }

        if (!commentData.post_id) {
            errors.push({ field: 'post_id', message: 'Post ID is required', code: POST_ERROR_CODES.POST_NOT_FOUND });
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        return { success: true };
    }
}

// Export a singleton instance
export const commentService = CommentService;
