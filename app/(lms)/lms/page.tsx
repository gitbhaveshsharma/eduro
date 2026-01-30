'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building2, AlertCircle, GraduationCap } from 'lucide-react';
import { CoachingAPI } from '@/lib/coaching';
import type { CoachingCenter, CoachingBranch, StudentEnrollment, TeacherAssignment } from '@/lib/schema/coaching.types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
    LMSHeader,
    LMSDataSkeleton,
    CoachingCenterCard,
    AssignedBranchCard
} from './_components';
import { StudentEnrollmentCard } from './_components/student-enrollment-card';
import { TeacherAssignmentCard } from './_components/teacher-assignment-card';

interface BranchWithRole extends CoachingBranch {
    coaching_center?: {
        id: string;
        name: string;
        owner_id: string;
        manager_id: string | null;
    };
    role: 'owner' | 'center_manager' | 'branch_manager';
}

interface CoachingCenterWithBranches extends CoachingCenter {
    branches: CoachingBranch[];
    role: 'owner' | 'center_manager';
}

export default function LMSEntryPage() {
    const router = useRouter();
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ownedCenters, setOwnedCenters] = useState<CoachingCenterWithBranches[]>([]);
    const [assignedBranches, setAssignedBranches] = useState<BranchWithRole[]>([]);
    const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
    const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);

    const fetchData = useCallback(async () => {
        setIsDataLoading(true);
        setError(null);

        try {
            // Fetch branches data (for coaches and branch managers)
            const branchesResult = await CoachingAPI.getAllAccessibleBranches();

            // Fetch student enrollments
            const studentEnrollmentsResult = await CoachingAPI.getStudentEnrollments();

            // Fetch teacher assignments
            const teacherAssignmentsResult = await CoachingAPI.getTeacherAssignments();

            const centersMap = new Map<string, CoachingCenterWithBranches>();
            const assignedBranchList: BranchWithRole[] = [];
            const enrollmentsList: StudentEnrollment[] = [];
            const assignmentsList: TeacherAssignment[] = [];

            // Process branches data
            if (branchesResult.success && branchesResult.data) {
                const { branches } = branchesResult.data;

                for (const branch of branches) {
                    if (branch.role === 'owner' || branch.role === 'center_manager') {
                        const centerId = branch.coaching_center?.id;
                        if (centerId) {
                            if (!centersMap.has(centerId)) {
                                const centerResult = await CoachingAPI.getCenter(centerId);
                                if (centerResult.success && centerResult.data) {
                                    centersMap.set(centerId, {
                                        ...centerResult.data,
                                        branches: [],
                                        role: branch.role,
                                    });
                                }
                            }
                            const center = centersMap.get(centerId);
                            if (center) {
                                center.branches.push(branch);
                            }
                        }
                    } else if (branch.role === 'branch_manager') {
                        assignedBranchList.push(branch);
                    }
                }
            }

            // Process student enrollments
            if (studentEnrollmentsResult.success && studentEnrollmentsResult.data) {
                enrollmentsList.push(...studentEnrollmentsResult.data);
            }

            // Process teacher assignments
            if (teacherAssignmentsResult.success && teacherAssignmentsResult.data) {
                assignmentsList.push(...teacherAssignmentsResult.data);
            }

            const ownedCentersList = Array.from(centersMap.values());
            setOwnedCenters(ownedCentersList);
            setAssignedBranches(assignedBranchList);
            setStudentEnrollments(enrollmentsList);
            setTeacherAssignments(assignmentsList);

            const totalOwnedCenters = ownedCentersList.length;
            const totalAssignedBranches = assignedBranchList.length;
            const totalEnrollments = enrollmentsList.length;
            const totalAssignments = assignmentsList.length;
            const totalCards = totalOwnedCenters + totalAssignedBranches + totalEnrollments + totalAssignments;

            // Auto-redirect logic based on user's role
            if (totalCards === 1) {
                if (totalOwnedCenters === 1) {
                    router.push('/lms/coach');
                } else if (totalAssignedBranches === 1) {
                    router.push(`/lms/manager/branches/${assignedBranchList[0].id}/dashboard`);
                } else if (totalEnrollments === 1) {
                    router.push(`/lms/student/${enrollmentsList[0].coaching_center_id}`);
                } else if (totalAssignments === 1) {
                    router.push(`/lms/teacher/${assignmentsList[0].coaching_center_id}`);
                }
            }
        } catch (err) {
            console.error('[LMSEntry] Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsDataLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const initializePage = async () => {
            await fetchData();
            setIsPageLoading(false);
        };

        initializePage();
    }, [fetchData]);

    const handleSelectCoachingCenter = useCallback((center: CoachingCenterWithBranches) => {
        router.push('/lms/coach');
    }, [router]);

    const handleSelectAssignedBranch = useCallback((branch: BranchWithRole) => {
        router.push(`/lms/manager/branches/${branch.id}/dashboard`);
    }, [router]);

    const handleSelectStudentEnrollment = useCallback((enrollment: StudentEnrollment) => {
        router.push(`/lms/student/${enrollment.coaching_center_id}`);
    }, [router]);

    const handleSelectTeacherAssignment = useCallback((assignment: TeacherAssignment) => {
        router.push(`/lms/teacher/${assignment.coaching_center_id}`);
    }, [router]);

    const handleNotificationClick = useCallback(() => {
        router.push('/notifications');
    }, [router]);

    const handleCreateCenter = useCallback(() => {
        router.push('/coaching/create');
    }, [router]);

    const handleGoToDashboard = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    const hasNoAccess = useMemo(
        () => ownedCenters.length === 0 && assignedBranches.length === 0 && studentEnrollments.length === 0 && teacherAssignments.length === 0,
        [ownedCenters.length, assignedBranches.length, studentEnrollments.length, teacherAssignments.length]
    );

    // Determine if user is only a student (no coaching/management roles)
    const isStudentOnly = useMemo(
        () => ownedCenters.length === 0 && assignedBranches.length === 0 && teacherAssignments.length === 0 && studentEnrollments.length > 0,
        [ownedCenters.length, assignedBranches.length, teacherAssignments.length, studentEnrollments.length]
    );

    // Determine if user is only a teacher (no coaching/management roles)
    const isTeacherOnly = useMemo(
        () => ownedCenters.length === 0 && assignedBranches.length === 0 && studentEnrollments.length === 0 && teacherAssignments.length > 0,
        [ownedCenters.length, assignedBranches.length, studentEnrollments.length, teacherAssignments.length]
    );

    const allCards = useMemo(() => {
        const cards: Array<{
            type: 'center' | 'branch' | 'student' | 'teacher';
            data: CoachingCenterWithBranches | BranchWithRole | StudentEnrollment | TeacherAssignment
        }> = [];

        ownedCenters.forEach(center => {
            cards.push({ type: 'center', data: center });
        });

        assignedBranches.forEach(branch => {
            cards.push({ type: 'branch', data: branch });
        });

        studentEnrollments.forEach(enrollment => {
            cards.push({ type: 'student', data: enrollment });
        });

        teacherAssignments.forEach(assignment => {
            cards.push({ type: 'teacher', data: assignment });
        });

        return cards;
    }, [ownedCenters, assignedBranches, studentEnrollments, teacherAssignments]);

    // Dynamic title and description based on user role
    const pageTitle = useMemo(() => {
        if (isStudentOnly) {
            return 'My Learning';
        } else if (isTeacherOnly) {
            return 'My Teaching';
        }
        return 'Learning Management System';
    }, [isStudentOnly, isTeacherOnly]);

    const pageDescription = useMemo(() => {
        if (isStudentOnly) {
            return 'Select a coaching center to access your classes and learning materials';
        } else if (isTeacherOnly) {
            return 'Select a coaching center to teach';
        }
        return 'Select a coaching center or branch to manage';
    }, [isStudentOnly, isTeacherOnly]);

    if (isPageLoading) {
        return (
            <LoadingSpinner
                title="Loading LMS"
                message="Setting up your learning management system..."
                size="lg"
                variant="primary"
                fullscreen
            />
        );
    }

    if (isDataLoading) {
        return (
            <>
                <LMSHeader />
                <LMSDataSkeleton />
            </>
        );
    }

    if (error) {
        return (
            <>
                <LMSHeader />
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                    <div className="max-w-6xl mx-auto p-6">
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <Button onClick={fetchData} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    if (hasNoAccess) {
        return (
            <>
                <LMSHeader />
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 min-h-screen">
                    <div className="max-w-6xl mx-auto p-6">
                        <div className="text-center py-16">
                            <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <GraduationCap className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold mb-3">Welcome to LMS</h2>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                You don&apos;t have any coaching centers, branch assignments, enrollments, or teaching assignments yet.
                                Create a coaching center, enroll as a student, or get assigned as a teacher to access the LMS.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={handleCreateCenter}>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Create Coaching Center
                                </Button>
                                <Button variant="outline" onClick={handleGoToDashboard}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <LMSHeader
                notificationCount={0}
                onNotificationClick={handleNotificationClick}
            />
            <div>
                <div className="max-w-6xl mx-auto space-y-8 p-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">{pageTitle}</h1>
                        <p className="text-muted-foreground">
                            {pageDescription}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {allCards.map((card) => {
                            if (card.type === 'center') {
                                return (
                                    <CoachingCenterCard
                                        key={`center-${(card.data as CoachingCenterWithBranches).id}`}
                                        center={card.data as CoachingCenterWithBranches}
                                        onSelect={handleSelectCoachingCenter}
                                    />
                                );
                            } else if (card.type === 'branch') {
                                return (
                                    <AssignedBranchCard
                                        key={`branch-${(card.data as BranchWithRole).id}`}
                                        branch={card.data as BranchWithRole}
                                        onSelect={handleSelectAssignedBranch}
                                    />
                                );
                            } else if (card.type === 'student') {
                                return (
                                    <StudentEnrollmentCard
                                        key={`student-${(card.data as StudentEnrollment).enrollment_id}`}
                                        enrollment={card.data as StudentEnrollment}
                                        onSelect={handleSelectStudentEnrollment}
                                    />
                                );
                            } else if (card.type === 'teacher') {
                                return (
                                    <TeacherAssignmentCard
                                        key={`teacher-${(card.data as TeacherAssignment).assignment_id}`}
                                        assignment={card.data as TeacherAssignment}
                                        onSelect={handleSelectTeacherAssignment}
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
