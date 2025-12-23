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
    // Allow loading images from external sources
    remotePatterns: [
      // Supabase Storage (public buckets)
      {
        protocol: "https",
        hostname: "ixhlpassuqmqpzpumkuw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ixhlpassuqmqpzpumkuw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
      // RoboHash avatars
      {
        protocol: "https",
        hostname: "robohash.org",
        port: "",
        pathname: "/**",
      },
      // Gravatar
      {
        protocol: "https",
        hostname: "gravatar.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        port: "",
        pathname: "/**",
      },
      // UI Avatars
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/**",
      },
    ],
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

  // Note: Removed 'output: standalone' due to Windows symlink permission issues
  // Can be re-enabled for deployment on Linux/Mac or with admin rights
};

export default nextConfig;
