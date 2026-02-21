/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude heavy server-only packages from client bundle
  serverExternalPackages: [
    '@aws-sdk/client-s3',
    '@prisma/client',
    'stripe',
    'bcryptjs',
    'ioredis',
    'minio',
    'resend',
  ],
  // Tree-shake large packages
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      '@tanstack/react-query',
      '@tanstack/react-table',
    ],
  },
}

export default nextConfig
