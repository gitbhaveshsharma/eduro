/**
 * Browser Permission Hook
 * 
 * Easy-to-use React hook for managing browser permissions in components
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { permissionManager } from '@/lib/permissions/permission-manager';
import {
    BrowserPermissionType,
    PermissionState,
    PermissionResult,
    PermissionConfig,
    PermissionCheckOptions,
} from '@/lib/permissions/types';

export interface UsePermissionOptions {
    /** Whether to request permission automatically on mount */
    autoRequest?: boolean;
    /** Whether to re-check permission on component mount */
    recheckOnMount?: boolean;
    /** Whether to cache the result */
    cache?: boolean;
    /** Cache duration in milliseconds (default: 5 minutes) */
    cacheDuration?: number;
    /** Whether to listen for permission changes */
    watchChanges?: boolean;
    /** Callback when permission is granted */
    onGranted?: () => void | Promise<void>;
    /** Callback when permission is denied */
    onDenied?: () => void | Promise<void>;
    /** Callback when permission state changes */
    onStateChange?: (state: PermissionState) => void;
}

export interface UsePermissionReturn {
    /** Current permission state */
    state: PermissionState;
    /** Whether the permission is granted */
    isGranted: boolean;
    /** Whether the permission is denied */
    isDenied: boolean;
    /** Whether the permission is in prompt state */
    isPrompt: boolean;
    /** Whether the permission is supported */
    isSupported: boolean;
    /** Whether a permission request is in progress */
    isRequesting: boolean;
    /** Error message if any */
    error: string | null;
    /** Request the permission */
    request: () => Promise<PermissionResult>;
    /** Re-check permission status */
    recheck: () => Promise<void>;
    /** Permission result */
    result: PermissionResult | null;
}

/**
 * Hook for managing a single browser permission
 */
export function usePermission(
    type: BrowserPermissionType,
    options: UsePermissionOptions = {}
): UsePermissionReturn {
    const {
        autoRequest = false,
        recheckOnMount = true,
        cache = true,
        cacheDuration,
        watchChanges = true,
        onGranted,
        onDenied,
        onStateChange,
    } = options;

    const [result, setResult] = useState<PermissionResult | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const hasAutoRequested = useRef(false);

    const state = result?.state || PermissionState.PROMPT;
    const isGranted = state === PermissionState.GRANTED;
    const isDenied = state === PermissionState.DENIED;
    const isPrompt = state === PermissionState.PROMPT;
    const isSupported = permissionManager.isPermissionSupported(type);
    const error = result?.error || null;

    /**
     * Re-check permission status
     */
    const recheck = useCallback(async () => {
        const checkResult = await permissionManager.checkPermission(type, {
            cache,
            cacheDuration,
            watchChanges,
        });
        setResult(checkResult);

        if (onStateChange) {
            onStateChange(checkResult.state);
        }
    }, [type, cache, cacheDuration, watchChanges, onStateChange]);

    /**
     * Request permission
     */
    const request = useCallback(async (): Promise<PermissionResult> => {
        setIsRequesting(true);

        try {
            const requestResult = await permissionManager.requestPermission(type);
            setResult(requestResult);

            // Call callbacks
            if (requestResult.state === PermissionState.GRANTED && onGranted) {
                await onGranted();
            } else if (requestResult.state === PermissionState.DENIED && onDenied) {
                await onDenied();
            }

            if (onStateChange) {
                onStateChange(requestResult.state);
            }

            return requestResult;
        } finally {
            setIsRequesting(false);
        }
    }, [type, onGranted, onDenied, onStateChange]);

    /**
     * Check permission on mount
     */
    useEffect(() => {
        if (recheckOnMount) {
            recheck();
        }
    }, [recheckOnMount]); // Only run on mount

    /**
     * Auto-request if enabled
     */
    useEffect(() => {
        if (autoRequest && !hasAutoRequested.current && isSupported) {
            hasAutoRequested.current = true;

            // Only auto-request if not already granted
            if (state === PermissionState.PROMPT || !result) {
                request();
            }
        }
    }, [autoRequest, isSupported, state, result, request]);

    return {
        state,
        isGranted,
        isDenied,
        isPrompt,
        isSupported,
        isRequesting,
        error,
        request,
        recheck,
        result,
    };
}

/**
 * Hook for managing multiple permissions
 */
export interface UsePermissionsOptions {
    /** Whether to request all permissions automatically on mount */
    autoRequest?: boolean;
    /** Whether all permissions are required (blocks until all granted) */
    requireAll?: boolean;
    /** Whether any permission is sufficient */
    requireAny?: boolean;
}

export interface UsePermissionsReturn {
    /** Map of permission states */
    states: Map<BrowserPermissionType, PermissionState>;
    /** Whether all permissions are granted */
    allGranted: boolean;
    /** Whether any permission is granted */
    anyGranted: boolean;
    /** Whether all permissions are denied */
    allDenied: boolean;
    /** Whether any permission request is in progress */
    isRequesting: boolean;
    /** Array of permission results */
    results: PermissionResult[];
    /** Request all permissions */
    requestAll: () => Promise<PermissionResult[]>;
    /** Request a specific permission */
    request: (type: BrowserPermissionType) => Promise<PermissionResult>;
    /** Re-check all permissions */
    recheckAll: () => Promise<void>;
}

/**
 * Hook for managing multiple browser permissions
 */
export function usePermissions(
    configs: PermissionConfig[],
    options: UsePermissionsOptions = {}
): UsePermissionsReturn {
    const { autoRequest = false } = options;

    // console.log('🪝 [usePermissions] Hook initialized:', {
    //     configTypes: configs.map(c => c.type),
    //     autoRequest,
    // });

    const [results, setResults] = useState<PermissionResult[]>([]);
    const [isRequesting, setIsRequesting] = useState(false);
    const hasAutoRequested = useRef(false);

    // Compute derived states
    const states = new Map<BrowserPermissionType, PermissionState>();
    results.forEach((result) => {
        states.set(result.permission, result.state);
    });

    const allGranted = results.length > 0 && results.every((r) => r.state === PermissionState.GRANTED);
    const anyGranted = results.some((r) => r.state === PermissionState.GRANTED);
    const allDenied = results.length > 0 && results.every((r) => r.state === PermissionState.DENIED);

    // console.log('🪝 [usePermissions] Current state:', {
    //     resultsCount: results.length,
    //     states: Array.from(states.entries()),
    //     allGranted,
    //     anyGranted,
    //     allDenied,
    //     isRequesting,
    // });

    /**
     * Request a specific permission
     */
    const request = useCallback(
        async (type: BrowserPermissionType): Promise<PermissionResult> => {
            // console.log('🪝 [usePermissions] request() called for:', type);
            const config = configs.find((c) => c.type === type);
            if (!config) {
                throw new Error(`No config found for permission type: ${type}`);
            }

            setIsRequesting(true);

            try {
                // console.log('🪝 [usePermissions] Calling permissionManager.requestPermission...');
                const result = await permissionManager.requestPermission(type);
                // console.log('🪝 [usePermissions] permissionManager.requestPermission returned:', result);

                // Update results
                setResults((prev) => {
                    const filtered = prev.filter((r) => r.permission !== type);
                    const updated = [...filtered, result];
                    // console.log('🪝 [usePermissions] Updated results:', updated);
                    return updated;
                });

                // Call callbacks
                if (result.state === PermissionState.GRANTED && config.onGranted) {
                    // console.log('🪝 [usePermissions] Calling onGranted callback');
                    await config.onGranted();
                } else if (result.state === PermissionState.DENIED && config.onDenied) {
                    // console.log('🪝 [usePermissions] Calling onDenied callback');
                    await config.onDenied();
                }

                if (config.onStateChange) {
                    // console.log('🪝 [usePermissions] Calling onStateChange callback');
                    config.onStateChange(result.state);
                }

                return result;
            } finally {
                setIsRequesting(false);
            }
        },
        [configs]
    );

    /**
     * Request all permissions
     */
    const requestAll = useCallback(async (): Promise<PermissionResult[]> => {
        setIsRequesting(true);

        try {
            const allResults = await Promise.all(
                configs.map((config) => request(config.type))
            );
            return allResults;
        } finally {
            setIsRequesting(false);
        }
    }, [configs, request]);

    /**
     * Re-check all permissions
     */
    const recheckAll = useCallback(async () => {
        const checkResults = await Promise.all(
            configs.map((config) =>
                permissionManager.checkPermission(config.type, {
                    cache: false,
                    watchChanges: true,
                })
            )
        );
        setResults(checkResults);
    }, [configs]);

    /**
     * Check permissions on mount
     */
    useEffect(() => {
        recheckAll();
    }, []); // Only run on mount

    /**
     * Auto-request if enabled
     */
    useEffect(() => {
        if (autoRequest && !hasAutoRequested.current) {
            hasAutoRequested.current = true;

            // Filter configs that need auto-request
            const needsRequest = configs.filter((config) => {
                const result = results.find((r) => r.permission === config.type);
                return !result || result.state === PermissionState.PROMPT;
            });

            if (needsRequest.length > 0) {
                requestAll();
            }
        }
    }, [autoRequest, configs, results, requestAll]);

    return {
        states,
        allGranted,
        anyGranted,
        allDenied,
        isRequesting,
        results,
        requestAll,
        request,
        recheckAll,
    };
}