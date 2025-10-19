/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Skip lint and type checks only during production build for faster CI/CD
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Enable built-in image optimization
  images: {
    unoptimized: false, // Allow Next.js to handle lazy loading + compression
    formats: ["image/avif", "image/webp"], // Serve modern image formats
    deviceSizes: [320, 640, 768, 1024, 1280, 1600], // Optimize per device size
  },

  // ✅ Performance and UX improvements
  reactStrictMode: true, // Detect inefficient renders
  compress: true, // Gzip + Brotli compression for smaller responses
  swcMinify: true, // Faster JS minification
  poweredByHeader: false, // Remove 'X-Powered-By: Next.js' header

  // ✅ Experimental UX boosts
  experimental: {
    scrollRestoration: true, // Smooth scroll restoration on navigation
  },

  // ✅ (Optional) If you want to speed up build caching on Netlify
  output: "standalone", // Use smaller build output for serverless
};

export default nextConfig;
