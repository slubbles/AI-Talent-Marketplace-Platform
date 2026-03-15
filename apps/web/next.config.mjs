/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  transpilePackages: ["@atm/shared", "@atm/ui"],
};

export default nextConfig;
