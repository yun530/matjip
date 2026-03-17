"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getLocalUser } from "@/lib/userAuth";

export default function PostPage() {
  const [step, setStep] = useState(1); // 1: 장소 검색, 2: 리뷰 작성
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [menu, setMenu] = useState("");
  const [comment, setComment] = useState("");

  const ratingGuides = {
    5: "애드라 꼭가라🙏",
    4: "또 갈 의향 잇음",
    3: "낫밷 한 번쯤 ㄱㅊ",
    2: "흠...그냥 그럼😐",
    1: "개별로❌",
  };

  // 장소 검색 기능
  const searchPlaces = () => {
    if (!keyword.replace(/^\s+|\s+$/g, "")) {
      alert("키워드를 입력해주세요!");
      return;
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      alert("지도 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data, status) => {
      setIsSearching(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert("검색 결과가 존재하지 않습니다.");
        setSearchResults([]);
      } else if (status === window.kakao.maps.services.Status.ERROR) {
        alert("검색 결과 중 오류가 발생했습니다.");
      }
    });
  };

  const handleNext = () => {
    if (step === 1 && !selectedPlace) {
      alert("맛집을 먼저 선택해 주세요!");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlace || !comment || !menu) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            restaurant_name: selectedPlace.place_name,
            address: selectedPlace.road_address_name || selectedPlace.address_name,
            lat: parseFloat(selectedPlace.y),
            lng: parseFloat(selectedPlace.x),
            rating: rating,
            menu: menu,
            comment: comment,
            user_id: getLocalUser()?.id || null,
          }
        ]);

      if (error) throw error;

      alert(`[${selectedPlace.place_name}] 등록되었습니다!`);
      window.location.href = "/";
    } catch (error) {
      console.error('등록 실패:', error.message);
      alert('맛집 등록에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="post-container container">
      <header className="post-header">
        <h1>{step === 1 ? "➕ 어떤 맛집인가요?" : "✍️ 후기 작성"}</h1>
        <p>{step === 1 ? "공유하고 싶은 식당을 검색해 보세요." : "친구들에게 알려줄 정보를 적어주세요."}</p>
      </header>

      <div className="step-indicator">
        <div className={`step ${step === 1 ? "active" : "done"}`}>1</div>
        <div className="line"></div>
        <div className={`step ${step === 2 ? "active" : ""}`}>2</div>
      </div>

      {step === 1 ? (
        <div className="search-section">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="식당 이름을 입력하세요 (예: 우래옥)" 
              className="search-input" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
            />
            <button className="search-btn" onClick={searchPlaces} disabled={isSearching}>
              {isSearching ? "..." : "🔍"}
            </button>
          </div>

          <div className="search-results">
            {searchResults.length > 0 ? (
              searchResults.map((place) => (
                <div 
                  key={place.id} 
                  className={`result-item ${selectedPlace?.id === place.id ? "selected" : ""}`}
                  onClick={() => setSelectedPlace(place)}
                >
                  <div className="place-info">
                    <span className="place-name">{place.place_name}</span>
                    <span className="place-address">{place.road_address_name || place.address_name}</span>
                  </div>
                  {selectedPlace?.id === place.id && <span className="check-icon">✅</span>}
                </div>
              ))
            ) : (
              <div className="no-results">검색 결과가 여기에 표시됩니다.</div>
            )}
          </div>

          <button className="next-btn" onClick={handleNext} disabled={!selectedPlace}>
            다음 단계로
          </button>
        </div>
      ) : (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="selected-place-card">
            <span className="label">선택된 장소</span>
            <h3>{selectedPlace.place_name}</h3>
            <p>{selectedPlace.road_address_name || selectedPlace.address_name}</p>
            <button type="button" className="edit-btn" onClick={() => setStep(1)}>변경</button>
          </div>

          <div className="form-group">
            <label>별점 {rating}점</label>
            <div className="rating-selector">
              {[5, 4, 3, 2, 1].map((num) => (
                <button 
                  key={num} 
                  type="button"
                  className={`rating-btn ${rating === num ? "active" : ""}`}
                  onClick={() => setRating(num)}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className="rating-guide-text">{ratingGuides[rating]}</div>
          </div>

          <div className="form-group">
            <label htmlFor="menu">추천 메뉴 (태그)</label>
            <input 
              id="menu" 
              type="text" 
              placeholder="예: 평양냉면, 불고기" 
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment">한 줄 평</label>
            <textarea 
              id="comment" 
              placeholder="어땠는지 꼬옥 써주면되..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={!comment || !menu}>
            맛집 등록 완료
          </button>
        </form>
      )}

      <style jsx>{`
        .post-container { padding-top: 24px; padding-bottom: 100px; max-width: 600px !important; }
        .post-header { text-align: left; margin-bottom: 32px; }
        .post-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
        .post-header p { color: var(--gray-500); font-size: 1rem; }

        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 32px; }
        .step { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; background: var(--gray-100); color: var(--gray-500); font-size: 1rem; transition: all 0.2s; border: 2.5px solid var(--gray-300); }
        .step.active { background: var(--primary); color: white; border-color: var(--black); }
        .step.done { background: var(--gray-300); color: white; border-color: var(--black); }
        .line { width: 40px; height: 2.5px; background: var(--black); border-radius: 2px; }

        .search-input-wrapper { display: flex; gap: 8px; margin-bottom: 24px; position: relative; }
        .search-input { flex: 1; padding: 14px 16px 14px 44px; border-radius: var(--radius-lg); border: 2.5px solid var(--black); font-size: 1rem; font-weight: 500; background: white; transition: all 0.1s; outline: none; font-family: inherit; }
        .search-input:focus { border-color: var(--primary); }
        .search-input-wrapper::before { content: '🔍'; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; opacity: 0.5; }
        .search-btn { display: none; }

        .search-results { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; min-height: 200px; }
        .no-results { display: flex; align-items: center; justify-content: center; height: 120px; color: var(--gray-400); font-size: 1rem; border: 2.5px dashed var(--gray-300); border-radius: var(--radius-lg); background: var(--gray-50); }
        .result-item { position: relative; padding: 16px; background: white; border: none; border-radius: var(--radius-lg); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.1s; }
        .result-item::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .result-item:hover { background: var(--gray-50); transform: translate(-1px, -1px); }
        .result-item.selected { background: rgba(49,130,246,0.05); }
        .place-name { display: block; font-weight: 700; font-size: 1.1rem; color: var(--gray-900); margin-bottom: 4px; }
        .place-address { font-size: 0.9rem; color: var(--gray-500); font-weight: 400; }
        .check-icon { font-size: 1.2rem; }

        .next-btn, .submit-btn { position: relative; width: 100%; padding: 16px; background: var(--primary); color: white; border: none; border-radius: var(--radius-lg); font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.1s; font-family: inherit; }
        .next-btn::before, .submit-btn::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .next-btn:hover:not(:disabled), .submit-btn:hover:not(:disabled) { transform: translate(-2px, -2px); }
        .next-btn:active:not(:disabled), .submit-btn:active:not(:disabled) { transform: translate(3px, 3px); }
        .next-btn:disabled, .submit-btn:disabled { background: var(--gray-200); color: var(--gray-400); cursor: not-allowed; }

        .selected-place-card { position: relative; background: var(--gray-50); padding: 20px; border-radius: var(--radius-lg); border: none; margin-bottom: 32px; }
        .selected-place-card::before { content: ''; position: absolute; inset: 0; border: 2.5px solid var(--black); border-radius: inherit; filter: url(#wobbly); pointer-events: none; }
        .selected-place-card .label { font-size: 0.8rem; color: var(--primary); font-weight: 700; margin-bottom: 8px; display: inline-block; background: rgba(49,130,246,0.1); padding: 4px 10px; border-radius: var(--radius-full); }
        .selected-place-card h3 { margin-bottom: 4px; color: var(--gray-900); font-size: 1.2rem; font-weight: 700; }
        .selected-place-card p { font-size: 0.95rem; color: var(--gray-500); }
        .edit-btn { position: absolute; top: 20px; right: 20px; font-size: 0.9rem; color: var(--gray-700); font-weight: 700; background: white; border: 2.5px solid var(--black); padding: 6px 12px; border-radius: var(--radius-md); transition: all 0.1s; font-family: inherit; cursor: pointer; }
        .edit-btn:hover { background: var(--gray-100); transform: translate(-1px, -1px); }

        .form-group { margin-bottom: 28px; }
        .form-group label { display: block; font-weight: 700; font-size: 1.05rem; margin-bottom: 12px; color: var(--gray-800); }
        .form-group input, .form-group textarea { width: 100%; padding: 14px 16px; border-radius: var(--radius-lg); border: 2.5px solid var(--black); font-size: 1rem; background: var(--gray-50); outline: none; transition: all 0.1s; color: var(--gray-900); font-family: inherit; box-sizing: border-box; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); background: white; }
        .form-group textarea { height: 120px; resize: none; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: var(--gray-400); }

        .rating-selector { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
        .rating-btn { font-size: 2.2rem; filter: grayscale(1); opacity: 0.2; transition: all 0.2s; background: none; border: none; cursor: pointer; padding: 0; }
        .rating-btn:hover { transform: scale(1.1); opacity: 0.5; }
        .rating-btn.active, .rating-btn.active ~ .rating-btn { filter: grayscale(0); opacity: 1; transform: scale(1.05); }
        .rating-guide-text { font-size: 0.95rem; font-weight: 700; color: var(--primary); border: 2.5px solid var(--primary); padding: 6px 14px; border-radius: var(--radius-lg); display: inline-block; }

        .submit-btn { margin-top: 10px; }
      `}</style>
    </div>
  );
}
