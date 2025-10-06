"use client";

import { useState } from "react";
import { Search, Filter, TrendingUp, Clock, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type FeedSortType = 'recent' | 'trending' | 'popular' | 'following';

interface FeedHeaderProps {
    currentSort?: FeedSortType;
    onSortChange?: (sort: FeedSortType) => void;
    onSearch?: (query: string) => void;
    showSearch?: boolean;
    showFilters?: boolean;
    className?: string;
}

const sortOptions = [
    {
        value: 'recent' as const,
        label: 'Recent',
        icon: Clock,
        description: 'Latest posts first'
    },
    {
        value: 'trending' as const,
        label: 'Trending',
        icon: TrendingUp,
        description: 'High engagement posts'
    },
    {
        value: 'popular' as const,
        label: 'Popular',
        icon: Sparkles,
        description: 'Most liked posts'
    },
    {
        value: 'following' as const,
        label: 'Following',
        icon: Users,
        description: 'Posts from people you follow'
    }
];

export function FeedHeader({
    currentSort = 'recent',
    onSortChange,
    onSearch,
    showSearch = true,
    showFilters = true,
    className = ''
}: FeedHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(searchQuery);
    };

    const handleSortSelect = (sort: FeedSortType) => {
        onSortChange?.(sort);
    };

    const currentSortOption = sortOptions.find(option => option.value === currentSort);

    return (
        <div className={`bg-white border-b border-gray-200 sticky top-0 z-10 ${className}`}>
            <div className="px-4 py-3">
                {/* Main Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-xl font-semibold text-gray-900">Feed</h1>
                        <Badge variant="secondary" className="text-xs">
                            Latest Updates
                        </Badge>
                    </div>

                    {/* Sort Dropdown */}
                    {showFilters && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    {currentSortOption && (
                                        <currentSortOption.icon className="h-4 w-4" />
                                    )}
                                    {currentSortOption?.label || 'Sort'}
                                    <Filter className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Sort posts by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {sortOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => handleSortSelect(option.value)}
                                        className="flex items-start gap-3 p-3 cursor-pointer"
                                    >
                                        <option.icon className="h-4 w-4 mt-0.5 text-gray-500" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{option.label}</span>
                                                {currentSort === option.value && (
                                                    <Badge variant="default" className="text-xs px-1 py-0">
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {option.description}
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search posts, topics, or users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                    </form>
                )}

                {/* Active Sort Display */}
                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        {currentSortOption && (
                            <>
                                <currentSortOption.icon className="h-4 w-4" />
                                <span>Showing {currentSortOption.label.toLowerCase()} posts</span>
                            </>
                        )}
                    </div>

                    {searchQuery && (
                        <div className="flex items-center gap-2">
                            <span>Search: "{searchQuery}"</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    onSearch?.('');
                                }}
                                className="h-6 px-2 text-xs"
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}