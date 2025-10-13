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
    onClick?: () => void;
    badge?: number;
    active?: boolean;
    platforms: PlatformType[];
    devices: DeviceType[];
}

export interface HeaderProps {
    config: LayoutConfig;
    className?: string;
    onNavigationClick?: (item: NavigationItem) => void;
}

export interface BottomNavProps {
    config: LayoutConfig;
    activeRoute?: string;
    navigationItems: NavigationItem[];
    onItemClick?: (item: NavigationItem) => void;
    className?: string;
}

export interface ConditionalLayoutProps {
    children: React.ReactNode;
    platform: PlatformType;
    className?: string;
    forceConfig?: Partial<LayoutConfig>;
}