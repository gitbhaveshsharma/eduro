/**
 * Enriched Enrollment Types
 * 
 * Complete type definition for the student_enrollment_details view
 * This maps directly to the database view that combines data from:
 * - class_enrollments
 * - branch_students  
 * - profiles
 * - addresses
 * - coaching_branches
 * - coaching_centers
 * - branch_classes
 * - branch_teachers
 * - Aggregate statistics
 * 
 * @module branch-system/types/enriched-enrollment
 */

import type { PaymentStatus } from './branch-students.types';
import type { ClassEnrollmentStatus } from './class-enrollments.types';

/**
 * Avatar URL structure for Robohash avatars
 */
export interface AvatarUrlConfig {
    type: string;
    bgset?: string;
    uniqueString: string;
}

/**
 * Enriched Class Enrollment
 * Complete data from student_enrollment_details view
 * 
 * This is the comprehensive type used for the Student Profile Page
 */
export interface EnrichedClassEnrollment {
    // ============================================================
    // ENROLLMENT IDENTIFIERS
    // ============================================================
    enrollment_id: string;
    branch_student_id: string;
    student_id: string;
    branch_id: string;
    class_id: string;

    // ============================================================
    // STUDENT PROFILE DATA (from profiles table)
    // ============================================================
    student_name: string | null;
    student_email: string | null;
    student_phone: string | null;
    student_username: string | null;
    avatar_url: AvatarUrlConfig | string | null;
    date_of_birth: string | null;
    gender: string | null;

    // ============================================================
    // BRANCH STUDENT DATA (from branch_students table)
    // ============================================================
    branch_student_name: string | null;
    branch_student_email: string | null;
    branch_student_phone: string | null;

    // ============================================================
    // STUDENT ADDRESS (from addresses table)
    // ============================================================
    student_address_id: string | null;
    student_address_type: string | null;
    student_address_label: string | null;
    student_address_line_1: string | null;
    student_address_line_2: string | null;
    student_city: string | null;
    student_district: string | null;
    student_sub_district: string | null;
    student_village_town: string | null;
    student_state: string | null;
    student_pin_code: string | null;
    student_country: string | null;
    student_postal_address: string | null;
    student_latitude: number | null;
    student_longitude: number | null;
    student_google_maps_url: string | null;
    student_address_is_primary: boolean | null;

    // ============================================================
    // COACHING CENTER DATA
    // ============================================================
    coaching_center_id: string | null;
    coaching_center_name: string | null;

    // ============================================================
    // BRANCH DATA (from coaching_branches table)
    // ============================================================
    branch_name: string | null;
    branch_phone: string | null;
    branch_email: string | null;
    is_main_branch: boolean | null;
    branch_description: string | null;

    // ============================================================
    // BRANCH ADDRESS
    // ============================================================
    branch_address_id: string | null;
    branch_address_type: string | null;
    branch_address_label: string | null;
    branch_address_line_1: string | null;
    branch_address_line_2: string | null;
    branch_city: string | null;
    branch_district: string | null;
    branch_sub_district: string | null;
    branch_village_town: string | null;
    branch_state: string | null;
    branch_pin_code: string | null;
    branch_country: string | null;
    branch_postal_address: string | null;
    branch_latitude: number | null;
    branch_longitude: number | null;
    branch_google_maps_url: string | null;
    branch_delivery_instructions: string | null;

    // ============================================================
    // BRANCH MANAGER DATA
    // ============================================================
    branch_manager_name: string | null;
    branch_manager_email: string | null;
    branch_manager_phone: string | null;

    // ============================================================
    // CLASS DATA (from branch_classes table)
    // ============================================================
    class_name: string | null;
    subject: string | null;
    grade_level: string | null;
    batch_name: string | null;
    class_start_date: string | null;
    class_end_date: string | null;
    class_start_time: string | null;
    class_end_time: string | null;
    class_days: string[] | null;
    class_max_students: number | null;
    class_current_enrollment: number | null;
    class_fees_amount: number | null;
    class_fees_frequency: string | null;
    class_status: string | null;
    class_prerequisites: string[] | null;
    class_materials_required: string[] | null;

    // ============================================================
    // TEACHER DATA (from branch_teachers/profiles)
    // ============================================================
    teacher_id: string | null;
    teacher_name: string | null;
    teacher_email: string | null;
    teacher_phone: string | null;
    teacher_avatar_url: string | null;

    // ============================================================
    // ENROLLMENT DETAILS (from class_enrollments)
    // ============================================================
    enrollment_date: string | null;
    expected_completion_date: string | null;
    actual_completion_date: string | null;
    enrollment_status: ClassEnrollmentStatus;
    attendance_percentage: number;
    current_grade: string | null;
    performance_notes: string | null;

    // ============================================================
    // FINANCIAL DATA (from branch_students)
    // ============================================================
    total_fees_due: number;
    total_fees_paid: number;
    last_payment_date: string | null;
    next_payment_due: string | null;
    payment_status: PaymentStatus;

    // ============================================================
    // COMPUTED FINANCIAL FIELDS
    // ============================================================
    outstanding_balance: number;
    payment_completion_percentage: number;

    // ============================================================
    // CONTACT INFORMATION (from branch_students)
    // ============================================================
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    parent_guardian_name: string | null;
    parent_guardian_phone: string | null;
    preferred_batch: string | null;
    special_requirements: string | null;
    student_notes: string | null;

    // ============================================================
    // COMPUTED DATE FIELDS
    // ============================================================
    is_payment_overdue: boolean;
    days_until_payment_due: number | null;
    days_enrolled: number;
    days_until_completion: number | null;

    // ============================================================
    // AGGREGATE STATISTICS
    // ============================================================
    total_days_present: number;
    total_days_absent: number;
    total_receipts_paid: number;
    total_receipts_pending: number;
    total_amount_paid_via_receipts: number;

    // ============================================================
    // METADATA & TIMESTAMPS
    // ============================================================
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

/**
 * Student Profile Quick View Data
 * Minimal data needed for the quick view dialog
 */
export interface StudentQuickViewData {
    enrollment_id: string;
    student_id: string;
    student_name: string | null;
    student_email: string | null;
    avatar_url: AvatarUrlConfig | string | null;
    enrollment_status: ClassEnrollmentStatus;
    class_name: string | null;
    attendance_percentage: number;
    payment_status: PaymentStatus;
    outstanding_balance: number;
    is_payment_overdue: boolean;
    next_payment_due: string | null;
    created_at: string;
}

/**
 * Student Profile Section Data Types
 * Used for organizing profile page sections
 */
export interface StudentProfileSection {
    title: string;
    icon: string;
    fields: ProfileFieldConfig[];
}

export interface ProfileFieldConfig {
    key: keyof EnrichedClassEnrollment;
    label: string;
    format?: 'text' | 'date' | 'currency' | 'percentage' | 'phone' | 'badge' | 'list';
    highlight?: 'positive' | 'negative' | 'warning' | 'neutral';
}

/**
 * Convert enriched enrollment to quick view data
 */
export function toQuickViewData(enrollment: EnrichedClassEnrollment): StudentQuickViewData {
    return {
        enrollment_id: enrollment.enrollment_id,
        student_id: enrollment.student_id,
        student_name: enrollment.student_name,
        student_email: enrollment.student_email,
        avatar_url: enrollment.avatar_url,
        enrollment_status: enrollment.enrollment_status,
        class_name: enrollment.class_name,
        attendance_percentage: enrollment.attendance_percentage,
        payment_status: enrollment.payment_status,
        outstanding_balance: enrollment.outstanding_balance,
        is_payment_overdue: enrollment.is_payment_overdue,
        next_payment_due: enrollment.next_payment_due,
        created_at: enrollment.created_at,
    };
}

/**
 * Profile page section configurations
 */
export const STUDENT_PROFILE_SECTIONS: StudentProfileSection[] = [
    {
        title: 'Student Information',
        icon: 'User',
        fields: [
            { key: 'student_name', label: 'Full Name' },
            { key: 'student_email', label: 'Email' },
            { key: 'student_phone', label: 'Phone', format: 'phone' },
            { key: 'student_username', label: 'Username' },
            { key: 'date_of_birth', label: 'Date of Birth', format: 'date' },
            { key: 'gender', label: 'Gender' },
        ],
    },
    {
        title: 'Class Information',
        icon: 'GraduationCap',
        fields: [
            { key: 'class_name', label: 'Class Name' },
            { key: 'subject', label: 'Subject' },
            { key: 'grade_level', label: 'Grade Level' },
            { key: 'batch_name', label: 'Batch' },
            { key: 'enrollment_status', label: 'Status', format: 'badge' },
            { key: 'enrollment_date', label: 'Enrolled On', format: 'date' },
        ],
    },
    {
        title: 'Financial Summary',
        icon: 'DollarSign',
        fields: [
            { key: 'total_fees_due', label: 'Total Fees Due', format: 'currency' },
            { key: 'total_fees_paid', label: 'Total Fees Paid', format: 'currency' },
            { key: 'outstanding_balance', label: 'Outstanding Balance', format: 'currency', highlight: 'negative' },
            { key: 'payment_status', label: 'Payment Status', format: 'badge' },
            { key: 'next_payment_due', label: 'Next Payment Due', format: 'date' },
            { key: 'last_payment_date', label: 'Last Payment', format: 'date' },
        ],
    },
    {
        title: 'Academic Performance',
        icon: 'BookOpen',
        fields: [
            { key: 'attendance_percentage', label: 'Attendance', format: 'percentage' },
            { key: 'current_grade', label: 'Current Grade' },
            { key: 'days_enrolled', label: 'Days Enrolled' },
            { key: 'total_days_present', label: 'Days Present' },
            { key: 'total_days_absent', label: 'Days Absent' },
            { key: 'performance_notes', label: 'Performance Notes' },
        ],
    },
    {
        title: 'Contact Information',
        icon: 'Phone',
        fields: [
            { key: 'emergency_contact_name', label: 'Emergency Contact' },
            { key: 'emergency_contact_phone', label: 'Emergency Phone', format: 'phone' },
            { key: 'parent_guardian_name', label: 'Parent/Guardian' },
            { key: 'parent_guardian_phone', label: 'Guardian Phone', format: 'phone' },
        ],
    },
    {
        title: 'Address',
        icon: 'MapPin',
        fields: [
            { key: 'student_postal_address', label: 'Full Address' },
            { key: 'student_city', label: 'City' },
            { key: 'student_district', label: 'District' },
            { key: 'student_state', label: 'State' },
            { key: 'student_pin_code', label: 'PIN Code' },
            { key: 'student_country', label: 'Country' },
        ],
    },
];

export const BRANCH_INFO_SECTION: StudentProfileSection = {
    title: 'Branch Information',
    icon: 'Building2',
    fields: [
        { key: 'branch_name', label: 'Branch Name' },
        { key: 'branch_phone', label: 'Branch Phone', format: 'phone' },
        { key: 'branch_email', label: 'Branch Email' },
        { key: 'branch_postal_address', label: 'Branch Address' },
        { key: 'branch_manager_name', label: 'Branch Manager' },
    ],
};

export const CLASS_SCHEDULE_SECTION: StudentProfileSection = {
    title: 'Class Schedule',
    icon: 'Calendar',
    fields: [
        { key: 'class_days', label: 'Class Days', format: 'list' },
        { key: 'class_start_time', label: 'Start Time' },
        { key: 'class_end_time', label: 'End Time' },
        { key: 'class_start_date', label: 'Course Start', format: 'date' },
        { key: 'class_end_date', label: 'Course End', format: 'date' },
    ],
};

export const TEACHER_INFO_SECTION: StudentProfileSection = {
    title: 'Teacher Information',
    icon: 'Users',
    fields: [
        { key: 'teacher_name', label: 'Teacher Name' },
        { key: 'teacher_email', label: 'Teacher Email' },
        { key: 'teacher_phone', label: 'Teacher Phone', format: 'phone' },
    ],
};
