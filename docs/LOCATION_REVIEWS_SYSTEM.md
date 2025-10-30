# Location-Based Reviews System

This documentation covers the location-based review system that automatically shows coaching center reviews based on the user's address/location.

## Overview

The location-based review system integrates the address store with the review system to automatically display reviews of coaching centers in the user's area. It provides both hooks and UI components for easy implementation.

## Components

### 1. `useLocationReviews` Hook

The main hook that manages location-based review data.

```tsx
import { useLocationReviews } from '@/hooks/use-location-reviews';

function MyComponent() {
  const {
    reviews,           // Review data and pagination
    loading,           // Loading state
    error,             // Error state
    userLocation,      // User's extracted location
    primaryAddress,    // Full address object
    loadReviews,       // Manual load function
    refreshReviews,    // Refresh current data
    loadNextPage,      // Load next page
    loadPreviousPage,  // Load previous page
    hasValidLocation,  // Whether location is available
    locationString     // Formatted location string
  } = useLocationReviews({
    autoLoad: true,           // Auto-load on mount
    useUserLocation: true,    // Use user's address
    defaultSort: 'recent',    // Default sorting
    perPage: 20              // Items per page
  });

  return (
    <div>
      {hasValidLocation ? (
        <div>
          <h2>Reviews in {locationString}</h2>
          {/* Render reviews */}
        </div>
      ) : (
        <p>Please set your address to see local reviews</p>
      )}
    </div>
  );
}
```

### 2. Specialized Hook Variants

```tsx
// Simple hook for user's location
import { useUserLocationReviews } from '@/hooks/use-location-reviews';

const userReviews = useUserLocationReviews();

// Hook for specific location
import { useCustomLocationReviews } from '@/hooks/use-location-reviews';

const delhiReviews = useCustomLocationReviews({
  state: 'Delhi',
  city: 'New Delhi'
});
```

### 3. `LocationReviewsCard` Component

A complete UI component that displays location-based reviews in a card format.

```tsx
import { LocationReviewsCard } from '@/components/reviews/location-reviews-card';

function Dashboard() {
  return (
    <LocationReviewsCard
      title="Reviews Near You"
      showLocation={true}
      showPagination={true}
      defaultSort="recent"
      maxHeight="500px"
      onReviewClick={(reviewId) => {
        // Handle review click
        router.push(`/reviews/${reviewId}`);
      }}
    />
  );
}
```

### 4. Component Variants

```tsx
// Compact version for sidebars
import { LocationReviewsCardCompact } from '@/components/reviews/location-reviews-card';

<LocationReviewsCardCompact
  title="Local Reviews"
  className="w-80"
/>

// Full-featured version for main content
import { LocationReviewsCardFull } from '@/components/reviews/location-reviews-card';

<LocationReviewsCardFull
  title="Coaching Centers in Your City"
  onReviewClick={handleReviewClick}
/>
```

## How It Works

### 1. Address Integration

The system automatically integrates with the address store:

```typescript
// Automatically loads user's primary address
const { loadPrimaryAddress } = useAddressStore();
const primaryAddress = usePrimaryAddress();

// Extracts location from address
const userLocation = {
  state: primaryAddress.state,
  district: primaryAddress.district,
  city: primaryAddress.city
};
```

### 2. Review Loading

Uses the existing `loadLocationReviews` function from the review store:

```typescript
// Loads reviews based on location
await loadLocationReviews(
  { state: 'Maharashtra', city: 'Mumbai' },
  'recent',
  1,
  20
);
```

### 3. Automatic Updates

- Automatically loads reviews when user's address is available
- Refreshes when location changes
- Supports pagination and sorting
- Handles loading and error states

## Configuration Options

### Hook Configuration

```typescript
interface LocationReviewsConfig {
  autoLoad?: boolean;        // Auto-load on mount (default: true)
  defaultSort?: ReviewSortBy; // Default sorting (default: 'recent')
  perPage?: number;          // Reviews per page (default: 20)
  useUserLocation?: boolean; // Use user's address (default: true)
  customLocation?: {         // Override location
    state?: string;
    district?: string;
    city?: string;
  };
}
```

### Component Props

```typescript
interface LocationReviewsCardProps {
  className?: string;        // Custom CSS class
  title?: string;           // Card title override
  maxHeight?: string;       // Maximum card height
  customLocation?: Location; // Custom location
  showLocation?: boolean;   // Show location in header
  showPagination?: boolean; // Show pagination controls
  defaultSort?: ReviewSortBy; // Default sorting
  perPage?: number;         // Reviews per page
  onReviewClick?: (id: string) => void; // Review click handler
}
```

## Usage Examples

### 1. Basic Dashboard Widget

```tsx
function DashboardReviewWidget() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main reviews */}
      <div className="lg:col-span-2">
        <LocationReviewsCardFull
          title="Reviews in Your Area"
          onReviewClick={(reviewId) => {
            router.push(`/coaching-centers/review/${reviewId}`);
          }}
        />
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        <LocationReviewsCardCompact
          title="Recent Local Reviews"
          defaultSort="recent"
        />
      </div>
    </div>
  );
}
```

### 2. City-Specific Reviews

```tsx
function CityReviewsPage({ city, state }: { city: string; state: string }) {
  return (
    <LocationReviewsCard
      customLocation={{ city, state }}
      title={`Reviews in ${city}`}
      showLocation={false} // Location is in title
      maxHeight="600px"
    />
  );
}
```

### 3. Multiple Cities Comparison

```tsx
function CitiesComparisonPage() {
  const cities = [
    { state: 'Maharashtra', city: 'Mumbai' },
    { state: 'Karnataka', city: 'Bangalore' },
    { state: 'Delhi', city: 'New Delhi' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cities.map((location) => (
        <LocationReviewsCard
          key={`${location.state}-${location.city}`}
          customLocation={location}
          title={`${location.city} Reviews`}
          maxHeight="400px"
          perPage={10}
        />
      ))}
    </div>
  );
}
```

### 4. Custom Hook Usage

```tsx
function CustomReviewComponent() {
  const {
    reviews,
    loading,
    userLocation,
    loadReviews,
    hasValidLocation
  } = useLocationReviews({
    autoLoad: false, // Manual loading
    perPage: 50
  });

  useEffect(() => {
    if (hasValidLocation) {
      loadReviews(userLocation, 'highest_rated');
    }
  }, [hasValidLocation]);

  if (!hasValidLocation) {
    return <AddressPrompt />;
  }

  return (
    <div>
      <h2>Top-Rated Coaching Centers Near You</h2>
      {loading ? (
        <ReviewsSkeleton />
      ) : (
        <CustomReviewsList reviews={reviews} />
      )}
    </div>
  );
}
```

## Features

### 1. Automatic Location Detection
- Uses user's primary address from address store
- Falls back gracefully when no address is available
- Supports manual location override

### 2. Smart Filtering
- Filters reviews by state, district, and/or city
- Supports all existing review sorting options
- Maintains review quality filters

### 3. Performance Optimized
- Leverages existing review store caching
- Efficient re-renders with proper selectors
- Lazy loading with pagination

### 4. User Experience
- Clear loading states
- Helpful error messages
- Smooth pagination
- Location display in UI

### 5. Flexibility
- Works with any location (not just user's)
- Configurable sorting and pagination
- Customizable UI components
- Multiple layout variants

## Error Handling

The system handles various error scenarios:

```tsx
// No address set
if (!hasValidLocation) {
  return (
    <Alert>
      <AlertDescription>
        Please set your address to see local reviews.
        <Button onClick={() => router.push('/profile/address')}>
          Add Address
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Network errors
if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {error}. Please try again.
        <Button onClick={refreshReviews}>Retry</Button>
      </AlertDescription>
    </Alert>
  );
}

// No reviews found
if (reviews?.reviews.length === 0) {
  return (
    <div className="text-center py-8">
      <p>No reviews found in your area yet.</p>
      <Button onClick={() => router.push('/coaching-centers/add')}>
        Add a Coaching Center
      </Button>
    </div>
  );
}
```

## Integration Points

### With Address System
- Automatically uses `usePrimaryAddress()` hook
- Listens for address changes
- Supports all address formats

### With Review System
- Uses existing `loadLocationReviews` function
- Leverages review store caching
- Supports all review features (helpful votes, responses, etc.)

### With UI Components
- Uses modern scrollbar system
- Integrates with existing card components
- Follows design system patterns

## Best Practices

1. **Always check for valid location** before showing location-specific UI
2. **Provide fallbacks** when no address is available
3. **Use appropriate component variants** for different use cases
4. **Handle loading and error states** gracefully
5. **Consider pagination** for areas with many reviews
6. **Allow manual refresh** for users who want updated data

## Migration Guide

If you're updating existing review components to use location-based reviews:

```tsx
// Before
function ReviewsPage() {
  const { reviews } = useReviewStore();
  
  useEffect(() => {
    loadAllReviews();
  }, []);
  
  return <ReviewList reviews={reviews} />;
}

// After
function ReviewsPage() {
  const {
    reviews,
    hasValidLocation,
    locationString
  } = useUserLocationReviews();
  
  if (!hasValidLocation) {
    return <AddressPrompt />;
  }
  
  return (
    <div>
      <h2>Reviews in {locationString}</h2>
      <LocationReviewsCard />
    </div>
  );
}
```

This system provides a complete solution for showing location-relevant reviews to users, improving the relevance and usefulness of the review system.