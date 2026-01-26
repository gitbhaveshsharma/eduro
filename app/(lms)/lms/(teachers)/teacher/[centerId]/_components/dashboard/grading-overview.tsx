'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, AlertTriangle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormattedDeadline } from '@/lib/branch-system/types/teacher-dashboard.types';
import type { GradingStats } from '@/lib/branch-system/types/teacher-dashboard.types';
import { MiniBarChart, StatWithBar } from './mini-charts';

interface GradingOverviewProps {
    gradingStats: GradingStats;
    onViewGrading?: () => void;
}

/**
 * Grading workload overview card
 * Shows pending, urgent, and completed grading stats
 */
export function GradingOverview({ gradingStats, onViewGrading }: GradingOverviewProps) {
    const { pending_count, urgent_count, graded_today, auto_graded_count, manual_graded_count } = gradingStats;
    const hasUrgent = urgent_count > 0;
    const totalGraded = auto_graded_count + manual_graded_count;

    const chartData = [
        { label: 'Pending', value: pending_count, color: 'bg-yellow-500' },
        { label: 'Urgent', value: urgent_count, color: 'bg-red-500' },
        { label: 'Today', value: graded_today, color: 'bg-green-500' },
    ].filter(d => d.value > 0);

    return (
        <Card className={cn(
            'border-muted/50',
            hasUrgent && 'border-red-200 bg-red-50/30'
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Grading Workload
                    </CardTitle>
                    {hasUrgent && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                            {urgent_count} Urgent
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    {pending_count === 0
                        ? 'All caught up! No pending submissions.'
                        : `${pending_count} submission${pending_count !== 1 ? 's' : ''} awaiting review`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main stats */}
                <div className="grid grid-cols-3 gap-3">
                    <StatBox
                        label="Pending"
                        value={pending_count}
                        icon={<Clock className="h-4 w-4" />}
                        color="text-yellow-600"
                        bgColor="bg-yellow-100"
                    />
                    <StatBox
                        label="Urgent"
                        value={urgent_count}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        color="text-red-600"
                        bgColor="bg-red-100"
                        highlight={hasUrgent}
                    />
                    <StatBox
                        label="Today"
                        value={graded_today}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        color="text-green-600"
                        bgColor="bg-green-100"
                    />
                </div>

                {/* Mini chart */}
                {chartData.length > 0 && (
                    <div className="pt-2">
                        <MiniBarChart
                            data={chartData}
                            orientation="horizontal"
                            barHeight={8}
                        />
                    </div>
                )}

                {/* Action button */}
                {pending_count > 0 && (
                    <Button
                        variant={hasUrgent ? 'destructive' : 'default'}
                        className="w-full"
                        onClick={onViewGrading}
                    >
                        {hasUrgent ? 'Grade Urgent Submissions' : 'Start Grading'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface StatBoxProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    highlight?: boolean;
}

function StatBox({ label, value, icon, color, bgColor, highlight }: StatBoxProps) {
    return (
        <div className={cn(
            'p-3 rounded-lg text-center transition-all',
            bgColor,
            highlight && 'ring-2 ring-red-300 animate-pulse'
        )}>
            <div className={cn('flex justify-center mb-1', color)}>
                {icon}
            </div>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    );
}

interface UpcomingDeadlinesProps {
    deadlines: FormattedDeadline[];
    onDeadlineClick?: (assignmentId: string) => void;
    onViewAll?: () => void;
}

/**
 * Upcoming assignment deadlines card
 */
export function UpcomingDeadlines({
    deadlines,
    onDeadlineClick,
    onViewAll
}: UpcomingDeadlinesProps) {
    if (deadlines.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Upcoming Deadlines
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming deadlines</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Upcoming Deadlines
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        Next 7 days
                    </Badge>
                </div>
                <CardDescription>
                    {deadlines.length} assignment{deadlines.length !== 1 ? 's' : ''} due soon
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {deadlines.slice(0, 4).map((deadline) => (
                    <DeadlineItem
                        key={deadline.assignment_id}
                        deadline={deadline}
                        onClick={() => onDeadlineClick?.(deadline.assignment_id)}
                    />
                ))}

                {deadlines.length > 4 && (
                    <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={onViewAll}
                    >
                        View all {deadlines.length} deadlines
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface DeadlineItemProps {
    deadline: FormattedDeadline;
    onClick?: () => void;
}

function DeadlineItem({ deadline, onClick }: DeadlineItemProps) {
    const urgencyColors = {
        critical: 'border-l-red-500 bg-red-50/50',
        warning: 'border-l-yellow-500 bg-yellow-50/30',
        normal: 'border-l-blue-500',
    };

    const urgencyBadge = {
        critical: { variant: 'destructive' as const, label: 'Due Today' },
        warning: { variant: 'secondary' as const, label: `${deadline.days_until_due}d left` },
        normal: { variant: 'outline' as const, label: deadline.formatted_due_date },
    };

    return (
        <div
            className={cn(
                'p-3 rounded-lg border-l-4 bg-card hover:shadow-sm cursor-pointer transition-all',
                urgencyColors[deadline.urgency]
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">{deadline.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                        {deadline.class_name}
                    </p>
                </div>
                <Badge
                    variant={urgencyBadge[deadline.urgency].variant}
                    className="text-[10px] shrink-0"
                >
                    {urgencyBadge[deadline.urgency].label}
                </Badge>
            </div>

            {/* Submission progress */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Submissions</span>
                    <span className="tabular-nums">
                        {deadline.submissions_received}/{deadline.total_students}
                    </span>
                </div>
                <Progress
                    value={deadline.submission_percentage}
                    className="h-1.5"
                />
            </div>
        </div>
    );
}
