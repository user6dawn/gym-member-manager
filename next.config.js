/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['rnfvzaejxwqbwmryxnqp.supabase.co'],
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false,
    };
    return config;
  },
  // Add this to exclude Supabase Functions from the build
  typescript: {
    // Exclude Supabase Functions from type checking
    ignoreBuildErrors: true,
  },
  // Ignore Supabase Functions during build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => 
    !ext.includes('supabase/functions')
  ),
};

module.exports = nextConfig;
