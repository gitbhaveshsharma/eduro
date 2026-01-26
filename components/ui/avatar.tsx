'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

// ✅ Helper function to proxy external images
function getProxiedImageUrl(url: string | undefined | null): string | undefined {
    // Return undefined for null, undefined, or empty strings
    if (!url || typeof url !== 'string') return undefined;

    // If already a relative URL or data URL, return as-is
    if (url.startsWith('/') || url.startsWith('data:')) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // List of domains that need proxying (to avoid CORP issues)
        const needsProxy = [
            'supabase.co',
            'gravatar.com',
            'robohash.org',
            'ui-avatars.com'
        ].some(domain => hostname.includes(domain));

        if (needsProxy) {
            return `/api/avatar-proxy?url=${encodeURIComponent(url)}`;
        }

        // Return original URL for same-origin or other trusted sources
        return url;
    } catch (error) {
        console.error('Invalid avatar URL:', url);
        return undefined;
    }
}

function Avatar({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                'relative flex size-8 shrink-0 overflow-hidden rounded-full',
                className,
            )}
            {...props}
        />
    )
}

function AvatarImage({
    className,
    src,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    // ✅ Automatically proxy external image URLs
    const proxiedSrc = React.useMemo(() => getProxiedImageUrl(src), [src]);

    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn('aspect-square size-full', className)}
            src={proxiedSrc}
            {...props}
        />
    )
}

function AvatarFallback({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'bg-muted flex size-full items-center justify-center rounded-full',
                className,
            )}
            {...props}
        />
    )
}

export { Avatar, AvatarImage, AvatarFallback }
