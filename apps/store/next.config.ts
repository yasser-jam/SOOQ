import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@puckeditor/core"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
