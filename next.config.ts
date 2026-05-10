import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // @ts-ignore - Next.js top level property in newer versions
  devIndicators: {
    buildActivity: true,
  },
  // @ts-ignore
  allowedDevOrigins: ['127.0.0.1:59323', 'localhost:59323', '127.0.0.1'],
};

export default nextConfig;
