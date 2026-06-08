import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @better-auth/kysely-adapter uses kysely internals that moved to subpaths in 0.29.x;
  // keep those two external to avoid the static analysis error.
  // better-auth itself must be bundled so its react imports resolve to the same
  // React instance Next.js uses for SSR — externalising it creates a dual-React
  // situation that breaks hooks (null dispatcher).
  serverExternalPackages: ["@better-auth/kysely-adapter", "kysely"],
};

export default nextConfig;
