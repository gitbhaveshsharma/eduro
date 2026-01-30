'use client';

import { cn } from '@/lib/utils';

/**
 * Mini bar component for inline charts
 */
interface MiniBarProps {
    value: number;
    maxValue: number;
    color?: string;
    height?: number;
}

export function MiniBar({ value, maxValue, color = 'bg-brand-primary', height = 4 }: MiniBarProps) {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    return (
        <div className="w-full bg-muted/30 rounded-full overflow-hidden" style={{ height: `${height}px` }}>
            <div
                className={cn('h-full transition-all duration-500', color)}
                style={{ width: `${Math.min(100, percentage)}%` }}
            />
        </div>
    );
}

/**
 * Mini bar chart for multiple values
 */
interface MiniBarChartProps {
    data: Array<{
        label: string;
        value: number;
        color: string;
    }>;
    orientation?: 'horizontal' | 'vertical';
    barHeight?: number;
    showLabels?: boolean;
}

export function MiniBarChart({
    data,
    orientation = 'horizontal',
    barHeight = 8,
    showLabels = false
}: MiniBarChartProps) {
    const maxValue = Math.max(...data.map(d => d.value));

    if (orientation === 'vertical') {
        return (
            <div className="flex items-end gap-1 h-12">
                {data.map((item, idx) => {
                    const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full relative" style={{ height: '100%' }}>
                                <div className="absolute bottom-0 w-full bg-muted/20 rounded-t" style={{ height: '100%' }} />
                                <div
                                    className={cn('absolute bottom-0 w-full rounded-t transition-all', item.color)}
                                    style={{ height: `${height}%` }}
                                />
                            </div>
                            {showLabels && (
                                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {data.map((item, idx) => (
                <div key={idx} className="space-y-1">
                    {showLabels && (
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                        </div>
                    )}
                    <MiniBar value={item.value} maxValue={maxValue} color={item.color} height={barHeight} />
                </div>
            ))}
        </div>
    );
}

/**
 * Stat with progress bar
 */
interface StatWithBarProps {
    label: string;
    value: number;
    maxValue?: number;
    percentage?: number;
    color?: string;
    showPercentage?: boolean;
}

export function StatWithBar({
    label,
    value,
    maxValue,
    percentage,
    color = 'bg-brand-primary',
    showPercentage = true
}: StatWithBarProps) {
    const computedPercentage = percentage ?? (maxValue ? (value / maxValue) * 100 : 0);

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{label}</span>
                {showPercentage && (
                    <span className="text-xs font-semibold tabular-nums">
                        {computedPercentage.toFixed(0)}%
                    </span>
                )}
            </div>
            <MiniBar value={computedPercentage} maxValue={100} color={color} height={6} />
        </div>
    );
}
