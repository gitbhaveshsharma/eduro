/**
 * Student Profile Page - Branch Manager Route
 * 
 * Displays comprehensive student profile for branch managers
 * Route: /lms/manager/branches/[branchId]/students/[enrollmentId]
 * 
 * @module lms/manager/branches/[branchId]/students/[enrollmentId]
 */

'use client';

import { useParams } from 'next/navigation';
import { useBranchContext } from '../../layout';
import { StudentProfilePage } from '@/app/(lms)/lms/_components/branch-students/student-profile-page';
import { EditEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/edit-enrollment-dialog';
import { DeleteEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/delete-enrollment-dialog';

export default function StudentProfileRoute() {
    const params = useParams<{ branchId: string; enrollmentId: string }>();
    const { branch } = useBranchContext();

    const enrollmentId = params?.enrollmentId ?? '';
    const branchId = branch?.id ?? params?.branchId ?? '';

    return (
        <>
            <StudentProfilePage
                enrollmentId={enrollmentId}
                backUrl={`/lms/manager/branches/${branchId}/students`}
                showBranchInfo={false}
            />

            {/* Include dialogs for edit/delete actions */}
            <EditEnrollmentDialog />
            <DeleteEnrollmentDialog />
        </>
    );
}
