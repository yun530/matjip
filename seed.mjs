import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gwbbkeevzmwulhnxxvdp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3YmJrZWV2em13dWxobnh4dmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDY2ODUsImV4cCI6MjA4ODg4MjY4NX0.q7SoguJSzMKcMwF0ikCii2ElWmHyfSUB-qYNXT6-rEE'
);

// 기존 유저 조회
const { data: existingUsers } = await supabase.from('users').select('*');
console.log('기존 유저:', existingUsers?.map(u => u.nickname));

// 테스트 친구 유저 생성
const friends = [
  { nickname: '김민준', invite_code: 'test_kmj1' },
  { nickname: '이지아', invite_code: 'test_lja2' },
  { nickname: '박서준', invite_code: 'test_psj3' },
];

const createdFriends = [];
for (const f of friends) {
  const existing = existingUsers?.find(u => u.nickname === f.nickname);
  if (existing) {
    console.log(`${f.nickname} 이미 존재`);
    createdFriends.push(existing);
  } else {
    const { data, error } = await supabase.from('users').insert([f]).select().single();
    if (error) { console.error(`유저 생성 실패 ${f.nickname}:`, error.message); continue; }
    console.log(`${f.nickname} 생성 완료:`, data.id);
    createdFriends.push(data);
  }
}

// 기존 유저들과 테스트 친구들 맞팔 설정
const mainUsers = existingUsers?.filter(u => !friends.find(f => f.nickname === u.nickname)) || [];
const followPairs = [];
for (const main of mainUsers) {
  for (const friend of createdFriends) {
    followPairs.push({ follower_id: main.id, following_id: friend.id });
    followPairs.push({ follower_id: friend.id, following_id: main.id });
  }
}
if (followPairs.length > 0) {
  const { error } = await supabase.from('follows').upsert(followPairs, { onConflict: 'follower_id,following_id' });
  if (error) console.error('팔로우 오류:', error.message);
  else console.log(`팔로우 ${followPairs.length}개 설정 완료`);
}

// 리뷰 데이터 (서울 실제 좌표)
const reviews = [
  {
    user_id: createdFriends[0]?.id,
    restaurant_name: '광장시장 빈대떡',
    address: '서울 종로구 창경궁로 88',
    lat: 37.5700, lng: 126.9997,
    rating: 5, menu: '녹두빈대떡', comment: '바삭함이 미쳤다 진짜 여기 꼭 가야함',
  },
  {
    user_id: createdFriends[0]?.id,
    restaurant_name: '을지면옥',
    address: '서울 중구 을지로 18길 18',
    lat: 37.5661, lng: 126.9922,
    rating: 4, menu: '평양냉면', comment: '냉면 좋아하면 무조건 와야 함. 육수가 진짜',
  },
  {
    user_id: createdFriends[1]?.id,
    restaurant_name: '봉피양 강남점',
    address: '서울 강남구 영동대로 325',
    lat: 37.5074, lng: 127.0552,
    rating: 5, menu: '평양냉면 + 제육', comment: '강남에서 이 가격에 이 맛이면 갓성비',
  },
  {
    user_id: createdFriends[1]?.id,
    restaurant_name: '삼청동 수제비',
    address: '서울 종로구 삼청로 101',
    lat: 37.5826, lng: 126.9806,
    rating: 3, menu: '수제비', comment: '분위기는 좋은데 맛은 평범. 관광지 느낌',
  },
  {
    user_id: createdFriends[1]?.id,
    restaurant_name: '마포 돼지갈비',
    address: '서울 마포구 독막로 19',
    lat: 37.5481, lng: 126.9516,
    rating: 4, menu: '생갈비', comment: '연탄불 직화라 향이 다름. 술 먹기 좋음',
  },
  {
    user_id: createdFriends[2]?.id,
    restaurant_name: '이태원 경리단길 카레',
    address: '서울 용산구 회나무로 21',
    lat: 37.5349, lng: 126.9896,
    rating: 4, menu: '버터치킨 카레', comment: '인도 카레 맛 제대로 남. 난이랑 먹으면 최고',
  },
  {
    user_id: createdFriends[2]?.id,
    restaurant_name: '연남동 돈가스',
    address: '서울 마포구 연남로 37',
    lat: 37.5613, lng: 126.9238,
    rating: 5, menu: '수제 등심돈가스', comment: '두껍고 육즙 터짐. 웨이팅 있지만 기다릴 가치 있음',
  },
];

const validReviews = reviews.filter(r => r.user_id);
const { error: reviewError } = await supabase.from('reviews').insert(validReviews);
if (reviewError) console.error('리뷰 오류:', reviewError.message);
else console.log(`리뷰 ${validReviews.length}개 등록 완료`);

console.log('\n✅ 시드 완료!');
