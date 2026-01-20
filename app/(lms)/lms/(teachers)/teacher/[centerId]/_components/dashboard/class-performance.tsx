'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassAssignmentStats } from '@/lib/branch-system/types/teacher-dashboard.types';
import { getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import { mapSubjectToId } from '@/lib/branch-system/utils/branch-classes.utils';

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
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
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
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
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
    const subjectId = mapSubjectToId(stat.subject) as SubjectId;
    const subjectColor = getSubjectColor(subjectId);
    const hasPending = stat.pending_grading > 0;

    // Determine score badge variant based on percentage
    const scoreVariant = stat.avg_score >= 75
        ? 'success'
        : stat.avg_score >= 50
            ? 'warning'
            : 'destructive';

    return (
        <div
            className={cn(
                'p-3 rounded-lg border hover:shadow-sm cursor-pointer transition-all hover:border-brand-primary/20',
                hasPending && 'border-warning/30 bg-warning/5'
            )}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">{stat.class_name}</h4>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[10px] mt-1 border-0',
                            subjectColor
                        )}
                    >
                        {stat.subject}
                    </Badge>
                </div>
                {stat.avg_score > 0 && (
                    <div className="text-right shrink-0">
                        <Badge
                            variant={scoreVariant}
                            className="text-xs font-bold px-2 py-1"
                        >
                            {stat.avg_score.toFixed(0)}%
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">avg score</p>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {stat.assignment_count} assignments
                    </Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                        {stat.total_submissions} submissions
                    </Badge>
                </div>
            </div>

            {/* Pending grading indicator */}
            {hasPending && (
                <div className="flex items-center gap-1.5 mt-2">
                    <Badge variant="warning" className="text-[10px] gap-1">
                        <AlertCircle className="h-2.5 w-2.5" />
                        {stat.pending_grading} pending grading
                    </Badge>
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
            hasAtRisk && 'border-warning/30 bg-warning/5'
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className={cn(
                            'h-5 w-5',
                            hasAtRisk ? 'text-warning' : 'text-muted-foreground'
                        )} />
                        At-Risk Students
                    </CardTitle>
                    {hasAtRisk && (
                        <Badge variant="warning" className="text-xs">
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
                            'p-3 rounded-lg text-center border',
                            lowAttendance > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-muted bg-muted/20'
                        )}>
                            <p className={cn(
                                'text-2xl font-bold tabular-nums',
                                lowAttendance > 0 ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                                {lowAttendance}
                            </p>
                            <Badge
                                variant={lowAttendance > 0 ? "destructive" : "outline"}
                                className="text-[10px] mt-1"
                            >
                                Low Attendance
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                (&lt;75%)
                            </p>
                        </div>
                        <div className={cn(
                            'p-3 rounded-lg text-center border',
                            failing > 0 ? 'border-warning/30 bg-warning/5' : 'border-muted bg-muted/20'
                        )}>
                            <p className={cn(
                                'text-2xl font-bold tabular-nums',
                                failing > 0 ? 'text-warning' : 'text-muted-foreground'
                            )}>
                                {failing}
                            </p>
                            <Badge
                                variant={failing > 0 ? "warning" : "outline"}
                                className="text-[10px] mt-1"
                            >
                                Failing Grade
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-1">
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
    const percentage = weeklySubmissions > 0
        ? Math.round((recentSubmissions / weeklySubmissions) * 100)
        : 0;

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand-primary" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Student submission trends</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/10">
                        <p className="text-3xl font-bold text-brand-primary tabular-nums">
                            {recentSubmissions}
                        </p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                            Last 24 hours
                        </Badge>
                    </div>
                    <div className="text-center p-3 bg-muted/20 rounded-lg border">
                        <p className="text-3xl font-bold tabular-nums">
                            {weeklySubmissions}
                        </p>
                        <Badge variant="outline" className="text-[10px] mt-1">
                            Last 7 days
                        </Badge>
                    </div>
                </div>

                {/* Comparison bar */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Daily vs Weekly</span>
                        <Badge variant="secondary" className="text-[10px]">
                            {percentage}% of weekly
                        </Badge>
                    </div>
                    <Progress
                        value={percentage}
                        className="h-2"
                    />
                </div>
            </CardContent>
        </Card>
    );
}   