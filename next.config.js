/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'hnswlib-node'];

    return config;
  },
};

module.exports = nextConfig;
