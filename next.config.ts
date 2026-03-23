// @ts-ignore
const withPWA = require('next-pwa')
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [],
  exclude: [/auth\/callback/, /login/, /api\/auth/],
})(nextConfig)
