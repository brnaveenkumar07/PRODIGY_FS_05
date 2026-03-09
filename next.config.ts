import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    // Allow locally-uploaded images served from /public/uploads
    localPatterns: [{ pathname: "/uploads/**" }],
    // TODO: Add remotePatterns for Cloudinary/S3 when env vars are set
    // remotePatterns: [
    //   { protocol: "https", hostname: "res.cloudinary.com" },
    // ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
