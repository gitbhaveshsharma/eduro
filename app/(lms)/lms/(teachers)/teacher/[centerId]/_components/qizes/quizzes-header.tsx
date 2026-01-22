/**
 * Quizzes Header Component
 * 
 * Header section with title, description, and action buttons
 * Mobile-first responsive design
 */

'use client';

import { Button } from '@/components/ui/button';
import { Plus, FileQuestion, Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

export interface QuizzesHeaderProps {
    /** Title to display */
    title?: string;
    /** Description to display */
    description?: string;
    /** Current view mode */
    viewMode: ViewMode;
    /** Callback when view mode changes */
    onViewModeChange: (mode: ViewMode) => void;
    /** Callback when create quiz is clicked */
    onCreateQuiz?: () => void;
    /** Whether to show the create button */
    showCreateButton?: boolean;
    /** Whether the create button is disabled */
    createButtonDisabled?: boolean;
    /** Total number of quizzes (for display) */
    totalQuizzes?: number;
    /** Filtered count (for display) */
    filteredCount?: number;
    /** Additional className */
    className?: string;
}

export function QuizzesHeader({
    title = 'Quizzes',
    description,
    viewMode,
    onViewModeChange,
    onCreateQuiz,
    showCreateButton = true,
    createButtonDisabled = false,
    totalQuizzes,
    filteredCount,
    className,
}: QuizzesHeaderProps) {
    const showCount = totalQuizzes !== undefined;
    const showFilteredCount = filteredCount !== undefined && filteredCount !== totalQuizzes;

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Title and Description */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {showCount && (
                            <span className="text-muted-foreground text-sm">
                                {showFilteredCount
                                    ? `(${filteredCount} of ${totalQuizzes})`
                                    : `(${totalQuizzes})`}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewModeChange('grid')}
                            className="h-8 px-3"
                        >
                            <Grid3x3 className="h-4 w-4" />
                            <span className="sr-only">Grid view</span>
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewModeChange('list')}
                            className="h-8 px-3"
                        >
                            <List className="h-4 w-4" />
                            <span className="sr-only">List view</span>
                        </Button>
                    </div>

                    {/* Create Button */}
                    {showCreateButton && onCreateQuiz && (
                        <Button
                            onClick={onCreateQuiz}
                            disabled={createButtonDisabled}
                            className="gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create Quiz</span>
                            <span className="sm:hidden">Create</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
