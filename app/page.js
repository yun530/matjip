"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalUser, getFollowingIds } from "@/lib/userAuth";
import Logo from "./components/Logo";

const AVATAR_COLORS = ["#FFD600", "#FF6B35", "#4ECDC4", "#A8E6CF", "#FFB7B2", "#C7CEEA", "#FFEAA7", "#DDA0DD"];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeNearby(allReviews, userLoc) {
  const groups = {};
  allReviews.forEach((r) => {
    const key = `${r.lat}_${r.lng}`;
    if (!groups[key]) groups[key] = { ...r, key, reviews: [], sumRating: 0, ratedCount: 0 };
    groups[key].reviews.push(r);
    if (r.rating) { groups[key].sumRating += r.rating; groups[key].ratedCount += 1; }
  });

  return Object.values(groups)
    .map((g) => ({
      ...g,
      avg: g.ratedCount ? g.sumRating / g.ratedCount : 0,
      dist: getDistance(userLoc.lat, userLoc.lng, g.lat, g.lng),
    }))
    .filter((g) => g.dist <= 500 && g.avg >= 3)
    .sort((a, b) => a.dist - b.dist);
}

export default function HomePage() {
  const router = useRouter();
  const [recent, setRecent] = useState([]);
  const [friends, setFriends] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | done | denied
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getLocalUser();
    if (user) loadData(user);
    else setLoading(false);
  }, []);

  const loadData = async (user) => {
    setLoading(true);
    try {
      const followingIds = await getFollowingIds(user.id);
      const visibleIds = [user.id, ...followingIds];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: reviews }, { data: recentReviews }, { data: friendUsers }] = await Promise.all([
        supabase.from("reviews").select("*, users(nickname)").in("user_id", visibleIds).order("created_at", { ascending: false }).limit(100),
        supabase.from("reviews").select("*, users(nickname)").in("user_id", visibleIds).gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }).limit(5),
        supabase.from("users").select("id, nickname").in("id", followingIds),
      ]);

      setRecent(recentReviews || []);
      setAllReviews(reviews || []);
      setFriends(friendUsers || []);
    } finally {
      setLoading(false);
    }

    // 위치 요청
    if (navigator.geolocation) {
      setLocStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocStatus("done");
          setAllReviews((prev) => {
            setNearbyPlaces(computeNearby(prev, loc));
            return prev;
          });
        },
        () => setLocStatus("denied"),
        { timeout: 8000 }
      );
    }
  };

  // allReviews 바뀌어도 위치 있으면 재계산
  useEffect(() => {
    if (locStatus === "done" && allReviews.length > 0) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setNearbyPlaces(computeNearby(allReviews, { lat: pos.coords.latitude, lng: pos.coords.longitude }));
      });
    }
  }, [allReviews]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page">
      <div className="app-header">
        <Logo size={38} />
        <span className="app-title">쩝쩝박사지도</span>
      </div>

      {loading ? (
        <div className="loading">불러오는 중…</div>
      ) : (
        <>
          {/* 근처 맛집 */}
          <section className="section">
            <div className="section-label">근처 맛집</div>
            {locStatus === "idle" || locStatus === "loading" ? (
              <div className="empty-card card">
                <p className="empty-sub">위치를 확인하는 중…</p>
              </div>
            ) : locStatus === "denied" ? (
              <div className="empty-card card">
                <span className="empty-emoji">📍</span>
                <p className="empty-title">위치 권한이 필요해요</p>
                <p className="empty-sub">설정에서 위치 접근을 허용해 주세요</p>
              </div>
            ) : nearbyPlaces.length === 0 ? (
              <div className="empty-card card">
                <span className="empty-emoji">🗺️</span>
                <p className="empty-title">500m 이내 맛집이 없어요</p>
                <p className="empty-sub">친구들이 아직 근처 맛집을 등록하지 않았어요</p>
              </div>
            ) : (
              <div className="nearby-list">
                {nearbyPlaces.map((p) => (
                  <div key={p.key} className="nearby-card card" onClick={() => router.push(`/map?lat=${p.lat}&lng=${p.lng}`)} style={{ cursor: "pointer" }}>
                    <div className="nearby-top">
                      <span className="nearby-name">{p.restaurant_name}</span>
                      <span className="nearby-dist">{Math.round(p.dist)}m</span>
                    </div>
                    <div className="nearby-meta">
                      <span className="nearby-rating">{"★".repeat(Math.round(p.avg))}{"☆".repeat(5 - Math.round(p.avg))}</span>
                      <span className="nearby-avg">{p.avg.toFixed(1)}</span>
                      <span className="nearby-count">{p.reviews.length}명 추천</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 최신 맛집 */}
          <section className="section">
            <div className="section-label">최신 맛집</div>
            {recent.length === 0 ? (
              <div className="empty-card card">
                <span className="empty-emoji">📭</span>
                <p className="empty-title">아직 맛집이 없어요</p>
                <p className="empty-sub">첫 번째 맛집을 등록해 보세요!</p>
              </div>
            ) : (
              <div className="recent-list">
                {recent.map((r) => (
                  <div key={r.id} className="review-card card" onClick={() => router.push(`/map?lat=${r.lat}&lng=${r.lng}`)} style={{ cursor: "pointer" }}>
                    <div className="card-top">
                      <span className="recommender">{r.users?.nickname || "??"}</span>
                      {r.rating && <span className="rating-badge">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>}
                      <span className="time">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="restaurant-name">{r.restaurant_name}</div>
                    {r.comment && <div className="comment">"{r.comment}"</div>}
                    {r.menu && <div className="menu-tag">{r.menu}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 친구 목록 */}
          <section className="section">
            <div className="section-label">쩝쩝박사</div>
            {friends.length === 0 ? (
              <div className="empty-card card">
                <span className="empty-emoji">🫂</span>
                <p className="empty-title">아직 친구가 없어요</p>
                <p className="empty-sub">프로필에서 초대 링크를 공유해 보세요!</p>
              </div>
            ) : (
              <div className="friends-card card">
                {friends.map((f, idx) => (
                  <div
                    key={f.id}
                    className={`friend-row ${idx < friends.length - 1 ? "divider" : ""}`}
                    onClick={() => router.push(`/map?friend=${f.id}`)}
                  >
                    <div className="friend-avatar" style={{ background: getAvatarColor(f.id) }}>
                      {f.nickname.slice(-2)}
                    </div>
                    <span className="friend-name">{f.nickname}</span>
                    <span className="friend-tag">친구</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <style jsx>{`
        .page {
          max-width: var(--max-width);
          margin: 0 auto;
          padding-bottom: calc(var(--tab-height) + 16px);
          min-height: 100vh;
        }
        .app-header {
          padding: 24px 16px 16px;
          background: transparent;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .app-title {
          font-size: 1.9rem;
          font-family: var(--font-title);
          color: var(--text);
          font-weight: 800;
          white-space: nowrap;
          line-height: 1;
        }
        .loading {
          text-align: center;
          padding: 60px 0;
          color: var(--text-sub);
          font-size: 14px;
        }
        .section { padding: 0 16px; margin-bottom: 24px; }
        .section-label {
          font-size: 1.1rem;
          font-family: var(--font-title);
          color: #ffffff;
          font-weight: 700;
          margin-bottom: 16px;
          white-space: nowrap;
          display: inline-block;
          padding: 2px 10px;
          border: 2px solid var(--text);
          background: var(--text);
          filter: url(#sketchy-line);
          position: relative;
        }
        .section-label::after {
          content: '';
          position: absolute;
          bottom: -9px;
          left: 12px;
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--text);
        }

        /* Empty */
        .empty-card {
          padding: 36px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .empty-emoji { font-size: 2.5rem; }
        .empty-title { font-size: 14px; font-weight: 700; color: var(--text); }
        .empty-sub { font-size: 12px; color: var(--text-sub); }

        /* Nearby */
        .nearby-list { display: flex; flex-direction: column; gap: 10px; }
        .nearby-card { padding: 14px 18px; }
        .nearby-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .nearby-name { font-size: 1.1rem; font-family: var(--font-title); color: var(--text); }
        .nearby-dist { font-size: 11px; color: var(--text-sub); font-weight: 700; }
        .nearby-meta { display: flex; align-items: center; gap: 8px; }
        .nearby-rating { font-size: 16px; color: var(--yellow); letter-spacing: 1px; }
        .nearby-avg { font-size: 13px; font-weight: 700; color: var(--text); }
        .nearby-count { font-size: 12px; color: var(--text-sub); }

        /* Recent cards */
        .recent-list { display: flex; flex-direction: column; gap: 10px; }
        .review-card { padding: 14px 22px; }
        .card-top {
          display: flex;
          align-items: center;
          gap: 17px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .recommender {
          font-size: 1.1rem;
          font-family: var(--font-title);
          color: var(--white);
          background: var(--primary);
          padding: 2px 12px;
          border-radius: var(--radius-btn);
          transform: rotate(-1deg);
        }
        .rating-badge { font-size: 22px; color: var(--yellow); letter-spacing: 2px; }
        .time { font-size: 11px; color: var(--text-sub); margin-left: auto; }
        .restaurant-name { font-size: 1.2rem; font-family: var(--font-title); color: var(--text); margin-bottom: 2px; }
        .menu-tag {
          font-size: 13px;
          color: var(--primary);
          background: var(--primary-light);
          border: 1.5px solid var(--primary);
          border-radius: 8px;
          padding: 3px 7px;
          display: inline-block;
          margin-bottom: 6px;
        }
        .comment { font-size: 12px; color: var(--text-sub); font-style: italic; margin-bottom: 10px; line-height: 1.2; }

        /* Friends */
        .friends-card { overflow: hidden; }
        .friend-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          cursor: pointer;
        }
        .friend-row:active { background: var(--bg); }
        .friend-row.divider { border-bottom: 1px solid var(--border-color); }
        .friend-avatar {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
        }
        .friend-name { flex: 1; font-size: 14px; font-weight: 700; color: var(--text); }
        .friend-tag {
          font-size: 11px;
          font-weight: 700;
          background: var(--primary-light);
          color: var(--primary);
          padding: 2px 10px;
          border-radius: var(--radius-full);
        }
      `}</style>
    </div>
  );
}
