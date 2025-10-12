# Post Reaction Service - Quick Start Guide

## 🎯 What Changed?

We created a **dedicated service and store** for managing real-time post and comment reactions to fix WebSocket connection issues.

## 📦 New Files

1. **`lib/service/post-reaction.service.ts`** - Real-time subscription service
2. **`lib/store/post-reaction.store.ts`** - State management store

## 🚀 Usage

### Basic Usage in Components

```typescript
import { usePostReactionStore } from '@/lib/store/post-reaction.store';

function MyComponent({ postId }) {
  const { subscribeToTarget, unsubscribeFromTarget } = usePostReactionStore();
  
  useEffect(() => {
    // Subscribe to real-time updates
    subscribeToTarget('POST', postId);
    
    // Cleanup on unmount
    return () => {
      unsubscribeFromTarget('POST', postId);
    };
  }, [postId]);
  
  // Component renders...
}
```

### Get User's Reaction

```typescript
import { useUserReaction } from '@/lib/store/post-reaction.store';

function ReactionButton({ postId }) {
  const { reaction, loading, error } = useUserReaction('POST', postId);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      {reaction ? (
        <span>{reaction.reaction?.emoji_unicode} You reacted!</span>
      ) : (
        <button>Add Reaction</button>
      )}
    </div>
  );
}
```

### Auto-Subscribe Hook

```typescript
import { useReactionSubscription } from '@/lib/store/post-reaction.store';

function PostPage({ postId }) {
  // Automatically subscribes on mount, unsubscribes on unmount
  useReactionSubscription('POST', postId, true);
  
  // Component renders...
}
```

### Manual Subscription (Advanced)

```typescript
import { PostReactionService } from '@/lib/service/post-reaction.service';

// Subscribe
const unsubscribe = PostReactionService.subscribeToTarget(
  'POST',
  postId,
  (update) => {
    console.log('Reaction changed:', update);
    // Handle update...
  }
);

// Later, cleanup
unsubscribe();
```

## 🔄 Migration from Old Code

### Old Way ❌

```typescript
// DON'T USE - These methods are removed
const { PostService } = require('@/lib/service/post.service');
const unsubscribe = PostService.subscribeToPostReactions(postId, callback);
```

### New Way ✅

```typescript
// USE THIS - New dedicated service
import { PostReactionService } from '@/lib/service/post-reaction.service';
const unsubscribe = PostReactionService.subscribeToTarget('POST', postId, callback);

// OR - Use the store (recommended)
import { usePostReactionStore } from '@/lib/store/post-reaction.store';
const { subscribeToTarget } = usePostReactionStore();
subscribeToTarget('POST', postId);
```

## 🧪 Testing

Open browser console and run:

```javascript
// Check active subscriptions
const store = usePostReactionStore.getState();
console.log('Active subscriptions:', store.getSubscriptionCount());

// Check WebSocket channels
console.log('Channels:', PostReactionService.getChannelStatus());

// Expected output:
// Active subscriptions: 3
// Channels: {
//   "POST:abc-123": { state: "connected", callbackCount: 2 },
//   "COMMENT:xyz-789": { state: "connected", callbackCount: 1 }
// }
```

## 🐛 Debugging

### Check if subscription is active

```typescript
const store = usePostReactionStore.getState();
const cached = store.getCachedReaction('POST', postId);
console.log('Cached data:', cached);
```

### Force reload data

```typescript
const { loadUserReaction } = usePostReactionStore();
loadUserReaction('POST', postId, true); // force=true
```

### Clear cache

```typescript
const { clearCache } = usePostReactionStore();

// Clear specific target
clearCache('POST', postId);

// Clear all POST reactions
clearCache('POST');

// Clear everything
clearCache();
```

### Cleanup all subscriptions

```typescript
const { unsubscribeAll } = usePostReactionStore();
unsubscribeAll();

// OR
PostReactionService.unsubscribeAll();
```

## ⚠️ Common Issues

### Issue: Reactions not updating

**Solution**: Check if subscribed properly

```typescript
// Make sure you're subscribing
useEffect(() => {
  subscribeToTarget('POST', postId);
  return () => unsubscribeFromTarget('POST', postId);
}, [postId]);
```

### Issue: Multiple subscriptions

**Solution**: The service automatically handles this - one channel per target

```typescript
// These will share the same channel:
subscribeToTarget('POST', 'same-id'); // ✅ Reuses channel
subscribeToTarget('POST', 'same-id'); // ✅ Adds callback to existing
```

### Issue: Memory leak

**Solution**: Always cleanup in useEffect

```typescript
useEffect(() => {
  subscribeToTarget('POST', postId);
  
  return () => {
    unsubscribeFromTarget('POST', postId); // ✅ Required!
  };
}, [postId]);
```

## 📊 Performance

- **Single WebSocket per target**: No duplicate connections
- **Automatic cleanup**: Prevents memory leaks
- **Efficient caching**: 5-minute TTL
- **Reconnection**: Automatic on errors

## 🎉 Benefits

✅ Fixed WebSocket connection errors
✅ Single source of truth for reactions
✅ Automatic error recovery
✅ Better code organization
✅ TypeScript support
✅ Debugging utilities

## 📚 Full Documentation

See `POST_REACTION_SERVICE_IMPLEMENTATION.md` for complete details.

## 🆘 Need Help?

1. Check browser console for logs (prefix: `[PostReactionService]` or `[PostReactionStore]`)
2. Use debugging utilities (shown above)
3. Review the full documentation
4. Check Supabase dashboard for real-time connections
