/**
 * Avatar Selector Component
 * 
 * Allows users to choose from generated avatar options
 * Supports multiple avatar types with preview and selection
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import type { AvatarType, AvatarOption, AvatarConfig } from '@/lib/schema/profile.types';

interface AvatarSelectorProps {
  selectedAvatar?: AvatarConfig | null;
  onSelect: (avatar: AvatarConfig) => void;
  onCancel?: () => void;
  className?: string;
  optionsPerType?: number;
}

export function AvatarSelector({
  selectedAvatar,
  onSelect,
  onCancel,
  className,
  optionsPerType = 20
}: AvatarSelectorProps) {
  console.log('AvatarSelector component rendered');
  const [isGenerating, setIsGenerating] = useState(true);
  const [selectedOption, setSelectedOption] = useState<AvatarOption | null>(null);
  const [activeTab, setActiveTab] = useState<AvatarType>('gravatar_monster');
  const [bgOption, setBgOption] = useState<'none' | 'bg1' | 'bg2'>('none');

  // Generate avatar options
  const avatarOptions = useMemo(() => {
    setIsGenerating(true);
    const options = AvatarUtils.generateAllAvatarOptions(optionsPerType);
    setIsGenerating(false);
    return options;
  }, [optionsPerType]);

  // Set initial selected option based on current avatar
  useEffect(() => {
    if (selectedAvatar && avatarOptions[selectedAvatar.type]) {
      const matchingOption = avatarOptions[selectedAvatar.type].find(
        option => option.uniqueString === selectedAvatar.uniqueString
      );

      if (matchingOption) {
        setSelectedOption(matchingOption);
        setActiveTab(selectedAvatar.type);
      }
    }
  }, [selectedAvatar, avatarOptions]);

  useEffect(() => {
    // reset bg when changing active tab to non-robohash
    if (!activeTab.startsWith('robohash')) setBgOption('none');
  }, [activeTab]);

  const handleOptionSelect = (option: AvatarOption) => {
    setSelectedOption(option);
  };

  const handleConfirmSelection = () => {
    console.log('handleConfirmSelection called');
    console.log('selectedOption:', selectedOption);
    if (selectedOption) {
      const avatarConfig = {
        type: selectedOption.type,
        uniqueString: selectedOption.uniqueString
      };
      console.log('Calling onSelect with:', avatarConfig);
      onSelect(avatarConfig);
    } else {
      console.log('No selected option available');
    }
  };

  const avatarTypes: { type: AvatarType; label: string; category: 'gravatar' | 'robohash' }[] = [
    { type: 'gravatar_monster', label: 'Monsters', category: 'gravatar' },
    { type: 'gravatar_robohash', label: 'Robots', category: 'gravatar' },
    { type: 'gravatar_retro', label: 'Retro', category: 'gravatar' },
    { type: 'robohash_cat', label: 'Cats', category: 'robohash' },
    { type: 'robohash_sexy_robots', label: 'BT Robots', category: 'robohash' },
    { type: 'robohash_robo', label: 'Robo', category: 'robohash' }
  ];

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            Generating Avatar Options...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Choose Your Avatar</CardTitle>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                console.log('Use This Avatar button clicked (selector)');
                console.log('Button disabled state:', !selectedOption);
                console.log('selectedOption value:', selectedOption);
                handleConfirmSelection();
              }}
              disabled={!selectedOption}
            >
              Use This Avatar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AvatarType)}>
          <TabsList className="grid w-full grid-cols-6 px-6">
            {avatarTypes.map(({ type, label, category }) => (
              <TabsTrigger key={type} value={type} className="text-xs">
                <div className="flex flex-col items-center gap-1">
                  <span>{label}</span>
                  <Badge
                    variant={category === 'gravatar' ? 'secondary' : 'outline'}
                    className="text-[10px] px-1 py-0"
                  >
                    {category}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="px-6 pb-6">
            {/* BG selector for robohash types */}
            {activeTab.startsWith('robohash') && (
              <div className="px-6 pb-4 flex items-center gap-2">
                <span className="text-sm font-medium">Background:</span>
                <Button size="sm" variant={bgOption === 'none' ? 'secondary' : 'outline'} onClick={() => setBgOption('none')}>None</Button>
                <Button size="sm" variant={bgOption === 'bg1' ? 'secondary' : 'outline'} onClick={() => setBgOption('bg1')}>BG1</Button>
                <Button size="sm" variant={bgOption === 'bg2' ? 'secondary' : 'outline'} onClick={() => setBgOption('bg2')}>BG2</Button>
              </div>
            )}
            {avatarTypes.map(({ type }) => (
              <TabsContent key={type} value={type} className="mt-4">
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-4 gap-3">
                    {avatarOptions[type]?.map((option) => (
                      <AvatarOptionCard
                        key={option.id}
                        option={option}
                        isSelected={selectedOption?.id === option.id}
                        onClick={() => handleOptionSelect(option)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface AvatarOptionCardProps {
  option: AvatarOption;
  isSelected: boolean;
  onClick: () => void;
}

function AvatarOptionCard({ option, isSelected, onClick }: AvatarOptionCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'relative aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200',
        'hover:scale-105 hover:shadow-md',
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-border hover:border-primary/50'
      )}
      onClick={onClick}
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {!imageError ? (
        <img
          src={option.url}
          alt={option.label}
          className={cn(
            'w-full h-full object-cover rounded-md transition-opacity duration-200',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
          <span className="text-muted-foreground text-xs">Failed to load</span>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center">
          <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// Compact avatar selector for inline use
interface CompactAvatarSelectorProps {
  selectedAvatar?: AvatarConfig | null;
  onSelect: (avatar: AvatarConfig) => void;
  type: AvatarType;
  count?: number;
  className?: string;
}

export function CompactAvatarSelector({
  selectedAvatar,
  onSelect,
  type,
  count = 6,
  className
}: CompactAvatarSelectorProps) {
  const options = useMemo(() => {
    return AvatarUtils.generateAvatarOptions(type, count);
  }, [type, count]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{AvatarUtils.getAvatarTypeLabel(type)}</span>
        <Badge variant="outline" className="text-xs">
          {count} options
        </Badge>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {options.map((option) => (
          <AvatarOptionCard
            key={option.id}
            option={option}
            isSelected={
              selectedAvatar?.type === option.type &&
              selectedAvatar?.uniqueString === option.uniqueString
            }
            onClick={() => onSelect({
              type: option.type,
              uniqueString: option.uniqueString
            })}
          />
        ))}
      </div>
    </div>
  );
}