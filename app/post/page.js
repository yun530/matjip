"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalUser } from "@/lib/userAuth";
import Logo from "../components/Logo";

const ratingGuides = {
  5: "꼭 가줘 애드라...",
  4: "또 갈 의향 있음",
  3: "낫배드. 평타이상",
  2: "흠… 그냥 그럼",
  1: "...가지마",
};

function parseMenuTags(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 3);
}

export default function PostPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [rating, setRating] = useState(5);
  const [menuInput, setMenuInput] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const menuTags = parseMenuTags(menuInput);
  const menuOverLimit = menuInput.includes(",") && menuTags.length >= 3 &&
    menuInput.endsWith(",") === false &&
    parseMenuTags(menuInput + ",").length > 3;

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
    const menuRequired = rating >= 3;
    if (!selectedPlace || (menuRequired && menuTags.length === 0) || !comment) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert([{
        restaurant_name: selectedPlace.place_name,
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        lat: parseFloat(selectedPlace.y),
        lng: parseFloat(selectedPlace.x),
        rating,
        menu: menuTags.join(", "),
        comment,
        user_id: getLocalUser()?.id || null,
        kakao_place_id: selectedPlace.id || null,
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
      <div className="app-header">
        <Logo size={32} />
        <span className="app-title">쩝쩝박사지도</span>
      </div>

      <div className="step-bar-wrap">
        <div className="step-bar">
          <div className={`step-seg ${step >= 1 ? "filled" : ""}`} />
          <div className={`step-seg ${step >= 2 ? "filled" : ""}`} />
        </div>
        <span className="step-num">STEP {step} / 2</span>
      </div>

      {step === 1 ? (
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
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'url(#sketchy-line)' }}>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21 L16.65 16.65" />
              </svg>
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
            <div className="star-inline-row">
              <div className="section-label no-tail">별점</div>
              <div className="stars-group">
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
              </div>
              <span className="rating-guide">{ratingGuides[rating]}</span>
            </div>
          </div>

          {/* 추천 메뉴 */}
          <div className="form-group">
            <div className="section-label">추천메뉴</div>
            <input
              className="px-input"
              type="text"
              placeholder="예: 삼겹살, 된장찌개 (쉼표로 구분, 최대 3개)"
              value={menuInput}
              onChange={(e) => {
                const tags = parseMenuTags(e.target.value + ",");
                if (tags.length <= 3) setMenuInput(e.target.value);
              }}
            />
            {menuTags.length > 0 && (
              <div className="menu-tags-preview">
                {menuTags.map((tag, i) => (
                  <span key={i} className="menu-tag">{tag}</span>
                ))}
              </div>
            )}
            <span className="tag-count">{menuTags.length} / 3</span>
          </div>

          {/* 한마디 */}
          <div className="form-group">
            <div className="section-label">한마디</div>
            <textarea
              className="px-input"
              placeholder={`어땠는지 솔직하게 써줘! (${comment.length}/100)`}
              value={comment}
              maxLength={100}
              onChange={(e) => setComment(e.target.value)}
              style={{ height: "96px", resize: "none" }}
            />
          </div>

          <button
            className="next-btn"
            onClick={handleSubmit}
            disabled={(rating >= 3 && menuTags.length === 0) || !comment || submitting}
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

        /* 헤더 */
        .app-header {
          padding: 20px 16px 10px;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .app-title {
          font-size: 1.9rem;
          font-family: var(--font-title);
          color: var(--text);
          font-weight: 800;
          display: inline-block;
          white-space: nowrap;
          line-height: 1;
        }

        /* Step bar */
        .step-bar-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px 16px;
        }
        .step-bar { display: flex; gap: 6px; flex: 1; }
        .step-seg {
          flex: 1;
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          opacity: 0.3;
          transition: opacity 0.25s;
        }
        .step-seg.filled { opacity: 1; }
        .step-num {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-sub);
          white-space: nowrap;
        }

        /* Section */
        .section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 12px;
        }
        .section .px-input,
        .section .star-row,
        .section .menu-tags-preview,
        .section .tag-count {
          align-self: stretch;
        }

        /* Section label */
        .section-label {
          font-size: 1.1rem;
          font-family: var(--font-title);
          color: #ffffff;
          font-weight: 700;
          margin-bottom: 0;
          white-space: nowrap;
          display: inline-block;
          padding: 2px 10px;
          border: 2px solid var(--text);
          background: var(--text);
          filter: url(#sketchy-line);
          position: relative;
        }
        .section-label::after {
          content: '';
          position: absolute;
          bottom: -9px;
          left: 12px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--text);
        }

        /* Content */
        .content {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          filter: url(#sketchy-line);
        }
        .search-btn:disabled { background: var(--text-light); cursor: not-allowed; }

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
        }
        .result-item.selected { background: var(--primary-light); }
        .result-info { display: flex; flex-direction: column; gap: 3px; }
        .result-name { font-size: 1.1rem; font-family: var(--font-title); color: var(--text); }
        .result-addr { font-size: 12px; color: var(--text-sub); }
        .check { font-size: 18px; font-weight: 900; color: var(--primary); }

        /* Selected box */
        .selected-box { padding: 14px 18px; }
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
        .selected-name { font-size: 1.2rem; font-family: var(--font-title); color: var(--text); margin-bottom: 2px; }
        .selected-addr { font-size: 12px; color: var(--text-sub); }

        /* Form */
        .form-group { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
        .star-inline-row {
          display: flex;
          align-items: center;
          gap: 17px;
          flex-wrap: wrap;
        }
        .stars-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .section-label.no-tail::after { display: none; }
        .form-group .px-input { align-self: stretch; }
        .form-group .star-row { align-self: stretch; }
        .form-group .menu-tags-preview { align-self: stretch; }
        .label-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hint {
          font-size: 12px;
          color: var(--text-sub);
          font-family: var(--font-main);
        }

        /* Stars */
        .star-row { display: flex; align-items: center; gap: 4px; }
        .star-btn {
          font-size: 2rem;
          color: var(--border-color);
          opacity: 0.3;
          padding: 0;
          line-height: 1;
          cursor: pointer;
          background: none;
          border: none;
          transition: all 0.1s;
          filter: url(#sketchy-line);
        }
        .star-btn.on { color: var(--yellow); opacity: 1; }
        .star-btn:active { transform: scale(0.88); }
        .rating-guide {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-sub);
          margin-left: 6px;
        }

        /* Menu tags */
        .menu-tags-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .menu-tag {
          font-size: 13px;
          color: var(--primary);
          background: var(--primary-light);
          border: 1.5px solid var(--primary);
          border-radius: 8px;
          padding: 3px 7px;
          display: inline-block;
        }
        .tag-count {
          font-size: 11px;
          color: var(--text-sub);
        }

        /* CTA */
        .next-btn {
          width: 100%;
          padding: 15px;
          background: var(--primary);
          color: #ffffff;
          border: 2px solid var(--text);
          border-radius: var(--radius-btn);
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-title);
          cursor: pointer;
          margin-top: 4px;
          transition: opacity 0.1s;
          filter: url(#sketchy-line);
          box-shadow: 3px 3px 0px var(--text);
        }
        .next-btn:hover:not(:disabled) { opacity: 0.9; }
        .next-btn:active:not(:disabled) { transform: scale(0.98); box-shadow: 1px 1px 0px var(--text); }
        .next-btn:disabled {
          background: var(--text-light);
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}
