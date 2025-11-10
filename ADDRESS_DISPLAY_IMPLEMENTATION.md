# Address Display Implementation for Coaching & Branch Profiles

## Overview

Added address display functionality to coaching center and branch public profiles, allowing visitors to see the location information for coaching centers and their branches.

## Changes Made

### 1. Coaching Center Profile (`app/(coaching)/coaching/[slug]/page.tsx`)

**Changes:**

- Added `useAddressStore` import to access address functionality
- Added `address` state to store the coaching center's address
- Updated `loadCoachingData` function to fetch the coaching center's address using `getAddressByEntity('coaching', centerData.id)`
- Passed the `address` prop to `CoachingAboutSection` component

**Key Implementation:**

```typescript
const { getAddressByEntity } = useAddressStore();
const [address, setAddress] = useState<Address | null>(null);

// In loadCoachingData:
const addressData = await getAddressByEntity("coaching", centerData.id);
setAddress(addressData);
```

### 2. Branch Profile (`app/(coaching)/coaching/[slug]/branch/[branchId]/page.tsx`)

**Changes:**

- Added `useAddressStore` import to access address functionality
- Updated `loadBranchData` function to fetch the branch's address using `getAddressByEntity('branch', branchId)`
- The fetched address is already passed to `CoachingBranchProfile` component (already had this prop)

**Key Implementation:**

```typescript
const { getAddressByEntity } = useAddressStore();

// In loadBranchData:
const addressData = await getAddressByEntity("branch", branchId);
setAddress(addressData || null);
```

### 3. Coaching About Section (`components/coaching/public/coaching-about-section.tsx`)

**Changes:**

- Added `Address` type import from `@/lib/address`
- Added `MapPin` and `Navigation` icon imports from lucide-react
- Added `Button` component import
- Updated `CoachingAboutSectionProps` interface to include optional `address` prop
- Updated `hasContent` memo to check for address presence
- Added new "Location" card that displays:
  - Address label (if available)
  - Full formatted address (address lines, city, district, state, PIN code, country)
  - "Get Directions" button with Google Maps link (if coordinates available)

**UI Design:**

- Card has green-themed icon (MapPin) matching the color scheme of other cards
- Shows complete address information in a readable format
- Includes interactive "Get Directions" button when GPS coordinates are available
- Follows the same design pattern as other cards (Subjects, Target Audience)

## How It Works

### Address Fetching

The system uses the `getAddressByEntity` method from the address store, which:

1. Searches for addresses linked to the coaching center or branch
2. Uses the appropriate filter (`coaching_id` or `branch_id`)
3. Returns the most recently updated address
4. Caches the address for performance

### Display Logic

- Address is only displayed if it exists in the database
- All address components are conditionally rendered
- Google Maps directions link is only shown if GPS coordinates are available
- The address card seamlessly integrates with other information cards

## Database Schema Requirements

For this feature to work, your address table must have:

- `coaching_id` column (UUID, nullable) - links address to coaching center
- `branch_id` column (UUID, nullable) - links address to branch
- Standard address fields: `label`, `address_line_1`, `address_line_2`, `city`, `district`, `state`, `pin_code`, `country`
- Optional: `latitude`, `longitude` for Google Maps integration

## Benefits

1. **Better User Experience**: Users can see the location of coaching centers and branches
2. **Navigation Support**: Direct integration with Google Maps for directions
3. **Consistent Design**: Address display follows the same modern card design as other sections
4. **Performance**: Uses address caching to minimize database queries
5. **Flexibility**: Works with or without GPS coordinates

## Future Enhancements

Potential improvements:

1. Embedded Google Maps iframe showing the location
2. Multiple addresses support (if a coaching center has multiple locations)
3. Distance calculation from user's current location
4. Address verification badges
5. Opening hours display (if stored in address metadata)

## Testing Checklist

- [ ] Coaching center with address displays correctly
- [ ] Coaching center without address doesn't show empty card
- [ ] Branch with address displays correctly
- [ ] Branch without address doesn't show empty card
- [ ] "Get Directions" button opens Google Maps correctly
- [ ] Address formatting is readable and complete
- [ ] Responsive design works on mobile devices
- [ ] Loading states work correctly
- [ ] Error handling works when address fetch fails

## Notes

- The address is fetched asynchronously and won't block page rendering
- If no address is found, the section gracefully handles it without errors
- The implementation uses the existing address store infrastructure
- No new API endpoints were required
