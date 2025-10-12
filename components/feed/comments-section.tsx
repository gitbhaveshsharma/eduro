/**
 * Comments Section Component
 * 
 * Comprehensive comment system with threaded replies, reactions, and real-time updates
 * Supports nested comments with proper threading and display
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageCircle, Send, MoreHorizontal, Reply, Heart, Flag, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostReactions } from "@/components/reactions";
import { UserAvatar } from "@/components/avatar/user-avatar";
import { usePostStore } from "@/lib/store/post.store";
import { PostUtils } from "@/lib/utils/post.utils";
import type { PublicComment } from "@/lib/schema/post.types";
import type { PublicReaction } from "@/components/reactions";

export interface CommentsSectionProps {
    postId: string;
    className?: string;
}

export function CommentsSection({ postId, className = "" }: CommentsSectionProps) {
    const {
        commentsCache,
        commentsLoading,
        commentsErrors,
        commentsHasMore,
        commentComposition,
        submittingComment,
        loadComments,
        loadMoreComments,
        createComment,
        setCommentComposition,
        clearCommentComposition,
        subscribeToComments,
        unsubscribeFromComments
    } = usePostStore();

    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
    const [showReplies, setShowReplies] = useState<Set<string>>(new Set());

    const comments = commentsCache.get(postId) || [];
    const loading = commentsLoading.has(postId);
    const error = commentsErrors.get(postId);
    const hasMore = commentsHasMore.get(postId) || false;
    const newCommentText = commentComposition.get(postId) || '';
    const isSubmitting = submittingComment.has(postId);

    // Load comments when component mounts
    useEffect(() => {
        loadComments(postId);
        subscribeToComments(postId);

        return () => {
            unsubscribeFromComments(postId);
        };
    }, [postId, loadComments, subscribeToComments, unsubscribeFromComments]);

    // Handle comment submission
    const handleSubmitComment = useCallback(async () => {
        if (!newCommentText.trim() || isSubmitting) return;

        const success = await createComment(postId, newCommentText.trim());
        if (success) {
            clearCommentComposition(postId);
            // Refresh comments to show new comment
            loadComments(postId, true);
        }
    }, [postId, newCommentText, isSubmitting, createComment, clearCommentComposition, loadComments]);

    // Handle key press in comment textarea
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmitComment();
        }
    }, [handleSubmitComment]);

    // Toggle reply visibility
    const toggleReplies = useCallback((commentId: string) => {
        setShowReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    }, []);

    // Group comments by thread
    const groupedComments = PostUtils.Comment.groupCommentsByParent(comments);
    const topLevelComments = groupedComments.get(null) || [];

    // Sort top-level comments
    const sortedTopLevelComments = React.useMemo(() => {
        const sorted = [...topLevelComments];

        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            case 'popular':
                return sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
            default:
                return sorted;
        }
    }, [topLevelComments, sortBy]);

    if (loading && comments.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageCircle className="h-5 w-5" />
                        <h3 className="font-semibold">Comments</h3>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-24 h-3 bg-gray-200 rounded" />
                                    <div className="w-full h-4 bg-gray-200 rounded" />
                                    <div className="w-2/3 h-4 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        <h3 className="font-semibold">
                            Comments ({comments.length})
                        </h3>
                    </div>

                    {/* Sort options */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="capitalize">
                                    {sortBy}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                                    Newest first
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                                    Oldest first
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                                    Most popular
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Comment form */}
                <div className="mb-6">
                    <CommentForm
                        postId={postId}
                        value={newCommentText}
                        onChange={(value) => setCommentComposition(postId, value)}
                        onSubmit={handleSubmitComment}
                        onKeyPress={handleKeyPress}
                        isSubmitting={isSubmitting}
                        placeholder="Write a comment..."
                    />
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Comments list */}
                <div className="space-y-4">
                    {sortedTopLevelComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            replies={groupedComments.get(comment.id) || []}
                            showReplies={showReplies.has(comment.id)}
                            onToggleReplies={() => toggleReplies(comment.id)}
                            level={0}
                        />
                    ))}
                </div>

                {/* Load more comments */}
                {hasMore && (
                    <div className="mt-6 text-center">
                        <Button
                            variant="outline"
                            onClick={() => loadMoreComments(postId)}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Load more comments'}
                        </Button>
                    </div>
                )}

                {/* Empty state */}
                {comments.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
                        <p className="text-gray-500">Be the first to share your thoughts!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Individual comment component with threading support
interface CommentItemProps {
    comment: PublicComment;
    postId: string;
    replies: PublicComment[];
    showReplies: boolean;
    onToggleReplies: () => void;
    level: number;
}

function CommentItem({
    comment,
    postId,
    replies,
    showReplies,
    onToggleReplies,
    level
}: CommentItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const { createComment } = usePostStore();
    const maxDepth = 5; // Maximum nesting level for visual clarity

    const handleReplySubmit = async () => {
        if (!replyText.trim() || isSubmittingReply) return;

        setIsSubmittingReply(true);
        const success = await createComment(postId, replyText.trim(), comment.id);

        if (success) {
            setReplyText('');
            setShowReplyForm(false);
            if (!showReplies) {
                onToggleReplies(); // Auto-expand replies when user adds one
            }
        }
        setIsSubmittingReply(false);
    };

    const handleReactionChange = async (commentId: string, reaction: PublicReaction, action: 'add' | 'remove') => {
        // This would integrate with the reaction system
        console.log('Comment reaction:', { commentId, reaction, action });
    };

    const indentLevel = Math.min(level, maxDepth);
    const indentClass = indentLevel > 0 ? `ml-${indentLevel * 4}` : '';

    return (
        <div className={`${indentClass} ${level > 0 ? 'border-l border-gray-200 pl-4' : ''}`}>
            <div className="flex gap-3">
                <UserAvatar
                    profile={{
                        avatar_url: comment.author_avatar_url as any,
                        full_name: comment.author_full_name || undefined,
                        username: comment.author_username || undefined,
                        is_verified: comment.author_is_verified || false,
                        is_online: false
                    }}
                    size="sm"
                    className="flex-shrink-0 mt-1"
                />

                <div className="flex-1 min-w-0">
                    {/* Comment header */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                            {comment.author_full_name || comment.author_username}
                        </span>

                        {comment.author_is_verified && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                ✓
                            </Badge>
                        )}

                        {comment.author_username && comment.author_full_name && (
                            <span className="text-gray-500 text-xs">
                                @{comment.author_username}
                            </span>
                        )}

                        <span className="text-gray-500 text-xs">
                            {PostUtils.Display.formatRelativeTime(comment.created_at)}
                        </span>

                        {comment.is_pinned && (
                            <Badge variant="secondary" className="text-xs">
                                Pinned
                            </Badge>
                        )}

                        {comment.is_highlighted && (
                            <Badge variant="secondary" className="text-xs">
                                Author
                            </Badge>
                        )}
                    </div>

                    {/* Comment content */}
                    <div className="text-sm text-gray-900 mb-2 whitespace-pre-wrap break-words">
                        {comment.content}
                    </div>

                    {/* Comment actions */}
                    <div className="flex items-center gap-4 text-xs">
                        {/* Reactions */}
                        <PostReactions
                            targetType="COMMENT"
                            targetId={comment.id}
                            onReactionChange={(reaction, action) => handleReactionChange(comment.id, reaction, action)}
                            size="sm"
                            layout="inline"
                            maxDisplay={3}
                        />

                        {/* Reply button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="h-6 px-2 text-gray-500 hover:text-gray-700"
                        >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                        </Button>

                        {/* Show replies button */}
                        {replies.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleReplies}
                                className="h-6 px-2 text-gray-500 hover:text-gray-700"
                            >
                                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </Button>
                        )}

                        {/* More actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Report
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Reply form */}
                    {showReplyForm && (
                        <div className="mt-3">
                            <CommentForm
                                postId={postId}
                                value={replyText}
                                onChange={setReplyText}
                                onSubmit={handleReplySubmit}
                                isSubmitting={isSubmittingReply}
                                placeholder={`Reply to ${comment.author_full_name || comment.author_username}...`}
                                size="sm"
                                onCancel={() => setShowReplyForm(false)}
                            />
                        </div>
                    )}

                    {/* Nested replies */}
                    {showReplies && replies.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    postId={postId}
                                    replies={[]} // For now, limit to 2 levels deep
                                    showReplies={false}
                                    onToggleReplies={() => { }}
                                    level={level + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Comment form component
interface CommentFormProps {
    postId: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onKeyPress?: (e: React.KeyboardEvent) => void;
    isSubmitting: boolean;
    placeholder: string;
    size?: 'sm' | 'md';
    onCancel?: () => void;
}

function CommentForm({
    value,
    onChange,
    onSubmit,
    onKeyPress,
    isSubmitting,
    placeholder,
    size = 'md',
    onCancel
}: CommentFormProps) {
    const textareaRows = size === 'sm' ? 2 : 3;

    return (
        <div className="space-y-3">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder={placeholder}
                rows={textareaRows}
                disabled={isSubmitting}
                className="resize-none"
            />

            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    {onKeyPress && 'Press Ctrl+Enter to submit'}
                </div>

                <div className="flex gap-2">
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    )}

                    <Button
                        onClick={onSubmit}
                        disabled={!value.trim() || isSubmitting}
                        size="sm"
                        className="gap-2"
                    >
                        {isSubmitting ? (
                            'Posting...'
                        ) : (
                            <>
                                <Send className="h-3 w-3" />
                                Comment
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CommentsSection;