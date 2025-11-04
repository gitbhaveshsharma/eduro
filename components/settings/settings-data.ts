/**
 * Settings Data Configuration
 * 
 * Central configuration for all settings items and categories
 * This data drives the settings navigation, search, and access control
 */

import {
    UserCog,
    Building2,
    Shield,
    Bell,
    Lock,
    Palette,
    Globe,
    Mail,
    Phone,
    Calendar,
    Users,
    FileText,
    CreditCard,
    Zap,
    Eye,
    Clock,
    MapPin,
    Award,
    BookOpen,
    Settings,
    Tag,
    Briefcase,
} from 'lucide-react';
import type { SettingsItem, SettingsCategoryConfig, SettingsCategory, UserRole } from './types';

/**
 * Settings Categories Configuration
 */
export const SETTINGS_CATEGORIES: Record<SettingsCategory, SettingsCategoryConfig> = {
    profile: {
        id: 'profile',
        label: 'Profile',
        description: 'Personal information and profile settings',
        icon: UserCog,
        priority: 1,
    },
    account: {
        id: 'account',
        label: 'Account',
        description: 'Account settings and preferences',
        icon: Settings,
        priority: 2,
    },
    coaching: {
        id: 'coaching',
        label: 'Coaching Center',
        description: 'Coaching center management and configuration',
        icon: Building2,
        priority: 3,
    },
    branches: {
        id: 'branches',
        label: 'Branches',
        description: 'Manage coaching center branches',
        icon: Building2,
        priority: 4,
    },
    schedule: {
        id: 'schedule',
        label: 'Schedule',
        description: 'Class schedules and calendar management',
        icon: Calendar,
        priority: 4,
    },
    notifications: {
        id: 'notifications',
        label: 'Notifications',
        description: 'Notification preferences and alerts',
        icon: Bell,
        priority: 5,
    },
    privacy: {
        id: 'privacy',
        label: 'Privacy',
        description: 'Privacy settings and data control',
        icon: Eye,
        priority: 6,
    },
    security: {
        id: 'security',
        label: 'Security',
        description: 'Security settings and authentication',
        icon: Lock,
        priority: 7,
    },
    preferences: {
        id: 'preferences',
        label: 'Preferences',
        description: 'User preferences and customization',
        icon: Palette,
        priority: 8,
    },
};

/**
 * All Settings Items
 * Comprehensive list of all available settings in the application
 */
export const SETTINGS_ITEMS: SettingsItem[] = [
    // Profile Settings
    {
        id: 'profile-info',
        name: 'Profile Information',
        description: 'Update your name, bio, profile picture, and personal details',
        category: 'profile',
        icon: UserCog,
        href: '/settings/profiles',
        keywords: ['personal', 'avatar', 'photo', 'bio', 'about'],
        priority: 'high',
    },
    {
        id: 'contact-info',
        name: 'Contact Information',
        description: 'Manage your email addresses and phone numbers',
        category: 'profile',
        icon: Mail,
        href: '/settings/profiles#contact',
        keywords: ['email', 'phone', 'contact', 'address'],
        priority: 'high',
    },
    {
        id: 'location',
        name: 'Location Settings',
        description: 'Set your location, timezone, and regional preferences',
        category: 'profile',
        icon: MapPin,
        href: '/settings/profiles#location',
        keywords: ['address', 'city', 'country', 'timezone', 'region'],
        priority: 'medium',
    },

    // Social Links (new)
    {
        id: 'social-links',
        name: 'Social Links',
        description:
            'Add or manage your social and professional links — e.g. personal/site, LinkedIn, GitHub, Twitter/X.',
        category: 'profile',
        icon: Globe,
        href: '/settings/profiles#social',
        keywords: ['website', 'linkedin', 'github', 'twitter', 'x', 'social', 'profiles'],
        priority: 'medium',
    },

    // Coaching Center Settings (Coach/Admin only)
    {
        id: 'coaching-center-management',
        name: 'Coaching Center Management',
        description: 'Create and manage your coaching centers and branches',
        category: 'coaching',
        icon: Building2,
        href: '/settings/coaching-center',
        keywords: ['institute', 'organization', 'branch', 'center', 'management'],
        priority: 'high',
        roles: ['C', 'A', 'SA'],
    },
    {
        id: 'coaching-courses',
        name: 'Course Management',
        description: 'Add, edit, and organize your coaching courses and subjects',
        category: 'coaching',
        icon: BookOpen,
        href: '/settings/coaching-center#courses',
        keywords: ['subjects', 'classes', 'curriculum', 'syllabus'],
        priority: 'high',
        roles: ['C', 'A', 'SA'],
    },
    {
        id: 'coaching-students',
        name: 'Student Management',
        description: 'Manage student enrollments, batches, and records',
        category: 'coaching',
        icon: Users,
        href: '/settings/coaching-center#students',
        keywords: ['enrollment', 'batch', 'learners', 'pupils'],
        priority: 'high',
        roles: ['C', 'A', 'SA'],
    },
    {
        id: 'coaching-staff',
        name: 'Staff Management',
        description: 'Manage teachers, instructors, and administrative staff',
        category: 'coaching',
        icon: Briefcase,
        href: '/settings/coaching-center#staff',
        keywords: ['teachers', 'instructors', 'faculty', 'employees'],
        priority: 'medium',
        roles: ['C', 'A', 'SA'],
    },

    // Branches Settings (new)
    {
        id: 'branches-overview',
        name: 'Branches Overview',
        description: 'View and manage all branches for your coaching centers',
        category: 'branches',
        icon: Building2,
        href: '/settings/coaching-center#branches',
        keywords: ['branches', 'locations', 'centers', 'sites'],
        priority: 'high',
        roles: ['C', 'A', 'SA'],
    },
    {
        id: 'branch-locations',
        name: 'Branch Locations',
        description: 'Manage addresses and contact information for each branch',
        category: 'branches',
        icon: MapPin,
        href: '/settings/coaching-center#branch',
        keywords: ['address', 'location', 'map', 'branch'],
        priority: 'medium',
        roles: ['C', 'A', 'SA'],
    },
    {
        id: 'branch-hours',
        name: 'Branch Working Hours',
        description: 'Set and manage working hours for individual branches',
        category: 'branches',
        icon: Clock,
        href: '/settings/coaching-center#branch',
        keywords: ['hours', 'availability', 'opening', 'timings'],
        priority: 'medium',
        roles: ['C', 'A', 'SA'],
    },

    // Schedule Settings
    {
        id: 'class-schedule',
        name: 'Class Schedule',
        description: 'Manage your class timings, timetable, and availability',
        category: 'schedule',
        icon: Calendar,
        href: '/settings/schedule',
        keywords: ['timetable', 'timing', 'calendar', 'availability', 'slots'],
        priority: 'high',
        roles: ['C', 'T'],
    },
    {
        id: 'working-hours',
        name: 'Working Hours',
        description: 'Set your working hours and business hours',
        category: 'schedule',
        icon: Clock,
        href: '/settings/schedule#hours',
        keywords: ['availability', 'office hours', 'timing', 'operational'],
        priority: 'medium',
        roles: ['C', 'T'],
    },
    {
        id: 'holidays',
        name: 'Holidays & Leaves',
        description: 'Manage holidays, breaks, and leave schedules',
        category: 'schedule',
        icon: Calendar,
        href: '/settings/schedule#holidays',
        keywords: ['vacation', 'breaks', 'off days', 'leave'],
        priority: 'medium',
        roles: ['C', 'T'],
    },

    // Account Settings
    {
        id: 'account-settings',
        name: 'Account Settings',
        description: 'General account settings and preferences',
        category: 'account',
        icon: Settings,
        href: '/settings/profiles',
        keywords: ['general', 'basic', 'configuration'],
        priority: 'high',
    },
    {
        id: 'language',
        name: 'Language & Region',
        description: 'Choose your preferred language and regional settings',
        category: 'preferences',
        icon: Globe,
        href: '/settings/preferences#language',
        keywords: ['locale', 'translation', 'internationalization'],
        priority: 'medium',
    },
    {
        id: 'theme',
        name: 'Appearance & Theme',
        description: 'Customize the look and feel of your interface',
        category: 'preferences',
        icon: Palette,
        href: '/settings/preferences#theme',
        keywords: ['dark mode', 'light mode', 'colors', 'display'],
        priority: 'medium',
    },

    // Notifications
    {
        id: 'notification-preferences',
        name: 'Notification Preferences',
        description: 'Control how and when you receive notifications',
        category: 'notifications',
        icon: Bell,
        href: '/settings/profiles#notifications',
        keywords: ['alerts', 'push', 'email notifications', 'reminders'],
        priority: 'high',
    },
    {
        id: 'email-notifications',
        name: 'Email Notifications',
        description: 'Manage email notification settings',
        category: 'notifications',
        icon: Mail,
        href: '/settings/profiles#email',
        keywords: ['digest', 'newsletter', 'email alerts'],
        priority: 'medium',
    },

    // Privacy Settings
    {
        id: 'privacy-settings',
        name: 'Privacy Settings',
        description: 'Control who can see your profile and information',
        category: 'privacy',
        icon: Eye,
        href: '/settings/privacy',
        keywords: ['visibility', 'public', 'private', 'hidden'],
        priority: 'high',
    },
    {
        id: 'data-sharing',
        name: 'Data Sharing',
        description: 'Manage data sharing and third-party access',
        category: 'privacy',
        icon: Shield,
        href: '/settings/privacy#sharing',
        keywords: ['third party', 'permissions', 'access control'],
        priority: 'medium',
    },

    // Security Settings
    {
        id: 'password',
        name: 'Password & Authentication',
        description: 'Change your password and manage authentication methods',
        category: 'security',
        icon: Lock,
        href: '/settings/security',
        keywords: ['password', 'login', '2fa', 'two-factor', 'authentication'],
        priority: 'high',
    },
    {
        id: 'sessions',
        name: 'Active Sessions',
        description: 'View and manage your active login sessions',
        category: 'security',
        icon: Zap,
        href: '/settings/security#sessions',
        keywords: ['devices', 'logout', 'sign out', 'activity'],
        priority: 'medium',
    },

    // Additional Settings
    {
        id: 'billing',
        name: 'Billing & Payments',
        description: 'Manage your subscription, billing, and payment methods',
        category: 'account',
        icon: CreditCard,
        href: '/settings/billing',
        keywords: ['subscription', 'payment', 'invoice', 'plan', 'premium'],
        priority: 'medium',
        roles: ['C', 'A', 'SA'],
    },
    {
        id: 'certifications',
        name: 'Certifications & Credentials',
        description: 'Manage your professional certifications and qualifications',
        category: 'profile',
        icon: Award,
        href: '/settings/profiles#certifications',
        keywords: ['credentials', 'qualifications', 'certificates', 'achievements'],
        priority: 'low',
        roles: ['T', 'C'],
    },
];

/**
 * Get settings items filtered by user role
 */
export function getSettingsItemsByRole(userRole?: UserRole): SettingsItem[] {
    if (!userRole) {
        // Return items with no role restriction
        return SETTINGS_ITEMS.filter(item => !item.roles || item.roles.length === 0);
    }

    return SETTINGS_ITEMS.filter(item => {
        // If item has no role restriction, show to all
        if (!item.roles || item.roles.length === 0) {
            return true;
        }
        // Otherwise, check if user's role is in the allowed roles
        return item.roles.includes(userRole);
    });
}

/**
 * Get settings items by category
 */
export function getSettingsByCategory(category: SettingsCategory, userRole?: UserRole): SettingsItem[] {
    const items = getSettingsItemsByRole(userRole);
    return items.filter(item => item.category === category);
}

/**
 * Get all categories that have at least one item visible to the user
 */
export function getAvailableCategories(userRole?: UserRole): SettingsCategoryConfig[] {
    const items = getSettingsItemsByRole(userRole);
    const categoryIds = new Set(items.map(item => item.category));

    return Object.values(SETTINGS_CATEGORIES)
        .filter(cat => categoryIds.has(cat.id))
        .sort((a, b) => a.priority - b.priority);
}
