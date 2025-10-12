/**
 * Post Card Component
 * 
 * Reusable component for displaying individual posts in feeds
 * Supports all post types, media content, and user interactions
 * Features modern design with controlled content height
 */

"use client";

import React, { useState } from "react";
import {
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    MapPin,
    Pin,
    Star,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { PostReactions, type PublicReaction } from "@/components/reactions";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from '@/components/avatar/user-avatar';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostUtils } from "@/lib/utils/post.utils";
import type { EnhancedPost } from "@/lib/service/getpost.service";

export interface PostCardProps {
    post: EnhancedPost;
    onLike?: (postId: string, liked: boolean) => void;
    onSave?: (postId: string, saved: boolean) => void;
    onShare?: (postId: string) => void;
    onComment?: (postId: string) => void;
    onView?: (postId: string) => void;
    onAuthorClick?: (authorId: string) => void;
    onLocationClick?: (location: string, coordinates?: { latitude: number; longitude: number }) => void;
    onTagClick?: (tag: string) => void;
    onCategoryClick?: (category: string) => void;
    onReactionChange?: (postId: string, reaction: PublicReaction, action: 'add' | 'remove') => void;
    showEngagementScores?: boolean;
    compact?: boolean;
    className?: string;
}

export function PostCard({
    post,
    onLike,
    onSave,
    onShare,
    onComment,
    onView,
    onAuthorClick,
    onLocationClick,
    onTagClick,
    onCategoryClick,
    onReactionChange,
    showEngagementScores = false,
    compact = false,
    className = ""
}: PostCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentLength = post.content?.length || 0;
    const shouldTruncate = contentLength > 300;

    const handleLike = () => {
        onLike?.(post.id, !post.user_has_liked);
    };

    const handleSave = () => {
        onSave?.(post.id, !post.user_has_saved);
    };

    const handleShare = () => {
        onShare?.(post.id);
    };

    const handleComment = () => {
        onComment?.(post.id);
    };

    const handleAuthorClick = () => {
        onAuthorClick?.(post.author_id);
    };

    const handleLocationClick = () => {
        if (post.location) {
            onLocationClick?.(post.location, post.coordinates || undefined);
        }
    };

    const handleTagClick = (tag: string) => {
        onTagClick?.(tag);
    };

    const handleCategoryClick = () => {
        if (post.category) {
            onCategoryClick?.(post.category);
        }
    };

    const handleReactionChange = (reaction: PublicReaction, action: 'add' | 'remove') => {
        onReactionChange?.(post.id, reaction, action);
    };

    // Mark as viewed when component mounts
    React.useEffect(() => {
        onView?.(post.id);
    }, [post.id, onView]);

    return (
        <Card className={`overflow-hidden transition-shadow duration-200 hover:shadow-md ${className}`}>
            <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <UserAvatar
                                profile={{
                                    avatar_url: post.author_avatar_url as any,
                                    full_name: post.author_full_name || undefined,
                                    username: post.author_username || undefined,
                                    is_online: false
                                }}
                                size="md"
                                onClick={handleAuthorClick}
                                className="flex-shrink-0"
                            />

                            <div className="flex-1 min-w-0 space-y-1">
                                {/* Author Info */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={handleAuthorClick}
                                        className="font-semibold text-sm hover:underline truncate max-w-32"
                                    >
                                        {post.author_full_name || post.author_username}
                                    </button>

                                    {post.author_is_verified && (
                                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                            ✓
                                        </Badge>
                                    )}

                                    {post.author_username && post.author_full_name && (
                                        <span className="text-gray-500 text-xs truncate">
                                            @{post.author_username}
                                        </span>
                                    )}
                                </div>

                                {/* Meta Info */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                    <span className="whitespace-nowrap">
                                        {PostUtils.Display.formatRelativeTime(post.created_at)}
                                    </span>

                                    <span>·</span>

                                    <div className="flex items-center gap-1">
                                        <span>{PostUtils.Display.getPostTypeIcon(post.post_type)}</span>
                                        <span>{PostUtils.Display.getPostTypeDisplayName(post.post_type)}</span>
                                    </div>

                                    {post.category && (
                                        <>
                                            <span>·</span>
                                            <button
                                                onClick={handleCategoryClick}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {post.category}
                                            </button>
                                        </>
                                    )}

                                    {post.location && (
                                        <>
                                            <span>·</span>
                                            <button
                                                onClick={handleLocationClick}
                                                className="flex items-center gap-1 hover:text-gray-700"
                                            >
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-20">{post.location}</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Special Badges */}
                                {(post.is_pinned || post.is_featured) && (
                                    <div className="flex items-center gap-1.5">
                                        {post.is_pinned && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                                <Pin className="h-3 w-3 mr-1" />
                                                Pinned
                                            </Badge>
                                        )}
                                        {post.is_featured && (
                                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                                <Star className="h-3 w-3 mr-1" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* More Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleSave}>
                                    <Bookmark className="h-4 w-4 mr-2" />
                                    {post.user_has_saved ? 'Unsave post' : 'Save post'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShare}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share post
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                    Report post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Title */}
                {post.title && (
                    <div className="px-4 pb-2">
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">
                            {post.title}
                        </h2>
                    </div>
                )}

                {/* Content with controlled height */}
                <div className="px-4 pb-3">
                    <div
                        className={`text-gray-900 whitespace-pre-wrap break-words text-sm leading-relaxed ${!isExpanded && shouldTruncate ? 'line-clamp-6' : ''
                            }`}
                    >
                        {post.content}
                    </div>

                    {/* Read More/Less Button */}
                    {shouldTruncate && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1"
                        >
                            {isExpanded ? (
                                <>
                                    Show less
                                    <ChevronUp className="h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Read more
                                    <ChevronDown className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {post.tags.slice(0, 5).map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-full"
                                >
                                    #{tag}
                                </button>
                            ))}
                            {post.tags.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 5}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                    <div className="px-4 pb-3">
                        <PostMedia mediaUrls={post.media_urls} mediaTypes={post.media_types} />
                    </div>
                )}

                {/* Link Preview */}
                {post.external_link_preview && (
                    <div className="px-4 pb-3">
                        <PostLinkPreview preview={post.external_link_preview} />
                    </div>
                )}

                {/* Actions */}
                <div className="px-4 py-3 border-t">
                    <div className="flex items-center justify-between">
                        {/* Reaction System */}
                        <PostReactions
                            targetType="POST"
                            targetId={post.id}
                            onReactionChange={handleReactionChange}
                            size="md"
                            layout="inline"
                            maxDisplay={5}
                        />

                        {/* Traditional Actions */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleComment}
                                className="gap-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-sm">{PostUtils.Display.formatEngagementCount(post.comment_count || 0)}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                className={`hover:bg-blue-50 ${post.user_has_saved
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                                    }`}
                            >
                                <Bookmark className={`h-4 w-4 ${post.user_has_saved ? 'fill-current' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Media component for handling different media types
function PostMedia({
    mediaUrls,
    mediaTypes
}: {
    mediaUrls: string[];
    mediaTypes?: string[] | null;
}) {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const gridCols = mediaUrls.length === 1 ? 'grid-cols-1' :
        mediaUrls.length === 2 ? 'grid-cols-2' :
            mediaUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2';

    return (
        <div className={`grid ${gridCols} gap-2 rounded-xl overflow-hidden`}>
            {mediaUrls.slice(0, 4).map((url, index) => {
                const mediaType = mediaTypes?.[index];
                const isVideo = mediaType === 'VIDEO' || url.includes('.mp4') || url.includes('.webm');

                return (
                    <div
                        key={index}
                        className={`aspect-video bg-gray-100 rounded-lg overflow-hidden ${mediaUrls.length === 3 && index === 0 ? 'col-span-2' : ''
                            }`}
                    >
                        {isVideo ? (
                            <video
                                src={url}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                            />
                        ) : (
                            <img
                                src={url}
                                alt={`Post media ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                            />
                        )}
                    </div>
                );
            })}

            {mediaUrls.length > 4 && (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-sm font-medium">
                    +{mediaUrls.length - 4} more
                </div>
            )}
        </div>
    );
}

// Link preview component
function PostLinkPreview({ preview }: { preview: any }) {
    if (!preview) return null;

    return (
        <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-xl p-3 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-start gap-3">
                {preview.image_url && (
                    <img
                        src={preview.image_url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        loading="lazy"
                    />
                )}
                <div className="flex-1 min-w-0">
                    {preview.title && (
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                            {preview.title}
                        </h4>
                    )}
                    {preview.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                            {preview.description}
                        </p>
                    )}
                    <p className="text-xs text-gray-500">
                        {preview.site_name || new URL(preview.url).hostname}
                    </p>
                </div>
            </div>
        </a>
    );
}

export default PostCard;
