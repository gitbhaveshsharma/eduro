import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Avatar proxy endpoint
 * GET /api/avatar-proxy?url=<encoded remote image url>
 *
 * Notes:
 * - Whitelist known avatar hosts to avoid creating an open proxy.
 * - Add CORS/CORP headers so the browser can embed the resource when the page
 *   is served with COEP/COOP.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url } = req.query;
    if (!url || Array.isArray(url)) {
      res.status(400).send('Missing url param');
      return;
    }

    const remoteUrl = decodeURIComponent(url as string);

    // Basic validation / whitelist
    const allowedHosts = ['gravatar.com', 'www.gravatar.com', 'robohash.org', 'www.robohash.org'];
    let host;
    try {
      host = new URL(remoteUrl).hostname;
    } catch {
      res.status(400).send('Invalid url');
      return;
    }

    if (!allowedHosts.includes(host)) {
      res.status(403).send('Host not allowed');
      return;
    }

    // Fetch remote image
    const remoteRes = await fetch(remoteUrl);
    if (!remoteRes.ok) {
      res.status(remoteRes.status).send('Failed to fetch remote image');
      return;
    }

    const buffer = Buffer.from(await remoteRes.arrayBuffer());
    const contentType = remoteRes.headers.get('content-type') || 'image/png';

    // Important headers to allow embedding under COEP/COOP
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600'); // 1 day cache
    // Allow embedding on cross-origin documents
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Allow browser clients to fetch
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).send(buffer);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).send('Internal server error');
  }
}
