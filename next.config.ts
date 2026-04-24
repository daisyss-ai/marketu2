import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',//Make my website into simple pieces
  distDir: './dist',//Put all those pieces in a folder called dist
  typedRoutes: true,//Make sure our route names are spelled correctly. This is like having a spell-checker for your website paths. If you mistype a page address, it warns you before the site breaks. It's a safety guard! ✓
  basePath: process.env.NEXT_PUBLIC_BASE_PATH, // Sets the base path to `/some-base-path`.
};

export default nextConfig;
