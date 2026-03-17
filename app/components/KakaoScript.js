"use client";

import Script from "next/script";

export default function KakaoScript() {
  const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

  return (
    <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`}
      strategy="afterInteractive"
      onLoad={() => {
        window.dispatchEvent(new Event("kakao-sdk-loaded"));
      }}
    />
  );
}
