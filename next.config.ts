import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  distDir: process.env.STOREFRONT_BUILD_DIR || '.next',
};
export default config;
