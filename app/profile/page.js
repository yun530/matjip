"use client";

import { useState, useEffect } from "react";
import { getLocalUser, getFollowingUsers } from "@/lib/userAuth";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = getLocalUser();
    if (!localUser) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", localUser.id)
        .single();

      if (data) {
        setUser(data);
        const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
        setInviteLink(`${window.location.origin}${base}/invite?code=${data.invite_code}`);
      }

      const friendList = await getFollowingUsers(localUser.id);
      setFriends(friendList);
      setLoading(false);
    };

    loadData();
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

  if (loading) {
    return (
      <div className="profile-container container">
        <p style={{ textAlign: "center", color: "var(--gray-400)", paddingTop: "80px" }}>
          로딩 중...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container container">
        <p style={{ textAlign: "center", paddingTop: "80px" }}>
          사용자 정보를 불러올 수 없어요.
        </p>
      </div>
    );
  }

  return (
    <div className="profile-container container">
      {/* 배경 이미지 */}
      <div className="bg-image" />
      <div className="vignette" />
      {/* 내 프로필 */}
      <div className="profile-card">
        <div className="avatar-circle">{user.nickname[0]}</div>
        <div>
          <h2>{user.nickname}</h2>
          <p className="friends-count">친구 {friends.length}명</p>
        </div>
      </div>

      {/* 초대 링크 */}
      <div className="section">
        <h3>친구 초대하기</h3>
        <p className="section-desc">링크를 보내면 맞팔이 돼요!</p>
        <div className="invite-box">
          <span className="invite-link">{inviteLink}</span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? "✅ 복사됨" : "복사"}
          </button>
        </div>
      </div>

      {/* 친구 목록 */}
      <div className="section">
        <h3>친구 목록</h3>
        {friends.length === 0 ? (
          <div className="empty-friends">
            <span>🫂</span>
            <p>아직 친구가 없어요.<br />초대 링크를 공유해 보세요!</p>
          </div>
        ) : (
          <div className="friends-list">
            {friends.map((friend) => (
              <div key={friend.id} className="friend-item">
                <div className="friend-avatar">{friend.nickname[0]}</div>
                <span>{friend.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .bg-image {
          position: fixed;
          inset: 0;
          background-image: url('/matjip/login_bg.jpg');
          background-size: cover;
          background-position: center;
          opacity: 0.45;
          pointer-events: none;
          z-index: -1;
        }
        .vignette {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,0.95) 100%);
          pointer-events: none;
          z-index: -1;
        }
        .profile-container { padding-top: 24px; padding-bottom: 100px; max-width: 500px !important; display: flex; flex-direction: column; gap: 20px; }

        .profile-card { position: relative; background: var(--white); border: none; border-radius: var(--radius-xl); padding: 24px; display: flex; align-items: center; gap: 20px; }
        .profile-card::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .avatar-circle { width: 70px; height: 70px; border-radius: 50%; border: 2.5px solid var(--black); background: rgba(49,130,246,0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; flex-shrink: 0; }
        .profile-card h2 { font-size: 1.4rem; margin: 0 0 6px; color: var(--gray-900); font-weight: 700; }
        .friends-count { color: var(--gray-600); font-size: 0.95rem; margin: 0; font-weight: 700; background: var(--gray-100); padding: 4px 12px; border-radius: var(--radius-full); border: 2px solid var(--black); display: inline-block; }

        .section { position: relative; background: var(--white); border: none; border-radius: var(--radius-xl); padding: 24px; }
        .section::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .section h3 { font-size: 1.2rem; font-weight: 700; color: var(--gray-900); margin: 0 0 6px; }
        .section-desc { color: var(--gray-500); font-size: 0.95rem; margin: 0 0 16px; font-weight: 400; }

        .invite-box { position: relative; display: flex; gap: 8px; align-items: center; background: var(--gray-50); border: none; border-radius: var(--radius-lg); padding: 12px 16px; }
        .invite-box::before { content: ''; position: absolute; inset: 0; border: 2px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .invite-link { flex: 1; font-size: 0.95rem; color: var(--gray-700); font-weight: 500; word-break: break-all; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .copy-btn { position: relative; background: var(--white); color: var(--gray-700); border: 2px solid var(--black); border-radius: var(--radius-md); padding: 8px 14px; font-size: 0.9rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.1s; font-family: inherit; }
        .copy-btn:hover { background: var(--gray-100); transform: translate(-1px, -1px); }

        .empty-friends { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 0; color: var(--gray-500); text-align: center; }
        .empty-friends span { font-size: 2.5rem; opacity: 0.6; margin-bottom: 8px; }
        .empty-friends p { font-size: 1rem; line-height: 1.5; margin: 0; font-weight: 400; }

        .friends-list { display: flex; flex-direction: column; gap: 12px; }
        .friend-item { position: relative; display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.05rem; color: var(--gray-900); background: var(--gray-50); padding: 12px 16px; border: none; border-radius: var(--radius-lg); transition: all 0.1s; }
        .friend-item::before { content: ''; position: absolute; inset: 0; border: 2px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .friend-item:hover { background: var(--gray-100); transform: translate(-1px, -1px); }
        .friend-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--white); border: 2px solid var(--black); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: var(--gray-600); flex-shrink: 0; }
      `}</style>
    </div>
  );
}
