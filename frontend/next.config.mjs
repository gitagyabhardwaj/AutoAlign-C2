/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel auto-detects this, but explicit is safer
  output: "standalone",
  // Allow images from any domain if we later load real lunar tiles
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
