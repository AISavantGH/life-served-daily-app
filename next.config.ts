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
      {
        protocol: 'https',
        hostname: 'lh3.google.com',
      }
    ],
  },
  allowedDevOrigins: ['https://9000-firebase-studio-1754540236720.cluster-ux5mmlia3zhhask7riihruxydo.cloudworkstations.dev'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' https://*.vscode-cdn.net https://*.googleusercontent.com https://lh3.google.com data: blob: https://placehold.co;",
          },
          {
            key: 'X-Forwarded-For',
            value: ':remote-addr',
          },
          {
            key: 'X-Forwarded-Proto',
            value: 'https',
          },
          {
            key: 'X-Forwarded-Host',
            value: ':host',
          }
        ],
      },
    ]
  },
};

export default nextConfig;
