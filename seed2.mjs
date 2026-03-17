import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gwbbkeevzmwulhnxxvdp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YmJrZWV2em13dWxobnh4dmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDY2ODUsImV4cCI6MjA4ODg4MjY4NX0.q7SoguJSzMKcMwF0ikCii2ElWmHyfSUB-qYNXT6-rEE'
);

const mainIds = [
  '2dd128a3-6b70-4010-96e1-ac76823eff2a',
  '2dfbd463-3099-4de2-9258-a5dccf7d60fe',
  'b4002433-acf9-4c75-b2bd-e1c81892f09a',
  '2854a912-db85-4670-8b96-61efccbf443b',
];

// 기존 친구들
const existingFriendIds = [
  '42fc1da7-d967-40d0-9df3-9a48ae990f30', // 김민준
  'decc73f5-8ca4-4b99-929a-fcea9d74cb17', // 이지아
  '081d05ff-c5d6-43c9-83c2-0607a7f4cbcb', // 박서준
];

// 새 친구 5명 추가
const newFriends = [
  { nickname: '최유나', invite_code: 'test_cyn4' },
  { nickname: '정도현', invite_code: 'test_jdh5' },
  { nickname: '한소희', invite_code: 'test_hsh6' },
  { nickname: '오준혁', invite_code: 'test_ojh7' },
  { nickname: '강다인', invite_code: 'test_kdi8' },
];

const createdFriends = [];
for (const f of newFriends) {
  const { data: existing } = await supabase.from('users').select('*').eq('nickname', f.nickname).maybeSingle();
  if (existing) {
    console.log(`${f.nickname} 이미 존재`);
    createdFriends.push(existing);
  } else {
    const { data, error } = await supabase.from('users').insert([f]).select().single();
    if (error) { console.error(`유저 생성 실패 ${f.nickname}:`, error.message); continue; }
    console.log(`${f.nickname} 생성:`, data.id);
    createdFriends.push(data);
  }
}

const allFriendIds = [...existingFriendIds, ...createdFriends.map(f => f.id)];

// 새 친구들 팔로우 연결
const pairs = [];
for (const m of mainIds) {
  for (const f of createdFriends.map(f => f.id)) {
    pairs.push({ follower_id: m, following_id: f });
    pairs.push({ follower_id: f, following_id: m });
  }
}
// 친구끼리도 맞팔
for (let i = 0; i < allFriendIds.length; i++) {
  for (let j = i + 1; j < allFriendIds.length; j++) {
    pairs.push({ follower_id: allFriendIds[i], following_id: allFriendIds[j] });
    pairs.push({ follower_id: allFriendIds[j], following_id: allFriendIds[i] });
  }
}

const { error: followError } = await supabase.from('follows').upsert(pairs, { onConflict: 'follower_id,following_id' });
if (followError) console.error('팔로우 오류:', followError.message);
else console.log(`팔로우 ${pairs.length}개 완료`);

// 5명이 동일 장소 등록 → 빨간 핀 (lat/lng 동일)
// 삼겹살집: 모든 친구 6명이 등록 (빨간 핀)
const hotPlace = {
  restaurant_name: '연남동 삼겹살 화로집',
  address: '서울 마포구 연남로 15',
  lat: 37.5609, lng: 126.9254,
};
const hotReviews = [
  { ...hotPlace, user_id: existingFriendIds[0], rating: 5, menu: '삼겹살+된장찌개', comment: '여기 삼겹살 진짜 미쳤음 무조건 가야 함' },
  { ...hotPlace, user_id: existingFriendIds[1], rating: 5, menu: '삼겹살', comment: '연남동 오면 무조건 여기. 고기 두께가 다름' },
  { ...hotPlace, user_id: existingFriendIds[2], rating: 4, menu: '오겹살', comment: '가성비 좋고 사장님 친절함' },
  { ...hotPlace, user_id: createdFriends[0]?.id, rating: 5, menu: '삼겹살+소주', comment: '술 먹기 너무 좋은 분위기 재방문 의사 200%' },
  { ...hotPlace, user_id: createdFriends[1]?.id, rating: 4, menu: '항정살', comment: '항정살이 특히 맛있음. 웨이팅 있을 수 있음' },
  { ...hotPlace, user_id: createdFriends[2]?.id, rating: 5, menu: '삼겹살', comment: '친구들이랑 오면 딱임. 여기 단골됨' },
];

// 3명이 등록한 장소 → 노란 핀
const warmPlace = {
  restaurant_name: '성수동 베이글 하우스',
  address: '서울 성동구 성수일로 89',
  lat: 37.5448, lng: 127.0557,
};
const warmReviews = [
  { ...warmPlace, user_id: createdFriends[0]?.id, rating: 4, menu: '에브리씽 베이글', comment: '뉴욕 감성 베이글. 크림치즈 듬뿍' },
  { ...warmPlace, user_id: createdFriends[3]?.id, rating: 4, menu: '아보카도 베이글', comment: '아침으로 딱. 커피도 맛있음' },
  { ...warmPlace, user_id: createdFriends[4]?.id, rating: 3, menu: '플레인 베이글', comment: '맛은 있는데 가격이 좀 쎈 편' },
];

// 최신 리뷰들 (7일 이내 → 홈 최신맛집에 노출)
const recentReviews = [
  {
    restaurant_name: '홍대 타코',
    address: '서울 마포구 와우산로 29',
    lat: 37.5537, lng: 126.9228,
    user_id: createdFriends[0]?.id, rating: 5, menu: '알파스터 타코', comment: '홍대에 이런 타코집이 있었다니 진짜 맛있음',
  },
  {
    restaurant_name: '서촌 해장국',
    address: '서울 종로구 필운대로 22',
    lat: 37.5784, lng: 126.9702,
    user_id: createdFriends[2]?.id, rating: 4, menu: '뼈해장국', comment: '숙취 해소는 여기서. 뼈 국물이 진함',
  },
  {
    restaurant_name: '한남동 버거',
    address: '서울 용산구 이태원로 240',
    lat: 37.5349, lng: 126.9999,
    user_id: createdFriends[3]?.id, rating: 5, menu: '더블 스모키 버거', comment: '패티 두께 실화임 여기 버거 최강',
  },
  {
    restaurant_name: '압구정 초밥',
    address: '서울 강남구 압구정로 175',
    lat: 37.5270, lng: 127.0290,
    user_id: createdFriends[4]?.id, rating: 4, menu: '오마카세 런치', comment: '런치 오마카세 가성비 좋음. 예약 필수',
  },
];

const allReviews = [...hotReviews, ...warmReviews, ...recentReviews].filter(r => r.user_id);

const { error: reviewError } = await supabase.from('reviews').insert(allReviews);
if (reviewError) console.error('리뷰 오류:', reviewError.message);
else console.log(`리뷰 ${allReviews.length}개 등록 완료`);

console.log('\n✅ 시드2 완료!');
