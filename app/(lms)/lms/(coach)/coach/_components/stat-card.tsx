'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconBgColor: string;
    iconColor: string;
    onClick?: () => void;
}

export const StatCard = memo(({
    title,
    value,
    icon: Icon,
    iconBgColor,
    iconColor,
    onClick
}: StatCardProps) => (
    <Card
        className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        onClick={onClick}
    >
        <CardContent className="">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
            </div>
        </CardContent>
    </Card>
));

StatCard.displayName = 'StatCard';
