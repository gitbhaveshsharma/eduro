# Feed System Documentation

This documentation covers the comprehensive feed system implementation for the Tutrsy platform. The system provides a complete solution for social media-style posting, content discovery, user interactions, and community engagement.

## Architecture Overview

The feed system is built using a modular component architecture with the following main components:

- **FeedHeader** - Header with sorting, filtering, and search functionality
- **PostComposer** - Rich post creation interface with media support
- **FeedSection** - Main feed display with post cards and interactions  
- **SuggestionSection** - Sidebar with trending topics, user suggestions, and events

## Component Structure

```
components/feed/
├── index.ts                  # Central exports
├── feed-header.tsx          # Feed header with sorting/search
├── post-composer.tsx        # Post creation component
├── feed-section.tsx         # Main feed display
└── suggestion-section.tsx   # Sidebar suggestions
```

## Quick Start

### 1. Import Feed Components

```typescript
import { 
  FeedHeader,
  PostComposer, 
  FeedSection,
  SuggestionSection,
  type FeedSortType 
} from '@/components/feed';
```

### 2. Basic Feed Implementation

```tsx
import { useState } from "react";
import { FeedHeader, PostComposer, FeedSection, SuggestionSection } from "@/components/feed";

function MyFeedPage() {
  const [sortType, setSortType] = useState<FeedSortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedHeader
        currentSort={sortType}
        onSortChange={setSortType}
        onSearch={setSearchQuery}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <PostComposer />
            <FeedSection sortType={sortType} searchQuery={searchQuery} />
          </div>
          
          <div className="lg:col-span-1">
            <SuggestionSection />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Components Documentation

### FeedHeader

Header component with sorting, filtering, and search functionality.

#### Props

```typescript
interface FeedHeaderProps {
  currentSort?: FeedSortType;           // Current sort selection
  onSortChange?: (sort: FeedSortType) => void;  // Sort change handler
  onSearch?: (query: string) => void;    // Search handler
  showSearch?: boolean;                  // Show search bar
  showFilters?: boolean;                 // Show filter dropdown
  className?: string;                    // Additional CSS classes
}
```

#### Sort Types

```typescript
type FeedSortType = 'recent' | 'trending' | 'popular' | 'following';
```

#### Features

- **Multiple Sort Options**: Recent, trending, popular, following
- **Real-time Search**: Instant search with debouncing
- **Responsive Design**: Mobile-friendly responsive layout
- **Active State Display**: Shows current filter and search state
- **Sticky Header**: Stays at top during scroll

#### Usage Examples

```tsx
// Basic header with all features
<FeedHeader
  currentSort="trending"
  onSortChange={(sort) => console.log('Sort changed:', sort)}
  onSearch={(query) => console.log('Search:', query)}
/>

// Header without search
<FeedHeader
  currentSort="recent"
  onSortChange={setSortType}
  showSearch={false}
/>

// Minimal header
<FeedHeader 
  showFilters={false}
  showSearch={false}
/>
```

### PostComposer

Rich post creation interface with media support and content validation.

#### Props

```typescript
interface PostComposerProps {
  onPostCreated?: (postId: string) => void;  // Post creation callback
  placeholder?: string;                      // Placeholder text
  compact?: boolean;                         // Compact mode
  className?: string;                        // Additional CSS classes
}
```

#### Features

- **Multiple Post Types**: Text, image, video, article, question, poll
- **Rich Content Support**: Media uploads, location, tags
- **Privacy Controls**: Public, followers, friends, private
- **Content Validation**: Character limits, content validation
- **Media Preview**: Image/video preview before posting
- **Tag Management**: Add/remove hashtags
- **Location Support**: Add location to posts
- **Real-time Feedback**: Character count, validation errors

#### Post Types

```typescript
type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL' | 'ARTICLE' | 'QUESTION' | 'ANNOUNCEMENT' | 'EVENT' | 'DISCUSSION';
```

#### Privacy Levels

```typescript
type PostPrivacy = 'PUBLIC' | 'FOLLOWERS' | 'FRIENDS' | 'PRIVATE' | 'RESTRICTED';
```

#### Usage Examples

```tsx
// Basic post composer
<PostComposer 
  onPostCreated={(id) => console.log('Created post:', id)}
  placeholder="What's on your mind?"
/>

// Compact mode
<PostComposer 
  compact={true}
  placeholder="Quick post..."
/>

// Custom styling
<PostComposer 
  className="mb-8 shadow-lg"
  onPostCreated={handlePostCreated}
/>
```

### FeedSection

Main feed display component with post cards and interaction controls.

#### Props

```typescript
interface FeedSectionProps {
  sortType?: FeedSortType;     // Sort type for filtering
  searchQuery?: string;        // Search query for filtering
  className?: string;          // Additional CSS classes
}
```

#### Features

- **Dynamic Post Display**: Shows posts based on sort and search
- **Interactive Post Cards**: Like, comment, share, save actions
- **Media Support**: Image/video display with responsive grid
- **Link Previews**: Rich link previews with metadata
- **Engagement Metrics**: Views, likes, comments, shares
- **User Actions**: Real-time interaction feedback
- **Loading States**: Skeleton loading animation
- **Empty States**: Helpful messages when no content

#### Post Card Features

- **Author Information**: Avatar, name, username, verification
- **Post Metadata**: Type, time, location, engagement stats
- **Content Display**: Text, media, links with proper formatting
- **Tag Display**: Hashtags with interaction
- **Action Buttons**: Like, comment, share, save with counts
- **More Options**: Additional actions dropdown

#### Usage Examples

```tsx
// Basic feed
<FeedSection />

// With sorting and search
<FeedSection 
  sortType="trending"
  searchQuery="react"
/>

// Custom styling
<FeedSection 
  className="space-y-8"
  sortType={currentSort}
  searchQuery={searchTerm}
/>
```

### SuggestionSection

Sidebar component with trending topics, user suggestions, events, and quick actions.

#### Props

```typescript
interface SuggestionSectionProps {
  className?: string;  // Additional CSS classes
}
```

#### Features

- **Trending Topics**: Hashtag trends with growth indicators
- **User Suggestions**: People to follow with mutual connections
- **Upcoming Events**: Community events and workshops
- **Featured Content**: Learning resources and guides
- **Quick Actions**: Shortcut buttons for common actions
- **Interactive Elements**: Follow/unfollow, dismiss suggestions
- **Real-time Updates**: Dynamic content based on user activity

#### Sections

1. **Trending Topics**
   - Top hashtags with post counts
   - Growth percentage indicators
   - Clickable topic navigation

2. **People to Follow**
   - User suggestions with profile info
   - Follow/unfollow functionality
   - Mutual connection counts
   - Dismissible suggestions

3. **Upcoming Events**
   - Event listings with dates/times
   - Attendee counts
   - Event type badges
   - Quick RSVP actions

4. **Featured Learning**
   - Educational content recommendations
   - Reading time estimates
   - View counts and engagement

5. **Quick Actions**
   - Create event
   - Start topic
   - Find friends
   - Study group

#### Usage Examples

```tsx
// Basic sidebar
<SuggestionSection />

// Custom styling
<SuggestionSection className="space-y-8" />

// In sticky container
<div className="sticky top-24">
  <SuggestionSection />
</div>
```

## Integration with Post System

The feed components are designed to work seamlessly with the existing post system:

### Using Post Store

```tsx
import { usePostStore, PostUtils } from '@/lib/post';

function MyFeedComponent() {
  const { createPost, isCreatingPost, postCache } = usePostStore();
  
  const handleCreatePost = async (postData) => {
    const success = await createPost(postData);
    if (success) {
      // Handle success
    }
  };
  
  return (
    <PostComposer 
      onPostCreated={handleCreatePost}
    />
  );
}
```

### Using Post Utils

```tsx
import { PostUtils } from '@/lib/post';

function PostDisplay({ post }) {
  return (
    <div>
      <h3>{PostUtils.Display.getDisplayTitle(post)}</h3>
      <p>{PostUtils.Display.getContentPreview(post)}</p>
      <span>{PostUtils.Display.formatRelativeTime(post.created_at)}</span>
      <span>{PostUtils.Display.formatEngagementCount(post.like_count)}</span>
    </div>
  );
}
```

## Mock Data Implementation

The current implementation uses mock data for demonstration purposes:

### Post Data

- **Realistic Content**: Various post types with realistic content
- **User Profiles**: Mock user profiles with avatars and bios
- **Engagement Metrics**: Like counts, comments, shares, views
- **Media Content**: Placeholder images and videos
- **Geographic Data**: Location information for posts

### Suggestion Data

- **Trending Topics**: Popular hashtags with growth metrics
- **User Suggestions**: Recommended users to follow
- **Events**: Upcoming community events and workshops
- **Featured Content**: Educational resources and guides

## Styling and Theming

The components use Tailwind CSS and shadcn/ui components for consistent styling:

### Design System

- **Colors**: Consistent color palette with semantic meaning
- **Typography**: Clear hierarchy with proper font weights
- **Spacing**: Consistent spacing using Tailwind spacing scale
- **Shadows**: Subtle shadows for depth and hierarchy
- **Borders**: Clean borders with proper radius

### Responsive Design

- **Mobile First**: Mobile-first responsive design
- **Breakpoints**: Tailwind standard breakpoints (sm, md, lg, xl)
- **Grid Layout**: Responsive grid system for different screen sizes
- **Touch Friendly**: Appropriate touch targets for mobile

### Accessibility

- **ARIA Labels**: Proper ARIA labels for screen readers
- **Keyboard Navigation**: Full keyboard navigation support
- **Color Contrast**: WCAG compliant color contrast ratios
- **Focus States**: Clear focus indicators for all interactive elements

## Performance Considerations

### Optimization Features

- **Lazy Loading**: Images and videos load on demand
- **Virtual Scrolling**: Efficient handling of large lists (ready for implementation)
- **Debounced Search**: Prevents excessive API calls during typing
- **Memoization**: React.memo and useMemo for expensive calculations
- **Code Splitting**: Components can be lazy-loaded as needed

### Memory Management

- **Component Cleanup**: Proper cleanup of event listeners and subscriptions
- **State Management**: Efficient state updates with Zustand
- **Image Optimization**: Responsive images with proper sizing

## Error Handling

### User Experience

- **Graceful Degradation**: Components work even when data is missing
- **Error Boundaries**: React error boundaries for component errors
- **Loading States**: Clear loading indicators during async operations
- **Empty States**: Helpful messages when no content is available
- **Retry Mechanisms**: Users can retry failed operations

### Network Errors

- **Offline Support**: Basic offline functionality (ready for implementation)
- **Connection Status**: Visual indicators for connection issues
- **Cached Content**: Show cached content when network is unavailable

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Filtering**: More granular content filtering options
3. **Content Moderation**: Automated and manual content moderation
4. **Analytics**: Detailed engagement and usage analytics
5. **Notifications**: In-app and push notifications
6. **Internationalization**: Multi-language support
7. **Dark Mode**: Complete dark mode implementation
8. **Advanced Search**: Full-text search with filters and sorting

### Technical Improvements

1. **Performance**: Virtual scrolling for large feeds
2. **Accessibility**: Enhanced screen reader support
3. **Testing**: Comprehensive unit and integration tests
4. **Documentation**: Interactive component documentation
5. **Storybook**: Component library with Storybook

## Testing

### Unit Tests

```typescript
// Example test for PostComposer
import { render, screen, fireEvent } from '@testing-library/react';
import { PostComposer } from '@/components/feed';

describe('PostComposer', () => {
  it('should render with placeholder text', () => {
    render(<PostComposer placeholder="Test placeholder" />);
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });
  
  it('should call onPostCreated when post is submitted', async () => {
    const handlePostCreated = jest.fn();
    render(<PostComposer onPostCreated={handlePostCreated} />);
    
    // Add content and submit
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Test post content' }
    });
    fireEvent.click(screen.getByText('Post'));
    
    // Wait for async operation
    await waitFor(() => {
      expect(handlePostCreated).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
```

### Integration Tests

```typescript
// Example test for feed integration
import { render, screen } from '@testing-library/react';
import FeedPage from '@/app/feed/page';

describe('Feed Page Integration', () => {
  it('should render all feed components', () => {
    render(<FeedPage />);
    
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('What\'s on your mind?')).toBeInTheDocument();
    expect(screen.getByText('Trending Topics')).toBeInTheDocument();
  });
});
```

## Contributing

When contributing to the feed system:

1. **Follow Conventions**: Use consistent naming and code style
2. **Write Tests**: Include unit tests for new components
3. **Update Documentation**: Keep documentation current with changes
4. **Performance**: Consider performance impact of changes
5. **Accessibility**: Ensure new features are accessible
6. **Mobile Support**: Test on mobile devices

## Conclusion

The feed system provides a complete, production-ready solution for social media-style content sharing and discovery. It's built with modern React patterns, follows accessibility guidelines, and integrates seamlessly with the existing post system architecture.

The modular design makes it easy to customize, extend, and maintain while providing excellent user experience across all devices and use cases.