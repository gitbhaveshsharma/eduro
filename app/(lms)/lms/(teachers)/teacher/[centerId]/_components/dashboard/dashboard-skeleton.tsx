'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Loading skeleton for the dashboard
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 pb-8 animate-pulse">
            {/* Header skeleton */}
            <div className="rounded-xl bg-gradient-to-r from-muted/50 to-transparent p-4 sm:p-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-muted/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Schedule skeleton */}
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="min-w-[260px] p-4 rounded-xl border">
                                <div className="flex justify-between mb-3">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-5 w-full mb-2" />
                                <Skeleton className="h-4 w-20 rounded-full" />
                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Grid section skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Grading skeleton */}
                <Card className="border-muted/50">
                    <CardHeader className="pb-3">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                                    <Skeleton className="h-4 w-4 mx-auto mb-2" />
                                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                                    <Skeleton className="h-3 w-12 mx-auto" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Deadlines skeleton */}
                <Card className="border-muted/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-3 rounded-lg border-l-4 border-muted">
                                <div className="flex justify-between mb-2">
                                    <div className="space-y-1 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-1.5 w-full rounded-full mt-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/**
 * Error state for the dashboard
 */
interface DashboardErrorProps {
    error: string;
    onRetry?: () => void;
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {error}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

/**
 * Empty state when no data
 */
export function DashboardEmpty() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Dashboard Data</h3>
            <p className="text-sm text-muted-foreground max-w-md">
                Start by creating classes and assignments to see your dashboard statistics.
            </p>
        </div>
    );
}
