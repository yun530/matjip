"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalUser, getFollowingIds } from "@/lib/userAuth";

const RATING_LABELS = { 1: "별로", 2: "그냥그래", 3: "괜찮아", 4: "맛있어", 5: "최고야!" };
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

export default function HomePage() {
  const router = useRouter();
  const [recent, setRecent] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = getLocalUser();
    setCurrentUser(user);
    if (user) loadData(user);
    else setLoading(false);
  }, []);

  const loadData = async (user) => {
    setLoading(true);
    try {
      const followingIds = await getFollowingIds(user.id);
      const visibleIds = [user.id, ...followingIds];

      const [{ data: reviews }, { data: friendUsers }] = await Promise.all([
        supabase
          .from("reviews")
          .select("*, users(nickname)")
          .in("user_id", visibleIds)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("users").select("id, nickname").in("id", followingIds),
      ]);

      setRecent((reviews || []).slice(0, 3));

      const countMap = {};
      (reviews || []).forEach((r) => {
        if (followingIds.includes(r.user_id)) {
          countMap[r.user_id] = (countMap[r.user_id] || 0) + 1;
        }
      });
      setFriends(
        (friendUsers || []).map((f) => ({ ...f, count: countMap[f.id] || 0 }))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {/* 앱 헤더 */}
      <div className="app-header">
        <span className="app-title">🗺️ 쩝쩝박사지도</span>
        {currentUser && (
          <span className="greeting">안녕하세요, {currentUser.nickname}님</span>
        )}
      </div>

      {loading ? (
        <div className="loading">불러오는 중…</div>
      ) : (
        <>
          {/* 최근 맛집 */}
          <section className="section">
            <div className="section-label">최근 추천</div>
            {recent.length === 0 ? (
              <div className="empty-card card">
                <span className="empty-emoji">📭</span>
                <p className="empty-title">아직 맛집이 없어요</p>
                <p className="empty-sub">첫 번째 맛집을 등록해 보세요!</p>
              </div>
            ) : (
              <div className="recent-list">
                {recent.map((r) => (
                  <div key={r.id} className="review-card card">
                    <div className="card-top">
                      <span className="recommender">{r.users?.nickname || "??"}</span>
                      {r.rating && (
                        <span className="rating-badge">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                      )}
                      <span className="time">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="restaurant-name">{r.restaurant_name}</div>
                    {r.menu && <div className="menu-tag">{r.menu}</div>}
                    {r.comment && <div className="comment">"{r.comment}"</div>}
                    {r.rating && (
                      <div className="rating-label">{RATING_LABELS[r.rating]}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 친구 목록 */}
          <section className="section">
            <div className="section-label">친구들</div>
            {friends.length === 0 ? (
              <div className="empty-card card">
                <span className="empty-emoji">🫂</span>
                <p className="empty-title">아직 친구가 없어요</p>
                <p className="empty-sub">프로필에서 초대 링크를 공유해 보세요!</p>
              </div>
            ) : (
              <div className="friends-list card">
                {friends.map((friend, idx) => (
                  <button
                    key={friend.id}
                    className={`friend-row ${idx < friends.length - 1 ? "divider" : ""}`}
                    onClick={() => router.push(`/map?friend=${friend.id}`)}
                  >
                    <div
                      className="friend-avatar"
                      style={{ background: getAvatarColor(friend.id) }}
                    >
                      {friend.nickname[0]}
                    </div>
                    <div className="friend-info">
                      <div className="friend-name">{friend.nickname}</div>
                      <div className="friend-count">맛집 {friend.count}곳</div>
                    </div>
                    <span className="friend-arrow">›</span>
                  </button>
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
          padding: 20px 16px 16px;
          background: var(--card-bg);
          border-bottom: 1.5px solid var(--border-color);
          margin-bottom: 20px;
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .app-title {
          font-size: 18px;
          font-weight: 900;
          color: var(--text);
        }
        .greeting {
          font-size: 12px;
          color: var(--text-sub);
        }

        .loading {
          text-align: center;
          padding: 60px 0;
          color: var(--text-sub);
          font-size: 14px;
        }

        .section {
          padding: 0 16px;
          margin-bottom: 24px;
        }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-sub);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        /* Empty state */
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

        /* Recent cards */
        .recent-list { display: flex; flex-direction: column; gap: 10px; }

        .review-card { padding: 14px; }

        .card-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .recommender {
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 2px 10px;
          border-radius: var(--radius-full);
        }
        .rating-badge {
          font-size: 11px;
          color: var(--yellow);
          letter-spacing: 1px;
        }
        .time {
          font-size: 11px;
          color: var(--text-sub);
          margin-left: auto;
        }

        .restaurant-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }
        .menu-tag {
          font-size: 13px;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .comment {
          font-size: 12px;
          color: var(--text-sub);
          font-style: italic;
          margin-bottom: 4px;
        }
        .rating-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-sub);
          background: var(--bg);
          display: inline-block;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        /* Friend list */
        .friends-list { overflow: hidden; }

        .friend-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          width: 100%;
          text-align: left;
          background: transparent;
          min-height: 44px;
          transition: background 0.1s;
          cursor: pointer;
        }
        .friend-row:active { background: var(--bg); }
        .friend-row.divider { border-bottom: 1px solid var(--border-color); }

        .friend-avatar {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          flex-shrink: 0;
        }
        .friend-info { flex: 1; }
        .friend-name { font-size: 14px; font-weight: 700; color: var(--text); }
        .friend-count { font-size: 12px; color: var(--text-sub); }
        .friend-arrow { font-size: 22px; color: var(--text-sub); }
      `}</style>
    </div>
  );
}
