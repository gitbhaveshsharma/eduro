/**
 * Upcoming Class Card Component
 * Beautiful cards showing upcoming classes with participant avatars
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { UpcomingClass } from './types';
import { getSubjectImage } from '@/lib/utils/subject-assets';

interface UpcomingClassCardProps {
    classData: UpcomingClass;
    onStart?: (classId: string) => void;
    priority?: boolean; // Add priority for LCP optimization on first card
}

// Fallback gradient backgrounds for when images are loading/missing
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
    business_studies: {
        gradient: 'from-green-50 to-emerald-100',
        decoration: 'text-green-800/20'
    },
    geography: {
        gradient: 'from-teal-50 to-cyan-100',
        decoration: 'text-teal-800/20'
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

export function UpcomingClassCard({ classData, onStart, priority = false }: UpcomingClassCardProps) {
    const [starting, setStarting] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const subjectId = classData.subject.id || 'default';
    const gradientConfig = PLACEHOLDER_GRADIENTS[subjectId] || PLACEHOLDER_GRADIENTS.default;

    // Use getSubjectImage instead of classData.imageUrl
    const subjectImagePath = getSubjectImage(classData.subject);

    const handleStartClass = () => {
        if (!onStart) return;

        setStarting(true);

        // Navigate to class - reduced delay for better UX
        setTimeout(() => {
            setStarting(false);
            onStart(classData.id);
        }, 500); // Reduced from 2 seconds to 500ms
    };

    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl p-0 gap-0">
            {/* Header with time */}
            <div className="relative p-2">
                <div className="absolute top-5 left-5 z-10">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-foreground shadow-sm border border-border/30">
                        Start: {classData.startTime}
                    </span>
                </div>

                {/* Image with Gradient Background Fallback */}
                <div
                    className={cn(
                        'h-32 w-full bg-gradient-to-br relative overflow-hidden rounded-2xl',
                        gradientConfig.gradient
                    )}
                >
                    {/* Subject Image from public/subject folder */}
                   <Image
  src={subjectImagePath}
  alt={`${classData.subject.name} class`}
  fill
  className={cn(
    "object-cover transition-opacity duration-300",
    imageLoaded ? "opacity-100" : "opacity-0"
  )}
  sizes="(max-width: 768px) 100vw, 50vw"
  priority={priority}
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

                    {/* Decorative SVG overlay (shows through if image has transparency) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                        <svg
                            className={cn('w-32 h-32 opacity-30', gradientConfig.decoration)}
                            viewBox="0 0 100 100"
                            fill="currentColor"
                        >
                            {/* Decorative leaf shapes */}
                            <path d="M50 10 Q70 30 50 60 Q30 30 50 10" />
                            <path d="M30 40 Q50 50 40 70 Q20 50 30 40" transform="rotate(-30 50 50)" />
                            <path d="M70 40 Q50 50 60 70 Q80 50 70 40" transform="rotate(30 50 50)" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
                {/* Subject Badge */}
                <Badge
                    variant="secondary"
                    className={cn(
                        'text-xs font-medium px-2 py-0.5',
                        classData.subject.color
                    )}
                >
                    {classData.subject.name}
                </Badge>

                {/* Title */}
                <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                    {classData.title}
                </h3>

                {/* Footer with avatars and button */}
                <div className="flex items-center justify-between pt-1">
                    {/* Participant Avatars */}
                    <div className="flex items-center">
                        <div className="flex -space-x-2">
                            {classData.participants.avatars.slice(0, 3).map((avatar, idx) => (
                                <Avatar
                                    key={idx}
                                    className="w-7 h-7 border-2 border-card bg-accent"
                                >
                                    <AvatarImage src={avatar} alt={`Participant ${idx + 1}`} />
                                    <AvatarFallback className="text-xs bg-primary/10">
                                        {String.fromCharCode(65 + idx)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        {classData.participants.count > 3 && (
                            <span className="ml-2 text-xs text-muted-foreground font-medium">
                                {classData.participants.count}+
                            </span>
                        )}
                    </div>

                    {/* Start Button with Loading */}
                    <Button
                        variant="outline"
                        size="sm"
                        loading={starting}
                        loadingText="Starting..."
                        onClick={handleStartClass}
                        className="rounded-full px-4 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors min-w-20"
                    >
                        {!starting && "Start"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

interface UpcomingClassesProps {
    classes: UpcomingClass[];
    onViewAll?: () => void;
    onStartClass?: (classId: string) => void;
}

export function UpcomingClasses({
    classes,
    onViewAll,
    onStartClass,
}: UpcomingClassesProps) {
    const [viewAllLoading, setViewAllLoading] = useState(false);

    const handleViewAll = () => {
        if (!onViewAll) return;

        setViewAllLoading(true);

        // Simulate loading
        setTimeout(() => {
            setViewAllLoading(false);
            onViewAll();
        }, 1000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                    Your Upcoming Class
                </h2>
                {classes.length > 2 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={viewAllLoading}
                        loadingText="Loading..."
                        onClick={handleViewAll}
                        className="text-sm font-medium text-primary hover:text-primary/80 h-fit px-3 py-1.5"
                    >
                        {!viewAllLoading && "View all"}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.slice(0, 2).map((classItem, index) => (
                    <UpcomingClassCard
                        key={classItem.id}
                        classData={classItem}
                        onStart={onStartClass}
                        priority={index === 0}
                    />
                ))}
            </div>
        </div>
    );
}