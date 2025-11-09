/**
 * Browser Permission System
 * 
 * Comprehensive browser-level permission management system
 * 
 * @module lib/permissions
 */

// Types
export * from './types';

// Core
export { permissionManager, BrowserPermissionManager } from './permission-manager';
export { PermissionProvider, usePermissionContext } from './permission-context';

// Configuration
export * from './permission-config';
