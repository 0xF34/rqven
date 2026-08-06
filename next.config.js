const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        Buffer: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // Fix Cesium's zip.js import
    config.resolve.alias = {
      ...config.resolve.alias,
      '@zip.js/zip.js': path.resolve(
        __dirname,
        'node_modules/@zip.js/zip.js/dist/zip-no-worker.min.js'
      ),
    };

    return config;
  },
};

module.exports = nextConfig;
