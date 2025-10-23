'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProfileCard } from './network-profile-card';
import type { FollowerProfile } from '@/lib/follow';

const PROFILES_PER_PAGE = 21; // 3 columns * 7 rows

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
    const [visibleCount, setVisibleCount] = useState(PROFILES_PER_PAGE);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting) {
            setVisibleCount(prev => Math.min(prev + PROFILES_PER_PAGE, profiles.length));
        }
    }, [profiles.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, {
            root: null, // viewport
            rootMargin: '200px', // Load a bit before it's visible
            threshold: 0.1
        });

        const sentinel = sentinelRef.current;
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [handleIntersection]);

    // Reset visible count when profiles change
    useEffect(() => {
        setVisibleCount(PROFILES_PER_PAGE);
    }, [profiles]);

    const visibleProfiles = profiles.slice(0, visibleCount);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {visibleProfiles.map((profile, idx) => (
                <ProfileCard
                    key={profile.id}
                    profile={profile}
                    currentUser={currentUser}
                    onConnectionChange={onConnectionChange}
                    index={idx}
                />
            ))}
            {/* Sentinel for infinite scroll */}
            {visibleCount < profiles.length && <div ref={sentinelRef} style={{ height: 1 }} />} 
        </div>
    );
}
