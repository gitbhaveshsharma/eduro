# Profile System Documentation

This documentation covers the comprehensive profile system implemented for the Eduro platform. The system provides a complete solution for managing user profiles, including CRUD operations, state management, caching, and utilities.

## Architecture Overview

The profile system is organized into four main components:

- **Schema** (`lib/schema/profile.types.ts`) - TypeScript interfaces and types
- **Service** (`lib/service/profile.service.ts`) - Database operations and API interactions  
- **Store** (`lib/store/profile.store.ts`) - State management with Zustand
- **Utils** (`lib/utils/profile.utils.ts`) - Helper functions and utilities

## Quick Start

### 1. Import the Profile System

```typescript
import { 
  ProfileAPI, 
  useCurrentProfile, 
  useProfileStore,
  ProfileService,
  ProfileDisplayUtils 
} from '@/lib/profile';
```

### 2. Initialize the Profile System

```typescript
// Initialize when user logs in
await ProfileAPI.initialize();

// Or use the store directly
const { loadCurrentProfile } = useProfileStore();
await loadCurrentProfile();
```

### 3. Use Profile Data in Components

```tsx
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile';

function ProfileCard() {
  const profile = useCurrentProfile();
  const loading = useCurrentProfileLoading();

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div>
      <h1>{ProfileDisplayUtils.getDisplayName(profile)}</h1>
      <p>{profile.bio}</p>
    </div>
  );
}
```

## Database Schema

The profile system is built on a robust Supabase database schema with the following key features:

### User Roles
- `SA` - Super Admin
- `A` - Admin  
- `S` - Student (default)
- `T` - Teacher
- `C` - Coach

### Onboarding Levels
- Levels 1-10 track user onboarding progress
- Automatically calculated completion percentage
- Triggers for automatic profile creation

### Key Features
- Row Level Security (RLS) policies
- Automatic profile completion calculation
- Online status tracking
- Reputation scoring system
- Role-specific fields

## API Reference

### ProfileService

The service layer provides all database operations:

```typescript
// Get current user profile
const result = await ProfileService.getCurrentProfile();

// Update profile
const updateResult = await ProfileService.updateProfile({
  full_name: "John Doe",
  bio: "Software developer"
});

// Search profiles
const searchResult = await ProfileService.searchProfiles(
  { role: 'T', is_verified: true },
  { field: 'reputation_score', direction: 'desc' },
  1, // page
  20 // per page
);

// Upload avatar
const avatarResult = await ProfileService.updateAvatar(file);

// Check username availability
const available = await ProfileService.isUsernameAvailable("newusername");
```

### ProfileStore (Zustand)

State management with caching and optimistic updates:

```typescript
const { 
  loadCurrentProfile,
  updateCurrentProfile,
  searchProfiles,
  uploadAvatar,
  setEditMode 
} = useProfileStore();

// Load current profile
await loadCurrentProfile();

// Update with optimistic updates
const success = await updateCurrentProfile({
  full_name: "New Name"
});

// Search profiles with filters
await searchProfiles(
  { role: ['T', 'C'] },
  { field: 'created_at', direction: 'desc' }
);
```

### Profile Hooks

Convenient React hooks for common operations:

```typescript
// Basic profile data
const profile = useCurrentProfile();
const loading = useCurrentProfileLoading();
const error = useCurrentProfileError();

// Search functionality
const searchResults = useSearchResults();
const searchLoading = useSearchLoading();

// Edit state
const isEditing = useEditMode();
const editData = useEditFormData();

// Avatar upload
const { uploading, progress } = useAvatarUpload();

// Cached profiles
const cachedProfile = useProfileFromCache(userId);
const isCacheLoading = useProfileCacheLoading(userId);
```

## Utility Functions

### Display Utilities

```typescript
import { ProfileDisplayUtils } from '@/lib/profile';

// Get display name
const displayName = ProfileDisplayUtils.getDisplayName(profile);

// Get initials for avatars
const initials = ProfileDisplayUtils.getInitials(profile);

// Get role display name
const roleName = ProfileDisplayUtils.getRoleDisplayName('T'); // "Teacher"

// Format timestamps
const lastSeen = ProfileDisplayUtils.formatLastSeen(profile.last_seen_at);
const joinDate = ProfileDisplayUtils.formatJoinDate(profile.created_at);
```

### Validation Utilities

```typescript
import { ProfileValidationUtils } from '@/lib/profile';

// Validate username
const usernameValidation = ProfileValidationUtils.validateUsername("john_doe");
if (!usernameValidation.valid) {
  console.error(usernameValidation.error);
}

// Validate email
const emailValidation = ProfileValidationUtils.validateEmail("user@example.com");

// Validate social URLs
const linkedinValidation = ProfileValidationUtils.validateSocialUrl(
  "https://linkedin.com/in/johndoe", 
  "linkedin"
);
```

### Completion Utilities

```typescript
import { ProfileCompletionUtils } from '@/lib/profile';

// Get completion steps
const steps = ProfileCompletionUtils.getCompletionSteps(profile);

// Calculate completion percentage
const percentage = ProfileCompletionUtils.calculateCompletionPercentage(profile);

// Get next recommended step
const nextStep = ProfileCompletionUtils.getNextStep(profile);
```

## Usage Examples

### Complete Profile Update Flow

```tsx
import { useState } from 'react';
import { 
  useCurrentProfile, 
  useProfileStore, 
  ProfileValidationUtils,
  ProfileDisplayUtils 
} from '@/lib/profile';

function EditProfileForm() {
  const profile = useCurrentProfile();
  const { updateCurrentProfile, setEditMode } = useProfileStore();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    username: profile?.username || ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const usernameValidation = ProfileValidationUtils.validateUsername(formData.username);
    if (!usernameValidation.valid) {
      setErrors({ username: usernameValidation.error });
      return;
    }

    // Update
    const success = await updateCurrentProfile(formData);
    if (success) {
      setEditMode(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.full_name}
        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
        placeholder="Full Name"
      />
      
      <input
        value={formData.username}
        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        placeholder="Username"
      />
      {errors.username && <span className="error">{errors.username}</span>}
      
      <textarea
        value={formData.bio}
        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
        placeholder="Bio"
      />
      
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

### Profile Search with Filters

```tsx
import { useState, useEffect } from 'react';
import { 
  useProfileStore, 
  useSearchResults, 
  useSearchLoading,
  ProfileDisplayUtils 
} from '@/lib/profile';

function ProfileSearch() {
  const { searchProfiles } = useProfileStore();
  const results = useSearchResults();
  const loading = useSearchLoading();
  const [filters, setFilters] = useState({
    role: '',
    search_query: '',
    is_verified: false
  });

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchProfiles(filters);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [filters, searchProfiles]);

  return (
    <div>
      <div className="filters">
        <select 
          value={filters.role}
          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
        >
          <option value="">All Roles</option>
          <option value="S">Students</option>
          <option value="T">Teachers</option>
          <option value="C">Coaches</option>
        </select>
        
        <input
          type="text"
          placeholder="Search by name or username..."
          value={filters.search_query}
          onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value }))}
        />
        
        <label>
          <input
            type="checkbox"
            checked={filters.is_verified}
            onChange={(e) => setFilters(prev => ({ ...prev, is_verified: e.target.checked }))}
          />
          Verified only
        </label>
      </div>

      {loading ? (
        <div>Searching...</div>
      ) : (
        <div className="results">
          {results?.profiles.map(profile => (
            <div key={profile.id} className="profile-card">
              <h3>{ProfileDisplayUtils.getDisplayName(profile)}</h3>
              <p>{ProfileDisplayUtils.getRoleDisplayName(profile.role)}</p>
              {profile.bio && <p>{profile.bio}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Avatar Upload Component

```tsx
import { useState } from 'react';
import { useProfileStore, useAvatarUpload, PROFILE_CONSTANTS } from '@/lib/profile';

function AvatarUpload() {
  const { uploadAvatar } = useProfileStore();
  const { uploading, progress } = useAvatarUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    // Validate file
    if (file.size > PROFILE_CONSTANTS.AVATAR_MAX_SIZE) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    if (!PROFILE_CONSTANTS.AVATAR_ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Please use JPEG, PNG, or WebP.');
      return;
    }

    // Upload
    const success = await uploadAvatar(file);
    if (success) {
      alert('Avatar updated successfully!');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div 
      className={`avatar-upload ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div>
          <div>Uploading... {progress}%</div>
          <progress value={progress} max={100} />
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept={PROFILE_CONSTANTS.AVATAR_ALLOWED_TYPES.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <p>Drag & drop or click to upload</p>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

The profile system provides comprehensive error handling with standardized error codes:

```typescript
import { ProfileService, PROFILE_ERROR_CODES } from '@/lib/profile';

const result = await ProfileService.updateProfile(updates);

if (!result.success) {
  switch (result.error) {
    case PROFILE_ERROR_CODES.INVALID_USERNAME:
      // Handle username validation error
      break;
    case PROFILE_ERROR_CODES.USERNAME_TAKEN:
      // Handle username availability error
      break;
    case PROFILE_ERROR_CODES.NOT_AUTHENTICATED:
      // Redirect to login
      break;
    default:
      // Handle generic error
  }
}
```

## Performance Considerations

### Caching Strategy
- Profile data is cached in the Zustand store
- Cache TTL: 5 minutes for profiles, 2 minutes for search results
- Automatic cache invalidation on updates
- Optimistic updates for immediate UI feedback

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Infinite scroll support through search API

### Memory Management
- Automatic cleanup of cache entries
- Selective persistence of UI state only
- Efficient state selectors to prevent unnecessary re-renders

## Security Features

### Row Level Security (RLS)
- Database-level access controls
- Role-based visibility rules
- Automatic profile permissions checking

### Data Privacy
- Personal information only visible to authorized users
- Social links and contact info protected
- Permission utilities for field-level access control

### Validation
- Client-side and server-side validation
- Input sanitization
- File upload security checks

## Testing

The profile system is designed to be easily testable:

```typescript
// Mock profile data for testing
const mockProfile = {
  id: 'test-user-id',
  full_name: 'Test User',
  username: 'testuser',
  role: 'S' as const,
  // ... other fields
};

// Test profile operations
describe('Profile Service', () => {
  it('should update profile successfully', async () => {
    const result = await ProfileService.updateProfile({
      full_name: 'Updated Name'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.full_name).toBe('Updated Name');
  });
});
```

## Migration and Setup

1. **Database Setup**: Run the Supabase migrations in order:
   - `001_create_profiles_table.sql`
   - `002_create_profile_triggers.sql` 
   - `003_create_rls_policies.sql`

2. **Storage Setup**: Create an `avatars` bucket in Supabase Storage

3. **Environment Variables**: Ensure Supabase credentials are configured

4. **Dependencies**: Install required packages (zustand, @supabase/supabase-js)

This profile system provides a complete, production-ready solution for user profile management with excellent developer experience and robust functionality.