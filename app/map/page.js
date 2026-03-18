"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getLocalUser, getFollowingIds } from "@/lib/userAuth";

const RATING_LABELS = { 1: "별로", 2: "그냥그래", 3: "괜찮아", 4: "맛있어", 5: "최고야!" };
const AVATAR_COLORS = ["#FFD600", "#FF6B35", "#4ECDC4", "#A8E6CF", "#FFB7B2", "#C7CEEA"];

function getAvatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function PlacePopup({ place, onClose }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  const handleMouseMove = (event) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  // 평균 별점
  const rated = place.reviews.filter((r) => r.rating);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null;

  // 추천메뉴 빈도 집계
  const menuCount = {};
  place.reviews.forEach((r) => {
    if (!r.menu) return;
    r.menu.split(/,\s*/).forEach((m) => {
      const t = m.trim();
      if (t) menuCount[t] = (menuCount[t] || 0) + 1;
    });
  });
  const topMenus = Object.entries(menuCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const kakaoLink = place.kakao_place_id
    ? `https://place.map.kakao.com/${place.kakao_place_id}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(place.restaurant_name)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 260, damping: 10 }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        bottom: "calc(var(--tab-height) + 32px)",
        left: 16,
        right: 16,
        background: "var(--card-bg)",
        border: "2px solid var(--text)",
        borderRadius: 20,
        padding: "14px 16px 16px",
        boxShadow: "4px 4px 0px var(--text)",
        maxHeight: "52vh",
        overflowY: "auto",
        zIndex: 3001,
        filter: "url(#sketchy-line)",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 12, right: 12,
          width: 28, height: 28,
          background: "var(--bg)", borderRadius: "50%",
          border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700, color: "var(--text-sub)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>

      {/* 음식점 이름 + 평균 별점 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 36, marginBottom: 4, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "1.3rem", fontFamily: "var(--font-title)", color: "var(--text)", margin: 0 }}>
          {place.restaurant_name}
        </h2>
        {avg && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 15, color: "#F5A623" }}>★</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      {place.address && (
        <p style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 12 }}>📍 {place.address}</p>
      )}

      {/* 추천메뉴 빈도순 */}
      {topMenus.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {topMenus.map(([menu, count]) => (
            <span key={menu} style={{
              fontSize: 12, fontWeight: 700,
              background: "var(--primary-light)", color: "var(--primary)",
              padding: "2px 10px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              {menu}
              {count > 1 && <span style={{ fontSize: 10, opacity: 0.65 }}>×{count}</span>}
            </span>
          ))}
        </div>
      )}

      {/* 리뷰어 아바타 */}
      <div style={{ marginBottom: hoveredIndex !== null ? 8 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          {place.reviews.map((r, i) => (
            <div
              key={i}
              style={{ marginRight: -12, position: "relative", zIndex: hoveredIndex === i ? 30 : i }}
              onPointerEnter={(e) => { if (e.pointerType === "mouse") setHoveredIndex(i); }}
              onPointerLeave={(e) => { if (e.pointerType === "mouse") setHoveredIndex(null); }}
              onClick={(e) => { e.stopPropagation(); setHoveredIndex((prev) => prev === i ? null : i); }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: getAvatarColor(r.users?.id || String(i)),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color: "#fff",
                  border: "2px solid var(--card-bg)",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  transform: hoveredIndex === i ? "scale(1.1)" : "scale(1)",
                }}
              >
                {(r.users?.nickname || "?").slice(-2)}
              </div>
            </div>
          ))}
          <span style={{
            marginLeft: Math.max(20, place.reviews.length * 4),
            fontSize: 13, color: "var(--text-sub)", fontWeight: 700,
          }}>
            {place.count}명 추천
          </span>
        </div>
        <AnimatePresence mode="wait">
          {hoveredIndex !== null && place.reviews[hoveredIndex] && (
            <motion.div
              key={hoveredIndex}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                display: "inline-block",
                background: "var(--text)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                marginLeft: 4,
                marginBottom: 6,
                maxWidth: "100%",
              }}
            >
              <span style={{ fontWeight: 700 }}>{place.reviews[hoveredIndex].users?.nickname}</span>
              {place.reviews[hoveredIndex].rating && (
                <span style={{ opacity: 0.8, marginLeft: 6 }}>
                  {"★".repeat(place.reviews[hoveredIndex].rating)}{"☆".repeat(5 - place.reviews[hoveredIndex].rating)}
                  {place.reviews[hoveredIndex].comment && ` · ${place.reviews[hoveredIndex].comment}`}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 카카오맵 링크 */}
      <a
        href={kakaoLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "10px",
          background: "#FAE100",
          color: "#3A1D1D",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          fontFamily: "var(--font-title)",
          textDecoration: "none",
          border: "2px solid var(--text)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, filter: 'url(#sketchy-line)' }}>
          <path d="M3 6 L9 3 L15 6 L21 3 V18 L15 21 L9 18 L3 21 V6 Z" />
        </svg>
        카카오맵에서 보기
      </a>
    </motion.div>
  );
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const paramFriend = searchParams.get("friend");
  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const overlaysRef = useRef([]);
  const allGroupsRef = useRef({});

  const [mapStatus, setMapStatus] = useState("loading");
  const [debugInfo, setDebugInfo] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(paramFriend || "all");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [myId, setMyId] = useState(null);

  const setSelectedPlaceRef = useRef(null);
  setSelectedPlaceRef.current = setSelectedPlace;

  const myIdRef = useRef(null);

  const renderPins = (map, groups, filter) => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const visible = Object.values(groups).filter((p) => {
      if (filter === "all") return true;
      if (filter === "me") return p.reviews.some((r) => r.user_id === myIdRef.current);
      return p.reviews.some((r) => r.user_id === filter);
    });

    visible.forEach((place) => {
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      
      const isBad = place.avgRating < 3;
      const isPopular = place.count >= 3;
      const markerColor = isBad ? "#FF4D4D" : (isPopular ? "#FFD600" : "#FFFFFF");
      
      let iconContent = "";
      if (isBad) {
        // Hand-drawn X Icon - Slightly Lager for visibility
        iconContent = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="1.0" stroke-linecap="round" style="filter: url(#sketchy-line) drop-shadow(1px 1px 0px rgba(0,0,0,0.1));">
            <path d="M18 6 L6 18 M6 6 L18 18" />
          </svg>`;
      } else {
        // Hand-drawn Star Icon - Slightly Larger for visibility
        iconContent = `
          <svg width="38" height="38" viewBox="0 0 24 24" fill="${markerColor}" stroke="#2F1E12" stroke-width="1.0" stroke-linejoin="round" style="filter: url(#sketchy-line) drop-shadow(1px 1.5px 0px rgba(0,0,0,0.1));">
            <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z" />
            <text x="12" y="16.5" text-anchor="middle" fill="#2F1E12" font-size="12" font-family="'Gaegu', cursive" font-weight="400">${place.count}</text>
          </svg>`;
      }

      const content = `
        <div onclick="window.__zzp_selectPlace('${place.key}')"
             style="cursor:pointer; transform: translate(${isBad ? '-16px, -16px' : '-19px, -19px'});">
          ${iconContent}
        </div>`;

      const overlay = new window.kakao.maps.CustomOverlay({
        position, content, map, yAnchor: 0.5,
      });
      overlaysRef.current.push(overlay);
    });
  };

  /* ── async data loading (called AFTER map is ready) ── */
  const loadData = async (map) => {
    try {
      const localUser = getLocalUser();
      if (localUser) {
        setMyId(localUser.id);
        myIdRef.current = localUser.id;
      }
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
        if (!acc[key]) acc[key] = { ...r, key, count: 0, reviews: [], sumRating: 0 };
        acc[key].count += 1;
        acc[key].sumRating += (r.rating || 0);
        acc[key].reviews.push(r);
        return acc;
      }, {});

      // Calculate avgRating for each group
      Object.keys(groups).forEach(key => {
        groups[key].avgRating = groups[key].sumRating / groups[key].count;
      });

      allGroupsRef.current = groups;

      // register global click handler for pin overlay
      window.__zzp_selectPlace = (key) =>
        setSelectedPlaceRef.current(allGroupsRef.current[key]);

      renderPins(map, groups, selectedFriend);

      // auto-open place from home page navigation
      if (paramLat && paramLng) {
        const pLat = parseFloat(paramLat);
        const pLng = parseFloat(paramLng);
        const target = Object.values(groups).find(
          (g) => Math.abs(g.lat - pLat) < 0.001 && Math.abs(g.lng - pLng) < 0.001
        );
        if (target) {
          map.setCenter(new window.kakao.maps.LatLng(target.lat, target.lng));
          setSelectedPlaceRef.current(target);
        }
      }
    } catch (err) {
      console.error("데이터 로드 오류:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;
    let giveUpTimeout = null;

    const initMap = () => {
      if (!isMounted || mapRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 4,
      });
      mapRef.current = map;
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      if (giveUpTimeout) { clearTimeout(giveUpTimeout); giveUpTimeout = null; }

      setMapStatus("success");
      loadData(map);

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
    };

    const tryInit = () => {
      if (!isMounted || mapRef.current) return;
      if (window.kakao && window.kakao.maps && typeof window.kakao.maps.Map === "function") {
        initMap();
      } else if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === "function") {
        window.kakao.maps.load(() => { if (isMounted) initMap(); });
      }
    };

    // Poll every 200ms until kakao is ready
    pollInterval = setInterval(tryInit, 200);
    tryInit(); // try immediately too

    // Give up after 10s
    giveUpTimeout = setTimeout(() => {
      if (isMounted && !mapRef.current) {
        const kakaoExists = !!window.kakao;
        const mapsExists = !!(window.kakao && window.kakao.maps);
        const mapFnExists = !!(window.kakao && window.kakao.maps && typeof window.kakao.maps.Map === "function");
        setDebugInfo(`kakao:${kakaoExists} maps:${mapsExists} Map():${mapFnExists} key:${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ? process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY.slice(0, 8) + "…" : "❌없음"}`);
        setMapStatus("error");
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (giveUpTimeout) clearTimeout(giveUpTimeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <p style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: 4, textAlign: "center", padding: "0 16px", wordBreak: "break-all" }}>
            {debugInfo}
          </p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      )}

      <div
        ref={containerRef}
        className="kakao-map"
        style={{ visibility: mapStatus === "success" ? "visible" : "hidden" }}
      />

      {mapStatus === "success" && (
        <div className="filter-wrap">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${selectedFriend === "all" ? "active" : ""}`}
              onClick={() => handleFriendTab("all")}
            >
              전체
            </button>
            <button
              className={`filter-tab ${selectedFriend === "me" ? "active" : ""}`}
              onClick={() => handleFriendTab("me")}
            >
              나
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

      {mapStatus === "success" && (
        <div className="legend">
          <div className="legend-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFD600" stroke="#2F1E12" strokeWidth="1.0" style={{ filter: "url(#sketchy-line)" }}>
              <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z" />
            </svg>
            <span>3명 이상</span>
          </div>
          <div className="legend-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#2F1E12" strokeWidth="1.0" style={{ filter: "url(#sketchy-line)" }}>
              <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z" />
            </svg>
            <span>1~2명 추천</span>
          </div>
          <div className="legend-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="1.0" strokeLinecap="round" style={{ filter: "url(#sketchy-line)" }}>
              <path d="M18 6 L6 18 M6 6 L18 18" />
            </svg>
            <span>별로인 곳 (3점 미만)</span>
          </div>
        </div>
      )}

      {mapStatus === "success" && (
        <button className="fab" onClick={() => window.location.reload()}>📍</button>
      )}

      {/* Popup */}
      <AnimatePresence>
        {selectedPlace && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.3)" }}
            onClick={() => setSelectedPlace(null)}
          >
            <PlacePopup
              key={selectedPlace.key}
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .map-wrap {
          position: fixed;
          top: 0; left: 0; right: 0;
          bottom: var(--tab-height);
          background: #ede8e0;
        }
        .kakao-map { width: 100%; height: 100%; }

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
          font-family: 'Gaegu', cursive;
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
          padding: 3px 10px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 8px;
          font-size: 13px; font-weight: 700;
          font-family: 'Gaegu', cursive;
          border: 1.5px solid var(--primary);
          cursor: pointer;
          transition: all 0.15s;
          min-height: 30px;
          backdrop-filter: blur(6px);
          filter: url(#sketchy-line);
        }
        .filter-tab.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .filter-tab:active { transform: scale(0.95); }

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
          filter: url(#sketchy-line);
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
