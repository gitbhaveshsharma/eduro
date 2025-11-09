/**
 * Profile Social Links Component
 * 
 * Manages user's social media links and professional profiles
 */

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Profile, ProfileUpdate } from '@/lib/schema/profile.types';
import { ProfileValidationUtils } from '@/lib/utils/profile.utils';
import { useProfileStore } from '@/lib/store/profile.store';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Loader2,
    Save,
    X,
    Globe,
    Linkedin,
    Github,
    Twitter,
    ExternalLink
} from 'lucide-react';

// Validation schema
const socialLinksSchema = z.object({
    website_url: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
    linkedin_url: z.string().url('Invalid LinkedIn URL').nullable().optional().or(z.literal('')),
    github_url: z.string().url('Invalid GitHub URL').nullable().optional().or(z.literal('')),
    twitter_url: z.string().url('Invalid Twitter/X URL').nullable().optional().or(z.literal('')),
});

type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

interface ProfileSocialLinksProps {
    profile: Profile;
    onSuccess?: () => void;
    className?: string;
}

export function ProfileSocialLinks({ profile, onSuccess, className = '' }: ProfileSocialLinksProps) {
    const { updateCurrentProfile } = useProfileStore();
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch
    } = useForm<SocialLinksFormValues>({
        resolver: zodResolver(socialLinksSchema),
        defaultValues: {
            website_url: profile.website_url || '',
            linkedin_url: profile.linkedin_url || '',
            github_url: profile.github_url || '',
            twitter_url: profile.twitter_url || '',
        }
    });

    // Watch values for validation
    const watchedWebsite = watch('website_url');
    const watchedLinkedin = watch('linkedin_url');
    const watchedGithub = watch('github_url');
    const watchedTwitter = watch('twitter_url');

    // Handle form submission
    const onSubmit = async (data: SocialLinksFormValues) => {
        setIsSaving(true);

        try {
            // Convert empty strings to null
            const updates: ProfileUpdate = {
                website_url: data.website_url === '' ? null : data.website_url,
                linkedin_url: data.linkedin_url === '' ? null : data.linkedin_url,
                github_url: data.github_url === '' ? null : data.github_url,
                twitter_url: data.twitter_url === '' ? null : data.twitter_url,
            };

            const success = await updateCurrentProfile(updates);

            if (success) {
                showSuccessToast('Social links updated successfully');
                reset(data); // Reset form dirty state
                onSuccess?.();
            } else {
                showErrorToast('Failed to update social links. Please try again.');
            }
        } catch (error) {
            console.error('Social links update error:', error);
            showErrorToast('An error occurred while updating social links');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        reset();
    };

    // Handle preview link
    const handlePreview = (url: string | null | undefined) => {
        if (url && url.trim() !== '') {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Social Links
                    </CardTitle>
                    <CardDescription>
                        Connect your social media and professional profiles
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Website */}
                    <div className="space-y-2">
                        <Label htmlFor="website_url" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="website_url"
                                {...register('website_url')}
                                type="url"
                                placeholder="https://yourwebsite.com"
                                className={errors.website_url ? 'border-destructive' : ''}
                            />
                            {watchedWebsite && watchedWebsite !== '' && !errors.website_url && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePreview(watchedWebsite)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {errors.website_url && (
                            <p className="text-sm text-destructive">{errors.website_url.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your personal or professional website
                        </p>
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-2">
                        <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="linkedin_url"
                                {...register('linkedin_url')}
                                type="url"
                                placeholder="https://linkedin.com/in/username"
                                className={errors.linkedin_url ? 'border-destructive' : ''}
                            />
                            {watchedLinkedin && watchedLinkedin !== '' && !errors.linkedin_url && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePreview(watchedLinkedin)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {errors.linkedin_url && (
                            <p className="text-sm text-destructive">{errors.linkedin_url.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your LinkedIn professional profile
                        </p>
                    </div>

                    {/* GitHub */}
                    <div className="space-y-2">
                        <Label htmlFor="github_url" className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            GitHub
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="github_url"
                                {...register('github_url')}
                                type="url"
                                placeholder="https://github.com/username"
                                className={errors.github_url ? 'border-destructive' : ''}
                            />
                            {watchedGithub && watchedGithub !== '' && !errors.github_url && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePreview(watchedGithub)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {errors.github_url && (
                            <p className="text-sm text-destructive">{errors.github_url.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your GitHub developer profile
                        </p>
                    </div>

                    {/* Twitter/X */}
                    <div className="space-y-2">
                        <Label htmlFor="twitter_url" className="flex items-center gap-2">
                            <Twitter className="h-4 w-4" />
                            Twitter / X
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="twitter_url"
                                {...register('twitter_url')}
                                type="url"
                                placeholder="https://twitter.com/username or https://x.com/username"
                                className={errors.twitter_url ? 'border-destructive' : ''}
                            />
                            {watchedTwitter && watchedTwitter !== '' && !errors.twitter_url && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePreview(watchedTwitter)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {errors.twitter_url && (
                            <p className="text-sm text-destructive">{errors.twitter_url.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your Twitter or X social profile
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={!isDirty || isSaving}
                >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Links
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
