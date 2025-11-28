/**
 * Avatar System Utilities
 * 
 * Comprehensive avatar system with support for Gravatar and RoboHash
 * Generates unique avatar options and manages avatar configurations
 * 
 * Note: Uses Web Crypto API for browser compatibility instead of Node.js crypto
 */

import type { AvatarType, AvatarConfig, AvatarOption } from '../schema/profile.types';

/**
 * Browser-compatible hash function using Web Crypto API
 * Falls back to a simple hash for environments without crypto support
 */
async function browserMd5Hash(input: string): Promise<string> {
  try {
    // Use Web Crypto API (available in browsers and modern Node.js)
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // Check if we're in a browser or Node.js environment with crypto.subtle
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for older environments - use simple hash
    return simpleHash(input);
  } catch (error) {
    // Fallback to simple hash if Web Crypto API fails
    return simpleHash(input);
  }
}

/**
 * Synchronous simple hash function for fallback
 * Uses a non-cryptographic but deterministic hash
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex string and pad to ensure consistent length
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  // Generate more characters for variety
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2);
  return `${hexHash}${timestamp}${random}`.substring(0, 32);
}

/**
 * Synchronous unique string generator (doesn't use crypto)
 * Safe to use in both browser and server environments
 */
function generateSyncUniqueString(): string {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  const random3 = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${random1}${random2}${random3}`.substring(0, 32);
}

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
      params: { set: 'set4', bgset: undefined, size: '400x400' }
    },
    robohash_sexy_robots: {
      label: 'RoboHash Sexy',
      baseUrl: 'https://robohash.org/',
      params: { set: 'set3', bgset: undefined, size: '400x400' }
    },
    robohash_robo: {
      label: 'RoboHash Robots',
      baseUrl: 'https://robohash.org/',
      params: { set: 'set1', bgset: undefined, size: '400x400' }
    }
  };

  /**
   * Generate a unique string for avatar generation
   * Uses synchronous generation that works in both browser and server
   */
  static generateUniqueString(): string {
    return generateSyncUniqueString();
  }

  /**
   * Generate a unique string asynchronously using Web Crypto API
   * Use this when you need cryptographically secure randomness
   */
  static async generateUniqueStringAsync(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return await browserMd5Hash(`${timestamp}-${random}`);
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
  static generateAvatarUrl(type: AvatarType, uniqueString: string, bgset?: string): string {
    const config = this.AVATAR_CONFIGS[type];
    if (!config) {
      throw new Error(`Invalid avatar type: ${type}`);
    }

    const { baseUrl, params } = config;
    // Build query string but omit empty/undefined params so bgset can be optional
    const searchParams = new URLSearchParams();
    Object.entries(params as Record<string, string | undefined>).forEach(([k, v]) => {
      // allow overriding bgset via parameter
      if (k === 'bgset') return;
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, v);
      }
    });

    // If caller provided a bgset, set it explicitly
    if (bgset !== undefined && bgset !== null && bgset !== '') {
      searchParams.set('bgset', bgset);
    } else if ((params as any).bgset !== undefined && (params as any).bgset !== null && (params as any).bgset !== '') {
      // otherwise use default from config if present
      searchParams.set('bgset', (params as any).bgset);
    }

    const qs = searchParams.toString();
    return qs ? `${baseUrl}${uniqueString}?${qs}` : `${baseUrl}${uniqueString}`;
  }

  /**
   * Return a client-usage URL (proxied when configured).
   * If NEXT_PUBLIC_AVATAR_PROXY === 'true' and running in the browser,
   * returns an app-relative proxy route that will fetch the remote image.
   */
  static getPublicAvatarUrlFromRemote(remoteUrl: string): string {
    // Decide when to use the in-app proxy for remote avatar images.
    // We proxy client requests when either:
    //  - NEXT_PUBLIC_AVATAR_PROXY is explicitly set to 'true', or
    //  - no explicit setting is provided and we're running in production.
    // This ensures deployed sites that enable COEP/COOP (which block cross-origin
    // image embedding unless the resource has a CORP header) will load avatars
    // via the local `/api/avatar-proxy` which adds the required headers.
    // Keep the behavior client-only to avoid changing server-side image generation.
    const isClient = typeof window !== 'undefined';

    // Read runtime env variables (NEXT_PUBLIC_* are inlined for the client by Next.js)
    const envFlag = process.env.NEXT_PUBLIC_AVATAR_PROXY;
    const isProduction = process.env.NODE_ENV === 'production';

    const useProxy = isClient && (envFlag === 'true' || (envFlag === undefined && isProduction));

    if (!useProxy) return remoteUrl;

    // Proxy endpoint within the app (relative URL works in browser and SSR-rendered HTML)
    return `/api/avatar-proxy?url=${encodeURIComponent(remoteUrl)}`;
  }

  /**
   * Convenience wrapper: build remote URL for type/uniqueString, then
   * return proxied URL when appropriate for client use.
   */
  static getPublicAvatarUrl(type: AvatarType, uniqueString: string, bgset?: string): string {
    const remote = this.generateAvatarUrl(type, uniqueString, bgset);
    return this.getPublicAvatarUrlFromRemote(remote);
  }

  /**
   * Get avatar configuration from profile avatar_url
   * Handles both AvatarConfig objects and JSON strings from database
   */
  static getAvatarConfig(avatarUrl: string | AvatarConfig | null): AvatarConfig | null {
    if (!avatarUrl) return null;

    // If it's already an AvatarConfig object
    if (typeof avatarUrl === 'object' && avatarUrl !== null && 'type' in avatarUrl && 'uniqueString' in avatarUrl) {
      return this.isValidAvatarConfig(avatarUrl) ? avatarUrl : null;
    }

    // If it's a string, try to parse it as JSON (might be serialized AvatarConfig)
    if (typeof avatarUrl === 'string') {
      // Check if it looks like a JSON object (starts with {)
      if (avatarUrl.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(avatarUrl);
          if (this.isValidAvatarConfig(parsed)) {
            return parsed;
          }
        } catch (e) {
          // Not valid JSON, treat as legacy URL
        }
      }
      // It's a legacy URL string, return null (will use fallback or URL directly)
      return null;
    }

    return null;
  }

  /**
   * Get avatar URL from profile
   * (updated: when returning a string URL to clients, prefer proxy if configured)
   */
  static getAvatarUrl(avatarUrl: string | AvatarConfig | null, fallbackInitials?: string): string {
    const config = this.getAvatarConfig(avatarUrl);

    if (config) {
      // generate remote url
      const remote = this.generateAvatarUrl(config.type, config.uniqueString, (config as any).bgset);
      // return proxied/public url if needed
      return this.getPublicAvatarUrlFromRemote(remote);
    }

    // URL support - check if it's a string that looks like a URL (http, https, data:, or relative /)
    if (typeof avatarUrl === 'string' && (
      avatarUrl.startsWith('http') ||
      avatarUrl.startsWith('data:') ||
      avatarUrl.startsWith('/')
    )) {
      // Relative URLs (like /api/avatar-proxy?...) are already proxied, return as-is
      if (avatarUrl.startsWith('/')) {
        return avatarUrl;
      }
      return this.getPublicAvatarUrlFromRemote(avatarUrl);
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
    const remote = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${this.AVATAR_SIZE}&background=random&format=png`;
    return this.getPublicAvatarUrlFromRemote(remote);
  }

  /**
   * Generate default avatar
   */
  static generateDefaultAvatar(): string {
    const remote = `https://ui-avatars.com/api/?name=User&size=${this.AVATAR_SIZE}&background=e0e7ff&color=3b82f6&format=png`;
    return this.getPublicAvatarUrlFromRemote(remote);
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

  /**
   * Helper function to safely get avatar URL string from any avatar_url value
   * This is useful when you need a guaranteed string URL for Image components
   * 
   * @param avatarUrl - Can be AvatarConfig object, JSON string, URL string, or null
   * @param fallbackName - Name to use for initials fallback (optional)
   * @returns A valid URL string
   */
  static getSafeAvatarUrl(avatarUrl: string | AvatarConfig | null | undefined, fallbackName?: string): string {
    try {
      // If null/undefined, return initials avatar
      if (!avatarUrl) {
        return this.generateInitialsAvatar(fallbackName || 'U');
      }

      // If it's already a valid URL string
      if (typeof avatarUrl === 'string') {
        // Check if it's a JSON string that needs parsing
        if (avatarUrl.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(avatarUrl);
            if (this.isValidAvatarConfig(parsed)) {
              return this.getAvatarUrl(parsed, fallbackName);
            }
          } catch {
            // Not valid JSON, treat as URL
          }
        }

        // It's a URL string - handle different types
        if (avatarUrl.startsWith('/')) {
          // Relative URLs (like /api/avatar-proxy) are already proxied, return as-is
          return avatarUrl;
        }
        if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) {
          return this.getPublicAvatarUrlFromRemote(avatarUrl);
        }

        // Fallback for invalid strings
        return this.generateInitialsAvatar(fallbackName || avatarUrl.substring(0, 2) || 'U');
      }

      // If it's an AvatarConfig object
      if (this.isValidAvatarConfig(avatarUrl)) {
        return this.getAvatarUrl(avatarUrl, fallbackName);
      }

      // Ultimate fallback
      return this.generateInitialsAvatar(fallbackName || 'U');
    } catch (error) {
      console.warn('Error in getSafeAvatarUrl:', error);
      return this.generateInitialsAvatar(fallbackName || 'U');
    }
  }
}