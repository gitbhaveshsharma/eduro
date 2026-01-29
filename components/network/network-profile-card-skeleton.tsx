'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileCardSkeleton() {
    return (
        <Card className="border-2">
            <CardContent>
                <div className="space-y-3">
                    {/* Top row - Avatar, Name, and Button */}
                    <div className="flex items-start gap-3">
                        {/* Avatar Skeleton */}
                        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

                        {/* Profile Info Skeleton */}
                        <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-5 w-20" />
                        </div>

                        {/* Button Skeleton */}
                        <Skeleton className="h-9 w-20 flex-shrink-0" />
                    </div>

                    {/* Bio Skeleton */}
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
