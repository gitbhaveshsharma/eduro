# Layout System

A comprehensive conditional navigation system that adapts to different platforms and devices.

## Features

- **Platform-aware**: Supports Community and LMS platforms with different navigation patterns
- **Responsive**: Adapts to mobile, tablet, and desktop screen sizes
- **Webview-ready**: Detects and optimizes for mobile app webviews
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

#### ConditionalHeader

Automatically chooses between FeedHeader (Community) and LMSHeader (LMS).

#### LMSHeader

Specialized header for LMS platform with search, notifications, and user menu.

### Navigation

#### BottomNavigation

Mobile-optimized bottom navigation with platform-specific items.

## Configuration

### Platform Types

- `community`: Social learning platform (uses FeedHeader)
- `lms`: Learning Management System (uses LMSHeader)

### Device Types

- `mobile`: < 768px width
- `tablet`: 768px - 1024px width
- `desktop`: > 1024px width

### View Types

- `webview`: Running inside mobile app
- `browser`: Running in regular browser

## Usage Examples

### Basic Community Layout

```tsx
<ConditionalLayout platform="community">
  <FeedPage />
</ConditionalLayout>
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

- `getDeviceType()`: Detect current device type
- `getViewType()`: Detect if running in webview
- `generateConfig()`: Generate layout configuration
- `filterNavigationItems()`: Filter items by platform/device
- `shouldShowBottomNav()`: Check if bottom nav should be shown

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
