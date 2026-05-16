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

// DulSai 에서 reply 는 post_comments 테이블 위에 얹힌 동일 개념.
// 호출부 가독성을 위해 createReply alias 를 함께 export 한다.
export const createReply = createCommentImpl;

export async function createComment(
  input: DbPostCommentInsert,
): Promise<DbPostComment | null> {
  return createCommentImpl(input);
}

async function createCommentImpl(
  input: DbPostCommentInsert,
): Promise<DbPostComment | null> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert(input)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('createComment failed', { message: error.message });
    return null;
  }
  return data;
}

// ↑ createCommentImpl 종료

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
