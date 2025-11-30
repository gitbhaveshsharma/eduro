/**
 * Public Profile Page
 * 
 * Displays a user's public profile based on their username.
 * Uses server-side rendering for SEO and initial data fetch.
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ProfileServerService } from '@/lib/service/server/profile-server.service';
import { PublicProfilePageClient } from './public-profile-page-client';

// Force dynamic rendering since we need to check auth state
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ username: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params;
    const profile = await ProfileServerService.getProfileByUsername(username);

    if (!profile) {
        return {
            title: 'Profile Not Found | Eduro',
            description: 'The requested profile could not be found.',
        };
    }

    const displayName = profile.full_name || profile.username || 'User';
    const description = profile.bio
        ? profile.bio.substring(0, 160)
        : `Check out ${displayName}'s profile on Eduro`;

    return {
        title: `${displayName} | Eduro`,
        description,
        openGraph: {
            title: `${displayName} | Eduro`,
            description,
            type: 'profile',
            url: `/profile/${username}`,
        },
        twitter: {
            card: 'summary',
            title: `${displayName} | Eduro`,
            description,
        },
    };
}

export default async function PublicProfilePage({ params }: PageProps) {
    const { username } = await params;

    // Fetch the profile by username (server-side)
    const profile = await ProfileServerService.getProfileByUsername(username);

    if (!profile) {
        notFound();
    }

    // Get current user to determine if viewing own profile
    const currentProfile = await ProfileServerService.getCurrentProfile();
    const isOwnProfile = currentProfile?.id === profile.id;
    const currentUserId = currentProfile?.id;

    // Convert to PublicProfile type
    const publicProfile = {
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        role: profile.role,
        is_online: profile.is_online,
        reputation_score: profile.reputation_score,
        expertise_areas: profile.expertise_areas,
        years_of_experience: profile.years_of_experience,
        grade_level: profile.grade_level,
        subjects_of_interest: profile.subjects_of_interest,
        is_verified: profile.is_verified,
        created_at: profile.created_at,
        last_seen_at: profile.last_seen_at,
    };

    return (
        <PublicProfilePageClient
            profile={publicProfile}
            currentUserId={currentUserId}
            isOwnProfile={isOwnProfile}
        />
    );
}
