'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentClassProgress } from '@/lib/branch-system/types/branch-students.types';
import { getSubjectColor } from '@/lib/utils/subject-assets';
import type { SubjectId } from '@/components/dashboard/learning-dashboard/types';
import { mapSubjectToId } from '@/lib/branch-system/utils/branch-classes.utils';
import { calculatePercentage } from '@/lib/branch-system/utils/student-dashboard.utils';

interface ClassProgressProps {
    classProgress: StudentClassProgress[];
    onClassClick?: (classId: string) => void;
}

export function ClassProgress({ classProgress, onClassClick }: ClassProgressProps) {
    if (!classProgress || classProgress.length === 0) {
        return (
            <Card className="border-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        Class Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No classes yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        Class Progress
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {classProgress.length} class{classProgress.length !== 1 ? 'es' : ''}
                    </Badge>
                </div>
                <CardDescription>Your progress in each class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {classProgress.map((cls) => (
                    <ClassProgressCard
                        key={cls.class_id}
                        classProgress={cls}
                        onClick={() => onClassClick?.(cls.class_id)}
                    />
                ))}
            </CardContent>
        </Card>
    );
}

function ClassProgressCard({ classProgress, onClick }: { classProgress: StudentClassProgress; onClick?: () => void }) {
    const subjectId = mapSubjectToId(classProgress.subject) as SubjectId;
    const subjectColor = getSubjectColor(subjectId);

    const assignmentCompletion = calculatePercentage(classProgress.assignments_completed, classProgress.assignments_total);
    const quizCompletion = calculatePercentage(classProgress.quizzes_completed, classProgress.quizzes_total);

    return (
        <div
            className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm hover:border-brand-primary/20"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-1">{classProgress.class_name}</h4>
                    <Badge variant="outline" className={cn('text-[10px] mt-1 border-0', subjectColor)}>
                        {classProgress.subject}
                    </Badge>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {classProgress.attendance_percentage.toFixed(0)}%
                </Badge>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Assignments</span>
                        <span className="font-medium">
                            {classProgress.assignments_completed}/{classProgress.assignments_total}
                        </span>
                    </div>
                    <Progress value={assignmentCompletion} className="h-1.5" />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Quizzes</span>
                        <span className="font-medium">
                            {classProgress.quizzes_completed}/{classProgress.quizzes_total}
                        </span>
                    </div>
                    <Progress value={quizCompletion} className="h-1.5" />
                </div>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-3 mt-3 text-xs">
                {classProgress.average_assignment_score > 0 && (
                    <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">Avg: {classProgress.average_assignment_score.toFixed(0)}%</span>
                    </div>
                )}
                {classProgress.next_assignment_due && (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span className="text-muted-foreground">Due soon</span>
                    </div>
                )}
            </div>
        </div>
    );
}