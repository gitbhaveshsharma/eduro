'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentsListView } from './students-list-view';
import type { TeacherStudent } from '@/lib/branch-system/types/branch-students.types';

interface StudentsListSectionProps {
    filteredStudents: TeacherStudent[];
    totalStudents: number;
    searchQuery: string;
    classFilter: string;
    attendanceFilter: string;
    onViewDetails: (studentId: string) => void;
    onClearFilters: () => void;
}

export function StudentsListSection({
    filteredStudents,
    totalStudents,
    searchQuery,
    classFilter,
    attendanceFilter,
    onViewDetails,
    onClearFilters
}: StudentsListSectionProps) {
    const hasActiveFilters = useMemo(() => {
        return searchQuery.trim() !== '' || 
               classFilter !== 'all' || 
               attendanceFilter !== 'all';
    }, [searchQuery, classFilter, attendanceFilter]);

    return (
        <div className="space-y-4">
            {/* Results Count */}
            <div>
                <p className="text-sm text-muted-foreground">
                    {filteredStudents.length === totalStudents ? (
                        <>Showing all {totalStudents} student{totalStudents !== 1 ? 's' : ''}</>
                    ) : (
                        <>
                            Showing {filteredStudents.length} of {totalStudents} student{totalStudents !== 1 ? 's' : ''}
                        </>
                    )}
                </p>
            </div>

            {/* Students List or Empty State */}
            {filteredStudents.length > 0 ? (
                <StudentsListView 
                    students={filteredStudents}
                    onViewDetails={onViewDetails}
                />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center border-2 border-dashed rounded-lg">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {hasActiveFilters ? 'No Students Match Your Filters' : 'No Students Found'}
                    </h3>
                    <p className="text-muted-foreground max-w-sm mb-4">
                        {hasActiveFilters 
                            ? 'Try adjusting your search or filter criteria to see more results.'
                            : "You don't have any enrolled students yet. Students will appear here once they enroll in your classes."
                        }
                    </p>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                        >
                            Clear All Filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
