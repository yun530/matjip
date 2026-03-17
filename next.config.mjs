/** @type {import('next').NextConfig} */
// GitHub Pages 배포 시에만 경로를 지정합니다.
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/matjip' : '';

const nextConfig = {
  // Vercel 배포 시에는 'export'가 필요 없으므로 제거하거나 조건부로 설정합니다.
  output: isGithubPages ? 'export' : undefined,
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
