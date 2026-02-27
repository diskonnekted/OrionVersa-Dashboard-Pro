import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/sungai",
  assetPrefix: "/sungai",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/sungai",
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
