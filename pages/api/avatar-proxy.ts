import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Avatar/Image proxy endpoint
 * GET /api/avatar-proxy?url=<encoded remote image url>
 *
 * Notes:
 * - Whitelist known avatar/image hosts to avoid creating an open proxy.
 * - Add CORS/CORP headers so the browser can embed the resource when the page
 *   is served with COEP/COOP.
 * - Supports Supabase storage for profile avatars and coaching center logos.
 */

// Force dynamic rendering - never cache this route at build time or edge
export const config = {
  api: {
    // Increase body size limit for larger images if needed
    bodyParser: false,
    // Ensure this runs as a serverless function, not edge
    runtime: 'nodejs',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url } = req.query;
    if (!url || Array.isArray(url)) {
      res.status(400).send('Missing url param');
      return;
    }

    const remoteUrl = decodeURIComponent(url as string);

    // Basic validation / whitelist
    // Include avatar services and Supabase storage domains
    const allowedHosts = [
      // Avatar generation services
      'gravatar.com',
      'www.gravatar.com',
      'robohash.org',
      'www.robohash.org',
      'ui-avatars.com',
      'www.ui-avatars.com',
      // Supabase storage - allow project-specific domain
      'ixhlpassuqmqpzpumkuw.supabase.co',
      // Generic Supabase storage pattern (for flexibility)
    ];

    // Also allow any *.supabase.co domain for storage
    const supabaseStoragePattern = /^[a-z0-9]+\.supabase\.co$/i;

    let host;
    try {
      host = new URL(remoteUrl).hostname;
    } catch {
      res.status(400).send('Invalid url');
      return;
    }

    // Check if host is in allowed list or matches Supabase pattern
    const isAllowed = allowedHosts.includes(host) || supabaseStoragePattern.test(host);

    if (!isAllowed) {
      res.status(403).send('Host not allowed');
      return;
    }

    // Fetch remote image with explicit headers to ensure proper response
    // Use redirect: 'follow' to handle any redirects from avatar services
    const remoteRes = await fetch(remoteUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'image/*,*/*',
        'User-Agent': 'Eduro-Avatar-Proxy/1.0',
        // Prevent caching issues on the fetch side
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!remoteRes.ok) {
      console.error(`Avatar proxy fetch failed: ${remoteRes.status} ${remoteRes.statusText} for URL: ${remoteUrl}`);
      res.status(remoteRes.status).send('Failed to fetch remote image');
      return;
    }

    const buffer = Buffer.from(await remoteRes.arrayBuffer());
    const contentType = remoteRes.headers.get('content-type') || 'image/png';

    // Validate that we actually got an image
    if (!contentType.startsWith('image/')) {
      console.error(`Avatar proxy received non-image content-type: ${contentType} for URL: ${remoteUrl}`);
      res.status(502).send('Remote server did not return an image');
      return;
    }

    // Important headers to allow embedding under COEP/COOP
    res.setHeader('Content-Type', contentType);
    
    // CRITICAL: Disable Netlify Edge caching to prevent serving wrong images
    // Each unique URL must return its own image, not a cached one
    // Browser can cache (max-age), but CDN/Edge must not (s-maxage=0)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=0, must-revalidate');
    
    // Explicitly tell Netlify Edge to NOT cache this response
    res.setHeader('Netlify-CDN-Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'no-store');
    
    // Forward ETag/Last-Modified from remote when present to support browser caching
    const etag = remoteRes.headers.get('etag');
    const lastModified = remoteRes.headers.get('last-modified');
    if (etag) res.setHeader('ETag', etag);
    if (lastModified) res.setHeader('Last-Modified', lastModified);

    // Inform caches that response varies by the URL parameter and Origin
    // This ensures different avatar URLs are cached separately (for browsers)
    res.setHeader('Vary', 'Origin, Accept');

    // Allow embedding on cross-origin documents (CORP)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Allow browser clients to fetch
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).send(buffer);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).send('Internal server error');
  }
}
