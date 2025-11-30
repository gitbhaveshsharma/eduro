/**
 * Branch Classes Dashboard Component - FIXED VERSION
 * 
 * Key fixes:
 * 1. Uses cache properly - only fetches once on mount
 * 2. Updates automatically when classes are created/updated/deleted
 * 3. Better loading state management
 * 4. Prevents redundant API calls
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useSearchResults,
    useClassesLoading,
    useBranchClassesStore,
    useClassesByBranch,
    useClassesByCoachingCenter,
    formatClassSchedule,
    getCapacityDisplay,
    formatClassStatus,
} from '@/lib/branch-system/branch-classes';
import {
    Users,
    BookOpen,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Calendar,
    Clock,
    RefreshCw,
} from 'lucide-react';

interface DashboardProps {
    branchId?: string;
    coachingCenterId?: string;
}

/**
 * Statistics Card Component
 */
function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    colorClass,
}: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    trend?: string;
    colorClass?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                    <Icon className={`h-4 w-4 ${colorClass || 'text-muted-foreground'}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                {trend && (
                    <div className="flex items-center mt-2 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Recent Classes List Component
 */
function RecentClassesList({ 
    branchId, 
    coachingCenterId,
    classes 
}: { 
    branchId?: string; 
    coachingCenterId?: string;
    classes: any[];
}) {
    const { fetchClasses: isLoading } = useClassesLoading();

    // Get 5 most recent classes
    const recentClasses = classes
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    if (isLoading && classes.length === 0) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (recentClasses.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No classes found</p>
                <p className="text-sm">Create your first class to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recentClasses.map((classItem) => {
                const status = formatClassStatus(classItem.status);

                return (
                    <div
                        key={classItem.id}
                        className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                    >
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{classItem.class_name}</h4>
                                <Badge
                                    variant={
                                        status.color === 'green'
                                            ? 'default'
                                            : status.color === 'yellow'
                                                ? 'secondary'
                                                : status.color === 'red'
                                                    ? 'destructive'
                                                    : 'outline'
                                    }
                                >
                                    {status.label}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {classItem.subject} • {classItem.grade_level}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatClassSchedule(classItem)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {getCapacityDisplay(classItem)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Main Dashboard Component
 * 
 * Supports two modes:
 * 1. Branch mode (branchId) - Shows classes for a specific branch (for branch managers)
 * 2. Coaching Center mode (coachingCenterId) - Shows all classes across branches (for coaches)
 */
export function BranchClassesDashboard({ branchId, coachingCenterId }: DashboardProps) {
    const store = useBranchClassesStore();
    const { fetchClasses: isLoading } = useClassesLoading();

    // Get classes from appropriate source based on context
    const branchClasses = useClassesByBranch(branchId || null);
    const coachingCenterClasses = useClassesByCoachingCenter(coachingCenterId || null);

    // Determine which classes to use based on context
    const allClasses = branchId 
        ? branchClasses 
        : coachingCenterId 
            ? coachingCenterClasses 
            : [];

    // ✅ FIX: Only fetch once on mount using appropriate method
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!hasInitialized) {
            console.log('📊 Dashboard: Initial load - checking cache');

            if (branchId) {
                // Branch manager context - fetch only this branch's classes
                store.fetchClassesByBranch(branchId, false);
            } else if (coachingCenterId) {
                // Coach context - fetch all classes for the coaching center
                store.fetchClassesByCoachingCenter(coachingCenterId, false);
            }

            setHasInitialized(true);
        }
    }, [hasInitialized, branchId, coachingCenterId, store]);

    // ✅ Calculate stats from classes (updates automatically when cache is invalidated)
    const stats = {
        total_classes: allClasses.length,
        active_classes: allClasses.filter((c) => c.status === 'ACTIVE').length,
        full_classes: allClasses.filter(
            (c) => c.status === 'FULL' || c.current_enrollment >= c.max_students
        ).length,
        total_students_enrolled: allClasses.reduce((sum, c) => sum + c.current_enrollment, 0),
        total_capacity: allClasses.reduce((sum, c) => sum + c.max_students, 0),
        average_utilization:
            allClasses.length > 0
                ? Math.round(
                    allClasses.reduce(
                        (sum, c) => sum + (c.current_enrollment / c.max_students) * 100,
                        0
                    ) / allClasses.length
                )
                : 0,
        classes_by_subject: allClasses.reduce((acc, c) => {
            acc[c.subject] = (acc[c.subject] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    };

    // ✅ Manual refresh function
    const handleRefresh = () => {
        console.log('🔄 Dashboard: Manual refresh');
        if (branchId) {
            store.fetchClassesByBranch(branchId, true);
        } else if (coachingCenterId) {
            store.fetchClassesByCoachingCenter(coachingCenterId, true);
        }
    };

    // Determine context label for UI
    const contextLabel = branchId ? 'branch' : coachingCenterId ? 'coaching center' : '';

    // Show loading skeletons only on initial load
    if (isLoading && allClasses.length === 0) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Show stats
    return (
        <div className="space-y-6">
            {/* Header with Refresh Button */}
            {/* <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your {contextLabel} classes
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div> */}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Classes"
                    value={stats.total_classes}
                    description={`All classes in your ${contextLabel}`}
                    icon={BookOpen}
                    colorClass="text-blue-600"
                />

                <StatCard
                    title="Active Classes"
                    value={stats.active_classes}
                    description="Currently running classes"
                    icon={CheckCircle}
                    colorClass="text-green-600"
                />

                <StatCard
                    title="Full Classes"
                    value={stats.full_classes}
                    description="Classes at max capacity"
                    icon={AlertCircle}
                    colorClass="text-orange-600"
                />

                <StatCard
                    title="Total Students"
                    value={stats.total_students_enrolled}
                    description={`Out of ${stats.total_capacity} capacity`}
                    icon={Users}
                    colorClass="text-purple-600"
                />
            </div>

            {/* Utilization Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">

                            <TrendingUp className="h-5 w-5" />
                        </div>
                        Capacity Utilization
                    </CardTitle>
                    <CardDescription>
                        Overall enrollment efficiency across all classes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Utilization Rate</span>
                                <span className="font-bold">{stats.average_utilization}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all ${stats.average_utilization >= 90
                                        ? 'bg-red-500'
                                        : stats.average_utilization >= 70
                                            ? 'bg-orange-500'
                                            : 'bg-green-500'
                                        }`}
                                    style={{ width: `${stats.average_utilization}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Enrolled</p>
                                <p className="text-2xl font-bold">{stats.total_students_enrolled}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Available Seats</p>
                                <p className="text-2xl font-bold">
                                    {stats.total_capacity - stats.total_students_enrolled}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Classes and Classes by Subject */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Classes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">

                                <Clock className="h-5 w-5" />
                            </div>
                            Recent Classes
                        </CardTitle>
                        <CardDescription>Latest classes created in your {contextLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentClassesList 
                            branchId={branchId} 
                            coachingCenterId={coachingCenterId}
                            classes={allClasses}
                        />
                    </CardContent>
                </Card>

                {/* Classes by Subject */}
                <Card>
                    <CardHeader>
                        <CardTitle>Classes by Subject</CardTitle>
                        <CardDescription>Distribution of classes across subjects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats.classes_by_subject).length > 0 ? (
                                Object.entries(stats.classes_by_subject)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([subject, count]) => (
                                        <div
                                            key={subject}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                                        >
                                            <span className="text-sm font-medium">{subject}</span>
                                            <Badge variant="secondary">
                                                {count} {count === 1 ? 'class' : 'classes'}
                                            </Badge>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No subject data available
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ✅ Real-time update indicator */}
            {isLoading && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Updating...</span>
                </div>
            )}
        </div>
    );
}