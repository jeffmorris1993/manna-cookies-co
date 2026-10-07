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
  `connect-src 'self' ${supabaseHost} https://*.squareupsandbox.com https://*.squareup.com https://*.squarecdn.com https://pay.google.com https://google.com/pay`,
  "frame-src https://*.squareupsandbox.com https://*.squareup.com https://*.squarecdn.com https://pay.google.com",
  "img-src 'self' data: blob: https://*.squarecdn.com https://www.gstatic.com",
  "font-src 'self' data: https://*.squarecdn.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
