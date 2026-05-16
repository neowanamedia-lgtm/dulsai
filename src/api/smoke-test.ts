// 개발용 read-only smoke test.
// select/limit 만 사용 (insert/update/delete 없음, head:true 도 사용하지 않는다 — 일부 환경에서 빈 error 객체를 반환하는 이슈가 있어 일반 select 로 대체).
// 정상 기준은 다음 중 하나:
//   - error 가 null/undefined 이고 data 가 array 인 경우
//   - error 가 명확한 code (42501 / 42703 / 42P01 등) 를 가진 경우
// 그 외 빈 error 객체는 unknown 으로 분류하고 raw payload 를 logger 로 남긴다.

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { Database } from '../types/db';

type SmokeTable = keyof Database['public']['Tables'];

const SMOKE_TABLES: ReadonlyArray<SmokeTable> = [
  'users',
  'user_profiles',
  'profile_photos',
  'posts',
  'post_comments',
];

export type SmokeStatus =
  | 'ok'
  | 'rls_blocked'
  | 'schema_mismatch'
  | 'table_missing'
  | 'unknown';

export type SmokeResult = {
  table: SmokeTable;
  status: SmokeStatus;
  rows: number | null;
  code: string | null;
  message: string | null;
  raw: unknown;
};

export async function runSupabaseSmokeTests(): Promise<SmokeResult[]> {
  if (!isSupabaseConfigured()) {
    logger.warn('smoke test skipped (Supabase not configured)');
    return [];
  }

  logger.info('smoke test start', { tables: SMOKE_TABLES.length });
  const results: SmokeResult[] = [];
  for (const table of SMOKE_TABLES) {
    results.push(await runOne(table));
  }

  const summary = results.reduce<Record<SmokeStatus, number>>(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    {
      ok: 0,
      rls_blocked: 0,
      schema_mismatch: 0,
      table_missing: 0,
      unknown: 0,
    },
  );
  logger.info('smoke test done', summary);
  return results;
}

async function runOne(table: SmokeTable): Promise<SmokeResult> {
  try {
    const { data, error } = await supabase.from(table).select('id').limit(1);

    // 정상: error 가 명확히 비어 있고 data 가 array.
    if (!error && Array.isArray(data)) {
      logger.info('smoke test ok', { table, rows: data.length });
      return {
        table,
        status: 'ok',
        rows: data.length,
        code: null,
        message: null,
        raw: null,
      };
    }

    const code = readErrorCode(error);
    const message = readErrorMessage(error);

    if (code === '42501') {
      logger.warn('smoke test blocked by RLS', { table, code, message });
      return wrap(table, 'rls_blocked', code, message, error);
    }
    if (code === '42703') {
      logger.warn('smoke test schema mismatch', { table, code, message });
      return wrap(table, 'schema_mismatch', code, message, error);
    }
    if (code === '42P01') {
      logger.warn('smoke test table missing', { table, code, message });
      return wrap(table, 'table_missing', code, message, error);
    }

    // 그 외: error 가 객체이긴 한데 code/message 가 비어있는 케이스 포함.
    // 단순 warn 으로 끝내지 않고, raw 를 통째로 남긴다.
    logger.error('smoke test unknown error with raw payload', {
      table,
      code,
      message,
      raw: safeRaw(error),
      hasData: data !== undefined,
      dataIsArray: Array.isArray(data),
    });
    return wrap(table, 'unknown', code, message, error);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('smoke test threw', { table, message, raw: safeRaw(err) });
    return wrap(table, 'unknown', 'EXCEPTION', message, err);
  }
}

function wrap(
  table: SmokeTable,
  status: SmokeStatus,
  code: string | null,
  message: string | null,
  raw: unknown,
): SmokeResult {
  return { table, status, rows: null, code, message, raw };
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

// logger 출력용 안전 직렬화 — 순환참조 방지.
function safeRaw(err: unknown): unknown {
  if (err === null || err === undefined) return err;
  if (typeof err !== 'object') return err;
  try {
    const obj = err as Record<string, unknown>;
    return {
      keys: Object.keys(obj),
      name: obj.name ?? null,
      code: obj.code ?? null,
      message: obj.message ?? null,
      details: obj.details ?? null,
      hint: obj.hint ?? null,
      status: obj.status ?? null,
      statusText: obj.statusText ?? null,
    };
  } catch {
    return String(err);
  }
}
