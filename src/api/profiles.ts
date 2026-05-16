import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  DbUserProfile,
  DbUserProfileInsert,
  DbUserProfileUpdate,
} from '../types/db';

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
