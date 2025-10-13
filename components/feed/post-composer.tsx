"use client";

import { useState, useRef, useEffect } from "react";
import {
    Image,
    MapPin,
    Hash,
    X,
    Camera,
    Globe,
    Users,
    Lock,
    Loader2,
    FileText,
    HelpCircle,
    BarChart3,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/avatar/user-avatar";
import { useCurrentProfile } from '@/lib/store/profile.store';
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePostStore, PostUtils } from "@/lib/post";
import type { PostCreate, PostType, PostPrivacy } from "@/lib/schema/post.types";

interface PostComposerProps {
    onPostCreated?: (postId: string) => void;
    placeholder?: string;
    compact?: boolean;
    className?: string;
}

const postTypeOptions: {
    value: PostType;
    label: string;
    icon: typeof FileText;
    description: string;
}[] = [
        { value: 'TEXT', label: 'Text Post', icon: FileText, description: 'Share your thoughts' },
        { value: 'IMAGE', label: 'Image Post', icon: Image, description: 'Share photos' },
        { value: 'ARTICLE', label: 'Article', icon: FileText, description: 'Write long-form content' },
        { value: 'QUESTION', label: 'Question', icon: HelpCircle, description: 'Ask the community' },
        { value: 'POLL', label: 'Poll', icon: BarChart3, description: 'Create a poll' },
    ];

const privacyOptions: {
    value: PostPrivacy;
    label: string;
    icon: typeof Globe;
    description: string;
}[] = [
        { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Everyone can see' },
        { value: 'FOLLOWERS', label: 'Followers', icon: Users, description: 'Only followers' },
        { value: 'PRIVATE', label: 'Private', icon: Lock, description: 'Only you' },
    ];

export function PostComposer({
    onPostCreated,
    placeholder = "What's on your mind?",
    compact = false,
    className = ""
}: PostComposerProps) {
    const { createPost, isCreatingPost, createPostError } = usePostStore();
    const currentProfile = useCurrentProfile();
    const [avatarLoading, setAvatarLoading] = useState<boolean>(!!currentProfile);

    useEffect(() => {
        setAvatarLoading(!!currentProfile);
    }, [currentProfile]);

    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [postType, setPostType] = useState<PostType>('TEXT');
    const [privacy, setPrivacy] = useState<PostPrivacy>('PUBLIC');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [location, setLocation] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [isExpanded, setIsExpanded] = useState(!compact);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Character and word counts
    const characterCount = PostUtils.Content.getCharacterCount(content);
    const wordCount = PostUtils.Content.getWordCount(content);
    const isOverLimit = characterCount > 10000;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const contentValidation = PostUtils.Content.validateContent(content);
        if (!contentValidation.valid) {
            return;
        }

        if ((postType === 'ARTICLE' || postType === 'QUESTION') && !title.trim()) {
            return;
        }

        const tagValidation = PostUtils.Validation.validateTags(tags);
        if (!tagValidation.valid) {
            return;
        }

        const postData: PostCreate = {
            content: content.trim(),
            title: title.trim() || null,
            post_type: postType,
            privacy,
            tags: tags.length > 0 ? tags : null,
            location: location.trim() || null,
            media_urls: [],
            author_id: '',
        };

        const success = await createPost(postData);

        if (success) {
            setContent('');
            setTitle('');
            setPostType('TEXT');
            setPrivacy('PUBLIC');
            setTags([]);
            setCurrentTag('');
            setLocation('');
            setMediaFiles([]);

            if (!compact) {
                setIsExpanded(false);
            }

            onPostCreated?.('mock-post-id');
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = currentTag.trim().toLowerCase();

            if (tag && !tags.includes(tag) && tags.length < 10) {
                setTags([...tags, tag]);
                setCurrentTag('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleMediaUpload = (files: FileList | null) => {
        if (!files) return;

        const newFiles = Array.from(files).slice(0, 5 - mediaFiles.length);
        setMediaFiles(prev => [...prev, ...newFiles]);

        if (postType === 'TEXT') {
            setPostType('IMAGE');
        }
    };

    const handleRemoveMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const selectedPostType = postTypeOptions.find(opt => opt.value === postType);
    const selectedPrivacy = privacyOptions.find(opt => opt.value === privacy);

    // Compact collapsed state
    if (!isExpanded && compact) {
        return (
            <Card className={className}>
                <CardContent className="p-3 sm:p-4">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-3 w-full"
                    >
                        <UserAvatar
                            profile={currentProfile}
                            size="md"
                            className="shrink-0"
                        />
                        <div className="flex-1 text-left px-4 py-2.5 bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors text-sm sm:text-base">
                            {placeholder}
                        </div>
                    </button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardContent className="p-3 sm:p-4 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Header Row - Avatar + Post Type (Left) | Privacy + Close (Right) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Avatar */}
                        <UserAvatar
                            profile={currentProfile}
                            size="md"
                            className="shrink-0"
                        />

                        {/* Post Type Dropdown - Fit content on desktop, equal width on mobile */}
                        <div className="flex-1 sm:flex-initial min-w-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto h-9 justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedPostType && (
                                                <selectedPostType.icon className="h-4 w-4 shrink-0" />
                                            )}
                                            <span className="truncate text-sm">
                                                {selectedPostType?.label}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    {postTypeOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => setPostType(option.value)}
                                        >
                                            <option.icon className="h-4 w-4 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm">
                                                    {option.label}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Privacy Dropdown - Fit content on desktop, equal width on mobile */}
                        <div className="flex-1 sm:flex-initial min-w-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto h-9 justify-between"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {selectedPrivacy && (
                                                <selectedPrivacy.icon className="h-4 w-4 shrink-0" />
                                            )}
                                            <span className="text-sm truncate">
                                                {selectedPrivacy?.label}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {privacyOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => setPrivacy(option.value)}
                                        >
                                            <option.icon className="h-4 w-4 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm">
                                                    {option.label}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Close button for compact mode */}
                        {compact && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setIsExpanded(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Title for articles/questions */}
                    {(postType === 'ARTICLE' || postType === 'QUESTION') && (
                        <input
                            type="text"
                            placeholder={
                                postType === 'ARTICLE'
                                    ? 'Article title...'
                                    : 'Your question...'
                            }
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-0 py-2 text-base sm:text-lg font-semibold bg-transparent border-none outline-none placeholder-muted-foreground focus-visible:outline-none"
                            maxLength={200}
                        />
                    )}

                    {/* Content area */}
                    <div className="relative">
                        <Textarea
                            placeholder={placeholder}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[100px] sm:min-h-[120px] border-none bg-transparent resize-none text-sm sm:text-base placeholder-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                            maxLength={10000}
                        />

                        {/* Character count */}
                        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
                            <span className={isOverLimit ? 'text-destructive' : ''}>
                                {characterCount.toLocaleString()}/10k
                            </span>
                            {wordCount > 0 && (
                                <span className="ml-2 hidden sm:inline">
                                    {wordCount}w
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Media preview grid */}
                    {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {mediaFiles.map((file, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Upload ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(index)}
                                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags display */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="gap-1 text-xs"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Hashtag and Location Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Tag input */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                placeholder="Add tags (press Enter)"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder-muted-foreground focus-visible:outline-none"
                                maxLength={50}
                            />
                            {tags.length > 0 && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {tags.length}/10
                                </span>
                            )}
                        </div>

                        {/* Location input */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                placeholder="Add location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder-muted-foreground focus-visible:outline-none"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center justify-between pt-3 border-t gap-2">
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                {/* Image upload */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={mediaFiles.length >= 5}
                                        >
                                            <Image className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Add images</TooltipContent>
                                </Tooltip>

                                {/* Camera */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            disabled
                                        >
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Take photo</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Submit button */}
                        <Button
                            type="submit"
                            disabled={!content.trim() || isOverLimit || isCreatingPost}
                            className="gap-2 h-9"
                            size="sm"
                        >
                            {isCreatingPost && <Loader2 className="h-4 w-4 animate-spin" />}
                            <span className="hidden sm:inline">
                                {postType === 'QUESTION' ? 'Ask Question' : 'Post'}
                            </span>
                            <span className="sm:hidden">
                                {postType === 'QUESTION' ? 'Ask' : 'Post'}
                            </span>
                        </Button>
                    </div>

                    {/* Error message */}
                    {createPostError && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                            {createPostError}
                        </div>
                    )}
                </form>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleMediaUpload(e.target.files)}
                    className="hidden"
                />
            </CardContent>
        </Card>
    );
}
