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

    const url = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;

    fetch(url).then(res => {
      console.log("[KakaoScript] fetch status:", res.status, res.url);
      return res.text();
    }).then(text => {
      console.log("[KakaoScript] response preview:", text.slice(0, 200));
    }).catch(e => {
      console.error("[KakaoScript] fetch error:", e);
    });

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => {
      console.log("[KakaoScript] script loaded, window.kakao:", !!window.kakao);
      window.dispatchEvent(new Event("kakao-sdk-loaded"));
    };
    script.onerror = (e) => {
      console.error("[KakaoScript] script onerror:", e);
      window.dispatchEvent(new Event("kakao-sdk-error"));
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
