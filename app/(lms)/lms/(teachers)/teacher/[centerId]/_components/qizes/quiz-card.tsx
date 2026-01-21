/**
 * Quiz Card Component
 * 
 * Card view for displaying individual quizzes
 * Mobile-first responsive design with grid layout
 * Reusable for different user roles
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Clock,
    Eye,
    Edit,
    MoreHorizontal,
    Trash2,
    FileQuestion,
    Users,
    CheckCircle2,
    XCircle,
    Play,
    Pause,
    Target,
    Award,
    Timer,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Quiz } from '@/lib/branch-system/types/quiz.types';
import {
    formatDateTime,
    getQuizAvailabilityStatus,
    formatTimeMinutes,
    formatScore,
    STUDENT_QUIZ_STATUS_CONFIG,
} from '@/lib/branch-system/quiz';

export interface QuizCardProps {
    /** Quiz data to display */
    quiz: Quiz;
    /** Callback when view details is clicked */
    onViewDetails: (quizId: string) => void;
    /** Callback when edit is clicked (optional) */
    onEdit?: (quiz: Quiz) => void;
    /** Callback when activate/deactivate is clicked (optional) */
    onToggleActive?: (quiz: Quiz) => void;
    /** Callback when delete is clicked (optional) */
    onDelete?: (quiz: Quiz) => void;
    /** Callback when manage questions is clicked (optional) */
    onManageQuestions?: (quiz: Quiz) => void;
    /** Whether to show teacher actions (edit, toggle, delete) */
    showTeacherActions?: boolean;
    /** Current user role for conditional rendering */
    userRole?: 'teacher' | 'student' | 'coach' | 'manager';
}

export function QuizCard({
    quiz,
    onViewDetails,
    onEdit,
    onToggleActive,
    onDelete,
    onManageQuestions,
    showTeacherActions = false,
    userRole = 'teacher',
}: QuizCardProps) {
    const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

    const canEdit = !quiz.total_attempts || quiz.total_attempts === 0;
    const canDelete = !quiz.total_attempts || quiz.total_attempts === 0;

    // Get status badge info
    const getStatusBadge = () => {
        if (!quiz.is_active) {
            return {
                label: 'Inactive',
                variant: 'secondary' as const,
                icon: Pause,
            };
        }

        switch (availabilityStatus.status) {
            case 'upcoming':
                return {
                    label: 'Upcoming',
                    variant: 'outline' as const,
                    icon: Clock,
                };
            case 'active':
                return {
                    label: 'Active',
                    variant: 'default' as const,
                    icon: Play,
                };
            case 'ended':
                return {
                    label: 'Ended',
                    variant: 'secondary' as const,
                    icon: XCircle,
                };
            default:
                return {
                    label: 'Unknown',
                    variant: 'outline' as const,
                    icon: FileQuestion,
                };
        }
    };

    const statusBadge = getStatusBadge();
    const StatusIcon = statusBadge.icon;

    // Calculate score display
    const hasAttempts = quiz.total_attempts && quiz.total_attempts > 0;
    const avgScore = quiz.average_score !== null ? quiz.average_score : null;

    return (
        <Card className="group hover:shadow-md transition-all duration-200 border-border/60">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base line-clamp-2 leading-tight">
                            {quiz.title}
                        </h3>
                        {quiz.class && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {quiz.class.class_name} • {quiz.class.subject}
                            </p>
                        )}
                    </div>
                    <Badge variant={statusBadge.variant} className="shrink-0">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pb-3">
                {/* Quiz Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileQuestion className="h-3.5 w-3.5" />
                        <span>{quiz.total_questions} questions</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        <span>{formatTimeMinutes(quiz.time_limit_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        <span>{quiz.max_score} points</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{quiz.total_attempts || 0} attempts</span>
                    </div>
                </div>

                {/* Passing Score & Average */}
                {(quiz.passing_score !== null || avgScore !== null) && (
                    <div className="flex items-center gap-3 text-sm">
                        {quiz.passing_score !== null && (
                            <div className="flex items-center gap-1.5">
                                <Award className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-muted-foreground">
                                    Pass: {quiz.passing_score}/{quiz.max_score}
                                </span>
                            </div>
                        )}
                        {avgScore !== null && hasAttempts && (
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-muted-foreground">
                                    Avg: {formatScore(avgScore, quiz.max_score, false)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Availability Dates */}
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                            Available: {formatDateTime(quiz.available_from, 'short')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                            Until: {formatDateTime(quiz.available_to, 'short')}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex items-center justify-between gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(quiz.id)}
                    className="flex-1"
                >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View Details
                </Button>

                {showTeacherActions && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {onManageQuestions && (
                                <DropdownMenuItem onClick={() => onManageQuestions(quiz)}>
                                    <FileQuestion className="h-4 w-4 mr-2" />
                                    Manage Questions
                                </DropdownMenuItem>
                            )}
                            {onEdit && canEdit && (
                                <DropdownMenuItem onClick={() => onEdit(quiz)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Quiz
                                </DropdownMenuItem>
                            )}
                            {onToggleActive && (
                                <DropdownMenuItem onClick={() => onToggleActive(quiz)}>
                                    {quiz.is_active ? (
                                        <>
                                            <Pause className="h-4 w-4 mr-2" />
                                            Deactivate
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 mr-2" />
                                            Activate
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}
                            {onDelete && canDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(quiz)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Quiz
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardFooter>
        </Card>
    );
}
