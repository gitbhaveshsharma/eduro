/**
 * Avatar Manager Component
 * 
 * Complete avatar management interface using Tailwind CSS modal
 * - Desktop (lg+): Vertical sidebar tabs on the left
 * - Mobile: Horizontal tabs at the top
 * - Custom scrollbar and blurred backdrop
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImageIcon, Shuffle, Wand2, X } from 'lucide-react';
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
  onAvatarUpdate?: (avatar: AvatarConfig) => void | Promise<void>;
  className?: string;
  size?: 'md' | 'lg' | 'xl' | '2xl';
  showOnlineStatus?: boolean;
}

export function AvatarManager({ profile, onAvatarUpdate, className, size, showOnlineStatus }: AvatarManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  const [isUpdating, setIsUpdating] = useState(false);

  const { updateCurrentProfile } = useProfileStore();

  const currentAvatar = profile?.avatar_url ?
    AvatarUtils.getAvatarConfig(profile.avatar_url) : null;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleAvatarSelect = async (avatar: AvatarConfig) => {
    console.log('=== AVATAR MANAGER: handleAvatarSelect called ===');
    setIsUpdating(true);

    try {
      const success = await updateCurrentProfile({
        avatar_url: avatar
      });

      if (success) {
        toast.success('Avatar updated successfully!');
        onAvatarUpdate?.(avatar);
        setIsOpen(false);
      } else {
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

  const tabs = [
    { id: 'select', label: 'Choose Avatar', icon: ImageIcon },
    { id: 'generate', label: 'Generate Custom', icon: Wand2 },
    { id: 'quick', label: 'Quick Random', icon: Shuffle },
  ];

  return (
    <>
      <div className={className}>
        <EditableAvatar
          profile={profile}
          size={size ?? 'xl'}
          showOnlineStatus={showOnlineStatus}
          onEdit={() => setIsOpen(true)}
        />
      </div>

      {/* Tailwind CSS Modal */}
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative w-full max-w-5xl max-h-[90vh] bg-background rounded-lg shadow-2xl pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-5" />
                  <h2 className="text-lg font-semibold">Manage Your Avatar</h2>
                  {currentAvatar && (
                    <Badge variant="secondary" className="ml-2">
                      {AvatarUtils.getAvatarTypeLabel(currentAvatar.type)}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Loading overlay */}
              {isUpdating && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-center space-y-2">
                    <LoadingSpinner />
                    <p className="text-sm text-muted-foreground">Updating avatar...</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col lg:flex-row h-[calc(90vh-5rem)]">
                {/* Mobile: Horizontal tabs at top */}
                <div className="lg:hidden border-b">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                            activeTab === tab.id
                              ? 'border-primary text-primary bg-primary/5'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop: Vertical sidebar on left */}
                <div className="hidden lg:flex flex-col w-56 border-r bg-muted/30">
                  <div className="p-3 space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                            activeTab === tab.id
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content area with modern scrollbar */}
                <div className="flex-1 overflow-y-auto scrollbar-modern">
                  {activeTab === 'select' && (
                    <div className="p-4 sm:p-6">
                      <AvatarSelector
                        selectedAvatar={currentAvatar}
                        onSelect={handleAvatarSelect}
                        onCancel={() => setIsOpen(false)}
                      />
                    </div>
                  )}

                  {activeTab === 'generate' && (
                    <div className="p-4 sm:p-6">
                      <AvatarGenerator
                        onGenerate={handleAvatarSelect}
                        onCancel={() => setIsOpen(false)}
                      />
                    </div>
                  )}

                  {activeTab === 'quick' && (
                    <div className="p-4 sm:p-6">
                      <div className="text-center space-y-6 max-w-2xl mx-auto">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Quick Avatar Generation</h3>
                          <p className="text-sm text-muted-foreground">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Global styles for custom scrollbar */}
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }

            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground) / 0.3);
              border-radius: 4px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground) / 0.5);
            }

            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
            }

            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }

            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </>
      )}
    </>
  );
}

// Standalone avatar change button
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
  const [activeTab, setActiveTab] = useState('select');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAvatarSelect = (avatar: AvatarConfig) => {
    onAvatarChange(avatar);
    setIsOpen(false);
  };

  const tabs = [
    { id: 'select', label: 'Choose from Gallery', icon: ImageIcon },
    { id: 'generate', label: 'Generate Custom', icon: Wand2 },
  ];

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <ImageIcon className="size-4 mr-2" />
        Change Avatar
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative w-full max-w-5xl max-h-[90vh] bg-background rounded-lg shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Choose Your Avatar</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row h-[calc(90vh-5rem)]">
                <div className="lg:hidden border-b">
                  <div className="flex">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                            activeTab === tab.id
                              ? 'border-primary text-primary bg-primary/5'
                              : 'border-transparent text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="size-4" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden lg:flex flex-col w-56 border-r bg-muted/30">
                  <div className="p-3 space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                            activeTab === tab.id
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-modern">
                  {activeTab === 'select' && (
                    <div className="p-4 sm:p-6">
                      <AvatarSelector
                        selectedAvatar={AvatarUtils.getAvatarConfig(profile?.avatar_url || null)}
                        onSelect={handleAvatarSelect}
                        onCancel={() => setIsOpen(false)}
                      />
                    </div>
                  )}

                  {activeTab === 'generate' && (
                    <div className="p-4 sm:p-6">
                      <AvatarGenerator
                        onGenerate={handleAvatarSelect}
                        onCancel={() => setIsOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
