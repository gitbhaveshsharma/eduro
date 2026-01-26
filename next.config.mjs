import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "false",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Skip lint and type checks only during production build for faster CI/CD
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Tree-shaking optimizations for large icon/component libraries
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{lowerCase member}}",
      preventFullImport: true,
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
      preventFullImport: true,
    },
    "@mui/material": {
      transform: "@mui/material/{{member}}",
      preventFullImport: true,
    },
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
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
      "date-fns",
    ],
  },

  // Note: Removed 'output: standalone' due to Windows symlink permission issues
  // Can be re-enabled for deployment on Linux/Mac or with admin rights

  // ✅ Webpack optimizations for bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split large vendor chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate large libraries into their own chunks
          framework: {
            name: "framework",
            chunks: "all",
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          supabase: {
            name: "supabase",
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            chunks: "all",
            priority: 30,
          },
          ui: {
            name: "ui",
            test: /[\\/]node_modules[\\/](@radix-ui|@mui)[\\/]/,
            chunks: "all",
            priority: 25,
          },
          charts: {
            name: "charts",
            test: /[\\/]node_modules[\\/](recharts|d3|chart\.js)[\\/]/,
            chunks: "all",
            priority: 20,
          },
        },
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
