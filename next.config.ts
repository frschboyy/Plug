import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow loading images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Google profile pictures (for OAuth users)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 640, 750, 828],
    imageSizes: [64, 128, 256],
    minimumCacheTTL: 86400,
  },

  // Headers for PWA and security
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Compress response
  compress: true,

  // Skip ESLint during CI/build (path length issues on Windows with nested node_modules)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental: optimize package imports
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
