# Settings Components

> Comprehensive settings search and navigation system with role-based access control

## Quick Start

### Using the Search Component

```tsx
import { SettingsSearch } from "@/components/settings";

// In your component
<SettingsSearch
  userRole={profile?.role}
  placeholder="Search settings..."
  onResultClick={(result) => console.log(result)}
/>;
```

### Using the Overview Component

```tsx
import { SettingsOverview } from "@/components/settings";

// In your page
<SettingsOverview userRole={profile?.role} />;
```

## Features

✨ **Real-time Search** - Instant results as you type  
🎯 **Smart Relevance** - Intelligent result ranking  
🔐 **Role-Based Access** - Settings filtered by user role  
📱 **Responsive Design** - Works on all devices  
🎨 **Clean UI** - Consistent with design system  
⚡ **Performance Optimized** - Debounced search, memoized results

## Available Exports

```typescript
// Components
import { SettingsSearch, SettingsOverview } from "@/components/settings";

// Data & Configuration
import {
  SETTINGS_CATEGORIES,
  SETTINGS_ITEMS,
  getSettingsItemsByRole,
  getSettingsByCategory,
  getAvailableCategories,
} from "@/components/settings";

// Search Service
import {
  searchSettings,
  getSearchSuggestions,
  getPopularSettings,
} from "@/components/settings";

// Types
import type {
  SettingsCategory,
  SettingsItem,
  SettingsSearchResult,
  UserRole,
} from "@/components/settings";
```

## Adding New Settings

1. **Add to SETTINGS_ITEMS** in `settings-data.ts`:

```typescript
{
  id: 'my-setting',
  name: 'My Setting',
  description: 'Description of my setting',
  category: 'profile',
  icon: IconComponent,
  href: '/settings/my-setting',
  keywords: ['optional', 'search', 'terms'],
  priority: 'high',
  roles: ['C', 'A'], // Optional: restrict by role
}
```

2. **Create the settings page** at the specified href

3. That's it! The search automatically includes your new setting.

## User Roles

- `S` - Student (basic settings)
- `T` - Teacher (student + teacher settings)
- `C` - Coach (teacher + coaching management)
- `A` - Admin (coach + admin features)
- `SA` - Super Admin (all settings)

## Categories

1. **profile** - Personal information and profile
2. **account** - Account settings and preferences
3. **coaching** - Coaching center management
4. **schedule** - Class schedules and calendar
5. **notifications** - Notification preferences
6. **privacy** - Privacy settings and data control
7. **security** - Security and authentication
8. **preferences** - User preferences and customization

## Architecture

```
components/settings/
├── types.ts              # TypeScript interfaces
├── settings-data.ts      # Settings configuration
├── search-service.ts     # Search logic
├── settings-search.tsx   # Search UI component
├── settings-overview.tsx # Overview page component
└── index.ts              # Public exports
```

## Integration

The search is automatically integrated in the Universal Header:

- Detects settings pages via `config.page === 'settings'`
- Shows settings search on settings pages
- Falls back to default search on other pages

## Documentation

📚 Full documentation: `/docs/SETTINGS_SEARCH_IMPLEMENTATION.md`

## Examples

### Basic Usage

```tsx
"use client";
import { SettingsSearch } from "@/components/settings";
import { useCurrentProfile } from "@/lib/profile";

export function MySettingsPage() {
  const profile = useCurrentProfile();

  return (
    <div>
      <SettingsSearch userRole={profile?.role} />
    </div>
  );
}
```

### Custom Result Handler

```tsx
<SettingsSearch
  userRole={profile?.role}
  onResultClick={(result) => {
    // Track analytics
    console.log("User clicked:", result.name);
    // Navigate or perform custom action
    router.push(result.href);
  }}
/>
```

### Programmatic Search

```typescript
import { searchSettings } from "@/components/settings";

// Get search results
const results = searchSettings("profile", userRole);

// With filters
const results = searchSettings("notification", userRole, {
  categories: ["notifications", "privacy"],
  minPriority: "medium",
});
```

## Performance

- ⚡ Search time: < 10ms for 50 items
- 🎯 Debounce: 300ms
- 💾 Memoized results
- 🚀 Optimized rendering

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Accessibility

- ♿ Keyboard navigation
- 📢 Screen reader support
- 🎨 High contrast support
- 👆 Touch-friendly targets

## License

Part of the Eduro platform - Internal use only
