"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FeedHeader,
    PostComposer,
    FeedSection,
    SuggestionSection,
    type FeedSortType
} from "@/components/feed";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProfileCard } from '@/components/profile/profile-card';
import { CoachingCenterCard } from '@/components/feed/feed-lms';
import { useCurrentProfile } from '@/lib/profile';

export default function FeedPage() {
    const router = useRouter();
    const [sortType, setSortType] = useState<FeedSortType>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Get current user profile
    const currentProfile = useCurrentProfile();

    // Handle initial component mount
    useEffect(() => {
        // Simulate initial data loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

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

    // Show loading spinner while page initializes
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <LoadingSpinner message="Loading community feed..." size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Feed Header - Sticky at top */}
            <FeedHeader
                currentSort={sortType}
                onSortChange={handleSortChange}
                onSearch={handleSearch}
                showSearch={true}
                showFilters={true}
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
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
