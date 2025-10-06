"use client";

import { useState, useEffect } from "react";
import {
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    MapPin,
    Clock,
    Eye,
    Users,
    Sparkles,
    TrendingUp
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
import { PostUtils } from "@/lib/post";
import type { PublicPost, PostType } from "@/lib/schema/post.types";
import type { FeedSortType } from "./feed-header";

interface FeedSectionProps {
    sortType?: FeedSortType;
    searchQuery?: string;
    className?: string;
}

// Mock data generator
const generateMockPosts = (): PublicPost[] => {
    const baseTime = Date.now();

    return [
        {
            id: "1",
            content: "Just finished my latest project using React and TypeScript! 🚀 The learning curve was steep but totally worth it. Can't wait to share more details about the architecture and design decisions I made. #React #TypeScript #WebDev",
            title: null,
            post_type: "TEXT" as PostType,
            privacy: "PUBLIC",
            author_id: "user1",
            author_username: "alexdev",
            author_full_name: "Alex Johnson",
            author_avatar_url: "/placeholder-user.jpg",
            like_count: 24,
            comment_count: 8,
            share_count: 3,
            view_count: 156,
            engagement_score: 15.2,
            user_has_liked: false,
            user_has_saved: true,
            tags: ["react", "typescript", "webdev"],
            location: "San Francisco, CA",
            coordinates: null,
            media_urls: null,
            external_link: null,
            external_link_preview: null,
            created_at: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
            last_activity_at: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
            content_preview: null,
            is_pinned: false,
            is_featured: false,
            is_sensitive: false,
            content_warning: null,
            category: "technology",
            media_types: null,
        },
        {
            id: "2",
            content: "Beautiful sunset from my weekend hiking trip! Nature never fails to amaze me 🌅 This trail in the mountains was absolutely breathtaking. Already planning the next adventure!",
            title: null,
            post_type: "IMAGE" as PostType,
            privacy: "PUBLIC",
            author_id: "user2",
            author_username: "naturelover",
            author_full_name: "Sarah Chen",
            author_avatar_url: "/placeholder-user.jpg",
            like_count: 89,
            comment_count: 15,
            share_count: 12,
            view_count: 342,
            engagement_score: 31.8,
            user_has_liked: true,
            user_has_saved: false,
            tags: ["hiking", "nature", "photography", "weekend"],
            location: "Rocky Mountain National Park",
            coordinates: { latitude: 40.3428, longitude: -105.6836 },
            media_urls: ["/placeholder.jpg"],
            external_link: null,
            external_link_preview: null,
            created_at: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
            last_activity_at: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
            content_preview: null,
            is_pinned: false,
            is_featured: true,
            is_sensitive: false,
            content_warning: null,
            category: "lifestyle",
            media_types: ["IMAGE"],
        },
        {
            id: "3",
            content: "What's your favorite programming language for building web applications in 2024? I'm curious about the community's preferences and would love to hear your thoughts on performance, developer experience, and ecosystem maturity.",
            title: "Best Web Development Languages in 2024?",
            post_type: "QUESTION" as PostType,
            privacy: "PUBLIC",
            author_id: "user3",
            author_username: "codeguru",
            author_full_name: "Mike Rodriguez",
            author_avatar_url: "/placeholder-user.jpg",
            like_count: 45,
            comment_count: 67,
            share_count: 8,
            view_count: 523,
            engagement_score: 22.9,
            user_has_liked: false,
            user_has_saved: false,
            tags: ["programming", "webdev", "javascript", "python", "discussion"],
            location: null,
            coordinates: null,
            media_urls: null,
            external_link: null,
            external_link_preview: null,
            created_at: new Date(baseTime - 6 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(baseTime - 6 * 60 * 60 * 1000).toISOString(),
            last_activity_at: new Date(baseTime - 6 * 60 * 60 * 1000).toISOString(),
            content_preview: null,
            is_pinned: false,
            is_featured: false,
            is_sensitive: false,
            content_warning: null,
            category: "technology",
            media_types: null,
        },
        {
            id: "4",
            content: "Exciting news! 🎉 We're launching our new AI-powered study assistant next month. This tool will help students organize their notes, create study schedules, and get personalized learning recommendations. Beta testing starts soon!",
            title: "Introducing EduBot - Your AI Study Companion",
            post_type: "ANNOUNCEMENT" as PostType,
            privacy: "PUBLIC",
            author_id: "user4",
            author_username: "eduroofficial",
            author_full_name: "Eduro Team",
            author_avatar_url: "/placeholder-logo.png",
            like_count: 156,
            comment_count: 34,
            share_count: 28,
            view_count: 1248,
            engagement_score: 45.6,
            user_has_liked: false,
            user_has_saved: true,
            tags: ["announcement", "ai", "education", "beta", "launch"],
            location: null,
            coordinates: null,
            media_urls: null,
            external_link: "https://eduro.com/edubot",
            external_link_preview: {
                title: "EduBot - AI Study Assistant",
                description: "Revolutionary AI-powered study companion for modern learners",
                image_url: "/placeholder.jpg",
                site_name: "Eduro",
                url: "https://eduro.com/edubot",
                favicon_url: "/placeholder-logo.svg"
            },
            created_at: new Date(baseTime - 8 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(baseTime - 8 * 60 * 60 * 1000).toISOString(),
            last_activity_at: new Date(baseTime - 8 * 60 * 60 * 1000).toISOString(),
            content_preview: null,
            is_pinned: true,
            is_featured: true,
            is_sensitive: false,
            content_warning: null,
            category: "education",
            media_types: null,
        },
        {
            id: "5",
            content: "Just watched an incredible documentary about space exploration. The advancement in rocket technology over the past decade is mind-blowing! 🚀 Humanity's journey to become a multi-planetary species is truly fascinating.",
            title: null,
            post_type: "TEXT" as PostType,
            privacy: "PUBLIC",
            author_id: "user5",
            author_username: "spacefan",
            author_full_name: "Emma Thompson",
            author_avatar_url: "/placeholder-user.jpg",
            like_count: 32,
            comment_count: 12,
            share_count: 5,
            view_count: 198,
            engagement_score: 18.7,
            user_has_liked: true,
            user_has_saved: false,
            tags: ["space", "documentary", "technology", "science"],
            location: null,
            coordinates: null,
            media_urls: null,
            external_link: null,
            external_link_preview: null,
            created_at: new Date(baseTime - 12 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(baseTime - 12 * 60 * 60 * 1000).toISOString(),
            last_activity_at: new Date(baseTime - 12 * 60 * 60 * 1000).toISOString(),
            content_preview: null,
            is_pinned: false,
            is_featured: false,
            is_sensitive: false,
            content_warning: null,
            category: "science",
            media_types: null,
        }
    ];
};

export function FeedSection({ sortType = 'recent', searchQuery = '', className = '' }: FeedSectionProps) {
    const [posts, setPosts] = useState<PublicPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading delay
        setLoading(true);

        setTimeout(() => {
            let mockPosts = generateMockPosts();

            // Filter by search query
            if (searchQuery) {
                mockPosts = mockPosts.filter(post =>
                    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    post.author_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Sort posts based on sortType
            switch (sortType) {
                case 'trending':
                    mockPosts.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
                    break;
                case 'popular':
                    mockPosts.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
                    break;
                case 'following':
                    // Mock following logic - just show a subset
                    mockPosts = mockPosts.filter(post => ['user1', 'user2'].includes(post.author_id));
                    break;
                case 'recent':
                default:
                    mockPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    break;
            }

            setPosts(mockPosts);
            setLoading(false);
        }, 800);
    }, [sortType, searchQuery]);

    const handleReaction = (postId: string, liked: boolean) => {
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    user_has_liked: liked,
                    like_count: liked ? (post.like_count || 0) + 1 : Math.max(0, (post.like_count || 0) - 1)
                };
            }
            return post;
        }));
    };

    const handleSave = (postId: string, saved: boolean) => {
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    user_has_saved: saved
                };
            }
            return post;
        }));
    };

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="flex items-center space-x-4 mt-4">
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="text-gray-500 mb-4">
                    {searchQuery ? (
                        <>
                            <span className="text-2xl mb-2 block">🔍</span>
                            <p>No posts found for "{searchQuery}"</p>
                            <p className="text-sm mt-1">Try adjusting your search terms</p>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl mb-2 block">📝</span>
                            <p>No posts to show</p>
                            <p className="text-sm mt-1">Follow more people or create your first post</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    onReaction={handleReaction}
                    onSave={handleSave}
                />
            ))}
        </div>
    );
}

interface PostCardProps {
    post: PublicPost;
    onReaction?: (postId: string, liked: boolean) => void;
    onSave?: (postId: string, saved: boolean) => void;
}

function PostCard({ post, onReaction, onSave }: PostCardProps) {
    const handleLike = () => {
        onReaction?.(post.id, !post.user_has_liked);
    };

    const handleSave = () => {
        onSave?.(post.id, !post.user_has_saved);
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={post.author_avatar_url || ''} />
                                <AvatarFallback>
                                    {post.author_full_name?.charAt(0) || post.author_username?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-sm">
                                        {post.author_full_name || post.author_username}
                                    </h3>
                                    {post.author_username && post.author_full_name && (
                                        <span className="text-gray-500 text-sm">@{post.author_username}</span>
                                    )}
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-500 text-sm">
                                        {PostUtils.Display.formatRelativeTime(post.created_at)}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex items-center space-x-1">
                                        <span className="text-xs">{PostUtils.Display.getPostTypeIcon(post.post_type)}</span>
                                        <span className="text-xs text-gray-500">
                                            {PostUtils.Display.getPostTypeDisplayName(post.post_type)}
                                        </span>
                                    </div>

                                    {post.location && (
                                        <>
                                            <span className="text-gray-400">·</span>
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">{post.location}</span>
                                            </div>
                                        </>
                                    )}

                                    {(post.is_pinned || post.is_featured) && (
                                        <>
                                            <span className="text-gray-400">·</span>
                                            <div className="flex items-center space-x-1">
                                                {post.is_pinned && (
                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                        📌 Pinned
                                                    </Badge>
                                                )}
                                                {post.is_featured && (
                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                        ⭐ Featured
                                                    </Badge>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Bookmark className="h-4 w-4 mr-2" />
                                    {post.user_has_saved ? 'Unsave post' : 'Save post'}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
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
                        <h2 className="text-lg font-bold text-gray-900">{post.title}</h2>
                    </div>
                )}

                {/* Content */}
                <div className="px-4 pb-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 5).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    #{tag}
                                </Badge>
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
                {post.media_urls && post.media_urls.length > 0 && (
                    <div className="px-4 pb-3">
                        <div className="grid grid-cols-1 gap-2 rounded-lg overflow-hidden">
                            {post.media_urls.slice(0, 4).map((url, index) => (
                                <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={url}
                                        alt={`Post media ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Link Preview */}
                {post.external_link_preview && (
                    <div className="px-4 pb-3">
                        <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-start space-x-3">
                                {post.external_link_preview.image_url && (
                                    <img
                                        src={post.external_link_preview.image_url}
                                        alt=""
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                        {post.external_link_preview.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {post.external_link_preview.description}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {post.external_link_preview.site_name || new URL(post.external_link_preview.url).hostname}
                                    </p>
                                </div>
                            </div>
                        </div>
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
                            {post.engagement_score && post.engagement_score > 20 && (
                                <div className="flex items-center space-x-1 text-purple-500">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="text-xs font-medium">High Engagement</span>
                                </div>
                            )}
                        </div>
                        <div className="text-xs">
                            {PostUtils.Display.getReadingTime(post.content)}
                        </div>
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
                                className={`gap-2 ${post.user_has_liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
                            >
                                <Heart className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
                                <span>{PostUtils.Display.formatEngagementCount(post.like_count || 0)}</span>
                            </Button>

                            <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-blue-500">
                                <MessageCircle className="h-4 w-4" />
                                <span>{PostUtils.Display.formatEngagementCount(post.comment_count || 0)}</span>
                            </Button>

                            <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-green-500">
                                <Share2 className="h-4 w-4" />
                                <span>{PostUtils.Display.formatEngagementCount(post.share_count || 0)}</span>
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSave}
                            className={`${post.user_has_saved ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                        >
                            <Bookmark className={`h-4 w-4 ${post.user_has_saved ? 'fill-current' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}