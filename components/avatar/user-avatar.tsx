/**
 * Avatar Component
 * 
 * Displays user avatars with fallback support and loading states
 * Supports both legacy URLs and new avatar configuration system
 */

'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import { ProfileDisplayUtils } from '@/lib/utils/profile.utils';
import type { Profile, PublicProfile, AvatarConfig } from '@/lib/schema/profile.types';

interface UserAvatarProps {
  profile?: Partial<Profile | PublicProfile> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnlineStatus?: boolean;
  fallbackToInitials?: boolean;
  onClick?: () => void;
}

const AVATAR_SIZES = {
  xs: 'size-6',
  sm: 'size-8', 
  md: 'size-10',
  lg: 'size-12',
  xl: 'size-16',
  '2xl': 'size-20'
};

const ONLINE_DOT_SIZES = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2.5', 
  lg: 'size-3',
  xl: 'size-3.5',
  '2xl': 'size-4'
};

export function UserAvatar({
  profile,
  size = 'md',
  className,
  showOnlineStatus = false,
  fallbackToInitials = true,
  onClick
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  if (!profile) {
    return (
      <Avatar className={cn(AVATAR_SIZES[size], className, onClick && 'cursor-pointer')} onClick={onClick}>
        <AvatarFallback className="bg-muted">
          <span className="text-muted-foreground">?</span>
        </AvatarFallback>
      </Avatar>
    );
  }

  const initials = fallbackToInitials ? ProfileDisplayUtils.getInitials(profile) : '';
  let avatarUrl: string;

  try {
    avatarUrl = AvatarUtils.getAvatarUrl(
      profile.avatar_url as string | AvatarConfig | null,
      initials
    );
  } catch (error) {
    console.warn('Error generating avatar URL:', error);
    avatarUrl = fallbackToInitials 
      ? AvatarUtils.generateInitialsAvatar(initials)
      : AvatarUtils.generateDefaultAvatar();
  }

  return (
    <div className="relative inline-block">
      <Avatar 
        className={cn(
          AVATAR_SIZES[size], 
          className,
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
        )} 
        onClick={onClick}
      >
        {!imageError && (
          <AvatarImage 
            src={avatarUrl} 
            alt={ProfileDisplayUtils.getDisplayName(profile)}
            onError={() => setImageError(true)}
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials || '?'}
        </AvatarFallback>
      </Avatar>

      {/* Online status indicator */}
      {showOnlineStatus && profile.is_online && (
        <div 
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-green-500 border-2 border-background',
            ONLINE_DOT_SIZES[size]
          )}
          title="Online"
        />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  profiles: (Partial<Profile | PublicProfile>)[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showCount?: boolean;
}

export function AvatarGroup({ 
  profiles, 
  max = 3, 
  size = 'md', 
  className,
  showCount = true 
}: AvatarGroupProps) {
  const displayProfiles = profiles.slice(0, max);
  const remainingCount = profiles.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayProfiles.map((profile, index) => (
        <UserAvatar
          key={profile.id || index}
          profile={profile}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      
      {showCount && remainingCount > 0 && (
        <Avatar className={cn(AVATAR_SIZES[size], 'ring-2 ring-background')}>
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

interface EditableAvatarProps {
  profile?: Partial<Profile | PublicProfile> | null;
  size?: 'md' | 'lg' | 'xl' | '2xl';
  onEdit?: () => void;
  isEditing?: boolean;
  className?: string;
}

export function EditableAvatar({
  profile,
  size = 'lg',
  onEdit,
  isEditing = false,
  className
}: EditableAvatarProps) {
  return (
    <div className={cn('relative group', className)}>
      <UserAvatar 
        profile={profile}
        size={size}
        onClick={onEdit}
        className="transition-all duration-200"
      />
      
      {/* Edit overlay */}
      {onEdit && (
        <div 
          className={cn(
            'absolute inset-0 bg-black/60 rounded-full flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'cursor-pointer',
            isEditing && 'opacity-100'
          )}
          onClick={onEdit}
        >
          <svg 
            className="size-4 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
}