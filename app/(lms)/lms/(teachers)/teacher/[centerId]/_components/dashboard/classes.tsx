'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';

import {
    useClassesByTeacher,
    useClassesLoading,
    useClassesErrors,
    useBranchClassesStore,
} from '@/lib/branch-system/stores/branch-classes.store';
import { filterClassesBySearch } from '@/lib/branch-system/utils/branch-classes.utils';
import type { BranchClass } from '@/lib/branch-system/types/branch-classes.types';

import { ClassesHeader } from '../classes/classes-header';
import { ClassesFilters } from '../classes/classes-filters';
import { ClassesListView } from '../classes/classes-list-view';
import { TeacherClassCard } from '../classes/teacher-class-card';

type ViewMode = 'grid' | 'list';

interface TeacherClassesDashboardProps {
    centerId: string;
}

export function TeacherClassesDashboard({ centerId }: TeacherClassesDashboardProps) {
    const router = useRouter();
    const { userId } = useAuth();

    // Store hooks
    const { fetchClassesByTeacher } = useBranchClassesStore();
    const classes = useClassesByTeacher(userId || null);
    const { fetchClasses } = useClassesLoading();
    const { fetchClasses: fetchError } = useClassesErrors();

    // Local state
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');

    // Fetch classes on mount
    useEffect(() => {
        if (userId) {
            fetchClassesByTeacher(userId);
        }
    }, [userId, fetchClassesByTeacher]);

    // Get unique subjects for filter
    const uniqueSubjects = useMemo(() => {
        const subjects = new Set(classes.map(c => c.subject));
        return Array.from(subjects).sort();
    }, [classes]);

    // Filter classes based on search and filters
    const filteredClasses = useMemo(() => {
        let filtered = classes;

        if (searchQuery.trim()) {
            filtered = filterClassesBySearch(filtered as any, searchQuery) as BranchClass[];
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        if (subjectFilter !== 'all') {
            filtered = filtered.filter(c => c.subject === subjectFilter);
        }

        return filtered;
    }, [classes, searchQuery, statusFilter, subjectFilter]);

    // Handle view class details
    const handleViewDetails = (classId: string) => {
        router.push(`/lms/teacher/${centerId}/classes/${classId}`);
    };

    // Loading state
    if (fetchClasses) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (fetchError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
        );
    }

    // Empty state
    if (classes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center ">
                <div className="rounded-full bg-muted p-6">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">No Classes Assigned</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        You don&apos;t have any classes assigned yet. Please contact your
                        coaching center administrator to get assigned to classes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <ClassesHeader
                totalClasses={filteredClasses.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Filters */}
            <ClassesFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                subjectFilter={subjectFilter}
                onSubjectChange={setSubjectFilter}
                availableSubjects={uniqueSubjects}
            />

            {/* No Results */}
            {filteredClasses.length === 0 && classes.length > 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No classes match your search criteria. Try adjusting your filters.
                    </AlertDescription>
                </Alert>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && filteredClasses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((classItem) => (
                        <TeacherClassCard
                            key={classItem.id}
                            classData={classItem}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && filteredClasses.length > 0 && (
                <ClassesListView
                    classes={filteredClasses}
                    onViewDetails={handleViewDetails}
                />
            )}
        </div>
    );
}
