/**
 * Branch Classes Dashboard Component
 * 
 * Displays comprehensive overview of branch classes with:
 * - Statistics cards (total, active, full, completed classes)
 * - Utilization metrics
 * - Recent classes list
 * - Quick action buttons
 */

'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BranchClassesAPI,
    useClassesByBranch,
    useBranchStats,
    useClassesLoading,
    useBranchClassesStore,
    formatClassSchedule,
    getCapacityDisplay,
    formatClassStatus,
} from '@/lib/branch-system/branch-classes';
import {
    Users,
    BookOpen,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Calendar,
    Clock,
} from 'lucide-react';

interface DashboardProps {
    branchId?: string;
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
                <Icon className={`h-4 w-4 ${colorClass || 'text-muted-foreground'}`} />
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
function RecentClassesList({ branchId }: { branchId?: string }) {
    const classes = useClassesByBranch(branchId || '');
    const { fetchClasses } = useClassesLoading();

    // Get 5 most recent classes
    const recentClasses = classes
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    if (fetchClasses) {
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
                        className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{classItem.class_name}</h4>
                                <Badge variant={
                                    status.color === 'green' ? 'default' :
                                        status.color === 'yellow' ? 'secondary' :
                                            status.color === 'red' ? 'destructive' : 'outline'
                                }>
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
 */
export function BranchClassesDashboard({ branchId }: DashboardProps) {
    const stats = useBranchStats(branchId || '');
    const { stats: statsLoading } = useClassesLoading();

    // Fetch data on mount
    useEffect(() => {
        if (branchId) {
            useBranchClassesStore.getState().fetchBranchStats(branchId);
            BranchClassesAPI.fetchBranchClasses(branchId);
        }
    }, [branchId]);

    // Show loading skeletons
    if (statsLoading) {
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
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Classes"
                    value={stats?.total_classes || 0}
                    description="All classes in your branch"
                    icon={BookOpen}
                    colorClass="text-blue-600"
                />

                <StatCard
                    title="Active Classes"
                    value={stats?.active_classes || 0}
                    description="Currently running classes"
                    icon={CheckCircle}
                    colorClass="text-green-600"
                />

                <StatCard
                    title="Full Classes"
                    value={stats?.full_classes || 0}
                    description="Classes at max capacity"
                    icon={AlertCircle}
                    colorClass="text-orange-600"
                />

                <StatCard
                    title="Total Students"
                    value={stats?.total_students_enrolled || 0}
                    description={`Out of ${stats?.total_capacity || 0} capacity`}
                    icon={Users}
                    colorClass="text-purple-600"
                />
            </div>

            {/* Utilization Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
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
                                <span className="font-bold">{stats?.average_utilization || 0}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                                <div
                                    className="bg-primary h-3 rounded-full transition-all"
                                    style={{ width: `${stats?.average_utilization || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Enrolled</p>
                                <p className="text-2xl font-bold">{stats?.total_students_enrolled || 0}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Available Seats</p>
                                <p className="text-2xl font-bold">
                                    {(stats?.total_capacity || 0) - (stats?.total_students_enrolled || 0)}
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
                            <Clock className="h-5 w-5" />
                            Recent Classes
                        </CardTitle>
                        <CardDescription>
                            Latest classes created in your branch
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentClassesList branchId={branchId} />
                    </CardContent>
                </Card>

                {/* Classes by Subject */}
                <Card>
                    <CardHeader>
                        <CardTitle>Classes by Subject</CardTitle>
                        <CardDescription>
                            Distribution of classes across subjects
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats && Object.entries(stats.classes_by_subject).length > 0 ? (
                                Object.entries(stats.classes_by_subject)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([subject, count]) => (
                                        <div key={subject} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{subject}</span>
                                            <Badge variant="secondary">{count} {count === 1 ? 'class' : 'classes'}</Badge>
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
        </div>
    );
}
