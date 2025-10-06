"use client";

import { useState } from "react";
import {
    FeedHeader,
    PostComposer,
    FeedSection,
    SuggestionSection,
    type FeedSortType
} from "@/components/feed";
import { usePostStore } from "@/lib/post";

export default function FeedPage() {
    const [sortType, setSortType] = useState<FeedSortType>('recent');
    const [searchQuery, setSearchQuery] = useState('');

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