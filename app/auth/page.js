"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalUser, createUser } from "@/lib/userAuth";

export default function AuthPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = getLocalUser();
    if (user) {
      router.replace("/");
    } else {
      setChecking(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    try {
      await createUser(nickname.trim());
      router.replace("/");
    } catch {
      alert("닉네임 설정에 실패했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="auth-page">
      <div className="card">
        <div className="logo-area">
          <span className="logo-emoji">🗺️</span>
          <h1>쩝쩝박사지도</h1>
          <p>광고 없는, 친구들의 진짜 맛집 지도</p>
        </div>

        <div className="features">
          <div className="feature-item">
            <span>🔴</span>
            <span>5명 이상 추천한 검증 맛집</span>
          </div>
          <div className="feature-item">
            <span>🤝</span>
            <span>초대한 친구들끼리만 공유</span>
          </div>
          <div className="feature-item">
            <span>✍️</span>
            <span>솔직한 한 줄 평 & 추천 메뉴</span>
          </div>
        </div>

        <div className="input-section">
          <label>닉네임 정하기</label>
          <input
            type="text"
            placeholder="친구들에게 보일 이름 (예: 쩝쩝박사)"
            value={nickname}
            maxLength={12}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <span className="char-count">{nickname.length}/12</span>
        </div>

        <button
          className="start-btn"
          onClick={handleSubmit}
          disabled={loading || !nickname.trim()}
        >
          {loading ? "설정 중..." : "시작하기 🚀"}
        </button>
      </div>

      <style jsx>{`
        .auth-page {
          position: fixed;
          inset: 0;
          background: var(--gray-50);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 9999;
        }

        .card {
          background: white;
          border-radius: 28px;
          padding: 40px 32px;
          width: 100%;
          max-width: 380px;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .logo-area {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .logo-emoji {
          font-size: 3.5rem;
          line-height: 1;
        }
        .logo-area h1 {
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--primary);
          margin: 0;
        }
        .logo-area p {
          font-size: 0.9rem;
          color: var(--gray-600);
          margin: 0;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--gray-50);
          border-radius: 16px;
          padding: 16px 20px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: var(--gray-800);
          font-weight: 600;
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-section label {
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--black);
        }
        .input-section input {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid var(--gray-200);
          border-radius: 12px;
          font-size: 1rem;
          outline-color: var(--primary);
          font-family: inherit;
        }
        .char-count {
          font-size: 0.75rem;
          color: var(--gray-400);
          text-align: right;
        }

        .start-btn {
          width: 100%;
          padding: 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s;
        }
        .start-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }
        .start-btn:disabled {
          background: var(--gray-200);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
