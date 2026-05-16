// 사용자에게 보여줄 부드러운 한 줄 안내.
// 강한 경고창 톤이 아니라, "조금 더 천천히" 같은 분위기 유지 문구만 둔다.

import type { ViolationCategory } from './types';

const HINTS: Record<ViolationCategory, string> = {
  contact: '개인정보는 조금 더 천천히 나누어 주세요.',
  identity: '구체적인 정보는 조금 뒤에 나누어 주세요.',
  toxic: '조금 더 편안한 대화를 이어가 주세요.',
  pressure: '상대를 압박하는 표현은 제한될 수 있어요.',
};

export function getSafetyHint(category: ViolationCategory): string {
  return HINTS[category];
}
