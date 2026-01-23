/**
 * Student Classes Dashboard Component
 * 
 * Main dashboard for students to view their enrolled classes
 * Features:
 * - Grid/List view modes
 * - Search and filter functionality
 * - Uses upcoming classes from store
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';

import {
    useBranchClassesStore,
    useEnrollmentsByCenter,
    useClassesLoading,
    useClassesErrors,
} from '@/lib/branch-system/stores/branch-classes.store';
import type { UpcomingClassData } from '@/lib/branch-system/types/branch-classes.types';

import { StudentClassesHeader } from '../classes/student-classes-header';
import { StudentClassesFilters } from '../classes/student-classes-filters';
import { StudentClassesListView } from '../classes/student-classes-list-view';
import { StudentClassCard } from '../classes/student-class-card';

type ViewMode = 'grid' | 'list';

interface StudentClassesDashboardProps {
    centerId: string;
}

/**
 * Filter classes by search query
 */
function filterClassesBySearch(
    classes: UpcomingClassData[],
    query: string
): UpcomingClassData[] {
    if (!query.trim()) return classes;

    const lowerQuery = query.toLowerCase().trim();
    return classes.filter((cls) =>
        cls.class_name?.toLowerCase().includes(lowerQuery) ||
        cls.subject?.toLowerCase().includes(lowerQuery) ||
        cls.description?.toLowerCase().includes(lowerQuery) ||
        cls.grade_level?.toLowerCase().includes(lowerQuery) ||
        cls.batch_name?.toLowerCase().includes(lowerQuery)
    );
}

export function StudentClassesDashboard({ centerId }: StudentClassesDashboardProps) {
    const router = useRouter();
    const { userId } = useAuth();

    // Store hooks
    const { fetchEnrollmentsByCenter } = useBranchClassesStore();
    const classes = useEnrollmentsByCenter(userId || null, centerId || null);
    const { upcomingClasses: isLoading } = useClassesLoading();
    const { upcomingClasses: fetchError } = useClassesErrors();

    // Local state
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');

    // Fetch classes on mount
    useEffect(() => {
        if (userId && centerId) {
            fetchEnrollmentsByCenter(userId, centerId);
        }
    }, [userId, centerId, fetchEnrollmentsByCenter]);

    // Get unique subjects for filter
    const uniqueSubjects = useMemo(() => {
        if (!classes) return [];
        const subjects = new Set(classes.map(c => c.subject));
        return Array.from(subjects).sort();
    }, [classes]);

    // Filter classes based on search and filters
    const filteredClasses = useMemo(() => {
        if (!classes) return [];

        let filtered = classes;

        if (searchQuery.trim()) {
            filtered = filterClassesBySearch(filtered, searchQuery);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.enrollment_status === statusFilter);
        }

        if (subjectFilter !== 'all') {
            filtered = filtered.filter(c => c.subject === subjectFilter);
        }

        return filtered;
    }, [classes, searchQuery, statusFilter, subjectFilter]);

    // Handle view class details
    const handleViewDetails = (classId: string) => {
        router.push(`/lms/student/${centerId}/classes/${classId}`);
    };

    // Loading state
    if (isLoading) {
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
                <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
        );
    }

    // Empty state
    if (!classes || classes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-6">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2 mt-4">
                    <h3 className="text-lg font-semibold">No Classes Enrolled</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        You haven&apos;t enrolled in any classes yet. Please contact your
                        coaching center to enroll in classes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <StudentClassesHeader
                totalClasses={filteredClasses.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Filters */}
            <StudentClassesFilters
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
                    <AlertDescription>
                        No classes match your search criteria. Try adjusting your filters.
                    </AlertDescription>
                </Alert>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && filteredClasses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((classItem) => (
                        <StudentClassCard
                            key={classItem.enrollment_id}
                            classData={classItem}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && filteredClasses.length > 0 && (
                <StudentClassesListView
                    classes={filteredClasses}
                    onViewDetails={handleViewDetails}
                />
            )}
        </div>
    );
}
