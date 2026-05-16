import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  ConversationInviteStatus,
  DbConversationInvite,
  DbConversationInviteInsert,
} from '../types/db';

export type CreateInviteArgs = {
  postId: string;
  replyId: string;
  // RLS: sender_id = auth.uid() 일 때만 insert 허용.
  senderId: string;
  receiverId: string;
  content: string;
};

// 클라이언트가 받기 좋은 모양으로 평탄화. 원문 그대로 1:1 매핑이지만
// 호출부가 컬럼 snake_case 를 알 필요 없게 한다.
export type LocalInviteDraft = {
  inviteId: string;
  postId: string;
  replyId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export async function createInvite(
  args: CreateInviteArgs,
): Promise<LocalInviteDraft | null> {
  const payload: DbConversationInviteInsert = {
    post_id: args.postId,
    reply_id: args.replyId,
    sender_id: args.senderId,
    receiver_id: args.receiverId,
    content: args.content,
  };

  const { data, error } = await supabase
    .from('conversation_invites')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    // 23505 = unique_violation (중복 초대). 그 외는 일반 실패.
    if (error.code === '23505') {
      logger.warn('createInvite duplicate', {
        replyId: args.replyId,
        senderId: args.senderId,
      });
    } else {
      logger.error('createInvite failed', {
        code: error.code,
        message: error.message,
      });
    }
    return null;
  }

  if (!data) return null;

  return {
    inviteId: data.id,
    postId: data.post_id,
    replyId: data.reply_id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    content: data.content,
    createdAt: data.created_at,
  };
}

// 상태 전이 — accept / decline / withdraw. RLS 정책에 따라 본인만 가능.
// accept 는 receiver 만, withdraw 는 sender 만 호출 가능하도록 서버 정책에서 enforce.
async function updateInviteStatus(
  inviteId: string,
  next: ConversationInviteStatus,
): Promise<DbConversationInvite | null> {
  const { data, error } = await supabase
    .from('conversation_invites')
    .update({ status: next, responded_at: new Date().toISOString() })
    .eq('id', inviteId)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('updateInviteStatus failed', {
      inviteId,
      next,
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return data;
}

export function acceptInvite(inviteId: string) {
  return updateInviteStatus(inviteId, 'accepted');
}

export function declineInvite(inviteId: string) {
  return updateInviteStatus(inviteId, 'declined');
}

export function withdrawInvite(inviteId: string) {
  return updateInviteStatus(inviteId, 'withdrawn');
}
