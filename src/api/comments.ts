import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  DbPostComment,
  DbPostCommentInsert,
  DbPostCommentUpdate,
} from '../types/db';

export async function listCommentsByPost(
  postId: string,
): Promise<DbPostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .neq('status', 'hidden') // 운영자가 hidden 처리한 답글 제외
    .order('created_at', { ascending: true });
  if (error) {
    logger.warn('listCommentsByPost failed', {
      postId,
      message: error.message,
    });
    return [];
  }
  return data ?? [];
}

// 답글 작성 결과 — safety_blocked / reply_limit_reached 등 서버 응답을 그대로 노출.
export type CreateReplyResult = {
  ok: boolean;
  comment: DbPostComment | null;
  errorCode?: string;
  errorMessage?: string;
  hint?: string;
};

// 답글 작성은 Edge Function `create-reply` 경유.
// 서버 측 안전 필터 + 답글 10개 한도 검사 + service_role insert.
export async function createReply(
  input: DbPostCommentInsert,
): Promise<CreateReplyResult> {
  const { data, error } = await supabase.functions.invoke('create-reply', {
    method: 'POST',
    body: { post_id: input.post_id, body: input.body },
  });
  if (error) {
    logger.error('createReply invoke failed', {
      name: error.name,
      message: error.message,
    });
    return {
      ok: false,
      comment: null,
      errorCode: error.name,
      errorMessage: error.message,
    };
  }
  const payload = (data ?? {}) as {
    ok?: boolean;
    comment?: DbPostComment;
    error?: string;
    hint?: string;
    detail?: string;
  };
  if (!payload.ok) {
    logger.warn('createReply server rejected', {
      error: payload.error,
      detail: payload.detail,
    });
    return {
      ok: false,
      comment: null,
      errorCode: payload.error,
      errorMessage: payload.detail ?? payload.error,
      hint: payload.hint,
    };
  }
  return { ok: true, comment: payload.comment ?? null };
}

export async function updateComment(
  commentId: string,
  patch: DbPostCommentUpdate,
): Promise<DbPostComment | null> {
  const { data, error } = await supabase
    .from('post_comments')
    .update(patch)
    .eq('id', commentId)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('updateComment failed', {
      commentId,
      message: error.message,
    });
    return null;
  }
  return data;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);
  if (error) {
    logger.error('deleteComment failed', {
      commentId,
      message: error.message,
    });
    return false;
  }
  return true;
}

// 답글 "내보내기" — status='hidden' 으로 update.
// 화면 fetch 가 .neq('status','hidden') 으로 자연스럽게 제외한다. delete 와 달리 복구 가능.
export async function hideComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('post_comments')
    .update({ status: 'hidden' })
    .eq('id', commentId);
  if (error) {
    logger.error('hideComment failed', {
      commentId,
      message: error.message,
    });
    return false;
  }
  return true;
}
