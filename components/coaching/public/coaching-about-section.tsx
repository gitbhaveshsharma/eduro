/**
 * Coaching About Section - Modern Card Layout
 * Optimized with memoization
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
    Sparkles
} from 'lucide-react';

interface CoachingAboutSectionProps {
    center: PublicCoachingCenter;
}

export const CoachingAboutSection = memo(function CoachingAboutSection({
    center
}: CoachingAboutSectionProps) {
    const hasContent = useMemo(() => ({
        description: typeof center.description === 'string' && center.description.trim().length > 0,
        subjects: Array.isArray(center.subjects) && center.subjects.length > 0,
        targetAudience: Array.isArray(center.target_audience) && center.target_audience.length > 0
    }), [center.description, center.subjects, center.target_audience]);

    if (!hasContent.description && !hasContent.subjects && !hasContent.targetAudience) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Description Card */}
            {hasContent.description && (
                <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2.5 text-xl">
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

            {/* Grid for Subjects and Target Audience */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Subjects Card */}
                {hasContent.subjects && (
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2.5 text-lg">
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
                                        key={index}
                                        variant="secondary"
                                        className="px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                                    >
                                        {subject}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Target Audience Card */}
                {hasContent.targetAudience && (
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2.5 text-lg">
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
                                        key={index}
                                        variant="outline"
                                        className="px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
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
        </div>
    );
});
