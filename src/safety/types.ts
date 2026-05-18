// DulSai 안전/차단 엔진 타입.
// 정책 방향: "최소 AI 개입 + 사용자 신고/차단 중심".
// 자동 차단은 ① 외부 연락처 교환  ② 위협/스토킹·노골적 성희롱·만남 압박  ③ 무관용(CSAM/자해 유도/범죄성 혐오)
// 의 3개 카테고리만 둔다. 일반 감정 표현 / 약한 욕설 / 본인 거주지·직장 자발적 언급 등은 사용자 신고로 위임.

export type ViolationKind =
  // contact — 외부로 대화를 빼내려는 시도
  | 'phone'
  | 'email'
  | 'kakao'
  | 'instagram'
  | 'telegram'
  // harassment — 보낼 수 없는 표현
  | 'threat'
  | 'sexual_harassment'
  | 'meet_pressure'
  // critical — 무관용. 차단 + (운영 기록 + 자동 신고)
  | 'csam'
  | 'self_harm_incite'
  | 'hate_crime';

export type ViolationCategory =
  | 'contact'
  | 'harassment'
  | 'critical';

export type Violation = {
  kind: ViolationKind;
  category: ViolationCategory;
  matched: string; // 디버그/로그용 매칭 단편 (사용자에게는 보여주지 않음)
};

export type SafetyContext = 'post' | 'reply' | 'invite' | 'message';

// soft: 일반 안내, hard: 무관용. critical 카테고리는 항상 hard.
export type SafetySeverity = 'soft' | 'hard';

export type SafetyResult = {
  ok: boolean;
  violations: Violation[];
  category: ViolationCategory | null;
  severity: SafetySeverity;
  hint: string | null; // 사용자에게 보여줄 한 줄
};

export const CATEGORY_BY_KIND: Record<ViolationKind, ViolationCategory> = {
  phone: 'contact',
  email: 'contact',
  kakao: 'contact',
  instagram: 'contact',
  telegram: 'contact',
  threat: 'harassment',
  sexual_harassment: 'harassment',
  meet_pressure: 'harassment',
  csam: 'critical',
  self_harm_incite: 'critical',
  hate_crime: 'critical',
};

// 누적 카운트 정책 — "최소 제재" 방향에 맞춰 자동 정지 임계를 보수적으로 둔다.
// 운영은 신고/차단 기반이 우선이고, 누적 정지는 봇/명백한 악용자 대응용으로만 동작한다.
export const VIOLATION_BLOCK_THRESHOLD = 8;
// 단일 메시지에서 여러 detector 가 동시에 잡히면 즉시 hard.
export const HARD_SEVERITY_PER_MESSAGE = 2;
// critical 카테고리는 단 1건이라도 hard.
export const CRITICAL_CATEGORIES: ReadonlyArray<ViolationCategory> = ['critical'];

// moderation_logs 로 보낼 최소형 엔트리.
// 원문은 보관하지 않는다 — 24자 이내 snippet + contentHash 만.
export type ModerationLogEntry = {
  userId: string;
  context: SafetyContext;
  kinds: ViolationKind[];
  category: ViolationCategory;
  severity: SafetySeverity;
  excerpt: string | null;
  contentHash: string;
  createdAt: string;
};

export const EXCERPT_MAX_LEN = 24;
