/**
 * Browser Permission Manager
 * 
 * Core logic for checking and requesting browser permissions
 * Handles geolocation, notifications, media devices, and other browser APIs
 */

import {
    BrowserPermissionType,
    PermissionState,
    PermissionResult,
    PermissionCheckOptions,
    GeolocationOptions,
    MediaStreamOptions,
} from './types';

/**
 * Permission cache with TTL
 */
class PermissionCache {
    private cache = new Map<string, { result: PermissionResult; expiresAt: number }>();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes

    set(key: string, result: PermissionResult, ttl?: number): void {
        const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
        this.cache.set(key, { result, expiresAt });
    }

    get(key: string): PermissionResult | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return cached.result;
    }

    clear(): void {
        this.cache.clear();
    }

    clearPermission(type: BrowserPermissionType): void {
        this.cache.delete(type);
    }
}

/**
 * Browser Permission Manager
 */
export class BrowserPermissionManager {
    private static instance: BrowserPermissionManager;
    private cache = new PermissionCache();
    private watchers = new Map<BrowserPermissionType, PermissionStatus>();

    private constructor() { }

    static getInstance(): BrowserPermissionManager {
        if (!BrowserPermissionManager.instance) {
            BrowserPermissionManager.instance = new BrowserPermissionManager();
        }
        return BrowserPermissionManager.instance;
    }

    /**
     * Check if browser supports the Permissions API
     */
    isPermissionsAPISupported(): boolean {
        return typeof navigator !== 'undefined' && 'permissions' in navigator;
    }

    /**
     * Check if a specific permission is supported
     */
    isPermissionSupported(type: BrowserPermissionType): boolean {
        if (typeof navigator === 'undefined') return false;

        switch (type) {
            case BrowserPermissionType.GEOLOCATION:
                return 'geolocation' in navigator;
            case BrowserPermissionType.NOTIFICATIONS:
                return 'Notification' in window;
            case BrowserPermissionType.CAMERA:
            case BrowserPermissionType.MICROPHONE:
                return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
            case BrowserPermissionType.CLIPBOARD_READ:
            case BrowserPermissionType.CLIPBOARD_WRITE:
                return 'clipboard' in navigator;
            case BrowserPermissionType.PERSISTENT_STORAGE:
                return 'storage' in navigator && 'persist' in navigator.storage;
            case BrowserPermissionType.BACKGROUND_SYNC:
                return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
            case BrowserPermissionType.MIDI:
                return 'requestMIDIAccess' in navigator;
            default:
                return false;
        }
    }

    /**
     * Get permission name for Permissions API query
     */
    private getPermissionName(type: BrowserPermissionType): PermissionName | null {
        const permissionMap: Partial<Record<BrowserPermissionType, PermissionName>> = {
            [BrowserPermissionType.GEOLOCATION]: 'geolocation',
            [BrowserPermissionType.NOTIFICATIONS]: 'notifications',
            [BrowserPermissionType.CAMERA]: 'camera',
            [BrowserPermissionType.MICROPHONE]: 'microphone',
            [BrowserPermissionType.CLIPBOARD_READ]: 'clipboard-read' as PermissionName,
            [BrowserPermissionType.CLIPBOARD_WRITE]: 'clipboard-write' as PermissionName,
            [BrowserPermissionType.PERSISTENT_STORAGE]: 'persistent-storage' as PermissionName,
            [BrowserPermissionType.MIDI]: 'midi' as PermissionName,
        };

        return permissionMap[type] || null;
    }

    /**
     * Check current permission state without requesting
     */
    async checkPermission(
        type: BrowserPermissionType,
        options: PermissionCheckOptions = {}
    ): Promise<PermissionResult> {
        const { cache = true, cacheDuration, watchChanges = false } = options;

        // Check cache first
        if (cache) {
            const cached = this.cache.get(type);
            if (cached) return cached;
        }

        // Check if supported
        if (!this.isPermissionSupported(type)) {
            return {
                permission: type,
                state: PermissionState.UNSUPPORTED,
                timestamp: Date.now(),
                error: 'Permission not supported in this browser',
            };
        }

        try {
            let state: PermissionState;

            // Special handling for different permission types
            if (type === BrowserPermissionType.NOTIFICATIONS) {
                state = this.mapNotificationState(Notification.permission);
            } else if (this.isPermissionsAPISupported()) {
                const permissionName = this.getPermissionName(type);
                if (permissionName) {
                    try {
                        const permissionStatus = await navigator.permissions.query({ name: permissionName });
                        state = this.mapPermissionState(permissionStatus.state);

                        // Setup watcher if requested
                        if (watchChanges && !this.watchers.has(type)) {
                            this.watchers.set(type, permissionStatus);
                            permissionStatus.addEventListener('change', () => {
                                this.cache.clearPermission(type);
                            });
                        }
                    } catch (queryError) {
                        // If Permissions API query fails (e.g., Permissions-Policy blocked),
                        // try to detect actual permission state through feature detection
                        if (type === BrowserPermissionType.GEOLOCATION) {
                            // For geolocation, try a test call with timeout to detect state
                            state = await this.detectGeolocationState();
                        } else {
                            // For other permissions, assume PROMPT if query fails
                            state = PermissionState.PROMPT;
                        }
                    }
                } else {
                    state = PermissionState.PROMPT;
                }
            } else {
                state = PermissionState.PROMPT;
            }

            const result: PermissionResult = {
                permission: type,
                state,
                timestamp: Date.now(),
            };

            // Cache the result
            if (cache) {
                this.cache.set(type, result, cacheDuration);
            }

            return result;
        } catch (error) {
            return {
                permission: type,
                state: PermissionState.ERROR,
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Request permission from user
     */
    async requestPermission(
        type: BrowserPermissionType,
        options?: GeolocationOptions | MediaStreamOptions
    ): Promise<PermissionResult> {
        console.log('🔵 [PERMISSION MANAGER] requestPermission called for:', type);

        // Clear cache for this permission
        this.cache.clearPermission(type);

        if (!this.isPermissionSupported(type)) {
            console.log('❌ [PERMISSION MANAGER] Permission not supported:', type);
            return {
                permission: type,
                state: PermissionState.UNSUPPORTED,
                timestamp: Date.now(),
                error: 'Permission not supported in this browser',
            };
        }

        try {
            let state: PermissionState;

            console.log('🟢 [PERMISSION MANAGER] About to call request handler for:', type);

            switch (type) {
                case BrowserPermissionType.GEOLOCATION:
                    console.log('📍 [PERMISSION MANAGER] Calling requestGeolocation...');
                    state = await this.requestGeolocation(options as GeolocationOptions);
                    console.log('📍 [PERMISSION MANAGER] requestGeolocation returned:', state);
                    break;

                case BrowserPermissionType.NOTIFICATIONS:
                    console.log('🔔 [PERMISSION MANAGER] Calling requestNotifications...');
                    state = await this.requestNotifications();
                    console.log('🔔 [PERMISSION MANAGER] requestNotifications returned:', state);
                    break;

                case BrowserPermissionType.CAMERA:
                    console.log('📷 [PERMISSION MANAGER] Calling requestCamera...');
                    state = await this.requestCamera(options as MediaStreamOptions);
                    console.log('📷 [PERMISSION MANAGER] requestCamera returned:', state);
                    break;

                case BrowserPermissionType.MICROPHONE:
                    console.log('🎤 [PERMISSION MANAGER] Calling requestMicrophone...');
                    state = await this.requestMicrophone(options as MediaStreamOptions);
                    console.log('🎤 [PERMISSION MANAGER] requestMicrophone returned:', state);
                    break;

                case BrowserPermissionType.CLIPBOARD_READ:
                    state = await this.requestClipboardRead();
                    break;

                case BrowserPermissionType.CLIPBOARD_WRITE:
                    state = await this.requestClipboardWrite();
                    break;

                case BrowserPermissionType.PERSISTENT_STORAGE:
                    state = await this.requestPersistentStorage();
                    break;

                default:
                    state = PermissionState.UNSUPPORTED;
            }

            const result: PermissionResult = {
                permission: type,
                state,
                timestamp: Date.now(),
            };

            console.log('✅ [PERMISSION MANAGER] Request successful:', result);

            // Cache the result
            this.cache.set(type, result);

            return result;
        } catch (error) {
            console.error('❌ [PERMISSION MANAGER] Request failed:', error);
            return {
                permission: type,
                state: PermissionState.DENIED,
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : 'Permission denied',
            };
        }
    }

    /**
     * Detect geolocation state by attempting a quick position check
     * Used when Permissions API query fails but we need to know actual state
     */
    private async detectGeolocationState(): Promise<PermissionState> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(PermissionState.PROMPT);
            }, 100);

            navigator.geolocation.getCurrentPosition(
                () => {
                    clearTimeout(timeout);
                    resolve(PermissionState.GRANTED);
                },
                (error) => {
                    clearTimeout(timeout);
                    if (error.code === error.PERMISSION_DENIED) {
                        resolve(PermissionState.DENIED);
                    } else {
                        resolve(PermissionState.PROMPT);
                    }
                },
                { timeout: 100, maximumAge: Infinity }
            );
        });
    }

    /**
     * Request geolocation permission
     */
    private async requestGeolocation(options?: GeolocationOptions): Promise<PermissionState> {
        console.log('📍 [GEOLOCATION] requestGeolocation starting...');

        try {
            // Go DIRECTLY to getCurrentPosition to trigger native browser prompt
            console.log('📍 [GEOLOCATION] Calling navigator.geolocation.getCurrentPosition DIRECTLY (no pre-check)...');

            return await new Promise<PermissionState>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        console.log('✅ [GEOLOCATION] getCurrentPosition SUCCESS - User allowed!');
                        resolve(PermissionState.GRANTED);
                    },
                    (error) => {
                        console.error('❌ [GEOLOCATION] getCurrentPosition ERROR:', {
                            code: error.code,
                            message: error.message,
                            PERMISSION_DENIED: error.PERMISSION_DENIED,
                        });

                        // Check if error is due to Permissions-Policy blocking
                        if (error.message && error.message.includes('permissions policy')) {
                            console.error('🚨 [GEOLOCATION] BLOCKED BY PERMISSIONS-POLICY HEADER!');
                            console.error('🔧 [GEOLOCATION] Fix: Update lib/middleware/config.ts');
                            console.error('    Change: permissionsPolicy: "geolocation=()" ');
                            console.error('    To:     permissionsPolicy: "geolocation=(self)"');
                            throw new Error(
                                'Geolocation blocked by Permissions-Policy header. ' +
                                'Update lib/middleware/config.ts to allow geolocation=(self)'
                            );
                        }

                        if (error && typeof error.code !== 'undefined' && error.code === error.PERMISSION_DENIED) {
                            resolve(PermissionState.DENIED);
                        } else {
                            resolve(PermissionState.ERROR);
                        }
                    },
                    options
                );
            });
        } catch (error) {
            console.error('❌ [GEOLOCATION] requestGeolocation failed:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Geolocation request failed');
        }
    }    /**
     * Request notifications permission
     */
    private async requestNotifications(): Promise<PermissionState> {
        const permission = await Notification.requestPermission();
        return this.mapNotificationState(permission);
    }

    /**
     * Request camera permission
     */
    private async requestCamera(options?: MediaStreamOptions): Promise<PermissionState> {
        console.log('📷 [CAMERA] requestCamera starting...');

        try {
            // Go DIRECTLY to getUserMedia to trigger native browser prompt
            console.log('📷 [CAMERA] Calling navigator.mediaDevices.getUserMedia DIRECTLY...');

            const constraints = options || { video: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('✅ [CAMERA] getUserMedia SUCCESS - User allowed!');

            // Stop all tracks immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());

            return PermissionState.GRANTED;
        } catch (error) {
            console.error('❌ [CAMERA] getUserMedia ERROR:', error);

            if (error instanceof DOMException) {
                // Check if error is due to Permissions-Policy blocking
                if (error.message && error.message.toLowerCase().includes('permissions policy')) {
                    console.error('🚨 [CAMERA] BLOCKED BY PERMISSIONS-POLICY HEADER!');
                    console.error('🔧 [CAMERA] Fix: Update lib/middleware/config.ts');
                    console.error('    Change: permissionsPolicy: "camera=()"');
                    console.error('    To:     permissionsPolicy: "camera=(self)"');
                    throw new Error(
                        'Camera blocked by Permissions-Policy header. ' +
                        'Update lib/middleware/config.ts to allow camera=(self)'
                    );
                }

                if (error.name === 'NotAllowedError') {
                    console.log('📷 [CAMERA] User denied permission');
                    return PermissionState.DENIED;
                }
            }

            console.error('📷 [CAMERA] Unexpected error:', error);
            return PermissionState.ERROR;
        }
    }

    /**
     * Request microphone permission
     */
    private async requestMicrophone(options?: MediaStreamOptions): Promise<PermissionState> {
        try {
            const constraints = options || { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Stop all tracks immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());

            return PermissionState.GRANTED;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                return PermissionState.DENIED;
            }
            return PermissionState.ERROR;
        }
    }

    /**
     * Request clipboard read permission
     */
    private async requestClipboardRead(): Promise<PermissionState> {
        try {
            await navigator.clipboard.readText();
            return PermissionState.GRANTED;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                return PermissionState.DENIED;
            }
            return PermissionState.ERROR;
        }
    }

    /**
     * Request clipboard write permission
     */
    private async requestClipboardWrite(): Promise<PermissionState> {
        try {
            await navigator.clipboard.writeText('');
            return PermissionState.GRANTED;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                return PermissionState.DENIED;
            }
            return PermissionState.ERROR;
        }
    }

    /**
     * Request persistent storage permission
     */
    private async requestPersistentStorage(): Promise<PermissionState> {
        try {
            const granted = await navigator.storage.persist();
            return granted ? PermissionState.GRANTED : PermissionState.DENIED;
        } catch (error) {
            return PermissionState.ERROR;
        }
    }

    /**
     * Map Notification permission to PermissionState
     */
    private mapNotificationState(permission: NotificationPermission): PermissionState {
        switch (permission) {
            case 'granted':
                return PermissionState.GRANTED;
            case 'denied':
                return PermissionState.DENIED;
            case 'default':
                return PermissionState.PROMPT;
            default:
                return PermissionState.PROMPT;
        }
    }

    /**
     * Map PermissionState to our enum
     */
    private mapPermissionState(state: PermissionState | string): PermissionState {
        switch (state) {
            case 'granted':
                return PermissionState.GRANTED;
            case 'denied':
                return PermissionState.DENIED;
            case 'prompt':
                return PermissionState.PROMPT;
            default:
                return PermissionState.PROMPT;
        }
    }

    /**
     * Clear all watchers
     */
    clearWatchers(): void {
        this.watchers.clear();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Export singleton instance
export const permissionManager = BrowserPermissionManager.getInstance();
