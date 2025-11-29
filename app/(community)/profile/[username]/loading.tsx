/**
 * Public Profile Loading State
 * 
 * Skeleton loading UI while profile data is being fetched.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicProfileLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-5xl mx-auto">
                {/* Header Skeleton */}
                <section className="relative">
                    {/* Cover skeleton */}
                    <Skeleton className="h-32 sm:h-40 lg:h-48 rounded-t-xl" />

                    {/* Profile info skeleton */}
                    <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-6 lg:px-8">
                        <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                {/* Avatar skeleton */}
                                <div className="relative shrink-0 -mt-16 sm:-mt-20">
                                    <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
                                </div>

                                {/* Info skeleton */}
                                <div className="flex-1 pt-2 sm:pt-4 space-y-3">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex gap-3">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-6 w-32" />
                                    </div>
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Grid Skeleton */}
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-16" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-32 w-full" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-40" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-32" />
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-28" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
