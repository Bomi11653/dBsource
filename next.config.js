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

/**
 * Trace server-side PDF deps into standalone.
 * Runtime uses pdf-parse/worker getData() (embedded); loader must be present on disk.
 */
const PDF_SERVER_TRACING = [
  "./lib/pdf-parse-loader.cjs",
  "./node_modules/pdf-parse/**/*",
  "./node_modules/pdfjs-dist/**/*",
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["three"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
    outputFileTracingIncludes: {
      "/api/admin/product-specs": PDF_SERVER_TRACING,
      "/api/admin/product-specs/route": PDF_SERVER_TRACING,
      "./app/api/admin/product-specs/route.ts": PDF_SERVER_TRACING,
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
