/**
 * Coaching About Section - Production Ready (Without Location)
 * Optimized with memoization and professional organization
 */

'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type PublicCoachingCenter } from '@/lib/coaching';
import {
    BookOpen,
    Users,
    Info,
    Sparkles,
} from 'lucide-react';

interface CoachingAboutSectionProps {
    center: PublicCoachingCenter;
}

export const CoachingAboutSection = memo(function CoachingAboutSection({
    center,
}: CoachingAboutSectionProps) {
    // Memoized content checks for optimal performance
    const hasContent = useMemo(() => ({
        description: Boolean(center.description?.trim()),
        subjects: Array.isArray(center.subjects) && center.subjects.length > 0,
        targetAudience: Array.isArray(center.target_audience) && center.target_audience.length > 0,
    }), [center.description, center.subjects, center.target_audience]);

    // Early return if no content to render
    if (!Object.values(hasContent).some(Boolean)) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Description Section */}
            {hasContent.description && (
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            About {center.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                            {center.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Academic Information Grid */}
            {(hasContent.subjects || hasContent.targetAudience) && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Subjects Offered */}
                    {hasContent.subjects && (
                        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-blue-500" />
                                    </div>
                                    Subjects Offered
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {center.subjects!.map((subject, index) => (
                                        <Badge
                                            key={`subject-${index}`}
                                            variant="secondary"
                                            className="px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors duration-200"
                                        >
                                            {subject}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Target Audience */}
                    {hasContent.targetAudience && (
                        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Users className="h-5 w-5 text-purple-500" />
                                    </div>
                                    Target Audience
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {center.target_audience!.map((audience, index) => (
                                        <Badge
                                            key={`audience-${index}`}
                                            variant="outline"
                                            className="px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors duration-200"
                                        >
                                            <Sparkles className="h-3 w-3 mr-1.5" />
                                            {audience}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
});