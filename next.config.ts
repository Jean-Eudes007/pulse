import type { NextConfig } from "next";

// I-3: security headers
const securityHeaders = [
  // Block click-jacking — Pulse should never be framed
  { key: "X-Frame-Options", value: "DENY" },
  // Force HTTPS for 2 years (Vercel already does, but explicit is safer)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Don't leak full URL to third parties on outbound links
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Don't sniff MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disable browser APIs we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
