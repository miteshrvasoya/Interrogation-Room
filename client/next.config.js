/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const rawBackendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:4000';
    const backendUrl = rawBackendUrl.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
