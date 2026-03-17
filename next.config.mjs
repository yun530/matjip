/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
// GitHub Pages 배포 시에만 경로를 지정하고, 그 외(Vercel 등)에는 공백으로 둡니다.
const basePath = process.env.GITHUB_PAGES ? '/matjip' : '';

const nextConfig = {
  output: isProd ? 'export' : undefined,
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
