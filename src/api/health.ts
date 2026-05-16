import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type HealthResult = {
  configured: boolean;
  reachable: boolean;
  hasSession: boolean;
};

// 앱 부팅 시 한 번 호출. 사용자 노출 없이 logger 만 남긴다.
// head:true / count:exact 는 일부 환경에서 빈 error 객체를 반환하는 케이스가 있어 일반 select 로 검증한다.
export async function checkSupabaseHealth(): Promise<HealthResult> {
  const configured = isSupabaseConfigured();
  if (!configured) {
    logger.warn('Supabase health skipped (not configured)');
    return { configured: false, reachable: false, hasSession: false };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const { data: sessionData } = await supabase.auth.getSession();
    const hasSession = !!sessionData.session;

    const code = readErrorCode(error);
    const message = readErrorMessage(error);
    const ok = !error && Array.isArray(data);

    // 의미 있는 error code 가 있을 때만 warn.
    if (!ok && (code || message)) {
      logger.warn('Supabase schema query returned error', { code, message });
    }

    logger.info('Supabase health ok', {
      hasSession,
      schemaErr: code,
    });

    return { configured: true, reachable: true, hasSession };
  } catch (err) {
    logger.error('Supabase health failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    return { configured: true, reachable: false, hasSession: false };
  }
}

function readErrorCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'code' in err) {
    const v = (err as { code?: unknown }).code;
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

function readErrorMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'message' in err) {
    const v = (err as { message?: unknown }).message;
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}
