/**
 * Results Actions Component
 */

'use client';

import { Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsActionsProps {
    centerId: string;
    quizId: string;
    canRetry: boolean;
    onNavigateToQuizzes: () => void;
    onRetry: () => void;
}

export function ResultsActions({
    canRetry,
    onNavigateToQuizzes,
    onRetry
}: ResultsActionsProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <Button
                variant="outline"
                className="flex-1"
                onClick={onNavigateToQuizzes}
            >
                <Home className="h-4 w-4 mr-2" />
                Back to Quizzes
            </Button>

            {canRetry && (
                <Button
                    className="flex-1"
                    onClick={onRetry}
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            )}
        </div>
    );
}
