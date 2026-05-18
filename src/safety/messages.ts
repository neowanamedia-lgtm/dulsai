// 사용자에게 보여줄 한 줄 안내.
// "DulSai 는 깨끗한 커뮤니티보다 인간적인 대화 공간" 톤. 자동 차단 메시지도 너무 단정 짓지 않는다.
// 단 critical 은 무관용이라 톤이 조금 단단하다.

import type { ViolationCategory } from './types';

const HINTS: Record<ViolationCategory, string> = {
  contact:
    '외부 연락처는 이 화면에서 어려워요. DulSai 안에서 천천히 이어가 주세요.',
  harassment:
    '이 표현은 보낼 수 없어요. 다른 말로 바꿔서 다시 시도해 주세요.',
  critical:
    '이 표현은 보낼 수 없습니다.',
};

export function getSafetyHint(category: ViolationCategory): string {
  return HINTS[category];
}
