import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   eslint: {
    // Warning: only shows ESLint errors in the console, doesn't fail the build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
