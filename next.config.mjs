import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Removed unoptimized: true to enable image optimization
    formats: ["image/webp", "image/avif"],
  },
  output: "standalone",
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"], // Optimize icon imports
  },
  // Use Turbopack for faster builds (Next.js 16 default)
  turbopack: {},
}

export default withBundleAnalyzer(nextConfig)
