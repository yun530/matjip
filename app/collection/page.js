"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CollectionPage() {
  const [saved, setSaved] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zzp_saved_places");
      const arr = raw ? JSON.parse(raw) : [];
      setSaved(arr.reverse()); // 최신순
    } catch {
      setSaved([]);
    }
  }, []);

  const removeSave = (key) => {
    const updated = saved.filter((p) => p.key !== key);
    setSaved(updated);
    localStorage.setItem("zzp_saved_places", JSON.stringify([...updated].reverse()));
  };

  return (
    <div className="collection-container container">
      <header className="page-header">
        <h1>💾 저장한 맛집</h1>
        <p>나중에 가보고 싶은 맛집 모음</p>
      </header>

      {saved.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽</div>
          <p className="empty-title">아직 저장한 맛집이 없어요</p>
          <p className="empty-sub">지도에서 맛집을 발견하면 🔖 저장 버튼을 눌러보세요!</p>
          <Link href="/" className="go-map-btn">지도 보러 가기</Link>
        </div>
      ) : (
        <>
          <div className="save-count">{saved.length}개 저장됨</div>
          <div className="card-list">
            {saved.map((place) => (
              <div key={place.key} className="place-card">
                <div className="card-main">
                  <div className="card-info">
                    <h2 className="card-name">{place.restaurant_name}</h2>
                    <p className="card-address">{place.address}</p>
                    <div className="card-tags">
                      <span className="tag recommend">추천 {place.count}명</span>
                      {place.reviews?.slice(0, 2).map((r, i) => (
                        <span key={i} className="tag menu">🍴 {r.menu}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-actions">
                    <span className="saved-date">{formatDate(place.saved_at)}</span>
                    <button
                      className="toggle-btn"
                      onClick={() => setExpanded(expanded === place.key ? null : place.key)}
                    >
                      {expanded === place.key ? "▲" : "▼"}
                    </button>
                    <button className="remove-btn" onClick={() => removeSave(place.key)}>✕</button>
                  </div>
                </div>

                {expanded === place.key && place.reviews?.length > 0 && (
                  <div className="review-section">
                    <div className="review-divider" />
                    {place.reviews.map((r, i) => (
                      <div key={i} className="mini-review">
                        <div className="mini-top">
                          <div className="mini-avatar">{(r.nickname || "?")[0]}</div>
                          <div>
                            <span className="mini-name">{r.nickname}</span>
                            <span className="mini-rating">{"⭐".repeat(r.rating)}</span>
                          </div>
                        </div>
                        <div className="mini-menu">🍽 {r.menu}</div>
                        <p className="mini-comment">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .collection-container { padding-top: 24px; padding-bottom: 100px; max-width: 600px !important; }
        .page-header { margin-bottom: 24px; }
        .page-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
        .page-header p { color: var(--gray-500); font-size: 1rem; }

        .save-count { font-size: 0.95rem; font-weight: 700; color: var(--gray-600); margin-bottom: 16px; }

        .card-list { display: flex; flex-direction: column; gap: 16px; }

        .place-card { position: relative; background: var(--white); border: none; border-radius: var(--radius-xl); transition: transform 0.1s; }
        .place-card::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; z-index: 1; }
        .place-card:hover { transform: translate(-2px, -2px); }

        .card-main { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; gap: 12px; }
        .card-info { flex: 1; min-width: 0; }
        .card-name { font-size: 1.2rem; font-weight: 700; color: var(--gray-900); margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-address { font-size: 0.9rem; color: var(--gray-500); font-weight: 400; margin: 0 0 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-sm); background: var(--gray-100); color: var(--gray-700); border: 1.5px solid var(--gray-300); }
        .tag.recommend { background: rgba(49,130,246,0.08); color: var(--primary); border-color: var(--primary); }

        .card-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; flex-shrink: 0; }
        .saved-date { font-size: 0.8rem; font-weight: 500; color: var(--gray-400); }
        .actions-row { display: flex; gap: 8px; }
        .toggle-btn, .remove-btn { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--black); background: var(--gray-100); color: var(--gray-600); font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; font-family: inherit; }
        .toggle-btn:hover { background: var(--gray-200); transform: translate(-1px, -1px); }
        .remove-btn:hover { background: rgba(255,59,48,0.1); color: var(--pin-red); transform: translate(-1px, -1px); }

        .review-divider { height: 2px; background: var(--black); margin: 0; }
        .review-section { background: var(--gray-50); display: flex; flex-direction: column; gap: 12px; padding: 16px 20px; }
        .mini-review { position: relative; background: var(--white); border: none; border-radius: var(--radius-lg); padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .mini-review::before { content: ''; position: absolute; inset: 0; border: 2px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .mini-top { display: flex; align-items: center; gap: 10px; }
        .mini-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--gray-100); color: var(--gray-600); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; flex-shrink: 0; border: 2px solid var(--black); }
        .mini-name { font-weight: 700; font-size: 0.95rem; display: block; color: var(--gray-900); }
        .mini-rating { font-size: 0.75rem; }
        .mini-menu { font-size: 0.85rem; color: var(--primary); font-weight: 700; display: inline-block; background: rgba(49,130,246,0.05); padding: 4px 8px; border-radius: var(--radius-sm); margin-right: auto; border: 1.5px solid var(--primary); }
        .mini-comment { font-size: 0.95rem; color: var(--gray-700); margin: 0; line-height: 1.5; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; border: 2.5px dashed var(--black); border-radius: var(--radius-xl); background: var(--gray-50); text-align: center; }
        .empty-icon { font-size: 3rem; margin-bottom: 8px; opacity: 0.5; }
        .empty-title { font-size: 1.2rem; font-weight: 700; color: var(--gray-700); margin: 0; }
        .empty-sub { font-size: 0.95rem; font-weight: 400; color: var(--gray-500); margin: 0; line-height: 1.5; }
        .go-map-btn { position: relative; margin-top: 16px; padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: var(--radius-lg); font-size: 1rem; font-weight: 700; transition: all 0.1s; display: inline-block; }
        .go-map-btn::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .go-map-btn:hover { transform: translate(-2px, -2px); }
      `}</style>
    </div>
  );
}
