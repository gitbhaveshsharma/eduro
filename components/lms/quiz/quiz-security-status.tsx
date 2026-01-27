/**
 * Quiz Security Status Bar Component
 * 
 * Shows current security status and violation warnings
 * 
 * @module components/lms/quiz/quiz-security-status
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizSecurityStatusProps {
    /** Current violation count */
    violationCount: number;
    /** Maximum allowed violations */
    maxViolations: number;
    /** Whether currently in violation state (flash warning) */
    isInViolation: boolean;
    /** Is fullscreen active */
    isFullscreen: boolean;
    /** Is webcam active */
    isWebcamActive: boolean;
    /** Whether webcam is required */
    requireWebcam: boolean;
}

export function QuizSecurityStatus({
    violationCount,
    maxViolations,
    isInViolation,
    isFullscreen,
    isWebcamActive,
    requireWebcam,
}: QuizSecurityStatusProps) {
    const violationPercentage = (violationCount / maxViolations) * 100;
    const isWarning = violationCount > 0;
    const isCritical = violationCount >= maxViolations - 1;

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                isInViolation && "animate-pulse bg-red-100 dark:bg-red-900/30",
                !isInViolation && isWarning && "bg-amber-50 dark:bg-amber-900/20",
                !isInViolation && !isWarning && "bg-green-50 dark:bg-green-900/20"
            )}
        >
            {/* Shield Icon */}
            {isCritical ? (
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            ) : isWarning ? (
                <Shield className="h-5 w-5 text-amber-500 shrink-0" />
            ) : (
                <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
            )}

            {/* Violation counter */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">
                        {violationCount === 0
                            ? 'No violations'
                            : `${violationCount}/${maxViolations} warnings`}
                    </span>
                </div>
                <Progress
                    value={violationPercentage}
                    className={cn(
                        "h-1",
                        isCritical && "[&>div]:bg-red-500",
                        isWarning && !isCritical && "[&>div]:bg-amber-500",
                        !isWarning && "[&>div]:bg-green-500"
                    )}
                />
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-1.5">
                {/* Fullscreen status */}
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs px-1.5",
                        isFullscreen
                            ? "border-green-200 text-green-700 bg-green-50"
                            : "border-red-200 text-red-700 bg-red-50"
                    )}
                >
                    {isFullscreen ? 'FS' : '!FS'}
                </Badge>

                {/* Webcam status */}
                {requireWebcam && (
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs px-1.5",
                            isWebcamActive
                                ? "border-green-200 text-green-700 bg-green-50"
                                : "border-red-200 text-red-700 bg-red-50"
                        )}
                    >
                        {isWebcamActive ? 'CAM' : '!CAM'}
                    </Badge>
                )}
            </div>
        </div>
    );
}

export default QuizSecurityStatus;
