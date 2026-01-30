'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentPerformanceSummary } from '@/lib/branch-system/types/branch-students.types';
import { getScoreVariant } from '@/lib/branch-system/utils/student-dashboard.utils';
import { StatWithBar } from './mini-charts';

interface PerformanceOverviewProps {
    performanceSummary: StudentPerformanceSummary | null;
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

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        Performance Overview
                    </CardTitle>
                    <Badge variant={getScoreVariant(safeAssignments.average_score)} className="text-xs">
                        {safeAssignments.average_score.toFixed(0)}% Avg
                    </Badge>
                </div>
                <CardDescription>Your academic performance summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Assignment Stats */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Assignments</span>
                        </div>
                        <span className="text-muted-foreground">
                            {safeAssignments.total_graded}/{safeAssignments.total_submitted} graded
                        </span>
                    </div>
                    <StatWithBar
                        label="Submission Rate"
                        percentage={safeAssignments.submission_rate}
                        color="bg-blue-500"
                    />
                    <StatWithBar
                        label="Average Score"
                        percentage={safeAssignments.average_score}
                        color="bg-green-500"
                    />
                </div>

                {/* Quiz Stats */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">Quizzes</span>
                        </div>
                        <span className="text-muted-foreground">
                            {safeQuizzes.completed}/{safeQuizzes.total_attempted} completed
                        </span>
                    </div>
                    <StatWithBar
                        label="Pass Rate"
                        percentage={safeQuizzes.total_attempted > 0 ? (safeQuizzes.passed_count / safeQuizzes.total_attempted) * 100 : 0}
                        color="bg-purple-500"
                    />
                    <StatWithBar
                        label="Average Score"
                        percentage={safeQuizzes.average_percentage}
                        color="bg-amber-500"
                    />
                </div>

                {/* Overall Stats */}
                <div className="pt-3 border-t">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-2xl font-bold text-foreground">{safeOverall.enrolled_classes}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Classes</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{safeOverall.completed_assignments}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{safeOverall.average_attendance.toFixed(0)}%</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Attendance</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}