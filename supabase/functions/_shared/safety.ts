// DulSai 서버 측 안전 필터 — Edge Function 공유 모듈.
//
// src/safety/detectors.ts 와 동일 정책. RN 빌드와 Deno 빌드가 모듈을 공유하기 어려운 환경이라
// 의도적으로 미러링한다. 정책 변경 시 두 파일을 같이 업데이트해야 한다.
//
// 차단 대상 (Edge Function 강제):
//   contact      — phone / email / kakao / instagram / telegram
//   harassment   — threat / sexual_harassment / meet_pressure
//   critical     — csam / self_harm_incite / hate_crime
//
// 일반 감정 표현·약한 비속어·본인 정보 자발 언급은 통과 — 사용자 신고/차단으로 처리.

export type ServerViolationKind =
  | 'phone'
  | 'email'
  | 'kakao'
  | 'instagram'
  | 'telegram'
  | 'threat'
  | 'sexual_harassment'
  | 'meet_pressure'
  | 'csam'
  | 'self_harm_incite'
  | 'hate_crime';

export type ServerViolationCategory = 'contact' | 'harassment' | 'critical';

const CATEGORY_BY_KIND: Record<ServerViolationKind, ServerViolationCategory> = {
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

const HINTS: Record<ServerViolationCategory, string> = {
  contact:
    '외부 연락처는 이 화면에서 어려워요. DulSai 안에서 천천히 이어가 주세요.',
  harassment:
    '이 표현은 보낼 수 없어요. 다른 말로 바꿔서 다시 시도해 주세요.',
  critical: '이 표현은 보낼 수 없습니다.',
};

// ── 패턴 ────────────────────────────────────────────────────────────────
const PHONE_RE =
  /(?:\+\d{1,3}[\s.\-]*)?0\d{1,2}[\s.\-]*\d{3,4}[\s.\-]*\d{4}/g;
const LONG_DIGIT_RE = /(?:\d[\s.\-]?){9,}\d/g;
const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[\w.\-]+/g;
const KAKAO_RE = /카(?:카오)?\s*톡|kakao\s*talk|오픈\s*(?:카톡|채팅)/i;
const INSTAGRAM_RE = /인스타(?:그램)?|instagram(?!\w)/i;
const TELEGRAM_RE = /텔레그램|telegram(?!\w)/i;
const HANDLE_RE = /@[\w.]{2,}/;

const THREAT_WORDS = [
  '죽인다',
  '죽일',
  '죽여',
  '죽여버',
  '때린다',
  '패버린다',
  '패죽',
  '찾아간다',
  '찾아갈',
  '쳐들어',
  '가만 안',
  '집 앞',
  '쫓아간다',
];

const SEXUAL_HARASS_WORDS = [
  '몸 사진',
  '몸사진',
  '얼굴 사진 보내',
  '얼굴사진 보내',
  '벗어 봐',
  '벗어봐',
  '벗고',
  '가슴 사진',
  '가슴사진',
  '엉덩이 사진',
  '엉덩이사진',
  '섹스하자',
  '자위',
  '야동',
];

const MEET_PRESSURE_RE =
  /(?:지금|당장|오늘\s*꼭|바로)\s*[^\n]{0,6}만나|왜\s*안\s*만나|꼭\s*나와|당장\s*나와/;

const CSAM_DIRECT_WORDS = [
  '롤리타',
  '로리타',
  'lolita',
  'loli',
  'shota',
  '미성년 야동',
  '미성년자 야동',
  '청소년 야동',
  '학생 야동',
  '아동 야동',
  '아동 포르노',
  'child porn',
];
const CSAM_COMBO_RE =
  /(?:1[0-7]|초딩|중딩|고딩|초등학생|중학생|고등학생|미성년)\s*(?:살|세|학년|딩|짜리)?[\s\S]{0,12}(?:야동|벗|섹스|성관계|자위|음란|꼴리)/i;

const SELF_HARM_INCITE_WORDS = [
  '자살해',
  '자살이나 해',
  '뒤져버려',
  '뒈져버려',
  '죽어버려',
  '뛰어내려',
  '목매달아',
  '약 먹고 죽',
];

const HATE_CRIME_RE =
  /(?:조선족|중국인|일본인|유대인|이슬람|무슬림|흑인|게이|레즈비언|트랜스(?:젠더)?|여자|남자|장애인|난민)\s*(?:다|들)?\s*(?:죽이|없애|싹\s*다|쓸어|쳐\s*죽)/i;

// ── helpers ─────────────────────────────────────────────────────────────
function normalize(text: string): string {
  return text.normalize('NFKC').replace(/[​-‍﻿]/g, '');
}
function findKeyword(
  text: string,
  words: ReadonlyArray<string>,
): string | null {
  const lower = text.toLowerCase();
  for (const w of words) if (lower.includes(w.toLowerCase())) return w;
  return null;
}

// ── 통합 ────────────────────────────────────────────────────────────────
export type ServerViolation = {
  kind: ServerViolationKind;
  category: ServerViolationCategory;
};

function detectAll(text: string): ServerViolation[] {
  const t = normalize(text);
  const out: ServerViolation[] = [];

  const push = (kind: ServerViolationKind) =>
    out.push({ kind, category: CATEGORY_BY_KIND[kind] });

  if (PHONE_RE.test(t) || LONG_DIGIT_RE.test(t)) push('phone');
  if (EMAIL_RE.test(t)) push('email');
  if (KAKAO_RE.test(t)) push('kakao');
  if (INSTAGRAM_RE.test(t)) push('instagram');
  else if (HANDLE_RE.test(t) && /인스타|insta|ig\b/i.test(t)) push('instagram');
  if (TELEGRAM_RE.test(t)) push('telegram');
  else if (HANDLE_RE.test(t) && /텔레|tele|tg\b/i.test(t)) push('telegram');

  if (findKeyword(t, THREAT_WORDS)) push('threat');
  if (findKeyword(t, SEXUAL_HARASS_WORDS)) push('sexual_harassment');
  if (MEET_PRESSURE_RE.test(t)) push('meet_pressure');

  if (findKeyword(t, CSAM_DIRECT_WORDS) || CSAM_COMBO_RE.test(t)) push('csam');
  if (findKeyword(t, SELF_HARM_INCITE_WORDS)) push('self_harm_incite');
  if (HATE_CRIME_RE.test(t)) push('hate_crime');

  return out;
}

export type ServerSafetyResult =
  | { ok: true }
  | {
      ok: false;
      category: ServerViolationCategory;
      kinds: ServerViolationKind[];
      hint: string;
    };

export function checkSafetyServer(text: string): ServerSafetyResult {
  const v = detectAll(text);
  if (v.length === 0) return { ok: true };

  const order: ServerViolationCategory[] = [
    'critical',
    'harassment',
    'contact',
  ];
  let primary: ServerViolationCategory = v[0].category;
  for (const c of order) {
    if (v.some((x) => x.category === c)) {
      primary = c;
      break;
    }
  }
  return {
    ok: false,
    category: primary,
    kinds: v.map((x) => x.kind),
    hint: HINTS[primary],
  };
}
