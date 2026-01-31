'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, BookOpen } from 'lucide-react';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import type { LearningContent } from './types';
import { getSubjectConfig } from '@/lib/utils/subject-assets';
import type { SubjectId } from './types';

interface LearningProgressItemProps {
    content: LearningContent;
    onAction?: (contentId: string) => void;
}

interface LearningProgressItemsProps {
    contents: LearningContent[];
    onViewAll?: () => void;
    onContentAction?: (contentId: string) => void;
    isLoading?: boolean;
}

function LearningProgressItem({ content, onAction }: LearningProgressItemProps) {
    // Use subject-assets for consistent icons/colors
    const subjectConfig = getSubjectConfig(content.subject.id as SubjectId);
    const isStarted = content.status !== 'not-started';

    return (
        <Item
            variant="default"
            className={cn(
                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                'flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 px-5 py-4'
            )}
        >
            {/* --- MOBILE APP HEADER STYLE (Icon + Title + Action Button) --- */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <ItemMedia className="flex-shrink-0">
                    <div
                        className={cn(
                            'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm',
                            subjectConfig.color.split(' ')[0] // Get bg color only
                        )}
                    >
                        {content.icon || subjectConfig.icon}
                    </div>
                </ItemMedia>

                <ItemContent className="flex min-w-0 flex-col justify-center gap-1 flex-1">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                                content.subject.color
                            )}
                        >
                            {content.subject.name}
                        </Badge>
                    </div>
                    <ItemTitle className="font-medium text-sm sm:text-base truncate">
                        {content.title}
                    </ItemTitle>
                </ItemContent>

                {/* Mobile-only Action Button: Placed in the header for app feel */}
                <div className="md:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction?.(content.id)}
                        className={cn(
                            'rounded-full px-4 h-8 text-[11px] font-medium border-border/50 transition-colors',
                            isStarted && 'bg-primary/5 border-primary/30'
                        )}
                    >
                        {isStarted ? 'Continue' : 'Start'}
                    </Button>
                </div>
            </div>

            {/* --- MOBILE APP DASHBOARD STYLE (Horizontal Stats Row + Progress Bar) --- */}
            <div className="flex-1 md:flex-none">
                {/* Progress bar for visual representation */}
                <div className="mb-2 md:hidden">
                    <Progress
                        value={content.progress}
                        className="h-1.5"
                        variant={content.progress >= 100 ? 'success' : 'primary'}
                    />
                </div>

                <div className="flex items-center justify-between md:justify-center gap-2 md:gap-8 text-xs sm:text-sm text-muted-foreground bg-muted/30 md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none">
                    {/* Material count */}
                    <div className="text-left md:text-center flex-1 md:flex-none md:min-w-[80px]">
                        <p className="uppercase tracking-wide text-[10px] mb-1 opacity-60">Content</p>
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 hidden md:inline" />
                            <p className="font-medium text-foreground whitespace-nowrap">
                                {content.materialCount} Materials
                            </p>
                        </div>
                    </div>

                    {/* Progress with bar (desktop) / circle (mobile) */}
                    <div className="text-center flex-1 md:flex-none md:min-w-[100px]">
                        <p className="uppercase tracking-wide text-[10px] mb-1 opacity-60">Progress</p>
                        {/* Mobile: circle */}
                        <div className="flex items-center justify-center gap-2 md:hidden">
                            <div className="w-6 h-6 relative">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18" cy="18" r="14" fill="none"
                                        stroke="currentColor" strokeWidth="3"
                                        className="text-muted-foreground/20"
                                    />
                                    <circle
                                        cx="18" cy="18" r="14" fill="none"
                                        stroke="currentColor" strokeWidth="3"
                                        strokeDasharray={`${content.progress * 0.88} 88`}
                                        className="text-primary"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <span className="font-medium text-foreground">
                                {content.progress}%
                            </span>
                        </div>
                        {/* Desktop: progress bar */}
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2">
                                <Progress
                                    value={content.progress}
                                    className="h-2 w-16"
                                    variant={content.progress >= 100 ? 'success' : 'primary'}
                                />
                                <span className="font-medium text-foreground text-xs">
                                    {content.progress}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Time remaining */}
                    <div className="text-right md:text-center flex-1 md:flex-none md:min-w-[80px]">
                        <p className="uppercase tracking-wide text-[10px] mb-1 opacity-60">Time</p>
                        <div className="flex items-center justify-end md:justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium text-foreground whitespace-nowrap">
                                {content.timeRemaining}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop-only Action Button */}
            <ItemActions className="hidden md:flex flex-shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction?.(content.id)}
                    className={cn(
                        'rounded-full px-5 py-1.5 text-xs font-medium transition-all border-border/50 whitespace-nowrap',
                        'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                        isStarted && 'bg-primary/5 border-primary/30'
                    )}
                >
                    {isStarted ? 'Continue' : 'Start'}
                </Button>
            </ItemActions>
        </Item>
    );
}

/**
 * Skeleton loader for LearningProgressItem
 */
function LearningProgressItemSkeleton() {
    return (
        <div className="border rounded-lg p-4 animate-pulse">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6">
                {/* Icon skeleton */}
                <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-xl" />
                    <div className="flex-1 md:hidden">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20 md:hidden" />
                </div>

                {/* Content skeleton - desktop */}
                <div className="hidden md:block">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-5 w-40" />
                </div>

                {/* Stats skeleton */}
                <div className="flex-1">
                    <Skeleton className="h-1.5 w-full mb-2 md:hidden" />
                    <div className="flex items-center justify-between gap-4 p-3 md:p-0 bg-muted/30 md:bg-transparent rounded-lg md:rounded-none">
                        <div className="flex-1">
                            <Skeleton className="h-3 w-12 mb-1" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex-1">
                            <Skeleton className="h-3 w-12 mb-1" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex-1">
                            <Skeleton className="h-3 w-8 mb-1" />
                            <Skeleton className="h-4 w-14" />
                        </div>
                    </div>
                </div>

                {/* Button skeleton - desktop */}
                <Skeleton className="hidden md:block h-8 w-24 rounded-full" />
            </div>
        </div>
    );
}

export function LearningProgressItems({
    contents,
    onViewAll,
    onContentAction,
    isLoading = false,
}: LearningProgressItemsProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                    In progress learning content
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewAll}
                    className="text-sm font-medium text-primary hover:text-primary/80 h-fit px-3 py-1.5"
                >
                    View all
                </Button>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    // Skeleton loading state
                    <>
                        <LearningProgressItemSkeleton />
                        <LearningProgressItemSkeleton />
                        <LearningProgressItemSkeleton />
                    </>
                ) : contents.length === 0 ? (
                    // Empty state
                    <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No learning content in progress</p>
                        <p className="text-xs mt-1">Start reading to see your progress here</p>
                    </div>
                ) : (
                    // Content list
                    contents.map((content) => (
                        <LearningProgressItem
                            key={content.id}
                            content={content}
                            onAction={onContentAction}
                        />
                    ))
                )}
            </div>
        </div>
    );
}