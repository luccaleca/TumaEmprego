/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "playwright"],
};

export default nextConfig;
