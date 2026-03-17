"use client";

import { useState, useEffect } from "react";
import { getLocalUser, getFollowingUsers } from "@/lib/userAuth";

const AVATAR_COLORS = ["#FFD600", "#FF6B35", "#4ECDC4", "#A8E6CF", "#FFB7B2", "#C7CEEA", "#FFEAA7", "#DDA0DD"];

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const RATING_LABELS = { 1: "별로", 2: "그냥그래", 3: "괜찮아", 4: "맛있어", 5: "최고야!" };

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [myPlaces, setMyPlaces] = useState([]);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = getLocalUser();
    if (!localUser) { setLoading(false); return; }

    (async () => {
      const { supabase } = await import("@/lib/supabase");
      const [{ data: userData }, friendList, { data: places }] = await Promise.all([
        supabase.from("users").select("*").eq("id", localUser.id).single(),
        getFollowingUsers(localUser.id),
        supabase
          .from("reviews")
          .select("*")
          .eq("user_id", localUser.id)
          .order("created_at", { ascending: false }),
      ]);

      if (userData) {
        setUser(userData);
        const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
        setInviteLink(`${window.location.origin}${base}/invite?code=${userData.invite_code}`);
      }
      setFriends(friendList);
      setMyPlaces(places || []);
      setLoading(false);
    })();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(inviteLink);
    }
  };

  if (loading) return (
    <div className="page">
      <div className="loading">불러오는 중…</div>
    </div>
  );

  if (!user) return (
    <div className="page">
      <div className="loading">사용자 정보를 불러올 수 없어요.</div>
    </div>
  );

  return (
    <div className="page">
      {/* 프로필 헤더 */}
      <div className="profile-header">
        <div className="avatar" style={{ background: getAvatarColor(user.id) }}>
          {user.nickname[0]}
        </div>
        <div className="profile-info">
          <div className="username">{user.nickname}</div>
          <div className="stats-row">
            <span className="stat"><b>{myPlaces.length}</b> 맛집</span>
            <span className="stat-divider">·</span>
            <span className="stat"><b>{friends.length}</b> 친구</span>
          </div>
        </div>
      </div>

      {/* 초대 링크 */}
      <section className="section">
        <div className="section-label">친구 초대</div>
        <div className="invite-card card">
          <p className="invite-desc">링크를 공유하면 맞팔이 돼요!</p>
          <div className="invite-row">
            <div className="invite-link-box">
              <span className="invite-link">{inviteLink}</span>
            </div>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>
        </div>
      </section>

      {/* 내 맛집 */}
      <section className="section">
        <div className="section-label">내가 올린 맛집 ({myPlaces.length})</div>
        {myPlaces.length === 0 ? (
          <div className="empty-card card">
            <span className="empty-emoji">🍽️</span>
            <p className="empty-title">아직 등록한 맛집이 없어요</p>
            <p className="empty-sub">첫 번째 맛집을 등록해 보세요!</p>
          </div>
        ) : (
          <div className="places-list">
            {myPlaces.map((p) => (
              <div key={p.id} className="place-card card">
                <div className="place-top">
                  <div className="place-name">{p.restaurant_name}</div>
                  {p.rating && (
                    <span className="place-rating">
                      {"★".repeat(p.rating)}{"☆".repeat(5 - p.rating)}
                    </span>
                  )}
                </div>
                {p.menu && <div className="place-menu">{p.menu}</div>}
                {p.comment && <div className="place-comment">"{p.comment}"</div>}
                {p.address && <div className="place-addr">📍 {p.address}</div>}
                {p.rating && (
                  <span className="rating-badge">{RATING_LABELS[p.rating]}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 친구 목록 */}
      {friends.length > 0 && (
        <section className="section">
          <div className="section-label">친구 ({friends.length})</div>
          <div className="friends-card card">
            {friends.map((f, idx) => (
              <div key={f.id} className={`friend-row ${idx < friends.length - 1 ? "divider" : ""}`}>
                <div className="friend-avatar" style={{ background: getAvatarColor(f.id) }}>
                  {f.nickname[0]}
                </div>
                <span className="friend-name">{f.nickname}</span>
                <span className="friend-tag">친구</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <style jsx>{`
        .page {
          max-width: var(--max-width);
          margin: 0 auto;
          padding-bottom: calc(var(--tab-height) + 16px);
          min-height: 100vh;
        }
        .loading {
          text-align: center;
          padding: 60px 0;
          color: var(--text-sub);
          font-size: 14px;
        }

        /* Profile header */
        .profile-header {
          background: var(--card-bg);
          border-bottom: 1.5px solid var(--border-color);
          padding: 24px 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          flex-shrink: 0;
        }
        .username {
          font-size: 18px;
          font-weight: 900;
          color: var(--text);
          margin-bottom: 4px;
        }
        .stats-row { display: flex; align-items: center; gap: 6px; }
        .stat { font-size: 13px; color: var(--text-sub); }
        .stat b { color: var(--text); font-weight: 700; }
        .stat-divider { color: var(--text-sub); }

        /* Sections */
        .section { padding: 0 16px; margin-bottom: 24px; }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-sub);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        /* Invite */
        .invite-card { padding: 16px; }
        .invite-desc { font-size: 13px; color: var(--text-sub); margin-bottom: 10px; }
        .invite-row { display: flex; gap: 8px; }
        .invite-link-box {
          flex: 1;
          background: var(--bg);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .invite-link {
          font-size: 11px;
          color: var(--text-sub);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        .copy-btn {
          padding: 10px 16px;
          background: var(--primary);
          color: #fff;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
          transition: opacity 0.1s;
        }
        .copy-btn:active { opacity: 0.85; }

        /* My places */
        .places-list { display: flex; flex-direction: column; gap: 10px; }
        .place-card { padding: 14px; display: flex; flex-direction: column; gap: 5px; }
        .place-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .place-name { font-size: 14px; font-weight: 700; color: var(--text); flex: 1; }
        .place-rating { font-size: 12px; color: var(--yellow); letter-spacing: 1px; flex-shrink: 0; }
        .place-menu { font-size: 13px; color: var(--primary); }
        .place-comment { font-size: 12px; color: var(--text-sub); font-style: italic; }
        .place-addr { font-size: 11px; color: var(--text-sub); }
        .rating-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-sub);
          background: var(--bg);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          display: inline-block;
          width: fit-content;
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

        /* Friends */
        .friends-card { overflow: hidden; }
        .friend-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
        }
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
          color: var(--text);
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
