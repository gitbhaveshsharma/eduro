'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, MapPin, GraduationCap, ArrowRight, Calendar, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';  // Importing Badge
import type { StudentEnrollment } from '@/lib/schema/coaching.types';
import { EnrollmentUtils, CoachingDisplayUtils } from '@/lib/utils/coaching.utils';

interface StudentEnrollmentCardProps {
    enrollment: StudentEnrollment;
    onSelect: (enrollment: StudentEnrollment) => void;
}

export const StudentEnrollmentCard = memo(({
    enrollment,
    onSelect
}: StudentEnrollmentCardProps) => {
    const [loading, setLoading] = useState(false);

    const enrollmentDate = useMemo(
        () => EnrollmentUtils.formatDate(enrollment.registration_date),
        [enrollment.registration_date]
    );

    const initials = useMemo(
        () => CoachingDisplayUtils.getInitials({ name: enrollment.coaching_name }),
        [enrollment.coaching_name]
    );

    const handleSelect = useCallback(async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onSelect(enrollment);
        }, 1000);
    }, [onSelect, enrollment]);

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-2 hover:border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-muted flex-shrink-0">
                            <AvatarImage
                                src={enrollment.coaching_logo || undefined}
                                alt={enrollment.coaching_name}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                                <Building2 className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className="text-lg flex items-center gap-2 w-[90%] max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="truncate">{enrollment.coaching_name}</span>
                            </CardTitle>
                            {enrollment.coaching_description && (
                                <CardDescription className="text-sm line-clamp-2 break-words">
                                    {enrollment.coaching_description}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary text-primary-foreground flex-shrink-0">
                        <GraduationCap className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">Enrolled Student</p>
                        <p className="text-xs text-muted-foreground truncate">
                            Active enrollment at this coaching center
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{enrollment.branch_name}</span>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Enrolled {enrollmentDate}</span>
                    </div>
                </div>

                <Button
                    onClick={handleSelect}
                    loading={loading}
                    loadingText="Loading..."
                    className="w-full group-hover:bg-primary/90"
                >
                    {!loading && (
                        <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            <span className="truncate">View Enrollment</span>
                            <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
});

StudentEnrollmentCard.displayName = 'StudentEnrollmentCard';
