# Reaction System Duplicate Key Error Fix

## Issue Summary
Users were encountering a 409 Conflict error when toggling reactions on posts:
```
POST https://ixhlpassuqmqpzpumkuw.supabase.co/rest/v1/post_reactions 409 (Conflict)
Failed to update reaction: duplicate key value violates unique constraint "post_reactions_user_id_target_type_target_id_key"
```

## Root Cause Analysis

### Database Schema
The `post_reactions` table has a unique constraint:
```sql
UNIQUE(user_id, target_type, target_id)
```

This ensures a user can only have ONE reaction per target (post or comment), but they can change which reaction they've given.

### The Problem
The previous `PostService.toggleReaction` implementation had a critical flaw:

**Old Logic:**
1. Check if user has the **exact same reaction** (checking `reaction_id` too)
2. If not found, try to INSERT
3. **PROBLEM:** User might already have a DIFFERENT reaction on that target
4. INSERT fails because of unique constraint violation

**Example Failure Scenario:**
```
1. User has 👍 (reaction_id: 1) on Post A
2. User clicks ❤️ (reaction_id: 2) 
3. Code checks: "Does user have ❤️ on Post A?" → No
4. Code tries: INSERT (user, POST, Post A, 2)
5. Database rejects: User already has a reaction on Post A!
```

### Database Function Solution
The database already had a proper `toggle_reaction` function that handles this correctly:

```sql
CREATE OR REPLACE FUNCTION toggle_reaction(
    target_type_param reaction_target_type,
    target_id_param UUID,
    reaction_id_param INTEGER
)
RETURNS BOOLEAN
```

**Correct Logic:**
1. Check if user has **ANY** reaction on target (ignoring reaction_id)
2. If found AND same reaction → DELETE (toggle off)
3. If found AND different reaction → UPDATE to new reaction
4. If not found → INSERT new reaction

This is handled atomically in a single transaction, preventing race conditions.

## Changes Made

### 1. Updated PostService.toggleReaction
**File:** `lib/service/post.service.ts`

Changed from manual INSERT/DELETE logic to using the database RPC function:

```typescript
// Use the database's toggle_reaction RPC function which handles all logic atomically
const { data, error } = await supabase.rpc('toggle_reaction', {
  target_type_param: targetType,
  target_id_param: targetId,
  reaction_id_param: reactionId
});
```

**Benefits:**
- ✅ Atomic operation (no race conditions)
- ✅ Properly handles reaction switching
- ✅ Correctly implements toggle behavior
- ✅ Prevents duplicate key errors

### 2. Updated Feed Container to Refresh Analytics
**File:** `components/feed/feed-container.tsx`

Added analytics refresh after reaction toggle:

```typescript
// Reload reaction analytics to update the UI
const { useReactionStore } = await import('@/lib/reaction');
const loadReactionAnalytics = useReactionStore.getState().loadReactionAnalytics;
await loadReactionAnalytics('POST', postId, true); // force refresh
```

**Benefits:**
- ✅ UI updates immediately after reaction changes
- ✅ Reaction counts are accurate
- ✅ User sees their reaction reflected instantly

### 3. Updated Comment Documentation
**File:** `components/reactions/post-reactions.tsx`

Clarified the behavior in comments:

```typescript
const handleReactionSelect = (reaction: PublicReaction) => {
    // When user selects a reaction from the bar or picker
    // This will either add the reaction or switch to it if they had a different one
    onReactionChange?.(reaction, 'add');
};

const handleReactionClick = (reaction: PublicReaction) => {
    // When user clicks on an existing reaction chip
    // This will toggle it (remove if it's theirs, or switch to it)
    onReactionChange?.(reaction, 'remove');
};
```

## Reaction Flow

### Component Hierarchy
```
PostCard
  └─ PostReactions
      └─ ReactionDisplay (shows existing reactions with hover-triggered ReactionBar)
          └─ ReactionBar (quick reactions + picker button)
              └─ ReactionPicker (full reaction selection modal)
```

### Interaction Flow
1. **User hovers over reactions** → ReactionBar appears after 200ms
2. **User clicks reaction from bar** → `handleReactionSelect` → `onReactionChange` → `PostService.toggleReaction`
3. **User clicks existing reaction chip** → `handleReactionClick` → `onReactionChange` → `PostService.toggleReaction`
4. **Database processes** → `toggle_reaction` function handles all logic
5. **Response received** → Analytics refresh → UI updates

### Toggle Behavior Matrix

| Current State | User Action | Database Function | Result | Return Value |
|--------------|-------------|-------------------|--------|--------------|
| No reaction | Click ❤️ | INSERT | ❤️ added | TRUE |
| Has ❤️ | Click ❤️ | DELETE | Reaction removed | FALSE |
| Has ❤️ | Click 👍 | UPDATE | ❤️ → 👍 | TRUE |
| Has 👍 | Click ❤️ | UPDATE | 👍 → ❤️ | TRUE |

## Testing Checklist

### Basic Functionality
- [x] User can add a reaction to a post
- [x] User can remove their reaction (click same reaction)
- [x] User can switch reactions (click different reaction)
- [x] Reaction counts update correctly
- [x] UI shows user's current reaction highlighted

### Edge Cases
- [x] Rapid clicking doesn't cause duplicates
- [x] Multiple users reacting to same post works
- [x] Switching between reactions doesn't error
- [x] Network errors are handled gracefully

### Performance
- [x] No duplicate API calls
- [x] Analytics refresh is efficient
- [x] UI updates are smooth and responsive

## Database Triggers

The system also has triggers that automatically update counts:

```sql
CREATE TRIGGER update_engagement_counts_on_reaction
    AFTER INSERT OR DELETE ON post_reactions 
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_counts();
```

This ensures:
- `posts.like_count` is automatically updated
- `posts.engagement_score` is recalculated
- `posts.last_activity_at` is updated

## Error Handling

### Before Fix
```
409 Conflict
duplicate key value violates unique constraint
```

### After Fix
- ✅ No more 409 errors
- ✅ Proper error messages if reaction doesn't exist
- ✅ Authentication errors handled
- ✅ Network errors logged and displayed

## Performance Considerations

1. **Atomic Operations:** Using RPC function ensures single database roundtrip
2. **Analytics Caching:** Reaction store caches analytics to avoid excessive queries
3. **Optimistic Updates:** Could be added in future for even better UX
4. **Debouncing:** Not needed as each click is intentional and atomic

## Future Enhancements

1. **Optimistic Updates:** Update UI immediately, revert on error
2. **Real-time Subscriptions:** Watch for other users' reactions
3. **Reaction Animations:** Celebrate when reactions are added
4. **Reaction History:** Track user's reaction changes over time
5. **Batch Operations:** Allow reacting to multiple posts at once

## Related Files

### Service Layer
- `lib/service/post.service.ts` - Post operations including reactions
- `lib/service/reaction.service.ts` - Reaction-specific operations

### Store Layer
- `lib/store/post.store.ts` - Post state management
- `lib/store/reaction.store.ts` - Reaction state and analytics

### Components
- `components/reactions/post-reactions.tsx` - Main reaction component
- `components/reactions/reaction-display.tsx` - Shows existing reactions
- `components/reactions/reaction-bar.tsx` - Quick reaction selector
- `components/reactions/reaction-picker.tsx` - Full reaction modal
- `components/feed/post-card.tsx` - Post display with reactions
- `components/feed/feed-container.tsx` - Feed management

### Database
- `supabase/migrations/006_create_post_system.sql` - Reaction tables and functions
- `supabase/migrations/013_fix_post_system_relationships.sql` - Additional indexes

## Conclusion

The duplicate key error was caused by a mismatch between the application logic (checking for exact reaction match) and the database constraint (allowing only one reaction per user per target). 

By switching to the database's `toggle_reaction` RPC function, we now have:
- ✅ Atomic operations
- ✅ Proper reaction switching
- ✅ No duplicate key errors
- ✅ Clean, maintainable code
- ✅ Better user experience

The fix is minimal, focused, and leverages the existing database infrastructure correctly.
