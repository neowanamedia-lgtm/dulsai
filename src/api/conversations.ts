import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  DbConversation,
  DbConversationInsert,
} from '../types/db';

// (user_a_id, user_b_id) 가 항상 작은 UUID 먼저 오도록 정렬.
// CHECK / UNIQUE 제약을 만족시키기 위한 보조.
export function orderUserPair(a: string, b: string): {
  user_a_id: string;
  user_b_id: string;
} {
  return a < b
    ? { user_a_id: a, user_b_id: b }
    : { user_a_id: b, user_b_id: a };
}

export async function listMyConversations(
  userId: string,
): Promise<DbConversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) {
    logger.warn('listMyConversations failed', {
      userId,
      message: error.message,
    });
    return [];
  }
  return data ?? [];
}

export async function getConversationById(
  conversationId: string,
): Promise<DbConversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  if (error) {
    logger.warn('getConversationById failed', {
      conversationId,
      message: error.message,
    });
    return null;
  }
  return data;
}

// 초대 accept 시점에 호출. 같은 페어가 이미 있으면 unique 제약으로 차단됨.
export async function createConversation(args: {
  postId: string;
  inviteId: string;
  userIdA: string;
  userIdB: string;
}): Promise<DbConversation | null> {
  const pair = orderUserPair(args.userIdA, args.userIdB);
  const payload: DbConversationInsert = {
    post_id: args.postId,
    invite_id: args.inviteId,
    ...pair,
  };
  const { data, error } = await supabase
    .from('conversations')
    .insert(payload)
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') {
      // 이미 같은 페어 대화방이 있다 — 기존 row 조회로 폴백.
      const existing = await findExistingConversation(pair);
      if (existing) return existing;
    }
    logger.error('createConversation failed', {
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return data;
}

async function findExistingConversation(pair: {
  user_a_id: string;
  user_b_id: string;
}): Promise<DbConversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_a_id', pair.user_a_id)
    .eq('user_b_id', pair.user_b_id)
    .maybeSingle();
  if (error) {
    logger.warn('findExistingConversation failed', { message: error.message });
    return null;
  }
  return data;
}
