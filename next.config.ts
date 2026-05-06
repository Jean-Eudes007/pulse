import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
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

// Bundle analyzer: run with ANALYZE=true npm run build to open the
// interactive bundle visualizer in the browser.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// withSentryConfig wraps the Next config to enable source map upload to
// Sentry at build time. Without SENTRY_AUTH_TOKEN it stays silent and
// only the runtime SDK works (still useful for capturing errors with
// minified stack traces).
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Skip source map upload entirely if no auth token — keeps local dev
  // and CI builds from failing on Sentry's API.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  tunnelRoute: "/monitoring",
});
