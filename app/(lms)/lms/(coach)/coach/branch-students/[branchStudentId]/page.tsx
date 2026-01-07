/**
 * Student Profile Page - Coach Route
 * 
 * Displays comprehensive student profile for coaches
 * Route: /lms/coach/branch-students/[branchStudentId]
 * 
 * @module lms/coach/branch-students/[branchStudentId]
 */

'use client';

import { useParams } from 'next/navigation';
import { StudentProfilePage } from '@/app/(lms)/lms/_components/branch-students/student-profile-page';
import { EditEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/edit-enrollment-dialog';
import { DeleteEnrollmentDialog } from '@/app/(lms)/lms/_components/branch-students/delete-enrollment-dialog';

export default function StudentProfileRoute() {
    const params = useParams<{ branchStudentId: string }>();
    const branchStudentId = params?.branchStudentId ?? '';

    return (
        <>
            <StudentProfilePage
                branchStudentId={branchStudentId}
                backUrl="/lms/coach/branch-students"
                showBranchInfo={true}
            />

            {/* Include dialogs for edit/delete actions */}
            <EditEnrollmentDialog />
            <DeleteEnrollmentDialog />
        </>
    );
}
