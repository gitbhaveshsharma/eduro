/**
 * Subject Filter Pills Component
 * Horizontal scrollable filter pills for subjects
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Subject } from './types';

interface SubjectFilterProps {
    subjects: Subject[];
    onSubjectChange?: (subjectId: string) => void;
    defaultSubject?: string;
}

export function SubjectFilter({
    subjects,
    onSubjectChange,
    defaultSubject = 'all',
}: SubjectFilterProps) {
    const [activeSubject, setActiveSubject] = useState(defaultSubject);

    const handleSubjectClick = (subjectId: string) => {
        setActiveSubject(subjectId);
        onSubjectChange?.(subjectId);
    };

    return (
        <ScrollArea className="w-full whitespace-nowrap overflow-x-auto ">
            <div className="flex gap-3 py-2">
                {subjects.map((subject) => {
                    const isActive = activeSubject === subject.id;

                    return (
                        <button
                            key={subject.id}
                            onClick={() => handleSubjectClick(subject.id)}
                            className={cn(
                                'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium',
                                'border transition-all duration-200 whitespace-nowrap',
                                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                                'bg-white',
                                isActive
                                    ? 'border-primary text-primary shadow-sm hover:border-primary/80'
                                    : 'border-border/50 text-foreground hover:border-secondary hover:bg-secondary/5'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-lg text-sm font-semibold',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : subject.color
                                )}
                            >
                                {subject.icon}
                            </span>
                            <span className="font-medium">{subject.name}</span>
                        </button>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" className="h-2 hidden" />
        </ScrollArea>
    );
}