"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalUser, createUser } from "@/lib/userAuth";

// 손그림 스타일 지도 핀 SVG
const PinRed = (props) => (
  <svg {...props} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2.5 C10.2 2.2 5.5 5.8 5 10.5 C4.6 14.2 6.5 17.2 9 20 C10.8 22 12.5 24.2 14 27 C15.5 24.2 17.2 22 19 20 C21.5 17.2 23.4 14.2 23 10.5 C22.5 5.8 17.8 2.2 14 2.5 Z" fill="#ff3b30" stroke="#1a1610" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 7.5 C11.8 7.2 9.2 9 9 11.5 C8.8 13.8 10.5 15.5 13 15.8 C15.5 16 17.8 14.2 18 11.8 C18.2 9.2 16.2 7.8 14 7.5 Z" fill="white" stroke="#1a1610" stroke-width="1.5"/>
    <path d="M11 10 C12 9 14 9.5 15 10.5" stroke="#1a1610" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  </svg>
);

const PinBlue = (props) => (
  <svg {...props} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2 C10.5 1.8 5.2 5.5 5 10.2 C4.8 14 6.8 17 9.5 20 C11.2 21.8 12.8 24 14 27.2 C15.2 24 16.8 21.8 18.5 20 C21.2 17 23.2 14 23 10.2 C22.8 5.5 17.5 1.8 14 2 Z" fill="#3b82f6" stroke="#1a1610" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 7 C11.5 6.8 9 8.8 8.8 11.2 C8.6 13.5 10.5 15.5 12.8 15.8 C15.2 16 17.5 14.2 17.8 11.8 C18 9.2 16.2 7.2 14 7 Z" fill="white" stroke="#1a1610" stroke-width="1.5"/>
    <path d="M11.5 9.5 C12.5 8.8 14.5 9.2 15.5 10" stroke="#1a1610" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  </svg>
);

const PinYellow = (props) => (
  <svg {...props} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2.8 C10.8 2.5 5.5 6 5.2 10.8 C5 14.5 7 17.5 9.5 20.2 C11.2 22.2 12.8 24.5 14 27.5 C15.2 24.5 16.8 22.2 18.5 20.2 C21 17.5 23 14.5 22.8 10.8 C22.5 6 17.2 2.5 14 2.8 Z" fill="#ffcc00" stroke="#1a1610" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 8 C11.8 7.8 9.5 9.5 9.2 12 C9 14.2 10.8 16 13.2 16.2 C15.5 16.5 17.8 14.8 18 12.2 C18.2 9.8 16.2 8.2 14 8 Z" fill="white" stroke="#1a1610" stroke-width="1.5"/>
    <path d="M11.5 10.5 C12.5 9.8 14 10 15 10.8" stroke="#1a1610" stroke-width="1" stroke-linecap="round" opacity="0.35"/>
  </svg>
);

const PinGreen = (props) => (
  <svg {...props} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2.2 C10 2 5 5.8 4.8 10.5 C4.6 14 6.5 17 9.2 19.8 C11 21.8 12.8 24 14 27 C15.2 24 17 21.8 18.8 19.8 C21.5 17 23.4 14 23.2 10.5 C23 5.8 18 2 14 2.2 Z" fill="#34c759" stroke="#1a1610" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 7.2 C11.5 7 9 9 8.8 11.5 C8.6 13.8 10.5 15.8 12.8 16 C15.2 16.2 17.5 14.5 17.8 12 C18 9.5 16.2 7.5 14 7.2 Z" fill="white" stroke="#1a1610" stroke-width="1.5"/>
    <path d="M11 9.8 C12 9 14 9.5 15.2 10.2" stroke="#1a1610" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  </svg>
);

const PinOrange = (props) => (
  <svg {...props} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2.5 C10.5 2 5.2 5.8 5 10.2 C4.8 14 6.8 17.2 9.2 20 C11 22 12.5 24.2 14 27.2 C15.5 24.2 17 22 18.8 20 C21.2 17.2 23.2 14 23 10.2 C22.8 5.8 17.5 2 14 2.5 Z" fill="#ff9500" stroke="#1a1610" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 7.5 C11.8 7.2 9.2 9.2 9 11.5 C8.8 13.8 10.5 15.8 13 16 C15.5 16.2 17.8 14.5 18 12 C18.2 9.5 16.2 7.8 14 7.5 Z" fill="white" stroke="#1a1610" stroke-width="1.5"/>
    <path d="M11.2 10 C12 9.2 14.2 9.5 15.2 10.5" stroke="#1a1610" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  </svg>
);

const PinPurple = (props) => (
  <svg {...props} viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2 C10.2 1.8 5 5.5 4.8 10.2 C4.5 14 6.5 17 9 20 C10.8 22 12.5 24.5 14 27.5 C15.5 24.5 17.2 22 19 20 C21.5 17 23.5 14 23.2 10.2 C23 5.5 17.8 1.8 14 2 Z" fill="#af52de" stroke="#1a1610" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 7 C11.5 6.8 9 8.8 8.8 11.2 C8.5 13.5 10.5 15.5 12.8 15.8 C15.2 16 17.5 14.2 17.8 11.8 C18 9.2 16.5 7.2 14 7 Z" fill="white" stroke="#1a1610" stroke-width="1.5"/>
    <path d="M11 9.5 C12 8.8 14.2 9.2 15.5 10.2" stroke="#1a1610" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  </svg>
);

const floatingPins = [
  { id: 1, Icon: PinRed,    size: 40, top: "8%",  left: "8%",  delay: "0s",    duration: "4s" },
  { id: 2, Icon: PinBlue,   size: 32, top: "15%", right: "10%",delay: "0.8s",  duration: "5s" },
  { id: 3, Icon: PinYellow, size: 36, top: "70%", left: "6%",  delay: "1.5s",  duration: "4.5s" },
  { id: 4, Icon: PinGreen,  size: 28, top: "85%", right: "8%", delay: "0.3s",  duration: "6s" },
  { id: 5, Icon: PinRed,    size: 44, top: "4%",  left: "35%", delay: "2s",    duration: "3.8s" },
  { id: 6, Icon: PinPurple, size: 30, top: "4%",  right: "30%",delay: "1s",    duration: "5.2s" },
  { id: 7, Icon: PinOrange, size: 38, top: "45%", left: "4%",  delay: "0.5s",  duration: "4.8s" },
  { id: 8, Icon: PinBlue,   size: 34, top: "50%", right: "4%", delay: "1.8s",  duration: "4.2s" },
  { id: 9, Icon: PinGreen,  size: 42, top: "88%", left: "30%", delay: "2.5s",  duration: "5.5s" },
  { id: 10, Icon: PinRed,   size: 28, top: "90%", right: "28%",delay: "0.6s",  duration: "3.5s" },
  { id: 11, Icon: PinYellow,size: 36, top: "25%", left: "3%",  delay: "1.2s",  duration: "4.6s" },
  { id: 12, Icon: PinPurple,size: 32, top: "60%", right: "6%", delay: "2.2s",  duration: "5.8s" },
  { id: 13, Icon: PinOrange,size: 26, top: "35%", right: "15%",delay: "0.9s",  duration: "4.1s" },
  { id: 14, Icon: PinBlue,  size: 40, top: "75%", left: "20%", delay: "1.7s",  duration: "5.3s" },
  { id: 15, Icon: PinRed,   size: 30, top: "18%", left: "20%", delay: "3s",    duration: "6.2s" },
  { id: 16, Icon: PinGreen, size: 34, top: "55%", left: "15%", delay: "0.4s",  duration: "4.4s" },
];

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

  const isValidName = /^[가-힣]{3,4}$/.test(nickname.trim());

  const handleSubmit = async () => {
    if (!isValidName) return;
    setLoading(true);
    try {
      await createUser(nickname.trim());
      router.replace("/");
    } catch {
      alert("이름 설정에 실패했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="auth-page">
      {/* 배경 이미지 레이어 */}
      <div className="bg-image" />
      {/* 비네팅 레이어 */}
      <div className="vignette" />
      {/* 플로팅 핀들 */}
      {floatingPins.map(({ id, Icon, size, top, left, right, bottom, delay, duration }) => (
        <div
          key={id}
          className="floating-pin"
          style={{
            top, left, right, bottom,
            animationDelay: delay,
            animationDuration: duration,
          }}
        >
          <Icon width={size} height={size} />
        </div>
      ))}

      {/* 로그인 카드 */}
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
          <label>본명 입력</label>
          <input
            type="text"
            placeholder="한글 3~4자 (예: 김민준)"
            value={nickname}
            maxLength={4}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {nickname.length > 0 && !isValidName && (
            <span className="input-error">한글 3~4자만 입력 가능해요</span>
          )}
          <span className="char-count">{nickname.length}/4</span>
        </div>

        <button
          className="start-btn"
          onClick={handleSubmit}
          disabled={loading || !isValidName}
        >
          {loading ? "설정 중..." : "시작하기 🚀"}
        </button>
      </div>

      <style jsx>{`
        .auth-page {
          position: fixed;
          inset: 0;
          background-color: #cfd4d8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 9999;
          overflow: hidden;
        }

        .bg-image {
          position: absolute;
          inset: 0;
          background-image: url('/login_bg.jpg');
          background-size: cover;
          background-position: center;
          opacity: 0.45;
          pointer-events: none;
        }

        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,0.95) 100%);
          pointer-events: none;
        }

        .floating-pin {
          position: absolute;
          animation: floatPin linear infinite;
          pointer-events: none;
        }

        @keyframes floatPin {
          0%   { transform: translateY(0px) rotate(-5deg); }
          25%  { transform: translateY(-12px) rotate(8deg); }
          50%  { transform: translateY(-6px) rotate(-8deg); }
          75%  { transform: translateY(-14px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(-5deg); }
        }

        .card {
          background: white;
          border-radius: 20px;
          border: 4px solid var(--black);
          padding: 40px 32px;
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: relative;
          z-index: 1;
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
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--black);
          margin: 0;
          letter-spacing: -0.05em;
        }
        .logo-area p {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--gray-700);
          margin: 0;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: white;
          border-radius: 12px;
          border: 3px solid var(--black);
          padding: 16px 20px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1rem;
          color: var(--black);
          font-weight: 800;
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-section label {
          font-weight: 900;
          font-size: 1.1rem;
          color: var(--black);
        }
        .input-section input {
          width: 100%;
          padding: 14px 16px;
          border: 3px solid var(--black);
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 800;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.1s;
        }
        .input-section input:focus {
          border-color: var(--primary);
        }
        .input-error {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ff3b30;
        }
        .char-count {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--gray-600);
          text-align: right;
        }

        .start-btn {
          width: 100%;
          padding: 16px;
          background: var(--primary);
          color: white;
          border: 4px solid var(--black);
          border-radius: 14px;
          font-size: 1.2rem;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.1s;
          font-family: inherit;
        }
        .start-btn:hover:not(:disabled) {
          transform: translate(-2px, -2px);
        }
        .start-btn:active:not(:disabled) {
          transform: translate(2px, 2px);
        }
        .start-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          color: #666;
        }
      `}</style>
    </div>
  );
}
