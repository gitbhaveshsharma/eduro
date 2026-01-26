/**
 * Quizzes List View Component
 * 
 * List view for displaying quizzes
 * Mobile-first responsive design
 * Reusable for different user roles
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Eye,
    Edit,
    MoreHorizontal,
    Trash2,
    FileQuestion,
    Play,
    Pause,
    Clock,
    XCircle,
    Users,
    Timer,
    Target,
    Send,
    LucideIcon,
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
} from '@/lib/branch-system/quiz';

export interface QuizzesListViewProps {
    /** List of quizzes to display */
    quizzes: Quiz[];
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
    /** Whether to show teacher actions */
    showTeacherActions?: boolean;
    /** Current user role */
    userRole?: 'teacher' | 'student' | 'coach' | 'manager';
    /** Additional className */
    className?: string;
}

export function QuizzesListView({
    quizzes,
    onViewDetails,
    onEdit,
    onToggleActive,
    onDelete,
    onManageQuestions,
    showTeacherActions = false,
    userRole = 'teacher',
    className,
}: QuizzesListViewProps) {
    // Utility function to get status badge for quiz
    const getStatusBadge = (quiz: Quiz) => {
        const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

        if (!quiz.is_active) {
            return {
                label: 'Inactive',
                variant: 'warning' as const,
                icon: Pause,
            };
        }

        switch (availabilityStatus.status) {
            case 'upcoming':
                return {
                    label: 'Upcoming',
                    variant: 'default' as const,
                    icon: Clock,
                };
            case 'active':
                return {
                    label: 'Active',
                    variant: 'success' as const,
                    icon: Play,
                };
            case 'ended':
                return {
                    label: 'Ended',
                    variant: 'destructive' as const,
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

    // Get icon component dynamically
    const getStatusIcon = (icon: LucideIcon): LucideIcon => {
        return icon;
    };

    if (quizzes.length === 0) {
        return (
            <div className={cn('text-center py-12 border rounded-lg bg-card', className)}>
                <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No quizzes found</h3>
                <p className="text-sm text-muted-foreground">
                    {showTeacherActions
                        ? 'Create your first quiz to get started.'
                        : 'No quizzes available at this time.'}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            {quizzes.map((quiz, index) => {
                const statusBadge = getStatusBadge(quiz);
                const StatusIcon = getStatusIcon(statusBadge.icon);
                const canEdit = !quiz.total_attempts || quiz.total_attempts === 0;
                const canDelete = !quiz.total_attempts || quiz.total_attempts === 0;
                const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

                return (
                    <div key={quiz.id}>
                        <Item
                            variant="default"
                            className={cn(
                                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                                'items-stretch gap-4 px-4 py-3 sm:px-5 sm:py-4'
                            )}
                        >
                            {/* Icon */}
                            <ItemMedia variant="icon">
                                <div className={cn(
                                    'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center',
                                    !quiz.is_active && 'bg-secondary/30',
                                    quiz.is_active && availabilityStatus.status === 'active' && 'bg-green-100 dark:bg-green-900/30',
                                    quiz.is_active && availabilityStatus.status === 'upcoming' && 'bg-blue-100 dark:bg-blue-900/30',
                                    quiz.is_active && availabilityStatus.status === 'ended' && 'bg-red-100 dark:bg-red-900/30',
                                )}>
                                    <StatusIcon className={cn(
                                        'h-5 w-5 sm:h-6 sm:w-6',
                                        !quiz.is_active && 'text-muted-foreground',
                                        quiz.is_active && availabilityStatus.status === 'active' && 'text-green-600',
                                        quiz.is_active && availabilityStatus.status === 'upcoming' && 'text-blue-600',
                                        quiz.is_active && availabilityStatus.status === 'ended' && 'text-red-600',
                                    )} />
                                </div>
                            </ItemMedia>

                            {/* Content */}
                            <ItemContent className="min-w-0 flex-1">
                                <ItemTitle className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm truncate transition-colors duration-200 group-hover/item:text-primary">
                                        {quiz.title}
                                    </span>
                                    <Badge
                                        variant={statusBadge.variant}
                                        className="text-xs font-medium flex-shrink-0"
                                    >
                                        {statusBadge.label}
                                    </Badge>
                                </ItemTitle>
                                <ItemDescription>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground mt-1">
                                        {/* Class Name */}
                                        {quiz.class?.class_name && (
                                            <span className="flex items-center gap-1.5 truncate">
                                                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="truncate">{quiz.class.class_name}</span>
                                            </span>
                                        )}
                                        {/* Available From */}
                                        {quiz.available_from && (
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                                {formatDateTime(quiz.available_from, 'short')}
                                            </span>
                                        )}
                                        {/* Questions Count */}
                                        <span className="flex items-center gap-1.5">
                                            <FileQuestion className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>{quiz.total_questions} questions</span>
                                        </span>
                                        {/* Time Limit */}
                                        <span className="flex items-center gap-1.5">
                                            <Timer className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>{formatTimeMinutes(quiz.time_limit_minutes)}</span>
                                        </span>
                                        {/* Max Score */}
                                        <span className="flex items-center gap-1.5">
                                            <Target className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="font-medium">{quiz.max_score}</span> pts
                                        </span>
                                    </div>
                                </ItemDescription>
                            </ItemContent>

                            {/* Actions */}
                            <ItemActions className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewDetails(quiz.id)}
                                    className="gap-1.5 h-8 px-2 sm:px-3"
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">View</span>
                                </Button>

                                {showTeacherActions && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                            >
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
                                            {canEdit && onEdit && (
                                                <DropdownMenuItem onClick={() => onEdit(quiz)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
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
                                            {(canDelete && onDelete) && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(quiz)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </ItemActions>
                        </Item>

                        {index < quizzes.length - 1 && <ItemSeparator />}
                    </div>
                );
            })}
        </div>
    );
}