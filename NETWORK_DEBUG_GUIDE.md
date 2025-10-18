# Network Filter Debug Guide

## 🔍 How to Debug the Network Filters

### Step 1: Open Browser Console
1. Navigate to `/network` page
2. Press `F12` or right-click → Inspect
3. Go to the "Console" tab

### Step 2: Check Console Logs

You should see logs with colored emojis indicating the data flow:

#### When page loads:
```
🟡 Layout - Current filter state: { searchQuery: '', selectedRole: 'all', ... }
🟢 NetworkHeader - Context filters: { searchQuery: '', selectedRole: 'all', ... }
🟢 NetworkHeader - Selected Role: all
🟢 NetworkHeader - Selected Sort: created_at:desc
```

#### When you click a role (e.g., "Students"):
```
🔵 NetworkHeader - Role selected: S
🔵 NetworkHeader - onRoleChange function: ƒ (value) { ... }
🟡 Layout - Role changed to: S
🟡 Layout - Current filter state: { searchQuery: '', selectedRole: 'S', ... }
🟢 NetworkHeader - Context filters: { searchQuery: '', selectedRole: 'S', ... }
🟢 NetworkHeader - Selected Role: S
```

#### When you type in search:
```
🟡 Layout - Search changed to: john
🟡 Layout - Current filter state: { searchQuery: 'john', selectedRole: 'all', ... }
```

### Step 3: What Each Emoji Means

- 🟡 **Yellow (Layout)** - State changes in the layout component
- 🟢 **Green (NetworkHeader)** - Header receiving and using context
- 🔵 **Blue (NetworkHeader Actions)** - User interactions in header
- 🔴 **Red (NetworkDiscovery)** - API calls and data fetching (if you see errors here)

### Step 4: Verify the Flow

The correct flow should be:

```
User clicks role → 
🔵 NetworkHeader action → 
🟡 Layout state update → 
🟢 NetworkHeader re-renders with new value → 
Dropdown shows updated selection
```

### Common Issues & Solutions

#### Issue 1: Context is null
**Symptom:** `🟢 NetworkHeader - Context filters: null`

**Solution:** The header is being rendered outside the context provider. Check that:
- Layout wraps children with `NetworkFilterContext.Provider`
- ConditionalLayout is inside the provider

#### Issue 2: Callbacks are undefined
**Symptom:** `🔵 NetworkHeader - onRoleChange function: undefined`

**Solution:** 
- Check that the context value includes all callbacks
- Verify the layout is providing the functions

#### Issue 3: State doesn't update
**Symptom:** You click but state stays the same

**Solution:**
- Check if the callback is being called (look for 🔵 logs)
- Check if the layout state is updating (look for 🟡 logs)
- Verify the header is re-rendering (look for 🟢 logs)

#### Issue 4: Dropdown doesn't show selected value
**Symptom:** Dropdown still shows "All Roles" after selecting "Students"

**Solution:**
- Check `currentRoleOption` calculation
- Verify `selectedRole` matches option values exactly
- Role codes: 'all', 'S', 'T', 'C', 'A' (case-sensitive!)

### Step 5: Manual Testing Checklist

Test each control:

- [ ] **Search Box**
  - Type text → Should see 🟡 Layout logs
  - Wait 500ms → Should trigger search
  - Clear button (X) → Should clear search

- [ ] **Role Filter**
  - Click dropdown → Should open
  - Select "Students" → Should see 🔵 → 🟡 → 🟢 logs
  - Dropdown should show "Students" after closing
  - Results should filter to students only

- [ ] **Sort Filter**
  - Click dropdown → Should open
  - Select "Name (A-Z)" → Should see 🔵 → 🟡 → 🟢 logs
  - Dropdown should show "Name (A-Z)" after closing
  - Results should re-sort alphabetically

- [ ] **Combined Filters**
  - Search "john" + Role "Teachers" → Should combine both
  - Change sort while filtered → Should maintain filters

### Step 6: Check Network Tab

1. Go to Network tab in DevTools
2. Filter by "Fetch/XHR"
3. When filters change, you should see API calls with proper query params

### Expected API Call:
```
POST /api/profiles/search
{
  "filters": {
    "search_query": "john",
    "role": "T",
    "is_verified": false,
    "is_online": false
  },
  "sort": {
    "field": "full_name",
    "direction": "asc"
  },
  "page": 1,
  "perPage": 20
}
```

### Step 7: Remove Debug Logs (Production)

Once everything works, remove the console.log statements:

1. Search for `console.log` in:
   - `app/(community)/network/layout.tsx`
   - `components/layout/headers/network-header.tsx`

2. Remove all debug logs with emoji prefixes

### Quick Fix Commands

If you need to reset everything:

```bash
# Clear browser cache
Ctrl + Shift + Delete

# Hard reload page
Ctrl + F5

# Clear localStorage (in console)
localStorage.clear()

# Restart dev server
npm run dev
```

## ✅ Success Indicators

You know it's working when:

1. ✅ Console shows all emoji logs in correct order
2. ✅ Dropdown labels update when you select options
3. ✅ Search input triggers debounced searches
4. ✅ Result count updates in header
5. ✅ Results grid updates with filtered data
6. ✅ Network tab shows API calls with correct params
7. ✅ No React errors in console
8. ✅ No TypeScript errors in IDE

## 🐛 Still Not Working?

Check these files have the correct structure:

1. **Layout** (`app/(community)/network/layout.tsx`)
   - Must be 'use client'
   - Must have useState hooks
   - Must provide NetworkFilterContext
   - Must wrap ConditionalLayout

2. **Page** (`app/(community)/network/page.tsx`)
   - Must use useNetworkFilters hook
   - Must pass filter values to NetworkDiscovery
   - Must pass callbacks (setTotalCount, setIsLoading)

3. **Header** (`components/layout/headers/network-header.tsx`)
   - Must import useNetworkFilters
   - Must call useNetworkFilters()
   - Must use context values over props
   - Must call context callbacks on user actions

4. **Discovery** (`components/network/network-discovery.tsx`)
   - Must accept filter props
   - Must useEffect to fetch on filter changes
   - Must call onTotalCountChange
   - Must call onLoadingChange

## 📞 Get Help

If still stuck, share these in your bug report:

1. Screenshot of console logs
2. Screenshot of Network tab (API calls)
3. Current filter state from React DevTools
4. Any error messages

This will help identify exactly where the flow is breaking!
