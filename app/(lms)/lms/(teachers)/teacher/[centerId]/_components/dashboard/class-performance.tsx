'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassAssignmentStats } from '@/lib/branch-system/types/teacher-dashboard.types';
import { getSubjectColor } from '@/lib/branch-system/utils/teacher-dashboard.utils';

interface ClassPerformanceProps {
    classStats: ClassAssignmentStats[];
    onClassClick?: (classId: string) => void;
}

/**
 * Class performance overview card
 * Shows assignment stats and scores by class
 */
export function ClassPerformance({ classStats, onClassClick }: ClassPerformanceProps) {
    if (classStats.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Class Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No classes yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort by pending grading (most urgent first)
    const sortedStats = [...classStats].sort((a, b) => b.pending_grading - a.pending_grading);

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Class Performance
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {classStats.length} class{classStats.length !== 1 ? 'es' : ''}
                    </Badge>
                </div>
                <CardDescription>
                    Assignment stats and average scores by class
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {sortedStats.map((stat) => (
                        <ClassStatItem
                            key={stat.class_id}
                            stat={stat}
                            onClick={() => onClassClick?.(stat.class_id)}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface ClassStatItemProps {
    stat: ClassAssignmentStats;
    onClick?: () => void;
}

function ClassStatItem({ stat, onClick }: ClassStatItemProps) {
    const subjectColor = getSubjectColor(stat.subject);
    const hasPending = stat.pending_grading > 0;
    const scoreColor = stat.avg_score >= 75
        ? 'text-green-600'
        : stat.avg_score >= 50
            ? 'text-yellow-600'
            : 'text-red-600';

    return (
        <div
            className={cn(
                'p-3 rounded-lg border hover:shadow-sm cursor-pointer transition-all',
                hasPending && 'border-yellow-200 bg-yellow-50/30'
            )}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">{stat.class_name}</h4>
                    <Badge
                        variant="outline"
                        className="text-[10px] mt-1"
                        style={{ borderColor: subjectColor, color: subjectColor }}
                    >
                        {stat.subject}
                    </Badge>
                </div>
                {stat.avg_score > 0 && (
                    <div className="text-right shrink-0">
                        <p className={cn('text-lg font-bold tabular-nums', scoreColor)}>
                            {stat.avg_score.toFixed(0)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">avg score</p>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="tabular-nums">{stat.assignment_count}</span>
                    <span className="text-muted-foreground">assignments</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="tabular-nums">{stat.total_submissions}</span>
                    <span className="text-muted-foreground">submissions</span>
                </div>
            </div>

            {/* Pending grading indicator */}
            {hasPending && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-700">
                    <AlertCircle className="h-3 w-3" />
                    <span className="font-medium">{stat.pending_grading} pending grading</span>
                </div>
            )}
        </div>
    );
}

interface AtRiskStudentsProps {
    lowAttendance: number;
    failing: number;
    onViewDetails?: () => void;
}

/**
 * At-risk students summary card
 */
export function AtRiskStudents({ lowAttendance, failing, onViewDetails }: AtRiskStudentsProps) {
    const total = lowAttendance + failing;
    const hasAtRisk = total > 0;

    return (
        <Card className={cn(
            'border-muted/50',
            hasAtRisk && 'border-orange-200 bg-orange-50/30'
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className={cn(
                            'h-5 w-5',
                            hasAtRisk ? 'text-orange-600' : 'text-muted-foreground'
                        )} />
                        At-Risk Students
                    </CardTitle>
                    {hasAtRisk && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            {total} student{total !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!hasAtRisk ? (
                    <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">All students performing well! 🎉</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <div className={cn(
                            'p-3 rounded-lg text-center',
                            lowAttendance > 0 ? 'bg-red-100' : 'bg-muted/50'
                        )}>
                            <p className={cn(
                                'text-2xl font-bold tabular-nums',
                                lowAttendance > 0 ? 'text-red-600' : 'text-muted-foreground'
                            )}>
                                {lowAttendance}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Low Attendance
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                (&lt;75%)
                            </p>
                        </div>
                        <div className={cn(
                            'p-3 rounded-lg text-center',
                            failing > 0 ? 'bg-orange-100' : 'bg-muted/50'
                        )}>
                            <p className={cn(
                                'text-2xl font-bold tabular-nums',
                                failing > 0 ? 'text-orange-600' : 'text-muted-foreground'
                            )}>
                                {failing}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Failing Grade
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                (&lt;50%)
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface RecentActivityProps {
    recentSubmissions: number;
    weeklySubmissions: number;
}

/**
 * Recent activity summary card
 */
export function RecentActivity({ recentSubmissions, weeklySubmissions }: RecentActivityProps) {
    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Student submission trends</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                        <p className="text-3xl font-bold text-primary tabular-nums">
                            {recentSubmissions}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last 24 hours
                        </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold tabular-nums">
                            {weeklySubmissions}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last 7 days
                        </p>
                    </div>
                </div>

                {/* Comparison bar */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Daily vs Weekly</span>
                        <span className="tabular-nums">
                            {weeklySubmissions > 0
                                ? Math.round((recentSubmissions / weeklySubmissions) * 100)
                                : 0
                            }% of weekly
                        </span>
                    </div>
                    <Progress
                        value={weeklySubmissions > 0
                            ? (recentSubmissions / weeklySubmissions) * 100
                            : 0
                        }
                        className="h-2"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
