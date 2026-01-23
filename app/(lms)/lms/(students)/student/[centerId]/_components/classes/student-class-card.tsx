/**
 * Student Class Card Component
 * Beautiful cards showing student's enrolled classes
 * READ-ONLY for students
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Clock,
    Calendar,
    Users,
    BookOpen,
    Eye,
    TrendingUp,
    GraduationCap
} from 'lucide-react';

import type { UpcomingClassData } from '@/lib/branch-system/types/branch-classes.types';
import {
    formatTime,
    formatClassDays,
} from '@/lib/branch-system/utils/branch-classes.utils';
import { getSubjectImageById, getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';

interface StudentClassCardProps {
    classData: UpcomingClassData;
    onViewDetails?: (classId: string) => void;
}

// Placeholder gradients for subject backgrounds
const PLACEHOLDER_GRADIENTS: Record<string, { gradient: string; decoration: string }> = {
    physics: {
        gradient: 'from-blue-50 to-indigo-100',
        decoration: 'text-blue-800/20'
    },
    chemistry: {
        gradient: 'from-purple-50 to-pink-100',
        decoration: 'text-purple-800/20'
    },
    english: {
        gradient: 'from-orange-50 to-amber-100',
        decoration: 'text-orange-800/20'
    },
    mathematics: {
        gradient: 'from-indigo-50 to-blue-100',
        decoration: 'text-indigo-800/20'
    },
    biology: {
        gradient: 'from-green-50 to-lime-100',
        decoration: 'text-green-800/20'
    },
    default: {
        gradient: 'from-gray-100 to-gray-200',
        decoration: 'text-gray-600/20'
    }
};

/**
 * Map subject name to SubjectId for assets lookup
 */
function mapSubjectToId(subject: string): string {
    const subjectMap: Record<string, string> = {
        'physics': 'physics',
        'chemistry': 'chemistry',
        'mathematics': 'mathematics',
        'math': 'mathematics',
        'maths': 'mathematics',
        'biology': 'biology',
        'english': 'english',
        'hindi': 'hindi',
        'science': 'science',
        'social studies': 'social-studies',
        'history': 'history',
        'geography': 'geography',
        'economics': 'economics',
        'computer science': 'computer-science',
        'accountancy': 'accountancy',
        'business studies': 'business-studies',
    };
    return subjectMap[subject.toLowerCase()] || 'default';
}

/**
 * Get enrollment status badge info
 */
function getEnrollmentStatusInfo(status: string): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        'ENROLLED': { label: 'Enrolled', variant: 'default' },
        'PENDING': { label: 'Pending', variant: 'secondary' },
        'WITHDRAWN': { label: 'Withdrawn', variant: 'destructive' },
        'COMPLETED': { label: 'Completed', variant: 'outline' },
    };
    return statusMap[status] || { label: status, variant: 'secondary' };
}

export function StudentClassCard({ classData, onViewDetails }: StudentClassCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const subjectId = mapSubjectToId(classData.subject) as SubjectId;
    const gradientConfig = PLACEHOLDER_GRADIENTS[subjectId] || PLACEHOLDER_GRADIENTS.default;
    const subjectImagePath = getSubjectImageById(subjectId);
    const subjectColor = getSubjectColor(subjectId);

    const displayName = classData.class_name || classData.subject;
    const schedule = formatClassDays(classData.class_days);
    const timeRange = classData.start_time && classData.end_time
        ? `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
        : 'Time not set';

    const statusInfo = getEnrollmentStatusInfo(classData.enrollment_status);

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(classData.class_id);
        }
    };

    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl p-0 gap-0 group">
            {/* Header with Status Badge */}
            <div className="relative p-2">
                <div className="absolute top-5 left-5 z-10 flex gap-2">
                    <Badge
                        variant={statusInfo.variant}
                        className="text-xs font-medium"
                    >
                        {statusInfo.label}
                    </Badge>
                </div>

                {/* Subject Image with Gradient Background */}
                <div
                    className={cn(
                        'h-32 w-full bg-gradient-to-br relative overflow-hidden rounded-2xl',
                        gradientConfig.gradient
                    )}
                >
                    <Image
                        src={subjectImagePath}
                        alt={`${classData.subject} class`}
                        fill
                        className={cn(
                            "object-cover transition-opacity duration-300",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                    />

                    {/* Gradient background - visible while image loads */}
                    {!imageLoaded && (
                        <div className={cn(
                            'absolute inset-0 animate-pulse',
                            gradientConfig.gradient
                        )} />
                    )}

                    {/* Decorative overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                        <BookOpen
                            className={cn('w-32 h-32 opacity-10', gradientConfig.decoration)}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Subject Badge & Grade/Batch in same line */}
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={cn('text-xs font-medium px-2 py-0.5 border-0', subjectColor)}
                    >
                        {classData.subject}
                    </Badge>
                    {/* Grade & Batch */}
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{classData.grade_level}</span>
                        {classData.batch_name && (
                            <>
                                <span className="mx-1">•</span>
                                <span>{classData.batch_name}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Title with hover effect */}
                <h3 className="font-semibold text-foreground text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {displayName}
                </h3>

                {/* Schedule Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{schedule || 'No schedule'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{timeRange}</span>
                    </div>
                </div>

                {/* Attendance & Grade Stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {classData.attendance_percentage}%
                        </span>
                        <span className="text-xs text-muted-foreground">attendance</span>
                    </div>
                    {classData.current_grade && (
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{classData.current_grade}</span>
                            <span className="text-xs text-muted-foreground">grade</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    {/* Description preview */}
                    <div className="text-xs text-muted-foreground truncate max-w-[60%]">
                        {classData.description || 'No description'}
                    </div>

                    {/* View Details Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewDetails}
                        className="rounded-full px-4 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                    </Button>
                </div>
            </div>
        </Card>
    );
}
