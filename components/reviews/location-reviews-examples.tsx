/**
 * Example usage of Location Reviews Card
 * 
 * This file demonstrates how to use the location-based review components
 * in different scenarios
 */

'use client';

import React from 'react';
import {
    LocationReviewsCard,
    LocationReviewsCardCompact,
    LocationReviewsCardFull
} from '@/components/reviews/location-reviews-card';

/**
 * Example: Basic usage with user's location
 */
export function UserLocationReviewsExample() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Reviews Near You</h2>

            <LocationReviewsCard
                title="Coaching Centers in Your Area"
                showLocation={true}
                showPagination={true}
                defaultSort="recent"
                onReviewClick={(reviewId) => {
                    console.log('Review clicked:', reviewId);
                    // Navigate to review detail or coaching center page
                }}
            />
        </div>
    );
}

/**
 * Example: Compact version for sidebar
 */
export function SidebarLocationReviewsExample() {
    return (
        <div className="w-80 p-4">
            <LocationReviewsCardCompact
                title="Local Reviews"
                className="h-fit"
            />
        </div>
    );
}

/**
 * Example: Full-featured version for main content
 */
export function MainContentLocationReviewsExample() {
    return (
        <div className="container mx-auto p-6">
            <LocationReviewsCardFull
                title="Coaching Center Reviews in Your City"
                showLocation={true}
                onReviewClick={(reviewId) => {
                    // Handle navigation to review or coaching center
                    window.open(`/reviews/${reviewId}`, '_blank');
                }}
            />
        </div>
    );
}

/**
 * Example: Custom location reviews
 */
export function CustomLocationReviewsExample() {
    const delhiLocation = {
        state: 'Delhi',
        city: 'New Delhi'
    };

    return (
        <div className="p-6">
            <LocationReviewsCard
                customLocation={delhiLocation}
                title="Reviews in Delhi"
                showLocation={true}
                defaultSort="highest_rated"
                maxHeight="400px"
            />
        </div>
    );
}

/**
 * Example: Multiple location cards in a grid
 */
export function MultipleLocationReviewsExample() {
    const locations = [
        { state: 'Maharashtra', city: 'Mumbai', title: 'Mumbai Reviews' },
        { state: 'Karnataka', city: 'Bangalore', title: 'Bangalore Reviews' },
        { state: 'Delhi', city: 'New Delhi', title: 'Delhi Reviews' },
        { state: 'Tamil Nadu', city: 'Chennai', title: 'Chennai Reviews' }
    ];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Reviews Across Cities</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {locations.map((location) => (
                    <LocationReviewsCard
                        key={`${location.state}-${location.city}`}
                        customLocation={{
                            state: location.state,
                            city: location.city
                        }}
                        title={location.title}
                        maxHeight="350px"
                        showLocation={false} // Location is in title
                        perPage={8}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Example: Dashboard integration
 */
export function DashboardLocationReviewsExample() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main reviews */}
            <div className="lg:col-span-2">
                <LocationReviewsCardFull
                    title="Reviews in Your Area"
                    onReviewClick={(reviewId) => {
                        // Handle review click
                        console.log('Navigating to review:', reviewId);
                    }}
                />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <LocationReviewsCardCompact
                    title="Recent Local Reviews"
                    defaultSort="recent"
                    perPage={5}
                />

                <LocationReviewsCardCompact
                    title="Top Rated Nearby"
                    defaultSort="highest_rated"
                    perPage={5}
                />
            </div>
        </div>
    );
}