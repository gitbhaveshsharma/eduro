# Follow System Documentation

This documentation covers the comprehensive follow system implemented for the Tutrsy platform. The system provides a complete solution for managing user relationships, including follow/unfollow operations, follow requests, blocking, and social networking features.

## Architecture Overview

The follow system is organized into four main components:

- **Schema** (`lib/schema/follow.types.ts`) - TypeScript interfaces and types
- **Service** (`lib/service/follow.service.ts`) - Database operations and API interactions  
- **Store** (`lib/store/follow.store.ts`) - State management with Zustand
- **Utils** (`lib/utils/follow.utils.ts`) - Helper functions and utilities

## Quick Start

### 1. Import the Follow System

```typescript
import { 
  FollowAPI, 
  useFollowers,
  useFollowing,
  useFollowStore,
  FollowService,
  FollowDisplayUtils 
} from '@/lib/follow';
```

### 2. Initialize the Follow System

```typescript
// Initialize when user logs in
await FollowAPI.initialize();

// Or use the store directly
const { loadFollowers, loadFollowing } = useFollowStore();
await Promise.all([
  loadFollowers(),
  loadFollowing()
]);
```

### 3. Use Follow Data in Components

```tsx
import { useFollowers, useFollowing, useFollowLoading } from '@/lib/follow';

function FollowersCard() {
  const followers = useFollowers();
  const following = useFollowing();
  const loading = useFollowersLoading();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Followers ({followers.length})</h2>
      <h2>Following ({following.length})</h2>
    </div>
  );
}
```

## Database Schema

The follow system is built on a robust Supabase database schema with the following key features:

### Core Tables

1. **user_followers** - Main follow relationships
2. **follow_requests** - Pending follow requests for private accounts
3. **blocked_users** - User blocking relationships

### Key Features
- Row Level Security (RLS) policies
- Automatic mutual follow detection
- Follow categorization (close_friend, colleague, mentor, etc.)
- Notification preferences per follow
- Comprehensive indexing for performance
- Trigger-based follower count synchronization

## API Reference

### FollowService

The service layer provides all database operations:

```typescript
// Follow a user
const result = await FollowService.followUser({
  following_id: "user-id",
  follow_category: "colleague",
  notification_enabled: true,
  notes: "Met at conference"
});

// Unfollow a user
const unfollowResult = await FollowService.unfollowUser({
  following_id: "user-id"
});

// Send follow request
const requestResult = await FollowService.sendFollowRequest({
  target_id: "user-id",
  message: "Hi! I'd like to connect"
});

// Block a user
const blockResult = await FollowService.blockUser({
  blocked_id: "user-id",
  reason: "Inappropriate behavior"
});

// Get follow status
const statusResult = await FollowService.getFollowStatus("user-id");

// Get followers/following
const followersResult = await FollowService.getFollowers();
const followingResult = await FollowService.getFollowing();
```

### FollowStore (Zustand)

State management with caching and optimistic updates:

```typescript
const { 
  followUser,
  unfollowUser,
  sendFollowRequest,
  blockUser,
  loadFollowers,
  loadFollowing,
  getFollowStatus
} = useFollowStore();

// Follow with optimistic updates
const success = await followUser({
  following_id: "user-id",
  follow_category: "mentor"
});

// Load followers with pagination
await loadFollowers(undefined, undefined, undefined, 1, true);

// Get follow status with caching
const status = await getFollowStatus("user-id", true);
```

### Follow Hooks

Convenient React hooks for common operations:

```typescript
// Data hooks
const followers = useFollowers();
const following = useFollowing();
const receivedRequests = useReceivedRequests();
const sentRequests = useSentRequests();
const blockedUsers = useBlockedUsers();
const stats = useFollowStats();

// Loading state hooks
const followersLoading = useFollowersLoading();
const followingLoading = useFollowingLoading();
const isFollowLoading = useFollowLoading("user-id");
const isUnfollowLoading = useUnfollowLoading("user-id");

// Helper hooks
const isFollowing = useIsFollowing("user-id");
const isFollowedBy = useIsFollowedBy("user-id");
const isBlocked = useIsBlocked("user-id");
const hasPendingRequest = useHasPendingRequest("user-id");

// Count hooks
const followCounts = useFollowCounts();
const mutualFollows = useMutualFollows();
const pendingRequests = usePendingRequests();
```

## Utility Functions

### Display Utilities

```typescript
import { FollowDisplayUtils } from '@/lib/follow';

// Get display name
const displayName = FollowDisplayUtils.getDisplayName(followerProfile);

// Get initials for avatars
const initials = FollowDisplayUtils.getInitials(followerProfile);

// Format follow status
const status = FollowDisplayUtils.formatFollowStatus('active'); // "Following"

// Format follow counts
const count = FollowDisplayUtils.formatFollowCount(1250); // "1.3K"

// Format timestamps
const timeAgo = FollowDisplayUtils.formatFollowTime(createdAt);

// Get relationship description
const description = FollowDisplayUtils.getRelationshipDescription(followStatus);
```

### Validation Utilities

```typescript
import { FollowValidationUtils } from '@/lib/follow';

// Validate follow category
const categoryValidation = FollowValidationUtils.validateFollowCategory("mentor");
if (!categoryValidation.valid) {
  console.error(categoryValidation.error);
}

// Validate follow notes
const notesValidation = FollowValidationUtils.validateFollowNotes("Great mentor!");

// Validate request message
const messageValidation = FollowValidationUtils.validateRequestMessage("Hi there!");

// Validate user ID
const userIdValidation = FollowValidationUtils.validateUserId(userId);
```

### Filtering and Sorting Utilities

```typescript
import { FollowFilterUtils, FollowSortUtils } from '@/lib/follow';

// Filter followers
const filteredFollowers = FollowFilterUtils.filterFollowers(followers, {
  follow_category: ['mentor', 'colleague'],
  is_mutual: true,
  search_query: 'john'
});

// Sort followers
const sortedFollowers = FollowSortUtils.sortFollowers(
  followers, 
  'follower_count', 
  'desc'
);
```

### Analytics Utilities

```typescript
import { FollowAnalyticsUtils } from '@/lib/follow';

// Calculate engagement metrics
const metrics = FollowAnalyticsUtils.calculateEngagementMetrics(stats);
console.log(metrics.mutualFollowRate, metrics.followBackRate);

// Analyze follow patterns
const patterns = FollowAnalyticsUtils.analyzeFollowPatterns(followers, following);
console.log(patterns.mostCommonCategory, patterns.averageFollowAge);

// Calculate recommendation score
const score = FollowAnalyticsUtils.calculateRecommendationScore(
  targetProfile, 
  currentProfile, 
  mutualConnections
);
```

## Usage Examples

### Complete Follow/Unfollow Flow

```tsx
import { useState } from 'react';
import { 
  useFollowStore,
  useIsFollowing,
  useFollowLoading,
  FollowDisplayUtils,
  FollowPermissionUtils 
} from '@/lib/follow';

function FollowButton({ targetUser, currentUser }) {
  const { followUser, unfollowUser } = useFollowStore();
  const isFollowing = useIsFollowing(targetUser.id);
  const isLoading = useFollowLoading(targetUser.id);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  const canFollow = FollowPermissionUtils.canFollow(
    currentUser.role,
    targetUser.role
  );

  const handleFollow = async (category = null) => {
    const success = await followUser({
      following_id: targetUser.id,
      follow_category: category,
      notification_enabled: true
    });
    
    if (success) {
      setShowCategorySelect(false);
    }
  };

  const handleUnfollow = async () => {
    await unfollowUser({ following_id: targetUser.id });
  };

  if (!canFollow) return null;

  return (
    <div>
      {isFollowing ? (
        <button 
          onClick={handleUnfollow}
          disabled={isLoading}
          className="btn-secondary"
        >
          {isLoading ? 'Unfollowing...' : 'Unfollow'}
        </button>
      ) : (
        <div>
          <button 
            onClick={() => setShowCategorySelect(true)}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Following...' : 'Follow'}
          </button>
          
          {showCategorySelect && (
            <div className="category-select">
              <button onClick={() => handleFollow('colleague')}>Colleague</button>
              <button onClick={() => handleFollow('mentor')}>Mentor</button>
              <button onClick={() => handleFollow('close_friend')}>Close Friend</button>
              <button onClick={() => handleFollow()}>General</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Follow Request Management

```tsx
import { 
  useReceivedRequests,
  useRequestsLoading,
  useFollowStore,
  FollowDisplayUtils 
} from '@/lib/follow';

function FollowRequestsList() {
  const requests = useReceivedRequests();
  const loading = useRequestsLoading();
  const { respondToFollowRequest } = useFollowStore();

  const handleAccept = async (requestId) => {
    await respondToFollowRequest({
      request_id: requestId,
      status: 'accepted'
    });
  };

  const handleReject = async (requestId) => {
    await respondToFollowRequest({
      request_id: requestId,
      status: 'rejected'
    });
  };

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="requests-list">
      {requests.filter(r => r.status === 'pending').map(request => (
        <div key={request.id} className="request-card">
          <div className="request-info">
            <h4>{FollowDisplayUtils.getDisplayName(request.requester_profile)}</h4>
            {request.message && <p>"{request.message}"</p>}
            <span className="time">
              {FollowDisplayUtils.formatFollowTime(request.created_at)}
            </span>
          </div>
          
          <div className="request-actions">
            <button 
              onClick={() => handleAccept(request.id)}
              className="btn-primary"
            >
              Accept
            </button>
            <button 
              onClick={() => handleReject(request.id)}
              className="btn-secondary"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Followers/Following Lists with Filtering

```tsx
import { useState, useEffect } from 'react';
import { 
  useFollowers,
  useFollowing,
  useFollowStore,
  FollowFilterUtils,
  FollowDisplayUtils 
} from '@/lib/follow';

function FollowLists() {
  const followers = useFollowers();
  const following = useFollowing();
  const { loadFollowers, loadFollowing } = useFollowStore();
  const [activeTab, setActiveTab] = useState('followers');
  const [filters, setFilters] = useState({
    search_query: '',
    follow_category: '',
    is_mutual: false
  });

  useEffect(() => {
    loadFollowers();
    loadFollowing();
  }, []);

  const filteredData = activeTab === 'followers' 
    ? FollowFilterUtils.filterFollowers(followers, filters)
    : FollowFilterUtils.filterFollowers(following, filters);

  return (
    <div className="follow-lists">
      <div className="tabs">
        <button 
          className={activeTab === 'followers' ? 'active' : ''}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({followers.length})
        </button>
        <button 
          className={activeTab === 'following' ? 'active' : ''}
          onClick={() => setActiveTab('following')}
        >
          Following ({following.length})
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search_query}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            search_query: e.target.value 
          }))}
        />
        
        <select
          value={filters.follow_category}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            follow_category: e.target.value 
          }))}
        >
          <option value="">All Categories</option>
          <option value="mentor">Mentors</option>
          <option value="colleague">Colleagues</option>
          <option value="close_friend">Close Friends</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            checked={filters.is_mutual}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              is_mutual: e.target.checked 
            }))}
          />
          Mutual follows only
        </label>
      </div>

      <div className="follow-list">
        {filteredData.map(item => {
          const profile = activeTab === 'followers' 
            ? item.follower_profile 
            : item.following_profile;
            
          return (
            <div key={item.id} className="follow-item">
              <div className="profile-info">
                <h4>{FollowDisplayUtils.getDisplayName(profile)}</h4>
                <p>{FollowDisplayUtils.getRoleBadge(profile.role)}</p>
                {item.follow_category && (
                  <span className="category">
                    {FollowDisplayUtils.formatFollowCategory(item.follow_category)}
                  </span>
                )}
                {item.is_mutual && <span className="mutual">Mutual</span>}
              </div>
              
              <div className="follow-stats">
                <span>{FollowDisplayUtils.formatFollowCount(profile.follower_count)} followers</span>
                <span>{FollowDisplayUtils.formatFollowCount(profile.following_count)} following</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Follow Suggestions

```tsx
import { useEffect } from 'react';
import { 
  useFollowSuggestions,
  useSuggestionsLoading,
  useFollowStore,
  FollowDisplayUtils,
  FollowAnalyticsUtils 
} from '@/lib/follow';

function FollowSuggestions() {
  const suggestions = useFollowSuggestions();
  const loading = useSuggestionsLoading();
  const { loadSuggestions, followUser } = useFollowStore();

  useEffect(() => {
    loadSuggestions(10);
  }, []);

  const handleFollowSuggestion = async (userId) => {
    await followUser({ following_id: userId });
    // Refresh suggestions after following
    loadSuggestions(10, true);
  };

  if (loading) return <div>Loading suggestions...</div>;
  if (!suggestions?.suggestions.length) return <div>No suggestions available</div>;

  return (
    <div className="suggestions">
      <h3>Suggested Connections</h3>
      
      {suggestions.suggestions.map(suggestion => (
        <div key={suggestion.user.id} className="suggestion-card">
          <div className="user-info">
            <h4>{FollowDisplayUtils.getDisplayName(suggestion.user)}</h4>
            <p>{FollowDisplayUtils.getRoleBadge(suggestion.user.role)}</p>
            <span className="reason">
              {suggestion.reason === 'mutual_connections' && 
                `${suggestion.connection_count} mutual connections`}
              {suggestion.reason === 'same_role' && 'Same role'}
              {suggestion.reason === 'popular' && 'Popular user'}
            </span>
          </div>
          
          <button
            onClick={() => handleFollowSuggestion(suggestion.user.id)}
            className="btn-primary"
          >
            Follow
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

The follow system provides comprehensive error handling with standardized error codes:

```typescript
import { FollowService, FOLLOW_ERROR_CODES } from '@/lib/follow';

const result = await FollowService.followUser({ following_id: userId });

if (!result.success) {
  switch (result.error) {
    case FOLLOW_ERROR_CODES.ALREADY_FOLLOWING:
      // Handle already following error
      break;
    case FOLLOW_ERROR_CODES.USER_BLOCKED:
      // Handle blocked user error
      break;
    case FOLLOW_ERROR_CODES.NOT_AUTHENTICATED:
      // Redirect to login
      break;
    default:
      // Handle generic error
  }
}
```

## Performance Considerations

### Caching Strategy
- Follow status cached for 5 minutes
- Follow lists cached for 2 minutes
- Statistics cached for 10 minutes
- Suggestions cached for 30 minutes
- Automatic cache invalidation on updates

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Infinite scroll support

### Optimistic Updates
- Immediate UI feedback for follow/unfollow actions
- Automatic rollback on failure
- Optimistic updates for follow requests

## Security Features

### Row Level Security (RLS)
- Database-level access controls
- User-specific data visibility
- Automatic permission checking

### Data Privacy
- Follow relationships only visible to participants
- Block relationships completely private
- Request messages private to participants

### Rate Limiting
- Maximum 20 follow requests per hour
- Bulk operations limited to 50 users
- Automatic rate limit enforcement

## Database Functions

The system includes several PostgreSQL functions for enhanced functionality:

```sql
-- Check if user A follows user B
SELECT is_following('user-a-id', 'user-b-id');

-- Check mutual follow status
SELECT is_mutual_follow('user-a-id', 'user-b-id');

-- Check if user is blocked
SELECT is_blocked('blocker-id', 'blocked-id');

-- Follow a user (with automatic mutual detection)
SELECT follow_user('target-user-id');

-- Unfollow a user
SELECT unfollow_user('target-user-id');

-- Get followers list
SELECT * FROM get_followers('user-id', 50, 0);

-- Get following list
SELECT * FROM get_following('user-id', 50, 0);
```

## Migration and Setup

1. **Database Setup**: Run the Supabase migration:
   ```bash
   supabase migration up 008_create_follow_system.sql
   ```

2. **Environment Variables**: Ensure Supabase credentials are configured

3. **Dependencies**: The system uses zustand for state management

4. **Initialization**: Initialize the follow system on user login:
   ```typescript
   await FollowAPI.initialize();
   ```

## Testing

The follow system is designed to be easily testable:

```typescript
// Mock follow data for testing
const mockFollower = {
  id: 'follow-1',
  follower_id: 'user-1',
  following_id: 'user-2',
  follow_status: 'active',
  is_mutual: true,
  // ... other fields
};

// Test follow operations
describe('Follow Service', () => {
  it('should follow user successfully', async () => {
    const result = await FollowService.followUser({
      following_id: 'target-user-id'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.following_id).toBe('target-user-id');
  });
});
```

This follow system provides a complete, production-ready solution for social networking features with excellent developer experience, comprehensive functionality, and robust security.