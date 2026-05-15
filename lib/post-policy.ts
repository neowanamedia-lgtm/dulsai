export const POST_LENGTH_RULES = {
  minChars: 50,
  recommendedMin: 80,
  recommendedMax: 200,
  maxChars: 320,
  minLines: 2,
  maxLines: 8,
} as const;

export const POST_INPUT_UI = {
  minVisibleLines: 5,
  maxVisibleLines: 10,
  fontSize: 16,
  lineHeight: 26,
} as const;

export type PostValidationReason = 'too_short' | 'too_long';

export type PostValidation = {
  ok: boolean;
  reason: PostValidationReason | null;
  charCount: number;
  lineBreakCount: number;
  status: 'too_short' | 'below_recommended' | 'within_recommended' | 'above_recommended' | 'too_long';
};

export function validatePostLength(text: string): PostValidation {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const lineBreakCount = trimmed === '' ? 0 : (trimmed.match(/\n/g)?.length ?? 0) + 1;

  let status: PostValidation['status'];
  if (charCount < POST_LENGTH_RULES.minChars) status = 'too_short';
  else if (charCount < POST_LENGTH_RULES.recommendedMin) status = 'below_recommended';
  else if (charCount <= POST_LENGTH_RULES.recommendedMax) status = 'within_recommended';
  else if (charCount <= POST_LENGTH_RULES.maxChars) status = 'above_recommended';
  else status = 'too_long';

  if (status === 'too_short') {
    return { ok: false, reason: 'too_short', charCount, lineBreakCount, status };
  }
  if (status === 'too_long') {
    return { ok: false, reason: 'too_long', charCount, lineBreakCount, status };
  }
  return { ok: true, reason: null, charCount, lineBreakCount, status };
}

export function postLengthHint(text: string): string {
  const v = validatePostLength(text);
  if (v.status === 'too_short') {
    return `조금만 더 풀어 적어주세요 (${v.charCount} / ${POST_LENGTH_RULES.minChars}자 이상)`;
  }
  if (v.status === 'below_recommended') {
    return `${v.charCount}자 · 조금 더 적어도 좋아요`;
  }
  if (v.status === 'within_recommended') {
    return `${v.charCount}자`;
  }
  if (v.status === 'above_recommended') {
    return `${v.charCount}자 · 마무리해도 좋아요`;
  }
  return `${v.charCount}자 · ${POST_LENGTH_RULES.maxChars}자까지 가능해요`;
}
