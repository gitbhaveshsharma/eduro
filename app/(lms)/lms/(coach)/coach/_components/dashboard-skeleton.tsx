'use client';

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = memo(() => (
    <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
    </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';
