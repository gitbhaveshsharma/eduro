"use client";

import { useState, useEffect } from "react";
import {
    PostComposer,
    FeedSection,
    SuggestionSection,
    type FeedSortType
} from "@/components/feed";
import { ProfileCard } from '@/components/profile/profile-card';
import { CoachingCenterCard } from '@/components/feed/feed-lms';
import { useCurrentProfile } from '@/lib/profile';

export default function FeedPage() {
    const [sortType, setSortType] = useState<FeedSortType>('recent');
    const [searchQuery, setSearchQuery] = useState('');

    // Get current user profile
    const currentProfile = useCurrentProfile();

    const handleSortChange = (newSort: FeedSortType) => {
        setSortType(newSort);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handlePostCreated = (postId: string) => {
        // Optionally refresh feed or show success message
        console.log('Post created:', postId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">

            {/* Main Content - header is provided by ConditionalLayout */}
            <div className="max-w-7xl  mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - Profile Card & Coaching Center (Hidden on mobile/tablet) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-24 space-y-6">
                            {/* User Profile Card */}
                            {currentProfile && (
                                <div>
                                    <ProfileCard profile={currentProfile} />
                                </div>
                            )}

                            {/* Coaching Center Card - Only show for students */}
                            {currentProfile?.role === 'S' && (
                                <div>
                                    <CoachingCenterCard />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Feed Column */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Post Composer */}
                        <PostComposer
                            onPostCreated={handlePostCreated}
                            placeholder="Share your thoughts, ask questions, or start a discussion..."
                            compact={false}
                        />

                        {/* Feed Section */}
                        <FeedSection
                            sortType={sortType}
                            searchQuery={searchQuery}
                        />
                    </div>

                    {/* Right Sidebar - Suggestions (Hidden on mobile/tablet) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-24">
                            <SuggestionSection />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
