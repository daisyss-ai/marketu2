import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    domains: [
      'via.placeholder.com'
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mloazyfnidtziewujxgj.supabase.co",
      },
    ],
  },
};

export default nextConfig;
