/**
 * Avatar Generator Component
 * 
 * Allows users to create custom avatars by generating new unique strings
 * and previewing different avatar types with real-time generation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RefreshCw, Dice1, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarUtils } from '@/lib/utils/avatar.utils';
import { toast } from 'sonner';
import type { AvatarType, AvatarConfig } from '@/lib/schema/profile.types';

interface AvatarGeneratorProps {
  onGenerate: (avatar: AvatarConfig) => void;
  onCancel?: () => void;
  className?: string;
}

export function AvatarGenerator({
  onGenerate,
  onCancel,
  className
}: AvatarGeneratorProps) {
  console.log('AvatarGenerator component rendered');
  const [selectedType, setSelectedType] = useState<AvatarType>('gravatar_monster');
  const [customString, setCustomString] = useState('');
  const [generatedString, setGeneratedString] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCustomString, setUseCustomString] = useState(false);

  const avatarTypes = AvatarUtils.getAvailableAvatarTypes();

  // Generate initial preview
  useEffect(() => {
    generateNewAvatar();
  }, [selectedType]);

  const generateNewAvatar = () => {
    setIsGenerating(true);
    
    // Simulate generation delay for better UX
    setTimeout(() => {
      const newString = AvatarUtils.generateUniqueString();
      setGeneratedString(newString);
      updatePreview(selectedType, newString);
      setIsGenerating(false);
    }, 300);
  };

  const updatePreview = (type: AvatarType, uniqueString: string) => {
    try {
      const url = AvatarUtils.generateAvatarUrl(type, uniqueString);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating avatar URL:', error);
      toast.error('Failed to generate avatar preview');
    }
  };

  const handleTypeChange = (type: AvatarType) => {
    setSelectedType(type);
    const currentString = useCustomString ? customString : generatedString;
    if (currentString) {
      updatePreview(type, currentString);
    }
  };

  const handleCustomStringChange = (value: string) => {
    setCustomString(value);
    if (value.trim()) {
      updatePreview(selectedType, value.trim());
    }
  };

  const toggleStringMode = () => {
    setUseCustomString(!useCustomString);
    if (!useCustomString && customString.trim()) {
      updatePreview(selectedType, customString.trim());
    } else if (useCustomString && generatedString) {
      updatePreview(selectedType, generatedString);
    }
  };

  const handleGenerate = () => {
    console.log('handleGenerate called');
    const finalString = useCustomString ? customString.trim() : generatedString;
    console.log('finalString:', finalString);
    console.log('selectedType:', selectedType);
    
    if (!finalString) {
      console.log('No final string, showing error');
      toast.error('Please enter a custom string or generate one');
      return;
    }

    const avatarConfig = {
      type: selectedType,
      uniqueString: finalString
    };
    console.log('Calling onGenerate with:', avatarConfig);
    onGenerate(avatarConfig);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const downloadAvatar = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `avatar-${selectedType}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Avatar download started');
    }
  };

  const currentString = useCustomString ? customString.trim() : generatedString;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Dice1 className="size-5" />
            Avatar Generator
          </CardTitle>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={() => {
                console.log('Use This Avatar button clicked');
                console.log('Button disabled state:', !currentString);
                console.log('currentString value:', currentString);
                handleGenerate();
              }}
              disabled={!currentString}
            >
              Use This Avatar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="size-32 rounded-full border-4 border-border overflow-hidden bg-muted">
              {isGenerating ? (
                <div className="w-full h-full flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                  onError={() => toast.error('Failed to load avatar preview')}
                />
              )}
            </div>
            
            {/* Action buttons */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="size-8 p-0"
                onClick={generateNewAvatar}
                disabled={isGenerating}
                title="Generate new"
              >
                <RefreshCw className={cn('size-3', isGenerating && 'animate-spin')} />
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                className="size-8 p-0"
                onClick={() => copyToClipboard(previewUrl)}
                title="Copy URL"
              >
                <Copy className="size-3" />
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                className="size-8 p-0"
                onClick={downloadAvatar}
                title="Download"
              >
                <Download className="size-3" />
              </Button>
            </div>
          </div>

          <Badge variant="outline" className="text-xs">
            {AvatarUtils.getAvatarTypeLabel(selectedType)}
          </Badge>
        </div>

        {/* Avatar Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="avatar-type">Avatar Type</Label>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger id="avatar-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">Gravatar</div>
                <SelectItem value="gravatar_monster">Monsters</SelectItem>
                <SelectItem value="gravatar_robohash">Robots</SelectItem>
                <SelectItem value="gravatar_retro">Retro</SelectItem>
              </div>
              <div className="px-2 py-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">RoboHash</div>
                <SelectItem value="robohash_cat">Cats</SelectItem>
                <SelectItem value="robohash_sexy_robots">BT Robots</SelectItem>
                <SelectItem value="robohash_robo">Robo</SelectItem>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* String Input Mode Toggle */}
        <div className="flex items-center space-x-2">
          <input
            id="use-custom"
            type="checkbox"
            checked={useCustomString}
            onChange={toggleStringMode}
            className="rounded border-gray-300"
          />
          <Label htmlFor="use-custom" className="text-sm">
            Use custom string instead of generated
          </Label>
        </div>

        {/* String Input */}
        <div className="space-y-2">
          <Label htmlFor="avatar-string">
            {useCustomString ? 'Custom String' : 'Generated String'}
          </Label>
          
          {useCustomString ? (
            <div className="flex gap-2">
              <Input
                id="avatar-string"
                value={customString}
                onChange={(e) => handleCustomStringChange(e.target.value)}
                placeholder="Enter your custom string..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(customString)}
                disabled={!customString.trim()}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="avatar-string"
                value={generatedString}
                readOnly
                className="flex-1 bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedString)}
                disabled={!generatedString}
              >
                <Copy className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateNewAvatar}
                disabled={isGenerating}
              >
                <RefreshCw className={cn('size-4', isGenerating && 'animate-spin')} />
              </Button>
            </div>
          )}
        </div>

        {/* Preview URL - Hidden from user but available for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-2">
            <Label htmlFor="preview-url">Preview URL (Debug)</Label>
            <div className="flex gap-2">
              <Input
                id="preview-url"
                value={previewUrl}
                readOnly
                className="flex-1 bg-muted text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(previewUrl)}
                disabled={!previewUrl}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Generation Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateNewAvatar}
            disabled={isGenerating}
            className="w-full"
          >
            <RefreshCw className={cn('size-4 mr-2', isGenerating && 'animate-spin')} />
            Generate New
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const randomType = avatarTypes[Math.floor(Math.random() * avatarTypes.length)];
              setSelectedType(randomType);
              generateNewAvatar();
            }}
            disabled={isGenerating}
            className="w-full"
          >
            <Dice1 className="size-4 mr-2" />
            Random Type
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified version for quick generation
interface QuickAvatarGeneratorProps {
  onGenerate: (avatar: AvatarConfig) => void;
  className?: string;
}

export function QuickAvatarGenerator({ onGenerate, className }: QuickAvatarGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRandomAvatar = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const types = AvatarUtils.getAvailableAvatarTypes();
      const randomType = types[Math.floor(Math.random() * types.length)];
      const uniqueString = AvatarUtils.generateUniqueString();
      
      onGenerate({
        type: randomType,
        uniqueString
      });
      
      setIsGenerating(false);
    }, 500);
  };

  return (
    <Button
      onClick={generateRandomAvatar}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Generating...
        </>
      ) : (
        <>
          <Dice1 className="size-4 mr-2" />
          Generate Random Avatar
        </>
      )}
    </Button>
  );
}