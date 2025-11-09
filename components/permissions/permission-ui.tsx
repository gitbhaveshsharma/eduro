/**
 * Browser Permission UI Components
 * 
 * Reusable UI components for permission prompts and denied states
 */

'use client';

import React from 'react';
import { MapPin, Bell, Camera, Mic, Clipboard, HardDrive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { showErrorToast, showInfoToast, showSuccessToast } from '@/lib/toast';

import { BrowserPermissionType, PermissionConfig } from '@/lib/permissions/types';

/**
 * Get icon for permission type
 */
function getPermissionIcon(type: BrowserPermissionType): React.ReactNode {
    switch (type) {
        case BrowserPermissionType.GEOLOCATION:
            return <MapPin className="h-8 w-8" />;
        case BrowserPermissionType.NOTIFICATIONS:
            return <Bell className="h-8 w-8" />;
        case BrowserPermissionType.CAMERA:
            return <Camera className="h-8 w-8" />;
        case BrowserPermissionType.MICROPHONE:
            return <Mic className="h-8 w-8" />;
        case BrowserPermissionType.CLIPBOARD_READ:
        case BrowserPermissionType.CLIPBOARD_WRITE:
            return <Clipboard className="h-8 w-8" />;
        case BrowserPermissionType.PERSISTENT_STORAGE:
            return <HardDrive className="h-8 w-8" />;
        default:
            return <MapPin className="h-8 w-8" />;
    }
}

/**
 * Get permission title
 */
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

/**
 * Get default permission description
 */
function getPermissionDescription(type: BrowserPermissionType): string {
    switch (type) {
        case BrowserPermissionType.GEOLOCATION:
            return 'We need access to your location to show you relevant content based on your area.';
        case BrowserPermissionType.NOTIFICATIONS:
            return 'Enable notifications to stay updated with important alerts and messages.';
        case BrowserPermissionType.CAMERA:
            return 'We need access to your camera to capture photos or videos.';
        case BrowserPermissionType.MICROPHONE:
            return 'We need access to your microphone to record audio.';
        case BrowserPermissionType.CLIPBOARD_READ:
            return 'We need permission to read from your clipboard.';
        case BrowserPermissionType.CLIPBOARD_WRITE:
            return 'We need permission to copy content to your clipboard.';
        case BrowserPermissionType.PERSISTENT_STORAGE:
            return 'We need permission to store data persistently on your device.';
        default:
            return 'This feature requires your permission to work properly.';
    }
}

/**
 * Permission Prompt Card
 */
export interface PermissionPromptProps {
    config: PermissionConfig;
    onRequest: () => void;
    onCancel?: () => void;
    isRequesting?: boolean;
}

export function PermissionPrompt({
    config,
    onRequest,
    onCancel,
    isRequesting = false,
}: PermissionPromptProps) {
    const { type, requestMessage } = config;
    const title = getPermissionTitle(type);
    const description = requestMessage || getPermissionDescription(type);
    const icon = getPermissionIcon(type);

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4 text-primary">{icon}</div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2 justify-center">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} disabled={isRequesting}>
                        Cancel
                    </Button>
                )}
                <Button onClick={onRequest} disabled={isRequesting}>
                    {isRequesting ? 'Requesting...' : 'Allow'}
                </Button>
            </CardFooter>
        </Card>
    );
}

/**
 * Permission Denied Card
 */
export interface PermissionDeniedProps {
    permissions: PermissionConfig[];
    onRetry?: () => void;
    onDismiss?: () => void;
    showInstructions?: boolean;
}

export function PermissionDenied({
    permissions,
    onRetry,
    onDismiss,
    showInstructions = true,
}: PermissionDeniedProps) {
    const permissionNames = permissions.map((p) => getPermissionTitle(p.type)).join(', ');

    return (
        <Card className="w-full max-w-md mx-auto border-destructive/50">
            <CardHeader className="relative">
                {onDismiss && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-6 w-6"
                        onClick={onDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <CardTitle className="text-destructive">Permission Denied</CardTitle>
                <CardDescription>
                    We don't have permission to access: <strong>{permissionNames}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {showInstructions && (
                    <div className="text-sm space-y-2">
                        <p className="font-medium">To enable these permissions:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                            <li>Click the lock icon in your browser's address bar</li>
                            <li>Find the permission settings</li>
                            <li>Change the setting to "Allow"</li>
                            <li>Refresh the page</li>
                        </ol>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                {onRetry && (
                    <Button variant="outline" onClick={onRetry}>
                        Try Again
                    </Button>
                )}
                {onDismiss && !onRetry && (
                    <Button variant="outline" onClick={onDismiss}>
                        Dismiss
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

/**
 * Multiple Permissions Prompt
 */
export interface MultiplePermissionsPromptProps {
    permissions: PermissionConfig[];
    onRequestAll: () => void;
    onRequestIndividual: (type: BrowserPermissionType) => void;
    onCancel?: () => void;
    isRequesting?: boolean;
    requestedPermissions?: Set<BrowserPermissionType>;
}

export function MultiplePermissionsPrompt({
    permissions,
    onRequestAll,
    onRequestIndividual,
    onCancel,
    isRequesting = false,
    requestedPermissions = new Set(),
}: MultiplePermissionsPromptProps) {
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Permissions Required</CardTitle>
                <CardDescription>
                    This feature requires the following permissions to work properly:
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {permissions.map((config) => {
                    const isRequested = requestedPermissions.has(config.type);
                    return (
                        <div
                            key={config.type}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-primary">{getPermissionIcon(config.type)}</div>
                                <div>
                                    <p className="font-medium">{getPermissionTitle(config.type)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {config.requestMessage || getPermissionDescription(config.type)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRequestIndividual(config.type)}
                                disabled={isRequesting || isRequested}
                            >
                                {isRequested ? 'Requested' : 'Allow'}
                            </Button>
                        </div>
                    );
                })}
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} disabled={isRequesting}>
                        Cancel
                    </Button>
                )}
                <Button onClick={onRequestAll} disabled={isRequesting}>
                    {isRequesting ? 'Requesting...' : 'Allow All'}
                </Button>
            </CardFooter>
        </Card>
    );
}

/**
 * Inline Permission Banner
 */
export interface PermissionBannerProps {
    config: PermissionConfig;
    onRequest: () => void;
    onDismiss?: () => void;
    isRequesting?: boolean;
}

export function PermissionBanner({
    config,
    onRequest,
    onDismiss,
    isRequesting = false,
}: PermissionBannerProps) {
    const { type, requestMessage } = config;
    const title = getPermissionTitle(type);
    const description = requestMessage || getPermissionDescription(type);
    const icon = getPermissionIcon(type);

    return (
        <div className="border border-border bg-card rounded-lg p-4 relative">
            <div className="flex items-center gap-3">
                <div className="text-primary">{icon}</div>
                <div className="flex-1">
                    <h4 className="font-semibold text-sm">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="flex gap-2">
                    {onDismiss && (
                        <Button variant="ghost" size="sm" onClick={onDismiss} disabled={isRequesting}>
                            Dismiss
                        </Button>
                    )}
                    <Button size="sm" onClick={onRequest} disabled={isRequesting}>
                        {isRequesting ? 'Requesting...' : 'Allow'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * Toast utilities for permission states
 */
export const permissionToasts = {
    granted: (permissionType: BrowserPermissionType) => {
        const title = getPermissionTitle(permissionType);
        showSuccessToast(`${title} granted successfully`);
    },

    denied: (permissionType: BrowserPermissionType) => {
        const title = getPermissionTitle(permissionType);
        showErrorToast(`${title} was denied`);
    },

    error: (permissionType: BrowserPermissionType, error?: string) => {
        const title = getPermissionTitle(permissionType);
        showErrorToast(error || `Failed to request ${title}`);
    },

    multipleGranted: (count: number) => {
        showSuccessToast(`${count} permissions granted successfully`);
    },

    multipleDenied: (count: number) => {
        showErrorToast(`${count} permissions were denied`);
    },

    instructions: (permissionType: BrowserPermissionType) => {
        const title = getPermissionTitle(permissionType);
        showInfoToast(`Please enable ${title} in your browser settings`);
    }
};