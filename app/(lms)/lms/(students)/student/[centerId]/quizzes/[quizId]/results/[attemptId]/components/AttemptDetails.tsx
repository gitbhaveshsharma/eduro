/**
 * Attempt Details Component
 */

'use client';

import { Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDateTime } from '@/lib/branch-system/utils/quiz-helpers';

interface AttemptDetailsProps {
    startedAt?: string;
    submittedAt?: string;
    attemptNumber: number;
    isQuizActive: boolean;
}

export function AttemptDetails({
    startedAt,
    submittedAt,
    attemptNumber,
    isQuizActive
}: AttemptDetailsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Attempt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span>{startedAt ? formatDateTime(startedAt) : '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{submittedAt ? formatDateTime(submittedAt) : '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Attempt #</span>
                    <span>{attemptNumber}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Quiz Status</span>
                    <div className="flex items-center gap-1">
                        {isQuizActive ? (
                            <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span>Active</span>
                            </>
                        ) : (
                            <>
                                <X className="h-3 w-3 text-red-600" />
                                <span>Inactive</span>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
