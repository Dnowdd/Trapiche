import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-auth bundles @better-auth/kysely-adapter which uses kysely internals
  // that moved to subpaths in 0.29.x — skip bundling to avoid the static analysis error
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter", "kysely"],
};

export default nextConfig;
