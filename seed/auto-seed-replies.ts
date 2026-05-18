// DulSai 자동 seed 답글 생성기.
//
// 실제 사용자가 새 글을 작성한 직후, 비어 보이지 않도록 seed 사용자 명의의
// 짧은 공감/반응 답글 2~4개를 client-side 로 즉시 추가한다.
// 서버 저장은 하지 않으며, seed 사용자와의 1:1 대화방도 만들어지지 않는다.
//
// 규칙 요약:
//   - 톤 6종 + neutral fallback. 키워드로 분류.
//   - 1~3문장의 짧고 자연스러운 톤. 상담사·플러팅·과한 위로 금지.
//   - 답글 2/3/4개 가중치 (3개가 가장 흔함).
//   - 답글 시각은 작성 직후로부터 20초~3분 사이로 분산.
//   - 동성/이성 강제 매칭 없음. SEED_USERS 풀에서 랜덤 셔플.

import type { SeedReply, SeedUser } from './seed-content';

export type SeedTone =
  | 'loneliness'           // 외로움/쓸쓸함
  | 'relationship_fatigue' // 관계 피로
  | 'love'                 // 사랑/호감/설렘
  | 'daily'                // 일상/습관
  | 'choice'               // 고민/선택
  | 'joy'                  // 기쁨/작은 행복
  | 'neutral';

const TONE_REPLIES: Record<SeedTone, string[]> = {
  loneliness: [
    '그런 날 진짜 있어요.',
    '괜히 집에 들어와서도 마음이 안 풀릴 때가 있더라고요.',
    '말로 다 설명 안 되는 피로감이 있죠.',
    '괜히 마음이 비는 날이 있어요.',
    '조용한 거리감이 더 깊게 느껴질 때가 있어요.',
    '글을 보다 보니 저도 오늘 좀 조용히 있고 싶어졌어요.',
    '뭐랄까 마음 한쪽이 비어있는 그런 날이요.',
    '바깥은 시끄러운데 안쪽은 조용한 그런 감각.',
  ],
  relationship_fatigue: [
    '그 거리감이 오히려 필요할 때도 있더라고요.',
    '사람이 싫다기보다 조금 쉬고 싶은 느낌 같아요.',
    '저도 비슷한 시기엔 약속을 좀 비워뒀어요.',
    '그런 순간에는 잠깐 멀어지는 것도 괜찮은 것 같아요.',
    '나만 그런 게 아니라는 게 가끔은 위로가 돼요.',
    '관계가 미워서가 아니라 그냥 잠시 쉬고 싶은 거잖아요.',
    '꼭 답을 안 내려도 되는 시기가 있는 것 같아요.',
  ],
  love: [
    '그런 마음은 오래 기억에 남더라고요.',
    '말로 옮기면 어색해지는 감정이 있죠.',
    '괜히 다시 읽고 싶어지는 글이에요.',
    '그 감각, 시간이 지나도 잘 안 사라지더라고요.',
    '저도 비슷한 기억이 떠올랐어요.',
    '담담한데도 묘하게 따뜻해요.',
  ],
  daily: [
    '저도 비슷한 습관 있어요.',
    '그런 작은 반복이 하루를 붙잡아 주는 것 같아요.',
    '별거 아닌 것 같은데 의외로 큰 부분이죠.',
    '저는 오늘 비슷한 결의 아침이었어요.',
    '같은 시간에 같은 자리에 앉는 게 묘하게 좋아요.',
    '아주 사소한데 마음 정리에 도움이 되더라고요.',
  ],
  choice: [
    '바로 답을 못 내리는 것도 자연스러운 것 같아요.',
    '조금 늦게 정해도 괜찮은 문제 같아요.',
    '저라면 며칠 더 두고 봤을 거 같아요.',
    '한 번에 결정 안 되는 일은 보통 깊은 일이더라고요.',
    '글만으로는 어렵지만 결국 본인이 가장 잘 알 거예요.',
    '어느 쪽도 틀린 답은 아닌 것 같아요.',
  ],
  joy: [
    '그런 순간은 오래 가면 좋겠어요.',
    '작은데 은근히 하루를 바꿔주죠.',
    '저까지 살짝 기분 좋아졌어요.',
    '읽다가 같이 웃었어요.',
    '오늘 이거 본 게 다행이에요.',
    '그런 날 같이 잘 보내고 싶네요.',
  ],
  neutral: [
    '글이 조용히 와닿네요.',
    '잠깐 멈추고 읽었어요.',
    '뭐랄까, 짧게 머무는 느낌이 있어요.',
    '오늘 이 글 본 게 좀 좋았어요.',
    '저도 비슷한 결을 적어보고 싶어졌어요.',
    '오래 기억에 남을 글 같아요.',
  ],
};

function detectTone(content: string): SeedTone {
  const t = content.toLowerCase();
  if (
    /외로|쓸쓸|혼자|적막|허전|고요|비어|텅|쓸쓸함|적적/.test(t)
  ) {
    return 'loneliness';
  }
  if (
    /지치|피곤|관계|사람.*싫|쉬고\s*싶|약속.*싫|만나기\s*싫|혼자\s*있/.test(t)
  ) {
    return 'relationship_fatigue';
  }
  if (
    /좋아|설레|사랑|애틋|반했|두근|마음에\s*들|보고\s*싶/.test(t)
  ) {
    return 'love';
  }
  if (
    /고민|선택|결정|모르겠|망설|어떡|어떻게\s*해야|할까/.test(t)
  ) {
    return 'choice';
  }
  if (
    /기쁘|좋은|행복|웃|즐거|뿌듯|신나|기분\s*좋|미소/.test(t)
  ) {
    return 'joy';
  }
  if (
    /오늘|매일|아침|저녁|커피|산책|습관|루틴|점심|퇴근|출근/.test(t)
  ) {
    return 'daily';
  }
  return 'neutral';
}

function pickCount(): number {
  // 가중치: 2(30%), 3(55%), 4(15%)
  const r = Math.random();
  if (r < 0.3) return 2;
  if (r < 0.85) return 3;
  return 4;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateSeedRepliesForPost(args: {
  postId: string;
  authorUserId: string;
  originalContent: string;
  seedUsers: SeedUser[];
}): SeedReply[] {
  const tone = detectTone(args.originalContent);
  const pool =
    TONE_REPLIES[tone].length > 0 ? TONE_REPLIES[tone] : TONE_REPLIES.neutral;
  const count = pickCount();

  // seed user 풀에서 작성자(가능성 거의 없지만 안전을 위해)와 다른 사용자만 셔플.
  const userPool = args.seedUsers.filter((u) => u.userId !== args.authorUserId);
  const pickedUsers = shuffle(userPool).slice(0, count);

  // 답글 본문 중복 없이 count 개.
  const pickedContents = shuffle(pool).slice(0, count);

  const nowMs = Date.now();
  return pickedUsers.map((u, i) => {
    // 20초 ~ 3분(180초) 사이로 분산. i 가 클수록 살짝 더 늦게.
    const offsetSec = 20 + Math.random() * 160 + i * 12;
    const createdAt = new Date(nowMs + offsetSec * 1000).toISOString();
    const content =
      pickedContents[i] ?? pool[i % pool.length] ?? '글 잘 읽었어요.';
    return {
      replyId: `seed_auto_${args.postId}_${i}_${nowMs}`,
      userId: u.userId,
      originalLanguage: 'ko',
      originalContent: content,
      createdAt,
      isSample: true,
      isAutoSeed: true,
    };
  });
}
