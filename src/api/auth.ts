import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

// 이메일 인증 완료 후 앱으로 복귀할 deep link.
// Supabase `auth/v1/callback` 은 OAuth 내부 callback 용도라 이메일 인증 redirect 로 쓰면 안 된다.
// Supabase Dashboard 의 Redirect URLs 에 dulsai://auth-callback 이 등록되어 있어야 한다.
function buildEmailRedirectUrl(): string {
  return 'dulsai://auth-callback';
}

export type AuthResult<T = null> = {
  ok: boolean;
  data: T;
  errorCode?: string;
  errorMessage?: string;
};

// signUpWithEmail 결과 분기.
//  - 'created'                  : 신규 가입, 인증 메일 발송됨 (또는 session 즉시 발급)
//  - 'unverified_resent'        : 같은 이메일로 이전에 가입 시도가 있었지만 미인증 상태였고, 재인증 메일을 자동 발송 성공
//  - 'unverified_resend_failed' : 미인증 상태 + 재발송 실패(rate limit 등)
//  - 'already_registered'       : 이미 인증까지 완료된 이메일
export type SignUpKind =
  | 'created'
  | 'unverified_resent'
  | 'unverified_resend_failed'
  | 'already_registered';

export type SignUpData = {
  session: Session | null;
  user: User | null;
  kind: SignUpKind;
};

// ──────────────────────────────────────────────────────────────────────────
// Email signup / signin
// 가입 시 이메일 인증 메일이 발송된다. 인증 전에는 session 이 발급되지 않음
// (Supabase 프로젝트의 "Confirm email" 설정이 enabled 인 경우).
// ──────────────────────────────────────────────────────────────────────────

export async function signUpWithEmail(args: {
  email: string;
  password: string;
}): Promise<AuthResult<SignUpData>> {
  const emailRedirectTo: string = buildEmailRedirectUrl();
  const email = args.email.trim();
  logger.info('signUpWithEmail begin', { email, emailRedirectTo });
  const { data, error } = await supabase.auth.signUp({
    email,
    password: args.password,
    options: { emailRedirectTo },
  });
  if (error) {
    const errObj = error as {
      status?: number | string;
      code?: string;
      name?: string;
      message: string;
    };
    logger.error('signUpWithEmail failed', {
      email,
      status: errObj.status ?? null,
      code: errObj.code ?? null,
      name: errObj.name ?? null,
      message: errObj.message,
    });
    return {
      ok: false,
      data: { session: null, user: null, kind: 'created' },
      errorCode: String(errObj.status ?? errObj.code ?? ''),
      errorMessage: errObj.message,
    };
  }

  // Supabase 는 가입 성공 응답 안에서 실제 메일 발송 여부를 명시하지 않는다.
  //   - data.user.identities === []      → 같은 이메일로 이전 가입 시도가 있음
  //   - data.user.email_confirmed_at null → 아직 미인증
  //   - data.session null                → 컨펌 대기
  // 이 조합이면 '미인증 가입 대기' 상태로 보고 자동으로 재인증 메일을 발송한다.
  const user = data.user;
  const session = data.session;
  const identitiesCount = user?.identities?.length ?? 0;
  const previouslyAttempted = !!user && identitiesCount === 0;
  const confirmed = !!user?.email_confirmed_at;
  logger.info('signUpWithEmail ok', {
    email,
    hasUser: !!user,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    emailConfirmedAt: user?.email_confirmed_at ?? null,
    confirmationSentAt: user?.confirmation_sent_at ?? null,
    identitiesCount,
    previouslyAttempted,
    confirmed,
    hasSession: !!session,
  });

  if (!previouslyAttempted) {
    return { ok: true, data: { session, user, kind: 'created' } };
  }

  if (confirmed) {
    logger.info('signUpWithEmail: already verified — user should sign in', {
      email,
    });
    return { ok: true, data: { session, user, kind: 'already_registered' } };
  }

  // 미인증 가입 대기 — 재인증 메일 자동 발송.
  logger.info('signUpWithEmail: unverified — auto resending confirmation', {
    email,
  });
  const resend = await resendEmailVerification(email);
  return {
    ok: true,
    data: {
      session,
      user,
      kind: resend.ok ? 'unverified_resent' : 'unverified_resend_failed',
    },
  };
}

export async function signInWithEmail(args: {
  email: string;
  password: string;
}): Promise<AuthResult<{ session: Session | null; user: User | null }>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (error) {
    logger.error('signInWithEmail failed', {
      code: error.status,
      message: error.message,
    });
    return {
      ok: false,
      data: { session: null, user: null },
      errorCode: String(error.status ?? ''),
      errorMessage: error.message,
    };
  }
  return {
    ok: true,
    data: { session: data.session, user: data.user },
  };
}

// 인증 메일 재전송. 'signup' 타입은 가입 직후 메일을 다시 보낸다.
export async function resendEmailVerification(
  email: string,
): Promise<AuthResult> {
  const emailRedirectTo: string = buildEmailRedirectUrl();
  const target = email.trim();
  logger.info('resendEmailVerification begin', {
    email: target,
    emailRedirectTo,
  });
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: target,
    options: { emailRedirectTo },
  });
  if (error) {
    const errObj = error as {
      status?: number | string;
      code?: string;
      name?: string;
      message: string;
    };
    const lowered = (errObj.message ?? '').toLowerCase();
    const rateLimited =
      errObj.status === 429 ||
      lowered.includes('rate') ||
      lowered.includes('only request');
    if (rateLimited) {
      logger.warn('resendEmailVerification maybe rate limited', {
        email: target,
        status: errObj.status ?? null,
        code: errObj.code ?? null,
        message: errObj.message,
      });
    } else {
      logger.warn('resendEmailVerification failed', {
        email: target,
        status: errObj.status ?? null,
        code: errObj.code ?? null,
        name: errObj.name ?? null,
        message: errObj.message,
      });
    }
    return {
      ok: false,
      data: null,
      errorCode: String(errObj.status ?? errObj.code ?? ''),
      errorMessage: errObj.message,
    };
  }
  // resend 응답에는 user/session 이 보통 없음. 도착 여부는 실제 메일함에서 확인.
  logger.info('resendEmailVerification ok', {
    email: target,
    hasData: !!data,
  });
  return { ok: true, data: null };
}

// ──────────────────────────────────────────────────────────────────────────
// Session lifecycle
// ──────────────────────────────────────────────────────────────────────────

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('signOut failed', { message: error.message });
    return { ok: false, data: null, errorMessage: error.message };
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
