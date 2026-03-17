import "./globals.css";
import SketchDock from "./components/SketchDock";
import KakaoScript from "./components/KakaoScript";
import NicknameSetup from "./components/NicknameSetup";
import ErrorBoundary from "./components/ErrorBoundary";

export const metadata = {
  title: "쩝쩝박사지도 | 지인 추천 맛집 지도",
  description: "초대받은 친구들끼리 맛집을 지도에 올리고 서로 추천을 보는 서비스",
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
        <ErrorBoundary>
        <KakaoScript />
        <NicknameSetup />
        <main>{children}</main>
        <SketchDock />
        </ErrorBoundary>
        
        {/* SVG Filter for sketchy/hand-drawn lines */}
        <svg style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
          <filter id="sketchy-line" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="watercolor" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="2" result="blurred" />
            <feColorMatrix in="blurred" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.65 0" />
          </filter>
        </svg>
      </body>
    </html>
  );
}
