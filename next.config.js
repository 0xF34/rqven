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

    // Bypass @zip.js/zip.js strict exports field — Cesium needs the old subpath
    config.resolve.exportsFields = [];

    return config;
  },
};

module.exports = nextConfig;
