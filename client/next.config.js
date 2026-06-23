/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow NEXT_PUBLIC_API_URL to be read at build time from Vercel env vars
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
