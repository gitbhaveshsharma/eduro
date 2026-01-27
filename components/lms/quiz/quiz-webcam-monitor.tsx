/**
 * Quiz Webcam Monitor Component
 * 
 * Small floating webcam preview during quiz
 * Shows recording indicator and can be minimized
 * 
 * @module components/lms/quiz/quiz-webcam-monitor
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizWebcamMonitorProps {
    /** Webcam stream */
    stream: MediaStream | null;
    /** Whether webcam is active */
    isActive: boolean;
}

export function QuizWebcamMonitor({ stream, isActive }: QuizWebcamMonitorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!isActive || !stream) return null;

    return (
        <div
            className={cn(
                "fixed bottom-24 right-4 z-50 transition-all duration-300",
                isMinimized ? "w-12 h-12" : "w-40"
            )}
        >
            {isMinimized ? (
                <Button
                    size="icon"
                    variant="secondary"
                    className="w-12 h-12 rounded-full shadow-lg"
                    onClick={() => setIsMinimized(false)}
                >
                    <Camera className="h-5 w-5" />
                </Button>
            ) : (
                <div className="relative rounded-lg overflow-hidden border-2 border-primary shadow-lg bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-auto object-cover mirror"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Recording indicator */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-white font-medium drop-shadow">REC</span>
                    </div>

                    {/* Minimize button */}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6 text-white hover:bg-white/20"
                        onClick={() => setIsMinimized(true)}
                    >
                        <Minimize2 className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default QuizWebcamMonitor;
