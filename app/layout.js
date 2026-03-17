import "./globals.css";
import Navbar from "./components/Navbar";
import KakaoScript from "./components/KakaoScript";
import NicknameSetup from "./components/NicknameSetup";

export const metadata = {
  title: "쩝쩝박사지도 | 광고 없는 지인 추천 맛집 플랫폼",
  description: "내가 신뢰하는 사람들의 실제 추천으로 맛집을 찾는 소셜 맛집 플랫폼",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {/* 손그림 SVG 필터 정의 */}
        <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
          <defs>
            <filter id="wobbly">
              <feTurbulence type="turbulence" baseFrequency="0.045" numOctaves="3" seed="8" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <KakaoScript />
        <NicknameSetup />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
