/**
 * Quiz Stats Grid Component
 */

'use client';

import { CheckCircle2, XCircle, Target, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsGridProps {
    correctCount: number;
    totalQuestions: number;
    score: number;
    startedAt?: string;
    submittedAt?: string;
}

export function StatsGrid({
    correctCount,
    totalQuestions,
    score,
    startedAt,
    submittedAt
}: StatsGridProps) {
    const minutes = startedAt && submittedAt
        ? Math.round(
            (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 60000
        )
        : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">{correctCount}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 text-center">
                    <XCircle className="h-6 w-6 mx-auto text-red-600 mb-2" />
                    <p className="text-2xl font-bold">{totalQuestions - correctCount}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 text-center">
                    <Target className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{score}</p>
                    <p className="text-xs text-muted-foreground">Points Earned</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                    <p className="text-2xl font-bold">{minutes || '-'}</p>
                    <p className="text-xs text-muted-foreground">Minutes</p>
                </CardContent>
            </Card>
        </div>
    );
}
