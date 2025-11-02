/**
 * Layout system types for conditional navigation
 * Supports different platforms and responsive designs
 */

export type PlatformType = 'community' | 'lms';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ViewType = 'webview' | 'browser';
export type PageType = 'default' | 'network' | 'feed' | 'connections' | 'profile' | 'dashboard' | 'settings';

/**
 * Header item action configuration
 */
export interface HeaderItemAction {
    type: 'navigate' | 'callback' | 'toggle' | 'dropdown';
    href?: string;
    onClick?: () => void | boolean | Promise<void | boolean>;
    items?: HeaderItem[]; // For dropdown type
}

/**
 * Header item configuration for dynamic rendering
 */
export interface HeaderItem {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: HeaderItemAction;
    badge?: number;
    active?: boolean;
    showOn?: {
        devices?: DeviceType[];
        pages?: PageType[];
        platforms?: PlatformType[];
        roles?: ('S' | 'T' | 'C' | 'A' | 'SA')[]; // Role-based access control
    };
    className?: string;
}

/**
 * Sidebar item configuration
 */
export interface SidebarItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: number;
    active?: boolean;
    roles?: ('S' | 'T' | 'C' | 'A' | 'SA')[]; // Role-based access control - if undefined, visible to all
    description?: string;
}

/**
 * Sidebar configuration
 */
export interface SidebarConfig {
    enabled: boolean;
    defaultOpen?: boolean;
    position?: 'left' | 'right';
    width?: string; // e.g., '280px', '20rem'
    collapsible?: boolean;
    overlay?: boolean; // Show overlay on mobile when open
}

export interface LayoutConfig {
    platform: PlatformType;
    device: DeviceType;
    view: ViewType;
    page?: PageType;
    showHeader: boolean;
    showBottomNav: boolean;
    headerType: 'community' | 'lms' | 'minimal' | 'network' | 'universal';
    bottomNavType?: 'default' | 'network';
    sidebar?: SidebarConfig;
    title?: string; // Page title for header
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
    roles?: ('S' | 'T' | 'C' | 'A' | 'SA')[]; // Role-based access control
}

export interface HeaderProps {
    config: LayoutConfig;
    className?: string;
    // Whether to show the user's avatar in the header. Defaults to true when omitted.
    showAvatar?: boolean;
    // Header items to render (if not provided, will be determined by page/platform)
    items?: HeaderItem[];
    // Title/branding to show in header
    title?: string;
    // Search configuration
    searchConfig?: {
        enabled?: boolean;
        placeholder?: string;
        value?: string;
        onChange?: (value: string) => void;
    };
    // Sidebar control
    sidebarOpen?: boolean;
    onSidebarToggle?: () => void;
    // Notification handling
    notificationCount?: number;
    onNotificationClick?: () => void;
    // Return `false` to prevent default navigation behavior. Can be async.
    onNavigationClick?: (item: NavigationItem | HeaderItem) => void | boolean | Promise<void | boolean>;
}

export interface SidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: SidebarConfig;
    items?: SidebarItem[]; // Sidebar items to render
    title?: string; // Sidebar title (e.g., "Settings", "Navigation")
    children?: React.ReactNode; // Optional children for custom content
    className?: string;
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
    platform?: PlatformType; // Made optional - can be used for public pages too
    className?: string;
    forceConfig?: Partial<LayoutConfig>;
}