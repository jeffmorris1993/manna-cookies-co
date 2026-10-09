import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

// Square Web Payments SDK: script from squarecdn, iframes + API calls to
// squareup / squareupsandbox, Google Pay button from pay.google.com.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // React dev mode requires eval; production stays strict
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://sandbox.web.squarecdn.com https://web.squarecdn.com https://pay.google.com`,
  "style-src 'self' 'unsafe-inline' https://*.squarecdn.com",
  `connect-src 'self' ${supabaseHost} ${supabaseHost.replace("https://", "wss://")} https://*.squareupsandbox.com https://*.squareup.com https://*.squarecdn.com https://*.google.com https://google.com/pay https://*.googleapis.com https://*.gstatic.com`,
  "frame-src https://*.squareupsandbox.com https://*.squareup.com https://*.squarecdn.com https://*.google.com",
  `img-src 'self' data: blob: ${supabaseHost} https://*.squarecdn.com https://www.gstatic.com`,
  "font-src 'self' data: https://*.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https" as const,
            hostname: new URL(supabaseHost).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
