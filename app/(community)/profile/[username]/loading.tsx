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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Skeleton */}
                <section className="relative">
                    {/* Cover skeleton */}
                    <Skeleton className="h-32 sm:h-40 lg:h-48 w-full rounded-t-xl" />

                    {/* Profile info skeleton */}
                    <div className="relative -mt-16 sm:-mt-20">
                        <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                {/* Avatar skeleton */}
                                <div className="relative shrink-0 -mt-16 sm:-mt-20">
                                    <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background" />
                                </div>

                                {/* Info skeleton */}
                                <div className="flex-1 pt-2 sm:pt-4 space-y-3">
                                    {/* Name */}
                                    <Skeleton className="h-8 w-48" />
                                    {/* Username */}
                                    <Skeleton className="h-4 w-32" />
                                    {/* Followers/Following counts */}
                                    <div className="flex gap-4">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-6 w-24" />
                                    </div>
                                    {/* Bio */}
                                    <Skeleton className="h-16 w-full max-w-2xl" />
                                </div>

                                {/* Share button skeleton */}
                                <div className="sm:ml-auto">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Grid Skeleton */}
                <div className="py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Actions, Connections, and Stats */}
                        <div className="lg:col-span-1 space-y-4">
                            {/* Actions Card */}
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>

                            {/* Connections Card */}
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats Card */}
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-20" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Skeleton className="h-8 w-16" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-8 w-16" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - About and Posts */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* About Card */}
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>

                            {/* Interests/Skills Card */}
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-28" />
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-32" />
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Posts Card */}
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-28" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Post skeleton 1 */}
                                    <div className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-32 w-full rounded-md" />
                                    </div>

                                    {/* Post skeleton 2 */}
                                    <div className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-4/5" />
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
