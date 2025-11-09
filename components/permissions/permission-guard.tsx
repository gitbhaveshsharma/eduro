/**
 * Browser Permission Guard
 * 
 * Higher-Order Component and wrapper for automatic permission handling
 * Blocks component rendering until required permissions are granted
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/use-browser-permission';
import {
    BrowserPermissionType,
    PermissionConfig,
    PermissionState,
} from '@/lib/permissions/types';
import {
    PermissionPrompt,
    PermissionDenied,
    MultiplePermissionsPrompt,
    permissionToasts,
} from './permission-ui';
import { Skeleton } from '@/components/ui/skeleton';
import { showInfoToast, showLoadingToast, dismissAllToasts } from '@/lib/toast';

/**
 * Permission guard configuration
 */
export interface PermissionGuardConfig {
    /** Permissions required */
    permissions: PermissionConfig[];
    /** Strategy: 'all' requires all permissions, 'any' requires at least one */
    strategy?: 'all' | 'any';
    /** Whether permissions are strictly required (blocks content if false) */
    strictMode?: boolean;
    /** Whether to show a loading state while checking permissions */
    showLoading?: boolean;
    /** Custom loading component */
    LoadingComponent?: React.ComponentType;
    /** Custom denied component */
    DeniedComponent?: React.ComponentType<{ permissions: PermissionConfig[] }>;
    /** Whether to auto-request permissions using native browser prompts (default: true) */
    autoRequest?: boolean;
    /** Whether to show toast messages for permission states (default: true) */
    showToastMessages?: boolean;
    /** Callback when all required permissions are granted */
    onAllGranted?: () => void;
    /** Callback when any permission is denied */
    onDenied?: () => void;
}

/**
 * Permission Guard Component
 * Wraps children and shows permission prompts as needed
 */
export interface PermissionGuardProps extends PermissionGuardConfig {
    children: React.ReactNode;
}

export function PermissionGuard({
    children,
    permissions,
    strategy = 'all',
    strictMode = false,
    showLoading = true,
    LoadingComponent,
    DeniedComponent,
    autoRequest = true,
    showToastMessages = true,
    onAllGranted,
    onDenied,
}: PermissionGuardProps) {
    const [hasChecked, setHasChecked] = useState(false);
    const [hasRequestedPrompt, setHasRequestedPrompt] = useState(false);
    const [requestedPermissions, setRequestedPermissions] = useState<Set<BrowserPermissionType>>(new Set());
    const [toastId, setToastId] = useState<string | null>(null);

    const {
        states,
        allGranted,
        anyGranted,
        allDenied,
        isRequesting,
        requestAll,
        request,
        recheckAll,
    } = usePermissions(permissions, {
        autoRequest,
    });

    // Check if all permissions are required
    const allRequired = permissions.every((p) => p.required !== false);
    const hasRequiredPermissions = allRequired || strictMode;

    // Determine if we should render children
    const shouldRenderChildren =
        strategy === 'all' ? allGranted : strategy === 'any' ? anyGranted : false;

    // Get permissions that are denied
    const deniedPermissions = permissions.filter((p) => {
        const state = states.get(p.type);
        return state === PermissionState.DENIED;
    });

    // Get permissions that need to be requested
    const promptPermissions = permissions.filter((p) => {
        const state = states.get(p.type);
        return state === PermissionState.PROMPT || !state;
    });

    // Call callbacks
    useEffect(() => {
        if (hasChecked) {
            if (shouldRenderChildren && onAllGranted) {
                onAllGranted();
            } else if (deniedPermissions.length > 0 && onDenied) {
                onDenied();
            }
        }
    }, [shouldRenderChildren, deniedPermissions.length, hasChecked, onAllGranted, onDenied]);

    // Mark as checked after first render
    useEffect(() => {
        if (!hasChecked && states.size > 0) {
            setHasChecked(true);
        }
    }, [states.size, hasChecked]);

    // Show toast messages for permission states
    useEffect(() => {
        if (!hasChecked || !showToastMessages) return;

        // Show loading toast when requesting
        if (isRequesting && promptPermissions.length > 0 && !toastId) {
            const loadingToast = showLoadingToast('Requesting permissions...');
            setToastId(loadingToast);
        }

        // Show success toast when permissions are granted
        if (shouldRenderChildren && toastId) {
            dismissAllToasts();
            setToastId(null);
            if (permissions.length === 1) {
                permissionToasts.granted(permissions[0].type);
            } else {
                permissionToasts.multipleGranted(permissions.length);
            }
        }

        // Show error toast when permissions are denied
        if (deniedPermissions.length > 0 && promptPermissions.length === 0 && toastId) {
            dismissAllToasts();
            setToastId(null);
            if (deniedPermissions.length === 1) {
                permissionToasts.denied(deniedPermissions[0].type);
            } else {
                permissionToasts.multipleDenied(deniedPermissions.length);
            }
        }
    }, [hasChecked, isRequesting, shouldRenderChildren, deniedPermissions.length, promptPermissions.length, showToastMessages, toastId, permissions]);

    // Handle requesting individual permission via UI
    const handleRequestIndividual = async (type: BrowserPermissionType) => {
        setRequestedPermissions((prev) => {
            const next = new Set(prev);
            next.add(type);
            return next;
        });
        setHasRequestedPrompt(true);

        if (showToastMessages) {
            dismissAllToasts();
            const loadingToast = showLoadingToast(`Requesting ${getPermissionTitle(type)}...`);
            setToastId(loadingToast);
        }

        const result = await request(type);

        if (showToastMessages && toastId) {
            dismissAllToasts();
            setToastId(null);

            if (result.state === PermissionState.GRANTED) {
                permissionToasts.granted(type);
            } else if (result.state === PermissionState.DENIED) {
                permissionToasts.denied(type);
            }
        }
    };

    // Handle requesting all permissions at once
    const handleRequestAll = async () => {
        setRequestedPermissions((prev) => {
            const next = new Set(prev);
            permissions.forEach((config) => next.add(config.type));
            return next;
        });
        setHasRequestedPrompt(true);

        if (showToastMessages) {
            dismissAllToasts();
            const loadingToast = showLoadingToast('Requesting permissions...');
            setToastId(loadingToast);
        }

        const result = await requestAll();

        if (showToastMessages && toastId) {
            dismissAllToasts();
            setToastId(null);

            const grantedCount = result.filter(r => r.state === PermissionState.GRANTED).length;
            const deniedCount = result.filter(r => r.state === PermissionState.DENIED).length;

            if (grantedCount > 0) {
                permissionToasts.multipleGranted(grantedCount);
            }
            if (deniedCount > 0) {
                permissionToasts.multipleDenied(deniedCount);
            }
        }
    };

    // Auto-trigger native browser prompts immediately for PROMPT state permissions
    useEffect(() => {
        if (hasChecked && !hasRequestedPrompt && promptPermissions.length > 0 && autoRequest) {
            setHasRequestedPrompt(true);

            // Show info toast about auto-request
            if (showToastMessages && promptPermissions.length === 1) {
                showInfoToast(`Requesting ${getPermissionTitle(promptPermissions[0].type)}...`);
            } else if (showToastMessages) {
                showInfoToast('Requesting permissions...');
            }

            // Trigger native browser prompts immediately
            const triggerPrompts = async () => {
                for (const config of promptPermissions) {
                    try {
                        setRequestedPermissions((prev) => {
                            const next = new Set(prev);
                            next.add(config.type);
                            return next;
                        });
                        await request(config.type);
                    } catch (error) {
                        console.error(`Failed to request ${config.type}:`, error);
                    }
                }
            };

            triggerPrompts();
        }
    }, [hasChecked, hasRequestedPrompt, promptPermissions.length, autoRequest, request, showToastMessages]);

    // Handle retry after denial
    const handleRetry = async () => {
        setHasRequestedPrompt(false);
        setRequestedPermissions(new Set());
        await recheckAll();
    };

    // Show loading state while checking initial permissions
    if (!hasChecked && showLoading) {
        if (LoadingComponent) {
            return <LoadingComponent />;
        }
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    // If permissions are granted, just show children
    if (shouldRenderChildren) {
        return <>{children}</>;
    }

    // STRICT MODE: Block content if required permissions are denied
    if (hasRequiredPermissions && strictMode) {
        // Show denied state if any required permission is denied
        if (deniedPermissions.length > 0 && promptPermissions.length === 0) {
            if (DeniedComponent) {
                return <DeniedComponent permissions={deniedPermissions} />;
            }
            return (
                <div className="p-4">
                    <PermissionDenied permissions={deniedPermissions} onRetry={handleRetry} />
                </div>
            );
        }

        // Show loading state (native browser prompt is active)
        if (promptPermissions.length > 0 && hasRequestedPrompt) {
            if (LoadingComponent) {
                return <LoadingComponent />;
            }
            return (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            );
        }

        // Show prompt UI for pending permissions (only in strict mode when auto-request is false)
        if (promptPermissions.length > 0 && !autoRequest) {
            if (promptPermissions.length > 1) {
                return (
                    <div className="p-4">
                        <MultiplePermissionsPrompt
                            permissions={promptPermissions}
                            onRequestAll={handleRequestAll}
                            onRequestIndividual={handleRequestIndividual}
                            isRequesting={isRequesting}
                            requestedPermissions={requestedPermissions}
                        />
                    </div>
                );
            }

            return (
                <div className="p-4 space-y-4">
                    {promptPermissions.map((config) => (
                        <PermissionPrompt
                            key={config.type}
                            config={config}
                            onRequest={() => handleRequestIndividual(config.type)}
                            isRequesting={isRequesting}
                        />
                    ))}
                </div>
            );
        }

        // In auto-request mode, just show loading while waiting for native prompt
        if (promptPermissions.length > 0) {
            if (LoadingComponent) {
                return <LoadingComponent />;
            }
            return (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            );
        }
    }

    // NON-STRICT MODE: Render children with toast notifications only
    return <>{children}</>;
}

/**
 * Higher-Order Component for permission guarding
 */
export function withPermissionGuard<P extends object>(
    Component: React.ComponentType<P>,
    config: PermissionGuardConfig
) {
    const WrappedComponent = (props: P) => {
        return (
            <PermissionGuard {...config}>
                <Component {...props} />
            </PermissionGuard>
        );
    };

    WrappedComponent.displayName = `withPermissionGuard(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
}

/**
 * Permission Gate - Simple inline permission check
 */
export interface PermissionGateProps {
    type: BrowserPermissionType;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    autoRequest?: boolean;
    showToast?: boolean;
}

export function PermissionGate({
    type,
    children,
    fallback = null,
    autoRequest = true,
    showToast = true,
}: PermissionGateProps) {
    const config: PermissionConfig = { type, autoRequest };

    return (
        <PermissionGuard
            permissions={[config]}
            strategy="all"
            autoRequest={autoRequest}
            showLoading={false}
            showToastMessages={showToast}
            DeniedComponent={() => <>{fallback}</>}
        >
            {children}
        </PermissionGuard>
    );
}

// Helper function to get permission title (moved from permission-ui)
function getPermissionTitle(type: BrowserPermissionType): string {
    switch (type) {
        case BrowserPermissionType.GEOLOCATION:
            return 'Location Access';
        case BrowserPermissionType.NOTIFICATIONS:
            return 'Notifications';
        case BrowserPermissionType.CAMERA:
            return 'Camera Access';
        case BrowserPermissionType.MICROPHONE:
            return 'Microphone Access';
        case BrowserPermissionType.CLIPBOARD_READ:
            return 'Clipboard Read Access';
        case BrowserPermissionType.CLIPBOARD_WRITE:
            return 'Clipboard Write Access';
        case BrowserPermissionType.PERSISTENT_STORAGE:
            return 'Storage Access';
        default:
            return 'Permission Required';
    }
}