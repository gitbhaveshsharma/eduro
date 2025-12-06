/**
 * Branch Teachers Dashboard Component
 * 
 * Displays comprehensive statistics and analytics for branch teachers
 * Features: Stat cards, recent assignments, teachers needing attention
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useBranchTeacherStore } from '@/lib/branch-system/stores/branch-teacher.store';
import {
    EXPERIENCE_LEVEL_OPTIONS,
} from '@/lib/branch-system/types/branch-teacher.types';
import {
    getExperienceLevelLabel,
} from '@/lib/branch-system/utils/branch-teacher.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    UserCheck,
    Clock,
    AlertTriangle,
    TrendingUp,
    Calendar,
    GraduationCap,
    BookOpen,
    Award,
} from 'lucide-react';

// Helper function to format date
function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ElementType;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    colorClass?: string;
    className?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, colorClass, className }: StatCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className={`h-4 w-4 ${colorClass || 'text-primary'}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
                        <span>{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RecentAssignmentsList() {
    const { branchTeachers, listLoading } = useBranchTeacherStore();

    // Sort by active status first, then use id for ordering (newer entries have later ids)
    const recentAssignments = [...branchTeachers]
        .filter((t) => t.is_active)
        .slice(0, 5);

    if (listLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (recentAssignments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">No teacher assignments yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recentAssignments.map((teacher, index) => (
                <div key={teacher.id}>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {teacher.teacher_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {teacher.teaching_subjects.slice(0, 2).join(', ')}
                                {teacher.teaching_subjects.length > 2 && ` +${teacher.teaching_subjects.length - 2} more`}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                                {teacher.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant={EXPERIENCE_LEVEL_OPTIONS[teacher.experience_level].color as any}>
                                {getExperienceLevelLabel(teacher.teaching_experience_years)}
                            </Badge>
                        </div>
                    </div>
                    {index < recentAssignments.length - 1 && <Separator className="mt-4" />}
                </div>
            ))}
        </div>
    );
}

interface BranchTeachersDashboardProps {
    /** When provided, shows stats for a single branch (branch manager view) */
    branchId?: string;
    /** When provided, shows stats across all branches (coach/owner view) */
    coachingCenterId?: string;
}

export function BranchTeachersDashboard({ branchId, coachingCenterId }: BranchTeachersDashboardProps) {
    const {
        statsLoading,
        fetchCoachingCenterTeachers,
        fetchBranchTeachers,
        branchTeachers,
        listLoading,
    } = useBranchTeacherStore();

    useEffect(() => {
        // Fetch teachers based on whether we're viewing a single branch or entire coaching center
        if (branchId) {
            fetchBranchTeachers(branchId);
        } else if (coachingCenterId) {
            fetchCoachingCenterTeachers(coachingCenterId);
        }
    }, [branchId, coachingCenterId, fetchBranchTeachers, fetchCoachingCenterTeachers]);

    const calculatedStats = useMemo(() => {
        if (branchTeachers.length === 0) {
            return {
                total_teachers: 0,
                active_teachers: 0,
                inactive_teachers: 0,
                average_experience: 0,
                teachers_by_experience_level: {} as Record<string, number>,
                unique_subjects: [] as string[],
            };
        }

        const experienceLevelCounts: Record<string, number> = {};

        let activeCount = 0;
        let inactiveCount = 0;
        let totalExperience = 0;
        let experienceCount = 0;
        const allSubjects = new Set<string>();

        branchTeachers.forEach((teacher) => {
            experienceLevelCounts[teacher.experience_level] =
                (experienceLevelCounts[teacher.experience_level] || 0) + 1;

            if (teacher.is_active) {
                activeCount++;
            } else {
                inactiveCount++;
            }

            if (teacher.teaching_experience_years !== null) {
                totalExperience += teacher.teaching_experience_years;
                experienceCount++;
            }

            teacher.teaching_subjects.forEach((subject) => allSubjects.add(subject));
        });

        const averageExperience = experienceCount > 0 ? totalExperience / experienceCount : 0;

        return {
            total_teachers: branchTeachers.length,
            active_teachers: activeCount,
            inactive_teachers: inactiveCount,
            average_experience: averageExperience,
            teachers_by_experience_level: experienceLevelCounts,
            unique_subjects: Array.from(allSubjects),
        };
    }, [branchTeachers]);

    const activeTeachersRate = calculatedStats.total_teachers > 0
        ? ((calculatedStats.active_teachers / calculatedStats.total_teachers) * 100).toFixed(1)
        : '0';

    if (statsLoading || listLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[60px] mb-2" />
                                <Skeleton className="h-3 w-[120px]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Teachers"
                    value={calculatedStats.total_teachers}
                    description={`${calculatedStats.active_teachers} actively teaching`}
                    icon={Users}
                    colorClass="text-blue-600"
                />

                <StatCard
                    title="Active Teachers"
                    value={calculatedStats.active_teachers}
                    description="Currently active"
                    icon={UserCheck}
                    colorClass="text-green-600"
                />

                <StatCard
                    title="Inactive Teachers"
                    value={calculatedStats.inactive_teachers}
                    description="Currently inactive"
                    icon={Clock}
                    colorClass="text-orange-600"
                />

                <StatCard
                    title="Average Experience"
                    value={`${calculatedStats.average_experience.toFixed(1)} yrs`}
                    description="Across all teachers"
                    icon={Award}
                    colorClass="text-purple-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            Subjects Covered
                        </CardTitle>
                        <CardDescription>Subjects taught by your teachers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {calculatedStats.unique_subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {calculatedStats.unique_subjects.map((subject) => (
                                    <Badge key={subject} variant="secondary">
                                        {subject}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <BookOpen className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">No subjects assigned yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            Experience Levels
                        </CardTitle>
                        <CardDescription>Distribution of teacher experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.keys(calculatedStats.teachers_by_experience_level).length > 0 ? (
                            Object.entries(calculatedStats.teachers_by_experience_level).map(([level, count]) => (
                                <div key={level} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={EXPERIENCE_LEVEL_OPTIONS[level as keyof typeof EXPERIENCE_LEVEL_OPTIONS]?.color as any}>
                                            {EXPERIENCE_LEVEL_OPTIONS[level as keyof typeof EXPERIENCE_LEVEL_OPTIONS]?.label || level}
                                        </Badge>
                                    </div>
                                    <span className="text-sm font-medium">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <Award className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">No experience data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Teachers</CardTitle>
                    <CardDescription>Latest 5 active teacher assignments</CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentAssignmentsList />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Teachers Rate</CardTitle>
                    <CardDescription>
                        {calculatedStats.active_teachers} of {calculatedStats.total_teachers} teachers actively teaching
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Active Rate</span>
                            <span className="font-medium">{activeTeachersRate}%</span>
                        </div>
                        <Progress value={Number(activeTeachersRate)} className="h-3" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
