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
      setSaved(raw ? JSON.parse(raw).reverse() : []);
    } catch { setSaved([]); }
  }, []);

  const removeSave = (key) => {
    const updated = saved.filter((p) => p.key !== key);
    setSaved(updated);
    localStorage.setItem("zzp_saved_places", JSON.stringify([...updated].reverse()));
  };

  return (
    <div className="page">
      {/* 헤더 */}
      <div className="page-header px-card">
        <span className="header-icon">🔖</span>
        <div>
          <p className="header-label">▶ 내 저장 목록</p>
          <h1 className="header-title">저장한 맛집</h1>
        </div>
        {saved.length > 0 && <span className="count-badge">{saved.length}</span>}
      </div>

      {saved.length === 0 ? (
        <div className="empty-box px-card">
          <p className="empty-icon">📂</p>
          <p className="empty-title">저장한 맛집이 없어요</p>
          <p className="empty-desc">지도에서 맛집을 발견하면 저장 버튼을 눌러보세요!</p>
          <Link href="/map" className="goto-btn">지도 보러 가기 ▶</Link>
        </div>
      ) : (
        <div className="card-list">
          {saved.map((place) => (
            <div key={place.key} className="place-card px-card">
              <div className="card-main">
                <div className="card-left">
                  <h2 className="card-name">{place.restaurant_name}</h2>
                  <p className="card-addr">{place.address}</p>
                  <div className="tag-row">
                    <span className="tag yellow">추천 {place.count}명</span>
                    {place.reviews?.slice(0, 2).map((r, i) => (
                      <span key={i} className="tag">▸ {r.menu}</span>
                    ))}
                  </div>
                </div>
                <div className="card-right">
                  <span className="save-date">{formatDate(place.saved_at)}</span>
                  <button className="icon-btn" onClick={() => setExpanded(expanded === place.key ? null : place.key)}>
                    {expanded === place.key ? "▲" : "▼"}
                  </button>
                  <button className="icon-btn del" onClick={() => removeSave(place.key)}>✕</button>
                </div>
              </div>

              {expanded === place.key && place.reviews?.length > 0 && (
                <div className="reviews-expand">
                  <div className="expand-divider" />
                  {place.reviews.map((r, i) => (
                    <div key={i} className="mini-review">
                      <div className="mini-top">
                        <span className="mini-avatar">{(r.nickname || "?")[0]}</span>
                        <span className="mini-name">{r.nickname}</span>
                        <span className="mini-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      </div>
                      <p className="mini-menu">▸ {r.menu}</p>
                      <p className="mini-comment">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .page { padding: 16px 16px calc(var(--dock-height) + 16px); max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }

        .page-header { padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
        .header-icon { font-size: 1.8rem; }
        .header-label { font-size: 0.68rem; font-weight: 900; color: var(--gray-500); margin-bottom: 2px; }
        .header-title { font-size: 1.2rem; }
        .count-badge { margin-left: auto; background: var(--black); color: var(--white); font-family: "Black Han Sans", sans-serif; font-size: 0.9rem; padding: 4px 10px; border-radius: var(--radius-full); border: var(--border-thin); }

        .empty-box { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 20px; text-align: center; }
        .empty-icon { font-size: 3rem; }
        .empty-title { font-family: "Black Han Sans", sans-serif; font-size: 1rem; }
        .empty-desc { font-size: 0.8rem; color: var(--gray-500); line-height: 1.5; }
        .goto-btn { margin-top: 8px; padding: 10px 20px; background: var(--black); color: var(--white); border: var(--border); border-radius: var(--radius-sm); font-family: "Black Han Sans", sans-serif; font-size: 0.9rem; }

        .card-list { display: flex; flex-direction: column; gap: 10px; }

        .place-card { overflow: hidden; }
        .card-main { padding: 14px 16px; display: flex; gap: 10px; }
        .card-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .card-name { font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-addr { font-size: 0.72rem; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tag-row { display: flex; flex-wrap: wrap; gap: 5px; }
        .tag { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border: var(--border-thin); border-radius: var(--radius-full); background: var(--gray-100); }
        .tag.yellow { background: var(--yellow); }

        .card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .save-date { font-size: 0.68rem; color: var(--gray-400); }
        .icon-btn { width: 30px; height: 30px; border: var(--border-thin); border-radius: var(--radius-sm); background: var(--gray-100); font-size: 0.75rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }
        .icon-btn.del:hover { background: #fee; color: #c00; border-color: #c00; }

        .reviews-expand { background: var(--gray-50); }
        .expand-divider { height: 3px; background: var(--black); }
        .mini-review { padding: 12px 16px; border-bottom: 2px solid var(--gray-200); display: flex; flex-direction: column; gap: 5px; }
        .mini-review:last-child { border-bottom: none; }
        .mini-top { display: flex; align-items: center; gap: 8px; }
        .mini-avatar { width: 26px; height: 26px; background: var(--black); color: var(--white); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; flex-shrink: 0; font-family: "Black Han Sans", sans-serif; }
        .mini-name { font-size: 0.8rem; font-weight: 900; }
        .mini-stars { font-size: 0.7rem; color: var(--yellow2); margin-left: auto; }
        .mini-menu { font-size: 0.75rem; color: var(--gray-600); }
        .mini-comment { font-size: 0.78rem; color: var(--gray-700); font-style: italic; }
      `}</style>
    </div>
  );
}
