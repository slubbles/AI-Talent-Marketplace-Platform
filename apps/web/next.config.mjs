/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@atm/shared", "@atm/ui"],
};

export default nextConfig;
