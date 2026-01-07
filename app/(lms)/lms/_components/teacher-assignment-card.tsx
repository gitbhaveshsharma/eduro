'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, MapPin, UserCog, ArrowRight, Calendar, BookOpen, Clock } from 'lucide-react';
import type { TeacherAssignment } from '@/lib/schema/coaching.types';
import { EnrollmentUtils, CoachingDisplayUtils } from '@/lib/utils/coaching.utils';

interface TeacherAssignmentCardProps {
    assignment: TeacherAssignment;
    onSelect: (assignment: TeacherAssignment) => void;
}

export const TeacherAssignmentCard = memo(({
    assignment,
    onSelect
}: TeacherAssignmentCardProps) => {
    const [loading, setLoading] = useState(false);

    const isActive = useMemo(
        () => EnrollmentUtils.isAssignmentActive({
            is_active: assignment.is_active,
            assignment_end_date: assignment.assignment_end_date
        }),
        [assignment.is_active, assignment.assignment_end_date]
    );

    const assignmentDate = useMemo(
        () => EnrollmentUtils.formatDate(assignment.assignment_date),
        [assignment.assignment_date]
    );

    const subjectsDisplay = useMemo(
        () => EnrollmentUtils.getSubjectsDisplay(assignment.teaching_subjects, 3),
        [assignment.teaching_subjects]
    );

    const duration = useMemo(
        () => EnrollmentUtils.getDurationText(assignment.assignment_date, assignment.assignment_end_date),
        [assignment.assignment_date, assignment.assignment_end_date]
    );

    const handleSelect = useCallback(async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onSelect(assignment);
        }, 1000);
    }, [onSelect, assignment]);

    return (
        <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 ${isActive
            ? 'hover:border-brand-highlight/30 bg-gradient-to-br from-white to-orange-50/30'
            : 'hover:border-gray-500/30 bg-gradient-to-br from-white to-gray-50/30'
            }`}>
            <CardHeader className="pb-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className={`h-12 w-12 border-2 flex-shrink-0 ${isActive ? 'border-brand-highlight/20' : 'border-gray-100'}`}>
                            <AvatarImage src={assignment.coaching_logo || undefined} alt={assignment.coaching_name} />
                            <AvatarFallback className={`${isActive ? 'bg-brand-highlight/10 text-brand-highlight' : 'bg-gray-100 text-gray-700'}`}>
                                <Building2 className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 flex-1 min-w-0">
                            <CardTitle className={`text-lg ${isActive ? 'group-hover:text-brand-highlight' : 'group-hover:text-gray-600'} transition-colors`}>
                                <span className="truncate block w-full">{assignment.coaching_name}</span>
                            </CardTitle>
                            {assignment.coaching_description && (
                                <CardDescription className="text-sm line-clamp-2 break-words">
                                    {assignment.coaching_description}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    <Badge variant={isActive ? 'secondary' : 'default'} className="ml-2 flex-shrink-0">
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-brand-highlight' : 'bg-gray-500'} text-white`}>
                        <UserCog className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={`font-medium truncate ${isActive ? 'text-brand-highlight' : 'text-gray-700'}`}>
                            Teacher Assignment
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            Teaching at this coaching center
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-highlight' : 'text-gray-500'}`} />
                    <span className="font-medium truncate">{assignment.branch_name}</span>
                </div>

                {assignment.teaching_subjects && assignment.teaching_subjects.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <BookOpen className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-brand-highlight' : 'text-gray-500'}`} />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Teaching Subjects:</p>
                            <p className="font-medium truncate">{subjectsDisplay}</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <Calendar className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-highlight' : 'text-gray-500'}`} />
                        <span className="truncate">Assigned {assignmentDate}</span>
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-highlight' : 'text-gray-500'}`} />
                        <span>Duration: {duration}</span>
                    </div>
                </div>

                <Button
                    onClick={handleSelect}
                    variant="outline"
                    loading={loading}
                    loadingText="Loading..."
                    className={`w-full ${isActive
                        ? 'group-hover:bg-brand-highlight/5 group-hover:border-brand-highlight group-hover:text-brand-highlight'
                        : 'group-hover:bg-gray-50 group-hover:border-gray-500 group-hover:text-gray-700'
                        } transition-all`}
                >
                    {!loading && (
                        <>
                            <UserCog className="h-4 w-4 mr-2" />
                            <span className="truncate">View Assignment</span>
                            <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
});

TeacherAssignmentCard.displayName = 'TeacherAssignmentCard';
