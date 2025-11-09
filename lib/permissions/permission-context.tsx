/**
 * Browser Permission Context
 * 
 * Global context for managing browser permissions across the app
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { permissionManager } from './permission-manager';
import {
    BrowserPermissionType,
    PermissionState,
    PermissionResult,
    PermissionConfig,
    PermissionContextValue,
} from './types';

const PermissionContext = createContext<PermissionContextValue | null>(null);

export interface PermissionProviderProps {
    children: React.ReactNode;
    /** Permissions to check on mount */
    initialPermissions?: BrowserPermissionType[];
    /** Whether to watch for permission changes */
    watchChanges?: boolean;
}

export function PermissionProvider({
    children,
    initialPermissions = [],
    watchChanges = true,
}: PermissionProviderProps) {
    const [permissions, setPermissions] = useState<Map<BrowserPermissionType, PermissionResult>>(
        new Map()
    );
    const [loading, setLoading] = useState<Set<BrowserPermissionType>>(new Set());

    /**
     * Check if a permission is granted
     */
    const isGranted = useCallback(
        (type: BrowserPermissionType): boolean => {
            const permission = permissions.get(type);
            return permission?.state === PermissionState.GRANTED;
        },
        [permissions]
    );

    /**
     * Check if a permission is denied
     */
    const isDenied = useCallback(
        (type: BrowserPermissionType): boolean => {
            const permission = permissions.get(type);
            return permission?.state === PermissionState.DENIED;
        },
        [permissions]
    );

    /**
     * Check if a permission is in prompt state
     */
    const isPrompt = useCallback(
        (type: BrowserPermissionType): boolean => {
            const permission = permissions.get(type);
            return permission?.state === PermissionState.PROMPT || !permission;
        },
        [permissions]
    );

    /**
     * Get current permission state
     */
    const getState = useCallback(
        (type: BrowserPermissionType): PermissionState => {
            const permission = permissions.get(type);
            return permission?.state || PermissionState.PROMPT;
        },
        [permissions]
    );

    /**
     * Check if permission is supported
     */
    const isSupported = useCallback((type: BrowserPermissionType): boolean => {
        return permissionManager.isPermissionSupported(type);
    }, []);

    /**
     * Update permission in state
     */
    const updatePermission = useCallback((result: PermissionResult) => {
        setPermissions((prev) => {
            const next = new Map(prev);
            next.set(result.permission, result);
            return next;
        });
    }, []);

    /**
     * Request a single permission
     */
    const request = useCallback(
        async (config: PermissionConfig): Promise<PermissionResult> => {
            const { type, onGranted, onDenied, onStateChange } = config;

            // Add to loading state
            setLoading((prev) => new Set(prev).add(type));

            try {
                // Request the permission
                const result = await permissionManager.requestPermission(type);

                // Update state
                updatePermission(result);

                // Call callbacks
                if (result.state === PermissionState.GRANTED && onGranted) {
                    await onGranted();
                } else if (result.state === PermissionState.DENIED && onDenied) {
                    await onDenied();
                }

                if (onStateChange) {
                    onStateChange(result.state);
                }

                return result;
            } finally {
                // Remove from loading state
                setLoading((prev) => {
                    const next = new Set(prev);
                    next.delete(type);
                    return next;
                });
            }
        },
        [updatePermission]
    );

    /**
     * Request multiple permissions
     */
    const requestMultiple = useCallback(
        async (configs: PermissionConfig[]): Promise<PermissionResult[]> => {
            const results = await Promise.all(configs.map((config) => request(config)));
            return results;
        },
        [request]
    );

    /**
     * Get all permissions state
     */
    const getAllStates = useCallback((): Map<BrowserPermissionType, PermissionResult> => {
        return new Map(permissions);
    }, [permissions]);

    /**
     * Reset cache
     */
    const resetCache = useCallback(() => {
        permissionManager.clearCache();
        setPermissions(new Map());
    }, []);

    /**
     * Check initial permissions on mount
     */
    useEffect(() => {
        if (initialPermissions.length === 0) return;

        const checkPermissions = async () => {
            for (const type of initialPermissions) {
                const result = await permissionManager.checkPermission(type, {
                    watchChanges,
                });
                updatePermission(result);
            }
        };

        checkPermissions();
    }, []); // Only run once on mount

    /**
     * Cleanup watchers on unmount
     */
    useEffect(() => {
        return () => {
            permissionManager.clearWatchers();
        };
    }, []);

    const contextValue: PermissionContextValue = {
        isGranted,
        isDenied,
        isPrompt,
        getState,
        request,
        requestMultiple,
        isSupported,
        getAllStates,
        resetCache,
    };

    return (
        <PermissionContext.Provider value={contextValue}>
            {children}
        </PermissionContext.Provider>
    );
}

/**
 * Hook to use permission context
 */
export function usePermissionContext(): PermissionContextValue {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissionContext must be used within PermissionProvider');
    }
    return context;
}
