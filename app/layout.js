import { Jua } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import KakaoScript from "./components/KakaoScript";
import NicknameSetup from "./components/NicknameSetup";

const jua = Jua({
  weight: ['400'],
  subsets: ["latin"]
});

export const metadata = {
  title: "쩝쩝박사지도 | 광고 없는 지인 추천 맛집 플랫폼",
  description: "내가 신뢰하는 사람들의 실제 추천으로 맛집을 찾는 소셜 맛집 플랫폼",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={jua.className}>
        <KakaoScript />
        <NicknameSetup />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
