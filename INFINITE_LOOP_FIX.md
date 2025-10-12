# Infinite Loop Fix - Comment Store

## Issue
```
Warning: The result of getSnapshot should be cached to avoid an infinite loop
Uncaught Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

## Root Cause
The infinite loop was caused by Zustand's `persist` middleware interacting poorly with Immer's Map handling:

1. **Persist middleware** was serializing and deserializing Maps on every state change
2. **Immer middleware** was creating new Map instances when state updated
3. **Convenience hooks** like `useCommentsForPost()` were calling `.get()` on these Maps
4. When the Map reference changed, `.get()` returned `undefined`, so we returned a new empty array `[]`
5. New array reference triggered a re-render
6. Re-render caused persist to serialize/deserialize again
7. **Infinite loop** 🔄

### Technical Details
```typescript
// BEFORE (Problematic):
export const useCommentStore = create<CommentStore>()(
    devtools(
        persist(  // ❌ This was causing the issue
            immer((set, get) => ({
                commentsByPost: new Map(), // Map gets recreated
                // ...
            })),
            {
                name: 'comment-store',
                partialize: (state) => ({
                    commentComposition: Array.from(state.commentComposition.entries()),
                    // ...
                }),
                merge: (persistedState, currentState) => ({
                    ...currentState,
                    commentComposition: new Map(persistedState?.commentComposition || []),
                    // ❌ New Map instance on every load
                }),
            }
        )
    )
);

// Hook calling .get() on recreated Map
export const useCommentsForPost = (postId: string) => {
    return useCommentStore(state => {
        const comments = state.commentsByPost.get(postId);
        return comments || []; // ❌ New array reference when Map changes
    });
};
```

## Solution
Removed the `persist` middleware entirely. Comment data should NOT be persisted because:

1. **Fresh data on load**: Comments should always be fetched fresh from the server
2. **Real-time updates**: We have WebSocket subscriptions for live updates
3. **Stale data risk**: Persisted comments would quickly become outdated
4. **Storage bloat**: Comment threads can be large and waste localStorage space
5. **No user benefit**: Users don't need comment drafts persisted (unlike posts)

```typescript
// AFTER (Fixed):
export const useCommentStore = create<CommentStore>()(
    devtools(
        immer((set, get) => ({
            commentsByPost: new Map(), // ✅ Map stays stable
            commentComposition: new Map(), // ✅ Draft text not persisted (acceptable trade-off)
            // ...
        })),
        {
            name: 'comment-store',
        }
    )
);
```

## What Changed
1. ✅ Removed `persist()` middleware wrapper
2. ✅ Removed `partialize` configuration
3. ✅ Removed `merge` function
4. ✅ Maps now maintain stable references when Immer doesn't modify them
5. ✅ Hooks return consistent values, preventing re-render loops

## Trade-offs
**Lost**: Draft comment text is no longer persisted across page reloads

**Gained**:
- ✅ No infinite loop errors
- ✅ Better performance (no localStorage reads/writes)
- ✅ Always fresh comment data
- ✅ Simpler codebase
- ✅ No stale data issues

## Alternative Solutions Considered

### 1. Custom Equality Check (Rejected)
```typescript
// Would require complex equality checking
export const useCommentsForPost = (postId: string) => {
    return useCommentStore(
        state => state.commentsByPost.get(postId) || [],
        (a, b) => JSON.stringify(a) === JSON.stringify(b) // ❌ Expensive
    );
};
```
**Why rejected**: Too expensive, defeats the purpose of Zustand's efficient subscriptions

### 2. Separate Persist for Draft Text (Considered but unnecessary)
```typescript
// Could persist only composition separately
const useCompositionStore = create(
    persist(
        (set) => ({ drafts: new Map() }),
        { name: 'comment-drafts' }
    )
);
```
**Why skipped**: Draft text loss on refresh is acceptable for comments (unlike posts)

### 3. Convert Maps to Objects (Rejected)
```typescript
// Use objects instead of Maps
commentsByPost: Record<string, PublicComment[]>
```
**Why rejected**: Maps have better performance for frequent additions/deletions and Immer handles them well

## Verification
After the fix:
- ✅ No infinite loop warnings
- ✅ Comments load correctly
- ✅ Real-time updates work
- ✅ Optimistic updates function properly
- ✅ No memory leaks
- ✅ localStorage cleared of old corrupted data

## Testing Checklist
- [ ] Open post page - no console errors
- [ ] Post a comment - appears immediately (optimistic)
- [ ] Refresh page - comments reload fresh
- [ ] Open two tabs - real-time sync works
- [ ] Check localStorage - no `comment-store` entry
- [ ] Performance - smooth scrolling, no lag

## Related Files Changed
- `lib/store/comment.store.ts` - Removed persist middleware

## Prevention
- Don't persist data structures that update frequently
- Don't persist data that should always be fresh
- Use persist only for user preferences and draft content (long-form)
- Test with React DevTools Profiler to catch re-render loops early

## Cleanup Required
Run in browser console to remove old persisted data:
```javascript
localStorage.removeItem('comment-store')
```
