# GetPost Service & Store Implementation

## Overview

This implementation provides a comprehensive, production-ready solution for the feed system based on the enterprise-grade `get_posts` RPC function from migration `009_create_get_posts_function.sql`.

## Key Components Created

### 1. GetPost Service (`lib/service/getpost.service.ts`)
- **Purpose**: Dedicated service for handling the `get_posts` RPC function
- **Features**:
  - Multiple feed algorithms (smart, following, trending, recent, popular, personalized)
  - Advanced filtering and search capabilities
  - Location-based feeds with radius support
  - Comprehensive parameter validation
  - Error handling with specific error codes
  - Batch post view recording
  - Feed analytics integration

### 2. GetPost Store (`lib/store/getpost.store.ts`)
- **Purpose**: State management using Zustand with advanced features
- **Features**:
  - Intelligent caching with TTL
  - Loading states (idle, loading, success, error)
  - Infinite scroll support
  - Real-time updates processing
  - User interaction tracking (likes, saves, views)
  - Optimistic updates with error rollback
  - Search functionality
  - Analytics integration

### 3. Reusable Components

#### PostCard (`components/feed/post-card.tsx`)
- **Purpose**: Reusable post display component
- **Features**:
  - Support for all post types (TEXT, IMAGE, VIDEO, POLL, etc.)
  - Media gallery with responsive grid
  - Link previews
  - Engagement actions (like, comment, share, save)
  - Author information with verification badges
  - Location and category tags
  - Compact mode support
  - Accessibility features

#### FeedContainer (`components/feed/feed-container.tsx`)
- **Purpose**: Main feed container with data management
- **Features**:
  - Infinite scroll with intersection observer
  - Multiple feed type support
  - Error handling and retry logic
  - Loading states management
  - User interaction handling
  - Specialized containers for different feed types
  - Search and category-specific feeds

#### FeedLoading (`components/feed/feed-loading.tsx`)
- **Purpose**: Loading states and skeleton components
- **Features**:
  - Skeleton loaders for different post types
  - Error states with retry functionality
  - Empty states for different scenarios
  - Search-specific empty states
  - Loading indicators for infinite scroll

### 4. Updated FeedSection (`components/feed/feed-section.tsx`)
- **Purpose**: Main feed component using new architecture
- **Features**:
  - Production-ready implementation
  - No more mock data
  - Router integration for navigation
  - Support for all feed types
  - Search functionality
  - Location-based feeds
  - Specialized feed variants

## SQL Function Integration

The implementation perfectly aligns with the `get_posts` SQL function parameters:

### Function Parameters Supported:
- `p_user_id` - Automatic user context
- `p_limit` / `p_offset` - Pagination support
- `p_cursor` - Cursor-based pagination
- `p_feed_type` - Algorithm selection
- `p_post_types` - Content type filtering
- `p_category` / `p_tags` - Content categorization
- `p_author_id` - Author-specific feeds
- `p_privacy` - Privacy level filtering
- `p_search_query` - Full-text search
- `p_location_radius_km` / `p_user_coordinates` - Geographic filtering
- `p_exclude_seen` - Hide viewed content
- `p_include_sensitive` - Content filtering
- `p_min_engagement_score` - Quality threshold
- `p_posted_after` / `p_posted_before` - Time range filtering
- `p_time_window_hours` - Sliding time window

### Return Data Mapping:
- Complete post information with author details
- Engagement metrics and user interaction states
- Algorithm scoring (relevance, viral velocity, freshness, etc.)
- Rich metadata (location, media, links)

## Usage Examples

### Basic Feed
```tsx
import { FeedSection } from '@/components/feed';

// Smart feed (default)
<FeedSection sortType="recent" />

// Trending feed
<FeedSection sortType="trending" />

// Search feed
<FeedSection 
  sortType="recent" 
  searchQuery="react typescript" 
/>
```

### Advanced Feed Container
```tsx
import { TrendingFeedContainer } from '@/components/feed';

<TrendingFeedContainer
  showEngagementScores={true}
  onPostClick={(id) => router.push(`/posts/${id}`)}
  onAuthorClick={(id) => router.push(`/profile/${id}`)}
  filters={{
    time_window_hours: 24,
    min_engagement_score: 10,
    category: "technology"
  }}
/>
```

### Location-Based Feed
```tsx
import { LocationFeedSection } from '@/components/feed';

<LocationFeedSection
  latitude={40.7128}
  longitude={-74.0060}
  radius={10}
  showEngagementScores={true}
/>
```

### Search Feed
```tsx
import { SearchFeedContainer } from '@/components/feed';

<SearchFeedContainer
  query="machine learning"
  filters={{
    post_types: ["ARTICLE", "QUESTION"],
    min_engagement_score: 5
  }}
/>
```

### Using the Store Directly
```tsx
import { useGetPostStore } from '@/lib/store/getpost.store';

function CustomFeed() {
  const {
    posts,
    loadingState,
    error,
    loadSmartFeed,
    togglePostLike,
    hasMore,
    loadMorePosts
  } = useGetPostStore();

  useEffect(() => {
    loadSmartFeed({
      limit: 20,
      exclude_seen: true,
      min_engagement_score: 5
    });
  }, []);

  // Component implementation...
}
```

## Performance Features

1. **Intelligent Caching**: 5-minute TTL with LRU eviction
2. **Optimistic Updates**: Immediate UI feedback with rollback on error
3. **Batch Operations**: Efficient view recording and data fetching
4. **Infinite Scroll**: Intersection Observer-based loading
5. **Code Splitting**: Modular architecture for bundle optimization

## Error Handling

- Network error recovery with retry mechanisms
- Graceful degradation for offline scenarios
- User-friendly error messages
- Automatic error boundary integration
- Logging for debugging and monitoring

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Type Safety

- Full TypeScript coverage
- Strict type checking for all API interactions
- Runtime validation for critical data
- Proper error type definitions

## Testing Considerations

The modular architecture supports easy testing:
- Service layer can be mocked for component tests
- Store state can be preset for UI tests
- Components are isolated and testable
- API interactions are abstracted

## Migration Notes

The refactored components maintain backward compatibility while providing enhanced functionality:
- Existing FeedSection props work as before
- Additional props provide new capabilities
- Gradual migration path available
- Performance improvements are automatic

This implementation provides a solid foundation for a scalable, maintainable feed system that leverages the full power of the enterprise-grade SQL function while maintaining excellent user experience.