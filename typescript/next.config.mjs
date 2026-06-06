/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        '../../Luotea-Hackathon-2026/**',
        '../../ai/**',
        '../../analysis/**',
        '../../output/**',
      ],
    },
  },
}

export default nextConfig
