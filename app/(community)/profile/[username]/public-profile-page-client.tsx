'use client';

/**
 * Public Profile Page Client Component
 * 
 * Handles client-side interactivity for the public profile page.
 * Wrapped with ConditionalLayout to include network navigation headers.
 */

import { PublicProfileView } from '@/components/profile/public-profile';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import type { PublicProfile } from '@/lib/schema/profile.types';


interface PublicProfilePageClientProps {
    profile: PublicProfile;
    currentUserId?: string;
    isOwnProfile: boolean;
}

export function PublicProfilePageClient({
    profile,
    currentUserId,
    isOwnProfile,
}: PublicProfilePageClientProps) {
    return (
        <ConditionalLayout
            forceConfig={{
                platform: 'community',
                page: 'network',
                headerType: 'network',
                bottomNavType: 'network',
            }}
        >
            <PublicProfileView
                profile={profile}
                currentUserId={currentUserId}
                isOwnProfile={isOwnProfile}
            />
        </ConditionalLayout>
    );
}
