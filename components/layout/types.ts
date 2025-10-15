/**
 * Layout system types for conditional navigation
 * Supports different platforms and responsive designs
 */

export type PlatformType = 'community' | 'lms';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ViewType = 'webview' | 'browser';

export interface LayoutConfig {
    platform: PlatformType;
    device: DeviceType;
    view: ViewType;
    showHeader: boolean;
    showBottomNav: boolean;
    headerType: 'community' | 'lms' | 'minimal';
}

export interface NavigationItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    // Return `false` to prevent default navigation behavior. Can be async.
    onClick?: () => void | boolean | Promise<void | boolean>;
    badge?: number;
    active?: boolean;
    platforms: PlatformType[];
    devices: DeviceType[];
}

export interface HeaderProps {
    config: LayoutConfig;
    className?: string;
    // Return `false` to prevent default navigation behavior. Can be async.
    onNavigationClick?: (item: NavigationItem) => void | boolean | Promise<void | boolean>;
}

export interface BottomNavProps {
    config: LayoutConfig;
    activeRoute?: string;
    navigationItems: NavigationItem[];
    // Return `false` to prevent default navigation behavior. Can be async.
    onItemClick?: (item: NavigationItem) => void | boolean | Promise<void | boolean>;
    className?: string;
}

export interface ConditionalLayoutProps {
    children: React.ReactNode;
    platform: PlatformType;
    className?: string;
    forceConfig?: Partial<LayoutConfig>;
}