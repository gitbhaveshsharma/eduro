/**
 * Donut Chart Component
 * Beautiful donut/ring chart for content breakdown visualization
 */

'use client';

import { cn } from '@/lib/utils';
import type { ContentBreakdown } from './types';

interface DonutChartProps {
    data: ContentBreakdown;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function DonutChart({
    data,
    size = 180,
    strokeWidth = 24,
    className,
}: DonutChartProps) {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate stroke dash arrays for each segment
    let currentOffset = 0;
    const segments = data.segments.map((segment) => {
        const percentage = (segment.value / data.total) * 100;
        const dashArray = (percentage / 100) * circumference;
        const offset = currentOffset;
        currentOffset += dashArray;

        return {
            ...segment,
            dashArray,
            offset,
            percentage,
        };
    });

    return (
        <div className={cn('relative inline-flex', className)}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />

                {/* Segments */}
                {segments.map((segment, index) => (
                    <circle
                        key={index}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${segment.dashArray} ${circumference}`}
                        strokeDashoffset={-segment.offset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                ))}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">
                    Contents
                </span>
                <span className="text-3xl font-bold text-foreground">{data.total}</span>
            </div>

            {/* Percentage Labels around the chart */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top right - first segment */}
                <span className="absolute top-2 right-0 text-xs font-medium text-muted-foreground">
                    {segments[0]?.percentage.toFixed(0)}%
                </span>
                {/* Right - second segment */}
                <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {segments[1]?.percentage.toFixed(0)}%
                </span>
                {/* Bottom - third segment */}
                <span className="absolute bottom-4 right-4 text-xs font-medium text-muted-foreground">
                    {segments[2]?.percentage.toFixed(0)}%
                </span>
                {/* Left - fourth segment */}
                <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {segments[3]?.percentage.toFixed(0)}%
                </span>
            </div>
        </div>
    );
}

interface DonutLegendProps {
    data: ContentBreakdown;
    className?: string;
}

export function DonutLegend({ data, className }: DonutLegendProps) {
    return (
        <div className={cn('flex flex-wrap gap-3 justify-center', className)}>
            {data.segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-1.5">
                    <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-xs text-muted-foreground">{segment.label}</span>
                </div>
            ))}
        </div>
    );
}
