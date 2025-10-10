# Avatar System Documentation

## Overview

The Avatar System provides a comprehensive solution for user avatars with multiple generation methods:

- **Gravatar Integration**: Monsters, Robots, Retro styles
- **RoboHash Integration**: Cats, Sexy, Robo styles  
- **Custom Generation**: Users can create unique avatars
- **Fallback Support**: Graceful handling of legacy URLs and errors

## Key Features

✅ **Multiple Avatar Types**: 6 different styles across Gravatar and RoboHash  
✅ **Unique Generation**: Each avatar uses a unique string for consistent results  
✅ **JSONB Storage**: Efficient storage of avatar configuration in single column  
✅ **Legacy Support**: Backwards compatible with existing avatar URLs  
✅ **Real-time Preview**: Live preview during selection and generation  
✅ **Responsive UI**: Works on all screen sizes  
✅ **Type Safety**: Full TypeScript support with proper typing  

## Architecture

### Data Storage

Avatar configurations are stored as JSONB in the `avatar_url` column:

```typescript
// New avatar config (stored as JSONB)
{
  "type": "gravatar_monster",
  "uniqueString": "a03cb65456ec3bf6421edd0e77317621"
}

// Legacy URL (stored as string)
"https://example.com/avatar.jpg"
```

### Avatar Types

```typescript
type AvatarType = 
  | 'gravatar_monster'    // Gravatar monsters
  | 'gravatar_robohash'   // Gravatar robots  
  | 'gravatar_retro'      // Gravatar retro
  | 'robohash_cat'        // RoboHash cats
  | 'robohash_sexy'       // RoboHash sexy
  | 'robohash_robo'       // RoboHash robots
```

### URL Generation

**Gravatar URLs:**
```
https://gravatar.com/avatar/{uniqueString}?s=400&d={type}&r=x
```

**RoboHash URLs:**
```
https://robohash.org/{uniqueString}?set={set}&bgset=&size=400x400
```

## Components

### 1. UserAvatar - Display Component

Basic avatar display with fallback support:

```tsx
import { UserAvatar } from '@/components/avatar';

<UserAvatar 
  profile={profile}
  size="lg"
  showOnlineStatus
  onClick={() => console.log('Avatar clicked')}
/>
```

**Props:**
- `profile`: User profile object
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
- `showOnlineStatus`: Show online indicator
- `fallbackToInitials`: Use initials as fallback
- `onClick`: Click handler

### 2. AvatarSelector - Selection Component

Choose from pre-generated avatar options:

```tsx
import { AvatarSelector } from '@/components/avatar';

<AvatarSelector
  selectedAvatar={currentAvatar}
  onSelect={(avatar) => updateProfile(avatar)}
  optionsPerType={20}
/>
```

**Features:**
- 20 options per avatar type (configurable)
- Tabbed interface for different types
- Real-time preview
- Selection state management

### 3. AvatarGenerator - Creation Component

Generate custom avatars with unique strings:

```tsx
import { AvatarGenerator } from '@/components/avatar';

<AvatarGenerator
  onGenerate={(avatar) => setAvatar(avatar)}
  onCancel={() => setShowGenerator(false)}
/>
```

**Features:**
- Custom string input or auto-generation
- Real-time preview
- Type selection
- URL copying and downloading

### 4. AvatarManager - Complete System

Full avatar management interface:

```tsx
import { AvatarManager } from '@/components/avatar';

<AvatarManager
  profile={profile}
  onAvatarUpdate={(avatar) => console.log('Updated:', avatar)}
/>
```

**Features:**
- Combines all avatar functionality
- Profile integration
- Modal interface
- Progress indicators

## Usage Examples

### Basic Profile Display

```tsx
import { UserAvatar } from '@/components/avatar';
import { useCurrentProfile } from '@/lib/profile';

function ProfileCard() {
  const profile = useCurrentProfile();
  
  return (
    <div className="flex items-center gap-3">
      <UserAvatar profile={profile} size="md" showOnlineStatus />
      <div>
        <h3>{profile?.full_name}</h3>
        <p>@{profile?.username}</p>
      </div>
    </div>
  );
}
```

### Avatar Selection Modal

```tsx
import { useState } from 'react';
import { AvatarSelector, AvatarChangeButton } from '@/components/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function ProfileSettings() {
  const [showSelector, setShowSelector] = useState(false);
  
  return (
    <>
      <AvatarChangeButton 
        profile={profile}
        onAvatarChange={(avatar) => {
          updateProfile({ avatar_url: avatar });
          setShowSelector(false);
        }}
      />
      
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent>
          <AvatarSelector
            onSelect={(avatar) => {
              updateProfile({ avatar_url: avatar });
              setShowSelector(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Custom Avatar Generation

```tsx
import { AvatarGenerator, AvatarUtils } from '@/components/avatar';

function CustomAvatarForm() {
  const [generatedAvatar, setGeneratedAvatar] = useState(null);
  
  const handleGenerate = (avatar) => {
    setGeneratedAvatar(avatar);
    const url = AvatarUtils.generateAvatarUrl(avatar.type, avatar.uniqueString);
    console.log('Generated avatar URL:', url);
  };
  
  return (
    <AvatarGenerator
      onGenerate={handleGenerate}
      onCancel={() => setGeneratedAvatar(null)}
    />
  );
}
```

## Utilities

### AvatarUtils Class

Central utility class for avatar operations:

```typescript
import { AvatarUtils } from '@/lib/utils/avatar.utils';

// Generate unique string
const uniqueString = AvatarUtils.generateUniqueString();

// Generate avatar URL
const url = AvatarUtils.generateAvatarUrl('gravatar_monster', uniqueString);

// Get avatar config from profile
const config = AvatarUtils.getAvatarConfig(profile.avatar_url);

// Generate options for selection
const options = AvatarUtils.generateAvatarOptions('robohash_cat', 10);

// Create avatar configuration
const avatarConfig = AvatarUtils.createAvatarConfig('gravatar_retro');
```

## Integration with Profile System

### Profile Service Updates

The profile service now supports avatar configurations:

```typescript
import { ProfileService } from '@/lib/service/profile.service';

// Update avatar with new configuration
await ProfileService.updateAvatarConfig({
  type: 'gravatar_monster',
  uniqueString: 'abc123...'
});

// The avatar_url field accepts both formats:
await ProfileService.updateProfile({
  avatar_url: 'https://legacy-url.com/avatar.jpg'  // Legacy
});

await ProfileService.updateProfile({
  avatar_url: {  // New format
    type: 'gravatar_monster',
    uniqueString: 'abc123...'
  }
});
```

### Database Migration

Run the migration to update your database:

```sql
-- supabase/migrations/005_update_avatar_system.sql
-- Converts avatar_url column to JSONB for flexible storage
```

## Best Practices

### 1. Performance
- Avatar URLs are generated on-demand, not stored
- Use appropriate image sizes (400x400 default)
- Implement caching for frequently displayed avatars

### 2. Fallbacks
- Always provide fallback initials or default avatar
- Handle network errors gracefully
- Support both legacy URLs and new configs

### 3. User Experience
- Show loading states during generation
- Provide preview before confirmation
- Allow users to regenerate if unsatisfied

### 4. Type Safety
```typescript
// Always validate avatar configs
if (AvatarUtils.isValidAvatarConfig(config)) {
  const url = AvatarUtils.generateAvatarUrl(config.type, config.uniqueString);
}
```

## Troubleshooting

### Common Issues

**Avatar not loading:**
- Check network connectivity to Gravatar/RoboHash
- Verify unique string format
- Ensure avatar type is valid

**Type errors:**
- Update profile types to support `AvatarConfig`
- Use proper type guards for validation

**Legacy URLs:**
- System automatically handles legacy string URLs
- No migration required for existing users

### Debug Information

```typescript
// Debug avatar configuration
const config = AvatarUtils.getAvatarConfig(profile.avatar_url);
console.log('Avatar config:', config);

if (config) {
  const url = AvatarUtils.generateAvatarUrl(config.type, config.uniqueString);
  console.log('Generated URL:', url);
}
```

## API Reference

See individual component files for detailed prop interfaces and method signatures:

- `/components/avatar/user-avatar.tsx`
- `/components/avatar/avatar-selector.tsx` 
- `/components/avatar/avatar-generator.tsx`
- `/components/avatar/avatar-manager.tsx`
- `/lib/utils/avatar.utils.ts`