import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ESLint 오류를 무시하고 빌드를 진행
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
