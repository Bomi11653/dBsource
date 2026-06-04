/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
