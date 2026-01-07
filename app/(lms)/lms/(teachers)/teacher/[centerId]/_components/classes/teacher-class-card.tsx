/**
 * Teacher Class Card Component
 * Beautiful cards showing teacher's assigned classes
 * READ-ONLY for teachers
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
    MapPin,
    BookOpen,
    Eye,
    TrendingUp
} from 'lucide-react';

import type { BranchClass } from '@/lib/branch-system/types/branch-classes.types';
import {
    formatTime,
    formatClassDays,
    formatClassStatus,
    calculateAvailableSeats,
    calculateUtilization,
    getClassDisplayName,
    getSubjectColor,
    mapSubjectToId
} from '@/lib/branch-system/utils/branch-classes.utils';
import { getSubjectImageById } from '@/lib/utils/subject-assets';

interface TeacherClassCardProps {
    classData: BranchClass;
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

export function TeacherClassCard({ classData, onViewDetails }: TeacherClassCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const subjectId = mapSubjectToId(classData.subject);
    const gradientConfig = PLACEHOLDER_GRADIENTS[subjectId] || PLACEHOLDER_GRADIENTS.default;
    const subjectImagePath = getSubjectImageById(subjectId as any);
    const subjectColor = getSubjectColor(subjectId);

    const displayName = getClassDisplayName(classData);
    const schedule = formatClassDays(classData.class_days);
    const timeRange = classData.start_time && classData.end_time
        ? `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
        : 'Time not set';

    const statusInfo = formatClassStatus(classData.status);
    const availableSeats = calculateAvailableSeats(classData);
    const utilization = calculateUtilization(classData);

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails(classData.id);
        }
    };

    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl p-0 gap-0 group">
            {/* Header with Status Badge */}
            <div className="relative p-2">
                <div className="absolute top-5 left-5 z-10 flex gap-2">
                    <Badge
                        variant={
                            statusInfo.color === 'green' ? 'default' :
                                statusInfo.color === 'yellow' ? 'secondary' :
                                    'destructive'
                        }
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
                        variant="secondary"
                        className={cn('text-xs font-medium px-2 py-0.5', subjectColor)}
                    >
                        {classData.subject}
                    </Badge>
                    {/* Grade & Batch */}
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{classData.grade_level}</span>
                        {classData.batch_name && (
                            <>
                                <span>•</span>
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

                {/* Enrollment Stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {classData.current_enrollment}/{classData.max_students}
                        </span>
                        <span className="text-xs text-muted-foreground">students</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{utilization}%</span>
                        <span className="text-xs text-muted-foreground">filled</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    {/* Availability Info */}
                    <div className="text-xs text-muted-foreground">
                        {availableSeats > 0 ? (
                            <span>{availableSeats} seats available</span>
                        ) : (
                            <span className="text-destructive">Class Full</span>
                        )}
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