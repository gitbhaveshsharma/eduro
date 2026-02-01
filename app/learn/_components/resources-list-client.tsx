/**
 * Resources List Client Component
 * Handles client-side interactions for the resources list
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    BookOpen,
    Filter,
    CheckCircle2,
    Clock,
    TrendingUp,
    GraduationCap,
} from 'lucide-react';
import type { LearningResource } from '@/lib/learning-resources/data';
import { ResourceCard, ResourceCardSkeleton } from '@/components/learning-resources/resource-card';
import { useAllReadingProgress, formatTimeSpent } from '@/lib/learning-resources/use-reading-progress';
import { getAllSubjects, getSubjectConfig } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import { UserAvatar } from '@/components/avatar';
import { useProfileStore } from '@/lib/store/profile.store';

interface ResourcesListClientProps {
    resources: LearningResource[];
}

// Build subjects from subject-assets
const SUBJECTS = [
    { id: 'all', name: 'All Subjects', icon: '📚' },
    ...getAllSubjects()
        .filter(s => ['physics', 'geography', 'chemistry', 'business_studies', 'english', 'biology', 'mathematics', 'history', 'science'].includes(s.id))
        .map(s => ({
            id: s.id,
            name: s.name,
            icon: s.icon,
        })),
];

export function ResourcesListClient({ resources }: ResourcesListClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [showInProgress, setShowInProgress] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // User profile
    const currentProfile = useProfileStore(state => state.currentProfile);

    const {
        isLoaded,
        getProgressPercentage,
        getStatus,
        getStats,
    } = useAllReadingProgress();

    const stats = getStats();

    // Filter resources
    const filteredResources = useMemo(() => {
        return resources.filter(resource => {
            // Subject filter
            if (selectedSubject !== 'all' && resource.subject.id !== selectedSubject) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = resource.title.toLowerCase().includes(query);
                const matchesSubject = resource.subject.name.toLowerCase().includes(query);
                const matchesSummary = resource.summary.toLowerCase().includes(query);
                if (!matchesTitle && !matchesSubject && !matchesSummary) {
                    return false;
                }
            }

            // In-progress filter
            if (showInProgress) {
                const status = getStatus(resource.id);
                if (status !== 'in-progress') {
                    return false;
                }
            }

            return true;
        });
    }, [resources, selectedSubject, searchQuery, showInProgress, getStatus]);

    const handleResourceClick = (resource: LearningResource) => {
        router.push(`/learn/${resource.slug}`);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Header */}
            <header className="bg-gradient-to-br from-primary/5 via-transparent to-transparent py-10 md:py-14 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <BookOpen className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    Learning Resources
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Educational articles for classes 5-10
                                </p>
                            </div>
                        </div>

                        {/* User Avatar */}
                        {currentProfile && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground hidden sm:inline">
                                    {currentProfile.full_name?.split(' ')[0] || currentProfile.username}
                                </span>
                                <UserAvatar profile={currentProfile} size="sm" />
                            </div>
                        )}
                    </div>

                    <p className="text-base text-muted-foreground max-w-2xl mb-6">
                        Explore easy-to-understand learning materials. Track your progress as you read.
                    </p>

                    {/* Stats Cards - with skeleton loading */}
                    {!isLoaded ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="border-border/50">
                                    <CardContent className="p-3">
                                        <div className="flex items-center gap-2.5">
                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                            <div className="flex-1">
                                                <Skeleton className="h-6 w-12 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="border-border/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{resources.length}</p>
                                            <p className="text-[11px] text-muted-foreground">Resources</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-warning/10 rounded-lg">
                                            <TrendingUp className="h-4 w-4 text-warning" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{stats.inProgress}</p>
                                            <p className="text-[11px] text-muted-foreground">In Progress</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-success/10 rounded-lg">
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{stats.completed}</p>
                                            <p className="text-[11px] text-muted-foreground">Completed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-secondary/10 rounded-lg">
                                            <Clock className="h-4 w-4 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">
                                                {formatTimeSpent(stats.totalTimeSpent)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">Time Spent</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </header>

            <section className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-max md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search resources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                className={`pl-10 h-9 text-sm transition-all duration-300 ${isFocused ? 'w-48' : 'w-full'}`}
                            />
                        </div>

                        {/* Subject Filters */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                            {SUBJECTS.map((subject) => (
                                <Button
                                    key={subject.id}
                                    variant={selectedSubject === subject.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedSubject(subject.id)}
                                    className="flex-shrink-0 h-8 text-xs"
                                >
                                    <span className="mr-1">{subject.icon}</span>
                                    {subject.name}
                                </Button>
                            ))}
                        </div>

                        {/* In Progress Toggle */}
                        <Button
                            variant={showInProgress ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setShowInProgress(!showInProgress)}
                            className="flex-shrink-0 h-8 text-xs"
                        >
                            <Filter className="h-3.5 w-3.5 mr-1.5" />
                            In Progress
                        </Button>
                    </div>
                </div>
            </section>


            {/* Resources Grid */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {filteredResources.length === 0 ? (
                    <div className="text-center py-16">
                        <GraduationCap className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No resources found</h3>
                        <p className="text-muted-foreground mb-4">
                            Try adjusting your filters or search query
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedSubject('all');
                                setShowInProgress(false);
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredResources.length} of {resources.length} resources
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredResources.map((resource) => (
                                <ResourceCard
                                    key={resource.id}
                                    resource={resource}
                                    progress={getProgressPercentage(resource.id)}
                                    status={getStatus(resource.id)}
                                    onStart={() => handleResourceClick(resource)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Info Section */}
            <section className="bg-muted/20 py-10 border-t border-border/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center md:text-left">
                            <div className="p-2 bg-primary/10 rounded-lg w-fit mx-auto md:mx-0 mb-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">Easy to Understand</h3>
                            <p className="text-xs text-muted-foreground">
                                Content written for students of classes 5-10 with simple language.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="p-2 bg-success/10 rounded-lg w-fit mx-auto md:mx-0 mb-3">
                                <TrendingUp className="h-5 w-5 text-success" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">Track Your Progress</h3>
                            <p className="text-xs text-muted-foreground">
                                Progress saved automatically. Pick up where you left off.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="p-2 bg-secondary/10 rounded-lg w-fit mx-auto md:mx-0 mb-3">
                                <GraduationCap className="h-5 w-5 text-secondary" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">Learn at Your Pace</h3>
                            <p className="text-xs text-muted-foreground">
                                No rush! Mark sections complete when you're ready.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
