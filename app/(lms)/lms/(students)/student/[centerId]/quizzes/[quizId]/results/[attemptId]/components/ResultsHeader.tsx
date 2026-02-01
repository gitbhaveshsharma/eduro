/**
 * Quiz Results Header Component
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsHeaderProps {
    quizTitle?: string;
    onBack: () => void;
}

export function ResultsHeader({ quizTitle, onBack }: ResultsHeaderProps) {
    return (
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Quiz Results</h1>
                <p className="text-muted-foreground">{quizTitle || 'Loading...'}</p>
            </div>
        </div>
    );
}
