/**
 * Student Details Dialog Component
 * 
 * Comprehensive read-only view of student profile (branch-level)
 * Features: Financial summary, contact information
 * 
 * NOTE: After migration 019, this shows branch_students data (profile-only).
 * Class-specific enrollment data is now in class_enrollments.
 */

'use client';

import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';
import type { BranchStudent } from '@/lib/branch-system/types/branch-students.types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Calendar,
    DollarSign,
    GraduationCap,
    Phone,
    User,
    Edit,
    X,
    Trash2,
} from 'lucide-react';

/**
 * Info Row Component
 */
interface InfoRowProps {
    label: string;
    value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value || '-'}</span>
        </div>
    );
}

/**
 * Student Details Dialog Component
 */
interface StudentDetailsDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function StudentDetailsDialog({ open, onOpenChange }: StudentDetailsDialogProps = {}) {
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

    if (!student) return null;

    // Compute values
    const outstandingBalance = calculateOutstandingBalance(student.total_fees_due, student.total_fees_paid);
    const isPaymentOverdue = checkPaymentOverdue(student.next_payment_due);
    const daysUntilPayment = calculateDaysUntilPayment(student.next_payment_due);

    const handleClose = () => {
        // Close the details dialog and clear the current enrollment since
        // the user explicitly closed the details view.
        closeDetailsDialog();
        setCurrentEnrollment(null);
        if (typeof onOpenChange === 'function') onOpenChange(false);
    };

    const handleEdit = () => {
        closeDetailsDialog();
        openEditDialog();
    };

    const handleDelete = () => {
        closeDetailsDialog();
        openDeleteDialog();
    };
    console.log('Rendering StudentDetailsDialog for student:', student);

    return (
        <Dialog open={isOpen} onOpenChange={(next) => {
            if (!next) handleClose();
            else {
                if (typeof onOpenChange === 'function') onOpenChange(true);
            }
        }}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Student Profile Details
                    </DialogTitle>
                    <DialogDescription>
                        Student profile information for this branch.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 p-4 overflow-x-auto">
                    <div className="space-y-6 p-4">
                        {/* Header Info */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Student ID</p>
                                <p className="font-mono text-sm">{student.student_id}</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={PAYMENT_STATUS_OPTIONS[student.payment_status]?.color as any}>
                                    {formatPaymentStatus(student.payment_status)}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        {/* Student Information */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Student Information
                            </h3>
                            <div className="space-y-1">
                                <InfoRow label="Name" value={student.student_name} />
                                <InfoRow label="Email" value={student.student_email} />
                                <InfoRow label="Phone" value={formatPhoneNumber(student.student_phone)} />
                                <InfoRow label="Registration Date" value={formatDate(student.registration_date)} />
                            </div>
                        </div>

                        <Separator />

                        {/* Financial Summary */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financial Summary
                            </h3>
                            <div className="space-y-1">
                                <InfoRow label="Total Fees Due" value={formatCurrency(student.total_fees_due)} />
                                <InfoRow label="Total Fees Paid" value={formatCurrency(student.total_fees_paid)} />
                                <InfoRow
                                    label="Outstanding Balance"
                                    value={
                                        <span className={outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}>
                                            {formatCurrency(outstandingBalance)}
                                        </span>
                                    }
                                />
                                {student.last_payment_date && (
                                    <InfoRow label="Last Payment" value={formatDate(student.last_payment_date)} />
                                )}
                                {student.next_payment_due && (
                                    <>
                                        <InfoRow
                                            label="Next Payment Due"
                                            value={
                                                <div className="flex items-center gap-2">
                                                    <span>{formatDate(student.next_payment_due)}</span>
                                                    {isPaymentOverdue && (
                                                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                                    )}
                                                </div>
                                            }
                                        />
                                        {daysUntilPayment !== null && !isPaymentOverdue && (
                                            <InfoRow
                                                label="Days Until Due"
                                                value={`${daysUntilPayment} days`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Contact Information
                            </h3>
                            <div className="space-y-1">
                                {student.emergency_contact_name && (
                                    <>
                                        <InfoRow label="Emergency Contact" value={student.emergency_contact_name} />
                                        <InfoRow
                                            label="Emergency Phone"
                                            value={formatPhoneNumber(student.emergency_contact_phone)}
                                        />
                                    </>
                                )}
                                {student.parent_guardian_name && (
                                    <>
                                        <InfoRow label="Parent/Guardian" value={student.parent_guardian_name} />
                                        <InfoRow
                                            label="Guardian Phone"
                                            value={formatPhoneNumber(student.parent_guardian_phone)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Student Notes */}
                        {student.student_notes && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Notes
                                    </h3>
                                    <p className="text-sm">{student.student_notes}</p>
                                </div>
                            </>
                        )}

                        {/* Timestamps */}
                        <Separator />
                        <div className="space-y-1">
                            <InfoRow label="Created" value={formatDate(student.created_at)} />
                            <InfoRow label="Last Updated" value={formatDate(student.updated_at)} />
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="flex justify-between items-center">
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            <X className="mr-2 h-4 w-4" />
                            Close
                        </Button>
                        <Button onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

