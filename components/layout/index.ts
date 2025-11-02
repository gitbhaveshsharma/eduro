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
export { UniversalHeader } from './headers/universal-header';
export { LMSHeader } from './headers/lms-header';

// Sidebar Components
export { Sidebar } from './sidebar/sidebar';

// Navigation Components
export { BottomNavigation } from './navigation/bottom-navigation';

// Configuration and Utilities
export {
    LayoutUtils,
    COMMUNITY_NAV_ITEMS,
    LMS_NAV_ITEMS,
    NETWORK_NAV_ITEMS,
    FEED_HEADER_ITEMS,
    NETWORK_HEADER_ITEMS,
    DASHBOARD_HEADER_ITEMS,
    SETTINGS_HEADER_ITEMS,
    PROFILE_HEADER_ITEMS,
    SETTINGS_SIDEBAR_ITEMS,
    BREAKPOINTS,
    Z_INDEX
} from './config';

// Types
export type {
    PlatformType,
    DeviceType,
    ViewType,
    PageType,
    LayoutConfig,
    NavigationItem,
    HeaderItem,
    HeaderItemAction,
    SidebarItem,
    HeaderProps,
    SidebarProps,
    SidebarConfig,
    BottomNavProps,
    ConditionalLayoutProps
} from './types';