'use client';

/**
 * Public Profile About Component
 * 
 * Displays bio, expertise areas, subjects of interest, and other details
 * in a modern card-based layout.
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PublicProfile } from '@/lib/schema/profile.types';
import {
    BookOpen,
    Briefcase,
    FileText,
    GraduationCap,
    Lightbulb,
    Star,
    Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicProfileAboutProps {
    profile: PublicProfile;
    className?: string;
}

export const PublicProfileAbout = memo(function PublicProfileAbout({
    profile,
    className,
}: PublicProfileAboutProps) {
    const hasExpertise = profile.expertise_areas && profile.expertise_areas.length > 0;
    const hasSubjects = profile.subjects_of_interest && profile.subjects_of_interest.length > 0;
    const hasBio = profile.bio && profile.bio.trim().length > 0;
    const isTeacherOrCoach = profile.role === 'T' || profile.role === 'C';
    const isStudent = profile.role === 'S';

    // Don't render if there's nothing to show
    if (!hasBio && !hasExpertise && !hasSubjects) {
        return null;
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* About/Bio Section */}
            {hasBio && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <FileText className="h-5 w-5 text-primary" />
                            About
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                            {profile.bio}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Expertise Areas (Teachers/Coaches) */}
            {isTeacherOrCoach && hasExpertise && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Expertise Areas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {profile.expertise_areas!.map((area, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                    <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                                    {area}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Experience (Teachers/Coaches) */}
            {isTeacherOrCoach && profile.years_of_experience && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <Star className="h-5 w-5 text-primary" />
                            Experience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                                <span className="text-2xl font-bold text-primary">
                                    {profile.years_of_experience}
                                </span>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">Years of Experience</p>
                                <p className="text-sm text-muted-foreground">
                                    {profile.role === 'T' ? 'Teaching' : 'Coaching'} expertise
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Subjects of Interest (Students) */}
            {isStudent && hasSubjects && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Subjects of Interest
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {profile.subjects_of_interest!.map((subject, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200"
                                >
                                    <Target className="h-3.5 w-3.5 mr-1.5" />
                                    {subject}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Grade Level (Students) */}
            {isStudent && profile.grade_level && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Education Level
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <GraduationCap className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">{profile.grade_level}</p>
                                <p className="text-sm text-muted-foreground">Current grade level</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
});
