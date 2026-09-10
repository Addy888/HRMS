import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.14', '192.168.10.8', 'localhost', '127.0.0.1'],
  
  // Empty Turbopack config to silence the warning
  // PDF.js works fine with Turbopack without special configuration
  turbopack: {},
  
  // Webpack configuration (fallback for --webpack flag)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    return config;
  },
};

export default nextConfig;
