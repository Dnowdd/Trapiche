import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@better-auth/kysely-adapter", "kysely"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "books.google.com",
        pathname: "/books/**",
      },
    ],
  },
};

export default nextConfig;
