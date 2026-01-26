/**
 * Assignment Detail Page
 * 
 * Individual assignment detail page for students
 * Route: /lms/student/[centerId]/assignments/[assignmentId]
 * 
 * Features:
 * - View full assignment details
 * - Download attached files
 * - Submit assignment (text or file)
 * - View submission status and grade
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStudentContext } from '../../layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-guard';

// Assignment store and types
import {
    useAssignmentStore,
    useCurrentAssignment,
    useCurrentSubmission,
    useAssignmentLoading,
    useAssignmentError,
} from '@/lib/branch-system/stores/assignment.store';

// Components
import {
    AssignmentDetailHeader,
    AssignmentDetailContent,
    AssignmentSubmissionForm,
} from '../../_components/assignments';

export default function AssignmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const centerId = params?.centerId as string;
    const assignmentId = params?.assignmentId as string;

    const { coachingCenter, isLoading: contextLoading, error: contextError } = useStudentContext();
    const { userId } = useAuth();

    // Store state
    const currentAssignment = useCurrentAssignment();
    const currentSubmission = useCurrentSubmission();
    const loading = useAssignmentLoading();
    const error = useAssignmentError();

    const {
        fetchAssignmentById,
        fetchStudentSubmission,
        clearError,
    } = useAssignmentStore();

    // Local state
    const [classId, setClassId] = useState<string | null>(null);

    // Fetch assignment and submission
    const fetchData = useCallback(async () => {
        if (!assignmentId || !userId) return;

        await fetchAssignmentById(assignmentId, true);
    }, [assignmentId, userId, fetchAssignmentById]);

    // Fetch student submission after assignment is loaded
    useEffect(() => {
        if (currentAssignment?.id && userId && currentAssignment.class_id) {
            setClassId(currentAssignment.class_id);
            fetchStudentSubmission(currentAssignment.id, userId);
        }
    }, [currentAssignment?.id, currentAssignment?.class_id, userId, fetchStudentSubmission]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle back navigation
    const handleBack = () => {
        router.push(`/lms/student/${centerId}/assignments`);
    };

    // Handle submission complete
    const handleSubmissionComplete = async () => {
        if (currentAssignment?.id && userId) {
            await fetchStudentSubmission(currentAssignment.id, userId);
        }
    };

    // Loading state
    if (contextLoading || !userId || loading.list) {
        return (
            <div className="space-y-6">
                {/* Back button skeleton */}
                <Skeleton className="h-9 w-40" />

                {/* Header skeleton */}
                <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                {/* Info cards skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>

                {/* Content skeleton */}
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    // Error state
    if (contextError || !coachingCenter) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {contextError || 'Coaching center not found'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Assignment error
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Assignment not found
    if (!currentAssignment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Assignment Not Found</h2>
                <p className="text-muted-foreground mt-2">
                    The assignment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <AssignmentDetailHeader
                assignment={currentAssignment}
                submission={currentSubmission}
                onBack={handleBack}
            />

            {/* Assignment Content */}
            <AssignmentDetailContent
                assignment={currentAssignment}
                submission={currentSubmission}
            />

            {/* Submission Form */}
            {classId && (
                <AssignmentSubmissionForm
                    assignment={currentAssignment}
                    submission={currentSubmission}
                    studentId={userId}
                    classId={classId}
                    onSubmissionComplete={handleSubmissionComplete}
                />
            )}
        </div>
    );
}
