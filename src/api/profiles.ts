import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  DbUserProfile,
  DbUserProfileInsert,
  DbUserProfileUpdate,
} from '../types/db';

export type SaveProfileResult = {
  ok: boolean;
  data: DbUserProfile | null;
  errorCode?: string;
  errorMessage?: string;
};

export async function getProfileByUserId(
  userId: string,
): Promise<DbUserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logger.warn('getProfileByUserId failed', { userId, message: error.message });
    return null;
  }
  return data;
}

export async function upsertProfile(
  input: DbUserProfileInsert,
): Promise<DbUserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(input, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('upsertProfile failed', { message: error.message });
    return null;
  }
  return data;
}

// 세션 직후 호출 — user_profiles 에 본인 row 가 없으면 빈 row 를 만든다.
// 닉네임/성별/지역 등은 모두 nullable 로 두고 사용자가 추후 ProfileSetupScreen 에서 채운다.
export async function ensureProfile(
  userId: string,
): Promise<DbUserProfile | null> {
  const existing = await getProfileByUserId(userId);
  if (existing) return existing;
  return upsertProfile({ user_id: userId });
}

export async function updateProfile(
  userId: string,
  patch: DbUserProfileUpdate,
): Promise<DbUserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('updateProfile failed', { userId, message: error.message });
    return null;
  }
  return data;
}

// 명시적 select → update / insert 분기.
// upsert(onConflict:'user_id') 는 user_id 에 UNIQUE 제약이 없으면 동작하지 않으며,
// insert 후 .select() 가 RLS 의 SELECT 정책에 막히면 data=null 이라 호출자가 실패로 오인한다.
// 호출자는 ok/errorCode/errorMessage 를 정확히 받아 사용자에게 노출할 수 있다.
export async function saveProfile(
  userId: string,
  patch: Omit<DbUserProfileUpdate, 'id' | 'user_id'>,
): Promise<SaveProfileResult> {
  logger.info('saveProfile begin', { userId });

  const { data: existing, error: selectError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    logger.error('saveProfile select failed', {
      userId,
      code: selectError.code,
      message: selectError.message,
    });
    return {
      ok: false,
      data: null,
      errorCode: selectError.code ?? undefined,
      errorMessage: selectError.message,
    };
  }

  if (existing) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(patch)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();
    if (error) {
      logger.error('saveProfile update failed', {
        userId,
        code: error.code,
        message: error.message,
      });
      return {
        ok: false,
        data: null,
        errorCode: error.code ?? undefined,
        errorMessage: error.message,
      };
    }
    logger.info('saveProfile update ok', { userId, hasReturnedRow: !!data });
    return { ok: true, data };
  }

  // 기존 row 가 없으면 insert
  const insertPayload: DbUserProfileInsert = { ...patch, user_id: userId };
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(insertPayload)
    .select('*')
    .maybeSingle();
  if (error) {
    logger.error('saveProfile insert failed', {
      userId,
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      data: null,
      errorCode: error.code ?? undefined,
      errorMessage: error.message,
    };
  }
  logger.info('saveProfile insert ok', { userId, hasReturnedRow: !!data });
  return { ok: true, data };
}
