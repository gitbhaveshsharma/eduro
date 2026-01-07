'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ArrowRight } from 'lucide-react';
import type { TeacherAssignment } from '@/lib/schema/coaching.types';

interface AssignmentsListProps {
    assignments: TeacherAssignment[];
    onViewAll: () => void;
}

export function AssignmentsList({ assignments, onViewAll }: AssignmentsListProps) {
    if (assignments.length === 0) return null;

    return (
        <Card className="border-muted/50 shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                        <ClipboardList className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    Recent Assignments
                </CardTitle>
                <CardDescription>
                    {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} pending review
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {assignments.slice(0, 3).map((assignment) => (
                        <div
                            key={assignment.assignment_id}
                            className="p-4 border rounded-xl hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 cursor-pointer group"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 space-y-1">
                                    <p className="font-semibold text-base group-hover:text-primary transition-colors">
                                        {assignment.coaching_name}
                                    </p>
                                    {assignment.branch_name && (
                                        <p className="text-sm text-muted-foreground">
                                            {assignment.branch_name}
                                        </p>
                                    )}
                                </div>
                                <Badge
                                    variant={assignment.is_active ? 'default' : 'secondary'}
                                    className="shrink-0"
                                >
                                    {assignment.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
                {assignments.length > 3 && (
                    <Button
                        variant="ghost"
                        className="w-full mt-4 group hover:bg-primary/5"
                        onClick={onViewAll}
                    >
                        View All Assignments
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
