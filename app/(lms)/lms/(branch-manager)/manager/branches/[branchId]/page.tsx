/**
 * Branch Manager - Branch ID Page
 * 
 * Redirect to dashboard when accessing /manager/branches/:branchId directly
 */

import { redirect } from 'next/navigation';

export default function BranchIdPage({
    params
}: {
    params: { branchId: string }
}) {
    redirect(`/lms/manager/branches/${params.branchId}/dashboard`);
}
