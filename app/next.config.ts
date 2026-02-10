import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker deployment
  output: 'standalone',

  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},

  // Keep webpack config for fallback / --webpack flag
  webpack: (config, { isServer }) => {
    // Phaser 3 requires these settings for client-side
    if (!isServer) {
      config.module.rules.push({
        test: /phaser/,
        type: 'javascript/auto',
      });
    }
    return config;
  },

  // Ensure server components don't try to bundle Phaser or native modules
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
