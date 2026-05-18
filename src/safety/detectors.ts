// DulSai 1차 안전 검출기.
//
// 정책: "최소 AI 개입 + 사용자 신고/차단 중심".
// - 자동 차단 = 외부 연락처 교환 / 위협·노골 성희롱·만남 압박 / CSAM·자해 유도·범죄성 혐오 (3그룹)
// - 일반 감정 표현, 약한 욕설, 본인 정보 자발 언급은 통과 (사용자 신고에 위임)
//
// 클라이언트와 Edge Function (`supabase/functions/_shared/safety.ts`) 양쪽에서 동일 정책으로 사용.

import type { Violation, ViolationKind } from './types';
import { CATEGORY_BY_KIND } from './types';

// ──────────────────────────────────────────────────────────────────────────
// contact: phone / email / SNS 유도
// 외부로 대화를 빼내려는 시도만 좁게 잡는다.
// ──────────────────────────────────────────────────────────────────────────

const PHONE_RE =
  /(?:\+\d{1,3}[\s.\-]*)?0\d{1,2}[\s.\-]*\d{3,4}[\s.\-]*\d{4}/g;
const LONG_DIGIT_RE = /(?:\d[\s.\-]?){9,}\d/g;

const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[\w.\-]+/g;

const KAKAO_RE = /카(?:카오)?\s*톡|kakao\s*talk|오픈\s*(?:카톡|채팅)/i;
const INSTAGRAM_RE = /인스타(?:그램)?|instagram(?!\w)/i;
const TELEGRAM_RE = /텔레그램|telegram(?!\w)/i;
const HANDLE_RE = /@[\w.]{2,}/;

// ──────────────────────────────────────────────────────────────────────────
// harassment: threat / sexual_harassment / meet_pressure
// "다른 사람을 직접 해치거나 보낼 수 없는 표현" 만.
// 일반적인 의견 충돌, 가벼운 비속어는 통과시킨다.
// ──────────────────────────────────────────────────────────────────────────

// 위협·스토킹성 — 명령형/2인칭 대상이 명확한 경우.
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

// 노골적 성희롱 — 1인칭 자기표현이 아니라 상대를 향한 요구·노출 요구.
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

// 만남 압박 — "지금 당장" 류 강요만.
const MEET_PRESSURE_RE =
  /(?:지금|당장|오늘\s*꼭|바로)\s*[^\n]{0,6}만나|왜\s*안\s*만나|꼭\s*나와|당장\s*나와/;

// ──────────────────────────────────────────────────────────────────────────
// critical: CSAM / 자해 유도 / 범죄성 혐오
// 무관용. 한 건만 잡혀도 hard severity.
// ──────────────────────────────────────────────────────────────────────────

// CSAM — 미성년자 + 성적 표현 조합. 한국어/영어 모두.
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
// 나이/학년 + 성적 단어 조합.
const CSAM_COMBO_RE =
  /(?:1[0-7]|초딩|중딩|고딩|초등학생|중학생|고등학생|미성년)\s*(?:살|세|학년|딩|짜리)?[\s\S]{0,12}(?:야동|벗|섹스|성관계|자위|음란|꼴리)/i;

// 자해/자살 "유도" — 본인 토로("죽고 싶어")는 차단 X. 타인에게 명령/유도하는 표현만.
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

// 범죄성 혐오 — "[집단] + 죽이자/없애자/추방하자" 식 선동성만. 매우 좁게.
const HATE_CRIME_RE =
  /(?:조선족|중국인|일본인|유대인|이슬람|무슬림|흑인|게이|레즈비언|트랜스(?:젠더)?|여자|남자|장애인|난민)\s*(?:다|들)?\s*(?:죽이|없애|싹\s*다|쓸어|쳐\s*죽)/i;

// ──────────────────────────────────────────────────────────────────────────
// 개별 detector — 모두 매칭된 단편(string)을 반환하거나 null.
// ──────────────────────────────────────────────────────────────────────────

export function detectPhoneNumber(text: string): string | null {
  const m = text.match(PHONE_RE) || text.match(LONG_DIGIT_RE);
  return m ? m[0] : null;
}

export function detectEmail(text: string): string | null {
  const m = text.match(EMAIL_RE);
  return m ? m[0] : null;
}

export function detectKakao(text: string): string | null {
  return KAKAO_RE.test(text) ? matchedFragment(text, KAKAO_RE) : null;
}

export function detectInstagram(text: string): string | null {
  if (INSTAGRAM_RE.test(text)) return matchedFragment(text, INSTAGRAM_RE);
  const handle = text.match(HANDLE_RE);
  if (handle && /인스타|insta|ig\b/i.test(text)) return handle[0];
  return null;
}

export function detectTelegram(text: string): string | null {
  if (TELEGRAM_RE.test(text)) return matchedFragment(text, TELEGRAM_RE);
  const handle = text.match(HANDLE_RE);
  if (handle && /텔레|tele|tg\b/i.test(text)) return handle[0];
  return null;
}

export function detectThreat(text: string): string | null {
  return findKeyword(text, THREAT_WORDS);
}

export function detectSexualHarassment(text: string): string | null {
  return findKeyword(text, SEXUAL_HARASS_WORDS);
}

export function detectMeetPressure(text: string): string | null {
  return MEET_PRESSURE_RE.test(text)
    ? matchedFragment(text, MEET_PRESSURE_RE)
    : null;
}

export function detectCsam(text: string): string | null {
  const direct = findKeyword(text, CSAM_DIRECT_WORDS);
  if (direct) return direct;
  if (CSAM_COMBO_RE.test(text)) return matchedFragment(text, CSAM_COMBO_RE);
  return null;
}

export function detectSelfHarmIncite(text: string): string | null {
  return findKeyword(text, SELF_HARM_INCITE_WORDS);
}

export function detectHateCrime(text: string): string | null {
  return HATE_CRIME_RE.test(text) ? matchedFragment(text, HATE_CRIME_RE) : null;
}

// ──────────────────────────────────────────────────────────────────────────
// 통합
// ──────────────────────────────────────────────────────────────────────────

type DetectorEntry = {
  kind: ViolationKind;
  fn: (text: string) => string | null;
};

const DETECTORS: ReadonlyArray<DetectorEntry> = [
  // contact
  { kind: 'phone', fn: detectPhoneNumber },
  { kind: 'email', fn: detectEmail },
  { kind: 'kakao', fn: detectKakao },
  { kind: 'instagram', fn: detectInstagram },
  { kind: 'telegram', fn: detectTelegram },
  // harassment
  { kind: 'threat', fn: detectThreat },
  { kind: 'sexual_harassment', fn: detectSexualHarassment },
  { kind: 'meet_pressure', fn: detectMeetPressure },
  // critical
  { kind: 'csam', fn: detectCsam },
  { kind: 'self_harm_incite', fn: detectSelfHarmIncite },
  { kind: 'hate_crime', fn: detectHateCrime },
];

export function detectAll(text: string): Violation[] {
  const normalized = normalize(text);
  const violations: Violation[] = [];
  for (const { kind, fn } of DETECTORS) {
    const matched = fn(normalized);
    if (matched) {
      violations.push({
        kind,
        category: CATEGORY_BY_KIND[kind],
        matched,
      });
    }
  }
  return violations;
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  // NFKC 정규화 + 0-width 문자 제거. 추후 자모 분리/leet 정규화 보강 여지.
  return text.normalize('NFKC').replace(/[​-‍﻿]/g, '');
}

function findKeyword(
  text: string,
  words: ReadonlyArray<string>,
): string | null {
  const lower = text.toLowerCase();
  for (const w of words) {
    if (lower.includes(w.toLowerCase())) return w;
  }
  return null;
}

function matchedFragment(text: string, re: RegExp): string {
  const m = text.match(re);
  return m ? m[0] : '';
}
