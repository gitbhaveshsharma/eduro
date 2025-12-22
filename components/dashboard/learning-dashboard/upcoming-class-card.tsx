/**
 * Upcoming Class Card Component
 * Beautiful cards showing upcoming classes with participant avatars
 */

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { UpcomingClass } from './types';

interface UpcomingClassCardProps {
    classData: UpcomingClass;
    onStart?: (classId: string) => void;
}

// Placeholder images for demo - gradient backgrounds matching the design
const PLACEHOLDER_IMAGES: Record<string, { gradient: string; decoration: string }> = {
    Physics: {
        gradient: 'from-[#E8F5E9] to-[#C8E6C9]',
        decoration: 'text-green-800/20'
    },
    Chemistry: {
        gradient: 'from-[#E8F5E9] to-[#C8E6C9]',
        decoration: 'text-green-800/20'
    },
    English: {
        gradient: 'from-orange-50 to-amber-100',
        decoration: 'text-orange-800/20'
    },
    Business: {
        gradient: 'from-blue-50 to-indigo-100',
        decoration: 'text-blue-800/20'
    },
    Geography: {
        gradient: 'from-teal-50 to-cyan-100',
        decoration: 'text-teal-800/20'
    },
};

export function UpcomingClassCard({ classData, onStart }: UpcomingClassCardProps) {
    const imageConfig = PLACEHOLDER_IMAGES[classData.subject.name] || {
        gradient: 'from-gray-100 to-gray-200',
        decoration: 'text-gray-600/20'
    };

    return (
        <Card className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card rounded-2xl">
            {/* Header with time */}
            <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-foreground shadow-sm border border-border/30">
                        Start: {classData.startTime}
                    </span>
                </div>

                {/* Image/Gradient Background */}
                <div
                    className={cn(
                        'h-36 w-full bg-gradient-to-br relative overflow-hidden',
                        imageConfig.gradient
                    )}
                >
                    {/* Decorative leaf/nature elements for physics/chemistry cards */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className={cn('w-32 h-32', imageConfig.decoration)}
                            viewBox="0 0 100 100"
                            fill="currentColor"
                        >
                            {/* Leaf shape 1 */}
                            <path d="M50 10 Q70 30 50 60 Q30 30 50 10" />
                            {/* Leaf shape 2 */}
                            <path d="M30 40 Q50 50 40 70 Q20 50 30 40" transform="rotate(-30 50 50)" />
                            {/* Leaf shape 3 */}
                            <path d="M70 40 Q50 50 60 70 Q80 50 70 40" transform="rotate(30 50 50)" />
                        </svg>
                    </div>
                    {classData.imageUrl && (
                        <Image
                            src={classData.imageUrl}
                            alt={classData.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                                // Hide broken images
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
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
                                    className="w-7 h-7 border-2 border-card"
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

                    {/* Start Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStart?.(classData.id)}
                        className="rounded-full px-4 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                        Start
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
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                    Your Upcoming Class
                </h2>
                <button
                    onClick={onViewAll}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    View all
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.slice(0, 2).map((classItem) => (
                    <UpcomingClassCard
                        key={classItem.id}
                        classData={classItem}
                        onStart={onStartClass}
                    />
                ))}
            </div>
        </div>
    );
}
