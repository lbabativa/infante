import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // Fotos del equipo subidas desde el admin
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};

export default nextConfig;
