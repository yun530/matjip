"use client";

import Script from "next/script";

export default function KakaoScript() {
  const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

  if (!KAKAO_KEY) {
    console.error("[KakaoScript] NEXT_PUBLIC_KAKAO_MAP_API_KEY is not set");
    return null;
  }

  return (
    <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`}
      strategy="afterInteractive"
      onLoad={() => {
        window.dispatchEvent(new Event("kakao-sdk-loaded"));
      }}
      onError={(e) => {
        console.error("[KakaoScript] Failed to load Kakao Maps SDK", e);
      }}
    />
  );
}
