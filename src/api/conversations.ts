// 주의: conversations / conversation_messages 테이블은 아직 실제 Supabase 마이그레이션이 적용되지 않았다.
// 이 모듈은 추후 SQL 확정 시 활성화하기 위한 인터페이스 placeholder 이며,
// 지금은 graceful no-op 으로 동작한다 (logger.warn 후 빈 결과 반환).
// 실제 호출 시점에 컬럼명(특히 PK = 'id') 과 Database 스키마 등록을 함께 갱신한다.

import { logger } from '../lib/logger';
import type {
  DbConversation,
  DbConversationInsert,
  DbConversationMessage,
  DbConversationMessageInsert,
} from '../types/db';

function warnPending(fn: string) {
  logger.warn('conversations table not provisioned yet', { fn });
}

export async function listMyConversations(
  _userId: string,
): Promise<DbConversation[]> {
  warnPending('listMyConversations');
  return [];
}

export async function getConversationById(
  _conversationId: string,
): Promise<DbConversation | null> {
  warnPending('getConversationById');
  return null;
}

export async function createConversation(
  _input: DbConversationInsert,
): Promise<DbConversation | null> {
  warnPending('createConversation');
  return null;
}

export async function listMessages(
  _conversationId: string,
  _opts: { limit?: number; beforeIso?: string } = {},
): Promise<DbConversationMessage[]> {
  warnPending('listMessages');
  return [];
}

export async function sendMessage(
  _input: DbConversationMessageInsert,
): Promise<DbConversationMessage | null> {
  warnPending('sendMessage');
  return null;
}
