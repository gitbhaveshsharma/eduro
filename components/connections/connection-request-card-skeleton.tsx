'use client';

/**
 * Connection Request Card Skeleton Component
 * 
 * Loading placeholder for connection request cards.
 * Matches the structure of ConnectionRequestCard.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ConnectionRequestCardSkeleton() {
    return (
        <Card className="border-2">
            <CardContent>
                <div className="space-y-3">
                    {/* Top row - Avatar, Name, and Action Buttons */}
                    <div className="flex items-start gap-3">
                        {/* Avatar Skeleton */}
                        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

                        {/* Profile Info Skeleton */}
                        <div className="flex-1 min-w-0 space-y-2">
                            {/* Name */}
                            <Skeleton className="h-4 w-32" />
                            {/* Username */}
                            <Skeleton className="h-3 w-24" />
                            {/* Role badge and time */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        </div>

                        {/* Action Buttons Skeleton */}
                        <div className="flex-shrink-0 flex gap-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </div>

                    {/* Message Skeleton (optional - shows about 50% of the time) */}
                    {Math.random() > 0.5 && (
                        <Skeleton className="h-12 w-full rounded-lg" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}