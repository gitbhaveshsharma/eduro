'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentPerformanceSummary } from '@/lib/branch-system/types/branch-students.types';
import {
    getAttendancePerformanceLevel,
    getAttendancePerformanceColor,
} from '@/lib/branch-system/utils/student-attendance.utils';
import { StatWithBar } from './mini-charts';

interface PerformanceOverviewProps {
    performanceSummary: StudentPerformanceSummary | null;
}

/**
 * Get progress bar color based on percentage using attendance utils logic
 */
function getProgressColor(percentage: number): string {
    const color = getAttendancePerformanceColor(percentage);

    const colorMap: Record<string, string> = {
        'green': 'bg-green-500',
        'blue': 'bg-blue-500',
        'orange': 'bg-orange-500',
        'yellow': 'bg-yellow-500',
        'red': 'bg-red-500',
    };

    return colorMap[color] || 'bg-gray-500';
}

/**
 * Get icon color class based on percentage using attendance utils logic
 */
function getIconColor(percentage: number): string {
    const color = getAttendancePerformanceColor(percentage);

    const colorMap: Record<string, string> = {
        'green': 'text-green-600 dark:text-green-500',
        'blue': 'text-blue-600 dark:text-blue-500',
        'orange': 'text-orange-600 dark:text-orange-500',
        'yellow': 'text-yellow-600 dark:text-yellow-500',
        'red': 'text-red-600 dark:text-red-500',
    };

    return colorMap[color] || 'text-muted-foreground';
}

/**
 * Get badge background color based on percentage using attendance utils logic
 */
function getBadgeColor(percentage: number): string {
    const color = getAttendancePerformanceColor(percentage);

    const colorMap: Record<string, string> = {
        'green': 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-500',
        'blue': 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-500',
        'orange': 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-500',
        'yellow': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-500',
        'red': 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-500',
    };

    return colorMap[color] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
}

export function PerformanceOverview({ performanceSummary }: PerformanceOverviewProps) {
    if (!performanceSummary) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        Performance Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No performance data yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { assignments, quizzes, overall } = performanceSummary;

    // Provide defaults for null values
    const safeAssignments = {
        average_score: assignments?.average_score ?? 0,
        total_graded: assignments?.total_graded ?? 0,
        total_submitted: assignments?.total_submitted ?? 0,
        submission_rate: assignments?.submission_rate ?? 0,
    };

    const safeQuizzes = {
        completed: quizzes?.completed ?? 0,
        total_attempted: quizzes?.total_attempted ?? 0,
        passed_count: quizzes?.passed_count ?? 0,
        average_percentage: quizzes?.average_percentage ?? 0,
    };

    const safeOverall = {
        enrolled_classes: overall?.enrolled_classes ?? 0,
        completed_assignments: overall?.completed_assignments ?? 0,
        average_attendance: overall?.average_attendance ?? 0,
    };

    // Calculate pass rate for quizzes
    const quizPassRate = safeQuizzes.total_attempted > 0
        ? (safeQuizzes.passed_count / safeQuizzes.total_attempted) * 100
        : 0;

    // Get performance levels using attendance utils
    const assignmentPerformance = getAttendancePerformanceLevel(safeAssignments.average_score);
    const attendancePerformance = getAttendancePerformanceLevel(safeOverall.average_attendance);

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        Performance Overview
                    </CardTitle>
                    <Badge
                        variant="secondary"
                        className={cn(
                            "text-xs transition-colors",
                            getBadgeColor(safeAssignments.average_score)
                        )}
                    >
                        {safeAssignments.average_score.toFixed(0)}% Avg
                    </Badge>
                </div>
                <CardDescription>Your academic performance summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Assignment Stats */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className={cn(
                                "h-4 w-4",
                                getIconColor(safeAssignments.average_score)
                            )} />
                            <span className="font-medium text-foreground">Assignments</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                            {safeAssignments.total_graded}/{safeAssignments.total_submitted} graded
                        </span>
                    </div>
                    <StatWithBar
                        label="Submission Rate"
                        percentage={safeAssignments.submission_rate}
                        color={getProgressColor(safeAssignments.submission_rate)}
                    />
                    <StatWithBar
                        label="Average Score"
                        percentage={safeAssignments.average_score}
                        color={getProgressColor(safeAssignments.average_score)}
                    />
                </div>

                {/* Quiz Stats */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Award className={cn(
                                "h-4 w-4",
                                getIconColor(quizPassRate)
                            )} />
                            <span className="font-medium text-foreground">Quizzes</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                            {safeQuizzes.completed}/{safeQuizzes.total_attempted} completed
                        </span>
                    </div>
                    <StatWithBar
                        label="Pass Rate"
                        percentage={quizPassRate}
                        color={getProgressColor(quizPassRate)}
                    />
                    <StatWithBar
                        label="Average Score"
                        percentage={safeQuizzes.average_percentage}
                        color={getProgressColor(safeQuizzes.average_percentage)}
                    />
                </div>

                {/* Overall Stats */}
                <div className="pt-4 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-brand-primary">{safeOverall.enrolled_classes}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Classes</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{safeOverall.completed_assignments}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed</p>
                        </div>
                        <div className="space-y-1">
                            <p className={cn(
                                "text-2xl font-bold",
                                getIconColor(safeOverall.average_attendance)
                            )}>
                                {safeOverall.average_attendance.toFixed(0)}%
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attendance</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}