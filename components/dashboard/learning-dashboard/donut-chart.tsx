'use client';

import { cn } from '@/lib/utils';
import type { ContentBreakdown } from './types';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
    ChartData,
    TooltipItem,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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
    const chartData: ChartData<'doughnut', number[], string> = {
        labels: data.segments.map(segment => segment.label),
        datasets: [
            {
                data: data.segments.map(segment => segment.value),
                backgroundColor: data.segments.map(segment => segment.color),
                borderColor: '#ffffff',
                borderWidth: 2,
                borderAlign: 'inner',
                hoverOffset: 4,
                offset: 0,
                borderRadius: strokeWidth / 1.5,
            },
        ],
    };

    const cutoutPercentage = Math.max(
        0,
        Math.min(100, 100 - (strokeWidth / (size / 2)) * 100),
    );

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: `${cutoutPercentage}%`,
        rotation: -90,
        circumference: 360,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                // use default background, no external HTML
                enabled: true,
                callbacks: {
                    label: function (context: TooltipItem<'doughnut'>) {
                        const value = context.parsed as number;
                        const percentage = ((value / data.total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
        animation: {
            animateRotate: true,
            animateScale: false,
        },
    } as unknown as ChartOptions<'doughnut'>;

    return (
        <div
            className={cn('relative inline-flex', className)}
            style={{ width: size, height: size }}
        >
            <Doughnut data={chartData} options={options} width={size} height={size} />

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted-foreground font-medium">
                    Contents
                </span>
                <span className="text-3xl font-bold text-foreground">{data.total}</span>
            </div>
        </div>
    );
}

interface DonutLegendProps {
    data: ContentBreakdown;
    className?: string;
}

export function DonutLegend({ data, className }: DonutLegendProps) {
    const segmentsWithPercentage = data.segments.map(segment => ({
        ...segment,
        percentage: ((segment.value / data.total) * 100).toFixed(0),
    }));

    return (
        <div className={cn('flex flex-wrap gap-4 justify-center', className)}>
            {segmentsWithPercentage.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-medium text-foreground">
                        {segment.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        ({segment.value}, {segment.percentage}%)
                    </span>
                </div>
            ))}
        </div>
    );
}
