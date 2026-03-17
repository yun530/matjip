"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalUser } from "@/lib/userAuth";

const ratingGuides = {
  5: "최고야! 꼭 가봐 🙏",
  4: "또 갈 의향 있음",
  3: "낫배드, 한 번쯤",
  2: "흠… 그냥 그럼",
  1: "별로였어",
};

export default function PostPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [rating, setRating] = useState(5);
  const [menu, setMenu] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const searchPlaces = () => {
    if (!keyword.trim()) return;
    if (!window.kakao?.maps?.services) {
      alert("지도 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setIsSearching(true);
    new window.kakao.maps.services.Places().keywordSearch(keyword, (data, status) => {
      setIsSearching(false);
      if (status === window.kakao.maps.services.Status.OK) setSearchResults(data);
      else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert("검색 결과가 없습니다.");
        setSearchResults([]);
      } else {
        alert("검색 중 오류가 발생했습니다.");
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedPlace || !menu || !comment) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert([{
        restaurant_name: selectedPlace.place_name,
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        lat: parseFloat(selectedPlace.y),
        lng: parseFloat(selectedPlace.x),
        rating,
        menu,
        comment,
        user_id: getLocalUser()?.id || null,
      }]);
      if (error) throw error;
      router.replace("/");
    } catch {
      alert("맛집 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      {/* 헤더 */}
      <div className="page-header">
        <div className="step-info">
          <span className="step-num">STEP {step}/2</span>
          <h1 className="step-title">{step === 1 ? "식당 검색" : "후기 작성"}</h1>
        </div>
        <div className="step-bar">
          <div className={`step-seg ${step >= 1 ? "filled" : ""}`} />
          <div className={`step-seg ${step >= 2 ? "filled" : ""}`} />
        </div>
      </div>

      {step === 1 ? (
        /* ── STEP 1: 식당 검색 ── */
        <div className="content">
          <div className="search-row">
            <input
              className="px-input"
              type="text"
              placeholder="식당 이름 검색 (예: 우래옥)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
              style={{ flex: 1 }}
            />
            <button className="search-btn" onClick={searchPlaces} disabled={isSearching}>
              {isSearching ? "…" : "검색"}
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="no-result">
              <span>🔍</span>
              <p>검색 결과가 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="results">
              {searchResults.map((place) => (
                <div
                  key={place.id}
                  className={`result-item card ${selectedPlace?.id === place.id ? "selected" : ""}`}
                  onClick={() => setSelectedPlace(place)}
                >
                  <div className="result-info">
                    <span className="result-name">{place.place_name}</span>
                    <span className="result-addr">
                      {place.road_address_name || place.address_name}
                    </span>
                  </div>
                  {selectedPlace?.id === place.id && (
                    <span className="check">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            className="next-btn"
            onClick={() => {
              if (!selectedPlace) { alert("식당을 선택해 주세요!"); return; }
              setStep(2);
            }}
            disabled={!selectedPlace}
          >
            다음 →
          </button>
        </div>
      ) : (
        /* ── STEP 2: 후기 작성 ── */
        <div className="content">
          {/* 선택된 식당 */}
          <div className="selected-box card">
            <div className="selected-top">
              <span className="selected-tag">선택된 식당</span>
              <button className="change-btn" onClick={() => setStep(1)}>변경</button>
            </div>
            <div className="selected-name">{selectedPlace.place_name}</div>
            <div className="selected-addr">
              {selectedPlace.road_address_name || selectedPlace.address_name}
            </div>
          </div>

          {/* 별점 */}
          <div className="form-group">
            <label className="form-label">별점</label>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star-btn ${rating >= n ? "on" : ""}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
              <span className="rating-guide">{ratingGuides[rating]}</span>
            </div>
          </div>

          {/* 추천 메뉴 */}
          <div className="form-group">
            <label className="form-label" htmlFor="menu">추천 메뉴</label>
            <input
              id="menu"
              className="px-input"
              type="text"
              placeholder="예: 곱창전골 강추!"
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
            />
          </div>

          {/* 한마디 */}
          <div className="form-group">
            <label className="form-label" htmlFor="comment">
              한마디 <span className="char-hint">({comment.length}/100)</span>
            </label>
            <textarea
              id="comment"
              className="px-input"
              placeholder="어땠는지 솔직하게 써줘!"
              value={comment}
              maxLength={100}
              onChange={(e) => setComment(e.target.value)}
              style={{ height: "96px", resize: "none" }}
            />
          </div>

          <button
            className="next-btn"
            onClick={handleSubmit}
            disabled={!menu || !comment || submitting}
          >
            {submitting ? "등록 중…" : "맛집 등록 완료 ✓"}
          </button>
        </div>
      )}

      <style jsx>{`
        .page {
          max-width: var(--max-width);
          margin: 0 auto;
          padding-bottom: calc(var(--tab-height) + 16px);
          min-height: 100vh;
        }

        /* Header */
        .page-header {
          background: var(--card-bg);
          border-bottom: 1.5px solid var(--border-color);
          padding: 20px 16px 16px;
          margin-bottom: 16px;
        }
        .step-info { margin-bottom: 12px; }
        .step-num {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-sub);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .step-title {
          font-size: 18px;
          font-weight: 900;
          color: var(--text);
          margin-top: 2px;
        }
        .step-bar { display: flex; gap: 6px; }
        .step-seg {
          flex: 1;
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          transition: background 0.25s;
        }
        .step-seg.filled { background: var(--primary); }

        /* Content */
        .content {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Search */
        .search-row { display: flex; gap: 8px; }
        .search-btn {
          padding: 12px 18px;
          background: var(--primary);
          color: #fff;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.1s;
        }
        .search-btn:disabled { background: var(--gray-300); cursor: not-allowed; }

        .no-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 48px 0;
          color: var(--text-sub);
          font-size: 13px;
        }
        .no-result span { font-size: 2rem; }

        .results { display: flex; flex-direction: column; gap: 8px; }
        .result-item {
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.1s;
        }
        .result-item:active { background: var(--bg); }
        .result-item.selected { background: var(--primary-light); }
        .result-info { display: flex; flex-direction: column; gap: 3px; }
        .result-name { font-size: 14px; font-weight: 700; color: var(--text); }
        .result-addr { font-size: 12px; color: var(--text-sub); }
        .check { font-size: 18px; font-weight: 900; color: var(--primary); }

        /* Selected */
        .selected-box { padding: 14px; }
        .selected-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .selected-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-sub);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .change-btn {
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          border-radius: var(--radius-full);
          padding: 3px 10px;
          cursor: pointer;
          font-family: inherit;
        }
        .selected-name { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .selected-addr { font-size: 12px; color: var(--text-sub); }

        /* Form */
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-label { font-size: 13px; font-weight: 700; color: var(--text); }
        .char-hint { font-weight: 400; color: var(--text-sub); }

        /* Stars */
        .star-row { display: flex; align-items: center; gap: 4px; }
        .star-btn {
          font-size: 2rem;
          color: var(--border-color);
          padding: 0;
          line-height: 1;
          cursor: pointer;
          background: none;
          border: none;
          transition: color 0.1s, transform 0.1s;
        }
        .star-btn.on { color: var(--yellow); }
        .star-btn:active { transform: scale(0.88); }
        .rating-guide {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-sub);
          margin-left: 6px;
        }

        /* CTA */
        .next-btn {
          width: 100%;
          padding: 15px;
          background: var(--primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-btn);
          font-size: 15px;
          font-weight: 700;
          font-family: Pretendard, -apple-system, BlinkMacSystemFont, sans-serif;
          cursor: pointer;
          margin-top: 4px;
          transition: opacity 0.1s;
        }
        .next-btn:hover:not(:disabled) { opacity: 0.9; }
        .next-btn:active:not(:disabled) { transform: scale(0.98); }
        .next-btn:disabled {
          background: var(--gray-300);
          color: var(--gray-500);
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
}
