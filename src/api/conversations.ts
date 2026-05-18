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
  // status='left' 인 대화방은 양쪽 모두에서 숨김. 추후 user-level leave 도입 시 보강.
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .neq('status', 'left')
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

// 대화방 나가기 — 서버 측 conversations.status='left' 로 업데이트.
// 한쪽이 나가면 양쪽 모두 더 이상 조회되지 않는 현재 스키마(status 단일 컬럼) 한계가 있으며,
// 양쪽이 독립적으로 hide 하려면 별도 conversation_participants 테이블이 필요.
// 그 구조 마이그레이션 전까지는 이 함수가 "양쪽 모두 종료" 의미로 동작한다.
// 호출부는 서버 갱신 실패 시에도 클라이언트 로컬 hide(deletedConversationIds) 만으로
// 사용자 UX 가 깨지지 않도록 fallback 한다.
export async function leaveConversation(
  conversationId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'left' })
    .eq('id', conversationId);
  if (error) {
    logger.warn('leaveConversation failed', {
      conversationId,
      code: error.code,
      message: error.message,
    });
    return false;
  }
  return true;
}
