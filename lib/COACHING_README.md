# Coaching System Documentation

This documentation covers the comprehensive coaching system implemented for the Tutrsyyyy platform. The system provides a complete solution for managing coaching centers and branches, including CRUD operations, state management, caching, and utilities.

## Architecture Overview

The coaching system is organized into four main components:

- **Schema** (`lib/schema/coaching.types.ts`) - TypeScript interfaces and types
- **Service** (`lib/service/coaching.service.ts`) - Database operations and API interactions  
- **Store** (`lib/store/coaching.store.ts`) - State management with Zustand
- **Utils** (`lib/utils/coaching.utils.ts`) - Helper functions and utilities

## Quick Start

### 1. Import the Coaching System

```typescript
import { 
  CoachingService, 
  useCoachingStore,
  useMyCoachingCenters,
  useCurrentCoachingCenter,
  CoachingDisplayUtils 
} from '@/lib/coaching';
```

### 2. Load Coaching Centers

```typescript
// Load my coaching centers
const { loadMyCoachingCenters } = useCoachingStore();
await loadMyCoachingCenters();

// Or search public centers
const { searchCoachingCenters } = useCoachingStore();
await searchCoachingCenters({ category: 'SCHOOL_COACHING' });
```

### 3. Use Coaching Data in Components

```tsx
import { useMyCoachingCenters, useCoachingStore, CoachingDisplayUtils } from '@/lib/coaching';

function CoachingCenterCard() {
  const myCoachingCenters = useMyCoachingCenters();
  const { loadCoachingCenterDashboard } = useCoachingStore();

  const handleViewDashboard = (centerId: string) => {
    loadCoachingCenterDashboard(centerId);
  };

  return (
    <div>
      {myCoachingCenters.map(center => (
        <div key={center.id} className="coaching-card">
          <h3>{CoachingDisplayUtils.getDisplayName(center)}</h3>
          <p>{CoachingDisplayUtils.getCategoryDisplayName(center.category)}</p>
          <span className={`status-${CoachingDisplayUtils.getStatusColor(center.status)}`}>
            {CoachingDisplayUtils.getStatusDisplayName(center.status)}
          </span>
          <button onClick={() => handleViewDashboard(center.id)}>
            View Dashboard
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Database Schema

The coaching system is built on a robust Supabase database schema with the following key features:

### Coaching Centers Table
- Comprehensive business information (name, description, established year)
- Media support (logo, cover images)
- Rich categorization system with 25+ categories
- Contact information (phone, email, website)
- Management structure (owner, manager)
- Status tracking (draft, active, inactive)
- Verification and featured flags

### Coaching Branches Table
- Multiple location support per coaching center
- Individual branch management
- Main branch designation
- Contact information per branch
- Active/inactive status per branch

### Key Features
- Row Level Security (RLS) policies
- Automatic slug generation from names
- Search optimization with database functions
- Comprehensive indexing for performance
- Trigger-based data validation

## API Reference

### CoachingService

The service layer provides all database operations:

```typescript
// Get coaching center
const result = await CoachingService.getCoachingCenter(centerId);

// Create new coaching center
const createResult = await CoachingService.createCoachingCenter({
  name: "Elite Coaching Academy",
  category: "COMPETITIVE_EXAM",
  description: "Specialized in competitive exam preparation",
  subjects: ["Mathematics", "Physics", "Chemistry"],
  target_audience: ["Grade 10-12", "JEE Aspirants"]
});

// Update coaching center
const updateResult = await CoachingService.updateCoachingCenter(centerId, {
  description: "Updated description",
  phone: "+1234567890"
});

// Search coaching centers
const searchResult = await CoachingService.searchCoachingCenters(
  { 
    category: 'COMPETITIVE_EXAM', 
    is_verified: true,
    subjects: ['Mathematics']
  },
  { field: 'created_at', direction: 'desc' },
  1, // page
  20 // per page
);

// Upload logo
const logoResult = await CoachingService.uploadCoachingLogo(centerId, file);

// Create branch
const branchResult = await CoachingService.createCoachingBranch({
  coaching_center_id: centerId,
  name: "Downtown Branch",
  is_main_branch: false
});
```

### CoachingStore (Zustand)

State management with caching and optimistic updates:

```typescript
const { 
  loadMyCoachingCenters,
  loadCoachingCenterDashboard,
  createCoachingCenter,
  updateCoachingCenter,
  searchCoachingCenters,
  uploadLogo
} = useCoachingStore();

// Load my coaching centers
await loadMyCoachingCenters();

// Load center dashboard
await loadCoachingCenterDashboard(centerId);

// Create new center
const success = await createCoachingCenter({
  name: "New Academy",
  category: "SCHOOL_COACHING"
});

// Search with filters
await searchCoachingCenters(
  { category: ['COMPETITIVE_EXAM', 'ENTRANCE_EXAM'] },
  { field: 'is_featured', direction: 'desc' }
);
```

### Coaching Hooks

Convenient React hooks for common operations:

```typescript
// Basic coaching data
const myCoachingCenters = useMyCoachingCenters();
const currentCenter = useCurrentCoachingCenter();
const dashboard = useCurrentDashboard();

// Loading states
const centersLoading = useMyCoachingCentersLoading();
const dashboardLoading = useCurrentDashboardLoading();

// Search functionality
const searchResults = useCenterSearchResults();
const searchLoading = useCenterSearchLoading();

// Edit state
const isEditing = useEditMode();
const isCreating = useCreateMode();
const editData = useEditFormData();

// Upload states
const { uploading: logoUploading, progress: logoProgress } = useLogoUpload();
const { uploading: coverUploading, progress: coverProgress } = useCoverUpload();

// Cached data
const cachedCenter = useCoachingCenterFromCache(centerId);
const branches = useBranchesFromCache(centerId);
const featured = useFeaturedCenters();
```

## Utility Functions

### Display Utilities

```typescript
import { CoachingDisplayUtils } from '@/lib/coaching';

// Get display name
const displayName = CoachingDisplayUtils.getDisplayName(center);

// Get initials for logos
const initials = CoachingDisplayUtils.getInitials(center);

// Get category information
const categoryName = CoachingDisplayUtils.getCategoryDisplayName('COMPETITIVE_EXAM'); // "Competitive Exam Prep"
const categoryIcon = CoachingDisplayUtils.getCategoryIcon('IT_AND_PROGRAMMING'); // "💻"
const categoryColor = CoachingDisplayUtils.getCategoryColor('MUSIC_AND_DANCE'); // "red"

// Format data for display
const establishedText = CoachingDisplayUtils.formatEstablishedYear(2010); // "Established 2010 (14 years)"
const subjectsText = CoachingDisplayUtils.formatSubjects(['Math', 'Physics', 'Chemistry'], 2); // "Math, Physics +1 more"
const branchCount = CoachingDisplayUtils.formatBranchCount(5, 4); // "4/5 branches active"
```

### Validation Utilities

```typescript
import { CoachingValidationUtils } from '@/lib/coaching';

// Validate center data
const nameValidation = CoachingValidationUtils.validateName("Elite Academy");
if (!nameValidation.valid) {
  console.error(nameValidation.error);
}

// Validate slug
const slugValidation = CoachingValidationUtils.validateSlug("elite-academy");

// Validate contact information
const emailValidation = CoachingValidationUtils.validateEmail("contact@elite.com");
const phoneValidation = CoachingValidationUtils.validatePhone("+1234567890");
const websiteValidation = CoachingValidationUtils.validateWebsite("https://elite.com");

// Validate business data
const yearValidation = CoachingValidationUtils.validateEstablishedYear(2010);
const subjectsValidation = CoachingValidationUtils.validateSubjects(['Math', 'Physics']);
```

### Search Utilities

```typescript
import { CoachingSearchUtils } from '@/lib/coaching';

// Highlight search terms
const highlighted = CoachingSearchUtils.highlightSearchTerms(
  "Elite Mathematics Coaching", 
  "math"
); // "Elite <mark>Math</mark>ematics Coaching"

// Calculate relevance
const score = CoachingSearchUtils.calculateRelevanceScore(center, "mathematics");

// Generate suggestions
const suggestions = CoachingSearchUtils.generateSearchSuggestions(centers);
```

### Transform Utilities

```typescript
import { CoachingTransformUtils } from '@/lib/coaching';

// Transform to public data
const publicCenter = CoachingTransformUtils.toPublicCoachingCenter(fullCenter);

// Extract specific data
const contactInfo = CoachingTransformUtils.extractContactInfo(center);
const mediaInfo = CoachingTransformUtils.extractMediaInfo(center);
const businessInfo = CoachingTransformUtils.extractBusinessInfo(center);

// Generate slug
const slug = CoachingTransformUtils.generateSlugFromName("Elite Academy"); // "elite-academy"
```

## Usage Examples

### Complete Coaching Center Creation Flow

```tsx
import { useState } from 'react';
import { 
  useCoachingStore, 
  CoachingValidationUtils,
  CoachingDisplayUtils,
  COACHING_CATEGORIES
} from '@/lib/coaching';

function CreateCoachingCenterForm() {
  const { createCoachingCenter, setCreateMode } = useCoachingStore();
  const [formData, setFormData] = useState({
    name: '',
    category: 'SCHOOL_COACHING' as CoachingCategory,
    description: '',
    subjects: [] as string[],
    target_audience: [] as string[],
    phone: '',
    email: '',
    website: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors: Record<string, string> = {};
    
    const nameValidation = CoachingValidationUtils.validateName(formData.name);
    if (!nameValidation.valid) {
      validationErrors.name = nameValidation.error!;
    }
    
    const emailValidation = CoachingValidationUtils.validateEmail(formData.email);
    if (!emailValidation.valid) {
      validationErrors.email = emailValidation.error!;
    }
    
    const phoneValidation = CoachingValidationUtils.validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      validationErrors.phone = phoneValidation.error!;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create coaching center
    const success = await createCoachingCenter(formData);
    if (success) {
      setCreateMode(false);
      // Redirect to dashboard or show success message
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Center Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Enter coaching center name"
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CoachingCategory }))}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          {Object.values(COACHING_CATEGORIES).map(category => (
            <option key={category} value={category}>
              {CoachingDisplayUtils.getCategoryDisplayName(category)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={4}
          placeholder="Describe your coaching center..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Subjects Taught</label>
        <input
          type="text"
          placeholder="Enter subjects separated by commas"
          onChange={(e) => {
            const subjects = e.target.value.split(',').map(s => s.trim()).filter(s => s);
            setFormData(prev => ({ ...prev, subjects }));
          }}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300"
          />
          {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300"
          />
          {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300"
            placeholder="https://"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setCreateMode(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Coaching Center
        </button>
      </div>
    </form>
  );
}
```

### Coaching Center Search with Filters

```tsx
import { useState, useEffect } from 'react';
import { 
  useCoachingStore, 
  useCenterSearchResults, 
  useCenterSearchLoading,
  CoachingDisplayUtils,
  CoachingFilterUtils
} from '@/lib/coaching';

function CoachingCenterSearch() {
  const { searchCoachingCenters } = useCoachingStore();
  const results = useCenterSearchResults();
  const loading = useCenterSearchLoading();
  const [filters, setFilters] = useState({
    category: '' as CoachingCategory | '',
    search_query: '',
    is_verified: false,
    is_featured: false,
    subjects: [] as string[]
  });

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      const searchFilters = { ...filters };
      if (!searchFilters.category) delete searchFilters.category;
      if (searchFilters.subjects.length === 0) delete searchFilters.subjects;
      
      searchCoachingCenters(searchFilters);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [filters, searchCoachingCenters]);

  const categoryGroups = CoachingFilterUtils.getCategoriesByGroup();

  return (
    <div className="coaching-search">
      <div className="filters grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            placeholder="Search coaching centers..."
            value={filters.search_query}
            onChange={(e) => setFilters(prev => ({ ...prev, search_query: e.target.value }))}
            className="w-full rounded-md border-gray-300"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select 
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as CoachingCategory }))}
            className="w-full rounded-md border-gray-300"
          >
            <option value="">All Categories</option>
            {Object.entries(categoryGroups).map(([groupName, categories]) => (
              <optgroup key={groupName} label={groupName.replace('_', ' ')}>
                {categories.map(categoryMeta => (
                  <option key={categoryMeta.category} value={categoryMeta.category}>
                    {categoryMeta.icon} {categoryMeta.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="block text-sm font-medium">Filters</label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.is_verified}
              onChange={(e) => setFilters(prev => ({ ...prev, is_verified: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="ml-2 text-sm">Verified Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.is_featured}
              onChange={(e) => setFilters(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="ml-2 text-sm">Featured Only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Searching coaching centers...</p>
        </div>
      ) : (
        <div className="results">
          {results?.centers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No coaching centers found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results?.centers.map(center => (
                <div key={center.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    <img 
                      src={CoachingUrlUtils.getCoverUrl(center)} 
                      alt={center.name}
                      className="w-full h-full object-cover"
                    />
                    {center.is_featured && (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{center.name}</h3>
                      {center.is_verified && (
                        <span className="text-green-500 text-sm">✓ Verified</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {CoachingDisplayUtils.getCategoryIcon(center.category)} {' '}
                      {CoachingDisplayUtils.getCategoryDisplayName(center.category)}
                    </p>
                    
                    {center.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {center.description}
                      </p>
                    )}
                    
                    {center.subjects && (
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">Subjects:</span> {' '}
                        {CoachingDisplayUtils.formatSubjects(center.subjects, 2)}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{CoachingDisplayUtils.formatBranchCount(center.total_branches, center.active_branches)}</span>
                      <span>{CoachingDisplayUtils.formatLastUpdated(center.updated_at)}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a 
                        href={CoachingUrlUtils.getCoachingCenterUrl(center.slug || center.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {results && results.has_more && (
            <div className="text-center mt-8">
              <button 
                onClick={() => {
                  const nextPage = Math.floor(results.centers.length / results.per_page) + 1;
                  searchCoachingCenters(filters, undefined, nextPage);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Coaching Dashboard with Branch Management

```tsx
import { useEffect } from 'react';
import { 
  useCoachingStore,
  useCurrentDashboard,
  useCurrentDashboardLoading,
  CoachingDisplayUtils,
  CoachingAnalyticsUtils
} from '@/lib/coaching';

function CoachingDashboard({ centerId }: { centerId: string }) {
  const { loadCoachingCenterDashboard, createCoachingBranch } = useCoachingStore();
  const dashboard = useCurrentDashboard();
  const loading = useCurrentDashboardLoading();

  useEffect(() => {
    loadCoachingCenterDashboard(centerId);
  }, [centerId, loadCoachingCenterDashboard]);

  const handleCreateBranch = async (branchData: any) => {
    const success = await createCoachingBranch({
      coaching_center_id: centerId,
      ...branchData
    });
    
    if (success) {
      // Reload dashboard to show new branch
      loadCoachingCenterDashboard(centerId);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div>Dashboard not found</div>;
  }

  const { center, branches, stats, permissions } = dashboard;
  const completionPercentage = CoachingAnalyticsUtils.getCompletionPercentage(center);
  const recommendations = CoachingAnalyticsUtils.generateRecommendations(center);

  return (
    <div className="coaching-dashboard space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <img 
              src={CoachingUrlUtils.getLogoUrl(center, 80)} 
              alt={center.name}
              className="w-20 h-20 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold">{center.name}</h1>
              <p className="text-gray-600">
                {CoachingDisplayUtils.getCategoryIcon(center.category)} {' '}
                {CoachingDisplayUtils.getCategoryDisplayName(center.category)}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  center.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                  center.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {CoachingDisplayUtils.getStatusDisplayName(center.status)}
                </span>
                {center.is_verified && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    ✓ Verified
                  </span>
                )}
                {center.is_featured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                    ⭐ Featured
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {permissions.can_edit && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Edit Center
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Branches</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total_branches}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Branches</h3>
          <p className="text-2xl font-bold text-green-600">{stats.active_branches}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Profile Complete</h3>
          <p className="text-2xl font-bold text-purple-600">{completionPercentage}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Established</h3>
          <p className="text-2xl font-bold text-gray-600">
            {center.established_year || 'N/A'}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">💡 Recommendations</h3>
          <ul className="space-y-1">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-yellow-700">
                • {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Branches Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Branches</h2>
            {permissions.can_manage_branches && (
              <button 
                onClick={() => {/* Open create branch modal */}}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
              >
                Add Branch
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {branches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No branches added yet.</p>
              {permissions.can_manage_branches && (
                <button 
                  onClick={() => {/* Open create branch modal */}}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Add your first branch
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {branches.map(branch => (
                <div key={branch.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{branch.name}</h3>
                        {branch.is_main_branch && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            🏢 Main Branch
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {branch.description && (
                        <p className="text-sm text-gray-600 mt-1">{branch.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {branch.phone && <span>📞 {branch.phone}</span>}
                        {branch.email && <span>✉️ {branch.email}</span>}
                      </div>
                    </div>
                    
                    {permissions.can_manage_branches && (
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-800 text-sm">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Error Handling

The coaching system provides comprehensive error handling with standardized error codes:

```typescript
import { CoachingService, COACHING_ERROR_CODES } from '@/lib/coaching';

const result = await CoachingService.createCoachingCenter(centerData);

if (!result.success) {
  switch (result.error) {
    case COACHING_ERROR_CODES.INVALID_NAME:
      // Handle name validation error
      break;
    case COACHING_ERROR_CODES.SLUG_TAKEN:
      // Handle slug availability error
      break;
    case COACHING_ERROR_CODES.NOT_AUTHENTICATED:
      // Redirect to login
      break;
    default:
      // Handle generic error
  }
}
```

## Performance Considerations

### Caching Strategy
- Coaching center data is cached in the Zustand store
- Cache TTL: 5 minutes for centers, 3 minutes for search results
- Automatic cache invalidation on updates
- Optimistic updates for immediate UI feedback

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Infinite scroll support through search API

### Database Optimization
- Comprehensive indexing on frequently queried fields
- Database functions for complex searches
- View-based aggregated data for performance

## Security Features

### Row Level Security (RLS)
- Database-level access controls
- Owner/manager-based permissions
- Role-based visibility rules

### Data Privacy
- Contact information only visible to authorized users
- Permission utilities for field-level access control
- Secure file upload with validation

### Validation
- Client-side and server-side validation
- Input sanitization and length limits
- File upload security checks

## Testing

The coaching system is designed to be easily testable:

```typescript
// Mock coaching center data for testing
const mockCenter = {
  id: 'test-center-id',
  name: 'Test Academy',
  category: 'SCHOOL_COACHING' as const,
  status: 'ACTIVE' as const,
  // ... other fields
};

// Test coaching operations
describe('Coaching Service', () => {
  it('should create coaching center successfully', async () => {
    const result = await CoachingService.createCoachingCenter({
      name: 'Test Academy',
      category: 'SCHOOL_COACHING'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Test Academy');
  });
});
```

## Migration and Setup

1. **Database Setup**: Run the Supabase migration:
   - `007_create_coaching_system.sql`

2. **Storage Setup**: Create a `coaching-media` bucket in Supabase Storage

3. **Environment Variables**: Ensure Supabase credentials are configured

4. **Dependencies**: Install required packages (zustand, @supabase/supabase-js)

## Category System

The coaching system includes 25+ predefined categories organized into groups:

### Academic & School Level
- School Coaching, College Tuition, Home Tuition, Online Tuition

### Competitive Exams
- Competitive Exam Prep, Entrance Exam Prep, Test Preparation

### Skill & Career Development
- Language Training, IT & Programming, Design & Creative, Business & Marketing

### Hobby & Talent
- Music & Dance, Art & Craft, Sports & Fitness, Hobby Classes

### Professional & Certification
- Professional Certification, Government Exam Prep, UPSC & Defence, Banking & Insurance

Each category includes metadata for display (icon, color, description) and is organized into logical groups for better UI organization.

This coaching system provides a complete, production-ready solution for coaching center management with excellent developer experience, comprehensive features, and robust performance.