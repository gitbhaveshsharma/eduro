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
import { BrowserPermissionManager } from '@/lib/permissions/permission-manager';
import { BrowserPermissionType, PermissionState } from '@/lib/permissions/types';

// ============================================================
// EXPERIMENTAL API TYPE DECLARATIONS
// ============================================================

// Extend Window interface for experimental Screen Details API
declare global {
    interface Window {
        getScreenDetails?: () => Promise<{
            screens: ScreenDetailed[];
            currentScreen: ScreenDetailed;
        }>;
    }
    
    interface Screen {
        isExtended?: boolean;
    }
}

interface ScreenDetailed {
    availHeight: number;
    availLeft: number;
    availTop: number;
    availWidth: number;
    colorDepth: number;
    devicePixelRatio: number;
    height: number;
    isExtended: boolean;
    isInternal: boolean;
    isPrimary: boolean;
    label: string;
    left: number;
    orientation: {
        type: string;
        angle: number;
    };
    pixelDepth: number;
    top: number;
    width: number;
}

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
    /** Number of allowed fullscreen exits before auto-submit */
    maxFullscreenExits: number;
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
    /** Number of fullscreen exit violations */
    fullscreenExitCount: number;
    /** Is security check passed */
    isSecurityCheckPassed: boolean;
    /** Array of violations */
    violations: SecurityViolation[];
    /** Is currently in violation state */
    isInViolation: boolean;
    /** Number of displays detected */
    displayCount: number;
}

export interface SecurityViolation {
    type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste' | 'right_click' | 'dev_tools' | 'display_change';
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
    maxFullscreenExits: 3,
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
        fullscreenExitCount: 0,
        isSecurityCheckPassed: false,
        violations: [],
        isInViolation: false,
        displayCount: (typeof window !== 'undefined' && window.screen?.isExtended) ? 2 : 1,
    });

    const violationCountRef = useRef(0);
    const isInitializedRef = useRef(false);
    const isFullscreenRef = useRef(false);

    // Update ref when state changes
    useEffect(() => {
        isFullscreenRef.current = state.isFullscreen;
    }, [state.isFullscreen]);

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
            isFullscreenRef.current = true;
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
            isFullscreenRef.current = false;
        } catch (error) {
            console.error('Failed to exit fullscreen:', error);
        }
    }, []);

    // ============================================================
    // WEBCAM MANAGEMENT
    // ============================================================

    const startWebcam = useCallback(async (): Promise<boolean> => {
        console.log('🎥 [QUIZ SECURITY] Starting webcam...');

        try {
            // Step 1: Use Permission Manager to request camera permission
            const permissionManager = BrowserPermissionManager.getInstance();
            console.log('🎥 [QUIZ SECURITY] Requesting camera permission via Permission Manager...');

            const permissionResult = await permissionManager.requestPermission(
                BrowserPermissionType.CAMERA,
                {
                    video: {
                        width: { ideal: 320 },
                        height: { ideal: 240 },
                        facingMode: 'user'
                    }
                }
            );

            console.log('🎥 [QUIZ SECURITY] Permission result:', permissionResult);

            // Step 2: Check if permission was granted
            if (permissionResult.state !== PermissionState.GRANTED) {
                console.error('❌ [QUIZ SECURITY] Camera permission denied or error:', permissionResult);

                if (permissionResult.state === PermissionState.DENIED) {
                    showErrorToast('Camera access denied. Please enable camera in browser settings to continue.');
                } else if (permissionResult.error) {
                    showErrorToast(`Camera error: ${permissionResult.error}`);
                } else {
                    showErrorToast('Failed to access webcam. Please enable camera access.');
                }

                return false;
            }

            // Step 3: Now get the actual stream (permission already granted)
            console.log('🎥 [QUIZ SECURITY] Permission granted! Getting media stream...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user'
                },
                audio: false
            });

            console.log('✅ [QUIZ SECURITY] Webcam stream obtained successfully!');

            setState(s => ({
                ...s,
                isWebcamActive: true,
                webcamStream: stream,
            }));

            return true;
        } catch (error) {
            console.error('❌ [QUIZ SECURITY] Failed to access webcam:', error);

            // Provide more specific error messages
            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    showErrorToast('Camera access denied. Please click "Allow" when prompted, or enable camera in browser settings.');
                } else if (error.name === 'NotFoundError') {
                    showErrorToast('No camera found on your device.');
                } else if (error.name === 'NotReadableError') {
                    showErrorToast('Camera is already in use by another application.');
                } else if (error.message && error.message.includes('permissions policy')) {
                    showErrorToast('Camera blocked by security policy. Please contact support.');
                } else {
                    showErrorToast(`Camera error: ${error.message}`);
                }
            } else {
                showErrorToast('Failed to access webcam. Please enable camera access.');
            }

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

        setState(s => {
            const newTabSwitchCount = type === 'tab_switch' ? s.tabSwitchCount + 1 : s.tabSwitchCount;
            const newFullscreenExitCount = type === 'fullscreen_exit' ? s.fullscreenExitCount + 1 : s.fullscreenExitCount;
            
            return {
                ...s,
                violations: [...s.violations, { type, timestamp: new Date(), details }],
                tabSwitchCount: newTabSwitchCount,
                fullscreenExitCount: newFullscreenExitCount,
                isInViolation: true,
            };
        });

        // Callback for logging
        mergedConfig.onViolation?.(type, count);

        // Get current counts from state
        const currentState = state;
        const tabCount = type === 'tab_switch' ? currentState.tabSwitchCount + 1 : currentState.tabSwitchCount;
        const fullscreenCount = type === 'fullscreen_exit' ? currentState.fullscreenExitCount + 1 : currentState.fullscreenExitCount;

        // Check if limit exceeded for tab switches
        if (type === 'tab_switch') {
            if (tabCount >= mergedConfig.maxTabSwitches) {
                showErrorToast(`Tab switch limit exceeded (${tabCount} violations). Your quiz will be submitted.`);
                mergedConfig.onViolationLimit();
            } else {
                showWarningToast(`Warning: Tab switch detected (${tabCount}/${mergedConfig.maxTabSwitches}). Quiz may be auto-submitted.`);
            }
        }

        // Check if limit exceeded for fullscreen exits
        if (type === 'fullscreen_exit') {
            if (fullscreenCount >= mergedConfig.maxFullscreenExits) {
                showErrorToast(`Fullscreen exit limit exceeded (${fullscreenCount} violations). Your quiz will be submitted.`);
                mergedConfig.onViolationLimit();
            } else {
                showWarningToast(`Warning: Fullscreen exited (${fullscreenCount}/${mergedConfig.maxFullscreenExits}). Press F to re-enter fullscreen.`);
            }
        }

        // Display change warning
        if (type === 'display_change') {
            showErrorToast('Display configuration changed! This is not allowed during the quiz. Your quiz will be submitted.');
            mergedConfig.onViolationLimit();
        }

        // Clear violation state after a moment
        setTimeout(() => {
            setState(s => ({ ...s, isInViolation: false }));
        }, 3000);
    }, [mergedConfig, state]);

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
            isFullscreenRef.current = isFullscreen;

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
            // F key to re-enter fullscreen if not in fullscreen
            if (e.key === 'f' || e.key === 'F') {
                if (!isFullscreenRef.current && mergedConfig.requireFullscreen && isInitializedRef.current) {
                    e.preventDefault();
                    console.log('🔄 [SECURITY] F key pressed - re-entering fullscreen');
                    enterFullscreen();
                    return;
                }
            }

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

        // Display change detection
        const checkDisplayChange = async () => {
            try {
                if (typeof window !== 'undefined' && 'getScreenDetails' in window && window.getScreenDetails) {
                    const screenDetails = await window.getScreenDetails();
                    const newDisplayCount = screenDetails?.screens?.length || 1;
                    if (state.displayCount !== newDisplayCount && isInitializedRef.current) {
                        addViolation('display_change', `Display count changed from ${state.displayCount} to ${newDisplayCount}`);
                    }
                } else if (typeof window !== 'undefined' && window.screen?.isExtended !== undefined) {
                    // Fallback: check screen properties
                    const extendedCheck = window.screen.isExtended;
                    const currentIsExtended = state.displayCount > 1;
                    if (currentIsExtended !== extendedCheck && isInitializedRef.current) {
                        addViolation('display_change', 'Display configuration changed');
                    }
                }
            } catch (err) {
                // Silent fail - not all browsers support this
            }
        };

        // Fullscreen reminder interval (every 10 seconds)
        let fullscreenReminderInterval: NodeJS.Timeout | null = null;
        if (mergedConfig.requireFullscreen) {
            fullscreenReminderInterval = setInterval(() => {
                if (!isFullscreenRef.current && isInitializedRef.current) {
                    console.log('⚠️ [SECURITY] Fullscreen reminder - not in fullscreen');
                    showWarningToast('Please return to fullscreen mode. Press F to continue.');
                }
            }, 10000);
        }

        // Display change check interval (every 2 seconds)
        const displayCheckInterval = setInterval(checkDisplayChange, 2000);

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
            if (fullscreenReminderInterval) clearInterval(fullscreenReminderInterval);
            clearInterval(displayCheckInterval);
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
        cleanup: stopWebcam,
        violationCount: violationCountRef.current,
    };
}

export default useQuizSecurity;
