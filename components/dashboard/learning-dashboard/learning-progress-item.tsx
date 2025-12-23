'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import type { LearningContent } from './types';

interface LearningProgressItemProps {
    content: LearningContent;
    onAction?: (contentId: string) => void;
}

const ICON_BACKGROUNDS: Record<string, { bg: string; icon: string }> = {
    Physics: { bg: 'bg-blue-50', icon: '📊' },
    Chemistry: { bg: 'bg-purple-50', icon: '🧪' },
    English: { bg: 'bg-orange-50', icon: '📝' },
    Business: { bg: 'bg-green-50', icon: '💼' },
    Geography: { bg: 'bg-teal-50', icon: '🌍' },
    Mathematics: { bg: 'bg-indigo-50', icon: '📐' },
};

function LearningProgressItem({ content, onAction }: LearningProgressItemProps) {
    const iconConfig =
        ICON_BACKGROUNDS[content.subject.name] || { bg: 'bg-gray-100', icon: '📚' };
    const isStarted = content.status !== 'not-started';

    return (
        <Item
            variant="default"
            className={cn(
                'group/item hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5',
                'items-stretch gap-6 px-5 py-4'
            )}
        >
            {/* Left: icon + subject + title */}
            <ItemMedia className="flex items-center gap-3 flex-shrink-0">
                <div
                    className={cn(
                        'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm',
                        iconConfig.bg
                    )}
                >
                    {content.icon || iconConfig.icon}
                </div>
            </ItemMedia>

            <ItemContent className="flex min-w-0 flex-col justify-center gap-1">
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

            {/* Middle metrics: 3 small “columns” */}
            <div className="hidden md:flex items-center gap-8 text-xs sm:text-sm text-muted-foreground">
                {/* Material count */}
                <div className="text-center min-w-[80px]">
                    <p className="uppercase tracking-wide text-[10px] mb-1">Content</p>
                    <p className="font-medium text-foreground">
                        {content.materialCount} Material
                    </p>
                </div>

                {/* Progress circle */}
                <div className="text-center min-w-[80px]">
                    <p className="uppercase tracking-wide text-[10px] mb-1">Progress</p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-7 h-7 relative">
                            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 36 36">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-muted-foreground/20"
                                />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
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
                </div>

                {/* Time remaining */}
                <div className="text-center min-w-[80px]">
                    <p className="uppercase tracking-wide text-[10px] mb-1">Time Remaining</p>
                    <div className="flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">
                            {content.timeRemaining}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile compact meta (under title style, not table) */}
            <div className="flex md:hidden flex-col justify-center gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span>{content.materialCount} Material</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                    <span>{content.progress}%</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {content.timeRemaining}
                    </span>
                </div>
            </div>

            {/* Right: CTA button */}
            <ItemActions className="flex-shrink-0">
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

interface LearningProgressItemsProps {
    contents: LearningContent[];
    onViewAll?: () => void;
    onContentAction?: (contentId: string) => void;
}

export function LearningProgressItems({
    contents,
    onViewAll,
    onContentAction,
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
                {contents.map((content) => (
                    <LearningProgressItem
                        key={content.id}
                        content={content}
                        onAction={onContentAction}
                    />
                ))}
            </div>
        </div>
    );
}
