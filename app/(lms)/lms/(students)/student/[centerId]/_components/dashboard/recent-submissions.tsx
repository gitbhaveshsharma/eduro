'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentRecentSubmission } from '@/lib/branch-system/types/branch-students.types';
import { formatDate, getScoreVariant } from '@/lib/branch-system/utils/student-dashboard.utils';

interface RecentSubmissionsProps {
    submissions: StudentRecentSubmission[];
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
    if (!submissions || submissions.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-brand-primary" />
                        Recent Submissions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No recent submissions</p>
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
                        <Clock className="h-5 w-5 text-brand-primary" />
                        Recent Submissions
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        Last 30 days
                    </Badge>
                </div>
                <CardDescription>Your recent work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {submissions.map((submission, idx) => (
                    <SubmissionItem key={`${submission.type}-${submission.id}-${idx}`} submission={submission} />
                ))}
            </CardContent>
        </Card>
    );
}

function SubmissionItem({ submission }: { submission: StudentRecentSubmission }) {
    const Icon = submission.type === 'assignment' ? FileText : Brain;
    const percentage = submission.percentage || 0;

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={cn(
                'p-2 rounded-lg',
                submission.type === 'assignment' ? 'bg-blue-100' : 'bg-purple-100'
            )}>
                <Icon className={cn(
                    'h-4 w-4',
                    submission.type === 'assignment' ? 'text-blue-600' : 'text-purple-600'
                )} />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-1">{submission.title}</h4>
                <p className="text-xs text-muted-foreground">
                    {submission.class_name} • {formatDate(submission.submitted_at)}
                </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {submission.is_late && (
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                )}
                {submission.score !== null ? (
                    <Badge variant={getScoreVariant(percentage)} className="text-xs">
                        {submission.score}/{submission.max_score}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-xs">
                        Pending
                    </Badge>
                )}
            </div>
        </div>
    );
}