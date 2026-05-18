// DulSai 글 길이 정책.
// 짧은 반응도 허용 — 최소 글자 수 제한 없음. 공백만 입력한 경우만 거부.
// 최대 길이만 안전망으로 둔다.

export const POST_LENGTH_RULES = {
  minChars: 1,
  maxChars: 1000,
} as const;

export const REPLY_LENGTH_RULES = {
  minChars: 1,
  maxChars: 500,
} as const;

export const POST_INPUT_UI = {
  minVisibleLines: 5,
  maxVisibleLines: 10,
  fontSize: 16,
  lineHeight: 26,
} as const;

export type PostValidationReason = 'empty' | 'too_long';

export type PostValidation = {
  ok: boolean;
  reason: PostValidationReason | null;
  charCount: number;
};

export function validatePostLength(text: string): PostValidation {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  if (charCount === 0) {
    return { ok: false, reason: 'empty', charCount };
  }
  if (charCount > POST_LENGTH_RULES.maxChars) {
    return { ok: false, reason: 'too_long', charCount };
  }
  return { ok: true, reason: null, charCount };
}
