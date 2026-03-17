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
        .post-container { padding-top: 40px; padding-bottom: 100px; max-width: 500px !important; }
        .post-header { text-align: center; margin-bottom: 32px; }
        .post-header h1 { font-size: 1.8rem; font-weight: 800; color: var(--black); margin-bottom: 8px; }
        .post-header p { color: var(--gray-600); font-size: 1.1rem; }

        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 40px; }
        .step { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; background: var(--white); color: var(--gray-400); border: var(--border-width) solid var(--gray-400); font-family: inherit; font-size: 1.1rem; }
        .step.active { background: var(--primary); color: white; border-color: var(--black); box-shadow: 2px 2px 0px var(--black); }
        .step.done { background: var(--black); color: white; border-color: var(--black); }
        .line { width: 40px; height: 3px; background: var(--black); border-radius: 2px; }

        .search-input-wrapper { display: flex; gap: 8px; margin-bottom: 24px; }
        .search-input { flex: 1; padding: 14px 16px; border-radius: var(--doodle-radius); border: var(--border-width) solid var(--black); font-size: 1.1rem; font-family: inherit; font-weight: bold; background: white; box-shadow: 2px 2px 0px var(--black); outline: none; }
        .search-input:focus { box-shadow: 4px 4px 0px var(--black); transform: translate(-2px, -2px); }
        .search-btn { background: var(--black); color: white; padding: 0 20px; border-radius: var(--doodle-radius); font-weight: 700; border: var(--border-width) solid var(--black); box-shadow: 2px 2px 0px var(--black); font-size: 1.2rem; transition: transform 0.1s; }
        .search-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px; }
        .search-btn:disabled { opacity: 0.5; }

        .search-results { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; min-height: 200px; }
        .no-results { display: flex; align-items: center; justify-content: center; height: 100px; color: var(--gray-600); font-size: 1.1rem; font-weight: bold; border: var(--border-width) dashed var(--gray-400); border-radius: var(--doodle-radius); background: rgba(255,255,255,0.5); }
        .result-item { padding: 16px; background: white; border: var(--border-width) solid var(--black); border-radius: var(--doodle-radius); box-shadow: 3px 3px 0px var(--black); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
        .result-item:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0px var(--black); }
        .result-item.selected { background: var(--accent); }
        .place-name { display: block; font-weight: 800; font-size: 1.2rem; margin-bottom: 4px; }
        .place-address { font-size: 0.95rem; color: var(--gray-800); font-weight: 600; }
        .check-icon { font-size: 1.5rem; }

        .next-btn, .submit-btn { width: 100%; padding: 16px; background: var(--primary); color: white; border-radius: var(--doodle-radius); font-size: 1.3rem; font-weight: 800; cursor: pointer; border: var(--border-width) solid var(--black); box-shadow: 4px 4px 0px var(--black); transition: all 0.15s; font-family: inherit; }
        .next-btn:disabled, .submit-btn:disabled { background: var(--gray-200); cursor: not-allowed; box-shadow: none; border-color: var(--gray-400); color: var(--gray-600); }
        .next-btn:not(:disabled):active, .submit-btn:not(:disabled):active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px var(--black); }

        .selected-place-card { background: var(--white); padding: 20px; border-radius: var(--doodle-radius); border: var(--border-width) solid var(--black); box-shadow: 4px 4px 0px var(--black); margin-bottom: 32px; position: relative; }
        .selected-place-card .label { font-size: 0.9rem; color: var(--secondary); font-weight: 800; margin-bottom: 8px; display: block; border: 2px solid var(--secondary); border-radius: 20px; padding: 2px 8px; width: fit-content; }
        .selected-place-card h3 { margin-bottom: 4px; color: var(--black); font-size: 1.4rem; font-weight: bold; }
        .selected-place-card p { font-size: 1rem; color: var(--gray-800); font-weight: bold; }
        .edit-btn { position: absolute; top: 20px; right: 20px; font-size: 1rem; color: var(--black); font-weight: 800; background: var(--white); border: 2px solid var(--black); padding: 4px 10px; border-radius: 10px; box-shadow: 2px 2px 0px var(--black); cursor: pointer; font-family: inherit; }
        .edit-btn:active { transform: translate(1px, 1px); box-shadow: none; }

        .form-group { margin-bottom: 28px; }
        .form-group label { display: block; font-weight: 800; font-size: 1.2rem; margin-bottom: 12px; color: var(--black); }
        .form-group input, .form-group textarea { width: 100%; padding: 14px 16px; border-radius: var(--doodle-radius); border: var(--border-width) solid var(--black); font-size: 1.1rem; font-weight: bold; font-family: inherit; background: white; box-shadow: 3px 3px 0px var(--black); outline: none; transition: transform 0.15s, box-shadow 0.15s; }
        .form-group input:focus, .form-group textarea:focus { transform: translate(-2px, -2px); box-shadow: 5px 5px 0px var(--black); }
        .form-group textarea { height: 120px; resize: none; }

        .rating-selector { display: flex; flex-direction: row-reverse; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
        .rating-btn { font-size: 2rem; filter: grayscale(1); opacity: 0.3; transition: all 0.2s; background: none; border: none; cursor: pointer; transform-origin: center; display: inline-block; }
        .rating-btn:hover { transform: scale(1.2); }
        .rating-btn.active, .rating-btn.active ~ .rating-btn { filter: grayscale(0); opacity: 1; transform: scale(1.1); }
        .rating-guide-text { font-size: 1.1rem; font-weight: 800; color: var(--primary); background: rgba(255, 107, 107, 0.1); padding: 4px 12px; border-radius: 20px; display: inline-block; border: 2px solid var(--primary); }

        .submit-btn { background: var(--primary); margin-top: 20px; }
      `}</style>
    </div>
  );
}
