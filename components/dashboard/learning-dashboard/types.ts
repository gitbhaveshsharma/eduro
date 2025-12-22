/**
 * Learning Dashboard Types
 * Types for the modern learning dashboard UI
 */

export interface Subject {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface UpcomingClass {
    id: string;
    title: string;
    subject: Subject;
    startTime: string;
    imageUrl?: string;
    participants: {
        avatars: string[];
        count: number;
    };
}

export interface LearningContent {
    id: string;
    title: string;
    subject: Subject;
    icon: string;
    materialCount: number;
    progress: number;
    timeRemaining: string;
    status: 'not-started' | 'in-progress' | 'completed';
}

export interface UserStats {
    points: number;
    badges: number;
    certificates: number;
}

export interface ActivityData {
    hours: number;
    label: string;
}

export interface ContentBreakdown {
    passed: number;
    inProgress: number;
    notStarted: number;
    total: number;
    segments: {
        label: string;
        value: number;
        color: string;
    }[];
}

export interface DashboardStats {
    content: number;
    learning: number;
}
