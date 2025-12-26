/**
 * Learning Dashboard Types
 * Types for the modern learning dashboard UI
 */

export type SubjectId =
    | 'all' // Add 'all' to the union type
    | 'english'
    | 'physics'
    | 'chemistry'
    | 'mathematics'
    | 'biology'
    | 'history'
    | 'geography'
    | 'science'
    | 'computer'
    | 'business_studies'
    | 'economics'
    | 'hindi'
    | 'music'
    | 'physical_education'
    | 'moral_science'
    | 'environmental'
    | 'social_studies'
    | 'accountancy'
    | 'art_and_craft';

export interface Subject {
    id: SubjectId; // Changed from string to SubjectId
    name: string;
    icon: string;
    color: string;
}

export interface UpcomingClass {
    id: string;
    title: string;
    subject: Subject;
    startTime: string;
    imageUrl?: string; // Keep optional for backward compatibility
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
    connections: number;
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
