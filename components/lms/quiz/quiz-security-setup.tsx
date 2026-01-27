/**
 * Quiz Security Setup Component
 * 
 * Pre-quiz security verification screen that ensures:
 * - Fullscreen mode is enabled
 * - Webcam is accessible (if required)
 * - Student acknowledges the rules
 * 
 * @module components/lms/quiz/quiz-security-setup
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Maximize,
    Camera,
    CameraOff,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    Clock,
    Eye,
    Ban,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================================
// TYPES
// ============================================================

export interface QuizSecuritySetupProps {
    /** Quiz title */
    quizTitle: string;
    /** Time limit in minutes */
    timeLimitMinutes: number | null;
    /** Number of questions */
    totalQuestions: number;
    /** Total points */
    maxScore: number;
    /** Whether fullscreen is required */
    requireFullscreen: boolean;
    /** Whether webcam is required */
    requireWebcam: boolean;
    /** Maximum allowed tab switches */
    maxTabSwitches: number;
    /** Is currently initializing */
    isInitializing: boolean;
    /** Callback when ready to start */
    onStartQuiz: () => void;
    /** Callback to enter fullscreen */
    onEnterFullscreen: () => Promise<boolean>;
    /** Callback to start webcam */
    onStartWebcam: () => Promise<boolean>;
    /** Current fullscreen state */
    isFullscreen: boolean;
    /** Current webcam state */
    isWebcamActive: boolean;
    /** Webcam stream for preview */
    webcamStream: MediaStream | null;
}

// ============================================================
// COMPONENT
// ============================================================

export function QuizSecuritySetup({
    quizTitle,
    timeLimitMinutes,
    totalQuestions,
    maxScore,
    requireFullscreen,
    requireWebcam,
    maxTabSwitches,
    isInitializing,
    onStartQuiz,
    onEnterFullscreen,
    onStartWebcam,
    isFullscreen,
    isWebcamActive,
    webcamStream,
}: QuizSecuritySetupProps) {
    const [acknowledged, setAcknowledged] = useState(false);
    const [fullscreenChecked, setFullscreenChecked] = useState(false);
    const [webcamChecked, setWebcamChecked] = useState(false);
    const [isCheckingWebcam, setIsCheckingWebcam] = useState(false);
    const [isCheckingFullscreen, setIsCheckingFullscreen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Update video element when stream changes
    useEffect(() => {
        if (videoRef.current && webcamStream) {
            videoRef.current.srcObject = webcamStream;
        }
    }, [webcamStream]);

    // Check if all requirements are met
    const fullscreenMet = !requireFullscreen || isFullscreen;
    const webcamMet = !requireWebcam || isWebcamActive;
    const allRequirementsMet = fullscreenMet && webcamMet && acknowledged;

    // Handle fullscreen check
    const handleFullscreenCheck = async () => {
        setIsCheckingFullscreen(true);
        try {
            const success = await onEnterFullscreen();
            setFullscreenChecked(success);
        } finally {
            setIsCheckingFullscreen(false);
        }
    };

    // Handle webcam check
    const handleWebcamCheck = async () => {
        setIsCheckingWebcam(true);
        try {
            const success = await onStartWebcam();
            setWebcamChecked(success);
        } finally {
            setIsCheckingWebcam(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Security Setup</CardTitle>
                    <CardDescription>
                        Complete the following steps before starting your quiz
                    </CardDescription>
                </CardHeader>
                <ScrollArea className="max-h-[60vh] overflow-y-auto">
                    <CardContent className="space-y-6">
                        {/* Quiz Info */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h3 className="font-semibold mb-3">{quizTitle}</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{timeLimitMinutes ? `${timeLimitMinutes} min` : 'No limit'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>{totalQuestions} questions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{maxScore} points</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Security Requirements */}
                        <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Security Requirements
                            </h4>

                            {/* Fullscreen Requirement */}
                            {requireFullscreen && (
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border",
                                    isFullscreen ? "border-green-200 bg-green-50" : "border-border"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <Maximize className="h-5 w-5" />
                                        <div>
                                            <p className="font-medium">Fullscreen Mode</p>
                                            <p className="text-sm text-muted-foreground">
                                                Quiz must be taken in fullscreen
                                            </p>
                                        </div>
                                    </div>
                                    {isFullscreen ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={handleFullscreenCheck}
                                            disabled={isCheckingFullscreen}
                                        >
                                            {isCheckingFullscreen ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Enable'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Webcam Requirement */}
                            {requireWebcam && (
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border",
                                    isWebcamActive ? "border-green-200 bg-green-50" : "border-border"
                                )}>
                                    <div className="flex items-center gap-3">
                                        {isWebcamActive ? (
                                            <Camera className="h-5 w-5" />
                                        ) : (
                                            <CameraOff className="h-5 w-5" />
                                        )}
                                        <div>
                                            <p className="font-medium">Webcam Verification</p>
                                            <p className="text-sm text-muted-foreground">
                                                Your webcam will be active during the quiz
                                            </p>
                                        </div>
                                    </div>
                                    {isWebcamActive ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={handleWebcamCheck}
                                            disabled={isCheckingWebcam}
                                        >
                                            {isCheckingWebcam ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Enable'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Webcam Preview */}
                            {requireWebcam && isWebcamActive && webcamStream && (
                                <div className="flex justify-center">
                                    <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-40 h-30 object-cover"
                                        />
                                        <div className="absolute bottom-1 right-1 bg-red-500 w-2 h-2 rounded-full animate-pulse" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rules */}
                        <Alert variant="info">
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                                    <li>Do not switch tabs or leave this window</li>
                                    <li>Do not exit fullscreen mode</li>
                                    <li>Copy/paste is disabled</li>
                                    <li>
                                        After <strong>{maxTabSwitches}</strong> violations, your quiz will be auto-submitted
                                    </li>
                                    {requireWebcam && <li>Keep your face visible to the webcam</li>}
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {/* Acknowledgment */}
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="acknowledge"
                                checked={acknowledged}
                                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                            />
                            <Label htmlFor="acknowledge" className="text-sm leading-relaxed cursor-pointer">
                                I understand and agree to follow the quiz rules. I acknowledge that
                                any violation may result in automatic submission of my quiz.
                            </Label>
                        </div>
                    </CardContent>
                </ScrollArea>

                <CardFooter>
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={onStartQuiz}
                        disabled={!allRequirementsMet || isInitializing}
                    >
                        {isInitializing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Starting Quiz...
                            </>
                        ) : !fullscreenMet ? (
                            <>
                                <Maximize className="h-4 w-4 mr-2" />
                                Enable Fullscreen to Continue
                            </>
                        ) : !webcamMet ? (
                            <>
                                <Camera className="h-4 w-4 mr-2" />
                                Enable Webcam to Continue
                            </>
                        ) : !acknowledged ? (
                            <>
                                <Ban className="h-4 w-4 mr-2" />
                                Accept Rules to Continue
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Start Quiz
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default QuizSecuritySetup;
