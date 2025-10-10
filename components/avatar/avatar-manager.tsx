/**
 * Avatar Manager Component
 * 
 * Complete avatar management interface that combines selection, generation,
 * and profile integration. Handles avatar updates and provides a unified UX.
 */

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImageIcon, Shuffle, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { UserAvatar, EditableAvatar } from './user-avatar';
import { AvatarSelector } from './avatar-selector';
import { AvatarGenerator, QuickAvatarGenerator } from './avatar-generator';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import { useProfileStore } from '@/lib/store/profile.store';
import type { Profile, AvatarConfig } from '@/lib/schema/profile.types';

interface AvatarManagerProps {
  profile?: Profile | null;
  onAvatarUpdate?: (avatar: AvatarConfig) => void;
  className?: string;
}

export function AvatarManager({ profile, onAvatarUpdate, className }: AvatarManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { updateCurrentProfile } = useProfileStore();
  
  const currentAvatar = profile?.avatar_url ? 
    AvatarUtils.getAvatarConfig(profile.avatar_url) : null;

  const handleAvatarSelect = async (avatar: AvatarConfig) => {
    console.log('=== AVATAR MANAGER: handleAvatarSelect called ===');
    console.log('Avatar selection started:', avatar);
    setIsUpdating(true);
    
    try {
      // Update profile with new avatar configuration
      console.log('Updating profile with avatar config:', avatar);
      const success = await updateCurrentProfile({
        avatar_url: avatar // Store as JSONB object
      });

      console.log('Profile update result:', success);
      if (success) {
        toast.success('Avatar updated successfully!');
        onAvatarUpdate?.(avatar);
        setIsOpen(false);
      } else {
        console.error('Profile update failed - success was false');
        toast.error('Failed to update avatar');
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      toast.error('An error occurred while updating avatar');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickGenerate = (avatar: AvatarConfig) => {
    handleAvatarSelect(avatar);
  };

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div>
            <EditableAvatar
              profile={profile}
              size="xl"
              onEdit={() => setIsOpen(true)}
            />
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              Manage Your Avatar
              {currentAvatar && (
                <Badge variant="secondary" className="ml-2">
                  {AvatarUtils.getAvatarTypeLabel(currentAvatar.type)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {isUpdating && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="text-center space-y-2">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground">Updating avatar...</p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select" className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Choose Avatar
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="size-4" />
                Generate Custom
              </TabsTrigger>
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Shuffle className="size-4" />
                Quick Random
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="mt-6">
              <AvatarSelector
                selectedAvatar={currentAvatar}
                onSelect={handleAvatarSelect}
                onCancel={() => setIsOpen(false)}
              />
            </TabsContent>

            <TabsContent value="generate" className="mt-6">
              <AvatarGenerator
                onGenerate={handleAvatarSelect}
                onCancel={() => setIsOpen(false)}
              />
            </TabsContent>

            <TabsContent value="quick" className="mt-6">
              <div className="text-center space-y-6 p-8">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Quick Avatar Generation</h3>
                  <p className="text-muted-foreground">
                    Generate a random avatar instantly from our collection of styles
                  </p>
                </div>

                <div className="flex justify-center">
                  <UserAvatar 
                    profile={profile}
                    size="2xl"
                    className="ring-4 ring-primary/20"
                  />
                </div>

                <div className="space-y-4">
                  <QuickAvatarGenerator 
                    onGenerate={handleQuickGenerate}
                    className="w-full max-w-sm mx-auto"
                  />
                  
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {AvatarUtils.getAvailableAvatarTypes().slice(0, 3).map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const avatar = AvatarUtils.createAvatarConfig(type);
                          handleAvatarSelect(avatar);
                        }}
                        disabled={isUpdating}
                        className="text-xs"
                      >
                        {AvatarUtils.getAvatarTypeLabel(type).split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Each generation creates a unique avatar just for you
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Standalone avatar change button for use in forms
interface AvatarChangeButtonProps {
  profile?: Profile | null;
  onAvatarChange: (avatar: AvatarConfig) => void;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function AvatarChangeButton({
  profile,
  onAvatarChange,
  size = 'default',
  variant = 'outline',
  className
}: AvatarChangeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAvatarSelect = (avatar: AvatarConfig) => {
    onAvatarChange(avatar);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <ImageIcon className="size-4 mr-2" />
          Change Avatar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Choose from Gallery</TabsTrigger>
            <TabsTrigger value="generate">Generate Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-6">
            <AvatarSelector
              selectedAvatar={AvatarUtils.getAvatarConfig(profile?.avatar_url || null)}
              onSelect={handleAvatarSelect}
              onCancel={() => setIsOpen(false)}
            />
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <AvatarGenerator
              onGenerate={handleAvatarSelect}
              onCancel={() => setIsOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}