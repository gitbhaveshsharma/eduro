'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiniBarChart } from './mini-charts';

interface DashboardStatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    chartData?: Array<{
        label: string;
        value: number;
        color?: string;
    }>;
    chartOrientation?: 'horizontal' | 'vertical';
    onClick?: () => void;
}

/**
 * Dashboard stats card with optional mini chart
 * Mobile-friendly with responsive sizing
 */
export function DashboardStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-primary',
    bgColor = 'bg-primary/10',
    trend,
    chartData,
    chartOrientation = 'vertical',
    onClick,
}: DashboardStatsCardProps) {
    return (
        <Card
            className={cn(
                'hover:shadow-md transition-all duration-300 border-muted/50',
                onClick && 'cursor-pointer hover:border-primary/30'
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-2 space-y-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                        {title}
                    </CardTitle>
                    <div className={cn(
                        'h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0',
                        bgColor
                    )}>
                        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} strokeWidth={2} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {/* Main value */}
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                            {value}
                        </div>
                        {trend && (
                            <span className={cn(
                                'text-xs font-medium',
                                trend.isPositive ? 'text-green-600' : 'text-red-600'
                            )}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {subtitle}
                        </p>
                    )}

                    {/* Mini chart */}
                    {chartData && chartData.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                            <MiniBarChart
                                data={chartData}
                                orientation={chartOrientation}
                                showLabels={chartOrientation === 'horizontal'}
                                barHeight={chartOrientation === 'horizontal' ? 6 : undefined}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface CompactStatsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    description?: string;
}

/**
 * Compact stats card for mobile grids
 */
export function CompactStatsCard({
    title,
    value,
    icon: Icon,
    iconColor = 'text-primary',
    bgColor = 'bg-primary/10',
    description,
}: CompactStatsCardProps) {
    return (
        <Card className="hover:shadow-sm transition-shadow border-muted/50">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                        bgColor
                    )}>
                        <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">{title}</p>
                        <p className="text-xl font-bold tabular-nums">{value}</p>
                        {description && (
                            <p className="text-[10px] text-muted-foreground truncate">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
