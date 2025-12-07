'use client';

/**
 * Public Profile View Component
 * 
 * Main wrapper component that combines all profile sub-components
 * into a cohesive public profile page layout.
 */

import { memo } from 'react';
import { PublicProfileHeader } from './public-profile-header';
import { PublicProfileAbout } from './public-profile-about';
import { PublicProfileStats } from './public-profile-stats';
import { PublicProfileActions } from './public-profile-actions';
import { PublicProfilePosts } from './public-profile-posts';
import { PublicProfileConnections } from './public-profile-connections';
import type { PublicProfile } from '@/lib/schema/profile.types';
import { cn } from '@/lib/utils';

interface PublicProfileViewProps {
    profile: PublicProfile;
    currentUserId?: string;
    isOwnProfile?: boolean;
    className?: string;
}

export const PublicProfileView = memo(function PublicProfileView({
    profile,
    currentUserId,
    isOwnProfile = false,
    className,
}: PublicProfileViewProps) {
    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/profile/${profile.username || profile.id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile.full_name || profile.username}'s Profile`,
                    url: profileUrl,
                });
            } catch (err) {
                // User cancelled, ignore
            }
        }
    };

    return (
        <div className={cn('min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5', className)}>
            <div className="max-w-7xl mx-auto">
                {/* Header with cover and basic info */}
                <PublicProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    onShare={handleShare}
                />

                {/* Content Grid */}
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Actions, Connections, and Stats */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Actions Card */}
                            <PublicProfileActions
                                profile={profile}
                                currentUserId={currentUserId}
                                isOwnProfile={isOwnProfile}
                            />

                            {/* Connections Card - Followers/Following */}
                            <PublicProfileConnections
                                profile={profile}
                                currentUserId={currentUserId}
                            />

                            {/* Stats Card */}
                            <PublicProfileStats profile={profile} />
                        </div>

                        {/* Right Column - About, Details, and Posts */}
                        <div className="lg:col-span-2 space-y-6">
                            <PublicProfileAbout profile={profile} />

                            {/* User Posts Section */}
                            <PublicProfilePosts profile={profile} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
