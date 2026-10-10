import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

/*
 * This project is nested inside the Smaran Expo workspace, which has its own
 * lockfile. Without an explicit root, Turbopack walks up and picks the Expo
 * directory, pulling the React Native tree into module resolution. Pinning the
 * root here keeps the two builds independent -- and keeps this config correct
 * once the folder is lifted into its own repository.
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  /*
   * The glass design was previewed at `/new` before it replaced the original
   * page. Links shared during that preview keep working.
   */
  async redirects() {
    return [{ source: '/new', destination: '/', permanent: true }];
  },
};

export default nextConfig;
