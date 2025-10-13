/**
 * Avatar Components Index
 * 
 * Centralized exports for all avatar-related components
 */

// Main components
export { UserAvatar, AvatarGroup, EditableAvatar } from './user-avatar';
export { AvatarSelector, CompactAvatarSelector } from './avatar-selector';
export { AvatarGenerator, QuickAvatarGenerator } from './avatar-generator';
export { AvatarManager, AvatarChangeButton } from './avatar-manager';

// Re-export avatar utilities for convenience
export { AvatarUtils } from '@/lib/utils/avatar.utils';

// Re-export types
export type { 
  AvatarType, 
  AvatarConfig, 
  AvatarOption 
} from '@/lib/schema/profile.types';