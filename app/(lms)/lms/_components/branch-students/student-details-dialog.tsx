/**
 * Student Quick View Dialog Component
 * 
 * Simplified modal view for quick student information
 * Shows essential data with option to view full profile
 * 
 * NOTE: This is a "quick view" dialog. For comprehensive data,
 * users can navigate to the full profile page.
 * 
 * @module branch-students/student-details-dialog
 */

'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import {
    PAYMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/branch-students.types';
import {
    formatCurrency,
    formatDate,
    formatPaymentStatus,
    formatPhoneNumber,
    calculateDaysUntilPayment,
    calculateOutstandingBalance,
    checkPaymentOverdue,
} from '@/lib/branch-system/utils/branch-students.utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    DollarSign,
    GraduationCap,
    User,
    Edit,
    Trash2,
    ExternalLink,
    Phone,
    AlertCircle,
} from 'lucide-react';
import { ScrollArea } from '@radix-ui/react-scroll-area';

/**
 * Info Row Component
 */
interface InfoRowProps {
    label: string;
    value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <div className="flex justify-between py-2 border-b border-muted last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-right">{value || '-'}</span>
        </div>
    );
}

/**
 * Get profile URL based on current route context
 */
function getProfileUrl(pathname: string, enrollmentId: string): string {
    // Check if we're in branch-manager context (has branchId in path)
    const branchManagerMatch = pathname.match(/\/manager\/branches\/([^/]+)/);
    if (branchManagerMatch) {
        const branchId = branchManagerMatch[1];
        return `/lms/manager/branches/${branchId}/students/${enrollmentId}`;
    }

    // Default to coach context
    return `/lms/coach/branch-students/${enrollmentId}`;
}

/**
 * Student Quick View Dialog Props
 */
interface StudentDetailsDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/**
 * Student Quick View Dialog Component
 * 
 * Shows essential student information with quick actions:
 * - View: Navigate to full profile page
 * - Edit: Open edit dialog
 * - Delete: Open delete confirmation
 */
export function StudentDetailsDialog({ open, onOpenChange }: StudentDetailsDialogProps = {}) {
    const router = useRouter();
    const pathname = usePathname();

    const {
        currentEnrollment,
        setCurrentEnrollment,
        isDetailsDialogOpen,
        closeDetailsDialog,
        openEditDialog,
        openDeleteDialog,
    } = useBranchStudentsStore();

    const student = currentEnrollment;
    const isOpen = typeof open === 'boolean' ? open : isDetailsDialogOpen;

    // Handle close
    const handleClose = useCallback(() => {
        closeDetailsDialog();
        setCurrentEnrollment(null);
        if (typeof onOpenChange === 'function') onOpenChange(false);
    }, [closeDetailsDialog, setCurrentEnrollment, onOpenChange]);

    // Handle edit
    const handleEdit = useCallback(() => {
        closeDetailsDialog();
        openEditDialog();
    }, [closeDetailsDialog, openEditDialog]);

    // Handle delete
    const handleDelete = useCallback(() => {
        closeDetailsDialog();
        openDeleteDialog();
    }, [closeDetailsDialog, openDeleteDialog]);

    // Handle view full profile
    const handleViewFullProfile = useCallback(() => {
        if (!student || !pathname) return;

        const profileUrl = getProfileUrl(pathname, student.id);
        closeDetailsDialog();
        router.push(profileUrl);
    }, [student, pathname, closeDetailsDialog, router]);

    if (!student) return null;

    // Compute values
    const outstandingBalance = calculateOutstandingBalance(student.total_fees_due, student.total_fees_paid);
    const isPaymentOverdue = checkPaymentOverdue(student.next_payment_due);
    const daysUntilPayment = calculateDaysUntilPayment(student.next_payment_due);

    return (
        <Dialog open={isOpen} onOpenChange={(next) => {
            if (!next) handleClose();
            else if (typeof onOpenChange === 'function') onOpenChange(true);
        }}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Quick View
                    </DialogTitle>
                    <DialogDescription>
                        Student profile summary. Click "See Full Profile" for complete details.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0 overflow-x-auto">
                    <div className="space-y-4 p-4">
                        {/* Student Header */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">
                                    {student.student_name || 'Unknown Student'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {student.student_email || 'No email'}
                                </p>
                                {student.student_phone && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {formatPhoneNumber(student.student_phone)}
                                    </p>
                                )}
                            </div>
                            <Badge variant={PAYMENT_STATUS_OPTIONS[student.payment_status]?.color as any}>
                                {formatPaymentStatus(student.payment_status)}
                            </Badge>
                        </div>

                        <Separator />

                        {/* Key Information */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <User className="h-4 w-4" />
                                Key Information
                            </h4>
                            <InfoRow
                                label="Student ID"
                                value={
                                    <span className="font-mono text-xs">
                                        {student.student_id.slice(0, 8)}...
                                    </span>
                                }
                            />
                            <InfoRow label="Registration" value={formatDate(student.registration_date)} />
                        </div>

                        <Separator />

                        {/* Financial Summary */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4" />
                                Financial Summary
                            </h4>
                            <InfoRow
                                label="Outstanding Balance"
                                value={
                                    <span className={outstandingBalance > 0 ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>
                                        {formatCurrency(outstandingBalance)}
                                    </span>
                                }
                            />
                            <InfoRow label="Fees Due" value={formatCurrency(student.total_fees_due)} />
                            <InfoRow label="Fees Paid" value={formatCurrency(student.total_fees_paid)} />

                            {/* Payment Status Alert */}
                            {isPaymentOverdue && (
                                <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm text-red-600 font-medium">Payment Overdue</span>
                                </div>
                            )}
                            {daysUntilPayment !== null && !isPaymentOverdue && daysUntilPayment <= 7 && (
                                <div className="flex items-center gap-2 mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm text-orange-600 font-medium">
                                        Payment due in {daysUntilPayment} days
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Emergency Contact Preview */}
                        {student.emergency_contact_name && (
                            <>
                                <Separator />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                        <Phone className="h-4 w-4" />
                                        Emergency Contact
                                    </h4>
                                    <InfoRow label="Name" value={student.emergency_contact_name} />
                                    {student.emergency_contact_phone && (
                                        <InfoRow label="Phone" value={formatPhoneNumber(student.emergency_contact_phone)} />
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    {/* See Full Profile - Primary Action */}
                    <Button
                        onClick={handleViewFullProfile}
                        className="w-full sm:w-auto gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        See Full Profile
                    </Button>

                    {/* Secondary Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={handleEdit}
                            className="flex-1 sm:flex-none gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="flex-1 sm:flex-none gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default StudentDetailsDialog;