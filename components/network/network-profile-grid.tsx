'use client';

import { ProfileCard } from './network-profile-card';
import type { FollowerProfile } from '@/lib/follow';

interface ProfileGridProps {
    profiles: FollowerProfile[];
    currentUser?: FollowerProfile;
    onConnectionChange?: () => void;
}

export function ProfileGrid({
    profiles,
    currentUser,
    onConnectionChange
}: ProfileGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {profiles.map((profile) => (
                <ProfileCard
                    key={profile.id}
                    profile={profile}
                    currentUser={currentUser}
                    onConnectionChange={onConnectionChange}
                />
            ))}
        </div>
    );
}
