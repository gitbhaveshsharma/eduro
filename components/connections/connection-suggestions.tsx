'use client';

/**
 * Connection Suggestions Component
 * 
 * Displays suggested connections based on mutual connections,
 * role, and other factors. Auto-refreshes suggestions.
 */

import { useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectionCard } from './connection-card';
import {
    useFollowSuggestions,
    useSuggestionsLoading,
    useFollowStore,
} from '@/lib/follow';
import type { FollowerProfile } from '@/lib/follow';
import { cn } from '@/lib/utils';

interface ConnectionSuggestionsProps {
    currentUser?: FollowerProfile;
    limit?: number;
    showRefreshButton?: boolean;
    className?: string;
}

export function ConnectionSuggestions({
    currentUser,
    limit = 10,
    showRefreshButton = true,
    className,
}: ConnectionSuggestionsProps) {
    const { loadSuggestions } = useFollowStore();
    const suggestions = useFollowSuggestions();
    const isLoading = useSuggestionsLoading();

    useEffect(() => {
        loadSuggestions(limit, false);
    }, [limit]);

    const handleRefresh = () => {
        loadSuggestions(limit, true);
    };

    const getSuggestionReasonBadge = (reason: string) => {
        switch (reason) {
            case 'mutual_connections':
                return { label: 'Mutual Connections', variant: 'default' as const };
            case 'same_role':
                return { label: 'Same Role', variant: 'secondary' as const };
            case 'popular':
                return { label: 'Popular', variant: 'outline' as const };
            case 'same_interests':
                return { label: 'Similar Interests', variant: 'default' as const };
            case 'recent_activity':
                return { label: 'Active', variant: 'secondary' as const };
            default:
                return { label: 'Suggested', variant: 'outline' as const };
        }
    };

    if (isLoading && !suggestions) {
        return (
            <div className={cn('', className)}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!suggestions || suggestions.suggestions.length === 0) {
        return (
            <div className={cn('', className)}>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No suggestions available</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-4">
                        We'll find more people for you to connect with soon.
                    </p>
                    {showRefreshButton && (
                        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Check Again
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Suggested Connections</h2>
                </div>
                {showRefreshButton && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </>
                        )}
                    </Button>
                )}
            </div>

            <p className="text-sm text-muted-foreground">
                {suggestions.suggestions.length} suggested{' '}
                {suggestions.suggestions.length === 1 ? 'connection' : 'connections'}
            </p>

            {/* Suggestions List */}
            <div className="space-y-3">
                {suggestions.suggestions.map((suggestion) => {
                    const reasonBadge = getSuggestionReasonBadge(suggestion.reason);

                    return (
                        <div key={suggestion.user.id} className="relative">
                            <ConnectionCard
                                user={suggestion.user}
                                currentUser={currentUser}
                                showStats
                                showMutualBadge={false}
                            />

                            {/* Reason Badge */}
                            <div className="absolute top-4 right-4">
                                <Badge variant={reasonBadge.variant} className="text-xs">
                                    {reasonBadge.label}
                                    {suggestion.connection_count && suggestion.connection_count > 0 && (
                                        <span className="ml-1">({suggestion.connection_count})</span>
                                    )}
                                </Badge>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Next Refresh Info */}
            {suggestions.refresh_available_at && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    New suggestions will be available soon
                </p>
            )}
        </div>
    );
}
