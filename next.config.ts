import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "./dist",
  typedRoutes: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
