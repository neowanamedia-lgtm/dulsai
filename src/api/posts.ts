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

export async function createPost(input: DbPostInsert): Promise<DbPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert(input)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('createPost failed', { message: error.message });
    return null;
  }
  return data;
}

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
