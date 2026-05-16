// DulSai 1차 안전 검출기.
// rule 기반(regex + keyword). false positive 를 줄이기 위해
// 명확한 패턴만 잡고 모호한 표현은 통과시킨다.
// 서버 측에서 동일 정책을 다시 적용할 수 있도록 순수 함수로 작성.

import type { Violation, ViolationKind } from './types';
import { CATEGORY_BY_KIND } from './types';

// ──────────────────────────────────────────────────────────────────────────
// contact: phone / email / SNS id
// ──────────────────────────────────────────────────────────────────────────

// 한국 휴대폰: 010-xxxx-xxxx / 0212345678 / +82 10 ... 등
const PHONE_RE =
  /(?:\+\d{1,3}[\s.\-]*)?0\d{1,2}[\s.\-]*\d{3,4}[\s.\-]*\d{4}/g;
// 7자리 이상 연속 숫자(구분자 허용) — 가격 등과 충돌하지 않게 9자리 이상으로 보수적으로.
const LONG_DIGIT_RE = /(?:\d[\s.\-]?){9,}\d/g;

const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[\w.\-]+/g;

// SNS — 단순 키워드 + "아이디/id" 컨텍스트 또는 @ 핸들로 좁힌다.
const KAKAO_RE = /카(?:카오)?\s*톡|kakao\s*talk|오픈\s*(?:카톡|채팅)/i;
const INSTAGRAM_RE = /인스타(?:그램)?|instagram(?!\w)/i;
const TELEGRAM_RE = /텔레그램|telegram(?!\w)/i;
const HANDLE_RE = /@[\w.]{2,}/;

// ──────────────────────────────────────────────────────────────────────────
// identity: address / school / workplace / residence / age
// ──────────────────────────────────────────────────────────────────────────

// "OO대학교 / OO고등학교 / OO중학교 / OO초등학교"
const SCHOOL_RE = /[가-힣A-Za-z]{1,12}(?:대학교|대학원|고등학교|중학교|초등학교|여자고|여중|여고)/;
// "OO 회사 / 주식회사 OO / OO 연구소 / OO 병원"
const WORKPLACE_RE =
  /(?:주식\s*회사\s*[가-힣A-Za-z]{1,16}|[가-힣A-Za-z]{1,16}\s*(?:주식\s*회사|연구소|병원|로펌|법인))/;
// "OO동 123-45" / "OO로 12길 5" 등 구체 거주지.
const ADDRESS_RE =
  /[가-힣]{1,10}(?:로|길)\s*\d{1,4}(?:[가-힣\d-]+)?|[가-힣]{1,10}동\s*\d{1,4}(?:[\-\d]+)?/;
// 광역 + 구체 동 단위.
const RESIDENCE_RE =
  /(?:서울|부산|대구|광주|대전|울산|세종|인천|경기|강원|충북|충남|전북|전남|경북|경남|제주)[\s가-힣]{0,8}(?:시|구|군|동)/;
// "23살 / 25세 / 만 30세" — 단, "23명" 등은 제외.
const AGE_RE = /(?:만\s*)?\d{1,2}\s*(?:살|세)(?!\w)/;

// ──────────────────────────────────────────────────────────────────────────
// toxic: harassment / profanity / threat
// 명백한 표현 최소 셋트만 두고, 모호한 단어는 통과 (false positive 방지).
// ──────────────────────────────────────────────────────────────────────────

const PROFANITY_WORDS = [
  '시발',
  '씨발',
  'ㅅㅂ',
  '씨1발',
  '병신',
  'ㅂㅅ',
  '존나',
  '좆',
  '개새',
  '미친년',
  '미친놈',
  '꺼져',
  'fuck',
  'fck',
  'shit',
  'bitch',
];

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
];

const HARASSMENT_WORDS = [
  '몸매',
  '가슴',
  '엉덩이',
  '벗어',
  '벗고',
  '섹스',
  '야동',
  '자위',
  '몸 사진',
  '얼굴 사진 보내',
];

// ──────────────────────────────────────────────────────────────────────────
// pressure: meet_pressure
// "지금 당장 만나" 류만 좁게 잡는다.
// ──────────────────────────────────────────────────────────────────────────

const MEET_PRESSURE_RE =
  /(?:지금|당장|오늘\s*꼭|바로)\s*[^\n]{0,6}만나|왜\s*안\s*만나|꼭\s*나와|당장\s*나와/;

// ──────────────────────────────────────────────────────────────────────────
// 개별 detector
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

export function detectAddress(text: string): string | null {
  const m = text.match(ADDRESS_RE);
  return m ? m[0] : null;
}

export function detectSchool(text: string): string | null {
  const m = text.match(SCHOOL_RE);
  return m ? m[0] : null;
}

export function detectWorkplace(text: string): string | null {
  const m = text.match(WORKPLACE_RE);
  return m ? m[0] : null;
}

export function detectResidence(text: string): string | null {
  const m = text.match(RESIDENCE_RE);
  return m ? m[0] : null;
}

export function detectAgeDisclosure(text: string): string | null {
  const m = text.match(AGE_RE);
  return m ? m[0] : null;
}

export function detectProfanity(text: string): string | null {
  return findKeyword(text, PROFANITY_WORDS);
}

export function detectThreat(text: string): string | null {
  return findKeyword(text, THREAT_WORDS);
}

export function detectHarassment(text: string): string | null {
  return findKeyword(text, HARASSMENT_WORDS);
}

export function detectMeetPressure(text: string): string | null {
  return MEET_PRESSURE_RE.test(text)
    ? matchedFragment(text, MEET_PRESSURE_RE)
    : null;
}

// ──────────────────────────────────────────────────────────────────────────
// 통합
// ──────────────────────────────────────────────────────────────────────────

type DetectorEntry = {
  kind: ViolationKind;
  fn: (text: string) => string | null;
};

const DETECTORS: ReadonlyArray<DetectorEntry> = [
  { kind: 'phone', fn: detectPhoneNumber },
  { kind: 'email', fn: detectEmail },
  { kind: 'kakao', fn: detectKakao },
  { kind: 'instagram', fn: detectInstagram },
  { kind: 'telegram', fn: detectTelegram },
  { kind: 'address', fn: detectAddress },
  { kind: 'school', fn: detectSchool },
  { kind: 'workplace', fn: detectWorkplace },
  { kind: 'residence', fn: detectResidence },
  { kind: 'age_disclosure', fn: detectAgeDisclosure },
  { kind: 'profanity', fn: detectProfanity },
  { kind: 'threat', fn: detectThreat },
  { kind: 'harassment', fn: detectHarassment },
  { kind: 'meet_pressure', fn: detectMeetPressure },
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
  return text.normalize('NFKC');
}

function findKeyword(text: string, words: ReadonlyArray<string>): string | null {
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
