/**
 * Permission Configuration Presets
 * 
 * Pre-configured permission setups for common use cases
 */

import { BrowserPermissionType, PermissionConfig } from './types';

/**
 * Location permission config
 */
export const LOCATION_PERMISSION: PermissionConfig = {
    type: BrowserPermissionType.GEOLOCATION,
    required: false,
    autoRequest: false,
    requestMessage: 'We need your location to show you coaching centers and content near you.',
    deniedMessage: 'Location access is required to show nearby content. Please enable it in your browser settings.',
};

/**
 * Notification permission config
 */
export const NOTIFICATION_PERMISSION: PermissionConfig = {
    type: BrowserPermissionType.NOTIFICATIONS,
    required: false,
    autoRequest: false,
    requestMessage: 'Enable notifications to receive updates about your courses, messages, and activities.',
    deniedMessage: 'Notification access is required to receive updates. Please enable it in your browser settings.',
};

/**
 * Camera permission config
 */
export const CAMERA_PERMISSION: PermissionConfig = {
    type: BrowserPermissionType.CAMERA,
    required: true,
    autoRequest: false,
    requestMessage: 'We need access to your camera to take photos for your profile or posts.',
    deniedMessage: 'Camera access is required for this feature. Please enable it in your browser settings.',
};

/**
 * Microphone permission config
 */
export const MICROPHONE_PERMISSION: PermissionConfig = {
    type: BrowserPermissionType.MICROPHONE,
    required: true,
    autoRequest: false,
    requestMessage: 'We need access to your microphone to record audio.',
    deniedMessage: 'Microphone access is required for this feature. Please enable it in your browser settings.',
};

/**
 * Clipboard read permission config
 */
export const CLIPBOARD_READ_PERMISSION: PermissionConfig = {
    type: BrowserPermissionType.CLIPBOARD_READ,
    required: false,
    autoRequest: false,
    requestMessage: 'We need permission to read from your clipboard to paste content.',
    deniedMessage: 'Clipboard read access is required for this feature. Please enable it in your browser settings.',
};

/**
 * Clipboard write permission config
 */
export const CLIPBOARD_WRITE_PERMISSION: PermissionConfig = {
    type: BrowserPermissionType.CLIPBOARD_WRITE,
    required: false,
    autoRequest: false,
    requestMessage: 'We need permission to copy content to your clipboard.',
    deniedMessage: 'Clipboard write access is required for this feature. Please enable it in your browser settings.',
};

/**
 * Common permission combinations
 */
export const PERMISSION_PRESETS = {
    /** Coaching/Location-based features */
    COACHING: [LOCATION_PERMISSION],

    /** Network/Discovery features */
    NETWORK: [LOCATION_PERMISSION, NOTIFICATION_PERMISSION],

    /** Video call features */
    VIDEO_CALL: [CAMERA_PERMISSION, MICROPHONE_PERMISSION],

    /** Audio call features */
    AUDIO_CALL: [MICROPHONE_PERMISSION],

    /** Media upload features */
    MEDIA_UPLOAD: [CAMERA_PERMISSION],

    /** Messaging features */
    MESSAGING: [NOTIFICATION_PERMISSION, CLIPBOARD_WRITE_PERMISSION],

    /** All permissions */
    ALL: [
        LOCATION_PERMISSION,
        NOTIFICATION_PERMISSION,
        CAMERA_PERMISSION,
        MICROPHONE_PERMISSION,
        CLIPBOARD_READ_PERMISSION,
        CLIPBOARD_WRITE_PERMISSION,
    ],
} as const;

/**
 * Page-specific permission configurations
 */
export const PAGE_PERMISSIONS = {
    '/coaching': [LOCATION_PERMISSION],
    '/network': [LOCATION_PERMISSION],
    '/messages': [NOTIFICATION_PERMISSION],
    '/video-call': [CAMERA_PERMISSION, MICROPHONE_PERMISSION],
    '/settings/profile': [],
} as const;

/**
 * Get permissions for a page route
 */
export function getPagePermissions(route: string): PermissionConfig[] {
    // Check for exact match
    if (route in PAGE_PERMISSIONS) {
        return [...PAGE_PERMISSIONS[route as keyof typeof PAGE_PERMISSIONS]];
    }

    // Check for partial matches
    for (const [path, permissions] of Object.entries(PAGE_PERMISSIONS)) {
        if (route.startsWith(path)) {
            return [...permissions];
        }
    }

    return [];
}

/**
 * Create custom permission config
 */
export function createPermissionConfig(
    type: BrowserPermissionType,
    options?: Partial<Omit<PermissionConfig, 'type'>>
): PermissionConfig {
    return {
        type,
        required: false,
        autoRequest: false,
        ...options,
    };
}

/**
 * Merge multiple permission configs
 */
export function mergePermissionConfigs(...configs: PermissionConfig[][]): PermissionConfig[] {
    const merged = new Map<BrowserPermissionType, PermissionConfig>();

    configs.flat().forEach((config) => {
        const existing = merged.get(config.type);
        if (!existing || config.required) {
            merged.set(config.type, config);
        }
    });

    return Array.from(merged.values());
}
