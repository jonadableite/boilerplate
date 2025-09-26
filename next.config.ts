import createMDX from '@next/mdx'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['awilix', 'nodemailer'],
  experimental: {
    esmExternals: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  // Only for NON turbopack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          net: false,
          dns: false,
          tls: false,
          fs: false,
          request: false,
          child_process: false,
          'node:fs': false,
          'node:fs/promises': false,
          'node:path': false,
        },
      }
    }
    return config
  },

  turbopack: {
    resolveAlias: {
      fs: { browser: './empty.js' },
      dns: { browser: './empty.js' },
      tls: { browser: './empty.js' },
      net: { browser: './empty.js' },
      child_process: { browser: './empty.js' },
      'node:fs': { browser: './empty.js' },
      'node:fs/promises': { browser: './empty.js' },
      'node:path': { browser: './empty.js' },
    },
  },
}

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

// Merge MDX config with Next.js config
export default withMDX(nextConfig)
