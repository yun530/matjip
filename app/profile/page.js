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
        setInviteLink(`${window.location.origin}/invite/${data.invite_code}`);
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
        .profile-container {
          padding-top: 40px;
          padding-bottom: 100px;
          max-width: 500px !important;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-card {
          background: white;
          border-radius: var(--doodle-radius);
          border: var(--border-width) solid var(--black);
          box-shadow: 4px 4px 0px var(--black);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .avatar-circle {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: var(--border-width) solid var(--black);
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 2px 2px 0px var(--black);
        }
        .profile-card h2 { font-size: 1.6rem; margin: 0 0 4px; color: var(--black); font-weight: 800; }
        .friends-count { color: var(--gray-800); font-size: 1rem; margin: 0; font-weight: bold; background: var(--accent); padding: 2px 10px; border-radius: 12px; border: 2px solid var(--black); display: inline-block; }

        .section {
          background: white;
          border-radius: var(--doodle-radius);
          border: var(--border-width) solid var(--black);
          box-shadow: 4px 4px 0px var(--black);
          padding: 24px;
        }
        .section h3 {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--black);
          margin: 0 0 4px;
        }
        .section-desc { color: var(--gray-600); font-size: 1rem; margin: 0 0 16px; font-weight: bold; }

        .invite-box {
          display: flex;
          gap: 8px;
          align-items: center;
          background: var(--paper);
          border: var(--border-width) solid var(--black);
          border-radius: var(--doodle-radius);
          padding: 12px 16px;
          box-shadow: inset 2px 2px 0px rgba(0,0,0,0.1);
        }
        .invite-link {
          flex: 1;
          font-size: 0.95rem;
          color: var(--black);
          font-weight: bold;
          word-break: break-all;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .copy-btn {
          background: var(--secondary);
          color: var(--black);
          border: var(--border-width) solid var(--black);
          border-radius: 12px 255px 12px 255px/255px 12px 255px 12px;
          box-shadow: 2px 2px 0px var(--black);
          padding: 8px 14px;
          font-size: 1rem;
          font-family: inherit;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.1s;
        }
        .copy-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px; }

        .empty-friends {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 0;
          color: var(--gray-600);
          text-align: center;
          font-weight: bold;
        }
        .empty-friends span { font-size: 2.5rem; }
        .empty-friends p { font-size: 1.1rem; line-height: 1.6; margin: 0; }

        .friends-list { display: flex; flex-direction: column; gap: 16px; }
        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--black);
          background: var(--paper);
          padding: 12px 16px;
          border: var(--border-width) solid var(--black);
          border-radius: var(--doodle-radius);
          box-shadow: 2px 2px 0px var(--black);
        }
        .friend-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: var(--border-width) solid var(--black);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 900;
          color: var(--black);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
