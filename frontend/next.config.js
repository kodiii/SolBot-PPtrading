/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@radix-ui/react-icons"],
  typescript: {
    // We're handling type checking in VS Code
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig