"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getLocalUser, getFollowingIds } from "@/lib/userAuth";

export default function Home() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const setSelectedPlaceRef = useRef(null);
  setSelectedPlaceRef.current = setSelectedPlace;
  const [savedKeys, setSavedKeys] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("zzp_saved_places");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr.map((p) => p.key));
    } catch { return new Set(); }
  });

  const toggleSave = (place) => {
    const key = `${place.lat}_${place.lng}`;
    const raw = localStorage.getItem("zzp_saved_places");
    const arr = raw ? JSON.parse(raw) : [];

    if (savedKeys.has(key)) {
      const updated = arr.filter((p) => p.key !== key);
      localStorage.setItem("zzp_saved_places", JSON.stringify(updated));
      setSavedKeys((prev) => { const s = new Set(prev); s.delete(key); return s; });
    } else {
      const entry = {
        key,
        restaurant_name: place.restaurant_name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        count: place.count,
        reviews: place.reviews.map((r) => ({
          nickname: r.users?.nickname || "알 수 없음",
          rating: r.rating,
          menu: r.menu,
          comment: r.comment,
        })),
        saved_at: new Date().toISOString(),
      };
      localStorage.setItem("zzp_saved_places", JSON.stringify([...arr, entry]));
      setSavedKeys((prev) => new Set([...prev, key]));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startMap = () => {
      if (!window.kakao || !window.kakao.maps) return;

      window.kakao.maps.load(() => {
        if (!isMounted || mapRef.current) return;
        
        const container = containerRef.current;
        if (!container) return;

        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 4,
        };

        const map = new window.kakao.maps.Map(container, options);
        mapRef.current = map;

        // --- 실시간 데이터 로드 및 시각화 ---
        const fetchAndDisplayReviews = async () => {
          const localUser = getLocalUser();
          let query = supabase.from('reviews').select('*, users(nickname)');

          if (localUser) {
            const followingIds = await getFollowingIds(localUser.id);
            const visibleIds = [localUser.id, ...followingIds];
            query = query.in('user_id', visibleIds);
          }

          const { data: reviews, error } = await query;

          if (error) {
            console.error('리뷰 불러오기 실패:', error);
            return;
          }

          // 1. 같은 장소끼리 그룹화 (추천 수 계산)
          const placeGroups = reviews.reduce((acc, curr) => {
            const key = `${curr.lat}_${curr.lng}`;
            if (!acc[key]) {
              acc[key] = { ...curr, count: 0, reviews: [] };
            }
            acc[key].count += 1;
            acc[key].reviews.push(curr);
            return acc;
          }, {});

          // 전역 콜백 등록 (CustomOverlay onclick에서 React state 접근)
          window.__zzp_selectPlace = (key) => {
            setSelectedPlaceRef.current(placeGroups[key]);
          };

          // 2. 지도에 핀 표시
          Object.values(placeGroups).forEach((place) => {
            const position = new window.kakao.maps.LatLng(place.lat, place.lng);
            const key = `${place.lat}_${place.lng}`;

            // 기획: 🔴 5+명, 🟡 3+명, 🔵 1+명
            let pinColor = "var(--pin-blue)";
            if (place.count >= 5) pinColor = "var(--pin-red)";
            else if (place.count >= 3) pinColor = "var(--pin-yellow)";

            const content = `
              <div class="custom-pin" style="background-color: ${pinColor}; cursor:pointer;" onclick="window.__zzp_selectPlace('${key}')">
                <span class="pin-count">${place.count}</span>
              </div>
            `;

            new window.kakao.maps.CustomOverlay({
              position: position,
              content: content,
              map: map,
              yAnchor: 1.2
            });
          });
        };

        fetchAndDisplayReviews();

        // 현위치 표시
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const locPosition = new window.kakao.maps.LatLng(lat, lng);
            map.setCenter(locPosition);
            
            new window.kakao.maps.Circle({
              center: locPosition,
              radius: 20,
              strokeWeight: 0,
              fillColor: '#4285F4',
              fillOpacity: 0.5,
              map: map
            });
          });
        }
        
        setMapStatus("success");
      });
    };

    if (window.kakao && window.kakao.maps) {
      startMap();
    }

    const handleSdkLoad = () => startMap();
    window.addEventListener("kakao-sdk-loaded", handleSdkLoad);

    const timeout = setTimeout(() => {
      if (isMounted && !mapRef.current) {
        startMap();
        setTimeout(() => {
          if (isMounted && !mapRef.current) {
            setMapStatus("error");
            setErrorMessage("지도를 불러오는 데 실패했습니다.");
          }
        }, 2000);
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener("kakao-sdk-loaded", handleSdkLoad);
      clearTimeout(timeout);
    };
  }, [mapStatus]);

  return (
    <div className="map-view-container">
      {mapStatus === "loading" && (
        <div className="map-overlay">
          <div className="spinner"></div>
          <p>친구들의 맛집을 찾는 중...</p>
        </div>
      )}

      {mapStatus === "error" && (
        <div className="map-overlay error">
          <span className="error-icon">⚠️</span>
          <p>{errorMessage}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="kakao-map" 
        style={{ visibility: mapStatus === "success" ? "visible" : "hidden" }}
      ></div>

      {/* 장소 상세 모달 */}
      {selectedPlace && (
        <div className="modal-backdrop" onClick={() => setSelectedPlace(null)}>
          <div className="place-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPlace(null)}>✕</button>
            <div className="modal-header">
              <h2>{selectedPlace.restaurant_name}</h2>
              <p className="modal-address">{selectedPlace.address}</p>
              <div className="modal-meta">
                <span className="modal-count">추천 {selectedPlace.count}명</span>
                <button
                  className={`save-btn ${savedKeys.has(`${selectedPlace.lat}_${selectedPlace.lng}`) ? "saved" : ""}`}
                  onClick={() => toggleSave(selectedPlace)}
                >
                  {savedKeys.has(`${selectedPlace.lat}_${selectedPlace.lng}`) ? "💾 저장됨" : "🔖 저장"}
                </button>
              </div>
            </div>
            <div className="review-list">
              {selectedPlace.reviews.map((review, i) => (
                <div key={i} className="review-card">
                  <div className="review-top">
                    <div className="reviewer-avatar">{(review.users?.nickname || "?")[0]}</div>
                    <div>
                      <span className="reviewer-name">{review.users?.nickname || "알 수 없음"}</span>
                      <span className="review-rating">{"⭐".repeat(review.rating)}</span>
                    </div>
                  </div>
                  <div className="review-menu">🍽 {review.menu}</div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mapStatus === "success" && (
        <>
          <div className="search-container mobile-only">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="친구들의 추천 맛집 검색" readOnly />
            </div>
          </div>
          
          <div className="map-legend mobile-only">
            <div className="legend-item"><span className="dot red"></span> 5+명 추천</div>
            <div className="legend-item"><span className="dot yellow"></span> 3+명 추천</div>
            <div className="legend-item"><span className="dot blue"></span> 1+명 추천</div>
          </div>

          <div className="fab-group">
            <button className="fab-btn location-btn" onClick={() => window.location.reload()}>📍</button>
          </div>
        </>
      )}

      <style jsx global>{`
        .custom-pin {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 3px 3px 0px var(--black);
          border: var(--border-width) solid var(--black);
          color: var(--black);
          font-weight: 900;
          font-size: 16px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .custom-pin:active { transform: rotate(-45deg) scale(0.9); }
        .pin-count { transform: rotate(45deg); }
      `}</style>

      <style jsx>{`
        .map-view-container {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 64px;
          background: #f0f0ed;
        }
        @media (min-width: 769px) {
          .map-view-container { top: var(--header-height); bottom: 0; }
        }
        .kakao-map { width: 100%; height: 100%; }
        .map-overlay {
          position: absolute; inset: 0; z-index: 2000;
          background: white; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid var(--gray-100);
          border-left-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .search-container {
          position: absolute; top: env(safe-area-inset-top, 24px);
          left: 16px; right: 16px; z-index: 1000;
        }
        .search-bar {
          background: white; padding: 12px 16px; border-radius: var(--doodle-radius);
          border: var(--border-width) solid var(--black); box-shadow: var(--doodle-shadow);
          display: flex; align-items: center; gap: 12px;
        }
        .search-bar input { border: none; outline: none; width: 100%; font-size: 1.1rem; font-family: inherit; font-weight: bold; }

        .map-legend {
          position: absolute; top: 96px; left: 16px;
          background: var(--white); border: var(--border-width) solid var(--black);
          padding: 10px 14px; border-radius: var(--doodle-radius); z-index: 1000;
          display: flex; flex-direction: column; gap: 6px;
          box-shadow: var(--doodle-shadow); font-size: 0.9rem; font-family: inherit;
        }
        .legend-item { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--black); }
        .dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--black); }
        .dot.red { background: var(--pin-red); }
        .dot.yellow { background: var(--pin-yellow); }
        .dot.blue { background: var(--pin-blue); }

        .fab-group { position: absolute; right: 16px; bottom: 24px; z-index: 1000; }
        .fab-btn {
          width: 52px; height: 52px; border-radius: var(--doodle-radius);
          background: var(--white); box-shadow: var(--doodle-shadow);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; border: var(--border-width) solid var(--black);
          transition: all 0.15s ease;
        }
        .fab-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px var(--black); }

        /* 모달 */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 3000;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: flex-end;
        }
        .place-modal {
          width: 100%; max-height: 75vh;
          background: var(--paper); border: var(--border-width) solid var(--black);
          border-radius: 24px 24px 0 0; border-bottom: none;
          padding: 24px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 16px;
          position: relative; box-shadow: 0px -4px 0px var(--black);
        }
        @media (min-width: 769px) {
          .modal-backdrop { align-items: center; justify-content: center; }
          .place-modal { max-width: 480px; border-radius: var(--doodle-radius); max-height: 80vh; border-bottom: var(--border-width) solid var(--black); box-shadow: var(--doodle-shadow); }
        }
        .modal-close {
          position: absolute; top: 20px; right: 20px;
          background: var(--white); border: var(--border-width) solid var(--black); 
          border-radius: var(--doodle-radius);
          width: 32px; height: 32px; font-size: 1.2rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px var(--black); font-family: inherit; font-weight: bold;
        }
        .modal-header { padding-right: 32px; }
        .modal-header h2 { font-size: 1.5rem; font-weight: 900; margin: 0 0 4px; }
        .modal-address { font-size: 1rem; color: var(--gray-600); margin: 0 0 12px; }
        .modal-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .modal-count {
          display: inline-block; background: var(--secondary);
          color: var(--black); border: 2px solid var(--black);
          font-size: 0.9rem; font-weight: 700; box-shadow: 2px 2px 0px var(--black);
          padding: 4px 12px; border-radius: var(--doodle-radius);
        }
        .save-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--white); border: 2px solid var(--black);
          font-size: 0.9rem; font-weight: 700; font-family: inherit;
          padding: 4px 14px; border-radius: var(--doodle-radius);
          box-shadow: 2px 2px 0px var(--black); cursor: pointer;
          transition: all 0.15s;
        }
        .save-btn:active { transform: translate(2px, 2px); box-shadow: none; }
        .save-btn.saved { background: var(--accent); }
        .review-list { display: flex; flex-direction: column; gap: 16px; }
        .review-card {
          background: var(--white); border: var(--border-width) solid var(--black); border-radius: var(--doodle-radius); box-shadow: 4px 4px 0px var(--black);
          padding: 16px; display: flex; flex-direction: column; gap: 8px;
        }
        .review-top { display: flex; align-items: center; gap: 10px; }
        .reviewer-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--primary); color: white; border: 2px solid var(--black);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 900; flex-shrink: 0;
        }
        .reviewer-name { font-weight: 800; font-size: 1rem; display: block; }
        .review-rating { font-size: 0.8rem; }
        .review-menu { font-size: 1rem; color: var(--gray-800); font-weight: 600; }
        .review-comment { font-size: 1.1rem; color: var(--black); margin: 0; line-height: 1.5; }
      `}</style>
    </div>
  );
}
