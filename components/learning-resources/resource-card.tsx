/**
 * Resource Card Component
 * Displays a learning resource with subject image and progress
 */

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { LearningResource } from '@/lib/learning-resources/data';
import { getSubjectConfig, getSubjectImageById } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';

interface ResourceCardProps {
    resource: LearningResource;
    progress?: number;
    status?: 'not-started' | 'in-progress' | 'completed';
    onStart?: () => void;
}

export function ResourceCard({
    resource,
    progress = 0,
    status = 'not-started',
    onStart,
}: ResourceCardProps) {
    const isStarted = progress > 0;
    const isCompleted = status === 'completed';

    // Get subject config from centralized assets
    const subjectConfig = getSubjectConfig(resource.subject.id as SubjectId);
    const subjectImage = getSubjectImageById(resource.subject.id as SubjectId);

    return (
        <Card
            className={cn(
                'group overflow-hidden cursor-pointer transition-all duration-300 p-0',
                'hover:shadow-lg hover:-translate-y-1',
                'border-border/50 bg-card',
                isCompleted && 'ring-1 ring-success/30'
            )}
            onClick={onStart}
        >
            {/* Subject Image Header */}
            <div className="relative h-48 overflow-hidden bg-muted">
                <Image
                    src={subjectImage}
                    alt={resource.subject.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                {/* Overlay gradient */}

                {/* Subject badge on image */}
                <div className="absolute top-3 left-3">
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-xs font-medium backdrop-blur-sm',
                            subjectConfig.color
                        )}
                    >
                        {subjectConfig.icon} {resource.subject.name}
                    </Badge>
                </div>

                {/* Completion badge */}
                {isCompleted && (
                    <div className="absolute top-3 right-3">
                        <Badge className="bg-success text-success-foreground text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                        </Badge>
                    </div>
                )}

                {/* Grade level */}
                <div className="absolute bottom-3 left-3">
                    <Badge variant="warning">Grade {resource.gradeLevel}</Badge>
                </div>
            </div>

            <CardContent className="pb-4">
                {/* Title */}
                <h3 className="font-semibold text-base mb-1 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {resource.title}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {resource.subtitle}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{resource.sections.length} sections</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{resource.estimatedReadTime} min</span>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[10px] ml-auto px-1.5 py-0',
                            resource.difficulty === 'easy' && 'border-success/50 text-success',
                            resource.difficulty === 'medium' && 'border-warning/50 text-warning',
                            resource.difficulty === 'hard' && 'border-error/50 text-error'
                        )}
                    >
                        {resource.difficulty}
                    </Badge>
                </div>

                {/* Progress bar */}
                {isStarted && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-primary">{progress}%</span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-1.5"
                            variant={isCompleted ? 'success' : 'primary'}
                        />
                    </div>
                )}

                {/* Action button */}
                <Button
                    variant={isStarted ? 'default' : 'outline'}
                    size="sm"
                    className="w-full group/btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStart?.();
                    }}
                >
                    {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start'}
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Compact resource card for lists
 */
export function ResourceCardCompact({
    resource,
    progress = 0,
    status = 'not-started',
    onStart,
}: ResourceCardProps) {
    const isStarted = progress > 0;
    const isCompleted = status === 'completed';
    const subjectConfig = getSubjectConfig(resource.subject.id as SubjectId);
    const subjectImage = getSubjectImageById(resource.subject.id as SubjectId);

    return (
        <Card
            className="group cursor-pointer transition-all"
            onClick={onStart}
        >
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    {/* Subject image thumbnail */}
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <Image
                            src={subjectImage}
                            alt={resource.subject.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <Badge
                                variant="secondary"
                                className={cn('text-[10px] px-1.5 py-0', subjectConfig.color)}
                            >
                                {subjectConfig.icon} {resource.subject.name}
                            </Badge>
                            {isCompleted && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                            )}
                        </div>
                        <h4 className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                            {resource.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{resource.sections.length} sections</span>
                            <span>·</span>
                            <span>{resource.estimatedReadTime} min</span>
                            {isStarted && !isCompleted && (
                                <>
                                    <span>·</span>
                                    <span className="text-primary font-medium">{progress}%</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStart?.();
                        }}
                    >
                        {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start'}
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>

                {/* Progress bar */}
                {isStarted && (
                    <Progress
                        value={progress}
                        className="h-1 mt-2"
                        variant={isCompleted ? 'success' : 'primary'}
                    />
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton loader for ResourceCard
 */
export function ResourceCardSkeleton() {
    return (
        <Card className="overflow-hidden border-border/50 bg-card">
            {/* Image skeleton */}
            <Skeleton className="h-48 w-full rounded-none" />

            <CardContent className="pb-4">
                {/* Title skeleton */}
                <Skeleton className="h-5 w-3/4 mb-2" />

                {/* Subtitle skeleton */}
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-3" />

                {/* Meta row skeleton */}
                <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                </div>

                {/* Button skeleton */}
                <Skeleton className="h-9 w-full" />
            </CardContent>
        </Card>
    );
}

/**
 * Skeleton loader for ResourceCardCompact
 */
export function ResourceCardCompactSkeleton() {
    return (
        <Card className="border-border/50">
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    {/* Thumbnail skeleton */}
                    <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />

                    {/* Content skeleton */}
                    <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>

                    {/* Button skeleton */}
                    <Skeleton className="h-8 w-16 flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}
