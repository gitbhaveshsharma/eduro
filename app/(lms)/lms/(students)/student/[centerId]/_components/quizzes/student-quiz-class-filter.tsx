/**
 * Student Quiz Class Filter Component
 * 
 * Horizontal scrollable filter pills for selecting classes
 * Shows only classes the student is enrolled in for filtering quizzes
 */

'use client';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Layers } from 'lucide-react';
import type { UpcomingClassData } from '@/lib/branch-system/types/branch-classes.types';
import {
    getSubjectIcon,
    getSubjectColor
} from '@/lib/utils/subject-assets';
import { mapSubjectToId } from '@/lib/branch-system/utils/branch-classes.utils';

interface StudentQuizClassFilterProps {
    classes: UpcomingClassData[];
    selectedClassId: string | null;
    onClassChange: (classId: string | null) => void;
    isLoading?: boolean;
    showAllOption?: boolean;
}

/**
 * Get short display name for class
 */
function getClassShortName(classItem: UpcomingClassData): string {
    if (classItem.class_name && classItem.class_name.length <= 15) {
        return classItem.class_name;
    }
    return classItem.subject || 'Class';
}

export function StudentQuizClassFilter({
    classes,
    selectedClassId,
    onClassChange,
    isLoading = false,
    showAllOption = true,
}: StudentQuizClassFilterProps) {
    if (isLoading) {
        return (
            <div className="flex gap-3 py-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-11 w-32 rounded-full" />
                ))}
            </div>
        );
    }

    if (classes.length === 0) {
        return (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
                <GraduationCap className="h-5 w-5 mr-2" />
                <span>No classes enrolled</span>
            </div>
        );
    }

    return (
        <ScrollArea className="w-full whitespace-nowrap overflow-x-auto">
            <div className="flex gap-3 py-2">
                {/* All Classes Option */}
                {showAllOption && (
                    <button
                        onClick={() => onClassChange(null)}
                        className={cn(
                            'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium',
                            'border transition-all duration-200 whitespace-nowrap',
                            'focus:outline-none focus:ring-2 focus:ring-primary/20',
                            'bg-white dark:bg-gray-900',
                            selectedClassId === null
                                ? 'border-primary text-primary shadow-sm bg-primary/5 hover:border-primary hover:text-primary'
                                : 'border-border/50 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                        )}
                    >
                        <span
                            className={cn(
                                'flex items-center justify-center w-7 h-7 rounded-lg text-sm',
                                selectedClassId === null
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            <Layers className="h-4 w-4" />
                        </span>
                        <div className="flex flex-col items-start">
                            <span className="font-medium leading-tight">All Classes</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">
                                {classes.length} enrolled
                            </span>
                        </div>
                    </button>
                )}

                {/* Class Pills */}
                {classes.map((classItem) => {
                    const isActive = selectedClassId === classItem.class_id;
                    const subjectId = mapSubjectToId(classItem.subject || '');
                    const SubjectIconComponent = getSubjectIcon(subjectId);
                    const colorConfig = getSubjectColor(subjectId);
                    const displayName = getClassShortName(classItem);

                    return (
                        <button
                            key={classItem.class_id}
                            onClick={() => onClassChange(classItem.class_id)}
                            className={cn(
                                'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium',
                                'border transition-all duration-200 whitespace-nowrap',
                                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                                'bg-white dark:bg-gray-900',
                                isActive
                                    ? 'border-primary text-primary shadow-sm bg-primary/5 hover:border-primary hover:text-primary'
                                    : 'border-border/50 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-lg text-sm',
                                    isActive ? 'bg-primary/10 text-primary' : colorConfig
                                )}
                            >
                                <SubjectIconComponent />
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium leading-tight">{displayName}</span>
                                {classItem.grade_level && (
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                        {classItem.grade_level}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" className="h-2 hidden" />
        </ScrollArea>
    );
}
