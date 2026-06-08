/** @type {import('next').NextConfig} */
const cmsOrigin = (
  process.env.CMS_URL ||
  process.env.NEXT_PUBLIC_CMS_URL ||
  "http://localhost:1337"
).replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
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
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
      { protocol: "http", hostname: "127.0.0.1", port: "1337" },
      { protocol: "http", hostname: "192.168.*.*", port: "1337" },
      { protocol: "http", hostname: "10.*.*.*", port: "1337" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
