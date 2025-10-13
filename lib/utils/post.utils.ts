/**
 * Post Utilities
 * 
 * Helper functions and utilities for post-related operations
 * Includes formatters, validators, geographic helpers, and other utility functions
 */

import type {
  Post,
  PublicPost,
  Comment,
  PublicComment,
  PostType,
  PostPrivacy,
  PostStatus,
  PostCoordinates,
  PostFilters,
  PostSort,
  MediaType,
  LinkPreview,
  PollData,
  EventData,
  PostLocation
} from '../schema/post.types';

/**
 * Post Display Utilities
 */
export class PostDisplayUtils {
  /**
   * Get display title for a post
   */
  static getDisplayTitle(post: Partial<Post | PublicPost>): string {
    if (post.title && post.title.trim()) {
      return post.title.trim();
    }
    
    // Generate title from content preview
    if (post.content) {
      const words = post.content.trim().split(/\s+/).slice(0, 8);
      const preview = words.join(' ');
      return preview.length < post.content.length ? `${preview}...` : preview;
    }
    
    return this.getPostTypeDisplayName(post.post_type || 'TEXT');
  }

  /**
   * Get content preview for a post
   */
  static getContentPreview(post: Partial<Post | PublicPost>, maxLength: number = 300): string {
    if (post.content_preview) {
      return post.content_preview.length > maxLength 
        ? `${post.content_preview.slice(0, maxLength)}...`
        : post.content_preview;
    }
    
    if (post.content) {
      const plainText = this.stripMarkdown(post.content);
      return plainText.length > maxLength 
        ? `${plainText.slice(0, maxLength)}...`
        : plainText;
    }
    
    return '';
  }

  /**
   * Strip markdown from text content
   */
  static stripMarkdown(text: string): string {
    return text
      .replace(/[#*`_~\[\]()]/g, '') // Remove basic markdown characters
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  }

  /**
   * Get post type display name
   */
  static getPostTypeDisplayName(postType: PostType): string {
    const typeMap: Record<PostType, string> = {
      'TEXT': 'Text Post',
      'IMAGE': 'Image Post',
      'VIDEO': 'Video Post',
      'POLL': 'Poll',
      'ARTICLE': 'Article',
      'QUESTION': 'Question',
      'ANNOUNCEMENT': 'Announcement',
      'EVENT': 'Event',
      'DISCUSSION': 'Discussion'
    };
    
    return typeMap[postType] || 'Post';
  }

  /**
   * Get post type icon
   */
  static getPostTypeIcon(postType: PostType): string {
    const iconMap: Record<PostType, string> = {
      'TEXT': '📝',
      'IMAGE': '🖼️',
      'VIDEO': '🎥',
      'POLL': '📊',
      'ARTICLE': '📄',
      'QUESTION': '❓',
      'ANNOUNCEMENT': '📢',
      'EVENT': '📅',
      'DISCUSSION': '💬'
    };
    
    return iconMap[postType] || '📝';
  }

  /**
   * Get privacy level display name
   */
  static getPrivacyDisplayName(privacy: PostPrivacy): string {
    const privacyMap: Record<PostPrivacy, string> = {
      'PUBLIC': 'Public',
      'FOLLOWERS': 'Followers Only',
      'FRIENDS': 'Friends Only',
      'PRIVATE': 'Private',
      'RESTRICTED': 'Restricted'
    };
    
    return privacyMap[privacy] || 'Public';
  }

  /**
   * Get privacy level icon
   */
  static getPrivacyIcon(privacy: PostPrivacy): string {
    const iconMap: Record<PostPrivacy, string> = {
      'PUBLIC': '🌍',
      'FOLLOWERS': '👥',
      'FRIENDS': '👬',
      'PRIVATE': '🔒',
      'RESTRICTED': '⚠️'
    };
    
    return iconMap[privacy] || '🌍';
  }

  /**
   * Get status display name and color
   */
  static getStatusDisplay(status: PostStatus): { name: string; color: string; icon: string } {
    const statusMap: Record<PostStatus, { name: string; color: string; icon: string }> = {
      'DRAFT': { name: 'Draft', color: 'gray', icon: '📝' },
      'PUBLISHED': { name: 'Published', color: 'green', icon: '✅' },
      'ARCHIVED': { name: 'Archived', color: 'blue', icon: '📦' },
      'DELETED': { name: 'Deleted', color: 'red', icon: '🗑️' },
      'FLAGGED': { name: 'Flagged', color: 'orange', icon: '🚩' },
      'REMOVED': { name: 'Removed', color: 'red', icon: '❌' }
    };
    
    return statusMap[status] || statusMap['PUBLISHED'];
  }

  /**
   * Format engagement metrics
   */
  static formatEngagementCount(count: number): string {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  }

  /**
   * Get engagement rate description
   */
  static getEngagementDescription(post: Partial<Post | PublicPost>): string {
    const totalEngagement = (post.like_count || 0) + (post.comment_count || 0) + (post.share_count || 0);
    const views = post.view_count || 1; // Avoid division by zero
    const rate = (totalEngagement / views) * 100;
    
    if (rate >= 10) return 'Very High';
    if (rate >= 5) return 'High';
    if (rate >= 2) return 'Good';
    if (rate >= 1) return 'Moderate';
    return 'Low';
  }

  /**
   * Format relative time
   */
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  }

  /**
   * Format absolute time
   */
  static formatAbsoluteTime(dateString: string, includeTime: boolean = false): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Get reading time estimate for text content
   */
  static getReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    if (minutes < 1) return '< 1 min read';
    return `${minutes} min read`;
  }

  /**
   * Check if post has media content
   */
  static hasMedia(post: Partial<Post | PublicPost>): boolean {
    return !!(post.media_urls && post.media_urls.length > 0);
  }

  /**
   * Get media type display info
   */
  static getMediaTypeInfo(mediaType: MediaType): { name: string; icon: string; color: string } {
    const mediaMap: Record<MediaType, { name: string; icon: string; color: string }> = {
      'IMAGE': { name: 'Image', icon: '🖼️', color: 'blue' },
      'VIDEO': { name: 'Video', icon: '🎥', color: 'red' },
      'AUDIO': { name: 'Audio', icon: '🎵', color: 'purple' },
      'DOCUMENT': { name: 'Document', icon: '📄', color: 'gray' },
      'LINK': { name: 'Link', icon: '🔗', color: 'green' }
    };
    
    return mediaMap[mediaType] || mediaMap['LINK'];
  }

  /**
   * Check if post is trending (high engagement recently)
   */
  static isTrending(post: Partial<Post | PublicPost>): boolean {
    if (!post.created_at || !post.engagement_score) return false;
    
    const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    
    // Consider trending if high engagement score and less than 24 hours old
    return post.engagement_score > 10 && hoursOld < 24;
  }

  /**
   * Check if post is featured or pinned
   */
  static isHighlighted(post: Partial<Post | PublicPost>): boolean {
    return !!(post.is_pinned || post.is_featured);
  }
}

/**
 * Post Content Utilities
 */
export class PostContentUtils {
  /**
   * Extract hashtags from content
   */
  static extractHashtags(content: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  }

  /**
   * Extract mentions from content
   */
  static extractMentions(content: string): string[] {
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1).toLowerCase()) : [];
  }

  /**
   * Extract URLs from content
   */
  static extractUrls(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = content.match(urlRegex);
    return matches || [];
  }

  /**
   * Replace hashtags with clickable links
   */
  static linkifyHashtags(content: string, onHashtagClick?: (tag: string) => void): string {
    return content.replace(/#([a-zA-Z0-9_]+)/g, (match, tag) => {
      const clickHandler = onHashtagClick ? `onclick="onHashtagClick('${tag}')"` : '';
      return `<span class="hashtag" ${clickHandler}>#${tag}</span>`;
    });
  }

  /**
   * Replace mentions with clickable links
   */
  static linkifyMentions(content: string, onMentionClick?: (username: string) => void): string {
    return content.replace(/@([a-zA-Z0-9_]+)/g, (match, username) => {
      const clickHandler = onMentionClick ? `onclick="onMentionClick('${username}')"` : '';
      return `<span class="mention" ${clickHandler}>@${username}</span>`;
    });
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(content: string): string {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Generate content preview for search/SEO
   */
  static generateContentPreview(content: string, maxLength: number = 300): string {
    // Remove hashtags and mentions for cleaner preview
    let preview = content
      .replace(/#[a-zA-Z0-9_]+/g, '')
      .replace(/@[a-zA-Z0-9_]+/g, '')
      .replace(/https?:\/\/[^\s]+/g, '[link]')
      .replace(/\s+/g, ' ')
      .trim();

    if (preview.length > maxLength) {
      const lastSpace = preview.lastIndexOf(' ', maxLength);
      preview = preview.slice(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
    }

    return preview;
  }

  /**
   * Validate post content
   */
  static validateContent(content: string): { valid: boolean; error?: string } {
    if (!content.trim()) {
      return { valid: false, error: 'Content cannot be empty' };
    }

    if (content.length > 10000) {
      return { valid: false, error: 'Content is too long (max 10,000 characters)' };
    }

    return { valid: true };
  }

  /**
   * Count words in content
   */
  static getWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count characters in content
   */
  static getCharacterCount(content: string): number {
    return content.length;
  }
}

/**
 * Post Validation Utilities
 */
export class PostValidationUtils {
  /**
   * Validate post title
   */
  static validateTitle(title: string): { valid: boolean; error?: string } {
    if (title.length > 200) {
      return { valid: false, error: 'Title is too long (max 200 characters)' };
    }
    
    return { valid: true };
  }

  /**
   * Validate post tags
   */
  static validateTags(tags: string[]): { valid: boolean; error?: string } {
    if (tags.length > 10) {
      return { valid: false, error: 'Too many tags (max 10)' };
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        return { valid: false, error: 'Tag is too long (max 50 characters)' };
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
        return { valid: false, error: 'Tags can only contain letters, numbers, and underscores' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Validate external link
   */
  static validateExternalLink(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Check for valid protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use http or https protocol' };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate media file type
   */
  static validateMediaType(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` };
    }
    
    return { valid: true };
  }

  /**
   * Validate media file size
   */
  static validateMediaSize(file: File, maxSizeBytes: number): { valid: boolean; error?: string } {
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return { valid: false, error: `File is too large (max ${maxSizeMB}MB)` };
    }
    
    return { valid: true };
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(coordinates: PostCoordinates): { valid: boolean; error?: string } {
    const { latitude, longitude } = coordinates;
    
    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }
    
    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }
    
    return { valid: true };
  }
}

/**
 * Geographic Utilities
 */
export class PostGeographicUtils {
  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  static calculateDistance(coord1: PostCoordinates, coord2: PostCoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    }
    
    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km away`;
    }
    
    return `${Math.round(distanceKm)}km away`;
  }

  /**
   * Get location display name
   */
  static getLocationDisplayName(location: PostLocation): string {
    if (location.name) return location.name;
    if (location.city && location.country) return `${location.city}, ${location.country}`;
    if (location.city) return location.city;
    if (location.address) return location.address;
    
    // Fallback to coordinates
    return `${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}`;
  }

  /**
   * Check if coordinates are within a geographic area
   */
  static isWithinArea(
    coordinates: PostCoordinates,
    center: PostCoordinates,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(coordinates, center);
    return distance <= radiusKm;
  }

  /**
   * Get current user location (browser geolocation)
   */
  static async getCurrentLocation(): Promise<PostCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          resolve(null);
        },
        {
          timeout: 10000,
          enableHighAccuracy: true
        }
      );
    });
  }
}

/**
 * Comment Utilities
 */
export class CommentUtils {
  /**
   * Get comment thread depth indicator
   */
  static getThreadDepthIndicator(threadLevel: number): string {
    const maxVisualDepth = 5;
    const depth = Math.min(threadLevel, maxVisualDepth);
    return '│  '.repeat(depth);
  }

  /**
   * Check if comment is a top-level comment
   */
  static isTopLevel(comment: Comment | PublicComment): boolean {
    return comment.thread_level === 0 && !comment.parent_comment_id;
  }

  /**
   * Get comment reply prompt
   */
  static getReplyPrompt(comment: PublicComment): string {
    if (comment.author_username) {
      return `Reply to @${comment.author_username}`;
    }
    return 'Reply to comment';
  }

  /**
   * Format comment thread path for display
   */
  static formatThreadPath(threadPath: string | null): string {
    if (!threadPath) return '';
    return threadPath.split('.').join(' → ');
  }

  /**
   * Sort comments by thread path (for proper nesting display)
   */
  static sortCommentsByThread(comments: PublicComment[]): PublicComment[] {
    return comments.sort((a, b) => {
      const pathA = a.thread_path || '';
      const pathB = b.thread_path || '';
      
      // Split paths and compare numerically
      const partsA = pathA.split('.').map(Number);
      const partsB = pathB.split('.').map(Number);
      
      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;
        
        if (partA !== partB) {
          return partA - partB;
        }
      }
      
      return 0;
    });
  }

  /**
   * Get comments by parent (for building comment trees)
   */
  static groupCommentsByParent(comments: PublicComment[]): Map<string | null, PublicComment[]> {
    const grouped = new Map<string | null, PublicComment[]>();
    
    comments.forEach(comment => {
      const parentId = comment.parent_comment_id;
      if (!grouped.has(parentId)) {
        grouped.set(parentId, []);
      }
      grouped.get(parentId)!.push(comment);
    });
    
    return grouped;
  }

  /**
   * Build comment tree structure
   */
  static buildCommentTree(comments: PublicComment[]): CommentTreeNode[] {
    const grouped = this.groupCommentsByParent(comments);
    const topLevelComments = grouped.get(null) || [];
    
    return topLevelComments.map(comment => this.buildCommentNode(comment, grouped));
  }

  private static buildCommentNode(comment: PublicComment, grouped: Map<string | null, PublicComment[]>): CommentTreeNode {
    const children = grouped.get(comment.id) || [];
    
    return {
      comment,
      children: children.map(child => this.buildCommentNode(child, grouped)),
      depth: comment.thread_level
    };
  }
}

/**
 * Comment tree node interface
 */
export interface CommentTreeNode {
  comment: PublicComment;
  children: CommentTreeNode[];
  depth: number;
}

/**
 * Link Preview Utilities
 */
export class LinkPreviewUtils {
  /**
   * Generate a preview object for a URL
   */
  static async generatePreview(url: string): Promise<LinkPreview | null> {
    try {
      // In a real implementation, this would call a service to scrape the URL
      // For now, return a basic preview structure
      const urlObj = new URL(url);
      
      return {
        title: null,
        description: null,
        image_url: null,
        site_name: urlObj.hostname,
        url: url,
        favicon_url: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is a media URL (image, video, etc.)
   */
  static isMediaUrl(url: string): { isMedia: boolean; type?: MediaType } {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoExtensions = ['.mp4', '.webm', '.ogv', '.avi', '.mov'];
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    
    const lowerUrl = url.toLowerCase();
    
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
      return { isMedia: true, type: 'IMAGE' };
    }
    
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
      return { isMedia: true, type: 'VIDEO' };
    }
    
    if (audioExtensions.some(ext => lowerUrl.includes(ext))) {
      return { isMedia: true, type: 'AUDIO' };
    }
    
    return { isMedia: false };
  }
}

/**
 * Search and Filter Utilities
 */
export class PostSearchUtils {
  /**
   * Build search filters from query parameters
   */
  static buildFiltersFromQuery(searchParams: URLSearchParams): PostFilters {
    const filters: PostFilters = {};
    
    // Post type filter
    const postTypes = searchParams.getAll('type');
    if (postTypes.length > 0) {
      filters.post_type = postTypes as PostType[];
    }
    
    // Category filter
    const categories = searchParams.getAll('category');
    if (categories.length > 0) {
      filters.category = categories;
    }
    
    // Tags filter
    const tags = searchParams.getAll('tag');
    if (tags.length > 0) {
      filters.tags = tags;
    }
    
    // Date range filters
    const dateAfter = searchParams.get('after');
    if (dateAfter) {
      filters.created_after = dateAfter;
    }
    
    const dateBefore = searchParams.get('before');
    if (dateBefore) {
      filters.created_before = dateBefore;
    }
    
    // Search query
    const query = searchParams.get('q');
    if (query) {
      filters.search_query = query;
    }
    
    // Boolean filters
    if (searchParams.has('media')) {
      filters.has_media = searchParams.get('media') === 'true';
    }
    
    if (searchParams.has('location')) {
      filters.has_location = searchParams.get('location') === 'true';
    }
    
    return filters;
  }

  /**
   * Convert filters to URL search parameters
   */
  static filtersToSearchParams(filters: PostFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    // Handle array filters
    if (filters.post_type) {
      const types = Array.isArray(filters.post_type) ? filters.post_type : [filters.post_type];
      types.forEach(type => params.append('type', type));
    }
    
    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      categories.forEach(category => params.append('category', category));
    }
    
    if (filters.tags) {
      filters.tags.forEach(tag => params.append('tag', tag));
    }
    
    // Handle simple filters
    if (filters.search_query) params.set('q', filters.search_query);
    if (filters.created_after) params.set('after', filters.created_after);
    if (filters.created_before) params.set('before', filters.created_before);
    if (filters.has_media !== undefined) params.set('media', filters.has_media.toString());
    if (filters.has_location !== undefined) params.set('location', filters.has_location.toString());
    
    return params;
  }

  /**
   * Get default sort for post type
   */
  static getDefaultSortForType(postType?: PostType): PostSort {
    switch (postType) {
      case 'ANNOUNCEMENT':
        return { field: 'created_at', direction: 'desc' };
      case 'EVENT':
        return { field: 'created_at', direction: 'asc' }; // Upcoming events first
      case 'QUESTION':
        return { field: 'created_at', direction: 'desc' };
      default:
        return { field: 'engagement_score', direction: 'desc' };
    }
  }
}

/**
 * Accessibility Utilities
 */
export class PostAccessibilityUtils {
  /**
   * Generate alt text for post images
   */
  static generateImageAltText(post: Partial<Post | PublicPost>, imageIndex: number = 0): string {
    const baseText = `Image ${imageIndex + 1}`;
    
    if (post.title) {
      return `${baseText} from post: ${post.title}`;
    }
    
    if (post.content) {
      const preview = PostDisplayUtils.getContentPreview(post, 50);
      return `${baseText} from post: ${preview}`;
    }
    
    return baseText;
  }

  /**
   * Get ARIA label for post actions
   */
  static getActionAriaLabel(action: string, post: Partial<Post | PublicPost>): string {
    const title = PostDisplayUtils.getDisplayTitle(post);
    
    switch (action) {
      case 'like':
        return `Like post: ${title}`;
      case 'unlike':
        return `Unlike post: ${title}`;
      case 'comment':
        return `Comment on post: ${title}`;
      case 'share':
        return `Share post: ${title}`;
      case 'save':
        return `Save post: ${title}`;
      case 'unsave':
        return `Unsave post: ${title}`;
      default:
        return `${action} post: ${title}`;
    }
  }

  /**
   * Get reading level indicator
   */
  static getReadingLevel(content: string): 'Easy' | 'Medium' | 'Hard' {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence < 15) return 'Easy';
    if (avgWordsPerSentence < 25) return 'Medium';
    return 'Hard';
  }
}

// Export all utilities as a single object for convenience
export const PostUtils = {
  Display: PostDisplayUtils,
  Content: PostContentUtils,
  Validation: PostValidationUtils,
  Geographic: PostGeographicUtils,
  Comment: CommentUtils,
  LinkPreview: LinkPreviewUtils,
  Search: PostSearchUtils,
  Accessibility: PostAccessibilityUtils,
};

// Default export
export default PostUtils;