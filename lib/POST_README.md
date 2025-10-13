# Post System Documentation

This documentation covers the comprehensive post system implemented for the Eduro platform. The system provides a complete solution for managing posts, comments, reactions, and real-time interactions with support for geographic features, media attachments, and advanced engagement tracking.

## Architecture Overview

The post system is organized into four main components:

- **Schema** (`lib/schema/post.types.ts`) - TypeScript interfaces and types
- **Service** (`lib/service/post.service.ts`) - Database operations and API interactions  
- **Store** (`lib/store/post.store.ts`) - State management with Zustand and real-time subscriptions
- **Utils** (`lib/utils/post.utils.ts`) - Helper functions and utilities

## Quick Start

### 1. Import the Post System

```typescript
import { 
  PostService, 
  usePostStore,
  useFeedPosts,
  usePostComments,
  PostUtils
} from '@/lib/post';
```

### 2. Initialize the Post System

```typescript
// Load feed posts
const { loadFeed, subscribeToFeed } = usePostStore();
await loadFeed('recent');

// Subscribe to real-time updates
subscribeToFeed();
```

### 3. Use Post Data in Components

```tsx
import { useFeedPosts, useFeedLoading, usePostStore } from '@/lib/post';

function PostFeed() {
  const posts = useFeedPosts();
  const loading = useFeedLoading();
  const { loadMoreFeed, changeFeedSort } = usePostStore();

  if (loading) return <div>Loading posts...</div>;

  return (
    <div>
      <div className="feed-controls">
        <button onClick={() => changeFeedSort('recent')}>Recent</button>
        <button onClick={() => changeFeedSort('popular')}>Popular</button>
        <button onClick={() => changeFeedSort('trending')}>Trending</button>
      </div>
      
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      <button onClick={loadMoreFeed}>Load More</button>
    </div>
  );
}
```

## Database Schema

The post system is built on a comprehensive Supabase database schema with the following key features:

### Post Types
- `TEXT` - Simple text posts
- `IMAGE` - Image posts with text
- `VIDEO` - Video posts with text
- `POLL` - Interactive poll posts
- `ARTICLE` - Long-form articles
- `QUESTION` - Q&A posts
- `ANNOUNCEMENT` - Official announcements
- `EVENT` - Event posts
- `DISCUSSION` - Discussion threads

### Privacy Levels
- `PUBLIC` - Visible to everyone
- `FOLLOWERS` - Visible to followers only
- `FRIENDS` - Visible to friends only
- `PRIVATE` - Visible to author only
- `RESTRICTED` - Visible to specific users

### Key Features
- **Geographic Support**: PostGIS integration for location-based posts
- **Media Attachments**: Support for images, videos, audio, and documents
- **Threaded Comments**: Unlimited nested comment depth with proper threading
- **Real-time Updates**: Live reactions, comments, and engagement metrics
- **Engagement Tracking**: Advanced analytics with time-decay algorithms
- **Full-text Search**: Comprehensive search with filters and sorting
- **Row Level Security**: Database-level access controls

## API Reference

### PostService

The service layer provides all database operations:

```typescript
// Create a new post
const result = await PostService.createPost({
  content: "Hello, world! 🌍",
  post_type: "TEXT",
  privacy: "PUBLIC",
  tags: ["hello", "world"],
  location: "San Francisco, CA",
  coordinates: { latitude: 37.7749, longitude: -122.4194 }
});

// Get a specific post
const postResult = await PostService.getPost(postId);

// Update post
const updateResult = await PostService.updatePost(postId, {
  content: "Updated content",
  tags: ["updated", "content"]
});

// Search posts with filters
const searchResult = await PostService.searchPosts(
  {
    post_type: ['TEXT', 'IMAGE'],
    tags: ['education'],
    has_location: true,
    center_coordinates: { latitude: 37.7749, longitude: -122.4194 },
    location_radius: 10, // km
    search_query: 'learning'
  },
  { field: 'engagement_score', direction: 'desc' },
  1, // page
  20 // per page
);

// Get feed posts
const feedResult = await PostService.getFeedPosts('trending', 1, 20);
```

### PostStore (Zustand)

State management with caching, real-time updates, and optimistic updates:

```typescript
const { 
  loadFeed,
  createPost,
  toggleReaction,
  createComment,
  toggleSavedPost,
  subscribeToFeed,
  loadNearbyPosts
} = usePostStore();

// Load and refresh feed
await loadFeed('recent', true); // true = refresh

// Create a new post with optimistic updates
const success = await createPost({
  content: "New post content",
  post_type: "TEXT",
  tags: ["new", "post"]
});

// Toggle reactions with real-time updates
await toggleReaction('POST', postId, 1); // reaction ID 1 = like

// Create comments with threading
await createComment(postId, "Great post!", parentCommentId);

// Geographic features
await loadNearbyPosts(
  { latitude: 37.7749, longitude: -122.4194 }, 
  5 // 5km radius
);
```

### Post Hooks

Convenient React hooks for common operations:

```typescript
// Feed data
const posts = useFeedPosts();
const loading = useFeedLoading();
const error = useFeedError();

// Specific post data
const post = usePost(postId);
const comments = usePostComments(postId);
const userReaction = useUserReaction(postId);

// User interactions
const isLiked = useIsPostLiked(postId);
const isSaved = useIsPostSaved(postId);

// Geographic features
const userLocation = useUserLocation();
const nearbyPosts = useNearbyPosts();

// Media uploads
const mediaUploads = useMediaUploads();
const commentComposition = useCommentComposition();
```

## Utility Functions

### Display Utilities

```typescript
import { PostUtils } from '@/lib/post';

// Get display title
const title = PostUtils.Display.getDisplayTitle(post);

// Format engagement counts
const likeCount = PostUtils.Display.formatEngagementCount(post.like_count);

// Format relative time
const timeAgo = PostUtils.Display.formatRelativeTime(post.created_at);

// Get reading time estimate
const readingTime = PostUtils.Display.getReadingTime(post.content);

// Check if post is trending
const isTrending = PostUtils.Display.isTrending(post);
```

### Content Utilities

```typescript
import { PostUtils } from '@/lib/post';

// Extract hashtags and mentions
const hashtags = PostUtils.Content.extractHashtags(post.content);
const mentions = PostUtils.Content.extractMentions(post.content);
const urls = PostUtils.Content.extractUrls(post.content);

// Linkify content
const linkedContent = PostUtils.Content.linkifyHashtags(
  post.content,
  (tag) => console.log('Clicked hashtag:', tag)
);

// Generate content preview
const preview = PostUtils.Content.generateContentPreview(post.content, 200);

// Validate content
const validation = PostUtils.Content.validateContent(content);
if (!validation.valid) {
  console.error(validation.error);
}
```

### Geographic Utilities

```typescript
import { PostUtils } from '@/lib/post';

// Calculate distance between coordinates
const distance = PostUtils.Geographic.calculateDistance(
  { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
  { latitude: 40.7128, longitude: -74.0060 }   // New York
);

// Format distance for display
const distanceText = PostUtils.Geographic.formatDistance(distance);

// Get current user location
const location = await PostUtils.Geographic.getCurrentLocation();

// Check if point is within area
const isNearby = PostUtils.Geographic.isWithinArea(
  postCoordinates,
  userLocation,
  10 // 10km radius
);
```

### Comment Utilities

```typescript
import { PostUtils } from '@/lib/post';

// Sort comments by thread for proper nesting
const sortedComments = PostUtils.Comment.sortCommentsByThread(comments);

// Build comment tree structure
const commentTree = PostUtils.Comment.buildCommentTree(comments);

// Get thread depth indicator
const indent = PostUtils.Comment.getThreadDepthIndicator(comment.thread_level);

// Group comments by parent
const grouped = PostUtils.Comment.groupCommentsByParent(comments);
```

## Usage Examples

### Complete Post Creation Flow

```tsx
import { useState } from 'react';
import { usePostStore, PostUtils } from '@/lib/post';

function CreatePostForm() {
  const { createPost, uploadMedia } = usePostStore();
  const [formData, setFormData] = useState({
    content: '',
    title: '',
    post_type: 'TEXT' as const,
    privacy: 'PUBLIC' as const,
    tags: [] as string[],
    location: '',
    coordinates: null as PostCoordinates | null,
    media_urls: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate content
    const contentValidation = PostUtils.Content.validateContent(formData.content);
    if (!contentValidation.valid) {
      alert(contentValidation.error);
      setLoading(false);
      return;
    }

    // Create post
    const success = await createPost(formData);
    setLoading(false);

    if (success) {
      setFormData({
        content: '',
        title: '',
        post_type: 'TEXT',
        privacy: 'PUBLIC',
        tags: [],
        location: '',
        coordinates: null,
        media_urls: []
      });
    }
  };

  const handleMediaUpload = async (file: File) => {
    const url = await uploadMedia(file);
    if (url) {
      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, url]
      }));
    }
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-post-form">
      <div className="form-group">
        <select
          value={formData.post_type}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            post_type: e.target.value as any 
          }))}
        >
          <option value="TEXT">Text Post</option>
          <option value="IMAGE">Image Post</option>
          <option value="VIDEO">Video Post</option>
          <option value="ARTICLE">Article</option>
          <option value="QUESTION">Question</option>
        </select>
      </div>

      {(formData.post_type === 'ARTICLE' || formData.post_type === 'QUESTION') && (
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      )}

      <textarea
        placeholder="What's on your mind?"
        value={formData.content}
        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
        rows={4}
        required
      />

      <div className="form-group">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaUpload(file);
          }}
        />
      </div>

      <div className="tags-input">
        <input
          type="text"
          placeholder="Add tags..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const tag = e.currentTarget.value.trim();
              if (tag) {
                addTag(tag);
                e.currentTarget.value = '';
              }
            }
          }}
        />
        <div className="tags">
          {formData.tags.map(tag => (
            <span key={tag} className="tag">
              #{tag}
              <button 
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  tags: prev.tags.filter(t => t !== tag)
                }))}
              >×</button>
            </span>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

### Real-time Comments Component

```tsx
import { useEffect, useState } from 'react';
import { usePostStore, usePostComments, PostUtils } from '@/lib/post';

function PostComments({ postId }: { postId: string }) {
  const comments = usePostComments(postId);
  const { 
    loadComments, 
    createComment, 
    subscribeToComments,
    setCommentComposition,
    commentComposition 
  } = usePostStore();
  
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const currentComposition = commentComposition.get(postId) || '';

  useEffect(() => {
    loadComments(postId);
    subscribeToComments(postId);
    
    return () => {
      // Cleanup subscription handled by store
    };
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentComposition.trim()) return;

    const success = await createComment(postId, currentComposition, replyTo);
    if (success) {
      setReplyTo(null);
    }
  };

  const commentTree = PostUtils.Comment.buildCommentTree(comments);

  const renderCommentNode = (node: any, depth = 0) => (
    <div 
      key={node.comment.id} 
      className={`comment depth-${Math.min(depth, 5)}`}
      style={{ marginLeft: `${depth * 20}px` }}
    >
      <div className="comment-header">
        <strong>{node.comment.author_full_name || node.comment.author_username}</strong>
        <span className="comment-time">
          {PostUtils.Display.formatRelativeTime(node.comment.created_at)}
        </span>
      </div>
      
      <div className="comment-content">
        {node.comment.content}
      </div>
      
      <div className="comment-actions">
        <button onClick={() => setReplyTo(node.comment.id)}>
          Reply
        </button>
        <span className="like-count">
          {PostUtils.Display.formatEngagementCount(node.comment.like_count)} likes
        </span>
      </div>

      {replyTo === node.comment.id && (
        <form onSubmit={handleSubmitComment} className="reply-form">
          <textarea
            placeholder={PostUtils.Comment.getReplyPrompt(node.comment)}
            value={currentComposition}
            onChange={(e) => setCommentComposition(postId, e.target.value)}
            rows={2}
          />
          <div className="reply-actions">
            <button type="submit">Reply</button>
            <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        </form>
      )}

      {node.children.map((child: any) => renderCommentNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="post-comments">
      <div className="comments-header">
        <h3>{PostUtils.Display.formatEngagementCount(comments.length)} Comments</h3>
      </div>

      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          placeholder="Write a comment..."
          value={currentComposition}
          onChange={(e) => setCommentComposition(postId, e.target.value)}
          rows={3}
        />
        <button type="submit" disabled={!currentComposition.trim()}>
          Comment
        </button>
      </form>

      <div className="comments-list">
        {commentTree.map(node => renderCommentNode(node))}
      </div>
    </div>
  );
}
```

### Geographic Posts Map

```tsx
import { useEffect, useState } from 'react';
import { usePostStore, useNearbyPosts, useUserLocation, PostUtils } from '@/lib/post';

function PostsMap() {
  const nearbyPosts = useNearbyPosts();
  const userLocation = useUserLocation();
  const { setUserLocation, loadNearbyPosts } = usePostStore();
  const [radius, setRadius] = useState(10); // km

  useEffect(() => {
    // Get user's current location
    PostUtils.Geographic.getCurrentLocation().then(location => {
      if (location) {
        setUserLocation(location);
        loadNearbyPosts(location, radius);
      }
    });
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyPosts(userLocation, radius);
    }
  }, [radius, userLocation]);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  return (
    <div className="posts-map">
      <div className="map-controls">
        <label>
          Radius: 
          <select value={radius} onChange={(e) => handleRadiusChange(Number(e.target.value))}>
            <option value={1}>1 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
        </label>
      </div>

      <div className="nearby-posts">
        <h3>Posts near you ({radius} km radius)</h3>
        {nearbyPosts.map(post => (
          <div key={post.id} className="nearby-post">
            <div className="post-content">
              <h4>{PostUtils.Display.getDisplayTitle(post)}</h4>
              <p>{PostUtils.Display.getContentPreview(post)}</p>
            </div>
            
            <div className="post-location">
              📍 {post.location}
              {userLocation && post.coordinates && (
                <span className="distance">
                  {PostUtils.Geographic.formatDistance(
                    PostUtils.Geographic.calculateDistance(
                      userLocation,
                      post.coordinates
                    )
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Advanced Search Interface

```tsx
import { useState, useEffect } from 'react';
import { usePostStore, PostUtils } from '@/lib/post';
import type { PostFilters, PostSort } from '@/lib/post';

function PostSearch() {
  const { searchPosts, searchResults, searchLoading } = usePostStore();
  const [filters, setFilters] = useState<PostFilters>({});
  const [sort, setSort] = useState<PostSort>({ field: 'created_at', direction: 'desc' });

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchPosts(filters, sort);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [filters, sort]);

  const updateFilter = (key: keyof PostFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="post-search">
      <div className="search-filters">
        <div className="filter-group">
          <label>Search Query:</label>
          <input
            type="text"
            placeholder="Search posts..."
            value={filters.search_query || ''}
            onChange={(e) => updateFilter('search_query', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Post Type:</label>
          <select
            value={filters.post_type || ''}
            onChange={(e) => updateFilter('post_type', e.target.value || undefined)}
          >
            <option value="">All Types</option>
            <option value="TEXT">Text</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="ARTICLE">Article</option>
            <option value="QUESTION">Question</option>
            <option value="POLL">Poll</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <input
            type="text"
            placeholder="Category"
            value={Array.isArray(filters.category) ? filters.category[0] : filters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value || undefined)}
          />
        </div>

        <div className="filter-group">
          <label>Tags:</label>
          <input
            type="text"
            placeholder="Comma-separated tags"
            value={filters.tags?.join(', ') || ''}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
              updateFilter('tags', tags.length > 0 ? tags : undefined);
            }}
          />
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.has_media || false}
              onChange={(e) => updateFilter('has_media', e.target.checked || undefined)}
            />
            Has Media
          </label>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.has_location || false}
              onChange={(e) => updateFilter('has_location', e.target.checked || undefined)}
            />
            Has Location
          </label>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSort({ field: field as any, direction: direction as any });
            }}
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="engagement_score-desc">Most Engaging</option>
            <option value="like_count-desc">Most Liked</option>
            <option value="comment_count-desc">Most Commented</option>
            <option value="view_count-desc">Most Viewed</option>
          </select>
        </div>
      </div>

      <div className="search-results">
        {searchLoading ? (
          <div>Searching...</div>
        ) : searchResults ? (
          <div>
            <div className="results-header">
              <h3>{PostUtils.Display.formatEngagementCount(searchResults.total_count)} Results</h3>
            </div>
            
            {searchResults.posts.map(post => (
              <div key={post.id} className="search-result">
                <h4>{PostUtils.Display.getDisplayTitle(post)}</h4>
                <p>{PostUtils.Display.getContentPreview(post)}</p>
                
                <div className="post-meta">
                  <span>{PostUtils.Display.getPostTypeDisplayName(post.post_type)}</span>
                  <span>{PostUtils.Display.formatRelativeTime(post.created_at)}</span>
                  
                  {post.tags && (
                    <div className="tags">
                      {post.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>Enter search criteria to find posts</div>
        )}
      </div>
    </div>
  );
}
```

## Real-time Features

The post system includes comprehensive real-time functionality:

### Automatic Updates
- New posts appear in feeds automatically
- Engagement counts update in real-time
- Comments appear without page refresh
- User reactions sync across all users

### Subscription Management
```typescript
const { subscribeToFeed, subscribeToPost, unsubscribeAll } = usePostStore();

// Subscribe to feed updates
subscribeToFeed();

// Subscribe to specific post updates
subscribeToPost(postId);

// Clean up subscriptions on unmount
useEffect(() => {
  return () => {
    unsubscribeAll();
  };
}, []);
```

### Optimistic Updates
- Immediate UI feedback for user actions
- Automatic rollback on operation failure
- Smooth user experience even with network delays

## Performance Optimizations

### Caching Strategy
- Post data cached in Zustand store
- Comment threads cached per post
- User reactions cached for quick access
- Geographic data cached by location

### Pagination
- Infinite scroll for feeds and comments
- Configurable page sizes
- Efficient database queries with proper indexing

### Memory Management
- Automatic cleanup of old cache entries
- Efficient subscription management
- Optimized re-renders with selective state selectors

## Security Features

### Row Level Security (RLS)
- Database-level access controls
- Privacy-based visibility rules
- Real-time permission checking

### Content Validation
- Input sanitization and validation
- File upload security checks
- Rate limiting protection

### Geographic Privacy
- Optional location sharing
- Configurable location accuracy
- User-controlled geographic visibility

## Error Handling

The post system provides comprehensive error handling:

```typescript
import { PostService, POST_ERROR_CODES } from '@/lib/post';

const result = await PostService.createPost(postData);

if (!result.success) {
  switch (result.error) {
    case POST_ERROR_CODES.INVALID_CONTENT:
      // Handle content validation error
      break;
    case POST_ERROR_CODES.TOO_MANY_TAGS:
      // Handle tag limit error
      break;
    case POST_ERROR_CODES.NOT_AUTHENTICATED:
      // Redirect to login
      break;
    default:
      // Handle generic error
  }
}
```

## Testing

The post system is designed to be easily testable:

```typescript
// Mock post data for testing
const mockPost = {
  id: 'test-post-id',
  content: 'Test post content',
  post_type: 'TEXT' as const,
  author_id: 'test-user-id',
  // ... other fields
};

// Test post operations
describe('Post Service', () => {
  it('should create post successfully', async () => {
    const result = await PostService.createPost({
      content: 'Test content',
      post_type: 'TEXT'
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.content).toBe('Test content');
  });
});
```

## Migration and Setup

1. **Database Setup**: Run the Supabase migration:
   - `005_create_post_system.sql`

2. **Storage Setup**: Create media buckets in Supabase Storage

3. **Real-time Setup**: Enable real-time on posts and comments tables

4. **Geographic Setup**: Ensure PostGIS extension is enabled

5. **Dependencies**: Install required packages (zustand, @supabase/supabase-js)

## Advanced Features

### Geographic Integration
- Location-based post discovery
- Distance calculations and filtering
- Integration with mapping services
- Privacy-conscious location sharing

### Media Management
- Multi-file upload support
- Progress tracking and error handling
- Automatic thumbnail generation
- File type validation and security

### Engagement Analytics
- Time-decay engagement scoring
- Trend detection algorithms
- User behavior tracking
- Performance metrics

### Content Management
- Rich text support with markdown
- Hashtag and mention extraction
- Link preview generation
- Content moderation tools

This post system provides a complete, production-ready solution for social media-style posting with excellent developer experience, robust functionality, and comprehensive real-time features.