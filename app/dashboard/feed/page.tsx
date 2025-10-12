"use client";

import { useState, useEffect } from "react";
import {
    FeedHeader,
    PostComposer,
    FeedSection,
    SuggestionSection,
    type FeedSortType
} from "@/components/feed";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function FeedPage() {
    const [sortType, setSortType] = useState<FeedSortType>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Feed Column */}
                    <div className="lg:col-span-3 space-y-6">
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

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <SuggestionSection />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
