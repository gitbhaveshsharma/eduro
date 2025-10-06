"use client";

import { useState, useRef } from "react";
import {
    Image,
    Video,
    MapPin,
    Smile,
    Hash,
    X,
    Camera,
    Globe,
    Users,
    Lock,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

const postTypeOptions: { value: PostType; label: string; icon: any; description: string }[] = [
    { value: 'TEXT', label: 'Text Post', icon: '📝', description: 'Share your thoughts' },
    { value: 'IMAGE', label: 'Image Post', icon: '🖼️', description: 'Share photos' },
    { value: 'VIDEO', label: 'Video Post', icon: '🎥', description: 'Share videos' },
    { value: 'ARTICLE', label: 'Article', icon: '📄', description: 'Write long-form content' },
    { value: 'QUESTION', label: 'Question', icon: '❓', description: 'Ask the community' },
    { value: 'POLL', label: 'Poll', icon: '📊', description: 'Create a poll' },
];

const privacyOptions: { value: PostPrivacy; label: string; icon: any; description: string }[] = [
    { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Everyone can see this post' },
    { value: 'FOLLOWERS', label: 'Followers', icon: Users, description: 'Only your followers can see this' },
    { value: 'PRIVATE', label: 'Private', icon: Lock, description: 'Only you can see this' },
];

export function PostComposer({
    onPostCreated,
    placeholder = "What's on your mind?",
    compact = false,
    className = ""
}: PostComposerProps) {
    const { createPost, isCreatingPost, createPostError } = usePostStore();
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
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Character and word counts
    const characterCount = PostUtils.Content.getCharacterCount(content);
    const wordCount = PostUtils.Content.getWordCount(content);
    const isOverLimit = characterCount > 10000;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate content
        const contentValidation = PostUtils.Content.validateContent(content);
        if (!contentValidation.valid) {
            return;
        }

        // Validate title for article/question types
        if ((postType === 'ARTICLE' || postType === 'QUESTION') && !title.trim()) {
            return;
        }

        // Validate tags
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
            media_urls: [], // Would be populated after media upload
            author_id: '', // Will be set by the service
        };

        const success = await createPost(postData);

        if (success) {
            // Reset form
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

            // Call callback if provided
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

    const handleMediaUpload = (files: FileList | null, type: 'image' | 'video') => {
        if (!files) return;

        const newFiles = Array.from(files).slice(0, 5 - mediaFiles.length); // Limit to 5 total
        setMediaFiles(prev => [...prev, ...newFiles]);

        // Update post type based on media
        if (type === 'image' && postType === 'TEXT') {
            setPostType('IMAGE');
        } else if (type === 'video' && postType === 'TEXT') {
            setPostType('VIDEO');
        }
    };

    const handleRemoveMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const selectedPostType = postTypeOptions.find(opt => opt.value === postType);
    const selectedPrivacy = privacyOptions.find(opt => opt.value === privacy);

    if (!isExpanded && compact) {
        return (
            <Card className={`mb-6 ${className}`}>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="flex-1 text-left px-4 py-3 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            {placeholder}
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`mb-6 ${className}`}>
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder-user.jpg" />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center space-x-2">
                                <Select value={postType} onValueChange={(value: PostType) => setPostType(value)}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue>
                                            <div className="flex items-center space-x-2">
                                                <span>{selectedPostType?.icon}</span>
                                                <span>{selectedPostType?.label}</span>
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {postTypeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center space-x-2">
                                                    <span>{option.icon}</span>
                                                    <div>
                                                        <div className="font-medium">{option.label}</div>
                                                        <div className="text-xs text-gray-500">{option.description}</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {compact && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Title (for articles and questions) */}
                    {(postType === 'ARTICLE' || postType === 'QUESTION') && (
                        <div>
                            <input
                                type="text"
                                placeholder={postType === 'ARTICLE' ? 'Article title...' : 'Your question...'}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-0 py-2 text-lg font-semibold bg-transparent border-none outline-none placeholder-gray-400"
                                maxLength={200}
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="relative">
                        <Textarea
                            placeholder={placeholder}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[120px] border-none bg-transparent resize-none text-base placeholder-gray-400 focus:ring-0"
                            maxLength={10000}
                        />

                        {/* Character count */}
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            <span className={isOverLimit ? 'text-red-500' : ''}>
                                {characterCount.toLocaleString()}/10,000
                            </span>
                            {wordCount > 0 && (
                                <span className="ml-2">
                                    {wordCount} words
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Media Preview */}
                    {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {mediaFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Upload ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-1 hover:text-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Tag Input */}
                    <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Add tags..."
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyDown={handleAddTag}
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
                            maxLength={50}
                        />
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Add location..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
                            maxLength={100}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-2">
                            <TooltipProvider>
                                {/* Image Upload */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={mediaFiles.length >= 5}
                                        >
                                            <Image className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Add images</TooltipContent>
                                </Tooltip>

                                {/* Video Upload */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => videoInputRef.current?.click()}
                                            disabled={mediaFiles.length >= 5}
                                        >
                                            <Video className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Add video</TooltipContent>
                                </Tooltip>

                                {/* Camera */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled
                                        >
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Take photo</TooltipContent>
                                </Tooltip>

                                {/* Emoji */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled
                                        >
                                            <Smile className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Add emoji</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Privacy Selector */}
                            <Select value={privacy} onValueChange={(value: PostPrivacy) => setPrivacy(value)}>
                                <SelectTrigger className="w-auto gap-1">
                                    <SelectValue>
                                        <div className="flex items-center space-x-1">
                                            {selectedPrivacy && <selectedPrivacy.icon className="h-3 w-3" />}
                                            <span className="text-xs">{selectedPrivacy?.label}</span>
                                        </div>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {privacyOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center space-x-2">
                                                <option.icon className="h-4 w-4" />
                                                <div>
                                                    <div className="font-medium">{option.label}</div>
                                                    <div className="text-xs text-gray-500">{option.description}</div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={!content.trim() || isOverLimit || isCreatingPost}
                            className="gap-2"
                        >
                            {isCreatingPost && <Loader2 className="h-4 w-4 animate-spin" />}
                            {postType === 'QUESTION' ? 'Ask Question' : 'Post'}
                        </Button>
                    </div>

                    {/* Error Message */}
                    {createPostError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {createPostError}
                        </div>
                    )}
                </form>

                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleMediaUpload(e.target.files, 'image')}
                    className="hidden"
                />
                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleMediaUpload(e.target.files, 'video')}
                    className="hidden"
                />
            </CardContent>
        </Card>
    );
}