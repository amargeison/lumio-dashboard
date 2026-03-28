// @ts-ignore
const withPWA = require('next-pwa')
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  redirects: async () => [
    { source: '/sales-crm', destination: '/sales', permanent: true },
    { source: '/crm/:path*', destination: 'https://app.lumiocms.com/crm/:path*', permanent: false, has: [{ type: 'host', value: 'lumiocms.com' }] },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ],
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [],
  exclude: [/auth\/callback/, /login/, /api\/auth/],
})(nextConfig)
