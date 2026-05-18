// 사용자 차단. user_blocks 테이블에 (blocker_id, blocked_id) 한 쌍을 insert/delete.
// 차단 효과는 client-side 필터로 적용한다 (서버 RLS 는 본인이 차단한 목록 select 만 허용).

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type BlockResult = {
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export async function blockUser(targetUserId: string): Promise<BlockResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, errorMessage: '로그인 후 다시 시도해 주세요.' };
  }
  if (user.id === targetUserId) {
    return { ok: false, errorMessage: '자기 자신은 차단할 수 없어요.' };
  }
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: user.id,
    blocked_id: targetUserId,
  });
  if (error) {
    // 23505 = unique_violation. 이미 차단된 상태는 ok 로 본다.
    if (error.code === '23505') {
      logger.info('blockUser already blocked', { targetUserId });
      return { ok: true };
    }
    logger.error('blockUser failed', {
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      errorCode: error.code ?? undefined,
      errorMessage: error.message,
    };
  }
  logger.info('blockUser ok', { targetUserId });
  return { ok: true };
}

export async function unblockUser(targetUserId: string): Promise<BlockResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, errorMessage: '로그인 후 다시 시도해 주세요.' };
  }
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId);
  if (error) {
    logger.error('unblockUser failed', {
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      errorCode: error.code ?? undefined,
      errorMessage: error.message,
    };
  }
  logger.info('unblockUser ok', { targetUserId });
  return { ok: true };
}

// 내가 차단한 사용자 id 목록. 화면 필터링용.
export async function listMyBlockedIds(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id);
  if (error) {
    logger.warn('listMyBlockedIds failed', {
      code: error.code,
      message: error.message,
    });
    return [];
  }
  return (data ?? []).map((r) => r.blocked_id);
}
