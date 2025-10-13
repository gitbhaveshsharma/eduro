/**
 * Layout System Components
 * 
 * This module provides a comprehensive conditional navigation system
 * that adapts to different platforms (Community/LMS) and devices (Mobile/Tablet/Desktop)
 */

// Main Layout Components
export { ConditionalLayout } from './conditional-layout';

// Header Components
export { ConditionalHeader } from './headers/conditional-header';
export { LMSHeader } from './headers/lms-header';

// Navigation Components
export { BottomNavigation } from './navigation/bottom-navigation';

// Configuration and Utilities
export {
    LayoutUtils,
    COMMUNITY_NAV_ITEMS,
    LMS_NAV_ITEMS,
    BREAKPOINTS,
    Z_INDEX
} from './config';

// Types
export type {
    PlatformType,
    DeviceType,
    ViewType,
    LayoutConfig,
    NavigationItem,
    HeaderProps,
    BottomNavProps,
    ConditionalLayoutProps
} from './types';