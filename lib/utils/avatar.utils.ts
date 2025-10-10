/**
 * Avatar System Utilities
 * 
 * Comprehensive avatar system with support for Gravatar and RoboHash
 * Generates unique avatar options and manages avatar configurations
 */

import crypto from 'crypto';
import type { AvatarType, AvatarConfig, AvatarOption } from '../schema/profile.types';

export class AvatarUtils {
  private static readonly AVATAR_SIZE = 400;
  
  // Avatar type configurations
  private static readonly AVATAR_CONFIGS = {
    gravatar_monster: {
      label: 'Gravatar Monsters',
      baseUrl: 'https://gravatar.com/avatar/',
      params: { s: '400', d: 'monsterid', r: 'x' }
    },
    gravatar_robohash: {
      label: 'Gravatar Robots',
      baseUrl: 'https://gravatar.com/avatar/',
      params: { s: '400', d: 'robohash', r: 'x' }
    },
    gravatar_retro: {
      label: 'Gravatar Retro',
      baseUrl: 'https://gravatar.com/avatar/',
      params: { s: '400', d: 'retro', r: 'x' }
    },
    robohash_cat: {
      label: 'RoboHash Cats',
      baseUrl: 'https://robohash.org/',
      params: { set: 'set4', bgset: '', size: '400x400' }
    },
    robohash_sexy_robots: {
      label: 'RoboHash Sexy',
      baseUrl: 'https://robohash.org/',
      params: { set: 'set2', bgset: '', size: '400x400' }
    },
    robohash_robo: {
      label: 'RoboHash Robots',
      baseUrl: 'https://robohash.org/',
      params: { set: 'set1', bgset: '', size: '400x400' }
    }
  };

  /**
   * Generate a unique string for avatar generation
   */
  static generateUniqueString(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return crypto.createHash('md5').update(`${timestamp}-${random}`).digest('hex');
  }

  /**
   * Generate multiple unique strings
   */
  static generateUniqueStrings(count: number): string[] {
    return Array.from({ length: count }, () => this.generateUniqueString());
  }

  /**
   * Generate avatar URL from configuration
   */
  static generateAvatarUrl(type: AvatarType, uniqueString: string): string {
    const config = this.AVATAR_CONFIGS[type];
    if (!config) {
      throw new Error(`Invalid avatar type: ${type}`);
    }

    const { baseUrl, params } = config;
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    
    return `${baseUrl}${uniqueString}?${queryString}`;
  }

  /**
   * Get avatar configuration from profile avatar_url
   */
  static getAvatarConfig(avatarUrl: string | AvatarConfig | null): AvatarConfig | null {
    if (!avatarUrl) return null;
    
    // If it's already an AvatarConfig object
    if (typeof avatarUrl === 'object' && avatarUrl !== null && 'type' in avatarUrl && 'uniqueString' in avatarUrl) {
      return this.isValidAvatarConfig(avatarUrl) ? avatarUrl : null;
    }
    
    // If it's a legacy URL string, return null (will use fallback)
    if (typeof avatarUrl === 'string') {
      return null;
    }
    
    return null;
  }

  /**
   * Get avatar URL from profile
   */
  static getAvatarUrl(avatarUrl: string | AvatarConfig | null, fallbackInitials?: string): string {
    const config = this.getAvatarConfig(avatarUrl);
    
    if (config) {
      return this.generateAvatarUrl(config.type, config.uniqueString);
    }
    
    // Legacy URL support - check if it's a string that looks like a URL
    if (typeof avatarUrl === 'string' && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
      return avatarUrl;
    }
    
    // Fallback to initials avatar
    if (fallbackInitials) {
      return this.generateInitialsAvatar(fallbackInitials);
    }
    
    return this.generateDefaultAvatar();
  }

  /**
   * Generate initials-based avatar
   */
  static generateInitialsAvatar(initials: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${this.AVATAR_SIZE}&background=random&format=png`;
  }

  /**
   * Generate default avatar
   */
  static generateDefaultAvatar(): string {
    return `https://ui-avatars.com/api/?name=User&size=${this.AVATAR_SIZE}&background=e0e7ff&color=3b82f6&format=png`;
  }

  /**
   * Generate avatar options for a specific type
   */
  static generateAvatarOptions(type: AvatarType, count: number = 20): AvatarOption[] {
    const config = this.AVATAR_CONFIGS[type];
    if (!config) return [];

    const uniqueStrings = this.generateUniqueStrings(count);
    
    return uniqueStrings.map((uniqueString, index) => ({
      id: `${type}-${index + 1}`,
      type,
      uniqueString,
      url: this.generateAvatarUrl(type, uniqueString),
      label: `${config.label} ${index + 1}`
    }));
  }

  /**
   * Generate all avatar options for selection
   */
  static generateAllAvatarOptions(countPerType: number = 20): Record<AvatarType, AvatarOption[]> {
    const allTypes: AvatarType[] = [
      'gravatar_monster',
      'gravatar_robohash', 
      'gravatar_retro',
      'robohash_cat',
      'robohash_sexy_robots',
      'robohash_robo'
    ];

    return allTypes.reduce((acc, type) => {
      acc[type] = this.generateAvatarOptions(type, countPerType);
      return acc;
    }, {} as Record<AvatarType, AvatarOption[]>);
  }

  /**
   * Get avatar type display name
   */
  static getAvatarTypeLabel(type: AvatarType): string {
    return this.AVATAR_CONFIGS[type]?.label || type;
  }

  /**
   * Get all available avatar types
   */
  static getAvailableAvatarTypes(): AvatarType[] {
    return Object.keys(this.AVATAR_CONFIGS) as AvatarType[];
  }

  /**
   * Create avatar configuration object
   */
  static createAvatarConfig(type: AvatarType, uniqueString?: string): AvatarConfig {
    return {
      type,
      uniqueString: uniqueString || this.generateUniqueString()
    };
  }

  /**
   * Validate avatar configuration
   */
  static isValidAvatarConfig(config: any): config is AvatarConfig {
    return (
      typeof config === 'object' &&
      config !== null &&
      typeof config.type === 'string' &&
      typeof config.uniqueString === 'string' &&
      this.getAvailableAvatarTypes().includes(config.type as AvatarType)
    );
  }
}