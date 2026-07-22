/** @type {import('next').NextConfig} */
const cmsOrigin = (
  process.env.CMS_URL ||
  process.env.NEXT_PUBLIC_CMS_URL ||
  "http://localhost:1337"
).replace(/\/$/, "");

function parseHostname(urlValue) {
  try {
    return new URL(urlValue).hostname;
  } catch {
    return null;
  }
}

function cmsHostname() {
  return parseHostname(cmsOrigin);
}

function siteHostname() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  return parseHostname(siteUrl);
}

function extraImageHosts() {
  const raw = process.env.NEXT_PUBLIC_IMAGE_DOMAINS || "";
  return raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

function cmsHostnames() {
  const hosts = new Set();
  for (const envKey of ["CMS_URL", "NEXT_PUBLIC_CMS_URL"]) {
    const host = parseHostname(process.env[envKey] || "");
    if (host) hosts.add(host);
  }
  return [...hosts];
}

function buildRemotePatterns() {
  const patterns = [
    { protocol: "http", hostname: "localhost", port: "1337" },
    { protocol: "http", hostname: "127.0.0.1", port: "1337" },
  ];

  for (const host of cmsHostnames()) {
    if (["localhost", "127.0.0.1"].includes(host)) continue;
    patterns.push({ protocol: "https", hostname: host });
    patterns.push({ protocol: "http", hostname: host, port: "1337" });
  }

  const siteHost = siteHostname();
  if (siteHost && !cmsHostnames().includes(siteHost)) {
    patterns.push({ protocol: "https", hostname: siteHost });
  }

  for (const host of extraImageHosts()) {
    if (host.includes("*")) continue;
    patterns.push({ protocol: "https", hostname: host });
  }

  return patterns;
}

const allowSvgFromCms =
  process.env.NEXT_PUBLIC_ALLOW_CMS_SVG === "true" && Boolean(cmsHostname());

/** Ensure pdf.worker.mjs is copied into .next/standalone for PM2/server.js deploys */
const PDF_WORKER_TRACING = [
  "./node_modules/pdf-parse/dist/worker/pdf.worker.mjs",
  "./node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs",
  "./node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs",
  "./node_modules/pdf-parse/dist/pdf-parse/web/pdf.worker.mjs",
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["three"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
    outputFileTracingIncludes: {
      "/api/admin/product-specs": PDF_WORKER_TRACING,
      "/api/admin/product-specs/route": PDF_WORKER_TRACING,
      "./app/api/admin/product-specs/route.ts": PDF_WORKER_TRACING,
    },
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${cmsOrigin}/uploads/:path*`,
      },
      {
        source: "/strapi-uploads/:path*",
        destination: `${cmsOrigin}/uploads/:path*`,
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: allowSvgFromCms,
    contentDispositionType: allowSvgFromCms ? "inline" : undefined,
    contentSecurityPolicy: allowSvgFromCms
      ? "default-src 'self'; script-src 'none'; sandbox;"
      : undefined,
    remotePatterns: buildRemotePatterns(),
  },
};

module.exports = nextConfig;
