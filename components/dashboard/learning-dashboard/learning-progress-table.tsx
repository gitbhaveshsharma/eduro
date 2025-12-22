/**
 * Learning Progress Table Component
 * Shows in-progress learning content with progress bars
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import type { LearningContent } from './types';

interface LearningProgressItemProps {
    content: LearningContent;
    onAction?: (contentId: string) => void;
}

// Icon backgrounds based on subject - matching the design colors
const ICON_BACKGROUNDS: Record<string, { bg: string; icon: string }> = {
    Physics: { bg: 'bg-blue-50', icon: '📊' },
    Chemistry: { bg: 'bg-purple-50', icon: '🧪' },
    English: { bg: 'bg-orange-50', icon: '📝' },
    Business: { bg: 'bg-green-50', icon: '💼' },
    Geography: { bg: 'bg-teal-50', icon: '🌍' },
    Mathematics: { bg: 'bg-indigo-50', icon: '📐' },
};

function LearningProgressItem({ content, onAction }: LearningProgressItemProps) {
    const iconConfig = ICON_BACKGROUNDS[content.subject.name] || { bg: 'bg-gray-100', icon: '📚' };
    const isStarted = content.status !== 'not-started';

    return (
        <div className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0">
            {/* Icon */}
            <div
                className={cn(
                    'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl',
                    iconConfig.bg
                )}
            >
                {content.icon || iconConfig.icon}
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge
                        variant="secondary"
                        className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', content.subject.color)}
                    >
                        {content.subject.name}
                    </Badge>
                </div>
                <h4 className="font-medium text-sm text-foreground truncate">
                    {content.title}
                </h4>
            </div>

            {/* Stats Columns */}
            <div className="hidden sm:flex items-center gap-8 text-sm">
                {/* Material Count */}
                <div className="text-center min-w-[80px]">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Content
                    </p>
                    <p className="font-medium text-foreground text-sm">
                        {content.materialCount} Material
                    </p>
                </div>

                {/* Progress - circular mini chart */}
                <div className="text-center min-w-[80px]">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Content
                    </p>
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
                                    className="text-muted/20"
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
                        <span className="font-medium text-sm">{content.progress}%</span>
                    </div>
                </div>

                {/* Time Remaining */}
                <div className="text-center min-w-[80px]">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Content
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground text-sm">
                            {content.timeRemaining}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Progress */}
            <div className="sm:hidden flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                    {content.progress}%
                </span>
                <Progress value={content.progress} className="w-16 h-1.5" />
            </div>

            {/* Action Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.(content.id)}
                className={cn(
                    'rounded-full px-5 py-1.5 text-xs font-medium transition-colors border-border/50',
                    'hover:bg-primary hover:text-primary-foreground hover:border-primary'
                )}
            >
                {isStarted ? 'Continue' : 'Start'}
            </Button>
        </div>
    );
}

interface LearningProgressTableProps {
    contents: LearningContent[];
    onViewAll?: () => void;
    onContentAction?: (contentId: string) => void;
}

export function LearningProgressTable({
    contents,
    onViewAll,
    onContentAction,
}: LearningProgressTableProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                    In progress learning content
                </h2>
                <button
                    onClick={onViewAll}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    View all
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-border/50 shadow-sm">
                <div className="divide-y divide-border/30 px-5">
                    {contents.map((content) => (
                        <LearningProgressItem
                            key={content.id}
                            content={content}
                            onAction={onContentAction}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
