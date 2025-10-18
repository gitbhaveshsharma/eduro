# Connections Frontend Implementation

A complete, modular frontend implementation for the user connections system (follow/follower functionality). Uses "connection" terminology instead of "follow" for better user experience.

## 📁 Structure

```
components/connections/
├── connection-button.tsx          # Connect/Disconnect button with states
├── connection-card.tsx            # User card with connection info
├── connection-stats.tsx           # Statistics display
├── connection-list.tsx            # List with search/filter/sort
├── connection-request-card.tsx    # Request card with accept/reject
├── connection-request-list.tsx    # Requests management (received/sent)
├── connection-suggestions.tsx     # AI-powered suggestions
└── index.ts                       # Component exports

app/(community)/connections/
└── page.tsx                       # Main connections page

hooks/
└── use-connections.ts             # Custom hooks for operations
```

## 🎨 Components

### Core Components

#### `ConnectionButton`
A reusable button for making/removing connections.

**Features:**
- Loading states (connecting/disconnecting)
- Disabled states for blocked users
- Pending request indication
- Permission checks
- Icon + text or icon-only variants

**Usage:**
```tsx
import { ConnectionButton } from '@/components/connections';

<ConnectionButton
  targetUser={user}
  currentUser={currentUser}
  variant="default"
  size="sm"
  showIcon={true}
  showText={true}
  onConnectionChange={(isConnected) => console.log(isConnected)}
/>
```

#### `ConnectionCard`
Displays user information with avatar, name, stats, and connection button.

**Features:**
- User avatar with online indicator
- Verified badge
- Role badge
- Connection statistics
- Mutual connection badge
- Responsive layout

**Usage:**
```tsx
import { ConnectionCard } from '@/components/connections';

<ConnectionCard
  user={user}
  currentUser={currentUser}
  showStats={true}
  showMutualBadge={true}
  isMutual={false}
  onConnectionChange={(isConnected) => {}}
/>
```

#### `ConnectionStats`
Displays connection statistics in an attractive card layout.

**Features:**
- Connections count
- Connected with count
- Mutual connections count
- Interactive stats (click to navigate)
- Loading skeleton

**Usage:**
```tsx
import { ConnectionStats } from '@/components/connections';

<ConnectionStats
  stats={stats}
  isLoading={false}
  onStatClick={(stat) => console.log('Clicked:', stat)}
/>
```

#### `ConnectionList`
Displays a list of connections with search, filter, and sort capabilities.

**Features:**
- Real-time search
- Sort by: Recent, Name, Connections
- Filter by: All, Mutual, Non-mutual
- Empty states
- Loading states
- Infinite scroll support (ready)

**Usage:**
```tsx
import { ConnectionList } from '@/components/connections';

<ConnectionList
  type="connections" // or "connected"
  userId={userId}
  currentUser={currentUser}
  showSearch={true}
  showFilters={true}
  showMutualBadge={true}
/>
```

### Request Components

#### `ConnectionRequestCard`
Card component for displaying connection requests with accept/reject actions.

**Features:**
- Requester/target profile info
- Optional message display
- Accept/Reject buttons (for received)
- Cancel button (for sent)
- Loading states
- Time ago display

**Usage:**
```tsx
import { ConnectionRequestCard } from '@/components/connections';

<ConnectionRequestCard
  request={request}
  type="received" // or "sent"
  onRequestHandled={() => console.log('Request handled')}
/>
```

#### `ConnectionRequestList`
Tabbed interface for managing received and sent requests.

**Features:**
- Separate tabs for received/sent
- Badge count for pending requests
- Empty states
- Refresh functionality
- Auto-refresh on actions

**Usage:**
```tsx
import { ConnectionRequestList } from '@/components/connections';

<ConnectionRequestList
  defaultTab="received"
/>
```

### Discovery Components

#### `ConnectionSuggestions`
Displays AI-powered connection suggestions with reasons.

**Features:**
- Suggestion reasons (mutual, same role, popular, etc.)
- Connection count for mutual connections
- Refresh suggestions
- Auto-load on mount
- Empty state with retry

**Usage:**
```tsx
import { ConnectionSuggestions } from '@/components/connections';

<ConnectionSuggestions
  currentUser={currentUser}
  limit={10}
  showRefreshButton={true}
/>
```

## 🎯 Pages

### `ConnectionsPage`
Main connections management page with tabs.

**Features:**
- Connection statistics overview
- Tabbed navigation (Connections, Requests, Suggestions)
- Badge count for pending requests
- Sub-tabs for connections/connected-with
- Responsive design

**Usage:**
```tsx
import { ConnectionsPage } from '@/app/(community)/connections/page';

<ConnectionsPage
  currentUser={currentUser}
  defaultTab="connections"
/>
```

## 🪝 Custom Hooks

### `useConnection(targetUserId)`
Hook for managing connection with a specific user.

**Returns:**
- `isConnected`: boolean
- `isConnecting`: boolean
- `isDisconnecting`: boolean
- `hasPendingRequest`: boolean
- `isLoading`: boolean
- `connect()`: function
- `disconnect()`: function
- `checkStatus()`: function

**Usage:**
```tsx
import { useConnection } from '@/hooks/use-connections';

const {
  isConnected,
  isLoading,
  connect,
  disconnect,
} = useConnection(userId);
```

### `useConnections(userId?)`
Hook for loading connection data.

**Returns:**
- `loadConnectionData(refresh)`: function
- `refreshConnections()`: function

**Usage:**
```tsx
import { useConnections } from '@/hooks/use-connections';

const { refreshConnections } = useConnections();
```

### `useConnectionRequests()`
Hook for managing connection requests.

**Returns:**
- `acceptRequest(requestId)`: function
- `rejectRequest(requestId)`: function
- `cancelRequest(targetUserId)`: function
- `loadRequests(refresh)`: function
- `refreshRequests()`: function

**Usage:**
```tsx
import { useConnectionRequests } from '@/hooks/use-connections';

const {
  acceptRequest,
  rejectRequest,
  refreshRequests,
} = useConnectionRequests();
```

### Other Hooks

- `useConnectionSuggestions(limit)` - Load suggestions
- `useMutualConnection(targetUserId)` - Check mutual status
- `useInitializeConnections()` - Initialize system
- `useConnectionStats(userId?)` - Load statistics
- `useCanConnect(currentUser, targetUser)` - Permission check

## 🔄 Data Flow

1. **Components** → Use custom hooks or store directly
2. **Hooks** → Call store actions
3. **Store** (Zustand) → Call service methods
4. **Service** → Make Supabase API calls
5. **Database** → Execute SQL functions/queries

## 🎨 Styling

All components use:
- **shadcn/ui** components (Card, Button, Badge, Avatar, etc.)
- **Tailwind CSS** for styling
- **Lucide icons** for iconography
- **Responsive design** (mobile-first)
- **Dark mode support** (via shadcn)

## 🚀 Usage Examples

### Basic Connection Button

```tsx
import { ConnectionButton } from '@/components/connections';

export function UserCard({ user, currentUser }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>{user.full_name}</div>
      <ConnectionButton
        targetUser={user}
        currentUser={currentUser}
        size="sm"
      />
    </div>
  );
}
```

### Connection List with Search

```tsx
import { ConnectionList } from '@/components/connections';

export function MyConnectionsPage({ currentUser }) {
  return (
    <div className="container">
      <h1>My Connections</h1>
      <ConnectionList
        type="connections"
        currentUser={currentUser}
        showSearch
        showFilters
      />
    </div>
  );
}
```

### Handle Connection Requests

```tsx
import { ConnectionRequestList } from '@/components/connections';

export function RequestsPage() {
  return (
    <div className="container">
      <h1>Connection Requests</h1>
      <ConnectionRequestList defaultTab="received" />
    </div>
  );
}
```

### Display Suggestions

```tsx
import { ConnectionSuggestions } from '@/components/connections';

export function DiscoverPage({ currentUser }) {
  return (
    <div className="container">
      <h1>People You May Know</h1>
      <ConnectionSuggestions
        currentUser={currentUser}
        limit={15}
      />
    </div>
  );
}
```

## 🔧 Integration with Existing Code

### No Changes Required

The implementation uses the existing:
- ✅ Database schema (`008_create_follow_system.sql`)
- ✅ Service layer (`lib/service/follow.service.ts`)
- ✅ Store (`lib/store/follow.store.ts`)
- ✅ Types (`lib/schema/follow.types.ts`)
- ✅ Utils (`lib/utils/follow.utils.ts`)

### Auto-Accept Feature

The database has `auto_follow_on_request_accept()` trigger which:
1. User A sends connection request to User B
2. User B accepts the request
3. **Both users are automatically connected** (mutual connection)
4. No separate "follow back" needed

## 🎯 Key Features

### Terminology
- ✅ Uses "Connection" instead of "Follow"
- ✅ Uses "Connect/Connected" instead of "Follow/Following"
- ✅ User-friendly language throughout

### Performance
- ✅ Optimistic updates for instant feedback
- ✅ Smart caching (5-minute TTL for status checks)
- ✅ Pagination support
- ✅ Lazy loading ready

### UX
- ✅ Loading states for all operations
- ✅ Empty states with helpful messages
- ✅ Error handling with user feedback
- ✅ Responsive design
- ✅ Keyboard accessible

### Modularity
- ✅ Small, focused components
- ✅ Reusable across the app
- ✅ Easy to customize
- ✅ TypeScript for type safety

## 📚 API Reference

All components accept standard props:
- `className` - Additional CSS classes
- `currentUser` - Current logged-in user profile
- `targetUser` / `user` - User to display/interact with

See component files for complete prop interfaces.

## 🔐 Security

- ✅ Permission checks before actions
- ✅ RLS policies enforced at database level
- ✅ Input validation
- ✅ Rate limiting protection
- ✅ Blocked user handling

## 🎨 Customization

Components are built with customization in mind:

```tsx
// Custom variant
<ConnectionButton
  variant="outline"
  size="lg"
  showIcon={false}
  className="custom-class"
/>

// Hide elements
<ConnectionCard
  showStats={false}
  showConnectionButton={false}
/>

// Custom callbacks
<ConnectionButton
  onConnectionChange={(connected) => {
    // Custom logic
  }}
/>
```

## 🐛 Troubleshooting

### Connections not loading
```tsx
// Manually refresh
const { refreshConnections } = useConnections();
refreshConnections();
```

### Stale data
```tsx
// Clear cache
import { FollowAPI } from '@/lib/follow';
FollowAPI.clearAllCache();
```

### Request not working
Check:
1. User authentication
2. Target user exists
3. Not already connected
4. Not blocked

## 📝 Notes

- All components are **client-side** (`'use client'`)
- Uses **shadcn/ui** component library
- Follows **Next.js 14+** app router conventions
- **Zero breaking changes** to existing code
- **Production-ready** with error handling

## 🚀 Getting Started

1. Components are ready to use
2. Import from `@/components/connections`
3. Pass required props
4. Customize as needed

```tsx
import { ConnectionButton, ConnectionCard } from '@/components/connections';

// That's it! 🎉
```
