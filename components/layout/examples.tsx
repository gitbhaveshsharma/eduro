/**
 * Example usage of ConditionalLayout for different platforms
 * These examples show how to integrate the layout system
 */

import { ConditionalLayout } from "@/components/layout";

// Example 1: Community Platform Page (like Feed)
export function CommunityPageExample() {
    return (
        <ConditionalLayout platform="community">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <h1 className="text-2xl font-bold">Community Feed</h1>
                <p>This page uses the Community platform layout with FeedHeader.</p>
                <div className="bg-white rounded-lg p-6 border">
                    <h2 className="text-lg font-semibold mb-2">Sample Post</h2>
                    <p>Community content goes here...</p>
                </div>
            </div>
        </ConditionalLayout>
    );
}

// Example 2: LMS Platform Page (like Dashboard/Courses)
export function LMSPageExample() {
    return (
        <ConditionalLayout platform="lms">
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                <h1 className="text-2xl font-bold">Learning Dashboard</h1>
                <p>This page uses the LMS platform layout with LMSHeader.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-6 border">
                        <h3 className="font-semibold mb-2">Course 1</h3>
                        <p>Course content preview...</p>
                    </div>
                    <div className="bg-white rounded-lg p-6 border">
                        <h3 className="font-semibold mb-2">Assignment 1</h3>
                        <p>Assignment details...</p>
                    </div>
                    <div className="bg-white rounded-lg p-6 border">
                        <h3 className="font-semibold mb-2">Progress</h3>
                        <p>Learning progress...</p>
                    </div>
                </div>
            </div>
        </ConditionalLayout>
    );
}

// Example 3: Custom Configuration
export function CustomLayoutExample() {
    return (
        <ConditionalLayout
            platform="lms"
            forceConfig={{
                showBottomNav: true, // Force bottom nav even on desktop
                showHeader: true,
                device: 'mobile' // Force mobile layout
            }}
        >
            <div className="p-4">
                <h1 className="text-2xl font-bold">Custom Layout</h1>
                <p>This page forces mobile layout with bottom navigation.</p>
            </div>
        </ConditionalLayout>
    );
}

// Example 4: Minimal Layout (no header/nav)
export function MinimalLayoutExample() {
    return (
        <ConditionalLayout
            platform="community"
            forceConfig={{
                showHeader: false,
                showBottomNav: false
            }}
        >
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Minimal Layout</h1>
                    <p>No header or navigation - good for landing pages</p>
                </div>
            </div>
        </ConditionalLayout>
    );
}