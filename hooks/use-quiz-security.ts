/**
 * Quiz Security Hook
 * 
 * Comprehensive anti-cheating measures for quiz attempts including:
 * - Fullscreen enforcement
 * - Tab/window switching detection
 * - Webcam verification
 * - Copy/paste prevention
 * - Right-click/context menu prevention
 * - Developer tools detection
 * 
 * @module hooks/use-quiz-security
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { showWarningToast, showErrorToast } from '@/lib/toast';

// ============================================================
// TYPES
// ============================================================

export interface QuizSecurityConfig {
    /** Require fullscreen mode */
    requireFullscreen: boolean;
    /** Require webcam access */
    requireWebcam: boolean;
    /** Detect tab switching */
    detectTabSwitch: boolean;
    /** Number of allowed tab switches before auto-submit */
    maxTabSwitches: number;
    /** Prevent copy/paste */
    preventCopyPaste: boolean;
    /** Prevent right-click */
    preventRightClick: boolean;
    /** Detect developer tools */
    detectDevTools: boolean;
    /** Callback when violations exceed limit */
    onViolationLimit: () => void;
    /** Callback for logging violations */
    onViolation?: (type: string, count: number) => void;
}

export interface SecurityState {
    /** Is fullscreen mode active */
    isFullscreen: boolean;
    /** Is webcam active */
    isWebcamActive: boolean;
    /** Webcam stream reference */
    webcamStream: MediaStream | null;
    /** Number of tab switch violations */
    tabSwitchCount: number;
    /** Is security check passed */
    isSecurityCheckPassed: boolean;
    /** Array of violations */
    violations: SecurityViolation[];
    /** Is currently in violation state */
    isInViolation: boolean;
}

export interface SecurityViolation {
    type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste' | 'right_click' | 'dev_tools';
    timestamp: Date;
    details?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_CONFIG: QuizSecurityConfig = {
    requireFullscreen: true,
    requireWebcam: false,
    detectTabSwitch: true,
    maxTabSwitches: 3,
    preventCopyPaste: true,
    preventRightClick: true,
    detectDevTools: false,
    onViolationLimit: () => { },
};

// ============================================================
// HOOK
// ============================================================

export function useQuizSecurity(
    config: Partial<QuizSecurityConfig> = {},
    enabled: boolean = true
) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // State
    const [state, setState] = useState<SecurityState>({
        isFullscreen: false,
        isWebcamActive: false,
        webcamStream: null,
        tabSwitchCount: 0,
        isSecurityCheckPassed: false,
        violations: [],
        isInViolation: false,
    });

    const violationCountRef = useRef(0);
    const isInitializedRef = useRef(false);

    // ============================================================
    // FULLSCREEN MANAGEMENT
    // ============================================================

    const enterFullscreen = useCallback(async (): Promise<boolean> => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if ((elem as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
                await (elem as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
            } else if ((elem as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
                await (elem as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
            }
            setState(s => ({ ...s, isFullscreen: true }));
            return true;
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
            return false;
        }
    }, []);

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
                await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
            } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
                await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
            }
            setState(s => ({ ...s, isFullscreen: false }));
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
        }
    }, []);

    // ============================================================
    // WEBCAM MANAGEMENT
    // ============================================================

    const startWebcam = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                },
                audio: false
            });

            setState(s => ({
                ...s,
                isWebcamActive: true,
                webcamStream: stream,
            }));

            return true;
        } catch (error) {
            console.error('Failed to access webcam:', error);
            showErrorToast('Failed to access webcam. Please enable camera access.');
            return false;
        }
    }, []);

    const stopWebcam = useCallback(() => {
        setState(s => {
            if (s.webcamStream) {
                s.webcamStream.getTracks().forEach(track => track.stop());
            }
            return {
                ...s,
                isWebcamActive: false,
                webcamStream: null,
            };
        });
    }, []);

    // ============================================================
    // VIOLATION TRACKING
    // ============================================================

    const addViolation = useCallback((type: SecurityViolation['type'], details?: string) => {
        violationCountRef.current += 1;
        const count = violationCountRef.current;

        setState(s => ({
            ...s,
            violations: [...s.violations, { type, timestamp: new Date(), details }],
            tabSwitchCount: type === 'tab_switch' ? s.tabSwitchCount + 1 : s.tabSwitchCount,
            isInViolation: true,
        }));

        // Callback for logging
        mergedConfig.onViolation?.(type, count);

        // Check if limit exceeded
        if (type === 'tab_switch' && count >= mergedConfig.maxTabSwitches) {
            showErrorToast(`Warning limit exceeded (${count} violations). Your quiz will be submitted.`);
            mergedConfig.onViolationLimit();
        } else if (type === 'tab_switch') {
            showWarningToast(`Warning: Tab switch detected (${count}/${mergedConfig.maxTabSwitches}). Quiz may be auto-submitted.`);
        }

        // Clear violation state after a moment
        setTimeout(() => {
            setState(s => ({ ...s, isInViolation: false }));
        }, 3000);
    }, [mergedConfig]);

    // ============================================================
    // SECURITY INITIALIZATION
    // ============================================================

    const initializeSecurity = useCallback(async (): Promise<boolean> => {
        if (!enabled) {
            setState(s => ({ ...s, isSecurityCheckPassed: true }));
            return true;
        }

        let success = true;

        // Initialize fullscreen if required
        if (mergedConfig.requireFullscreen) {
            const fullscreenResult = await enterFullscreen();
            if (!fullscreenResult) {
                success = false;
            }
        }

        // Initialize webcam if required
        if (mergedConfig.requireWebcam) {
            const webcamResult = await startWebcam();
            if (!webcamResult) {
                success = false;
            }
        }

        setState(s => ({ ...s, isSecurityCheckPassed: success }));
        isInitializedRef.current = true;

        return success;
    }, [enabled, mergedConfig.requireFullscreen, mergedConfig.requireWebcam, enterFullscreen, startWebcam]);

    // ============================================================
    // EVENT HANDLERS
    // ============================================================

    useEffect(() => {
        if (!enabled) return;

        // Fullscreen change handler
        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            setState(s => ({ ...s, isFullscreen }));

            if (!isFullscreen && isInitializedRef.current && mergedConfig.requireFullscreen) {
                addViolation('fullscreen_exit', 'Exited fullscreen mode');
            }
        };

        // Visibility change handler (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden && mergedConfig.detectTabSwitch) {
                addViolation('tab_switch', 'Switched away from quiz tab');
            }
        };

        // Window blur handler (additional tab switch detection)
        const handleWindowBlur = () => {
            if (mergedConfig.detectTabSwitch) {
                // Small delay to avoid false positives
                setTimeout(() => {
                    if (document.hidden) {
                        addViolation('tab_switch', 'Window lost focus');
                    }
                }, 100);
            }
        };

        // Copy handler
        const handleCopy = (e: ClipboardEvent) => {
            if (mergedConfig.preventCopyPaste) {
                e.preventDefault();
                addViolation('copy_paste', 'Attempted to copy');
                showWarningToast('Copying is disabled during the quiz');
            }
        };

        // Paste handler
        const handlePaste = (e: ClipboardEvent) => {
            if (mergedConfig.preventCopyPaste) {
                e.preventDefault();
                addViolation('copy_paste', 'Attempted to paste');
                showWarningToast('Pasting is disabled during the quiz');
            }
        };

        // Right-click handler
        const handleContextMenu = (e: MouseEvent) => {
            if (mergedConfig.preventRightClick) {
                e.preventDefault();
                addViolation('right_click', 'Attempted right-click');
            }
        };

        // Keyboard shortcuts handler
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent common shortcuts
            if (mergedConfig.preventCopyPaste) {
                // Ctrl+C, Ctrl+V, Ctrl+X
                if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                    e.preventDefault();
                }
                // Ctrl+A (select all)
                if (e.ctrlKey && e.key === 'a') {
                    e.preventDefault();
                }
            }

            // Prevent F12 (dev tools)
            if (mergedConfig.detectDevTools && e.key === 'F12') {
                e.preventDefault();
                addViolation('dev_tools', 'Attempted to open developer tools');
                showWarningToast('Developer tools are disabled during the quiz');
            }

            // Prevent Ctrl+Shift+I (dev tools)
            if (mergedConfig.detectDevTools && e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                addViolation('dev_tools', 'Attempted to open developer tools');
            }
        };

        // Add event listeners
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, mergedConfig, addViolation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam();
            if (document.fullscreenElement) {
                exitFullscreen();
            }
        };
    }, [stopWebcam, exitFullscreen]);

    return {
        ...state,
        initializeSecurity,
        enterFullscreen,
        exitFullscreen,
        startWebcam,
        stopWebcam,
        violationCount: violationCountRef.current,
    };
}

export default useQuizSecurity;
