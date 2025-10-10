/**
 * Post Card Component
 * 
 * Reusable component for displaying individual posts in feeds
 * Supports all post types, media content, and user interactions
 */

"use client";

import React from "react";
import {
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    MapPin,
    Eye,
    TrendingUp,
    Sparkles,
    Pin,
    Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    showEngagementScores = false,
    compact = false,
    className = ""
}: PostCardProps) {
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

    // Mark as viewed when component mounts
    React.useEffect(() => {
        onView?.(post.id);
    }, [post.id, onView]);

    return (
        <Card className={`overflow-hidden ${compact ? 'shadow-sm' : 'shadow-md'} ${className}`}>
            <CardContent className="p-0">
                {/* Header */}
                <div className={`p-4 ${compact ? 'pb-2' : 'pb-3'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar
                                className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} cursor-pointer`}
                                onClick={handleAuthorClick}
                            >
                                <AvatarImage src={post.author_avatar_url || ''} />
                                <AvatarFallback>
                                    {post.author_full_name?.charAt(0) || post.author_username?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleAuthorClick}
                                        className="font-semibold text-sm hover:underline truncate"
                                    >
                                        {post.author_full_name || post.author_username}
                                    </button>

                                    {post.author_is_verified && (
                                        <Badge variant="secondary" className="text-xs px-1 py-0">
                                            ✓
                                        </Badge>
                                    )}

                                    {post.author_username && post.author_full_name && (
                                        <span className="text-gray-500 text-sm truncate">
                                            @{post.author_username}
                                        </span>
                                    )}

                                    <span className="text-gray-400">·</span>

                                    <span className="text-gray-500 text-sm whitespace-nowrap">
                                        {PostUtils.Display.formatRelativeTime(post.created_at)}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2 mt-1 flex-wrap">
                                    <div className="flex items-center space-x-1">
                                        <span className="text-xs">
                                            {PostUtils.Display.getPostTypeIcon(post.post_type)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {PostUtils.Display.getPostTypeDisplayName(post.post_type)}
                                        </span>
                                    </div>

                                    {post.category && (
                                        <>
                                            <span className="text-gray-400">·</span>
                                            <button
                                                onClick={handleCategoryClick}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                {post.category}
                                            </button>
                                        </>
                                    )}

                                    {post.location && (
                                        <>
                                            <span className="text-gray-400">·</span>
                                            <button
                                                onClick={handleLocationClick}
                                                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-24">{post.location}</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Special badges */}
                                {(post.is_pinned || post.is_featured) && (
                                    <div className="flex items-center space-x-1 mt-1">
                                        {post.is_pinned && (
                                            <Badge variant="outline" className="text-xs px-1 py-0">
                                                <Pin className="h-3 w-3 mr-1" />
                                                Pinned
                                            </Badge>
                                        )}
                                        {post.is_featured && (
                                            <Badge variant="outline" className="text-xs px-1 py-0">
                                                <Star className="h-3 w-3 mr-1" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

                {/* Title (for articles/questions) */}
                {post.title && (
                    <div className="px-4 pb-2">
                        <h2 className={`font-bold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
                            {post.title}
                        </h2>
                    </div>
                )}

                {/* Content */}
                <div className={`px-4 ${compact ? 'pb-2' : 'pb-3'}`}>
                    <div className="text-gray-900 whitespace-pre-wrap break-words">
                        {compact && post.content.length > 200
                            ? `${post.content.slice(0, 200)}...`
                            : post.content
                        }
                    </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && !compact && (
                    <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 5).map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    #{tag}
                                </button>
                            ))}
                            {post.tags.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 5} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && !compact && (
                    <div className="px-4 pb-3">
                        <PostMedia mediaUrls={post.media_urls} mediaTypes={post.media_types} />
                    </div>
                )}

                {/* Link Preview */}
                {post.external_link_preview && !compact && (
                    <div className="px-4 pb-3">
                        <PostLinkPreview preview={post.external_link_preview} />
                    </div>
                )}

                {/* Engagement Stats */}
                <div className="px-4 py-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{PostUtils.Display.formatEngagementCount(post.view_count || 0)}</span>
                            </div>

                            {PostUtils.Display.isTrending(post) && (
                                <div className="flex items-center space-x-1 text-orange-500">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-xs font-medium">Trending</span>
                                </div>
                            )}

                            {(post.engagement_score || 0) > 20 && (
                                <div className="flex items-center space-x-1 text-purple-500">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="text-xs font-medium">High Engagement</span>
                                </div>
                            )}

                            {showEngagementScores && post.final_rank_score && (
                                <div className="text-xs text-gray-400">
                                    Score: {post.final_rank_score.toFixed(1)}
                                </div>
                            )}
                        </div>

                        {!compact && (
                            <div className="text-xs">
                                {PostUtils.Display.getReadingTime(post.content)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLike}
                                className={`gap-2 ${post.user_has_liked
                                        ? 'text-red-500 hover:text-red-600'
                                        : 'text-gray-500 hover:text-red-500'
                                    }`}
                            >
                                <Heart className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                                <span>{PostUtils.Display.formatEngagementCount(post.like_count || 0)}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleComment}
                                className="gap-2 text-gray-500 hover:text-blue-500"
                            >
                                <MessageCircle className="h-4 w-4" />
                                <span>{PostUtils.Display.formatEngagementCount(post.comment_count || 0)}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleShare}
                                className="gap-2 text-gray-500 hover:text-green-500"
                            >
                                <Share2 className="h-4 w-4" />
                                <span>{PostUtils.Display.formatEngagementCount(post.share_count || 0)}</span>
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSave}
                            className={`${post.user_has_saved
                                    ? 'text-blue-500'
                                    : 'text-gray-500 hover:text-blue-500'
                                }`}
                        >
                            <Bookmark className={`h-4 w-4 ${post.user_has_saved ? 'fill-current' : ''}`} />
                        </Button>
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
        <div className={`grid ${gridCols} gap-2 rounded-lg overflow-hidden`}>
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
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                loading="lazy"
                            />
                        )}
                    </div>
                );
            })}

            {mediaUrls.length > 4 && (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
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
        <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-start space-x-3">
                {preview.image_url && (
                    <img
                        src={preview.image_url}
                        alt=""
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                        loading="lazy"
                    />
                )}
                <div className="flex-1 min-w-0">
                    {preview.title && (
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                            {preview.title}
                        </h4>
                    )}
                    {preview.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {preview.description}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        {preview.site_name || new URL(preview.url).hostname}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PostCard;