"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalUser, getFollowingIds } from "@/lib/userAuth";

const RATING_LABELS = { 1: "별로", 2: "그냥그래", 3: "괜찮아", 4: "맛있어", 5: "최고야!" };
const AVATAR_COLORS = ["#FFD600", "#FF6B35", "#4ECDC4", "#A8E6CF", "#FFB7B2", "#C7CEEA"];

function getAvatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const paramFriend = searchParams.get("friend");

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const overlaysRef = useRef([]);
  const allGroupsRef = useRef({});

  const [mapStatus, setMapStatus] = useState("loading");
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(paramFriend || "all");
  const [selectedPlace, setSelectedPlace] = useState(null);

  // keep stable ref so kakao callbacks can reach state setter
  const setSelectedPlaceRef = useRef(null);
  setSelectedPlaceRef.current = setSelectedPlace;

  /* ── render pins helper (sync, called after kakao loaded) ── */
  const renderPins = (map, groups, filter) => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const visible = Object.values(groups).filter((p) => {
      if (filter === "all") return true;
      return p.reviews.some((r) => r.user_id === filter);
    });

    visible.forEach((place) => {
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      const pinColor =
        place.count >= 5 ? "#FF6B35" : place.count >= 3 ? "#FFD600" : "#FFFFFF";

      const content = `
        <div onclick="window.__zzp_selectPlace('${place.key}')"
             style="cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.20));">
          <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2C11 2 3 9 3 19C3 27 9 36 16 44C17.5 46 19 49 20 51C21 49 22.5 46 24 44C31 36 37 27 37 19C37 9 29 2 20 2Z"
                  fill="${pinColor}" stroke="#1A0A00" stroke-width="1.8"/>
            <circle cx="20" cy="18" r="9" fill="white" stroke="#1A0A00" stroke-width="1.5"/>
            <text x="20" y="23" text-anchor="middle" fill="#1A0A00"
                  font-size="10" font-weight="700" font-family="Pretendard,-apple-system,sans-serif">${place.count}</text>
          </svg>
        </div>`;

      const overlay = new window.kakao.maps.CustomOverlay({
        position, content, map, yAnchor: 1.15,
      });
      overlaysRef.current.push(overlay);
    });
  };

  /* ── async data loading (called AFTER map is ready) ── */
  const loadData = async (map) => {
    try {
      const localUser = getLocalUser();
      let query = supabase.from("reviews").select("*, users(id, nickname)");

      if (localUser) {
        const followingIds = await getFollowingIds(localUser.id);
        query = query.in("user_id", [localUser.id, ...followingIds]);

        const { data: friendUsers } = await supabase
          .from("users").select("id, nickname").in("id", followingIds);
        setFriends(friendUsers || []);
      }

      const { data: reviews, error } = await query;
      if (error) { console.error("리뷰 로드 실패:", error); return; }

      // group by lat/lng key
      const groups = (reviews || []).reduce((acc, r) => {
        const key = `${r.lat}_${r.lng}`;
        if (!acc[key]) acc[key] = { ...r, key, count: 0, reviews: [] };
        acc[key].count += 1;
        acc[key].reviews.push(r);
        return acc;
      }, {});

      allGroupsRef.current = groups;

      // register global click handler for pin overlay
      window.__zzp_selectPlace = (key) =>
        setSelectedPlaceRef.current(allGroupsRef.current[key]);

      renderPins(map, groups, selectedFriend);
    } catch (err) {
      console.error("데이터 로드 오류:", err);
    }
  };

  /* ── map initialization ── */
  useEffect(() => {
    let isMounted = true;

    const startMap = () => {
      if (!window.kakao || !window.kakao.maps) return;
      window.kakao.maps.load(() => {
        if (!isMounted || mapRef.current) return;
        const container = containerRef.current;
        if (!container) return;

        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 4,
        });
        mapRef.current = map;

        // show map immediately; load data in background
        setMapStatus("success");
        loadData(map);

        // current location dot
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const loc = new window.kakao.maps.LatLng(
              pos.coords.latitude, pos.coords.longitude
            );
            map.setCenter(loc);
            new window.kakao.maps.Circle({
              center: loc, radius: 20, strokeWeight: 0,
              fillColor: "#4285F4", fillOpacity: 0.5, map,
            });
          });
        }
      });
    };

    if (window.kakao && window.kakao.maps) {
      startMap();
    }

    const handleLoad = () => startMap();
    window.addEventListener("kakao-sdk-loaded", handleLoad);

    const timeout = setTimeout(() => {
      if (isMounted && !mapRef.current) {
        startMap();
        setTimeout(() => {
          if (isMounted && !mapRef.current) setMapStatus("error");
        }, 3000);
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener("kakao-sdk-loaded", handleLoad);
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── re-render pins when filter changes ── */
  useEffect(() => {
    if (!mapRef.current || Object.keys(allGroupsRef.current).length === 0) return;
    renderPins(mapRef.current, allGroupsRef.current, selectedFriend);
  }, [selectedFriend]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFriendTab = (id) => {
    setSelectedFriend(id);
    setSelectedPlace(null);
  };

  return (
    <div className="map-wrap">
      {/* Loading */}
      {mapStatus === "loading" && (
        <div className="overlay">
          <div className="spinner" />
          <p>지도를 불러오는 중…</p>
        </div>
      )}

      {mapStatus === "error" && (
        <div className="overlay">
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          <p>지도를 불러오는 데 실패했습니다.</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      )}

      {/* Kakao map container — always in DOM so SDK can measure it */}
      <div
        ref={containerRef}
        className="kakao-map"
        style={{ visibility: mapStatus === "success" ? "visible" : "hidden" }}
      />

      {/* Friend filter tabs */}
      {mapStatus === "success" && (
        <div className="filter-wrap">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${selectedFriend === "all" ? "active" : ""}`}
              onClick={() => handleFriendTab("all")}
            >
              전체
            </button>
            {friends.map((f) => (
              <button
                key={f.id}
                className={`filter-tab ${selectedFriend === f.id ? "active" : ""}`}
                onClick={() => handleFriendTab(f.id)}
              >
                {f.nickname}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pin legend */}
      {mapStatus === "success" && (
        <div className="legend">
          <div className="legend-row"><span className="dot orange" />5+명</div>
          <div className="legend-row"><span className="dot yellow" />3+명</div>
          <div className="legend-row"><span className="dot white" />1+명</div>
        </div>
      )}

      {/* Location FAB */}
      {mapStatus === "success" && (
        <button className="fab" onClick={() => window.location.reload()}>📍</button>
      )}

      {/* Bottom slide card */}
      {selectedPlace && (
        <div className="sheet-backdrop" onClick={() => setSelectedPlace(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <button className="sheet-close" onClick={() => setSelectedPlace(null)}>✕</button>

            <div className="sheet-header">
              <h2 className="sheet-name">{selectedPlace.restaurant_name}</h2>
              {selectedPlace.address && (
                <p className="sheet-addr">📍 {selectedPlace.address}</p>
              )}
              <span className="sheet-count">추천 {selectedPlace.count}명</span>
            </div>

            <div className="review-list">
              {selectedPlace.reviews.map((r, i) => (
                <div key={i} className="review-item">
                  <div className="rev-top">
                    <div
                      className="rev-avatar"
                      style={{ background: getAvatarColor(r.users?.id || String(i)) }}
                    >
                      {(r.users?.nickname || "?")[0]}
                    </div>
                    <div>
                      <div className="rev-name">{r.users?.nickname || "알 수 없음"}</div>
                      {r.rating && (
                        <div className="rev-rating">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          {" "}<span className="rev-rating-label">{RATING_LABELS[r.rating]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {r.menu && <div className="rev-menu">{r.menu}</div>}
                  {r.comment && <p className="rev-comment">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .map-wrap {
          position: fixed;
          top: 0; left: 0; right: 0;
          bottom: var(--tab-height);
          background: #ede8e0;
        }
        .kakao-map { width: 100%; height: 100%; }

        /* Overlay (loading / error) */
        .overlay {
          position: absolute; inset: 0; z-index: 2000;
          background: rgba(255,251,245,0.93);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; font-size: 14px; color: var(--text-sub);
        }
        .overlay button {
          padding: 10px 22px;
          background: var(--primary); color: #fff;
          border-radius: var(--radius-btn);
          font-size: 14px; font-weight: 700;
          font-family: Pretendard, sans-serif;
          border: none; cursor: pointer;
        }
        .spinner {
          width: 28px; height: 28px;
          border: 3px solid var(--border-color);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Filter tabs */
        .filter-wrap {
          position: absolute;
          top: 12px; left: 12px; right: 12px;
          z-index: 1000;
        }
        .filter-tabs {
          display: flex; gap: 6px;
          overflow-x: auto; scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .filter-tabs::-webkit-scrollbar { display: none; }

        .filter-tab {
          flex-shrink: 0;
          padding: 7px 16px;
          background: rgba(255,255,255,0.95);
          color: var(--text-sub);
          border-radius: var(--radius-full);
          font-size: 13px; font-weight: 700;
          font-family: Pretendard, sans-serif;
          border: 1.5px solid var(--border-color);
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: all 0.15s;
          min-height: 34px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .filter-tab.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .filter-tab:active { transform: scale(0.95); }

        /* Legend */
        .legend {
          position: absolute;
          top: 62px; left: 12px;
          background: rgba(255,255,255,0.93);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 9px 12px;
          z-index: 1000;
          display: flex; flex-direction: column; gap: 5px;
          backdrop-filter: blur(6px);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .legend-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600; color: var(--text);
        }
        .dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 1.5px solid #1A0A00;
          flex-shrink: 0;
        }
        .dot.orange { background: #FF6B35; }
        .dot.yellow { background: #FFD600; }
        .dot.white  { background: #ffffff; }

        /* FAB */
        .fab {
          position: absolute;
          right: 14px; bottom: 20px; z-index: 1000;
          width: 44px; height: 44px;
          background: rgba(255,255,255,0.95);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(6px);
          box-shadow: var(--shadow-card);
        }
        .fab:active { transform: scale(0.92); }

        /* Bottom sheet */
        .sheet-backdrop {
          position: fixed; inset: 0; z-index: 3000;
          background: rgba(0,0,0,0.30);
          display: flex; align-items: flex-end;
        }
        .bottom-sheet {
          width: 100%; max-height: 70vh;
          background: var(--card-bg);
          border-radius: 20px 20px 0 0;
          border-top: 1.5px solid var(--border-color);
          padding: 14px 16px calc(16px + env(safe-area-inset-bottom));
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 14px;
          position: relative;
          animation: slideUp 0.22s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }

        .sheet-handle {
          width: 36px; height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          margin: 0 auto 2px;
          flex-shrink: 0;
        }
        .sheet-close {
          position: absolute; top: 14px; right: 14px;
          width: 28px; height: 28px;
          background: var(--bg); border-radius: var(--radius-full);
          font-size: 12px; font-weight: 700; color: var(--text-sub);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: none;
        }

        .sheet-header { padding-right: 36px; }
        .sheet-name { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .sheet-addr { font-size: 12px; color: var(--text-sub); margin-bottom: 8px; }
        .sheet-count {
          font-size: 12px; font-weight: 700;
          background: var(--primary-light); color: var(--primary);
          padding: 3px 10px; border-radius: var(--radius-full);
          display: inline-block;
        }

        .review-list { display: flex; flex-direction: column; gap: 10px; }
        .review-item {
          background: var(--bg); border-radius: var(--radius-md);
          padding: 12px; display: flex; flex-direction: column; gap: 7px;
        }
        .rev-top { display: flex; align-items: center; gap: 10px; }
        .rev-avatar {
          width: 34px; height: 34px; border-radius: var(--radius-full);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: var(--text); flex-shrink: 0;
        }
        .rev-name { font-size: 13px; font-weight: 700; color: var(--text); }
        .rev-rating { font-size: 12px; color: #F5A623; letter-spacing: 1px; }
        .rev-rating-label { font-size: 11px; color: var(--text-sub); font-weight: 500; letter-spacing: 0; }
        .rev-menu {
          font-size: 12px; font-weight: 700;
          background: var(--primary-light); color: var(--primary);
          padding: 3px 10px; border-radius: var(--radius-full);
          display: inline-block; width: fit-content;
        }
        .rev-comment { font-size: 13px; color: var(--text-sub); font-style: italic; margin: 0; }
      `}</style>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageInner />
    </Suspense>
  );
}
