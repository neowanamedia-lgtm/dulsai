import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { DbPost, DbPostInsert, DbPostUpdate } from '../types/db';

export type ListPostsArgs = {
  category?: string;
  status?: string;
  visibility?: string;
  limit?: number;
  beforeIso?: string;
};

export async function listPosts(args: ListPostsArgs = {}): Promise<DbPost[]> {
  const { category, status, visibility, limit = 30, beforeIso } = args;
  let q = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) q = q.eq('category', category);
  if (status) q = q.eq('status', status);
  else q = q.neq('status', 'hidden'); // 명시적 status 지정이 없으면 hidden 글은 제외
  if (visibility) q = q.eq('visibility', visibility);
  if (beforeIso) q = q.lt('created_at', beforeIso);

  const { data, error } = await q;
  if (error) {
    logger.warn('listPosts failed', {
      category,
      status,
      message: error.message,
    });
    return [];
  }
  return data ?? [];
}

export async function getPostById(postId: string): Promise<DbPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle();
  if (error) {
    logger.warn('getPostById failed', { postId, message: error.message });
    return null;
  }
  return data;
}

// 글 작성 결과 — safety_blocked 등 서버 응답을 호출자에게 노출.
export type CreatePostResult = {
  ok: boolean;
  post: DbPost | null;
  errorCode?: string;
  errorMessage?: string;
  // safety_blocked 일 때 사용자에게 그대로 보여줄 한 줄.
  hint?: string;
};

// 글 작성은 Edge Function `create-post` 경유.
// 서버 측 안전 필터 통과 후 service_role 로 insert.
// 클라이언트가 supabase.from('posts').insert(...) 를 직접 호출하지 않도록 한다.
export async function createPost(input: DbPostInsert): Promise<CreatePostResult> {
  const { data, error } = await supabase.functions.invoke('create-post', {
    method: 'POST',
    body: { category: input.category, body: input.body },
  });
  if (error) {
    logger.error('createPost invoke failed', {
      name: error.name,
      message: error.message,
    });
    return {
      ok: false,
      post: null,
      errorCode: error.name,
      errorMessage: error.message,
    };
  }
  const payload = (data ?? {}) as {
    ok?: boolean;
    post?: DbPost;
    error?: string;
    hint?: string;
    detail?: string;
  };
  if (!payload.ok) {
    logger.warn('createPost server rejected', {
      error: payload.error,
      detail: payload.detail,
    });
    return {
      ok: false,
      post: null,
      errorCode: payload.error,
      errorMessage: payload.detail ?? payload.error,
      hint: payload.hint,
    };
  }
  return { ok: true, post: payload.post ?? null };
}

// 본문 update — 작성자 본인만 RLS 정책으로 허용된다는 전제.
export async function updatePost(
  postId: string,
  patch: DbPostUpdate,
): Promise<DbPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .update(patch)
    .eq('id', postId)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('updatePost failed', { postId, message: error.message });
    return null;
  }
  return data;
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) {
    logger.error('deletePost failed', { postId, message: error.message });
    return false;
  }
  return true;
}
