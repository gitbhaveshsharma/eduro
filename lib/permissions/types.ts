/**
 * Browser Permission System - Type Definitions
 * 
 * Comprehensive type definitions for browser-level permissions
 * (geolocation, notifications, camera, microphone, etc.)
 */

/**
 * Supported browser permission types
 */
export enum BrowserPermissionType {
    GEOLOCATION = 'geolocation',
    NOTIFICATIONS = 'notifications',
    CAMERA = 'camera',
    MICROPHONE = 'microphone',
    CLIPBOARD_READ = 'clipboard-read',
    CLIPBOARD_WRITE = 'clipboard-write',
    PERSISTENT_STORAGE = 'persistent-storage',
    BACKGROUND_SYNC = 'background-sync',
    MIDI = 'midi',
}

/**
 * Permission state values
 */
export enum PermissionState {
    GRANTED = 'granted',
    DENIED = 'denied',
    PROMPT = 'prompt',
    UNSUPPORTED = 'unsupported',
    ERROR = 'error',
}

/**
 * Permission request result
 */
export interface PermissionResult {
    permission: BrowserPermissionType;
    state: PermissionState;
    timestamp: number;
    error?: string;
}

/**
 * Permission configuration for a page/component
 */
export interface PermissionConfig {
    /** Permission type */
    type: BrowserPermissionType;
    /** Whether this permission is required (blocks rendering if denied) */
    required?: boolean;
    /** Whether to request automatically on mount */
    autoRequest?: boolean;
    /** Custom message to show when requesting permission */
    requestMessage?: string;
    /** Custom message to show when permission is denied */
    deniedMessage?: string;
    /** Callback when permission is granted */
    onGranted?: () => void | Promise<void>;
    /** Callback when permission is denied */
    onDenied?: () => void | Promise<void>;
    /** Callback when permission state changes */
    onStateChange?: (state: PermissionState) => void;
}

/**
 * Multiple permissions configuration
 */
export interface PermissionsConfig {
    permissions: PermissionConfig[];
    /** Strategy when multiple permissions are required */
    strategy?: 'all' | 'any';
    /** Whether to show a single combined prompt or individual prompts */
    combinedPrompt?: boolean;
    /** Custom component to show while checking permissions */
    LoadingComponent?: React.ComponentType;
    /** Custom component to show when permissions are denied */
    DeniedComponent?: React.ComponentType<{ permissions: PermissionConfig[] }>;
}

/**
 * Permission check options
 */
export interface PermissionCheckOptions {
    /** Whether to cache the result */
    cache?: boolean;
    /** Cache duration in milliseconds (default: 5 minutes) */
    cacheDuration?: number;
    /** Whether to listen for permission changes */
    watchChanges?: boolean;
}

/**
 * Geolocation options
 */
export interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

/**
 * Notification options
 */
export interface NotificationOptions {
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
}

/**
 * Media stream constraints
 */
export interface MediaStreamOptions {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
}

/**
 * Permission store state
 */
export interface PermissionStoreState {
    permissions: Map<BrowserPermissionType, PermissionResult>;
    loading: Set<BrowserPermissionType>;
    watchers: Map<BrowserPermissionType, PermissionStatus>;
}

/**
 * Permission context value
 */
export interface PermissionContextValue {
    /** Check if a permission is granted */
    isGranted: (type: BrowserPermissionType) => boolean;
    /** Check if a permission is denied */
    isDenied: (type: BrowserPermissionType) => boolean;
    /** Check if a permission is in prompt state */
    isPrompt: (type: BrowserPermissionType) => boolean;
    /** Get current permission state */
    getState: (type: BrowserPermissionType) => PermissionState;
    /** Request a permission */
    request: (config: PermissionConfig) => Promise<PermissionResult>;
    /** Request multiple permissions */
    requestMultiple: (configs: PermissionConfig[]) => Promise<PermissionResult[]>;
    /** Check if permission API is supported */
    isSupported: (type: BrowserPermissionType) => boolean;
    /** Get all permissions state */
    getAllStates: () => Map<BrowserPermissionType, PermissionResult>;
    /** Reset permission cache */
    resetCache: () => void;
}

/**
 * Permission prompt component props
 */
export interface PermissionPromptProps {
    config: PermissionConfig;
    onRequest: () => void;
    onCancel?: () => void;
    isRequesting: boolean;
}

/**
 * Permission denied component props
 */
export interface PermissionDeniedProps {
    permissions: PermissionConfig[];
    onRetry?: () => void;
    onDismiss?: () => void;
}
