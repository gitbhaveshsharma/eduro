/**
 * Quizzes List View Component
 * 
 * Table/list view for displaying quizzes
 * Mobile-first responsive design with sortable columns
 */

'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz } from '@/lib/branch-system/types/quiz.types';
import {
    formatDateTime,
    getQuizAvailabilityStatus,
    formatTimeMinutes,
    formatScore,
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
    /** Current sort field */
    sortBy?: string;
    /** Current sort direction */
    sortOrder?: 'asc' | 'desc';
    /** Callback when sort changes */
    onSortChange?: (field: string) => void;
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
    sortBy,
    sortOrder,
    onSortChange,
    userRole = 'teacher',
    className,
}: QuizzesListViewProps) {
    // Get status badge for quiz
    const getStatusBadge = (quiz: Quiz) => {
        const availabilityStatus = getQuizAvailabilityStatus(quiz.available_from, quiz.available_to);

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

    const SortableHeader = ({
        field,
        children,
    }: {
        field: string;
        children: React.ReactNode;
    }) => {
        const isActive = sortBy === field;

        return (
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    '-ml-3 h-8 data-[state=open]:bg-accent',
                    isActive && 'text-foreground'
                )}
                onClick={() => onSortChange?.(field)}
            >
                {children}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        );
    };

    if (quizzes.length === 0) {
        return (
            <div className={cn('text-center py-12', className)}>
                <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No quizzes found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                    {showTeacherActions
                        ? 'Create your first quiz to get started.'
                        : 'No quizzes available at this time.'}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('border rounded-lg', className)}>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">
                            {onSortChange ? (
                                <SortableHeader field="title">Quiz</SortableHeader>
                            ) : (
                                'Quiz'
                            )}
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Class</TableHead>
                        <TableHead className="hidden lg:table-cell text-center">Questions</TableHead>
                        <TableHead className="hidden sm:table-cell text-center">Time Limit</TableHead>
                        <TableHead className="hidden xl:table-cell">
                            {onSortChange ? (
                                <SortableHeader field="available_from">Available From</SortableHeader>
                            ) : (
                                'Available From'
                            )}
                        </TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="hidden lg:table-cell text-center">Attempts</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {quizzes.map((quiz) => {
                        const statusBadge = getStatusBadge(quiz);
                        const StatusIcon = statusBadge.icon;
                        const canEdit = !quiz.total_attempts || quiz.total_attempts === 0;
                        const canDelete = !quiz.total_attempts || quiz.total_attempts === 0;

                        return (
                            <TableRow key={quiz.id}>
                                <TableCell className="font-medium">
                                    <div className="space-y-1">
                                        <span className="line-clamp-1">{quiz.title}</span>
                                        {/* Mobile class info */}
                                        {quiz.class && (
                                            <span className="text-xs text-muted-foreground md:hidden">
                                                {quiz.class.class_name}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {quiz.class ? (
                                        <div className="text-sm">
                                            <div>{quiz.class.class_name}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {quiz.class.subject}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-center">
                                    {quiz.total_questions}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-center">
                                    {formatTimeMinutes(quiz.time_limit_minutes)}
                                </TableCell>
                                <TableCell className="hidden xl:table-cell">
                                    {formatDateTime(quiz.available_from, 'short')}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={statusBadge.variant}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {statusBadge.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-center">
                                    <div className="text-sm">
                                        <div>{quiz.total_attempts || 0}</div>
                                        {quiz.average_score !== null && quiz.total_attempts > 0 && (
                                            <div className="text-muted-foreground text-xs">
                                                Avg: {formatScore(quiz.average_score, quiz.max_score, true)}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onViewDetails(quiz.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View details</span>
                                        </Button>

                                        {showTeacherActions && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
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
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
