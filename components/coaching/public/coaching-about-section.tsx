/**
 * Coaching About Section Component
 * 
 * Displays detailed information about the coaching center
 * Including description, subjects, target audience, and other key details
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoachingDisplayUtils, type PublicCoachingCenter } from '@/lib/coaching';
import {
    BookOpen,
    Users,
    Calendar,
    Info
} from 'lucide-react';

interface CoachingAboutSectionProps {
    center: PublicCoachingCenter;
}

export function CoachingAboutSection({ center }: CoachingAboutSectionProps) {
    const hasSubjects = center.subjects && center.subjects.length > 0;
    const hasTargetAudience = center.target_audience && center.target_audience.length > 0;
    const hasDescription = center.description && center.description.trim().length > 0;

    if (!hasDescription && !hasSubjects && !hasTargetAudience) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Description */}
            {hasDescription && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            About {center.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {center.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Subjects and Target Audience Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Subjects Offered */}
                {hasSubjects && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BookOpen className="h-5 w-5" />
                                Subjects Offered
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {center.subjects!.map((subject, index) => (
                                    <Badge key={index} variant="secondary" className="text-sm">
                                        {subject}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Target Audience */}
                {hasTargetAudience && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5" />
                                Target Audience
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {center.target_audience!.map((audience, index) => (
                                    <Badge key={index} variant="outline" className="text-sm">
                                        {audience}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Establishment Year */}
                {center.established_year && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5" />
                                Established
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-primary">
                                {center.established_year}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {CoachingDisplayUtils.formatEstablishedYear(center.established_year)}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
