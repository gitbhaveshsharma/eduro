# Address System Documentation

This documentation covers the comprehensive address system implemented for the Eduro platform. The system provides a complete solution for managing user addresses, including CRUD operations, geocoding, state management, caching, and utilities.

## Architecture Overview

The address system is organized into four main components:

- **Schema** (`lib/schema/address.types.ts`) - TypeScript interfaces and types
- **Service** (`lib/service/address.service.ts`) - Database operations and API interactions  
- **Store** (`lib/store/address.store.ts`) - State management with Zustand
- **Utils** (`lib/utils/address.utils.ts`) - Helper functions and utilities

## Quick Start

### 1. Import the Address System

```typescript
import { 
  AddressService, 
  useCurrentUserAddresses, 
  useAddressStore,
  usePrimaryAddress,
  AddressDisplayUtils 
} from '@/lib/address';

// For PIN code integration
import { usePinCode } from '@/hooks/use-pincode';
```

### 2. Initialize the Address System

```typescript
// Load user's addresses
const { loadCurrentUserAddresses } = useAddressStore();
await loadCurrentUserAddresses();

// Or get addresses directly
const result = await AddressService.getCurrentUserAddresses();
```

### 3. Use Address Data in Components

```tsx
import { useCurrentUserAddresses, usePrimaryAddress } from '@/lib/address';

function AddressList() {
  const addresses = useCurrentUserAddresses();
  const primaryAddress = usePrimaryAddress();

  return (
    <div>
      <h2>Primary Address</h2>
      {primaryAddress && (
        <div>
          <h3>{AddressDisplayUtils.getDisplayName(primaryAddress)}</h3>
          <p>{AddressDisplayUtils.formatSingleLine(primaryAddress)}</p>
        </div>
      )}
      
      <h2>All Addresses</h2>
      {addresses.map(address => (
        <div key={address.id}>
          <h4>{AddressDisplayUtils.getDisplayName(address)}</h4>
          <p>{AddressDisplayUtils.formatSingleLine(address)}</p>
        </div>
      ))}
    </div>
  );
}
```

## Database Schema

The address system is built on a robust Supabase database schema with the following key features:

### Address Types

- `HOME` - Home address
- `WORK` - Work address  
- `SCHOOL` - School address
- `COLLEGE` - College address
- `COACHING` - Coaching center address
- `HOSTEL` - Hostel address
- `BRANCH` - Branch office address
- `OFFICE` - Office address
- `OTHER` - Other type of address

### Key Features

- Row Level Security (RLS) policies
- Geographic coordinate support
- Google Maps integration
- Address validation and formatting
- Primary address management
- Distance calculations
- Geocoding support

## PIN Code Integration

The address system includes automatic PIN code validation and address population using the Indian Postal API.

### PIN Code Hook

```typescript
import { usePinCode } from '@/hooks/use-pincode';

function PinCodeForm() {
  const {
    isLoading,
    data,
    error,
    isValid,
    fetchPinCodeData,
    validatePinCode,
    reset,
    getFormattedAddressData
  } = usePinCode();

  const handlePinCodeSubmit = async (pinCode: string) => {
    const success = await fetchPinCodeData(pinCode);
    if (success) {
      const addressData = getFormattedAddressData();
      // Use addressData to create address
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Enter PIN code"
        onChange={(e) => {
          if (validatePinCode(e.target.value)) {
            fetchPinCodeData(e.target.value);
          }
        }}
      />
      {isLoading && <span>Validating...</span>}
      {isValid && data && (
        <div>
          <p>✓ Address found: {data.district}, {data.state}</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Automatic Address Creation

The onboarding system automatically creates a user's primary address when they provide a valid PIN code:

```typescript
// In onboarding component
const { createAddress } = useAddressStore();
const { data: pinCodeData, isValid: pinCodeValid } = usePinCode();

if (pinCodeValid && pinCodeData) {
  await createAddress({
    address_type: 'HOME',
    label: 'Home Address',
    state: pinCodeData.state,
    district: pinCodeData.district,
    pin_code: pinCodeData.pinCode,
    country: 'India',
    is_primary: true
  });
}
```

## API Reference

### AddressService

The service layer provides all database operations:

```typescript
// Get current user's addresses
const result = await AddressService.getCurrentUserAddresses();

// Get primary address
const primaryResult = await AddressService.getPrimaryAddress();

// Create new address
const createResult = await AddressService.createAddress({
  address_type: 'HOME',
  label: 'My Home',
  state: 'Karnataka',
  district: 'Bangalore Urban',
  pin_code: '560001',
  address_line_1: '123 Main Street',
  city: 'Bangalore'
});

// Update address
const updateResult = await AddressService.updateAddress(addressId, {
  label: 'Updated Home Address',
  address_line_2: 'Near Park'
});

// Set as primary address
const primaryResult = await AddressService.setPrimaryAddress(addressId);

// Search addresses with filters
const searchResult = await AddressService.searchAddresses(
  { state: 'Karnataka', address_type: 'HOME' },
  { field: 'created_at', direction: 'desc' },
  1, // page
  20 // per page
);

// Get nearby addresses
const nearbyResult = await AddressService.getNearbyAddresses(
  { latitude: 12.9716, longitude: 77.5946 },
  10 // radius in km
);

// Calculate distance between addresses
const distanceResult = await AddressService.calculateDistance(
  fromAddressId,
  toAddressId
);
```

### AddressStore (Zustand)

State management with caching and optimistic updates:

```typescript
const { 
  loadCurrentUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
  searchAddresses,
  loadNearbyAddresses,
  setEditMode 
} = useAddressStore();

// Load current user addresses
await loadCurrentUserAddresses();

// Create new address
const success = await createAddress({
  address_type: 'WORK',
  state: 'Maharashtra',
  district: 'Mumbai',
  pin_code: '400001',
  address_line_1: 'Office Building'
});

// Update with optimistic updates
const success = await updateAddress(addressId, {
  label: 'New Office'
});

// Search addresses with filters
await searchAddresses(
  { address_type: ['HOME', 'WORK'] },
  { field: 'created_at', direction: 'desc' }
);

// Load nearby addresses
await loadNearbyAddresses(
  { latitude: 19.0760, longitude: 72.8777 },
  5 // radius in km
);
```

### Address Hooks

Convenient React hooks for common operations:

```typescript
// Basic address data
const addresses = useCurrentUserAddresses();
const primaryAddress = usePrimaryAddress();
const loading = useCurrentAddressesLoading();
const error = useCurrentAddressesError();

// Search functionality
const searchResults = useSearchResults();
const searchLoading = useSearchLoading();
const nearbyAddresses = useNearbyAddresses();

// Edit state
const isEditing = useEditMode();
const editingAddressId = useEditingAddressId();
const editFormData = useEditFormData();

// Create state
const isCreating = useCreateMode();
const createFormData = useCreateFormData();

// Cached addresses
const cachedAddress = useAddressFromCache(addressId);
const isCacheLoading = useAddressCacheLoading(addressId);

// Operation states
const operationLoading = useAddressOperationLoading(addressId);
const bulkLoading = useBulkOperationLoading();
```

## Utility Functions

### Display Utilities

```typescript
import { AddressDisplayUtils } from '@/lib/address';

// Get display name
const displayName = AddressDisplayUtils.getDisplayName(address);

// Get address type label and styling
const typeLabel = AddressDisplayUtils.getAddressTypeLabel('HOME'); // "Home"
const typeColor = AddressDisplayUtils.getAddressTypeColor('WORK'); // "green"
const typeIcon = AddressDisplayUtils.getAddressTypeIcon('SCHOOL'); // "graduation-cap"

// Format addresses
const singleLine = AddressDisplayUtils.formatSingleLine(address);
const multiLine = AddressDisplayUtils.formatMultiLine(address);
const postalFormat = AddressDisplayUtils.formatPostal(address);

// Get formatted address object
const formatted = AddressDisplayUtils.getFormattedAddress(address, {
  include_pin_code: true,
  include_country: false
});

// Get short summary
const summary = AddressDisplayUtils.getShortSummary(address); // "Bangalore, Karnataka"
```

### Validation Utilities

```typescript
import { AddressValidationUtils } from '@/lib/address';

// Validate PIN code
const pinValidation = AddressValidationUtils.validatePinCode("560001");
if (!pinValidation.valid) {
  console.error(pinValidation.error);
}

// Validate coordinates
const coordValidation = AddressValidationUtils.validateCoordinates(
  12.9716, 77.5946, true // check Indian bounds
);

// Validate Google Maps URL
const urlValidation = AddressValidationUtils.validateGoogleMapsUrl(
  "https://www.google.com/maps/@12.9716,77.5946,15z"
);

// Validate complete address
const addressValidation = AddressValidationUtils.validateAddress(address);
if (!addressValidation.valid) {
  console.error(addressValidation.errors);
}
```

### Completion Utilities

```typescript
import { AddressCompletionUtils } from '@/lib/address';

// Get completion steps
const steps = AddressCompletionUtils.getCompletionSteps(address);

// Calculate completion percentage
const percentage = AddressCompletionUtils.calculateCompletionPercentage(address);

// Get next recommended step
const nextStep = AddressCompletionUtils.getNextStep(address);

// Check if ready for delivery
const isReady = AddressCompletionUtils.isDeliveryReady(address);
```

### Geographic Utilities

```typescript
import { AddressGeographicUtils } from '@/lib/address';

// Calculate distance between coordinates
const distance = AddressGeographicUtils.calculateDistance(
  { latitude: 12.9716, longitude: 77.5946 },
  { latitude: 19.0760, longitude: 72.8777 }
); // Returns distance in km

// Check if within radius
const isWithin = AddressGeographicUtils.isWithinRadius(
  center, point, 10 // 10 km radius
);

// Get bounding box
const bounds = AddressGeographicUtils.getBoundingBox(
  { latitude: 12.9716, longitude: 77.5946 },
  5 // 5 km radius
);

// Extract coordinates from Google Maps URL
const coords = AddressGeographicUtils.extractCoordinatesFromUrl(
  "https://www.google.com/maps/@12.9716,77.5946,15z"
);

// Generate Google Maps URL
const mapsUrl = AddressGeographicUtils.generateGoogleMapsUrl(
  { latitude: 12.9716, longitude: 77.5946 },
  "My Location"
);
```

## Usage Examples

### Complete Address Management Flow

```tsx
import { useState } from 'react';
import { 
  useCurrentUserAddresses, 
  useAddressStore, 
  AddressValidationUtils,
  AddressDisplayUtils 
} from '@/lib/address';

function AddressManager() {
  const addresses = useCurrentUserAddresses();
  const { createAddress, updateAddress, deleteAddress, setPrimaryAddress } = useAddressStore();
  const [formData, setFormData] = useState({
    address_type: 'HOME' as const,
    label: '',
    state: '',
    district: '',
    pin_code: '',
    address_line_1: '',
    address_line_2: '',
    city: ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validation = AddressValidationUtils.validateAddress(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Create
    const success = await createAddress(formData);
    if (success) {
      setFormData({
        address_type: 'HOME',
        label: '',
        state: '',
        district: '',
        pin_code: '',
        address_line_1: '',
        address_line_2: '',
        city: ''
      });
    }
  };

  const handleSetPrimary = async (addressId: string) => {
    await setPrimaryAddress(addressId);
  };

  const handleDelete = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(addressId);
    }
  };

  return (
    <div>
      <h2>Address Manager</h2>
      
      {/* Address List */}
      <div className="addresses">
        {addresses.map(address => (
          <div key={address.id} className="address-card">
            <div className="address-header">
              <h3>{AddressDisplayUtils.getDisplayName(address)}</h3>
              {address.is_primary && <span className="primary-badge">Primary</span>}
            </div>
            
            <p>{AddressDisplayUtils.formatSingleLine(address)}</p>
            
            <div className="address-actions">
              {!address.is_primary && (
                <button onClick={() => handleSetPrimary(address.id)}>
                  Set as Primary
                </button>
              )}
              <button onClick={() => handleDelete(address.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Address Form */}
      <form onSubmit={handleSubmit} className="address-form">
        <h3>Add New Address</h3>
        
        <select 
          value={formData.address_type}
          onChange={(e) => setFormData(prev => ({ ...prev, address_type: e.target.value }))}
        >
          <option value="HOME">Home</option>
          <option value="WORK">Work</option>
          <option value="SCHOOL">School</option>
          <option value="COLLEGE">College</option>
          <option value="OTHER">Other</option>
        </select>
        
        <input
          type="text"
          placeholder="Address Label"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
        />
        
        <input
          type="text"
          placeholder="Address Line 1 *"
          value={formData.address_line_1}
          onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
          required
        />
        
        <input
          type="text"
          placeholder="Address Line 2"
          value={formData.address_line_2}
          onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
        />
        
        <input
          type="text"
          placeholder="City"
          value={formData.city}
          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
        />
        
        <input
          type="text"
          placeholder="District *"
          value={formData.district}
          onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
          required
        />
        
        <input
          type="text"
          placeholder="State *"
          value={formData.state}
          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
          required
        />
        
        <input
          type="text"
          placeholder="PIN Code *"
          value={formData.pin_code}
          onChange={(e) => setFormData(prev => ({ ...prev, pin_code: e.target.value }))}
          pattern="[0-9]{6}"
          required
        />
        
        <button type="submit">Add Address</button>
      </form>
    </div>
  );
}
```

### Address Search with Geocoding

```tsx
import { useState, useEffect } from 'react';
import { 
  useAddressStore, 
  useSearchResults, 
  useSearchLoading,
  AddressDisplayUtils,
  AddressGeographicUtils 
} from '@/lib/address';

function AddressSearch() {
  const { searchAddresses, loadNearbyAddresses } = useAddressStore();
  const results = useSearchResults();
  const loading = useSearchLoading();
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    address_type: '',
    search_query: ''
  });
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition((position) => {
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    });
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchAddresses(filters);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [filters, searchAddresses]);

  const handleNearbySearch = async () => {
    if (userLocation) {
      await loadNearbyAddresses(userLocation, 10); // 10 km radius
    }
  };

  const getGoogleMapsUrl = (address) => {
    return AddressGeographicUtils.generateGoogleMapsUrl(
      { latitude: address.latitude!, longitude: address.longitude! },
      AddressDisplayUtils.getDisplayName(address)
    );
  };

  return (
    <div>
      <h2>Address Search</h2>
      
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search addresses..."
          value={filters.search_query}
          onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value }))}
        />
        
        <select 
          value={filters.state}
          onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
        >
          <option value="">All States</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
        </select>
        
        <select 
          value={filters.address_type}
          onChange={(e) => setFilters(prev => ({ ...prev, address_type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="HOME">Home</option>
          <option value="WORK">Work</option>
          <option value="SCHOOL">School</option>
        </select>
        
        {userLocation && (
          <button onClick={handleNearbySearch}>
            Find Nearby Addresses
          </button>
        )}
      </div>

      {loading ? (
        <div>Searching...</div>
      ) : (
        <div className="search-results">
          {results?.addresses.map(address => (
            <div key={address.id} className="address-result">
              <h3>{AddressDisplayUtils.getDisplayName(address)}</h3>
              <p>{AddressDisplayUtils.formatSingleLine(address)}</p>
              
              {address.latitude && address.longitude && (
                <div className="address-actions">
                  <a 
                    href={getGoogleMapsUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Maps
                  </a>
                  
                  {userLocation && (
                    <span className="distance">
                      {AddressGeographicUtils.calculateDistance(
                        userLocation,
                        { latitude: address.latitude, longitude: address.longitude }
                      ).toFixed(2)} km away
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {results && results.addresses.length === 0 && (
            <div>No addresses found matching your criteria.</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Address Completion Component

```tsx
import { 
  AddressCompletionUtils,
  AddressDisplayUtils 
} from '@/lib/address';

function AddressCompletion({ address }) {
  const steps = AddressCompletionUtils.getCompletionSteps(address);
  const percentage = AddressCompletionUtils.calculateCompletionPercentage(address);
  const nextStep = AddressCompletionUtils.getNextStep(address);
  const isDeliveryReady = AddressCompletionUtils.isDeliveryReady(address);

  return (
    <div className="address-completion">
      <h3>Address Completion</h3>
      
      <div className="completion-header">
        <div className="completion-bar">
          <div 
            className="completion-fill" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span>{percentage}% Complete</span>
      </div>
      
      {!isDeliveryReady && (
        <div className="delivery-warning">
          ⚠️ This address is not ready for delivery. Please complete required fields.
        </div>
      )}
      
      {nextStep && (
        <div className="next-step">
          <h4>Recommended Next Step:</h4>
          <div className="step-card">
            <h5>{nextStep.label}</h5>
            <p>{nextStep.description}</p>
            <span className="points">+{nextStep.points} points</span>
          </div>
        </div>
      )}
      
      <div className="completion-steps">
        {steps.map(step => (
          <div 
            key={step.key} 
            className={`step ${step.completed ? 'completed' : ''} ${step.required ? 'required' : ''}`}
          >
            <div className="step-status">
              {step.completed ? '✅' : step.required ? '🔴' : '⚪'}
            </div>
            <div className="step-content">
              <h4>{step.label}</h4>
              <p>{step.description}</p>
            </div>
            <div className="step-points">
              {step.points} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

The address system provides comprehensive error handling with standardized error codes:

```typescript
import { AddressService, ADDRESS_ERROR_CODES } from '@/lib/address';

const result = await AddressService.createAddress(addressData);

if (!result.success) {
  switch (result.error) {
    case ADDRESS_ERROR_CODES.INVALID_PIN_CODE:
      // Handle PIN code validation error
      break;
    case ADDRESS_ERROR_CODES.COORDINATES_OUT_OF_BOUNDS:
      // Handle coordinate validation error
      break;
    case ADDRESS_ERROR_CODES.PRIMARY_ADDRESS_EXISTS:
      // Handle primary address conflict
      break;
    case ADDRESS_ERROR_CODES.NOT_AUTHENTICATED:
      // Redirect to login
      break;
    default:
      // Handle generic error
  }
}
```

## Performance Considerations

### Caching Strategy

- Address data is cached in the Zustand store
- Cache TTL: 15 minutes for addresses, 60 minutes for geocoding
- Automatic cache invalidation on updates
- Optimistic updates for immediate UI feedback

### Pagination

- Default page size: 20 items
- Maximum page size: 100 items
- Efficient search with filters and sorting

### Memory Management

- Automatic cleanup of cache entries
- Selective persistence of UI state only
- Efficient state selectors to prevent unnecessary re-renders

## Security Features

### Row Level Security (RLS)

- Database-level access controls
- User-based address visibility rules
- Automatic permission checking

### Data Privacy

- Coordinates hidden in public address views
- Permission-based field access
- Secure geocoding operations

### Validation

- Client-side and server-side validation
- Input sanitization
- Geographic boundary checking

## Testing

The address system is designed to be easily testable:

```typescript
// Mock address data for testing
const mockAddress = {
  id: 'test-address-id',
  user_id: 'test-user-id',
  address_type: 'HOME' as const,
  label: 'Test Home',
  state: 'Karnataka',
  district: 'Bangalore Urban',
  pin_code: '560001',
  address_line_1: '123 Test Street',
  city: 'Bangalore',
  country: 'India',
  is_primary: true,
  is_active: true,
  is_verified: false,
  // ... other fields
};

// Test address operations
describe('Address Service', () => {
  it('should create address successfully', async () => {
    const result = await AddressService.createAddress({
      address_type: 'HOME',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      pin_code: '560001',
      address_line_1: '123 Test Street'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.address_type).toBe('HOME');
  });
});
```

## Migration and Setup

1. **Database Setup**: Run the Supabase migration:
   - `004_create_addresses_table.sql`

2. **Storage Setup**: Create appropriate storage buckets if needed for address-related files

3. **Environment Variables**: Ensure Supabase credentials are configured

4. **Dependencies**: Install required packages (zustand, @supabase/supabase-js)

This address system provides a complete, production-ready solution for address management with excellent developer experience and robust functionality.
