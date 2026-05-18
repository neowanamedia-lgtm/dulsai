// DulSai 안전 엔진 진입점.
// checkSafety() 는 클라이언트/서버 어디서든 동일하게 호출 가능한 순수 함수.
// 누적 카운트 / moderation 로그는 인메모리 stub — 추후 Supabase moderation_logs 와 연결.

import { detectAll } from './detectors';
import { getSafetyHint } from './messages';
import { logger } from '../lib/logger';
import {
  CRITICAL_CATEGORIES,
  EXCERPT_MAX_LEN,
  HARD_SEVERITY_PER_MESSAGE,
  VIOLATION_BLOCK_THRESHOLD,
  type ModerationLogEntry,
  type SafetyContext,
  type SafetyResult,
  type SafetySeverity,
  type Violation,
  type ViolationCategory,
} from './types';

// 단일 텍스트 검사. 사용자 노출 메시지는 hint 한 줄.
export function checkSafety(
  text: string,
  context: SafetyContext = 'message',
): SafetyResult {
  const violations = detectAll(text);
  if (violations.length === 0) {
    return {
      ok: true,
      violations: [],
      category: null,
      severity: 'soft',
      hint: null,
    };
  }
  const category = pickPrimaryCategory(violations);
  const isCritical = CRITICAL_CATEGORIES.includes(category);
  const severity: SafetySeverity =
    isCritical || violations.length >= HARD_SEVERITY_PER_MESSAGE
      ? 'hard'
      : 'soft';
  const hint = getSafetyHint(category);

  logger.warn('safety violation', {
    context,
    kinds: violations.map((v) => v.kind),
    category,
    severity,
  });

  return {
    ok: false,
    violations,
    category,
    severity,
    hint,
  };
}

function pickPrimaryCategory(violations: Violation[]): ViolationCategory {
  // critical > harassment > contact 순으로 우선.
  const order: ViolationCategory[] = ['critical', 'harassment', 'contact'];
  for (const c of order) {
    if (violations.some((v) => v.category === c)) return c;
  }
  return violations[0].category;
}

// ──────────────────────────────────────────────────────────────────────────
// 누적 위반 카운트 / 일시 정지 (인메모리)
// 추후 서버 영속화 시 이 모듈만 교체.
// ──────────────────────────────────────────────────────────────────────────

const violationCounts = new Map<string, number>();
const writeBlockUntil = new Map<string, number>();
const moderationLog: ModerationLogEntry[] = [];

// 한 번에 카운트 + 로그 기록을 처리하는 통합 진입점.
// 원문(rawText) 은 보관하지 않고 excerpt 와 contentHash 로 압축한다.
export function reportViolation(args: {
  userId: string;
  context: SafetyContext;
  result: SafetyResult;
  rawText: string;
  weight?: number;
}): { count: number; blocked: boolean } {
  const { userId, context, result, rawText } = args;
  const weight = args.weight ?? 1;

  if (result.ok || !result.category) {
    return {
      count: getViolationCount(userId),
      blocked: isWriteBlocked(userId),
    };
  }

  const entry: ModerationLogEntry = {
    userId,
    context,
    kinds: result.violations.map((v) => v.kind),
    category: result.category,
    severity: result.severity,
    excerpt: makeExcerpt(rawText, EXCERPT_MAX_LEN),
    contentHash: simpleHash(rawText),
    createdAt: new Date().toISOString(),
  };
  moderationLog.push(entry);

  const cur = violationCounts.get(userId) ?? 0;
  const next = cur + weight;
  violationCounts.set(userId, next);
  if (next >= VIOLATION_BLOCK_THRESHOLD) {
    // 10 분 일시 정지 (UI 연결은 다음 단계).
    writeBlockUntil.set(userId, Date.now() + 10 * 60 * 1000);
  }

  return { count: next, blocked: isWriteBlocked(userId) };
}

export function getViolationCount(userId: string): number {
  return violationCounts.get(userId) ?? 0;
}

export function isWriteBlocked(userId: string): boolean {
  const until = writeBlockUntil.get(userId);
  if (!until) return false;
  if (Date.now() >= until) {
    writeBlockUntil.delete(userId);
    return false;
  }
  return true;
}

export function getWriteBlockRemainingMs(userId: string): number {
  const until = writeBlockUntil.get(userId);
  if (!until) return 0;
  return Math.max(0, until - Date.now());
}

// 디버그/서버 동기화용 — 인메모리 로그 스냅샷.
export function snapshotModerationLog(): ReadonlyArray<ModerationLogEntry> {
  return moderationLog.slice();
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────

function makeExcerpt(s: string, max: number): string {
  const cleaned = s.replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return '';
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max) + '…';
}

// 단순 FNV-1a 32bit. 식별용도 아닌 중복 탐지/그룹화용.
function simpleHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
