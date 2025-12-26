/**
 * Student Profile Page Component
 * 
 * Comprehensive view of student enrollment data
 * Displays all information from student_enrollment_details view
 * 
 * Reusable across coach and branch-manager routes
 * 
 * @module branch-students/student-profile-page
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { EnrichedClassEnrollment } from '@/lib/branch-system/types/enriched-enrollment.types';
import {
    STUDENT_PROFILE_SECTIONS,
    BRANCH_INFO_SECTION,
    CLASS_SCHEDULE_SECTION,
    TEACHER_INFO_SECTION,
} from '@/lib/branch-system/types/enriched-enrollment.types';
import {
    PAYMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/branch-students.types';
import {
    CLASS_ENROLLMENT_STATUS_OPTIONS,
} from '@/lib/branch-system/types/class-enrollments.types';
import {
    formatCurrency,
    formatDate,
    formatPhoneNumber,
} from '@/lib/branch-system/utils/branch-students.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Edit,
    Trash2,
    User,
    GraduationCap,
    DollarSign,
    Phone,
    MapPin,
    Calendar,
    BookOpen,
    Building2,
    Users,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Receipt,
} from 'lucide-react';
import { useBranchStudentsStore } from '@/lib/branch-system/stores/branch-students.store';

/**
 * Icon mapping for sections
 */
const ICON_MAP: Record<string, React.ElementType> = {
    User,
    GraduationCap,
    DollarSign,
    Phone,
    MapPin,
    Calendar,
    BookOpen,
    Building2,
    Users,
};

/**
 * Props for StudentProfilePage
 */
interface StudentProfilePageProps {
    enrollmentId: string;
    backUrl: string;
    showBranchInfo?: boolean;
}

/**
 * Info Row Component
 */
interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    highlight?: 'positive' | 'negative' | 'warning' | 'neutral';
}

function InfoRow({ label, value, highlight }: InfoRowProps) {
    let valueClass = 'text-sm font-medium';
    if (highlight === 'positive') valueClass += ' text-green-600';
    else if (highlight === 'negative') valueClass += ' text-red-600';
    else if (highlight === 'warning') valueClass += ' text-orange-600';

    return (
        <div className="flex justify-between py-2 border-b border-muted last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={valueClass}>{value || '-'}</span>
        </div>
    );
}

/**
 * Stats Card Component
 */
interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatsCard({ title, value, icon: Icon, description, variant = 'default' }: StatsCardProps) {
    const variantStyles = {
        default: 'bg-card',
        success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        warning: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
        danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    };

    return (
        <Card className={variantStyles[variant]}>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground/50" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Get avatar URL from config
 */
function getAvatarUrl(avatarUrl: EnrichedClassEnrollment['avatar_url']): string | undefined {
    if (!avatarUrl) return undefined;
    if (typeof avatarUrl === 'string') return avatarUrl;

    // Robohash avatar config
    const { type, bgset, uniqueString } = avatarUrl;
    const bgParam = bgset ? `&bgset=${bgset}` : '';
    return `https://robohash.org/${uniqueString}?set=${type.replace('robohash_', 'set')}${bgParam}`;
}

/**
 * Get initials from name
 */
function getInitials(name: string | null): string {
    if (!name) return 'ST';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Student Profile Page Component
 */
export function StudentProfilePage({
    enrollmentId,
    backUrl,
    showBranchInfo = true,
}: StudentProfilePageProps) {
    const router = useRouter();
    const [enrollment, setEnrollment] = useState<EnrichedClassEnrollment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        openEditDialog,
        openDeleteDialog,
        setCurrentEnrollment,
    } = useBranchStudentsStore();

    /**
     * Fetch enrollment data
     */
    const fetchEnrollmentData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from('student_enrollment_details')
                .select('*')
                .eq('enrollment_id', enrollmentId)
                .single();

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            if (!data) {
                throw new Error('Enrollment not found');
            }

            setEnrollment(data as EnrichedClassEnrollment);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load enrollment');
        } finally {
            setIsLoading(false);
        }
    }, [enrollmentId]);

    useEffect(() => {
        fetchEnrollmentData();
    }, [fetchEnrollmentData]);

    /**
     * Handle edit action
     */
    const handleEdit = useCallback(() => {
        if (enrollment) {
            // Set current enrollment in store for edit dialog
            setCurrentEnrollment({
                id: enrollment.enrollment_id,
                student_id: enrollment.student_id,
                branch_id: enrollment.branch_id,
                student_name: enrollment.student_name,
                student_email: enrollment.student_email,
                student_phone: enrollment.student_phone,
                total_fees_due: enrollment.total_fees_due,
                total_fees_paid: enrollment.total_fees_paid,
                last_payment_date: enrollment.last_payment_date,
                next_payment_due: enrollment.next_payment_due,
                payment_status: enrollment.payment_status,
                emergency_contact_name: enrollment.emergency_contact_name,
                emergency_contact_phone: enrollment.emergency_contact_phone,
                parent_guardian_name: enrollment.parent_guardian_name,
                parent_guardian_phone: enrollment.parent_guardian_phone,
                student_notes: enrollment.student_notes,
                registration_date: enrollment.enrollment_date || enrollment.created_at,
                metadata: enrollment.metadata,
                created_at: enrollment.created_at,
                updated_at: enrollment.updated_at,
            });
            openEditDialog();
        }
    }, [enrollment, setCurrentEnrollment, openEditDialog]);

    /**
     * Handle delete action
     */
    const handleDelete = useCallback(() => {
        if (enrollment) {
            setCurrentEnrollment({
                id: enrollment.enrollment_id,
                student_id: enrollment.student_id,
                branch_id: enrollment.branch_id,
                student_name: enrollment.student_name,
                student_email: enrollment.student_email,
                student_phone: enrollment.student_phone,
                total_fees_due: enrollment.total_fees_due,
                total_fees_paid: enrollment.total_fees_paid,
                last_payment_date: enrollment.last_payment_date,
                next_payment_due: enrollment.next_payment_due,
                payment_status: enrollment.payment_status,
                emergency_contact_name: enrollment.emergency_contact_name,
                emergency_contact_phone: enrollment.emergency_contact_phone,
                parent_guardian_name: enrollment.parent_guardian_name,
                parent_guardian_phone: enrollment.parent_guardian_phone,
                student_notes: enrollment.student_notes,
                registration_date: enrollment.enrollment_date || enrollment.created_at,
                metadata: enrollment.metadata,
                created_at: enrollment.created_at,
                updated_at: enrollment.updated_at,
            });
            openDeleteDialog();
        }
    }, [enrollment, setCurrentEnrollment, openDeleteDialog]);

    // Loading state
    if (isLoading) {
        return <StudentProfileSkeleton />;
    }

    // Error state
    if (error || !enrollment) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push(backUrl)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Students
                </Button>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || 'Failed to load student profile'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Get status configurations
    const enrollmentStatusConfig = CLASS_ENROLLMENT_STATUS_OPTIONS[enrollment.enrollment_status];
    const paymentStatusConfig = PAYMENT_STATUS_OPTIONS[enrollment.payment_status];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push(backUrl)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Students
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Profile Header Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <Avatar className="h-24 w-24">
                            <AvatarImage
                                src={getAvatarUrl(enrollment.avatar_url)}
                                alt={enrollment.student_name || 'Student'}
                            />
                            <AvatarFallback className="text-2xl">
                                {getInitials(enrollment.student_name)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Basic Info */}
                        <div className="flex-1 space-y-2">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {enrollment.student_name || 'Unknown Student'}
                                </h1>
                                <p className="text-muted-foreground">
                                    @{enrollment.student_username || 'no-username'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant={enrollmentStatusConfig?.color as any || 'secondary'}>
                                    {enrollmentStatusConfig?.label || enrollment.enrollment_status}
                                </Badge>
                               <Badge variant={paymentStatusConfig?.color || 'secondary'}>
    {paymentStatusConfig?.label || enrollment.payment_status}
</Badge>

                                {enrollment.is_payment_overdue && (
                                    <Badge variant="destructive">Payment Overdue</Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {enrollment.student_email && (
                                    <span>{enrollment.student_email}</span>
                                )}
                                {enrollment.student_phone && (
                                    <span>{formatPhoneNumber(enrollment.student_phone)}</span>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 md:min-w-[200px]">
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{enrollment.attendance_percentage.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Attendance</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{enrollment.days_enrolled}</p>
                                <p className="text-xs text-muted-foreground">Days Enrolled</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Outstanding Balance"
                    value={formatCurrency(enrollment.outstanding_balance)}
                    icon={DollarSign}
                    variant={enrollment.outstanding_balance > 0 ? 'warning' : 'success'}
                    description={enrollment.outstanding_balance > 0 ? 'Payment pending' : 'Fully paid'}
                />
                <StatsCard
                    title="Attendance Rate"
                    value={`${enrollment.attendance_percentage.toFixed(1)}%`}
                    icon={CheckCircle2}
                    variant={
                        enrollment.attendance_percentage >= 75 ? 'success' :
                            enrollment.attendance_percentage >= 60 ? 'warning' : 'danger'
                    }
                    description={`${enrollment.total_days_present} present / ${enrollment.total_days_absent} absent`}
                />
                <StatsCard
                    title="Receipts"
                    value={enrollment.total_receipts_paid}
                    icon={Receipt}
                    description={`${enrollment.total_receipts_pending} pending`}
                />
                <StatsCard
                    title="Payment Progress"
                    value={`${enrollment.payment_completion_percentage}%`}
                    icon={TrendingUp}
                    variant={enrollment.payment_completion_percentage >= 100 ? 'success' : 'default'}
                    description={`${formatCurrency(enrollment.total_fees_paid)} of ${formatCurrency(enrollment.total_fees_due)}`}
                />
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="academic">Academic</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Student Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Student Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Full Name" value={enrollment.student_name} />
                                <InfoRow label="Email" value={enrollment.student_email} />
                                <InfoRow label="Phone" value={formatPhoneNumber(enrollment.student_phone)} />
                                <InfoRow label="Username" value={`@${enrollment.student_username}`} />
                                <InfoRow label="Date of Birth" value={formatDate(enrollment.date_of_birth)} />
                                <InfoRow label="Gender" value={enrollment.gender} />
                            </CardContent>
                        </Card>

                        {/* Class Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Class Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Class Name" value={enrollment.class_name} />
                                <InfoRow label="Subject" value={enrollment.subject} />
                                <InfoRow label="Grade Level" value={enrollment.grade_level} />
                                <InfoRow label="Batch" value={enrollment.batch_name} />
                                <InfoRow label="Teacher" value={enrollment.teacher_name} />
                                <InfoRow
                                    label="Status"
                                    value={
                                        <Badge variant={enrollmentStatusConfig?.color as any || 'secondary'}>
                                            {enrollmentStatusConfig?.label || enrollment.enrollment_status}
                                        </Badge>
                                    }
                                />
                            </CardContent>
                        </Card>

                        {/* Contact Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Emergency Contact" value={enrollment.emergency_contact_name} />
                                <InfoRow label="Emergency Phone" value={formatPhoneNumber(enrollment.emergency_contact_phone)} />
                                <InfoRow label="Parent/Guardian" value={enrollment.parent_guardian_name} />
                                <InfoRow label="Guardian Phone" value={formatPhoneNumber(enrollment.parent_guardian_phone)} />
                            </CardContent>
                        </Card>

                        {/* Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {enrollment.student_postal_address ? (
                                    <>
                                        <p className="text-sm mb-3">{enrollment.student_postal_address}</p>
                                        <Separator className="my-3" />
                                        <InfoRow label="City" value={enrollment.student_city} />
                                        <InfoRow label="District" value={enrollment.student_district} />
                                        <InfoRow label="State" value={enrollment.student_state} />
                                        <InfoRow label="PIN Code" value={enrollment.student_pin_code} />
                                        <InfoRow label="Country" value={enrollment.student_country} />
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No address on file</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Academic Tab */}
                <TabsContent value="academic" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Attendance Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Attendance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-4">
                                    <p className="text-4xl font-bold">
                                        {enrollment.attendance_percentage.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">Overall Attendance</p>
                                </div>
                                <Separator className="my-4" />
                                <InfoRow label="Days Present" value={enrollment.total_days_present} />
                                <InfoRow label="Days Absent" value={enrollment.total_days_absent} />
                                <InfoRow label="Days Enrolled" value={enrollment.days_enrolled} />
                            </CardContent>
                        </Card>

                        {/* Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Current Grade" value={enrollment.current_grade || 'Not graded'} />
                                <InfoRow label="Preferred Batch" value={enrollment.preferred_batch} />
                                <InfoRow label="Special Requirements" value={enrollment.special_requirements} />
                                {enrollment.performance_notes && (
                                    <>
                                        <Separator className="my-3" />
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Performance Notes</p>
                                            <p className="text-sm">{enrollment.performance_notes}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Class Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Class Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Class Days" value={enrollment.class_days?.join(', ')} />
                                <InfoRow label="Time" value={
                                    enrollment.class_start_time && enrollment.class_end_time
                                        ? `${enrollment.class_start_time} - ${enrollment.class_end_time}`
                                        : null
                                } />
                                <InfoRow label="Course Start" value={formatDate(enrollment.class_start_date)} />
                                <InfoRow label="Course End" value={formatDate(enrollment.class_end_date)} />
                                <InfoRow label="Enrollment Date" value={formatDate(enrollment.enrollment_date)} />
                                {enrollment.expected_completion_date && (
                                    <InfoRow label="Expected Completion" value={formatDate(enrollment.expected_completion_date)} />
                                )}
                                {enrollment.days_until_completion !== null && enrollment.days_until_completion > 0 && (
                                    <InfoRow label="Days Until Completion" value={`${enrollment.days_until_completion} days`} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Teacher Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Teacher Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Teacher Name" value={enrollment.teacher_name} />
                                <InfoRow label="Teacher Email" value={enrollment.teacher_email} />
                                <InfoRow label="Teacher Phone" value={formatPhoneNumber(enrollment.teacher_phone)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Fee Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Fee Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Total Fees Due" value={formatCurrency(enrollment.total_fees_due)} />
                                <InfoRow label="Total Fees Paid" value={formatCurrency(enrollment.total_fees_paid)} />
                                <InfoRow
                                    label="Outstanding Balance"
                                    value={formatCurrency(enrollment.outstanding_balance)}
                                    highlight={enrollment.outstanding_balance > 0 ? 'negative' : 'positive'}
                                />
                                <InfoRow label="Class Fee Amount" value={formatCurrency(enrollment.class_fees_amount ?? 0)} />
                                <InfoRow label="Fee Frequency" value={enrollment.class_fees_frequency} />
                            </CardContent>
                        </Card>

                        {/* Payment Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Payment Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <Badge
                                        variant={paymentStatusConfig?.color as any || 'secondary'}
                                        className="text-base px-3 py-1"
                                    >
                                        {paymentStatusConfig?.label || enrollment.payment_status}
                                    </Badge>
                                    {enrollment.is_payment_overdue && (
                                        <Badge variant="destructive" className="ml-2 text-base px-3 py-1">
                                            Overdue
                                        </Badge>
                                    )}
                                </div>
                                <InfoRow label="Payment Completion" value={`${enrollment.payment_completion_percentage}%`} />
                                <InfoRow label="Last Payment" value={formatDate(enrollment.last_payment_date)} />
                                <InfoRow
                                    label="Next Payment Due"
                                    value={formatDate(enrollment.next_payment_due)}
                                    highlight={enrollment.is_payment_overdue ? 'negative' : undefined}
                                />
                                {enrollment.days_until_payment_due !== null && !enrollment.is_payment_overdue && (
                                    <InfoRow label="Days Until Due" value={`${enrollment.days_until_payment_due} days`} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Receipt Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Receipt Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Receipts Paid" value={enrollment.total_receipts_paid} />
                                <InfoRow label="Receipts Pending" value={enrollment.total_receipts_pending} />
                                <InfoRow label="Total Amount via Receipts" value={formatCurrency(enrollment.total_amount_paid_via_receipts)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Branch Info */}
                        {showBranchInfo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Branch Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <InfoRow label="Branch Name" value={enrollment.branch_name} />
                                    <InfoRow label="Coaching Center" value={enrollment.coaching_center_name} />
                                    <InfoRow label="Branch Phone" value={formatPhoneNumber(enrollment.branch_phone)} />
                                    <InfoRow label="Branch Email" value={enrollment.branch_email} />
                                    <InfoRow label="Main Branch" value={enrollment.is_main_branch ? 'Yes' : 'No'} />
                                    {enrollment.branch_description && (
                                        <>
                                            <Separator className="my-3" />
                                            <p className="text-sm text-muted-foreground">Description</p>
                                            <p className="text-sm">{enrollment.branch_description}</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Branch Manager */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Branch Manager
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Manager Name" value={enrollment.branch_manager_name} />
                                <InfoRow label="Manager Email" value={enrollment.branch_manager_email} />
                                <InfoRow label="Manager Phone" value={formatPhoneNumber(enrollment.branch_manager_phone)} />
                            </CardContent>
                        </Card>

                        {/* Branch Address */}
                        {showBranchInfo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Branch Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {enrollment.branch_postal_address ? (
                                        <>
                                            <p className="text-sm mb-3">{enrollment.branch_postal_address}</p>
                                            <Separator className="my-3" />
                                            <InfoRow label="City" value={enrollment.branch_city} />
                                            <InfoRow label="District" value={enrollment.branch_district} />
                                            <InfoRow label="State" value={enrollment.branch_state} />
                                            <InfoRow label="PIN Code" value={enrollment.branch_pin_code} />
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No address on file</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {enrollment.student_notes ? (
                                    <p className="text-sm">{enrollment.student_notes}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No notes available</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Record Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <InfoRow label="Enrollment ID" value={
                                    <span className="font-mono text-xs">{enrollment.enrollment_id}</span>
                                } />
                                <InfoRow label="Student ID" value={
                                    <span className="font-mono text-xs">{enrollment.student_id}</span>
                                } />
                                <InfoRow label="Created" value={formatDate(enrollment.created_at)} />
                                <InfoRow label="Last Updated" value={formatDate(enrollment.updated_at)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

/**
 * Loading skeleton for profile page
 */
function StudentProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-36" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28" />
                ))}
            </div>

            <Skeleton className="h-12 w-96" />

            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-64" />
                ))}
            </div>
        </div>
    );
}

export default StudentProfilePage;
