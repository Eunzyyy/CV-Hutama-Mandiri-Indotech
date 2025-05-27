/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Set false untuk mengurangi rendering ganda
  swcMinify: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Matikan sementara optimasi yang mungkin menyebabkan hydration error
    optimizeCss: false,
    optimizeImages: false,
  },
  // Matikan sementara eslint selama development
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    // Manajemen styledComponents dapat membantu masalah hydration
    styledComponents: true,
  },
};

module.exports = nextConfig;