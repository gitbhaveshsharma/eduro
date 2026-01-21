/**
 * Quiz Detail View Component
 * 
 * Comprehensive view for a single quiz
 * Shows quiz information, settings, questions, and attempts
 */

'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Edit,
    Trash2,
    Play,
    Pause,
    FileQuestion,
    Users,
    Target,
    Award,
    Timer,
    Eye,
    EyeOff,
    Shuffle,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    XCircle,
    BarChart3,
    Info,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz, QuizQuestion } from '@/lib/branch-system/types/quiz.types';
import {
    formatDateTime,
    formatTimeMinutes,
    formatScore,
    getQuizAvailabilityStatus,
    CLEANUP_FREQUENCY_CONFIG,
} from '@/lib/branch-system/quiz';
import { CleanupFrequency } from '@/lib/branch-system/types/quiz.types';

export interface QuizDetailViewProps {
    /** Quiz data */
    quiz: Quiz | null;
    /** Whether quiz is loading */
    isLoading?: boolean;
    /** Error message if any */
    error?: string | null;
    /** Callback to go back */
    onBack: () => void;
    /** Callback to edit quiz */
    onEdit?: (quiz: Quiz) => void;
    /** Callback to toggle active state */
    onToggleActive?: (quiz: Quiz) => void;
    /** Callback to delete quiz */
    onDelete?: (quiz: Quiz) => void;
    /** Whether the quiz can be edited (no attempts) */
    canEdit?: boolean;
    /** Whether the quiz can be deleted */
    canDelete?: boolean;
    /** Questions list component */
    questionsListComponent: React.ReactNode;
    /** Attempts list component (optional) */
    attemptsListComponent?: React.ReactNode;
    /** Additional className */
    className?: string;
}

export function QuizDetailView({
    quiz,
    isLoading = false,
    error = null,
    onBack,
    onEdit,
    onToggleActive,
    onDelete,
    canEdit = true,
    canDelete = true,
    questionsListComponent,
    attemptsListComponent,
    className,
}: QuizDetailViewProps) {
    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    // No quiz found
    if (!quiz) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Quiz not found.</AlertDescription>
                </Alert>
            </div>
        );
    }

    const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);
    const hasAttempts = quiz.total_attempts && quiz.total_attempts > 0;

    // Get status badge
    const getStatusBadge = () => {
        if (!quiz.is_active) {
            return { label: 'Inactive', variant: 'secondary' as const, icon: Pause };
        }
        switch (availabilityStatus.status) {
            case 'upcoming':
                return { label: 'Upcoming', variant: 'outline' as const, icon: Clock };
            case 'active':
                return { label: 'Active', variant: 'default' as const, icon: Play };
            case 'ended':
                return { label: 'Ended', variant: 'secondary' as const, icon: XCircle };
            default:
                return { label: 'Unknown', variant: 'outline' as const, icon: FileQuestion };
        }
    };

    const statusBadge = getStatusBadge();
    const StatusIcon = statusBadge.icon;

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                                <Badge variant={statusBadge.variant}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusBadge.label}
                                </Badge>
                            </div>
                            {quiz.class && (
                                <p className="text-sm text-muted-foreground">
                                    {quiz.class.class_name} • {quiz.class.subject}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-11 sm:ml-0">
                    {onToggleActive && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleActive(quiz)}
                        >
                            {quiz.is_active ? (
                                <>
                                    <Pause className="h-4 w-4 mr-1.5" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-1.5" />
                                    Activate
                                </>
                            )}
                        </Button>
                    )}
                    {onEdit && canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(quiz)}
                        >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                        </Button>
                    )}
                    {onDelete && canDelete && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(quiz)}
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Description */}
            {quiz.description && (
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">{quiz.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FileQuestion className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{quiz.total_questions}</p>
                                <p className="text-xs text-muted-foreground">Questions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Target className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{quiz.max_score}</p>
                                <p className="text-xs text-muted-foreground">Max Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{quiz.total_attempts || 0}</p>
                                <p className="text-xs text-muted-foreground">Attempts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <BarChart3 className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {quiz.average_score !== null
                                        ? `${Math.round((quiz.average_score / quiz.max_score) * 100)}%`
                                        : '—'
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="questions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="questions">
                        <FileQuestion className="h-4 w-4 mr-1.5" />
                        Questions
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="h-4 w-4 mr-1.5" />
                        Settings
                    </TabsTrigger>
                    {attemptsListComponent && (
                        <TabsTrigger value="attempts">
                            <Users className="h-4 w-4 mr-1.5" />
                            Attempts
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Questions Tab */}
                <TabsContent value="questions" className="space-y-4">
                    {questionsListComponent}
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Availability */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Availability
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Available From</span>
                                    <span className="text-sm font-medium">
                                        {formatDateTime(quiz.available_from, 'long')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Available Until</span>
                                    <span className="text-sm font-medium">
                                        {formatDateTime(quiz.available_to, 'long')}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <span className="text-sm font-medium">{availabilityStatus.label}</span>
                                </div>
                                {availabilityStatus.timeRemaining && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Time Remaining</span>
                                        <span className="text-sm font-medium">{availabilityStatus.timeRemaining}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Time Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Timer className="h-4 w-4" />
                                    Time Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Time Limit</span>
                                    <span className="text-sm font-medium">
                                        {formatTimeMinutes(quiz.time_limit_minutes)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Submission Window</span>
                                    <span className="text-sm font-medium">
                                        {quiz.submission_window_minutes} minutes
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scoring */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Scoring
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Max Score</span>
                                    <span className="text-sm font-medium">{quiz.max_score} points</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Passing Score</span>
                                    <span className="text-sm font-medium">
                                        {quiz.passing_score !== null
                                            ? `${quiz.passing_score} points (${Math.round((quiz.passing_score / quiz.max_score) * 100)}%)`
                                            : 'Not set'
                                        }
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Show Score Immediately</span>
                                    <Badge variant={quiz.show_score_immediately ? 'default' : 'secondary'}>
                                        {quiz.show_score_immediately ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Show Correct Answers</span>
                                    <Badge variant={quiz.show_correct_answers ? 'default' : 'secondary'}>
                                        {quiz.show_correct_answers ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attempts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Attempts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Multiple Attempts</span>
                                    <Badge variant={quiz.allow_multiple_attempts ? 'default' : 'secondary'}>
                                        {quiz.allow_multiple_attempts ? 'Allowed' : 'Not Allowed'}
                                    </Badge>
                                </div>
                                {quiz.allow_multiple_attempts && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Max Attempts</span>
                                        <span className="text-sm font-medium">{quiz.max_attempts}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Shuffle className="h-4 w-4" />
                                    Options
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Shuffle Questions</span>
                                    <Badge variant={quiz.shuffle_questions ? 'default' : 'secondary'}>
                                        {quiz.shuffle_questions ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Shuffle Options</span>
                                    <Badge variant={quiz.shuffle_options ? 'default' : 'secondary'}>
                                        {quiz.shuffle_options ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Require Webcam</span>
                                    <Badge variant={quiz.require_webcam ? 'destructive' : 'secondary'}>
                                        {quiz.require_webcam ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cleanup */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Data Retention
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Clean Attempts After</span>
                                    <span className="text-sm font-medium">
                                        {CLEANUP_FREQUENCY_CONFIG[quiz.clean_attempts_after as keyof typeof CLEANUP_FREQUENCY_CONFIG]?.label || 'Not set'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Clean Questions After</span>
                                    <span className="text-sm font-medium">
                                        {CLEANUP_FREQUENCY_CONFIG[quiz.clean_questions_after as keyof typeof CLEANUP_FREQUENCY_CONFIG]?.label || 'Not set'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Instructions */}
                    {quiz.instructions && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Instructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{quiz.instructions}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Attempts Tab */}
                {attemptsListComponent && (
                    <TabsContent value="attempts" className="space-y-4">
                        {attemptsListComponent}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
