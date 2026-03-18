import { supabase } from './supabase';

export function getLocalUser() {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem('zzp_user_id');
  const nickname = localStorage.getItem('zzp_nickname');
  if (!id || !nickname) return null;
  return { id, nickname };
}

function setLocalUser(id, nickname) {
  localStorage.setItem('zzp_user_id', id);
  localStorage.setItem('zzp_nickname', nickname);
}

export async function createUser(nickname) {
  // 같은 이름이 이미 있으면 해당 유저로 로그인
  const { data: existingRows } = await supabase
    .from('users')
    .select('*')
    .eq('nickname', nickname)
    .order('created_at', { ascending: true })
    .limit(1);

  const existing = existingRows?.[0] || null;

  if (existing) {
    setLocalUser(existing.id, existing.nickname);
    return existing;
  }

  // 없으면 신규 생성
  const invite_code = Math.random().toString(36).substring(2, 10);
  const { data, error } = await supabase
    .from('users')
    .insert([{ nickname, invite_code }])
    .select()
    .single();
  if (error) throw error;
  setLocalUser(data.id, data.nickname);
  return data;
}

export async function getUserByInviteCode(invite_code) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('invite_code', invite_code)
    .single();
  return data || null;
}

export async function createMutualFollow(follower_id, following_id) {
  await supabase.from('follows').upsert([
    { follower_id, following_id },
    { follower_id: following_id, following_id: follower_id },
  ]);
}

export async function getFollowingIds(user_id) {
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user_id);
  return (data || []).map((r) => r.following_id);
}

export async function getFollowingUsers(user_id) {
  const ids = await getFollowingIds(user_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from('users')
    .select('id, nickname')
    .in('id', ids);
  return data || [];
}

export async function isAlreadyFollowing(follower_id, following_id) {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', follower_id)
    .eq('following_id', following_id)
    .maybeSingle();
  return !!data;
}
