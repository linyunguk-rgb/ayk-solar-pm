import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "*.space-z.ai",
    "preview-chat-*.space-z.ai",
    "*.chatglm.cn",
    "*.z.ai",
    "localhost",
    "127.0.0.1",
  ],

  // ─── Production optimisations ──────────────────────────────────────────
  // Compress responses with gzip/brotli (no need for a separate middleware).
  compress: true,
  // Don't leak the Next.js version via the `X-Powered-By` header.
  poweredByHeader: false,

  // ─── Security headers ──────────────────────────────────────────────────
  async headers() {
    const securityHeaders = [
      // Clickjacking: refuse to be framed at all.
      { key: "X-Frame-Options", value: "DENY" },
      // MIME-type sniffing: browsers must honour the declared Content-Type.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Referrer leakage: send origin only on same-origin requests.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Feature policy: lock down powerful APIs to same-origin only.
      {
        key: "Permissions-Policy",
        value:
          "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
      },
      // DNS prefetch: turn on for faster third-party asset loading.
      { key: "X-DNS-Prefetch-Control", value: "on" },
      // HSTS: enforce HTTPS for two years, including subdomains, and opt-in to preload.
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // Content Security Policy: restrict asset/script origins.
      // 'unsafe-inline' + 'unsafe-eval' are required for Next.js dev mode and
      // for inline styles injected by shadcn/Radix. In a fully locked-down prod
      // build these would be replaced with nonces/hashes.
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "object-src 'none'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "connect-src 'self' https:",
          "frame-src 'self'",
          "manifest-src 'self'",
          "worker-src 'self' blob:",
        ].join("; "),
      },
      // Cross-Origin policies: isolate documents from cross-origin resources.
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ];

    return [
      {
        // Apply security headers to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // API routes: re-assert nosniff so JSON is never interpreted as HTML.
        source: "/api/(.*)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
