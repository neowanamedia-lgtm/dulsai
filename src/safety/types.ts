// DulSai 안전/차단 엔진 타입.
// rule 기반(regex + keyword) 1차 차단을 위한 공통 타입.

export type ViolationKind =
  | 'phone'
  | 'email'
  | 'kakao'
  | 'instagram'
  | 'telegram'
  | 'address'
  | 'school'
  | 'workplace'
  | 'residence'
  | 'age_disclosure'
  | 'harassment'
  | 'profanity'
  | 'threat'
  | 'meet_pressure';

export type ViolationCategory =
  | 'contact' // phone / email / sns id
  | 'identity' // address / school / workplace / residence / age
  | 'toxic' // harassment / profanity / threat
  | 'pressure'; // meet_pressure

export type Violation = {
  kind: ViolationKind;
  category: ViolationCategory;
  matched: string; // 디버그/로그용 매칭 단편 (사용자에게는 보여주지 않음)
};

export type SafetyContext = 'post' | 'reply' | 'invite' | 'message';

export type SafetySeverity = 'soft' | 'hard';

export type SafetyResult = {
  ok: boolean;
  violations: Violation[];
  category: ViolationCategory | null;
  severity: SafetySeverity;
  hint: string | null; // 사용자에게 보여줄 부드러운 한 줄
};

export const CATEGORY_BY_KIND: Record<ViolationKind, ViolationCategory> = {
  phone: 'contact',
  email: 'contact',
  kakao: 'contact',
  instagram: 'contact',
  telegram: 'contact',
  address: 'identity',
  school: 'identity',
  workplace: 'identity',
  residence: 'identity',
  age_disclosure: 'identity',
  harassment: 'toxic',
  profanity: 'toxic',
  threat: 'toxic',
  meet_pressure: 'pressure',
};

// 누적 카운트가 이 값 이상이면 작성 일시 정지 검토.
export const VIOLATION_BLOCK_THRESHOLD = 5;
// 단일 메시지에서 이만큼 잡히면 즉시 hard 등급.
export const HARD_SEVERITY_PER_MESSAGE = 3;

// moderation_logs 로 보낼 최소형 엔트리.
// 원문은 보관하지 않는다 — 24자 이내 snippet + contentHash 만 남긴다.
export type ModerationLogEntry = {
  userId: string;
  context: SafetyContext;
  kinds: ViolationKind[];
  category: ViolationCategory;
  severity: SafetySeverity;
  excerpt: string | null; // 최대 EXCERPT_MAX_LEN 자, 공백 정리됨
  contentHash: string; // 동일 본문 중복 탐지용 단순 hash (개인정보 식별 불가)
  createdAt: string; // ISO
};

export const EXCERPT_MAX_LEN = 24;
