"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getLocalUser,
  getUserByInviteCode,
  createUser,
  createMutualFollow,
  isAlreadyFollowing,
} from "@/lib/userAuth";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [inviter, setInviter] = useState(null);
  const [status, setStatus] = useState("loading");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) { setStatus("error"); return; }
    const init = async () => {
      const inviterUser = await getUserByInviteCode(code);
      if (!inviterUser) { setStatus("error"); return; }
      setInviter(inviterUser);

      const localUser = getLocalUser();
      if (!localUser) {
        setStatus("new");
      } else if (localUser.id === inviterUser.id) {
        setStatus("self");
      } else {
        const already = await isAlreadyFollowing(localUser.id, inviterUser.id);
        setStatus(already ? "already_friend" : "existing");
      }
    };
    init();
  }, [code]);

  const isValidName = /^[가-힣]{3,4}$/.test(nickname.trim());

  const handleAccept = async () => {
    setLoading(true);
    try {
      let user = getLocalUser();
      if (!user) {
        if (!isValidName) { setLoading(false); return; }
        user = await createUser(nickname.trim());
      }
      await createMutualFollow(user.id, inviter.id);
      setStatus("done");
      setTimeout(() => router.push("/"), 1500);
    } catch {
      alert("오류가 발생했습니다. 다시 시도해 주세요.");
    }
    setLoading(false);
  };

  return (
    <div className="invite-page">
      {status === "loading" && (
        <div className="card">
          <div className="spinner"></div>
          <p>초대장 확인 중...</p>
        </div>
      )}
      {status === "error" && (
        <div className="card">
          <div className="big-emoji">❌</div>
          <h2>유효하지 않은 초대장</h2>
          <p>링크가 잘못되었거나 만료되었어요.</p>
        </div>
      )}
      {status === "self" && (
        <div className="card">
          <div className="big-emoji">😅</div>
          <h2>내 초대장이에요!</h2>
          <p>이 링크를 친구에게 공유해 보세요.</p>
          <button className="primary-btn" onClick={() => router.push("/profile")}>프로필로 이동</button>
        </div>
      )}
      {status === "already_friend" && (
        <div className="card">
          <div className="big-emoji">✅</div>
          <h2>이미 친구예요!</h2>
          <p>{inviter?.nickname}님과 이미 맞팔 상태예요.</p>
          <button className="primary-btn" onClick={() => router.push("/")}>지도 보러 가기</button>
        </div>
      )}
      {(status === "new" || status === "existing") && inviter && (
        <div className="card">
          <div className="big-emoji">🎉</div>
          <h2>{inviter.nickname}님의 초대장</h2>
          <p>수락하면 서로의 맛집 지도가 공유돼요!</p>
          {status === "new" && (
            <div className="nickname-section">
              <label>본명 입력</label>
              <input
                type="text"
                placeholder="한글 3~4자 (예: 김민준)"
                value={nickname}
                maxLength={4}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAccept()}
                autoFocus
              />
              {nickname.length > 0 && !isValidName && (
                <span className="input-error">한글 3~4자만 입력 가능해요</span>
              )}
            </div>
          )}
          <button
            className="primary-btn"
            onClick={handleAccept}
            disabled={loading || (status === "new" && !isValidName)}
          >
            {loading ? "처리 중..." : "맞팔 수락하기 🤝"}
          </button>
        </div>
      )}
      {status === "done" && (
        <div className="card">
          <div className="big-emoji">🤝</div>
          <h2>맞팔 완료!</h2>
          <p>이제 {inviter?.nickname}님의 맛집이 지도에 표시돼요.</p>
        </div>
      )}

      <style jsx>{`
        .invite-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--gray-50); }
        .card { position: relative; background: white; border-radius: 24px; border: 2.5px solid var(--black); padding: 40px 32px; width: 100%; max-width: 360px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .big-emoji { font-size: 3.5rem; }
        h2 { font-size: 1.4rem; font-weight: 900; color: var(--black); margin: 0; }
        p { color: var(--gray-600); font-size: 0.95rem; margin: 0; }
        .spinner { width: 32px; height: 32px; border: 3px solid var(--gray-100); border-left-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .nickname-section { width: 100%; text-align: left; margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
        .nickname-section label { font-weight: 800; font-size: 0.85rem; color: var(--gray-600); }
        .nickname-section input { width: 100%; padding: 14px 16px; border: 2.5px solid var(--black); border-radius: 12px; font-size: 1rem; outline: none; box-sizing: border-box; font-family: inherit; }
        .input-error { font-size: 0.82rem; font-weight: 700; color: #ff3b30; }
        .primary-btn { width: 100%; padding: 16px; background: var(--primary); color: white; border: 2.5px solid var(--black); border-radius: 14px; font-size: 1.05rem; font-weight: 800; cursor: pointer; margin-top: 8px; font-family: inherit; transition: transform 0.1s; }
        .primary-btn:hover:not(:disabled) { transform: translate(-2px, -2px); }
        .primary-btn:disabled { background: var(--gray-200); cursor: not-allowed; border-color: var(--gray-300); }
      `}</style>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InviteContent />
    </Suspense>
  );
}
