'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';

/**
 * Loading skeleton for dashboard
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            {/* Header skeleton */}
            <Card className="border-muted/50">
                <CardHeader className="space-y-3">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
            </Card>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-muted/50">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-3 w-24" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-12 w-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Schedule skeleton */}
            <Card className="border-muted/50">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Content grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <Card key={i} className="border-muted/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[1, 2, 3].map((j) => (
                                    <Skeleton key={j} className="h-20" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Error state for dashboard
 */
interface DashboardErrorProps {
    error: string;
    onRetry?: () => void;
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="border-destructive/50 bg-destructive/5 max-w-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="rounded-full bg-destructive/10 p-3">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Failed to Load Dashboard</h3>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                        {onRetry && (
                            <Button
                                variant="outline"
                                onClick={onRetry}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Empty state for dashboard
 */
export function DashboardEmpty() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="border-muted max-w-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="rounded-full bg-muted p-4">
                            <GraduationCap className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Welcome to Your Dashboard</h3>
                            <p className="text-sm text-muted-foreground">
                                Your dashboard will show your classes, assignments, and progress once you enroll in courses.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
