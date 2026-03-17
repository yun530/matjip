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
            let pinColor = "#3b82f6";
            if (place.count >= 5) pinColor = "#ff3b30";
            else if (place.count >= 3) pinColor = "#ffcc00";

            const textColor = pinColor === "#ffcc00" ? "#1a1610" : "white";

            const content = `
              <div onclick="window.__zzp_selectPlace('${key}')" style="cursor:pointer; filter: drop-shadow(2px 2px 0px #1a1610);">
                <svg width="42" height="54" viewBox="0 0 42 54" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 3 C13 3 4 10 4 20 C4 27 9 35 16 43 C18 46 20 49 21 52 C22 49 24 46 26 43 C33 35 38 27 38 20 C38 10 29 3 21 3 Z"
                        fill="${pinColor}" stroke="#1a1610" stroke-width="2.5" stroke-linejoin="round"/>
                  <circle cx="21" cy="19" r="8.5" fill="white" stroke="#1a1610" stroke-width="2"/>
                  <text x="21" y="24" text-anchor="middle" fill="#1a1610" font-size="11" font-weight="900" font-family="Gowun Dodum, sans-serif">${place.count}</text>
                </svg>
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
        .custom-pin:hover { transform: scale(1.15); z-index: 10; }
        .custom-pin:active { transform: scale(0.95); }
      `}</style>

      <style jsx>{`
        .map-view-container {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 60px;
          background: #f8f9fa;
        }
        @media (min-width: 769px) {
          .map-view-container { top: var(--header-height); bottom: 0; }
        }
        .kakao-map { width: 100%; height: 100%; }
        .map-overlay {
          position: absolute; inset: 0; z-index: 2000;
          background-color: rgba(255, 255, 255, 0.85);
          background-image: url('/matjip/crooked_map_bg.png');
          background-size: 400px;
          background-repeat: repeat;
          background-blend-mode: multiply;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid var(--gray-200);
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
          background: var(--white); padding: 14px 16px; border-radius: var(--radius-full);
          border: 2.5px solid var(--black);
          display: flex; align-items: center; gap: 12px;
          transition: border-color 0.1s;
        }
        .search-bar:focus-within {
          border-color: var(--primary);
        }
        .search-bar input { border: none; outline: none; width: 100%; font-size: 1rem; color: var(--gray-900); font-family: inherit; font-weight: 500; }
        .search-bar input::placeholder { color: var(--gray-400); }

        .map-legend {
          position: absolute; top: 90px; left: 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 2.5px solid var(--black);
          padding: 12px 16px; border-radius: var(--radius-lg); z-index: 1000;
          display: flex; flex-direction: column; gap: 8px;
          font-size: 0.85rem; font-family: inherit;
        }
        .legend-item { display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--gray-700); }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: var(--pin-red); }
        .dot.yellow { background: var(--pin-yellow); }
        .dot.blue { background: var(--pin-blue); }

        .fab-group { position: absolute; right: 16px; bottom: 24px; z-index: 1000; }
        .fab-btn {
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--white);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; border: 2.5px solid var(--black);
          transition: all 0.2s ease;
          color: var(--gray-700);
        }
        .fab-btn:active { transform: scale(0.92); }

        /* 모달 */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 3000;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          display: flex; align-items: flex-end;
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .place-modal {
          width: 100%; max-height: 85vh;
          background: var(--white); 
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          padding: 24px 24px calc(24px + env(safe-area-inset-bottom)); 
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 20px;
          position: relative; border-top: 2.5px solid var(--black);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        
        @media (min-width: 769px) {
          .modal-backdrop { align-items: center; justify-content: center; }
          .place-modal { 
            max-width: 440px; border-radius: var(--radius-xl); 
            max-height: 80vh; padding: 24px;
            animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        }
        
        .modal-close {
          position: absolute; top: 20px; right: 20px;
          background: var(--gray-100); border: none; 
          border-radius: 50%; color: var(--gray-600);
          width: 32px; height: 32px; font-size: 1.1rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; 
          font-family: inherit; font-weight: bold;
          transition: background-color 0.2s ease;
        }
        .modal-close:hover { background: var(--gray-200); color: var(--gray-900); }
        
        .modal-header { padding-right: 40px; }
        .modal-header h2 { font-size: 1.4rem; font-weight: 700; margin: 0 0 6px; color: var(--gray-900); }
        .modal-address { font-size: 0.95rem; color: var(--gray-500); margin: 0 0 16px; font-weight: 400; }
        .modal-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .modal-count {
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(49, 130, 246, 0.1); color: var(--primary);
          font-size: 0.85rem; font-weight: 600; 
          padding: 6px 12px; border-radius: var(--radius-full);
        }
        .save-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--gray-100); color: var(--gray-700);
          border: none; font-size: 0.85rem; font-weight: 600; font-family: inherit;
          padding: 6px 14px; border-radius: var(--radius-full);
          cursor: pointer; transition: all 0.2s;
        }
        .save-btn:hover { background: var(--gray-200); }
        .save-btn:active { transform: scale(0.95); }
        .save-btn.saved { background: var(--primary); color: var(--white); }
        .save-btn.saved:hover { background: var(--primary-hover); }
        
        .review-list { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
        .review-card {
          background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); 
          padding: 16px; display: flex; flex-direction: column; gap: 12px;
          box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .review-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .review-top { display: flex; align-items: center; gap: 12px; }
        .reviewer-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--gray-100); color: var(--gray-600); 
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-weight: 600; flex-shrink: 0;
        }
        .reviewer-name { font-weight: 600; font-size: 1rem; color: var(--gray-900); display: block; margin-bottom: 2px; }
        .review-rating { font-size: 0.75rem; display: block; }
        .review-menu { font-size: 0.95rem; color: var(--primary); font-weight: 600; background: rgba(49, 130, 246, 0.05); padding: 6px 10px; border-radius: var(--radius-md); display: inline-flex; align-items: center; margin-right: auto; }
        .review-comment { font-size: 1rem; color: var(--gray-700); margin: 0; line-height: 1.6; }
      `}</style>
    </div>
  );
}
