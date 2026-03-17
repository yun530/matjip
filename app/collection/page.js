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
        .collection-container {
          padding-top: 40px;
          padding-bottom: 100px;
          max-width: 600px !important;
        }
        .page-header { margin-bottom: 32px; }
        .page-header h1 { font-size: 2rem; font-weight: 900; color: var(--black); margin-bottom: 6px; }
        .page-header p { color: var(--gray-600); font-size: 1.1rem; font-weight: bold; }

        .save-count {
          font-size: 1rem; font-weight: 800; color: var(--gray-600);
          margin-bottom: 16px;
        }

        .card-list { display: flex; flex-direction: column; gap: 16px; }

        .place-card {
          background: var(--white);
          border: var(--border-width) solid var(--black);
          border-radius: var(--doodle-radius);
          box-shadow: 4px 4px 0px var(--black);
          overflow: hidden;
        }
        .card-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          gap: 12px;
        }
        .card-info { flex: 1; min-width: 0; }
        .card-name {
          font-size: 1.3rem; font-weight: 900; color: var(--black);
          margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .card-address {
          font-size: 0.95rem; color: var(--gray-600); font-weight: 600;
          margin: 0 0 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag {
          font-size: 0.85rem; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
          border: 2px solid var(--black);
        }
        .tag.recommend { background: var(--secondary); }
        .tag.menu { background: rgba(255,255,255,0.8); }

        .card-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }
        .saved-date {
          font-size: 0.85rem; font-weight: 700; color: var(--gray-400);
        }
        .toggle-btn, .remove-btn {
          width: 32px; height: 32px;
          border-radius: var(--doodle-radius);
          border: 2px solid var(--black);
          background: var(--white);
          font-size: 0.9rem; font-weight: 900;
          cursor: pointer; font-family: inherit;
          box-shadow: 2px 2px 0px var(--black);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.1s;
        }
        .toggle-btn:active, .remove-btn:active { transform: translate(2px, 2px); box-shadow: none; }
        .remove-btn { color: var(--pin-red); }

        .review-divider {
          height: 2px; background: var(--black);
          margin: 0;
        }
        .review-section {
          background: #fafafa;
          display: flex; flex-direction: column; gap: 12px;
          padding: 16px 20px;
        }
        .mini-review {
          background: var(--white);
          border: var(--border-width) solid var(--black);
          border-radius: var(--doodle-radius);
          box-shadow: 3px 3px 0px var(--black);
          padding: 12px 14px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .mini-top { display: flex; align-items: center; gap: 8px; }
        .mini-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--primary); color: white;
          border: 2px solid var(--black);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; font-weight: 900; flex-shrink: 0;
        }
        .mini-name { font-weight: 800; font-size: 0.95rem; display: block; }
        .mini-rating { font-size: 0.75rem; }
        .mini-menu { font-size: 0.95rem; color: var(--gray-800); font-weight: 600; }
        .mini-comment { font-size: 1rem; color: var(--black); margin: 0; line-height: 1.5; }

        /* 빈 상태 */
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px 20px; gap: 12px;
          border: var(--border-width) dashed var(--black);
          border-radius: var(--doodle-radius);
          background: rgba(255,255,255,0.5);
          text-align: center;
        }
        .empty-icon { font-size: 3.5rem; }
        .empty-title { font-size: 1.3rem; font-weight: 900; color: var(--black); margin: 0; }
        .empty-sub { font-size: 1rem; font-weight: 700; color: var(--gray-600); margin: 0; line-height: 1.6; }
        .go-map-btn {
          margin-top: 8px;
          padding: 12px 28px;
          background: var(--primary); color: white;
          border: var(--border-width) solid var(--black);
          border-radius: var(--doodle-radius);
          font-size: 1.1rem; font-weight: 800; font-family: inherit;
          box-shadow: 4px 4px 0px var(--black);
          transition: all 0.15s;
          cursor: pointer;
        }
        .go-map-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px var(--black); }
      `}</style>
    </div>
  );
}
