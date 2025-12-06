/**
 * Branch Students Utility Functions
 * 
 * Helper functions for branch student operations
 * Data transformations, calculations, and formatting
 * 
 * @module branch-system/utils/branch-students
 */

import type {
    BranchStudent,
    BranchStudentWithRelations,
    PublicBranchStudent,
    StudentEnrollmentSummary,
    StudentFinancialSummary,
    StudentAcademicSummary,
    BranchStudentStats,
    ClassStudentStats,
    EnrollmentStatus,
    PaymentStatus,
} from '../types/branch-students.types';
import {
    ATTENDANCE_THRESHOLDS,
    PAYMENT_WARNING_DAYS,
} from '../types/branch-students.types';

// ============================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================

/**
 * Converts BranchStudent to PublicBranchStudent
 * Removes sensitive internal fields and adds computed properties
 * 
 * @param student - Full branch student record
 * @returns Public-facing student data
 */
export function toPublicBranchStudent(student: BranchStudent | BranchStudentWithRelations): PublicBranchStudent {
    const outstandingBalance = calculateOutstandingBalance(
        student.total_fees_due,
        student.total_fees_paid
    );

    const isPaymentOverdue = checkPaymentOverdue(student.next_payment_due);

    const enrollmentDurationDays = calculateEnrollmentDuration(
        student.enrollment_date,
        student.actual_completion_date
    );

    // Get student name from relations if available
    const studentWithRelations = student as BranchStudentWithRelations;
    const studentName = studentWithRelations.student?.full_name || 'Unknown Student';

    return {
        id: student.id,
        student_id: student.student_id,
        student_name: studentName,
        branch_id: student.branch_id,
        class_id: student.class_id,
        enrollment_date: student.enrollment_date,
        expected_completion_date: student.expected_completion_date,
        enrollment_status: student.enrollment_status,
        payment_status: student.payment_status,
        attendance_percentage: student.attendance_percentage,
        current_grade: student.current_grade,
        next_payment_due: student.next_payment_due,
        preferred_batch: student.preferred_batch,
        special_requirements: student.special_requirements,
        student_notes: student.student_notes,
        created_at: student.created_at,
        updated_at: student.updated_at,
        // Computed fields
        outstanding_balance: outstandingBalance,
        is_payment_overdue: isPaymentOverdue,
        enrollment_duration_days: enrollmentDurationDays,
    };
}

/**
 * Converts array of BranchStudents to PublicBranchStudents
 */
export function toPublicBranchStudents(students: BranchStudent[]): PublicBranchStudent[] {
    return students.map(toPublicBranchStudent);
}

// ============================================================
// FINANCIAL CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculates outstanding balance
 * 
 * @param totalDue - Total fees due
 * @param totalPaid - Total fees paid
 * @returns Outstanding balance amount
 */
export function calculateOutstandingBalance(
    totalDue: number,
    totalPaid: number
): number {
    const balance = totalDue - totalPaid;
    return Math.max(0, Number(balance.toFixed(2)));
}

/**
 * Checks if payment is overdue
 * 
 * @param nextPaymentDue - Next payment due date (ISO string)
 * @returns True if payment is overdue
 */
export function checkPaymentOverdue(nextPaymentDue: string | null): boolean {
    if (!nextPaymentDue) return false;

    const dueDate = new Date(nextPaymentDue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
}

/**
 * Calculates days until payment is due
 * 
 * @param nextPaymentDue - Next payment due date (ISO string)
 * @returns Number of days (negative if overdue, null if no due date)
 */
export function calculateDaysUntilPayment(nextPaymentDue: string | null): number | null {
    if (!nextPaymentDue) return null;

    const dueDate = new Date(nextPaymentDue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Gets payment urgency level
 * 
 * @param nextPaymentDue - Next payment due date (ISO string)
 * @returns Urgency level: 'overdue', 'urgent', 'warning', 'reminder', 'ok', or null
 */
export function getPaymentUrgency(
    nextPaymentDue: string | null
): 'overdue' | 'urgent' | 'warning' | 'reminder' | 'ok' | null {
    const days = calculateDaysUntilPayment(nextPaymentDue);

    if (days === null) return null;
    if (days < 0) return 'overdue';
    if (days <= PAYMENT_WARNING_DAYS.URGENT) return 'urgent';
    if (days <= PAYMENT_WARNING_DAYS.WARNING) return 'warning';
    if (days <= PAYMENT_WARNING_DAYS.REMINDER) return 'reminder';
    return 'ok';
}

/**
 * Calculates payment compliance rate for a group of students
 * 
 * @param students - Array of branch students
 * @returns Compliance rate as percentage (0-100)
 */
export function calculatePaymentComplianceRate(students: BranchStudent[]): number {
    if (students.length === 0) return 0;

    const compliantStudents = students.filter(
        (s) => s.payment_status === 'PAID' || s.payment_status === 'PARTIAL'
    ).length;

    return Number(((compliantStudents / students.length) * 100).toFixed(2));
}

// ============================================================
// ACADEMIC CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculates enrollment duration in days
 * 
 * @param enrollmentDate - Enrollment start date (ISO string)
 * @param completionDate - Completion date (ISO string) or null for ongoing
 * @returns Duration in days
 */
export function calculateEnrollmentDuration(
    enrollmentDate: string,
    completionDate: string | null
): number {
    const startDate = new Date(enrollmentDate);
    const endDate = completionDate ? new Date(completionDate) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

/**
 * Gets attendance status category
 * 
 * @param attendancePercentage - Attendance percentage (0-100)
 * @returns Status: 'excellent', 'good', 'needs_improvement', or 'poor'
 */
export function getAttendanceStatus(
    attendancePercentage: number
): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
    if (attendancePercentage >= ATTENDANCE_THRESHOLDS.EXCELLENT) return 'excellent';
    if (attendancePercentage >= ATTENDANCE_THRESHOLDS.GOOD) return 'good';
    if (attendancePercentage >= ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT) return 'needs_improvement';
    return 'poor';
}

/**
 * Checks if student needs attention (poor attendance or overdue payment)
 * 
 * @param student - Branch student record
 * @returns True if student needs attention
 */
export function studentNeedsAttention(student: BranchStudent): boolean {
    const poorAttendance = student.attendance_percentage < ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT;
    const overduePayment = checkPaymentOverdue(student.next_payment_due);
    const suspendedOrDropped = student.enrollment_status === 'SUSPENDED' || student.enrollment_status === 'DROPPED';

    return poorAttendance || overduePayment || suspendedOrDropped;
}

/**
 * Checks if student is on track (good attendance, no overdue payments, enrolled status)
 * 
 * @param student - Branch student record
 * @returns True if student is on track
 */
export function isStudentOnTrack(student: BranchStudent): boolean {
    const goodAttendance = student.attendance_percentage >= ATTENDANCE_THRESHOLDS.GOOD;
    const noOverduePayment = !checkPaymentOverdue(student.next_payment_due);
    const activeEnrollment = student.enrollment_status === 'ENROLLED';

    return goodAttendance && noOverduePayment && activeEnrollment;
}

// ============================================================
// STATISTICS CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculates student enrollment summary
 * 
 * @param enrollments - Array of student's enrollments
 * @returns Enrollment summary statistics
 */
export function calculateStudentEnrollmentSummary(
    enrollments: BranchStudent[]
): StudentEnrollmentSummary {
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.enrollment_status === 'ENROLLED').length;
    const completedEnrollments = enrollments.filter((e) => e.enrollment_status === 'COMPLETED').length;

    const totalFeesDue = enrollments.reduce((sum, e) => sum + e.total_fees_due, 0);
    const totalFeesPaid = enrollments.reduce((sum, e) => sum + e.total_fees_paid, 0);
    const outstandingBalance = calculateOutstandingBalance(totalFeesDue, totalFeesPaid);

    const averageAttendance = totalEnrollments > 0
        ? enrollments.reduce((sum, e) => sum + e.attendance_percentage, 0) / totalEnrollments
        : 0;

    return {
        total_enrollments: totalEnrollments,
        active_enrollments: activeEnrollments,
        completed_enrollments: completedEnrollments,
        total_fees_due: Number(totalFeesDue.toFixed(2)),
        total_fees_paid: Number(totalFeesPaid.toFixed(2)),
        outstanding_balance: outstandingBalance,
        average_attendance: Number(averageAttendance.toFixed(2)),
    };
}

/**
 * Calculates branch student statistics
 * 
 * @param students - Array of branch students
 * @returns Branch-wide student statistics
 */
export function calculateBranchStudentStats(students: BranchStudent[]): BranchStudentStats {
    const totalStudents = students.length;

    // Count by enrollment status
    const enrolledStudents = students.filter((s) => s.enrollment_status === 'ENROLLED').length;
    const pendingStudents = students.filter((s) => s.enrollment_status === 'PENDING').length;
    const suspendedStudents = students.filter((s) => s.enrollment_status === 'SUSPENDED').length;
    const droppedStudents = students.filter((s) => s.enrollment_status === 'DROPPED').length;
    const completedStudents = students.filter((s) => s.enrollment_status === 'COMPLETED').length;

    // Payment statistics
    const studentsWithOverduePayments = students.filter((s) => checkPaymentOverdue(s.next_payment_due)).length;
    const totalFeesCollected = students.reduce((sum, s) => sum + s.total_fees_paid, 0);
    const totalOutstandingFees = students.reduce(
        (sum, s) => sum + calculateOutstandingBalance(s.total_fees_due, s.total_fees_paid),
        0
    );

    // Attendance
    const averageAttendance = totalStudents > 0
        ? students.reduce((sum, s) => sum + s.attendance_percentage, 0) / totalStudents
        : 0;

    // Group by class
    const studentsByClass: Record<string, number> = {};
    students.forEach((s) => {
        if (s.class_id) {
            studentsByClass[s.class_id] = (studentsByClass[s.class_id] || 0) + 1;
        }
    });

    // Group by payment status
    const studentsByPaymentStatus: Record<PaymentStatus, number> = {
        PAID: 0,
        PARTIAL: 0,
        PENDING: 0,
        OVERDUE: 0,
    };
    students.forEach((s) => {
        studentsByPaymentStatus[s.payment_status]++;
    });

    // Group by enrollment status
    const studentsByEnrollmentStatus: Record<EnrollmentStatus, number> = {
        ENROLLED: enrolledStudents,
        PENDING: pendingStudents,
        SUSPENDED: suspendedStudents,
        DROPPED: droppedStudents,
        COMPLETED: completedStudents,
    };

    return {
        total_students: totalStudents,
        enrolled_students: enrolledStudents,
        pending_students: pendingStudents,
        suspended_students: suspendedStudents,
        dropped_students: droppedStudents,
        completed_students: completedStudents,
        students_with_overdue_payments: studentsWithOverduePayments,
        total_fees_collected: Number(totalFeesCollected.toFixed(2)),
        total_outstanding_fees: Number(totalOutstandingFees.toFixed(2)),
        average_attendance: Number(averageAttendance.toFixed(2)),
        students_by_class: studentsByClass,
        students_by_payment_status: studentsByPaymentStatus,
        students_by_enrollment_status: studentsByEnrollmentStatus,
    };
}

/**
 * Calculates class-specific student statistics
 * 
 * @param students - Array of students in the class
 * @param className - Name of the class
 * @param classId - ID of the class
 * @returns Class student statistics
 */
export function calculateClassStudentStats(
    students: BranchStudent[],
    className: string,
    classId: string
): ClassStudentStats {
    const totalEnrolled = students.length;

    const averageAttendance = totalEnrolled > 0
        ? students.reduce((sum, s) => sum + s.attendance_percentage, 0) / totalEnrolled
        : 0;

    const studentsWithGoodAttendance = students.filter(
        (s) => s.attendance_percentage >= ATTENDANCE_THRESHOLDS.GOOD
    ).length;

    const studentsNeedingAttention = students.filter(
        (s) => s.attendance_percentage < ATTENDANCE_THRESHOLDS.NEEDS_IMPROVEMENT
    ).length;

    const paymentComplianceRate = calculatePaymentComplianceRate(students);

    return {
        class_id: classId,
        class_name: className,
        total_enrolled: totalEnrolled,
        average_attendance: Number(averageAttendance.toFixed(2)),
        students_with_good_attendance: studentsWithGoodAttendance,
        students_needing_attention: studentsNeedingAttention,
        payment_compliance_rate: paymentComplianceRate,
    };
}

/**
 * Creates student financial summary
 * 
 * @param student - Branch student record
 * @returns Financial summary
 */
export function createStudentFinancialSummary(student: BranchStudent): StudentFinancialSummary {
    const outstandingBalance = calculateOutstandingBalance(
        student.total_fees_due,
        student.total_fees_paid
    );
    const isOverdue = checkPaymentOverdue(student.next_payment_due);
    const overdueDays = isOverdue && student.next_payment_due
        ? Math.abs(calculateDaysUntilPayment(student.next_payment_due) || 0)
        : null;

    return {
        student_id: student.student_id,
        enrollment_id: student.id,
        total_fees_due: student.total_fees_due,
        total_fees_paid: student.total_fees_paid,
        outstanding_balance: outstandingBalance,
        last_payment_date: student.last_payment_date,
        next_payment_due: student.next_payment_due,
        payment_status: student.payment_status,
        is_overdue: isOverdue,
        overdue_days: overdueDays,
    };
}

/**
 * Creates student academic summary
 * 
 * @param student - Branch student record
 * @param className - Name of the class
 * @param subject - Subject name
 * @returns Academic summary
 */
export function createStudentAcademicSummary(
    student: BranchStudent,
    className: string | null,
    subject: string | null
): StudentAcademicSummary {
    const enrollmentDurationDays = calculateEnrollmentDuration(
        student.enrollment_date,
        student.actual_completion_date
    );
    const isOnTrack = isStudentOnTrack(student);

    return {
        student_id: student.student_id,
        enrollment_id: student.id,
        class_name: className,
        subject: subject,
        attendance_percentage: student.attendance_percentage,
        current_grade: student.current_grade,
        performance_notes: student.performance_notes,
        enrollment_duration_days: enrollmentDurationDays,
        is_on_track: isOnTrack,
    };
}

// ============================================================
// FILTERING & SORTING HELPERS
// ============================================================

/**
 * Filters students needing attention
 * 
 * @param students - Array of branch students
 * @returns Students who need attention
 */
export function filterStudentsNeedingAttention(students: BranchStudent[]): BranchStudent[] {
    return students.filter(studentNeedsAttention);
}

/**
 * Filters students with upcoming payments
 * 
 * @param students - Array of branch students
 * @param daysAhead - Number of days to look ahead (default: 7)
 * @returns Students with payments due soon
 */
export function filterStudentsWithUpcomingPayments(
    students: BranchStudent[],
    daysAhead: number = 7
): BranchStudent[] {
    return students.filter((student) => {
        const days = calculateDaysUntilPayment(student.next_payment_due);
        return days !== null && days >= 0 && days <= daysAhead;
    });
}

/**
 * Sorts students by attendance percentage
 * 
 * @param students - Array of branch students
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortByAttendance(
    students: BranchStudent[],
    direction: 'asc' | 'desc' = 'desc'
): BranchStudent[] {
    return [...students].sort((a, b) => {
        const diff = a.attendance_percentage - b.attendance_percentage;
        return direction === 'asc' ? diff : -diff;
    });
}

/**
 * Sorts students by outstanding balance
 * 
 * @param students - Array of branch students
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortByOutstandingBalance(
    students: BranchStudent[],
    direction: 'asc' | 'desc' = 'desc'
): BranchStudent[] {
    return [...students].sort((a, b) => {
        const balanceA = calculateOutstandingBalance(a.total_fees_due, a.total_fees_paid);
        const balanceB = calculateOutstandingBalance(b.total_fees_due, b.total_fees_paid);
        const diff = balanceA - balanceB;
        return direction === 'asc' ? diff : -diff;
    });
}

// ============================================================
// FORMATTING FUNCTIONS
// ============================================================

/**
 * Formats currency amount
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'INR')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formats phone number for display
 * 
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | null): string | null {
    if (!phone) return null;

    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Format as +XX XXXXX XXXXX
    if (digits.length >= 10) {
        const countryCode = digits.slice(0, -10);
        const firstPart = digits.slice(-10, -5);
        const secondPart = digits.slice(-5);

        if (countryCode) {
            return `+${countryCode} ${firstPart} ${secondPart}`;
        }
        return `${firstPart} ${secondPart}`;
    }

    return phone;
}

/**
 * Formats date for display
 * 
 * @param date - ISO date string
 * @param locale - Locale code (default: 'en-IN')
 * @returns Formatted date string
 */
export function formatDate(date: string | null, locale: string = 'en-IN'): string | null {
    if (!date) return null;

    const dateObj = new Date(date);
    return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Formats enrollment status for display
 * 
 * @param status - Enrollment status
 * @returns Human-readable status string
 */
export function formatEnrollmentStatus(status: EnrollmentStatus): string {
    const statusMap: Record<EnrollmentStatus, string> = {
        ENROLLED: 'Enrolled',
        PENDING: 'Pending',
        SUSPENDED: 'Suspended',
        DROPPED: 'Dropped',
        COMPLETED: 'Completed',
    };
    return statusMap[status];
}

/**
 * Formats payment status for display
 * 
 * @param status - Payment status
 * @returns Human-readable status string
 */
export function formatPaymentStatus(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
        PAID: 'Paid',
        PARTIAL: 'Partially Paid',
        PENDING: 'Pending',
        OVERDUE: 'Overdue',
    };
    return statusMap[status];
}
