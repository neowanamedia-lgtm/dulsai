import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { DbUser, DbUserInsert, DbUserUpdate } from '../types/db';

// public.users.id === auth.users.id 라는 전제 (Supabase Auth 와 직접 매핑).
// 따라서 별도의 auth_id 컬럼 / lookup 은 두지 않는다.
// 로그인된 사용자 자신을 가져오려면 auth.getUser() 의 id 를 그대로 getUserById 에 넘기면 된다.

export async function getUserById(id: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    logger.warn('getUserById failed', { id, message: error.message });
    return null;
  }
  return data;
}

export async function upsertUser(input: DbUserInsert): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .upsert(input)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('upsertUser failed', { message: error.message });
    return null;
  }
  return data;
}

export async function updateUser(
  id: string,
  patch: DbUserUpdate,
): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('updateUser failed', { id, message: error.message });
    return null;
  }
  return data;
}
