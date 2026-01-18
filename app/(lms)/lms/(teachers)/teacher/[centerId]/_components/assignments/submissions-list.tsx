/**
 * Submissions List Component
 * 
 * List view for displaying student submissions
 * Used by teachers to view and grade submissions
 * Mobile-first responsive design
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
    ItemDescription,
    ItemSeparator,
} from '@/components/ui/item';
import {
    Search,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Edit,
    Eye,
    Cpu,
    LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubmissionForGrading } from '@/lib/branch-system/types/assignment.types';
import {
    GradingStatus,
    formatDateTime,
    GRADING_STATUS_CONFIG,
} from '@/lib/branch-system/assignment';

// Helper to get initials from a name
function getInitials(name: string): string {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export interface SubmissionsListProps {
    /** List of submissions to display */
    submissions: SubmissionForGrading[];
    /** Callback when grade is clicked */
    onGrade: (submission: SubmissionForGrading) => void;
    /** Callback when view is clicked */
    onView?: (submission: SubmissionForGrading) => void;
    /** Whether submissions are loading */
    isLoading?: boolean;
    /** Assignment max score for percentage calculation */
    maxScore?: number;
}

export function SubmissionsList({
    submissions,
    onGrade,
    onView,
    isLoading = false,
    maxScore = 100,
}: SubmissionsListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter submissions by search
    const filteredSubmissions = submissions.filter((sub) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            sub.student_name?.toLowerCase().includes(query) ||
            sub.student_username?.toLowerCase().includes(query)
        );
    });

    // Get icon component dynamically
    const getGradingIcon = (iconName: string): LucideIcon => {
        const icons: Record<string, LucideIcon> = {
            Clock,
            Cpu,
            CheckCircle,
        };
        return icons[iconName] || Clock;
    };

    // Calculate score percentage
    const getScorePercentage = (score: number | null) => {
        if (score === null || maxScore === 0) return null;
        return Math.round((score / maxScore) * 100);
    };

    // Get score color based on percentage
    const getScoreColor = (percentage: number | null) => {
        if (percentage === null) return '';
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-blue-600';
        if (percentage >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Student Submissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (submissions.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Submissions Yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                        Students haven&apos;t submitted their work for this assignment yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg">
                        Student Submissions ({submissions.length})
                    </CardTitle>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm text-muted-foreground">
                            Awaiting: {submissions.filter(s => s.grading_status === GradingStatus.NOT_GRADED).length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm text-muted-foreground">
                            Graded: {submissions.filter(s => s.grading_status === GradingStatus.MANUAL_GRADED).length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm text-muted-foreground">
                            Late: {submissions.filter(s => s.is_late).length}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-2">
                    {filteredSubmissions.map((submission, index) => {
                        const scorePercentage = getScorePercentage(submission.score);
                        const gradingConfig = GRADING_STATUS_CONFIG[submission.grading_status];

                        return (
                            <div key={submission.id}>
                                <Item
                                    variant="default"
                                    className={cn(
                                        'group/item hover:bg-muted/50 transition-colors',
                                        'items-center gap-3 px-3 py-2 sm:px-4 sm:py-3'
                                    )}
                                >
                                    {/* Avatar */}
                                    <ItemMedia variant="default">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={submission.student_avatar || undefined}
                                                alt={submission.student_name || 'Student'}
                                            />
                                            <AvatarFallback>
                                                {getInitials(submission.student_name || 'S')}
                                            </AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>

                                    {/* Content */}
                                    <ItemContent className="min-w-0 flex-1">
                                        <ItemTitle className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm truncate">
                                                {submission.student_name || 'Unknown Student'}
                                            </span>
                                            {submission.is_late && (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Late
                                                </Badge>
                                            )}
                                        </ItemTitle>
                                        <ItemDescription>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                                {/* Username */}
                                                {submission.student_username && (
                                                    <span>@{submission.student_username}</span>
                                                )}
                                                {/* Submitted At */}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(submission.submitted_at, 'short')}
                                                </span>
                                                {/* Grading Status */}
                                                <Badge
                                                    variant={gradingConfig.variant}
                                                    className="text-xs flex items-center gap-1"
                                                >
                                                    {(() => {
                                                        const GradingIcon = getGradingIcon(gradingConfig.icon);
                                                        return <GradingIcon className="h-3 w-3" />;
                                                    })()}
                                                    {gradingConfig.label}
                                                </Badge>
                                            </div>
                                        </ItemDescription>
                                    </ItemContent>

                                    {/* Score */}
                                    <div className="flex items-center gap-2 mr-2">
                                        {submission.score !== null ? (
                                            <div className="text-right">
                                                <p className={cn('font-bold text-lg', getScoreColor(scorePercentage))}>
                                                    {submission.score}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    / {maxScore}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">—</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <ItemActions>
                                        {onView && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onView(submission)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View</span>
                                            </Button>
                                        )}
                                        <Button
                                            variant={submission.grading_status === GradingStatus.NOT_GRADED ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => onGrade(submission)}
                                            className="gap-1.5 h-8"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">
                                                {submission.grading_status === GradingStatus.NOT_GRADED ? 'Grade' : 'Edit'}
                                            </span>
                                        </Button>
                                    </ItemActions>
                                </Item>

                                {index < filteredSubmissions.length - 1 && <ItemSeparator />}
                            </div>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredSubmissions.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No students found matching &quot;{searchQuery}&quot;
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
