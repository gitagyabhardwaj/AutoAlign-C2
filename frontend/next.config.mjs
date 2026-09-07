/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from any domain if we later load real lunar tiles
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
