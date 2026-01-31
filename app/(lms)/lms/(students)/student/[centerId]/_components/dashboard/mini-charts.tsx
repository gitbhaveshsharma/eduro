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
        <div className="w-full bg-muted/20 rounded-full overflow-hidden" style={{ height: `${height}px` }}>
            <div
                className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
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
            <div className="flex items-end gap-1 h-16">
                {data.map((item, idx) => {
                    const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full relative" style={{ height: '100%' }}>
                                <div className="absolute bottom-0 w-full bg-muted/20 rounded-t" style={{ height: '100%' }} />
                                <div
                                    className={cn('absolute bottom-0 w-full rounded-t transition-all duration-700', item.color)}
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
                            <span className="font-medium text-brand-primary">{item.value}</span>
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
    value?: number;
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
    // Calculate percentage based on what's provided
    let computedPercentage = 0;

    if (percentage !== undefined) {
        computedPercentage = percentage;
    } else if (value !== undefined && maxValue !== undefined && maxValue > 0) {
        computedPercentage = (value / maxValue) * 100;
    } else if (value !== undefined) {
        computedPercentage = value; // Assume value is already a percentage
    }

    // Ensure percentage is between 0-100
    computedPercentage = Math.min(100, Math.max(0, computedPercentage));

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{label}</span>
                {showPercentage && (
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                        {computedPercentage.toFixed(0)}%
                    </span>
                )}
            </div>
            <div className="relative">
                <MiniBar value={computedPercentage} maxValue={100} color={color} height={6} />
            </div>
        </div>
    );
}

/**
 * Circular progress indicator
 */
interface CircularProgressProps {
    value: number;
    maxValue?: number;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    showLabel?: boolean;
}

export function CircularProgress({
    value,
    maxValue = 100,
    size = 'md',
    color = 'text-brand-primary',
    showLabel = true
}: CircularProgressProps) {
    const percentage = Math.min(100, (value / maxValue) * 100);

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20'
    };

    const strokeWidth = {
        sm: 4,
        md: 6,
        lg: 8
    };

    const radius = {
        sm: 16,
        md: 30,
        lg: 36
    };

    const circumference = 2 * Math.PI * radius[size];
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                className={cn('transform -rotate-90', sizeClasses[size])}
                viewBox="0 0 100 100"
            >
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius[size] - strokeWidth[size]}
                    strokeWidth={strokeWidth[size]}
                    className="stroke-muted/20 fill-none"
                />
                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius[size] - strokeWidth[size]}
                    strokeWidth={strokeWidth[size]}
                    className={cn('transition-all duration-700 ease-out fill-none', color)}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                        "font-semibold tabular-nums",
                        size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-xl'
                    )}>
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            )}
        </div>
    );
}