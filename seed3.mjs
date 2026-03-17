import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gwbbkeevzmwulhnxxvdp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YmJrZWV2em13dWxobnh4dmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDY2ODUsImV4cCI6MjA4ODg4MjY4NX0.q7SoguJSzMKcMwF0ikCii2ElWmHyfSUB-qYNXT6-rEE'
);

const testInviteCodes = ['test_kmj1','test_lja2','test_psj3','test_cyn4','test_jdh5','test_hsh6','test_ojh7','test_kdi8'];

// 1. 기존 테스트 유저 조회
const { data: existingTestUsers } = await supabase.from('users').select('*').in('invite_code', testInviteCodes);
const testIds = (existingTestUsers || []).map(u => u.id);

console.log('🧹 기존 테스트 데이터 삭제 중...');
// reviews 먼저 (FK 의존)
const { error: revDelErr } = await supabase.from('reviews').delete().gte('id', 0);
if (revDelErr) console.error('리뷰 삭제 오류:', revDelErr.message);
else console.log('✓ 리뷰 삭제');
// follows 삭제
const { error: folDelErr } = await supabase.from('follows').delete().neq('follower_id', '00000000-0000-0000-0000-000000000000');
if (folDelErr) console.error('팔로우 삭제 오류:', folDelErr.message);
else console.log('✓ 팔로우 삭제');
// 테스트 유저 삭제
const { error: userDelErr } = await supabase.from('users').delete().in('invite_code', testInviteCodes);
if (userDelErr) console.error('유저 삭제 오류:', userDelErr.message);
else console.log('✓ 테스트 유저 삭제');

// 2. 현재 실제 유저 조회 (테스트 유저 제외, 닉네임 있는 것만)
const { data: allUsers } = await supabase.from('users').select('*');
const realUsers = (allUsers || []).filter(u => u.nickname === '서윤교');
console.log('실제 유저:', realUsers.map(u => u.nickname));

// 3. 테스트 친구 생성
const friendDefs = [
  { nickname: '김민준', invite_code: 'test_kmj1' },
  { nickname: '이지아', invite_code: 'test_lja2' },
  { nickname: '박서준', invite_code: 'test_psj3' },
  { nickname: '최유나', invite_code: 'test_cyn4' },
  { nickname: '정도현', invite_code: 'test_jdh5' },
  { nickname: '한소희', invite_code: 'test_hsh6' },
  { nickname: '오준혁', invite_code: 'test_ojh7' },
  { nickname: '강다인', invite_code: 'test_kdi8' },
];

const friends = [];
for (const f of friendDefs) {
  const { data, error } = await supabase.from('users').insert([f]).select().single();
  if (error) { console.error(`유저 생성 실패 ${f.nickname}:`, error.message); continue; }
  friends.push(data);
  console.log(`✓ ${f.nickname} 생성`);
}

// 4. 실제 유저 ↔ 친구 전체 맞팔
const everyone = [...realUsers, ...friends];
const pairs = [];
for (let i = 0; i < everyone.length; i++) {
  for (let j = i + 1; j < everyone.length; j++) {
    pairs.push({ follower_id: everyone[i].id, following_id: everyone[j].id });
    pairs.push({ follower_id: everyone[j].id, following_id: everyone[i].id });
  }
}
if (pairs.length > 0) {
  const { error } = await supabase.from('follows').upsert(pairs, { onConflict: 'follower_id,following_id' });
  if (error) console.error('팔로우 오류:', error.message);
  else console.log(`✓ 팔로우 ${pairs.length}개 설정`);
}

const f = friends;
const now = new Date();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

// 5. 리뷰 데이터
const reviews = [
  // 🔴 빨간 핀: 연남동 삼겹살 화로집 (6명 등록)
  { restaurant_name: '연남동 삼겹살 화로집', address: '서울 마포구 연남로 15', lat: 37.5609, lng: 126.9254, kakao_place_id: null,
    user_id: f[0]?.id, rating: 5, menu: '삼겹살, 된장찌개', comment: '여기 삼겹살 진짜 미쳤음 무조건 가야 함', created_at: daysAgo(3) },
  { restaurant_name: '연남동 삼겹살 화로집', address: '서울 마포구 연남로 15', lat: 37.5609, lng: 126.9254, kakao_place_id: null,
    user_id: f[1]?.id, rating: 5, menu: '삼겹살', comment: '연남동 오면 무조건 여기. 고기 두께가 다름', created_at: daysAgo(5) },
  { restaurant_name: '연남동 삼겹살 화로집', address: '서울 마포구 연남로 15', lat: 37.5609, lng: 126.9254, kakao_place_id: null,
    user_id: f[2]?.id, rating: 4, menu: '오겹살', comment: '가성비 좋고 사장님 친절함', created_at: daysAgo(10) },
  { restaurant_name: '연남동 삼겹살 화로집', address: '서울 마포구 연남로 15', lat: 37.5609, lng: 126.9254, kakao_place_id: null,
    user_id: f[3]?.id, rating: 5, menu: '삼겹살', comment: '술 먹기 너무 좋은 분위기 재방문 의사 200%', created_at: daysAgo(2) },
  { restaurant_name: '연남동 삼겹살 화로집', address: '서울 마포구 연남로 15', lat: 37.5609, lng: 126.9254, kakao_place_id: null,
    user_id: f[4]?.id, rating: 4, menu: '항정살', comment: '항정살이 특히 맛있음. 웨이팅 있을 수 있음', created_at: daysAgo(6) },
  { restaurant_name: '연남동 삼겹살 화로집', address: '서울 마포구 연남로 15', lat: 37.5609, lng: 126.9254, kakao_place_id: null,
    user_id: f[5]?.id, rating: 5, menu: '삼겹살', comment: '친구들이랑 오면 딱임. 여기 단골됨', created_at: daysAgo(1) },

  // 🟡 노란 핀: 성수동 베이글 하우스 (3명 등록)
  { restaurant_name: '성수동 베이글 하우스', address: '서울 성동구 성수일로 89', lat: 37.5448, lng: 127.0557, kakao_place_id: null,
    user_id: f[0]?.id, rating: 4, menu: '에브리씽 베이글', comment: '뉴욕 감성 베이글. 크림치즈 듬뿍', created_at: daysAgo(4) },
  { restaurant_name: '성수동 베이글 하우스', address: '서울 성동구 성수일로 89', lat: 37.5448, lng: 127.0557, kakao_place_id: null,
    user_id: f[3]?.id, rating: 4, menu: '아보카도 베이글', comment: '아침으로 딱. 커피도 맛있음', created_at: daysAgo(8) },
  { restaurant_name: '성수동 베이글 하우스', address: '서울 성동구 성수일로 89', lat: 37.5448, lng: 127.0557, kakao_place_id: null,
    user_id: f[4]?.id, rating: 3, menu: '플레인 베이글', comment: '맛은 있는데 가격이 좀 쎈 편', created_at: daysAgo(12) },

  // ⚪ 개인 맛집들
  { restaurant_name: '광장시장 빈대떡', address: '서울 종로구 창경궁로 88', lat: 37.5700, lng: 126.9997, kakao_place_id: null,
    user_id: f[0]?.id, rating: 5, menu: '녹두빈대떡', comment: '바삭함이 미쳤다 진짜 여기 꼭 가야함', created_at: daysAgo(15) },
  { restaurant_name: '을지면옥', address: '서울 중구 을지로 18길 18', lat: 37.5661, lng: 126.9922, kakao_place_id: null,
    user_id: f[1]?.id, rating: 4, menu: '평양냉면', comment: '냉면 좋아하면 무조건 와야 함. 육수가 진짜', created_at: daysAgo(20) },
  { restaurant_name: '삼청동 수제비', address: '서울 종로구 삼청로 101', lat: 37.5826, lng: 126.9806, kakao_place_id: null,
    user_id: f[1]?.id, rating: 3, menu: '수제비', comment: '분위기는 좋은데 맛은 평범. 관광지 느낌', created_at: daysAgo(18) },
  { restaurant_name: '마포 돼지갈비', address: '서울 마포구 독막로 19', lat: 37.5481, lng: 126.9516, kakao_place_id: null,
    user_id: f[2]?.id, rating: 4, menu: '생갈비', comment: '연탄불 직화라 향이 다름. 술 먹기 좋음', created_at: daysAgo(22) },
  { restaurant_name: '이태원 경리단길 카레', address: '서울 용산구 회나무로 21', lat: 37.5349, lng: 126.9896, kakao_place_id: null,
    user_id: f[2]?.id, rating: 4, menu: '버터치킨 카레', comment: '인도 카레 맛 제대로 남. 난이랑 먹으면 최고', created_at: daysAgo(25) },
  { restaurant_name: '봉피양 강남점', address: '서울 강남구 영동대로 325', lat: 37.5074, lng: 127.0552, kakao_place_id: null,
    user_id: f[3]?.id, rating: 5, menu: '평양냉면, 제육', comment: '강남에서 이 가격에 이 맛이면 갓성비', created_at: daysAgo(30) },
  { restaurant_name: '연남동 돈가스', address: '서울 마포구 연남로 37', lat: 37.5613, lng: 126.9238, kakao_place_id: null,
    user_id: f[4]?.id, rating: 5, menu: '수제 등심돈가스', comment: '두껍고 육즙 터짐. 웨이팅 있지만 기다릴 가치 있음', created_at: daysAgo(7) },
  { restaurant_name: '홍대 타코', address: '서울 마포구 와우산로 29', lat: 37.5537, lng: 126.9228, kakao_place_id: null,
    user_id: f[5]?.id, rating: 5, menu: '알파스터 타코', comment: '홍대에 이런 타코집이 있었다니 진짜 맛있음', created_at: daysAgo(2) },
  { restaurant_name: '한남동 버거', address: '서울 용산구 이태원로 240', lat: 37.5349, lng: 126.9999, kakao_place_id: null,
    user_id: f[6]?.id, rating: 5, menu: '더블 스모키 버거', comment: '패티 두께 실화임 여기 버거 최강', created_at: daysAgo(1) },
  { restaurant_name: '압구정 초밥', address: '서울 강남구 압구정로 175', lat: 37.5270, lng: 127.0290, kakao_place_id: null,
    user_id: f[7]?.id, rating: 4, menu: '오마카세 런치', comment: '런치 오마카세 가성비 좋음. 예약 필수', created_at: daysAgo(3) },
  { restaurant_name: '서촌 해장국', address: '서울 종로구 필운대로 22', lat: 37.5784, lng: 126.9702, kakao_place_id: null,
    user_id: f[7]?.id, rating: 4, menu: '뼈해장국', comment: '숙취 해소는 여기서. 뼈 국물이 진함', created_at: daysAgo(5) },
];

const validReviews = reviews.filter(r => r.user_id);
const { error: reviewError } = await supabase.from('reviews').insert(validReviews);
if (reviewError) console.error('리뷰 오류:', reviewError.message);
else console.log(`✓ 리뷰 ${validReviews.length}개 등록 완료`);

console.log('\n✅ 시드3 완료!');
