/**
 * Learning Dashboard - Dummy Data
 * Mock data for demonstration purposes
 */

import type {
    Subject,
    UpcomingClass,
    LearningContent,
    UserStats,
    ContentBreakdown,
} from './types';

// Subjects with brand-compatible colors
export const SUBJECTS: Subject[] = [
    { id: 'all', name: 'All Subject', icon: '🎯', color: 'bg-red-100 text-red-600' },
    { id: 'english', name: 'English', icon: 'A', color: 'bg-orange-100 text-orange-600' },
    { id: 'business_studies', name: 'Business', icon: '💼', color: 'bg-green-100 text-green-600' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'bg-purple-100 text-purple-600' },
    { id: 'physics', name: 'Physics', icon: '⚡', color: 'bg-blue-100 text-blue-600' },
    { id: 'geography', name: 'Geography', icon: '🌍', color: 'bg-teal-100 text-teal-600' },
    { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'bg-indigo-100 text-indigo-600' },
];

export const UPCOMING_CLASSES: UpcomingClass[] = [
    {
        id: '1',
        title: 'Unlock the Laws of Nature',
        subject: SUBJECTS[4], // Physics
        startTime: '11:30',
        imageUrl: '', // Remove or leave empty - will use subject image from getSubjectImage()
        participants: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            ],
            count: 40,
        },
    },
    {
        id: '2',
        title: 'Unlock the Secrets of Matter',
        subject: SUBJECTS[3], // Chemistry
        startTime: '11:30',
        imageUrl: '', // Remove or leave empty - will use subject image from getSubjectImage()
        participants: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
            ],
            count: 40,
        },
    },
    {
        id: '3',
        title: 'Advanced Grammar Structures',
        subject: SUBJECTS[1], // English
        startTime: '14:00',
        imageUrl: '', // Remove or leave empty - will use subject image from getSubjectImage()
        participants: {
            avatars: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
            ],
            count: 25,
        },
    },
];

export const LEARNING_CONTENT: LearningContent[] = [
    {
        id: '1',
        title: 'Unlock the Laws of Nature',
        subject: SUBJECTS[4], // Physics
        icon: '📊',
        materialCount: 5,
        progress: 44,
        timeRemaining: '1 day',
        status: 'in-progress',
    },
    {
        id: '2',
        title: "Mapping the Earth's Secrets",
        subject: SUBJECTS[5], // Geography
        icon: '🌍',
        materialCount: 5,
        progress: 44,
        timeRemaining: '1 day',
        status: 'in-progress',
    },
    {
        id: '3',
        title: 'Foundations of Chemistry',
        subject: SUBJECTS[3], // Chemistry
        icon: '🧪',
        materialCount: 5,
        progress: 44,
        timeRemaining: '1 day',
        status: 'not-started',
    },
    {
        id: '4',
        title: 'Business Strategy Essentials',
        subject: SUBJECTS[2], // Business
        icon: '💼',
        materialCount: 8,
        progress: 72,
        timeRemaining: '3 days',
        status: 'in-progress',
    },
];

export const USER_STATS: UserStats = {
    connections: 100,
    badges: 32,
    certificates: 32,
};

export const ACTIVITY_HOURS = 3.5;

export const CONTENT_BREAKDOWN: ContentBreakdown = {
    passed: 84,
    inProgress: 17,
    notStarted: 43,
    total: 140,
    segments: [
        { label: 'Passed', value: 84, color: '#F97316' }, // Orange
        { label: 'In Progress', value: 17, color: '#3B82F6' }, // Blue
        { label: 'Review', value: 7, color: '#10B981' }, // Green
        { label: 'Not Started', value: 32, color: '#F59E0B' }, // Amber
    ],
};

export const DASHBOARD_STATS = {
    content: 120,
    learning: 120,
};
