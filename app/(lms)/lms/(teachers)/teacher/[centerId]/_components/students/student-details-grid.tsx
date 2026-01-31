import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    User,
    BookOpen,
    Users,
    Shield,
} from 'lucide-react';

interface StudentDetailsGridProps {
    enrollment: any;
}

export function StudentDetailsGrid({ enrollment }: StudentDetailsGridProps) {
    const calculateAge = (dateOfBirth: string | null): string | null => {
        if (!dateOfBirth) return null;

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age > 0 ? `${age} years` : null;
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isExpired = (date: string | null | undefined): boolean => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const age = calculateAge(enrollment.student?.date_of_birth);

    const expectedCompletionDate =
        enrollment.class_enrollments?.[0]?.expected_completion_date ||
        enrollment.expected_completion_date;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrolled Classes */}
            {enrollment.class_enrollments?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Enrolled Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {enrollment.class_enrollments.map((classEnrollment: any, index: number) => (
                            <div
                                key={classEnrollment.id || index}
                                className="p-4 rounded-lg border bg-muted/30 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-base">
                                            {classEnrollment.class_name || 'Unnamed Class'}
                                        </p>
                                        {classEnrollment.subject_name && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {classEnrollment.subject_name}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="secondary">Active</Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* enrolment Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Enrolment Information
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <InfoRow
                        label="Expected Completion Date"
                        value={expectedCompletionDate ? formatDate(expectedCompletionDate) : 'N/A'}
                        className={
                            isExpired(expectedCompletionDate)
                                ? 'bg-brand-highlight rounded-md px-2 text-red-600'
                                : undefined
                        }
                    />

                    {age && <InfoRow label="Age" value={age} />}

                    {enrollment.student?.date_of_birth && (
                        <InfoRow
                            label="Date of Birth"
                            value={formatDate(enrollment.student.date_of_birth)}
                        />
                    )}

                    <InfoRow
                        label="Registration Date"
                        value={formatDate(enrollment.registration_date)}
                    />
                </CardContent>
            </Card>

            {/* Parent / Guardian */}
            {(enrollment.parent_guardian_name || enrollment.parent_guardian_phone) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Parent / Guardian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {enrollment.parent_guardian_name && (
                            <InfoRow label="Name" value={enrollment.parent_guardian_name} />
                        )}
                        {enrollment.parent_guardian_phone && (
                            <InfoRow label="Phone" value={enrollment.parent_guardian_phone} />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Emergency Contact */}
            {(enrollment.emergency_contact_name || enrollment.emergency_contact_phone) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Emergency Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {enrollment.emergency_contact_name && (
                            <InfoRow label="Name" value={enrollment.emergency_contact_name} />
                        )}
                        {enrollment.emergency_contact_phone && (
                            <InfoRow label="Phone" value={enrollment.emergency_contact_phone} />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/* ================= InfoRow ================= */

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    className?: string;
}

function InfoRow({ label, value, className }: InfoRowProps) {
    return (
        <div
            className={`flex items-start justify-between gap-4 py-2 ${className ?? ''}`}
        >
            <span className="text-sm text-muted-foreground font-medium">
                {label}
            </span>
            <span className="text-sm font-medium text-right">
                {value}
            </span>
        </div>
    );
}
