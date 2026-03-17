"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLocalUser, createUser, getUserByInviteCode, createMutualFollow } from "@/lib/userAuth";
import Logo from "../components/Logo";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const inviteCode = searchParams.get("code");

  useEffect(() => {
    if (getLocalUser()) router.replace("/");
    else setChecking(false);
  }, []);

  const isValid = /^[가-힣]{2,5}$/.test(name.trim());

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const user = await createUser(name.trim());
      if (inviteCode) {
        const inviter = await getUserByInviteCode(inviteCode);
        if (inviter && inviter.id !== user.id) {
          await createMutualFollow(user.id, inviter.id);
        }
      }
      router.replace("/");
    } catch {
      alert("이름 설정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="wrap">
      <div className="card-box">
        <Logo size={120} />
        <h1 className="title">쩝쩝박사지도</h1>
        <p className="subtitle">아는 사람 추천만 믿는 맛집 지도</p>

        <div className="features">
          <div className="feat">
            <span className="feat-dot" />
            초대 링크로 들어온 친구들끼리만 공유
          </div>
          <div className="feat">
            <span className="feat-dot" />
            솔직한 한 줄 평 &amp; 추천 메뉴
          </div>
          <div className="feat">
            <span className="feat-dot" />
            지도에서 한눈에 확인
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">이름 (닉네임)</label>
          <input
            className="name-input"
            type="text"
            placeholder="예: 김민준"
            value={name}
            maxLength={5}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {name.length > 0 && !isValid && (
            <span className="input-error">한글 2~5자로 입력해 주세요</span>
          )}
        </div>

        <button className="start-btn" onClick={handleSubmit} disabled={loading || !isValid}>
          {loading ? "처리 중…" : "시작하기 →"}
        </button>
      </div>

      <style jsx>{`
        .wrap {
          position: fixed;
          inset: 0;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .card-box {
          width: 100%;
          max-width: 360px;
          background: var(--card-bg);
          border-radius: 20px;
          box-shadow: var(--shadow-float);
          padding: 36px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          text-align: center;
        }
        .logo { font-size: 3rem; line-height: 1; }
        .title {
          font-size: 22px;
          font-weight: 900;
          color: var(--text);
          margin-top: -6px;
        }
        .subtitle {
          font-size: 13px;
          color: var(--text-sub);
          margin-top: -10px;
        }
        .features {
          background: var(--bg);
          border-radius: 12px;
          padding: 14px 16px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 9px;
          text-align: left;
        }
        .feat {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .feat-dot {
          width: 7px;
          height: 7px;
          background: var(--primary);
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }
        .input-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }
        .input-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }
        .name-input {
          width: 100%;
          padding: 13px 14px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          font-size: 15px;
          font-family: 'Gaegu', cursive;
          color: var(--text);
          outline: none;
          background: var(--bg);
          transition: border-color 0.15s;
        }
        .name-input:focus { border-color: var(--primary); }
        .input-error { font-size: 12px; color: #e00; }
        .start-btn {
          width: 100%;
          padding: 14px;
          background: var(--primary);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Gaegu', cursive;
          cursor: pointer;
          transition: opacity 0.1s;
        }
        .start-btn:hover:not(:disabled) { opacity: 0.9; }
        .start-btn:active:not(:disabled) { transform: scale(0.98); }
        .start-btn:disabled {
          background: var(--gray-300);
          color: var(--gray-500);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}
