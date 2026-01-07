/**
 * Progress Activity Component
 * Shows activity hours with donut chart for content progress
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';
import { DonutChart } from './donut-chart';
import type { ContentBreakdown } from './types';

interface ProgressActivityProps {
    hours: number;
    period?: 'Year' | 'Month' | 'Week';
    contentBreakdown: ContentBreakdown;
    onPeriodChange?: (period: string) => void;
}

export function ProgressActivity({
    hours,
    period = 'Year',
    contentBreakdown,
    onPeriodChange
}: ProgressActivityProps) {
    return (
        <div className="bg-secondary/20 rounded-xl p-4 dark:bg-secondary/30">
            {/* Activity Hours Section */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                        Activity
                    </span>
                    <Button
                        variant="ghost"
                        onClick={() => onPeriodChange?.(period)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {period}
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                        {hours}h
                    </span>
                    <Badge
                        variant="success"
                        className=" text-sm px-2 py-0.5"
                    >
                        🎉 Great result!
                    </Badge>
                </div>
            </div>

            {/* Separator */}
            <Separator className="my-6 bg-primary/50" />

            {/* Content Progress Chart Section */}
            <div>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">
                        Content Progress
                    </span>
                </div>
                <div className="flex justify-center">
                    <DonutChart
                        data={contentBreakdown}
                        size={160}
                        strokeWidth={30}
                    />
                </div>
            </div>
        </div>
    );
}
