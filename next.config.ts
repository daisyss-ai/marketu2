import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "./dist",
  typedRoutes: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mloazyfnidtziewujxgj.supabase.co",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
 