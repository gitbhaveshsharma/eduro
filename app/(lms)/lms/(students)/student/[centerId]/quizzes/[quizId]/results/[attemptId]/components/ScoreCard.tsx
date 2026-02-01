/**
 * Quiz Score Card Component
 */

'use client';

import { Trophy, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatScore, calculatePercentage } from '@/lib/branch-system/utils/quiz-helpers';

interface ScoreCardProps {
    score: number;
    maxScore: number;
    passingScore?: number | null;
    passed: boolean;
}

export function ScoreCard({ score, maxScore, passingScore, passed }: ScoreCardProps) {
    const scorePercentage = calculatePercentage(score, maxScore);

    return (
        <Card className={cn(
            'border-2',
            passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
        )}>
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={cn(
                        'p-4 rounded-full',
                        passed ? 'bg-green-100' : 'bg-red-100'
                    )}>
                        {passed ? (
                            <Trophy className="h-12 w-12 text-green-600" />
                        ) : (
                            <Target className="h-12 w-12 text-red-600" />
                        )}
                    </div>

                    <div>
                        <p className="text-5xl font-bold">
                            {formatScore(score, maxScore)}
                        </p>
                        <p className="text-lg text-muted-foreground mt-1">
                            {scorePercentage.toFixed(0)}%
                        </p>
                    </div>

                    <Badge
                        variant={passed ? 'default' : 'destructive'}
                        className="text-lg px-4 py-1"
                    >
                        {passed ? 'PASSED' : 'NOT PASSED'}
                    </Badge>

                    {passingScore && (
                        <p className="text-sm text-muted-foreground">
                            Passing score: {passingScore}%
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
