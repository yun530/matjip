"use client";

import { useEffect } from "react";

export default function KakaoScript() {
  useEffect(() => {
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!KAKAO_KEY) {
      console.error("[KakaoScript] NEXT_PUBLIC_KAKAO_MAP_API_KEY is not set");
      return;
    }

    if (window.kakao && window.kakao.maps) {
      window.dispatchEvent(new Event("kakao-sdk-loaded"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.dispatchEvent(new Event("kakao-sdk-loaded"));
    };
    script.onerror = (e) => {
      console.error("[KakaoScript] Failed to load Kakao Maps SDK", e);
      window.dispatchEvent(new Event("kakao-sdk-error"));
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
