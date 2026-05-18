// 계정 탈퇴 — Supabase Edge Function `delete-account` 호출.
// service_role 키는 서버에만 두고, 클라이언트는 functions.invoke 만 사용한다.

import { supabase } from '../lib/supabase';
import { logger } from './../lib/logger';

export type DeleteAccountResult = {
  ok: boolean;
  errorMessage?: string;
  errorCode?: string;
};

export async function deleteAccount(): Promise<DeleteAccountResult> {
  logger.info('deleteAccount begin');
  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });
  if (error) {
    logger.error('deleteAccount invoke failed', {
      name: error.name,
      message: error.message,
    });
    return {
      ok: false,
      errorCode: error.name,
      errorMessage: error.message,
    };
  }
  const payload = (data ?? {}) as {
    ok?: boolean;
    error?: string;
    message?: string;
    stepErrors?: Array<{ step: string; message: string }>;
  };
  if (!payload.ok) {
    logger.error('deleteAccount returned error payload', {
      error: payload.error,
      message: payload.message,
      stepErrors: payload.stepErrors,
    });
    return {
      ok: false,
      errorCode: payload.error,
      errorMessage: payload.message ?? payload.error ?? 'unknown',
    };
  }
  if (payload.stepErrors && payload.stepErrors.length > 0) {
    logger.warn('deleteAccount completed with partial step errors', {
      stepErrors: payload.stepErrors,
    });
  }
  logger.info('deleteAccount ok');
  return { ok: true };
}
