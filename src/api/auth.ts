import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type AuthResult<T = null> = {
  ok: boolean;
  data: T;
  errorCode?: string;
};

// Phone OTP 발송. 사용자에게 보여지는 메시지는 호출 측에서 일반화한다.
export async function requestPhoneOtp(
  fullPhoneNumber: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({
    phone: fullPhoneNumber,
  });
  if (error) {
    logger.error('requestPhoneOtp failed', {
      code: error.status,
      message: error.message,
    });
    return { ok: false, data: null, errorCode: String(error.status ?? '') };
  }
  return { ok: true, data: null };
}

export async function verifyPhoneOtp(
  fullPhoneNumber: string,
  token: string,
): Promise<AuthResult<{ session: Session | null; user: User | null }>> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: fullPhoneNumber,
    token,
    type: 'sms',
  });
  if (error) {
    logger.error('verifyPhoneOtp failed', {
      code: error.status,
      message: error.message,
    });
    return {
      ok: false,
      data: { session: null, user: null },
      errorCode: String(error.status ?? ''),
    };
  }
  return {
    ok: true,
    data: { session: data.session, user: data.user },
  };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('signOut failed', { message: error.message });
    return { ok: false, data: null };
  }
  return { ok: true, data: null };
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logger.warn('getCurrentSession error', { message: error.message });
    return null;
  }
  return data.session;
}

export function subscribeAuthChanges(
  cb: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session);
  });
  return () => data.subscription.unsubscribe();
}
