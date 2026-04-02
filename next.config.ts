// @ts-ignore
const withPWA = require('next-pwa')
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nrrympsgxsadiemzqwci.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  redirects: async () => [
    { source: '/sales-crm', destination: '/sales', permanent: true },
    { source: '/crm/:path*', destination: 'https://app.lumiocms.com/crm/:path*', permanent: false, has: [{ type: 'host', value: 'lumiocms.com' }] },
    // Football portal redirects — old URLs → new separate portals
    { source: '/demo/football/:slug', destination: '/football/pro/:slug', permanent: true },
    { source: '/demo/football-amateur/:slug', destination: '/football/grassroots/:slug', permanent: true },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
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
