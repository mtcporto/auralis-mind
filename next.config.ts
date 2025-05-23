
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      // This will be automatically replaced by the studio with the
      // current development URL      
      "http://localhost:9002", // Default Next.js dev port if run locally
      // Add any other specific dev origins if needed, for example, from cloud workstations
      "https://*.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev",
    ],
  },
};

export default nextConfig;
