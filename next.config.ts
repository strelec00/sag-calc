import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'docs',
  basePath: '/sag-calc',
  reactStrictMode: true,
};

export default nextConfig;
