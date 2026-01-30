'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth-guard';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import { StudentsFilters } from '../_components/students/students-filters';
import { StudentsPageHeader } from '../_components/students/students-page-header';
import { StudentsPageSkeleton } from '../_components/students/students-page-skeleton';
import { StudentsListSection } from '../_components/students/students-list-section';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ButtonLoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { useTeacherContext } from '../layout';

export default function TeacherStudentsPage() {
    const { userId: teacherId } = useAuth();
    const router = useRouter();
    const { centerId } = useTeacherContext();
    const fetchTeacherStudents = useBranchStudentsStore(state => state.fetchTeacherStudents);
    const currentTeacherStudents = useBranchStudentsStore(state => state.currentTeacherStudents);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [attendanceFilter, setAttendanceFilter] = useState('all');
    const [showNeedingAttention, setShowNeedingAttention] = useState(false);

    // Loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // Load students on mount
    useEffect(() => {
        const loadStudents = async () => {
            if (!teacherId) {
                console.log('[TeacherStudentsPage] No teacher ID available');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                console.log('[TeacherStudentsPage] Loading students for teacher:', teacherId);
                await fetchTeacherStudents(teacherId);
                console.log('[TeacherStudentsPage] Loaded students:', currentTeacherStudents.length);
            } catch (err) {
                console.error('[TeacherStudentsPage] Error loading students:', err);
                setError(err instanceof Error ? err.message : 'Failed to load students');
            } finally {
                setIsLoading(false);
            }
        };

        loadStudents();
    }, [teacherId, fetchTeacherStudents]);

    // Filter students based on search and filters
    const filteredStudents = useMemo(() => {
        let filtered = [...currentTeacherStudents];

        // Show only students needing attention
        if (showNeedingAttention) {
            filtered = filtered.filter(student => {
                const attendance = student.attendance_percentage || 0;
                return attendance < 60;
            });
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(student =>
                student.student_name?.toLowerCase().includes(query) ||
                student.class_name?.toLowerCase().includes(query)
            );
        }

        // Class filter
        if (classFilter !== 'all') {
            filtered = filtered.filter(student => student.class_id === classFilter);
        }

        // Attendance filter
        if (attendanceFilter !== 'all') {
            filtered = filtered.filter(student => {
                const attendance = student.attendance_percentage || 0;

                switch (attendanceFilter) {
                    case 'excellent':
                        return attendance >= 90;
                    case 'good':
                        return attendance >= 75 && attendance < 90;
                    case 'average':
                        return attendance >= 60 && attendance < 75;
                    case 'poor':
                        return attendance < 60;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [currentTeacherStudents, searchQuery, classFilter, attendanceFilter, showNeedingAttention]);

    // Extract available classes for filter dropdown
    const availableClasses = useMemo(() => {
        const classMap = new Map<string, string>();

        currentTeacherStudents.forEach(student => {
            if (student.class_id && student.class_name) {
                classMap.set(student.class_id, student.class_name);
            }
        });

        return Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
    }, [currentTeacherStudents]);

    // Students needing attention count
    const studentsNeedingAttention = useMemo(() => {
        return currentTeacherStudents.filter(student => {
            const attendance = student.attendance_percentage || 0;
            return attendance < 60;
        }).length;
    }, [currentTeacherStudents]);

    // Handle view student details
    const handleViewDetails = useCallback((studentId: string) => {
        console.log('[TeacherStudentsPage] View details for student:', studentId);

        const student = currentTeacherStudents.find(s => s.student_id === studentId);
        if (student?.enrollment_id) {
            router.push(`/lms/teacher/${centerId}/students/${student.enrollment_id}`);
        } else {
            console.error('[TeacherStudentsPage] Enrollment ID not found for student:', studentId);
        }
    }, [currentTeacherStudents, router, centerId]);

    // Handle clear all filters
    const handleClearFilters = useCallback(() => {
        setSearchQuery('');
        setClassFilter('all');
        setAttendanceFilter('all');
        setShowNeedingAttention(false);
    }, []);

    // Handle retry with loading state
    const handleRetry = async () => {
        if (!teacherId) return;

        setIsRetrying(true);
        setError(null);

        try {
            await fetchTeacherStudents(teacherId);
        } catch (err) {
            console.error('[TeacherStudentsPage] Retry failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to load students');
        } finally {
            setIsRetrying(false);
        }
    };

    // Loading state with skeleton
    if (isLoading) {
        return <StudentsPageSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertTitle>Error Loading Students</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            disabled={isRetrying}
                        >
                            {isRetrying ? (
                                <ButtonLoadingSpinner message="Retrying" size="sm" />
                            ) : (
                                'Retry'
                            )}
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // No teacher ID
    if (!teacherId) {
        return (
            <div className="container max-w-7xl mx-auto px-4 py-8">
                <Alert>
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                        Please log in to view your students.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 ">
            {/* Page Header with Alert */}
            <StudentsPageHeader
                totalStudents={currentTeacherStudents.length}
                studentsNeedingAttention={studentsNeedingAttention}
                showNeedingAttention={showNeedingAttention}
                onToggleNeedingAttention={() => setShowNeedingAttention(!showNeedingAttention)}
            />

            {/* Filters */}
            <div className="my-6">
                <StudentsFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    classFilter={classFilter}
                    onClassChange={setClassFilter}
                    attendanceFilter={attendanceFilter}
                    onAttendanceChange={setAttendanceFilter}
                    availableClasses={availableClasses}
                />
            </div>

            {/* Students List with Results Count */}
            <StudentsListSection
                filteredStudents={filteredStudents}
                totalStudents={currentTeacherStudents.length}
                searchQuery={searchQuery}
                classFilter={classFilter}
                attendanceFilter={attendanceFilter}
                onViewDetails={handleViewDetails}
                onClearFilters={handleClearFilters}
            />
        </div>
    );
}
