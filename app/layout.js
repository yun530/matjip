import "./globals.css";
import SketchDock from "./components/SketchDock";
import KakaoScript from "./components/KakaoScript";
import NicknameSetup from "./components/NicknameSetup";

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
        <KakaoScript />
        <NicknameSetup />
        <main>{children}</main>
        <SketchDock />
      </body>
    </html>
  );
}
