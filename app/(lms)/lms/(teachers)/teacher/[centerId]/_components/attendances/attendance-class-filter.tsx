/**
 * Attendance Class Filter Component
 * 
 * Horizontal scrollable filter pills for selecting classes
 * Similar to SubjectFilter component style
 */

'use client';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap } from 'lucide-react';
import type { BranchClass } from '@/lib/branch-system/types/branch-classes.types';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import {
    getSubjectIcon,
    getSubjectColor
} from '@/lib/utils/subject-assets';
import { mapSubjectToId } from '@/lib/branch-system/utils/branch-classes.utils';

interface AttendanceClassFilterProps {
    classes: BranchClass[];
    selectedClassId: string | null;
    onClassChange: (classId: string) => void;
    isLoading?: boolean;
}

/**
 * Get short display name for class
 */
function getClassShortName(classItem: BranchClass): string {
    // Use class name if short, otherwise subject
    if (classItem.class_name && classItem.class_name.length <= 15) {
        return classItem.class_name;
    }
    return classItem.subject || 'Class';
}

export function AttendanceClassFilter({
    classes,
    selectedClassId,
    onClassChange,
    isLoading = false,
}: AttendanceClassFilterProps) {
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
                <span>No classes assigned</span>
            </div>
        );
    }

    return (
        <ScrollArea className="w-full whitespace-nowrap overflow-x-auto">
            <div className="flex gap-3 py-2">
                {classes.map((classItem) => {
                    const isActive = selectedClassId === classItem.id;
                    // ✅ Normalize subject name from DB to SubjectId then use centralized subject utils
                    const subjectId = (mapSubjectToId(classItem.subject || '') || 'all') as SubjectId;
                    const colorConfig = getSubjectColor(subjectId);
                    const icon = getSubjectIcon(subjectId);
                    const displayName = getClassShortName(classItem);

                    return (
                        <button
                            key={classItem.id}
                            onClick={() => onClassChange(classItem.id)}
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
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : colorConfig
                                )}
                            >
                                {icon}
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
