// 주의: relationship_states 테이블은 아직 실제 Supabase 마이그레이션이 적용되지 않았다.
// 이 모듈은 인터페이스 placeholder 이며, 호출되면 logger.warn 후 null 을 반환한다.
// orderUserPair 만 순수 유틸이라 즉시 사용 가능.

import { logger } from '../lib/logger';
import type {
  DbRelationshipState,
  DbRelationshipStateUpdate,
} from '../types/db';

export function orderUserPair(a: string, b: string): {
  user_a_id: string;
  user_b_id: string;
} {
  return a < b
    ? { user_a_id: a, user_b_id: b }
    : { user_a_id: b, user_b_id: a };
}

function warnPending(fn: string) {
  logger.warn('relationship_states table not provisioned yet', { fn });
}

export async function getRelationshipState(
  _userIdA: string,
  _userIdB: string,
): Promise<DbRelationshipState | null> {
  warnPending('getRelationshipState');
  return null;
}

export async function upsertRelationshipState(
  _userIdA: string,
  _userIdB: string,
  _patch: Omit<DbRelationshipStateUpdate, 'user_a_id' | 'user_b_id'>,
): Promise<DbRelationshipState | null> {
  warnPending('upsertRelationshipState');
  return null;
}
