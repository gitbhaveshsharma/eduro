# Coaching Public Profile System

## Overview

This document describes the implementation of the public coaching center profile system. The system provides a complete, modular, and production-ready solution for displaying coaching center and branch information to public users.

## Features

### ✅ Coaching Center Public Profile
- Hero section with cover image, logo, and key information
- Verification and featured badges
- Average rating and review count display
- Contact information (phone, email, website)
- Detailed about section with description
- Subjects offered and target audience
- Establishment year and history
- List of all branches with "Join" CTA
- Integration with review system for ratings

### ✅ Coaching Branch Profile
- Branch-specific details page
- Manager information display
- Address integration using address.store
- Branch contact details
- Active/inactive status
- Main branch designation
- Branch-specific reviews

### ✅ Coaching Centers Discovery Page
- Search functionality
- Category-based filtering
- Verified and featured filters
- Responsive grid layout
- Load more pagination
- Active filter badges
- Empty state handling

## Architecture

### Component Structure

```
components/coaching/public/
├── coaching-profile-header.tsx      # Hero section with cover, logo, badges
├── coaching-about-section.tsx       # Description, subjects, target audience
├── coaching-branches-section.tsx    # List of branches with cards
├── coaching-reviews-section.tsx     # Rating summary and reviews display
├── coaching-branch-profile.tsx      # Branch detail component
├── coaching-center-card.tsx         # Card and grid for discovery page
└── index.ts                         # Central exports
```

### Route Structure

```
app/(community)/coaching/
├── page.tsx                          # Discovery/list page (/coaching)
├── [slug]/
│   ├── page.tsx                      # Center profile (/coaching/[slug])
│   └── branch/
│       └── [branchId]/
│           └── page.tsx              # Branch profile (/coaching/[slug]/branch/[branchId])
```

## Component Details

### 1. CoachingProfileHeader

**Purpose**: Displays the hero section of a coaching center profile

**Props**:
- `center`: PublicCoachingCenter - The coaching center data
- `averageRating?`: number - Average rating (default: 0)
- `totalReviews?`: number - Total review count (default: 0)
- `onShare?`: () => void - Share button handler
- `onSave?`: () => void - Save button handler

**Features**:
- Responsive cover image with gradient overlay
- Logo with verification badge
- Category badge with icon and color
- Rating display with stars
- Established year formatting
- Branch count
- Contact action buttons (Call, Email, Website)
- Share and Save buttons

**Usage**:
```tsx
import { CoachingProfileHeader } from '@/components/coaching/public';

<CoachingProfileHeader
  center={center}
  averageRating={4.5}
  totalReviews={120}
  onShare={handleShare}
  onSave={handleSave}
/>
```

### 2. CoachingAboutSection

**Purpose**: Displays detailed information about the coaching center

**Props**:
- `center`: PublicCoachingCenter - The coaching center data

**Features**:
- Description with proper formatting
- Subjects offered as badges
- Target audience as badges
- Established year with years of operation
- Conditional rendering (only shows if data exists)

**Usage**:
```tsx
import { CoachingAboutSection } from '@/components/coaching/public';

<CoachingAboutSection center={center} />
```

### 3. CoachingBranchesSection

**Purpose**: Displays all branches of a coaching center

**Props**:
- `branches`: PublicCoachingBranch[] - Array of branch data
- `centerSlug`: string - Center slug for routing
- `onJoinBranch?`: (branchId: string) => void - Join button handler

**Features**:
- Branch cards with hover effects
- Main branch badge
- Active/inactive status
- Contact information (phone, email)
- View Details and Join buttons
- Smart sorting (main first, then active, then inactive)
- Empty state handling

**Usage**:
```tsx
import { CoachingBranchesSection } from '@/components/coaching/public';

<CoachingBranchesSection
  branches={branches}
  centerSlug="elite-academy"
  onJoinBranch={handleJoinBranch}
/>
```

### 4. CoachingReviewsSection

**Purpose**: Displays review summary and integrates with review.store

**Props**:
- `coachingCenterId`: string - Center ID
- `centerName`: string - Center name
- `centerSlug`: string - Center slug for routing
- `branchIds?`: string[] - Optional branch IDs for aggregation

**Features**:
- Overall rating display with star visualization
- Category ratings (teaching quality, infrastructure, etc.)
- Rating distribution with progress bars
- Trust score based on verified reviews
- Empty state with "Write a Review" CTA
- View All Reviews button

**Integration**:
- Uses `useReviewStore` for data fetching
- Calls `loadRatingSummary` for rating data
- Displays `RatingSummaryResponse` data

**Usage**:
```tsx
import { CoachingReviewsSection } from '@/components/coaching/public';

<CoachingReviewsSection
  coachingCenterId={center.id}
  centerName={center.name}
  centerSlug="elite-academy"
  branchIds={branchIds}
/>
```

### 5. CoachingBranchProfile

**Purpose**: Displays detailed information about a specific branch

**Props**:
- `branch`: PublicCoachingBranch - Branch data
- `centerName`: string - Parent center name
- `centerSlug`: string - Center slug for routing
- `address?`: Address | null - Branch address (optional)
- `managerName?`: string | null - Manager name (optional)

**Features**:
- Back to center navigation
- Branch type badge (Main/Regular)
- Active/inactive status
- Description
- Contact information
- Manager information section
- Address display with map link
- Get Directions button (Google Maps integration)
- Created date formatting

**Usage**:
```tsx
import { CoachingBranchProfile } from '@/components/coaching/public';

<CoachingBranchProfile
  branch={branch}
  centerName="Elite Academy"
  centerSlug="elite-academy"
  address={branchAddress}
  managerName="John Doe"
/>
```

### 6. CoachingCenterCard & CoachingCenterGrid

**Purpose**: Card component for discovery/list pages

**Props (Card)**:
- `center`: PublicCoachingCenter - Center data
- `averageRating?`: number - Average rating
- `totalReviews?`: number - Review count

**Props (Grid)**:
- `centers`: PublicCoachingCenter[] - Array of centers
- `loading?`: boolean - Loading state
- `emptyMessage?`: string - Custom empty message

**Features**:
- Compact card layout
- Verification and featured badges
- Rating display
- Subject badges (first 3 + count)
- Branch count
- Hover effects and transitions
- Loading skeleton
- Empty state with illustration

**Usage**:
```tsx
import { CoachingCenterGrid } from '@/components/coaching/public';

<CoachingCenterGrid
  centers={centers}
  loading={loading}
  emptyMessage="No centers found"
/>
```

## Page Implementation

### 1. Coaching Center Profile Page (`/coaching/[slug]`)

**Features**:
- Loads center data by slug
- Loads all branches for the center
- Displays profile header, about, branches, and reviews
- Share functionality (native share API with clipboard fallback)
- Save functionality (with toast notification)
- Error handling with redirect option

**Data Flow**:
1. Extract slug from URL params
2. Load center using `loadCoachingCenterBySlug`
3. Load branches using `loadBranchesByCenter`
4. Pass data to components
5. Handle Join branch navigation

### 2. Coaching Branch Profile Page (`/coaching/[slug]/branch/[branchId]`)

**Features**:
- Loads parent center and specific branch
- Displays branch profile with full details
- Shows branch-specific reviews
- Address integration (ready for implementation)
- Error handling with back navigation

**Data Flow**:
1. Extract slug and branchId from URL params
2. Load center by slug
3. Load branch by ID
4. Optionally load address (needs schema update)
5. Display branch profile and reviews

### 3. Coaching Centers Discovery Page (`/coaching`)

**Features**:
- Search by name/description
- Category filtering (grouped)
- Verified only filter
- Featured only filter
- Active filter badges
- Clear all filters
- Load more pagination
- Responsive grid layout
- Filter panel (collapsible)

**Data Flow**:
1. Initial load with default sorting (featured first)
2. Debounced search on query change
3. Immediate filter application
4. Results displayed in grid
5. Load more on button click

## Integration Points

### Review System Integration

The coaching profile pages integrate with the review system through:

1. **Rating Summary Display**:
   ```tsx
   const { loadRatingSummary } = useReviewStore();
   await loadRatingSummary(branchId);
   ```

2. **Review Count**:
   - Displayed in profile header
   - Shown in review section
   - Used for trust score calculation

3. **Category Ratings**:
   - Teaching Quality
   - Infrastructure
   - Staff Support
   - Value for Money

### Address System Integration

Branch profiles integrate with the address system:

1. **Address Loading**:
   ```tsx
   const { loadAddress } = useAddressStore();
   const address = await loadAddress(addressId);
   ```

2. **Address Display**:
   - Full formatted address
   - Google Maps integration
   - Get Directions button

**Note**: Currently, the branch-address relationship needs to be established in the database schema. You can store `address_id` in the branch metadata or create a dedicated column.

### Coaching Store Integration

All pages use the coaching store for data management:

```tsx
const {
  loadCoachingCenterBySlug,
  loadBranchesByCenter,
  loadCoachingBranch,
  searchCoachingCenters
} = useCoachingStore();
```

## Styling and Theming

All components use:
- shadcn/ui components for consistency
- Tailwind CSS for styling
- Dark mode support (automatic)
- Responsive design (mobile-first)
- Hover effects and transitions
- Loading skeletons
- Empty states

## Performance Considerations

1. **Caching**: Uses coaching.store caching system
2. **Debouncing**: Search queries are debounced (300ms)
3. **Pagination**: Load more instead of infinite scroll
4. **Lazy Loading**: Components render conditionally
5. **Optimistic Updates**: Planned for interactions

## Error Handling

All pages implement:
- Try-catch blocks for async operations
- Error state display with alerts
- Fallback navigation options
- Loading states with skeletons
- Empty states with helpful messages

## Accessibility

Components follow accessibility best practices:
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Future Enhancements

### Planned Features
1. **Follower System**: Allow users to follow coaching centers
2. **Comparison Tool**: Compare multiple centers side-by-side
3. **Admission Process**: Integration with admission workflows
4. **Events Calendar**: Show upcoming events/batches
5. **Gallery**: Photo/video gallery for centers
6. **FAQs**: Frequently asked questions section
7. **Alumni Section**: Success stories and testimonials
8. **Fee Structure**: Detailed pricing information
9. **Scholarship Info**: Available scholarships
10. **Live Chat**: Direct communication with centers

### Technical Improvements
1. **Server-Side Rendering**: Convert to SSR for better SEO
2. **Metadata Generation**: Dynamic OG tags and meta descriptions
3. **Structured Data**: JSON-LD for rich search results
4. **Image Optimization**: Next.js Image component usage
5. **Infinite Scroll**: Replace load more with intersection observer
6. **Advanced Filters**: More filter options (price, location, ratings)
7. **Sort Options**: Multiple sort criteria
8. **Bookmark System**: Save favorite centers
9. **Share Options**: More sharing platforms
10. **Analytics**: Track page views and interactions

## Testing Checklist

### Component Testing
- [ ] All props render correctly
- [ ] Conditional rendering works
- [ ] Error states display properly
- [ ] Loading states show skeletons
- [ ] Empty states are informative
- [ ] Click handlers execute
- [ ] Navigation works correctly

### Page Testing
- [ ] Data loads on mount
- [ ] URL parameters parsed correctly
- [ ] Error handling displays alerts
- [ ] Back navigation works
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Pagination loads more data

### Integration Testing
- [ ] Review data displays correctly
- [ ] Address integration works
- [ ] Store updates propagate
- [ ] Cache invalidation works
- [ ] Optimistic updates succeed

### Responsive Testing
- [ ] Mobile layout correct
- [ ] Tablet layout correct
- [ ] Desktop layout correct
- [ ] Touch interactions work
- [ ] Overflow handled properly

## Troubleshooting

### Common Issues

**Issue**: Center not loading
- Check if slug is correct
- Verify center exists in database
- Check center status is ACTIVE
- Review RLS policies

**Issue**: Branches not displaying
- Verify branches exist for center
- Check active_branches count
- Review branch status
- Check RLS policies

**Issue**: Reviews not showing
- Verify branchIds are passed
- Check review data exists
- Review loadRatingSummary call
- Check review.store state

**Issue**: Filters not working
- Check filter object construction
- Verify searchCoachingCenters call
- Review filter types
- Check debounce timing

## API Reference

### Store Methods Used

```typescript
// Coaching Store
loadCoachingCenterBySlug(slug: string): Promise<void>
loadBranchesByCenter(centerId: string, activeOnly?: boolean): Promise<PublicCoachingBranch[]>
loadCoachingBranch(branchId: string): Promise<CoachingBranch | null>
searchCoachingCenters(filters, sort, page, perPage): Promise<void>

// Review Store
loadRatingSummary(branchId: string, forceRefresh?: boolean): Promise<void>
searchReviews(filters, page, perPage, forceRefresh?): Promise<void>

// Address Store
loadAddress(addressId: string): Promise<Address | null>
```

### Types Used

```typescript
import type {
  PublicCoachingCenter,
  PublicCoachingBranch,
  CoachingCenterFilters
} from '@/lib/coaching';

import type { RatingSummaryResponse } from '@/lib/review';
import type { Address } from '@/lib/address';
```

## Maintenance

### Regular Tasks
1. Update review data cache periodically
2. Refresh featured centers list
3. Clean up expired sessions
4. Monitor error rates
5. Check loading performance

### Database Considerations
1. Ensure indexes on slug, category, status
2. Monitor query performance
3. Optimize RLS policies
4. Regular backup of coaching data
5. Archive inactive centers

## Conclusion

This coaching public profile system provides a complete, modular, and production-ready solution for displaying coaching center information. It follows best practices for React, Next.js, and TypeScript, integrates seamlessly with existing systems (review, address), and provides an excellent user experience with proper error handling, loading states, and responsive design.

The system is designed to be easily extensible for future features while maintaining code quality and performance.
