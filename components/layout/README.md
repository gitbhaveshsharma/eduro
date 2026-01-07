# Layout System

A comprehensive conditional navigation system that adapts to different platforms and devices.

## 🎯 Latest Updates

### ✨ New Features (Universal Layout System)

1. **UniversalHeader** - Single header component that works across all pages
2. **Sidebar Component** - Reusable sidebar with open/close state management
3. **Page-based Configuration** - Headers adapt based on page context, not just platform
4. **Dynamic Header Items** - Items rendered based on page, device, and platform
5. **Sidebar Integration** - Header includes sidebar toggle functionality
6. **Backward Compatible** - Existing ConditionalHeader still works
7. **Role-based Navigation** - Student and Teacher specific navigation items
8. **LMS Student Portal** - Dedicated navigation for enrolled students
9. **LMS Teacher Portal** - Dedicated navigation for assigned teachers

## Features

- **Platform-aware**: Supports Community and LMS platforms with different navigation patterns
- **Page-aware**: Headers and navigation adapt to specific pages (feed, network, dashboard, settings, etc.)
- **Role-aware**: Different navigation for students, teachers, coaches, and branch managers
- **Responsive**: Adapts to mobile, tablet, and desktop screen sizes
- **Webview-ready**: Detects and optimizes for mobile app webviews
- **Sidebar Support**: Collapsible sidebar with responsive behavior
- **Flexible**: Highly configurable with override options
- **Quality code**: TypeScript, well-structured, maintainable

## Components

### ConditionalLayout

Main wrapper component that orchestrates the entire navigation system.

```tsx
import { ConditionalLayout } from "@/components/layout";

function App() {
  return (
    <ConditionalLayout platform="community">
      <YourPageContent />
    </ConditionalLayout>
  );
}
```

### Headers

#### UniversalHeader (NEW - Recommended)

Single, flexible header component that works across all pages. Use this for new implementations.

```tsx
import { UniversalHeader } from "@/components/layout";

<UniversalHeader
  config={config}
  title="My App"
  items={customHeaderItems}
  searchConfig={{
    enabled: true,
    placeholder: "Search...",
    value: searchQuery,
    onChange: setSearchQuery,
  }}
  sidebarOpen={sidebarOpen}
  onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
/>;
```

#### ConditionalHeader (Legacy)

Automatically chooses between FeedHeader (Community) and LMSHeader (LMS). Still supported for backward compatibility.

#### LMSHeader

Specialized header for LMS platform with search, notifications, and user menu.

### Sidebar (NEW)

Reusable sidebar component with responsive behavior.

```tsx
import { Sidebar } from "@/components/layout";

<Sidebar
  open={sidebarOpen}
  onOpenChange={setSidebarOpen}
  config={{
    enabled: true,
    position: "left",
    width: "280px",
    collapsible: true,
    overlay: true,
  }}
>
  {/* Sidebar content */}
</Sidebar>;
```

### Navigation

#### BottomNavigation

Mobile-optimized bottom navigation with platform-specific items.

## Configuration

### Platform Types

- `community`: Social learning platform (uses FeedHeader)
- `lms`: Learning Management System (uses LMSHeader)

### Page Types (NEW)

- `default`: Default page configuration
- `feed`: Community feed page
- `network`: Network/connections page
- `dashboard`: LMS dashboard page
- `settings`: Settings page
- `profile`: User profile page
- `connections`: Connections page
- `coaching`: Coaching centers page
- `lms-coach`: Coaching center owner dashboard
- `lms-branch-manager`: Branch manager dashboard
- `lms-student`: Student portal (enrolled students)
- `lms-teacher`: Teacher portal (assigned teachers)

### Device Types

- `mobile`: < 768px width
- `tablet`: 768px - 1024px width
- `desktop`: > 1024px width

### View Types

- `webview`: Running inside mobile app
- `browser`: Running in regular browser

### Header Types

- `community`: Community platform header (legacy)
- `lms`: LMS platform header (legacy)
- `network`: Network page header (legacy)
- `minimal`: Minimal header
- `universal`: NEW - Use this for page-based headers

### Sidebar Configuration

```tsx
sidebar: {
  enabled: boolean;          // Enable/disable sidebar
  defaultOpen?: boolean;     // Default: false
  position?: 'left' | 'right'; // Default: 'left'
  width?: string;            // Default: '280px'
  collapsible?: boolean;     // Default: true
  overlay?: boolean;         // Default: true (mobile/tablet)
}
```

## Usage Examples

### Basic Community Layout

```tsx
<ConditionalLayout platform="community">
  <FeedPage />
</ConditionalLayout>
```

### Using Universal Header (NEW)

```tsx
<ConditionalLayout
  platform="community"
  forceConfig={{
    page: "feed",
    headerType: "universal",
  }}
>
  <FeedPage />
</ConditionalLayout>
```

### With Sidebar (NEW)

```tsx
<ConditionalLayout
  platform="lms"
  forceConfig={{
    page: "dashboard",
    headerType: "universal",
    sidebar: {
      enabled: true,
      defaultOpen: true,
      position: "left",
      width: "280px",
    },
  }}
>
  <DashboardPage />
</ConditionalLayout>
```

### Custom Header Items (NEW)

```tsx
import { UniversalHeader } from "@/components/layout";
import { Settings, Users } from "lucide-react";

const customItems = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    action: {
      type: "navigate",
      href: "/settings",
    },
    showOn: {
      devices: ["desktop", "tablet"],
    },
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    action: {
      type: "callback",
      onClick: () => console.log("Users clicked"),
    },
  },
];

<UniversalHeader config={config} items={customItems} title="My App" />;
```

### LMS with Custom Config

```tsx
<ConditionalLayout
  platform="lms"
  forceConfig={{
    showBottomNav: true, // Force bottom nav even on desktop
    headerType: "minimal",
  }}
>
  <CoursePage />
</ConditionalLayout>
```

### LMS Student Portal (NEW)

```tsx
// app/(lms)/lms/(student)/student/layout.tsx
<ConditionalLayout
  platform="lms"
  forceConfig={{
    page: "lms-student",
    headerType: "universal",
    showBottomNav: true, // Show bottom nav on mobile/tablet
    branding: {
      logoUrl: coachingCenter?.logo_url,
      name: coachingCenter?.name || "Learning Portal",
      subtitle: "Student Portal",
    },
    sidebar: {
      enabled: true,
      defaultOpen: true,
      position: "left",
      width: "280px",
      collapsible: true,
      overlay: true,
    },
  }}
>
  <StudentContent />
</ConditionalLayout>
```

### LMS Teacher Portal (NEW)

```tsx
// app/(lms)/lms/(teacher)/teacher/layout.tsx
<ConditionalLayout
  platform="lms"
  forceConfig={{
    page: "lms-teacher",
    headerType: "universal",
    showBottomNav: true, // Show bottom nav on mobile/tablet
    branding: {
      logoUrl: coachingCenter?.logo_url,
      name: coachingCenter?.name || "Teaching Portal",
      subtitle: "Teacher Portal",
    },
    sidebar: {
      enabled: true,
      defaultOpen: true,
      position: "left",
      width: "280px",
      collapsible: true,
      overlay: true,
    },
  }}
>
  <TeacherContent />
</ConditionalLayout>
```

### Mobile-First Design

The system automatically:

- Shows bottom navigation on mobile devices
- Hides certain header elements on small screens
- Adapts navigation items based on available space
- Optimizes for webview environments

## Navigation Items

### Community Platform

- Feed (Home)
- Network (Connections)
- Messages
- Notifications
- Profile

### LMS Platform

- Dashboard
- Courses
- Assignments
- Calendar
- Grades
- Analytics (role-based)

## Utilities

### LayoutUtils

Helper class with static methods:

#### Existing Methods

- `getDeviceType()`: Detect current device type
- `getViewType()`: Detect if running in webview
- `generateConfig()`: Generate layout configuration
- `filterNavigationItems()`: Filter items by platform/device
- `shouldShowBottomNav()`: Check if bottom nav should be shown
- `shouldShowHeader()`: Check if header should be shown
- `getNavigationItems()`: Get navigation items for platform

#### New Methods

- `getHeaderItemsForPage(page)`: Get header items for specific page
- `filterHeaderItems(items, page, device, platform?)`: Filter header items by context
- `getDefaultSidebarConfig(device, page?)`: Get default sidebar configuration

### Header Items Configuration

Header items are defined in `config.ts` for each page:

- `FEED_HEADER_ITEMS`: Items for feed page
- `NETWORK_HEADER_ITEMS`: Items for network page
- `DASHBOARD_HEADER_ITEMS`: Items for dashboard page
- `SETTINGS_HEADER_ITEMS`: Items for settings page
- `PROFILE_HEADER_ITEMS`: Items for profile page

Each item supports:

```typescript
{
  id: string;
  label: string;
  icon?: React.ComponentType;
  action?: {
    type: 'navigate' | 'callback' | 'toggle' | 'dropdown';
    href?: string;
    onClick?: () => void | boolean | Promise<void | boolean>;
    items?: HeaderItem[]; // For dropdown
  };
  badge?: number;
  active?: boolean;
  showOn?: {
    devices?: DeviceType[];
    pages?: PageType[];
    platforms?: PlatformType[];
  };
}
```

## Integration

1. Import the ConditionalLayout component
2. Wrap your page content with the layout
3. Pass the appropriate platform type
4. The system handles the rest automatically

## Responsive Behavior

- **Mobile**: Header + Bottom Navigation
- **Tablet**: Header + Selective Bottom Navigation
- **Desktop**: Full Header with all actions
- **Webview**: Optimized for mobile app integration

## Customization

Override default behavior using `forceConfig`:

```tsx
<ConditionalLayout
  platform="community"
  forceConfig={{
    showHeader: false,
    showBottomNav: true,
    device: "mobile",
  }}
>
  <Content />
</ConditionalLayout>
```
