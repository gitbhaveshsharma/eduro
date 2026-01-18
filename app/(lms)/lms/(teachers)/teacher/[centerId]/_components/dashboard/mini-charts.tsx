'use client';

import { cn } from '@/lib/utils';

interface MiniBarProps {
    value: number;
    max: number;
    color?: string;
    showValue?: boolean;
    className?: string;
    height?: number;
}

/**
 * Mini bar for inline statistics display
 */
export function MiniBar({
    value,
    max,
    color = 'bg-primary',
    showValue = true,
    className,
    height = 4,
}: MiniBarProps) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div
                className="flex-1 bg-muted rounded-full overflow-hidden"
                style={{ height: `${height}px` }}
            >
                <div
                    className={cn('h-full rounded-full transition-all duration-300', color)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showValue && (
                <span className="text-xs text-muted-foreground tabular-nums min-w-[2rem] text-right">
                    {value}
                </span>
            )}
        </div>
    );
}

interface MiniBarChartProps {
    data: Array<{
        label: string;
        value: number;
        color?: string;
    }>;
    maxValue?: number;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
    showLabels?: boolean;
    barHeight?: number;
}

/**
 * Mini bar chart for dashboard cards
 */
export function MiniBarChart({
    data,
    maxValue,
    className,
    orientation = 'horizontal',
    showLabels = true,
    barHeight = 20,
}: MiniBarChartProps) {
    const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

    if (orientation === 'vertical') {
        return (
            <div className={cn('flex items-end gap-1 h-16', className)}>
                {data.map((item, index) => {
                    const heightPercent = max > 0 ? (item.value / max) * 100 : 0;
                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-1 gap-1"
                        >
                            <span className="text-[10px] font-medium tabular-nums">
                                {item.value}
                            </span>
                            <div
                                className={cn(
                                    'w-full rounded-t transition-all duration-300',
                                    item.color || 'bg-primary'
                                )}
                                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                            />
                            {showLabels && (
                                <span className="text-[9px] text-muted-foreground truncate max-w-full">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            {data.map((item, index) => (
                <div key={index} className="space-y-1">
                    {showLabels && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground truncate flex-1">
                                {item.label}
                            </span>
                            <span className="font-medium tabular-nums ml-2">
                                {item.value}
                            </span>
                        </div>
                    )}
                    <div
                        className="bg-muted rounded-full overflow-hidden"
                        style={{ height: `${barHeight}px` }}
                    >
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-300',
                                item.color || 'bg-primary'
                            )}
                            style={{
                                width: `${max > 0 ? (item.value / max) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface StatWithBarProps {
    label: string;
    value: number;
    total?: number;
    color?: string;
    showPercentage?: boolean;
}

/**
 * Stat item with progress bar
 */
export function StatWithBar({
    label,
    value,
    total,
    color = 'bg-primary',
    showPercentage = false,
}: StatWithBarProps) {
    const percentage = total && total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold tabular-nums">
                    {value}
                    {showPercentage && total && (
                        <span className="text-muted-foreground font-normal ml-1">
                            ({percentage}%)
                        </span>
                    )}
                </span>
            </div>
            {total && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn('h-full rounded-full transition-all duration-300', color)}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            )}
        </div>
    );
}
