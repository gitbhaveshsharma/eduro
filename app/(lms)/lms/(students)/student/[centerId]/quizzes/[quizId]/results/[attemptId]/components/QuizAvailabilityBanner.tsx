/**
 * Quiz Availability Banner Component
 */

'use client';

import { CalendarClock, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface QuizAvailabilityBannerProps {
    reviewMessage: string;
    reviewAllowedDate: Date | null;
    showReviewCountdown: boolean;
}

export function QuizAvailabilityBanner({
    reviewMessage,
    reviewAllowedDate,
    showReviewCountdown
}: QuizAvailabilityBannerProps) {
    return (
        <Alert className={cn(
            'border-amber-200 bg-amber-50/50',
            showReviewCountdown && 'border-blue-200 bg-blue-50/50'
        )}>
            <CalendarClock className="h-4 w-4 text-amber-600" />
            <AlertDescription>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        <span className="font-medium">
                            Question details are not currently available
                        </span>
                    </div>
                    <p className="text-sm">{reviewMessage}</p>
                    {reviewAllowedDate && showReviewCountdown && (
                        <div className="mt-2 p-3 bg-blue-100/50 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700">
                                <CalendarClock className="h-4 w-4" />
                                <span className="font-medium">
                                    Available on: {format(reviewAllowedDate, 'PPP p')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
}
