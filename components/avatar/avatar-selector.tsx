/**
 * Avatar Selector Component
 * 
 * Responsive avatar selection with modern minimal scrollbar
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
  const [isGenerating, setIsGenerating] = useState(true);
  const [selectedOption, setSelectedOption] = useState<AvatarOption | null>(null);
  const [activeTab, setActiveTab] = useState<AvatarType>('gravatar_monster');
  const [bgOption, setBgOption] = useState<'none' | 'bg1' | 'bg2'>('none');

  const avatarOptions = useMemo(() => {
    setIsGenerating(true);
    const options = AvatarUtils.generateAllAvatarOptions(optionsPerType);
    setIsGenerating(false);
    return options;
  }, [optionsPerType]);

  useEffect(() => {
    if (selectedAvatar && avatarOptions[selectedAvatar.type]) {
      const matchingOption = avatarOptions[selectedAvatar.type].find(
        option => option.uniqueString === selectedAvatar.uniqueString
      );

      if (matchingOption) {
        setSelectedOption(matchingOption);
        setActiveTab(selectedAvatar.type);
        // if incoming selectedAvatar includes a bgset (from generator), sync it
        if (selectedAvatar.type.startsWith('robohash') && (selectedAvatar as any).bgset) {
          const incomingBg = (selectedAvatar as any).bgset as 'bg1' | 'bg2' | undefined;
          setBgOption(incomingBg ?? 'none');
        }
      }
    }
  }, [selectedAvatar, avatarOptions]);

  useEffect(() => {
    if (!activeTab.startsWith('robohash')) setBgOption('none');
  }, [activeTab]);

  const handleOptionSelect = (option: AvatarOption) => {
    setSelectedOption(option);
  };

  const handleConfirmSelection = () => {
    if (selectedOption) {
      const avatarConfig = {
        type: selectedOption.type,
        uniqueString: selectedOption.uniqueString,
        ...(selectedOption.type.startsWith('robohash') ? { bgset: bgOption === 'none' ? undefined : bgOption } : {})
      } as any;
      onSelect(avatarConfig);
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
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium">Generating Avatar Options...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-semibold">Choose Your Avatar</h3>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleConfirmSelection}
            disabled={!selectedOption}
          >
            Use This Avatar
          </Button>
        </div>
      </div>

      {/* Horizontal scrollable tabs */}
      <div className="relative">
        <div className="overflow-x-auto modern-scrollbar-x -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max pb-2">
            {avatarTypes.map(({ type, label, category }) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={cn(
                  'flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap',
                  'min-w-[100px] sm:min-w-[110px]',
                  activeTab === type
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-sm font-medium">{label}</span>
                <Badge
                  variant={category === 'gravatar' ? 'secondary' : 'outline'}
                  className={cn(
                    'text-[10px] px-1.5 py-0',
                    activeTab === type && 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                  )}
                >
                  {category}
                </Badge>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* Background selector */}
      {activeTab.startsWith('robohash') && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg flex-wrap">
          <span className="text-sm font-medium shrink-0">Background:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={bgOption === 'none' ? 'default' : 'outline'}
              onClick={() => setBgOption('none')}
              className="h-8"
            >
              None
            </Button>
            <Button
              size="sm"
              variant={bgOption === 'bg1' ? 'default' : 'outline'}
              onClick={() => setBgOption('bg1')}
              className="h-8"
            >
              BG1
            </Button>
            <Button
              size="sm"
              variant={bgOption === 'bg2' ? 'default' : 'outline'}
              onClick={() => setBgOption('bg2')}
              className="h-8"
            >
              BG2
            </Button>
          </div>
        </div>
      )}

      {/* Avatar grid with modern scrollbar */}
      <div className="max-h-[500px] overflow-y-auto modern-scrollbar rounded-lg border p-4 bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {avatarOptions[activeTab]?.map((option) => (
            <AvatarOptionCard
              key={option.id}
              option={option}
              isSelected={selectedOption?.id === option.id}
              onClick={() => handleOptionSelect(option)}
              bgset={activeTab.startsWith('robohash') ? (bgOption === 'none' ? undefined : bgOption) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Selection preview */}
      {selectedOption && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="size-12 rounded-full overflow-hidden border-2 border-primary shrink-0">
            <img
              src={AvatarUtils.generateAvatarUrl(
                selectedOption.type,
                selectedOption.uniqueString,
                selectedOption.type.startsWith('robohash') ? (bgOption === 'none' ? undefined : bgOption) : undefined
              )}
              alt="Selected"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{selectedOption.label}</p>
            <p className="text-xs text-muted-foreground">{AvatarUtils.getAvatarTypeLabel(selectedOption.type)}</p>
          </div>
        </div>
      )}

      {/* Modern scrollbar styles */}
      <style jsx global>{`
        /* Modern minimal scrollbar - Vertical */
        .modern-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 4px 0;
        }

        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.4);
        }

        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent;
        }

        /* Modern minimal scrollbar - Horizontal */
        .modern-scrollbar-x::-webkit-scrollbar {
          height: 4px;
        }

        .modern-scrollbar-x::-webkit-scrollbar-track {
          background: transparent;
        }

        .modern-scrollbar-x::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 2px;
          transition: background 0.2s ease;
        }

        .modern-scrollbar-x::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.4);
        }

        .modern-scrollbar-x {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent;
        }
      `}</style>
    </div>
  );
}

interface AvatarOptionCardProps {
  option: AvatarOption;
  isSelected: boolean;
  onClick: () => void;
  bgset?: 'bg1' | 'bg2' | undefined;
}

function AvatarOptionCard({ option, isSelected, onClick, bgset }: AvatarOptionCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [displayUrl, setDisplayUrl] = useState(() => AvatarUtils.generateAvatarUrl(option.type, option.uniqueString));

  // recompute display url when option or bgset changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    const url = AvatarUtils.generateAvatarUrl(option.type, option.uniqueString, option.type.startsWith('robohash') ? bgset : undefined);
    setDisplayUrl(url);
  }, [option, bgset]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg border-2 transition-all duration-200 overflow-hidden group',
        'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md scale-105'
          : 'border-border hover:border-primary/50'
      )}
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {!imageError ? (
        <img
          src={displayUrl}
          alt={option.label}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-xs px-2 text-center">Failed</span>
        </div>
      )}

      <div className={cn(
        'absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity',
        isSelected && 'opacity-100 bg-primary/20'
      )} />

      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full size-7 flex items-center justify-center shadow-lg z-10">
          <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

// Compact selector
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
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{AvatarUtils.getAvatarTypeLabel(type)}</span>
        <Badge variant="outline" className="text-xs">
          {count} options
        </Badge>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
