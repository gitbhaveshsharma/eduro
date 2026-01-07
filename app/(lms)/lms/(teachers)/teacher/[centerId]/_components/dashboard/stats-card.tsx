'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    iconColor?: string;
    bgColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    iconColor = "text-primary",
    bgColor = "bg-primary/10",
    trend
}: StatsCardProps) {
    return (
        <Card className="hover:shadow-md transition-all duration-300 border-muted/50 ">
            <CardHeader >
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-3xl font-bold tracking-tight">{value}</div>
                        {trend && (
                            <p className={cn(
                                "text-xs font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </p>
                        )}
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${bgColor}`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={2} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
