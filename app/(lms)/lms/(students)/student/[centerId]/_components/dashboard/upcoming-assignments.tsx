'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormattedStudentAssignment } from '@/lib/branch-system/types/branch-students.types';
import { getUrgencyVariant } from '@/lib/branch-system/utils/student-dashboard.utils';

interface UpcomingAssignmentsProps {
    assignments: FormattedStudentAssignment[];
    onAssignmentClick?: (assignmentId: string) => void;
    onViewAll?: () => void;
}

export function UpcomingAssignments({ assignments, onAssignmentClick, onViewAll }: UpcomingAssignmentsProps) {
    const unsubmitted = assignments?.filter(a => !a.is_submitted) || [];

    if (!assignments || assignments.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-brand-primary" />
                        Upcoming Assignments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="text-sm">All assignments completed!</p>
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
                        <FileText className="h-5 w-5 text-brand-primary" />
                        Upcoming Assignments
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {unsubmitted.length} pending
                    </Badge>
                </div>
                <CardDescription>Assignments due soon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {unsubmitted.slice(0, 5).map((assignment) => (
                    <AssignmentCard
                        key={assignment.assignment_id}
                        assignment={assignment}
                        onClick={() => onAssignmentClick?.(assignment.assignment_id)}
                    />
                ))}
                {unsubmitted.length > 5 && onViewAll && (
                    <Button variant="ghost" className="w-full" onClick={onViewAll}>
                        View All Assignments
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function AssignmentCard({ assignment, onClick }: { assignment: FormattedStudentAssignment; onClick?: () => void }) {
    return (
        <div
            className={cn(
                'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm hover:border-brand-primary/20',
                assignment.urgency === 'critical' && 'border-destructive/30 bg-destructive/5'
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm line-clamp-1 flex-1">{assignment.title}</h4>
                <Badge variant={getUrgencyVariant(assignment.urgency)} className="text-[10px] shrink-0">
                    {assignment.days_remaining === 0 ? 'Today' : `${assignment.days_remaining}d`}
                </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{assignment.class_name}</span>
                <span>•</span>
                <span>{assignment.formatted_due_date}</span>
            </div>
        </div>
    );
}
