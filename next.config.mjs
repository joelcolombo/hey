/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/joelcolombo/hey/**',
      },
      {
        protocol: 'https',
        hostname: 'play.joelcolombo.co',
        pathname: '/404/**',
      },
    ],
  },
};

export default nextConfig;
