/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'rnfvzaejxwqbwmryxnqp.supabase.co',
      'olzdazhydshpykwxuklc.supabase.co',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false,
    };
    return config;
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  experimental: {
    // Enable route cache
    routeCache: true,
    // Enable parallel routes
    parallelRoutes: true,
  }
};

module.exports = nextConfig;
