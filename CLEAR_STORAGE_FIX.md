# Clear Storage Fix

## Issue
The `commentComposition.get is not a function` error occurs because Zustand's persist middleware was saving Maps as plain objects. When the app reloaded, these objects couldn't be used as Maps.

## What Was Fixed
Updated `comment.store.ts` to properly serialize/deserialize Maps:

1. **Partialize**: Convert Maps to arrays before saving to localStorage
   ```typescript
   partialize: (state) => ({
     commentComposition: Array.from(state.commentComposition.entries()),
     replyComposition: Array.from(state.replyComposition.entries()),
   })
   ```

2. **Merge**: Convert arrays back to Maps when loading from localStorage
   ```typescript
   merge: (persistedState: any, currentState: CommentStore) => {
     return {
       ...currentState,
       commentComposition: new Map(persistedState?.commentComposition || []),
       replyComposition: new Map(persistedState?.replyComposition || []),
     } as CommentStore;
   }
   ```

## How to Clear Old Storage (Required Once)

The old corrupted data in localStorage needs to be cleared. **Do this once:**

### Method 1: Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `localStorage.removeItem('comment-store')`
4. Refresh the page

### Method 2: Application/Storage Panel
1. Open browser DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Find "Local Storage" in the left sidebar
4. Click your domain (e.g., `http://localhost:3000`)
5. Find `comment-store` and delete it
6. Refresh the page

### Method 3: Clear All Site Data
1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Clear site data" button
4. Refresh the page

## Verification
After clearing storage and refreshing:
- No more `get is not a function` errors
- Comments load correctly
- Composition state persists correctly
- Real-time updates work

## Why This Happened
- Zustand persist middleware uses `JSON.stringify()` to save state
- `JSON.stringify()` converts Maps to plain objects: `{}`
- When rehydrating, Zustand tries to use these objects as Maps
- Calling `.get()` on a plain object throws an error

## Prevention
This fix ensures Maps are always serialized as arrays `[key, value][]` which can be properly restored as Maps using `new Map(array)`.
