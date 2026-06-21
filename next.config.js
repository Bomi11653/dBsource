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

function buildRemotePatterns() {
  const patterns = [
    { protocol: "http", hostname: "localhost", port: "1337" },
    { protocol: "http", hostname: "127.0.0.1", port: "1337" },
  ];

  const cmsHost = cmsHostname();
  if (cmsHost && !["localhost", "127.0.0.1"].includes(cmsHost)) {
    patterns.push({ protocol: "https", hostname: cmsHost });
    patterns.push({ protocol: "http", hostname: cmsHost, port: "1337" });
  }

  const siteHost = siteHostname();
  if (siteHost && siteHost !== cmsHost) {
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

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["three"],
  async rewrites() {
    return [
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
