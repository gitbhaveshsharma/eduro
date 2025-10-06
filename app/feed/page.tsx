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
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FeedPage() {
    const router = useRouter();
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

            {/* Navigation Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                        Eduro Community Feed
                    </div>
                </div>
            </div>

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
                        <div className="sticky top-32">
                            <SuggestionSection />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}