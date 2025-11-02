/**
 * Settings Search Component
 * 
 * Real-time search interface for filtering settings items
 * Features:
 * - Live search with debouncing
 * - Relevance-based sorting
 * - Category grouping
 * - No results state
 * - Keyboard navigation
 * - Responsive design
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { searchSettings } from './search-service';
import { SETTINGS_CATEGORIES } from './settings-data';
import type { SettingsSearchResult, UserRole } from './types';

interface SettingsSearchProps {
    userRole?: UserRole;
    className?: string;
    onResultClick?: (result: SettingsSearchResult) => void;
    placeholder?: string;
    debounceMs?: number;
}

export function SettingsSearch({
    userRole,
    className = '',
    onResultClick,
    placeholder = 'Search settings...',
    debounceMs = 300,
}: SettingsSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, debounceMs]);

    // Get search results
    const searchResults = useMemo(() => {
        return searchSettings(debouncedQuery, userRole);
    }, [debouncedQuery, userRole]);

    // Group results by category
    const groupedResults = useMemo(() => {
        const groups = new Map<string, SettingsSearchResult[]>();

        for (const result of searchResults) {
            const category = result.category;
            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(result);
        }

        return groups;
    }, [searchResults]);

    // Handle result click
    const handleResultClick = useCallback((result: SettingsSearchResult) => {
        if (onResultClick) {
            onResultClick(result);
        } else {
            router.push(result.href);
        }
        setQuery('');
        setIsFocused(false);
    }, [onResultClick, router]);

    // Handle clear
    const handleClear = useCallback(() => {
        setQuery('');
        setDebouncedQuery('');
    }, []);

    // Show results when there's a query or focused
    const showResults = (query.trim().length > 0 || isFocused) && searchResults.length >= 0;
    const hasResults = searchResults.length > 0;

    return (
        <div className={cn('relative w-full', className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        // Delay to allow click on results
                        setTimeout(() => setIsFocused(false), 200);
                    }}
                    className={cn(
                        'w-full pl-10 pr-10 h-11 bg-gray-50 border-gray-200 rounded-full',
                        'focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-transparent rounded-full',
                        'transition-all duration-200 rounded-full',
                        isFocused && 'ring-2 ring-brand-primary/20 bg-white rounded-full'
                    )}

                />
                {query && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-200 rounded-full"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
                <Card className={cn(
                    'absolute top-full left-0 right-0 mt-2 z-50',
                    'shadow-lg border border-gray-200 max-h-[70vh] overflow-hidden',
                    'animate-in fade-in slide-in-from-top-2 duration-200'
                )}>
                    <CardContent className="p-0">
                        <div className="max-h-[70vh] overflow-y-auto overscroll-contain scrollbar-modern">
                            {hasResults ? (
                                <div className="py-2">
                                    {/* Group by Category */}
                                    {Array.from(groupedResults.entries()).map(([categoryId, results], index) => {
                                        const categoryConfig = SETTINGS_CATEGORIES[categoryId as keyof typeof SETTINGS_CATEGORIES];
                                        const CategoryIcon = categoryConfig.icon;

                                        return (
                                            <div key={categoryId}>
                                                {index > 0 && <Separator className="my-2" />}

                                                {/* Category Header */}
                                                <div className="px-4 py-2 flex items-center gap-2">
                                                    <CategoryIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                        {categoryConfig.label}
                                                    </span>
                                                    <Badge variant="secondary" className="ml-auto h-5 px-2 text-xs">
                                                        {results.length}
                                                    </Badge>
                                                </div>

                                                {/* Results */}
                                                <div>
                                                    {results.map((result) => {
                                                        const ResultIcon = result.icon;

                                                        return (
                                                            <button
                                                                key={result.id}
                                                                onClick={() => handleResultClick(result)}
                                                                className={cn(
                                                                    'w-full flex items-start gap-3 px-4 py-3',
                                                                    'hover:bg-gray-50 transition-colors',
                                                                    'text-left group'
                                                                )}
                                                            >
                                                                {/* Icon */}
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                                                                        <ResultIcon className="h-4 w-4 text-brand-primary" />
                                                                    </div>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                            {result.name}
                                                                        </h4>
                                                                        {result.relevanceScore > 80 && (
                                                                            <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                                                                                Best Match
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                                        {result.description}
                                                                    </p>

                                                                    {/* Matched Fields */}
                                                                    {result.matchedFields.length > 0 && (
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            {result.matchedFields.map((field) => (
                                                                                <Badge
                                                                                    key={field}
                                                                                    variant="outline"
                                                                                    className="h-4 px-1 text-[10px] font-normal"
                                                                                >
                                                                                    {field}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Arrow */}
                                                                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // No Results
                                <div className="py-12 px-4 text-center">
                                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                                        <Search className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                                        No settings found
                                    </h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                        {query.trim()
                                            ? `No results for "${query}". Try different keywords.`
                                            : 'Start typing to search settings'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}