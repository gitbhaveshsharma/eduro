'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { MiniBarChart } from './mini-charts';

interface DashboardStatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    chartData?: Array<{
        label: string;
        value: number;
        color: string;
    }>;
    chartOrientation?: 'horizontal' | 'vertical';
    onClick?: () => void;
    className?: string;
}

/**
 * Dashboard stats card component
 * Displays key metrics with optional mini charts
 */
export function DashboardStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-brand-primary',
    bgColor = 'bg-brand-primary/10',
    chartData,
    chartOrientation = 'horizontal',
    onClick,
    className,
}: DashboardStatsCardProps) {
    return (
        <Card
            className={cn(
                'border-none bg-card shadow-sm ring-1 ring-border hover:shadow-md transition-all',
                onClick && 'cursor-pointer hover:ring-brand-primary/30',
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl font-extrabold text-foreground tabular-nums">
                        {value}
                    </div>
                    <div className={cn('rounded-xl p-2.5', bgColor)}>
                        <Icon className={cn('h-6 w-6', iconColor)} />
                    </div>
                </div>

                {subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                        {subtitle}
                    </p>
                )}

                {chartData && chartData.length > 0 && (
                    <div className="mt-3">
                        <MiniBarChart
                            data={chartData}
                            orientation={chartOrientation}
                            barHeight={chartOrientation === 'horizontal' ? 6 : undefined}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
