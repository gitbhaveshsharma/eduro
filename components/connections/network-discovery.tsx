'use client';

/**
 * Network Discovery Component
 * 
 * Allows users to discover and send connection requests to unknown users.
 * Features advanced filtering and search capabilities powered by the profile store (ProfileAPI).
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/avatar';
import { ConnectionButton } from './connection-button';
import { ProfileAPI } from '@/lib/profile';
import { ProfileDisplayUtils, ProfileUrlUtils } from '@/lib/utils/profile.utils';
import { useAuthStore } from '@/lib/auth-store';
import type { ProfileFilters, ProfileSort, PublicProfile } from '@/lib/schema/profile.types';
import type { FollowerProfile } from '@/lib/follow';
import { cn } from '@/lib/utils';

interface NetworkDiscoveryProps {
    className?: string;
}

const ROLE_OPTIONS = [
    { value: 'all', label: 'All Roles' },
    { value: 'S', label: ProfileDisplayUtils.getRoleDisplayName('S') },
    { value: 'T', label: ProfileDisplayUtils.getRoleDisplayName('T') },
    { value: 'C', label: ProfileDisplayUtils.getRoleDisplayName('C') },
];

const SORT_OPTIONS = [
    { value: 'created_at:desc', label: 'Recently Joined' },
    { value: 'created_at:asc', label: 'Oldest Members' },
    { value: 'reputation_score:desc', label: 'Highest Reputation' },
    { value: 'full_name:asc', label: 'Name (A-Z)' },
    { value: 'full_name:desc', label: 'Name (Z-A)' },
];

export function NetworkDiscovery({ className }: NetworkDiscoveryProps) {
    const { user } = useAuthStore();
    const [profiles, setProfiles] = useState<FollowerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Helper to convert PublicProfile to FollowerProfile
    const toFollowerProfile = (profile: PublicProfile): FollowerProfile => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name || ProfileDisplayUtils.getDisplayName(profile),
        bio: profile.bio || null,
        avatar_url: ProfileUrlUtils.getAvatarUrl(profile),
        role: profile.role,
        is_verified: profile.is_verified || false,
        is_online: profile.is_online || false,
        follower_count: 0, // Will be loaded separately if needed
        following_count: 0, // Will be loaded separately if needed
        created_at: profile.created_at,
    });

    // Helper to convert auth user to FollowerProfile
    const toFollowerProfileFromUser = (): FollowerProfile | undefined => {
        if (!user) return undefined;
        return {
            id: user.id,
            username: null,
            full_name: user.user_metadata?.full_name || null,
            bio: null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: (user.user_metadata?.role || 'S') as 'SA' | 'A' | 'S' | 'T' | 'C',
            is_verified: false,
            is_online: true,
            follower_count: 0,
            following_count: 0,
            created_at: user.created_at,
        };
    };

    // Filter state
    const [filters, setFilters] = useState<ProfileFilters>({});
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedSort, setSelectedSort] = useState<string>('created_at:desc');
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    // Advanced filters
    const [minReputation, setMinReputation] = useState<string>('');
    const [expertiseArea, setExpertiseArea] = useState<string>('');
    const [gradeLevel, setGradeLevel] = useState<string>('');

    // Search and fetch profiles
    const fetchProfiles = useCallback(async (page: number = 1, append: boolean = false) => {
        setIsLoading(true);
        try {
            // Build filters
            const profileFilters: ProfileFilters = {
                ...filters,
                search_query: searchQuery || undefined,
                role: selectedRole !== 'all' ? selectedRole as any : undefined,
                is_verified: showVerifiedOnly || undefined,
                is_online: showOnlineOnly || undefined,
                min_reputation: minReputation ? parseInt(minReputation) : undefined,
                expertise_areas: expertiseArea ? [expertiseArea] : undefined,
                grade_level: gradeLevel || undefined,
            };

            // Parse sort
            const [field, direction] = selectedSort.split(':');
            const sort: ProfileSort = {
                field: field as any,
                direction: direction as 'asc' | 'desc',
            };

            const result = await ProfileAPI.searchProfiles(profileFilters, sort, page, 20);

            // ProfileAPI.searchProfiles populates the profile store and returns the
            // `searchResults` shape (ProfileSearchResult) or null on failure.
            if (result) {
                const convertedProfiles = (result.profiles || []).map(toFollowerProfile);
                if (append) {
                    setProfiles(prev => [...prev, ...convertedProfiles]);
                } else {
                    setProfiles(convertedProfiles);
                }
                setTotalCount(result.total_count || convertedProfiles.length);
                setHasMore(Boolean(result.has_more));
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Failed to fetch profiles:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedRole, selectedSort, showVerifiedOnly, showOnlineOnly, minReputation, expertiseArea, gradeLevel, filters]);

    // Initial fetch
    useEffect(() => {
        fetchProfiles(1, false);
    }, []);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProfiles(1, false);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedRole, selectedSort, showVerifiedOnly, showOnlineOnly]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
    };

    const handleLoadMore = () => {
        fetchProfiles(currentPage + 1, true);
    };

    const handleApplyAdvancedFilters = () => {
        fetchProfiles(1, false);
    };

    const handleClearAdvancedFilters = () => {
        setMinReputation('');
        setExpertiseArea('');
        setGradeLevel('');
        fetchProfiles(1, false);
    };

    const activeFiltersCount = [
        showVerifiedOnly,
        showOnlineOnly,
        selectedRole !== 'all',
        minReputation,
        expertiseArea,
        gradeLevel,
    ].filter(Boolean).length;

    return (
        <div className={cn('space-y-6', className)}>
            {/* Search and Filter Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Discover Network
                            </CardTitle>
                            <CardDescription>
                                Find and connect with students, teachers, and coaches
                            </CardDescription>
                        </div>
                        <Badge variant="outline">
                            {totalCount} {totalCount === 1 ? 'user' : 'users'} found
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, username, or bio..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                            {searchQuery && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSearch('')}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Advanced Filters Sheet */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <Badge variant="secondary" className="ml-1">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Advanced Filters</SheetTitle>
                                    <SheetDescription>
                                        Refine your search with additional filters
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-6 mt-6">
                                    {/* Minimum Reputation */}
                                    <div className="space-y-2">
                                        <Label htmlFor="min-reputation">Minimum Reputation</Label>
                                        <Input
                                            id="min-reputation"
                                            type="number"
                                            placeholder="e.g., 100"
                                            value={minReputation}
                                            onChange={(e) => setMinReputation(e.target.value)}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Expertise Area */}
                                    <div className="space-y-2">
                                        <Label htmlFor="expertise">Expertise Area</Label>
                                        <Input
                                            id="expertise"
                                            placeholder="e.g., Mathematics, Science"
                                            value={expertiseArea}
                                            onChange={(e) => setExpertiseArea(e.target.value)}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Grade Level */}
                                    <div className="space-y-2">
                                        <Label htmlFor="grade-level">Grade Level</Label>
                                        <Input
                                            id="grade-level"
                                            placeholder="e.g., Grade 10"
                                            value={gradeLevel}
                                            onChange={(e) => setGradeLevel(e.target.value)}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1"
                                            onClick={handleApplyAdvancedFilters}
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleClearAdvancedFilters}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2">
                        {/* Role Filter */}
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sort Filter */}
                        <Select value={selectedSort} onValueChange={setSelectedSort}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Verified Toggle */}
                        <Button
                            variant={showVerifiedOnly ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                        >
                            Verified Only
                        </Button>

                        {/* Online Toggle */}
                        <Button
                            variant={showOnlineOnly ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                        >
                            Online Only
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {isLoading && profiles.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Searching network...</p>
                    </div>
                </div>
            ) : profiles.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Try adjusting your filters or search query to find more people in the network.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Profile Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profiles.map((profile) => (
                            <Card key={profile.id}>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <UserAvatar
                                            profile={profile}
                                            size="lg"
                                            showOnlineStatus
                                            className="flex-shrink-0"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {ProfileDisplayUtils.getDisplayName(profile)}
                                                </h3>
                                                {profile.is_verified && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Verified
                                                    </Badge>
                                                )}
                                            </div>

                                            {profile.username && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    @{profile.username}
                                                </p>
                                            )}
                                            <div className="mt-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {ProfileDisplayUtils.getRoleDisplayName(profile.role)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <ConnectionButton
                                                targetUser={profile}
                                                currentUser={toFollowerProfileFromUser()}
                                                size="sm"
                                                showText={false}
                                                showIcon={true}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading more...
                                    </>
                                ) : (
                                    <>
                                        Load More
                                        <Badge variant="secondary" className="ml-2">
                                            {profiles.length} of {totalCount}
                                        </Badge>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
