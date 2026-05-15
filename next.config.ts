import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    graveyard: {
      stale: 300,      // client sees fresh data for 5 min
      revalidate: 300, // server regenerates every 5 min
      expire: 3600,    // purge entry after 1 hour of no traffic
    },
  },
};

export default nextConfig;
