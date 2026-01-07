'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function StudentsPageSkeleton() {
    return (
        <div className="container max-w-7xl mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <div className="mb-6 space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Alert Skeleton */}
            <div className="mb-4 p-4 border rounded-lg">
                <Skeleton className="h-5 w-48 mb-2" />
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-9 w-20" />
                </div>
            </div>

            {/* Filters Skeleton */}
            <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>

            {/* Results Count Skeleton */}
            <div className="mb-4">
                <Skeleton className="h-4 w-48" />
            </div>

            {/* Students List Skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div 
                        key={index} 
                        className="border rounded-lg p-4 space-y-3"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-9 w-24" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
