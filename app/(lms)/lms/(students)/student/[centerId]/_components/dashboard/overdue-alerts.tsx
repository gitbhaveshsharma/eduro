'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Brain, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentOverdueItems } from '@/lib/branch-system/types/branch-students.types';

interface OverdueAlertsProps {
    overdueItems: StudentOverdueItems | null;
    onViewAssignments?: () => void;
    onViewQuizzes?: () => void;
}

export function OverdueAlerts({ overdueItems, onViewAssignments, onViewQuizzes }: OverdueAlertsProps) {
    if (!overdueItems || (overdueItems.overdue_assignments === 0 && overdueItems.expiring_quizzes === 0)) {
        return null; // Don't show card if no overdue items
    }

    const hasOverdue = overdueItems.overdue_assignments > 0;
    const hasExpiring = overdueItems.expiring_quizzes > 0;

    return (
        <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-lg text-destructive">
                        Urgent: Action Required
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {hasOverdue && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-destructive/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-destructive/10">
                                <FileText className="h-4 w-4 text-destructive" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Overdue Assignments</h4>
                                <p className="text-xs text-muted-foreground">
                                    {overdueItems.overdue_assignments} assignment{overdueItems.overdue_assignments !== 1 ? 's' : ''} past deadline
                                </p>
                            </div>
                        </div>
                        {onViewAssignments && (
                            <Button size="sm" variant="destructive" onClick={onViewAssignments}>
                                View
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        )}
                    </div>
                )}

                {hasExpiring && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-amber-500/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Brain className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Expiring Quizzes</h4>
                                <p className="text-xs text-muted-foreground">
                                    {overdueItems.expiring_quizzes} quiz{overdueItems.expiring_quizzes !== 1 ? 'zes' : ''} closing soon
                                </p>
                            </div>
                        </div>
                        {onViewQuizzes && (
                            <Button size="sm" variant="outline" className="border-amber-500/30" onClick={onViewQuizzes}>
                                View
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}