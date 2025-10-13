# Reaction Components

A complete, reusable reaction system for posts, comments, and any interactive content. Built with smooth animations, accessibility features, and TypeScript support.

## Components

### `ReactionSystem` (Recommended)
The main component that combines display and trigger functionality.

```tsx
import { ReactionSystem } from '@/components/reactions';

<ReactionSystem
  targetType="POST"
  targetId="post_123"
  onReactionChange={(reaction, action) => {
    console.log(`${action} reaction:`, reaction.name);
  }}
  size="md"
  showAnalytics={true}
/>
```

### `ReactionPicker`
A floating picker with animations and search functionality.

```tsx
import { ReactionPicker } from '@/components/reactions';

<ReactionPicker
  isOpen={isOpen}
  targetType="POST"
  targetId="post_123"
  onReactionSelect={(reaction) => console.log('Selected:', reaction)}
  onClose={() => setIsOpen(false)}
/>
```

### `ReactionDisplay`
Shows existing reactions with counts and user interactions.

```tsx
import { ReactionDisplay } from '@/components/reactions';

<ReactionDisplay
  targetType="POST"
  targetId="post_123"
  onReactionClick={(reaction) => console.log('Toggled:', reaction)}
  size="md"
  maxDisplay={6}
/>
```

### `ReactionTrigger`
A button that opens the reaction picker.

```tsx
import { ReactionTrigger } from '@/components/reactions';

<ReactionTrigger
  targetType="POST"
  targetId="post_123"
  onReactionSelect={(reaction) => console.log('Added:', reaction)}
  icon="smile"
  tooltip="Add a reaction"
/>
```

## Features

### 🎨 Smooth Animations
- Hover effects with scale transforms
- Entrance/exit animations using Framer Motion
- Loading skeletons
- Bounce and pulse effects

### 🔍 Search & Categories
- Real-time reaction search
- Category filtering (positive, negative, neutral)
- Quick reactions and trending reactions
- User favorites and recently used

### ♿ Accessibility
- ARIA labels and descriptions
- Keyboard navigation support
- Tooltips with detailed information
- Screen reader friendly

### 📱 Responsive Design
- Multiple size variants (sm, md, lg)
- Mobile-optimized touch targets
- Flexible layouts (horizontal/vertical)
- Overflow handling

### 🎯 TypeScript Support
- Full type definitions
- IntelliSense support
- Type-safe props and callbacks

## Props

### Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetType` | `'POST' \| 'COMMENT'` | - | Type of content being reacted to |
| `targetId` | `string` | - | Unique identifier for the content |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `className` | `string` | - | Custom CSS classes |

### ReactionSystem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onReactionChange` | `(reaction, action) => void` | - | Called when reactions change |
| `showAnalytics` | `boolean` | `false` | Show detailed analytics |
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout orientation |
| `interactive` | `boolean` | `true` | Whether user can interact |
| `maxDisplay` | `number` | `6` | Max reactions to display |

### ReactionPicker Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Whether picker is open |
| `triggerRef` | `RefObject<HTMLElement>` | - | Reference to trigger element |
| `onReactionSelect` | `(reaction) => void` | - | Called when reaction selected |
| `onClose` | `() => void` | - | Called when picker closes |
| `position` | `'top' \| 'bottom' \| 'auto'` | `'auto'` | Picker position |
| `maxWidth` | `number` | `320` | Maximum width in pixels |

## Integration Example

Here's how to integrate with a post card:

```tsx
import { ReactionSystem } from '@/components/reactions';
import { ReactionService } from '@/lib/reaction';

function PostCard({ post }) {
  const handleReactionChange = async (reaction, action) => {
    try {
      if (action === 'add') {
        await ReactionService.addReaction('POST', post.id, reaction.id);
      } else {
        await ReactionService.removeReaction('POST', post.id, reaction.id);
      }
      // Refresh post data or update local state
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  return (
    <div className="post-card">
      {/* Post content */}
      
      <div className="post-actions">
        <ReactionSystem
          targetType="POST"
          targetId={post.id}
          onReactionChange={handleReactionChange}
          size="md"
          showAnalytics={false}
        />
      </div>
    </div>
  );
}
```

## Styling

Components use Tailwind CSS classes and can be customized:

```tsx
<ReactionSystem
  className="my-custom-reactions"
  // Custom styling will be applied
/>
```

Add custom CSS:

```css
.my-custom-reactions {
  @apply border rounded-lg p-2 bg-gray-50;
}

.my-custom-reactions button {
  @apply hover:bg-blue-100 hover:border-blue-300;
}
```

## State Management

The components automatically integrate with the Zustand reaction store:

```tsx
import { useReactionStore } from '@/lib/reaction';

function CustomComponent() {
  const {
    reactions,
    trendingReactions,
    quickReactions,
    loadAllReactions,
  } = useReactionStore();

  // Access reaction data and actions
}
```

## Performance

- Reactions are cached using Zustand persistence
- Lazy loading of reaction data
- Debounced search queries
- Optimized re-renders with React.memo patterns

## Future Enhancements

- Skin tone support for emoji reactions
- Custom reaction uploads
- Reaction animations (floating hearts, etc.)
- Real-time reaction updates via WebSocket
- Reaction analytics dashboard