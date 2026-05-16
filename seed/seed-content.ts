export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';
export type TranslationStatus = 'pending' | 'completed' | 'failed';
export type TranslationTargetType = 'post' | 'reply';

export type SeedGender = 'male' | 'female';
export type SeedAgeRange = '20s' | '30s' | '40s' | '50s_plus';

export type SeedUser = {
  userId: string;
  nickname: string;
  gender: SeedGender;
  ageRange: SeedAgeRange;
  profileImage: 'profile-male.png' | 'profile-female.png';
  preferredLanguage: Language;
  isSample: true;
};

export type ConversationJoin = {
  joinId: string;
  userId: string;
  originalLanguage: Language;
  originalContent: string;
  createdAt: string;
  isSample: true;
};

export type ConversationInvite = {
  inviteId: string;
  userId: string;
  originalLanguage: Language;
  originalContent: string;
  createdAt: string;
  isSample: true;
  conversationJoin?: ConversationJoin;
};

export type SeedReply = {
  replyId: string;
  userId: string;
  originalLanguage: Language;
  originalContent: string;
  createdAt: string;
  updatedAt?: string;
  isSample: true;
  conversationInvite?: ConversationInvite;
};

export type SeedPost = {
  postId: string;
  userId: string;
  categoryId: string;
  originalLanguage: Language;
  originalContent: string;
  createdAt: string;
  updatedAt?: string;
  isSample: true;
  replies: SeedReply[];
};

export type SeedConversationStatus = 'active' | 'blocked' | 'closed';

export type SeedConversation = {
  conversationId: string;
  postId: string;
  rootCommentId: string;
  inviterUserId: string;
  invitedUserId: string;
  participants: [string, string];
  createdAt: string;
  lastMessageAt: string;
  status: SeedConversationStatus;
  isSample: true;
};

export type DisclosureKind = 'region' | 'age' | 'photo' | 'contact';
export type MessageKind =
  | 'text'
  | 'disclosure_request'
  | 'disclosure_accepted'
  | 'disclosure_declined'
  | 'disclosure_info';

export type SeedMessage = {
  messageId: string;
  conversationId: string;
  senderId: string;
  originalLanguage: Language;
  originalContent: string;
  createdAt: string;
  isSample: true;
  kind?: MessageKind;
  disclosureKind?: DisclosureKind;
};

export type SeedTranslation = {
  translationId: string;
  targetType: TranslationTargetType;
  targetId: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  translatedContent: string;
  provider?: string;
  status: TranslationStatus;
  createdAt: string;
  updatedAt?: string;
};

export const SEED_USERS: SeedUser[] = [
  { userId: 'm_01', nickname: '도현',   gender: 'male',   ageRange: '20s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_02', nickname: '한결',   gender: 'male',   ageRange: '20s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_03', nickname: '준영',   gender: 'male',   ageRange: '20s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_04', nickname: '시현',   gender: 'male',   ageRange: '20s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_05', nickname: '민재',   gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_06', nickname: '종현',   gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_07', nickname: '재준',   gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_08', nickname: '재훈',   gender: 'male',   ageRange: '40s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_09', nickname: '정우',   gender: 'male',   ageRange: '40s',       profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'm_10', nickname: '영규',   gender: 'male',   ageRange: '50s_plus',  profileImage: 'profile-male.png',   preferredLanguage: 'ko', isSample: true },
  { userId: 'f_01', nickname: '예린',   gender: 'female', ageRange: '20s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_02', nickname: '라온',   gender: 'female', ageRange: '20s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_03', nickname: '하늘',   gender: 'female', ageRange: '20s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_04', nickname: '채린',   gender: 'female', ageRange: '20s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_05', nickname: '서윤',   gender: 'female', ageRange: '30s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_06', nickname: '민경',   gender: 'female', ageRange: '30s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_07', nickname: '보영',   gender: 'female', ageRange: '30s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_08', nickname: '지수',   gender: 'female', ageRange: '40s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_09', nickname: '수정',   gender: 'female', ageRange: '40s',       profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },
  { userId: 'f_10', nickname: '다인',   gender: 'female', ageRange: '50s_plus',  profileImage: 'profile-female.png', preferredLanguage: 'ko', isSample: true },

  { userId: 'en_01', nickname: 'Sam',     gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'en', isSample: true },
  { userId: 'en_02', nickname: 'Eleanor', gender: 'female', ageRange: '40s',       profileImage: 'profile-female.png', preferredLanguage: 'en', isSample: true },
  { userId: 'en_03', nickname: 'Marcus',  gender: 'male',   ageRange: '20s',       profileImage: 'profile-male.png',   preferredLanguage: 'en', isSample: true },
  { userId: 'en_04', nickname: 'Pria',    gender: 'female', ageRange: '30s',       profileImage: 'profile-female.png', preferredLanguage: 'en', isSample: true },

  { userId: 'ja_01', nickname: '春樹',     gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'ja', isSample: true },
  { userId: 'ja_02', nickname: '美佐',     gender: 'female', ageRange: '40s',       profileImage: 'profile-female.png', preferredLanguage: 'ja', isSample: true },
  { userId: 'ja_03', nickname: '健太',     gender: 'male',   ageRange: '20s',       profileImage: 'profile-male.png',   preferredLanguage: 'ja', isSample: true },
  { userId: 'ja_04', nickname: '由香',     gender: 'female', ageRange: '30s',       profileImage: 'profile-female.png', preferredLanguage: 'ja', isSample: true },

  { userId: 'zh_01', nickname: '嘉宁',     gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'zh', isSample: true },
  { userId: 'zh_02', nickname: '文静',     gender: 'female', ageRange: '20s',       profileImage: 'profile-female.png', preferredLanguage: 'zh', isSample: true },
  { userId: 'zh_03', nickname: '致远',     gender: 'male',   ageRange: '40s',       profileImage: 'profile-male.png',   preferredLanguage: 'zh', isSample: true },
  { userId: 'zh_04', nickname: '思雨',     gender: 'female', ageRange: '30s',       profileImage: 'profile-female.png', preferredLanguage: 'zh', isSample: true },

  { userId: 'es_01', nickname: 'Mateo',   gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'es', isSample: true },
  { userId: 'es_02', nickname: 'Elena',   gender: 'female', ageRange: '40s',       profileImage: 'profile-female.png', preferredLanguage: 'es', isSample: true },
  { userId: 'es_03', nickname: 'Sofía',   gender: 'female', ageRange: '20s',       profileImage: 'profile-female.png', preferredLanguage: 'es', isSample: true },
  { userId: 'es_04', nickname: 'Javier',  gender: 'male',   ageRange: '30s',       profileImage: 'profile-male.png',   preferredLanguage: 'es', isSample: true },
];

export const SEED_POSTS: SeedPost[] = [
  {
    postId: 'p001',
    userId: 'm_01',
    categoryId: 'todays-passing-thought',
    originalLanguage: 'ko',
    originalContent: '오늘 점심에 김밥집 아주머니가 단무지 빼달라는 걸 또 잊으셨다. 화는 안 났고 그냥 같이 웃었다. 이런 게 더 오래 기억에 남는다.',
    createdAt: '2026-05-16T14:23:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r001', userId: 'f_07', originalLanguage: 'ko', originalContent: '단무지 좋아하는 사람들이 들으면 어이없어할 댓글이지만 저도 단무지 빼파라서 격하게 공감합니다.', createdAt: '2026-05-16T15:01:00+09:00', isSample: true },
      { replyId: 'r002', userId: 'm_05', originalLanguage: 'ko', originalContent: '저는 빼달라고 했는데 오히려 두 개 들어있던 적 있어요. 사과의 의미였는지 뭐였는지.', createdAt: '2026-05-16T15:48:00+09:00', isSample: true },
      { replyId: 'r003', userId: 'f_05', originalLanguage: 'ko', originalContent: '그런 게 자꾸 쌓이면 단골 되는 거잖아요. 좋아 보여요.', createdAt: '2026-05-16T17:12:00+09:00', isSample: true, conversationInvite: { inviteId: 'inv_001', userId: 'm_01', originalLanguage: 'ko', originalContent: '그렇게 봐주셔서 고맙습니다. 괜찮다면 이 문장을 계기로 조금 더 천천히 이야기 나눠보고 싶어요.', createdAt: '2026-05-16T19:48:00+09:00', isSample: true, conversationJoin: { joinId: 'jon_001', userId: 'f_05', originalLanguage: 'ko', originalContent: '좋아요. 가볍게라도 천천히 이야기 이어가 봐요.', createdAt: '2026-05-16T22:14:00+09:00', isSample: true } } },
    ],
  },
  {
    postId: 'p002',
    userId: 'f_07',
    categoryId: 'todays-passing-thought',
    originalLanguage: 'ko',
    originalContent: '엘리베이터에서 모르는 분이 인사를 하셔서 같이 인사했는데 알고 보니 다른 사람한테 한 거였다. 사회생활 헛했다.',
    createdAt: '2026-05-16T09:51:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r004', userId: 'm_06', originalLanguage: 'ko', originalContent: 'ㅋㅋㅋㅋ 저도 매일 합니다 그거. 같은 층에서 내릴 때까지 어색한 게 압권이죠.', createdAt: '2026-05-16T10:14:00+09:00', isSample: true },
      { replyId: 'r005', userId: 'f_03', originalLanguage: 'ko', originalContent: '인사를 받아주신 거 자체가 사회생활 잘하시는 거예요.', createdAt: '2026-05-16T11:02:00+09:00', isSample: true },
      { replyId: 'r006', userId: 'm_02', originalLanguage: 'ko', originalContent: '그분도 분명 머쓱하셨을 거예요. 같이 웃으면서 내리셨길.', createdAt: '2026-05-16T13:25:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p003',
    userId: 'm_08',
    categoryId: 'todays-passing-thought',
    originalLanguage: 'ko',
    originalContent: '오늘 회의 끝나고 회사 화장실에서 5분 정도 멍하니 있었다. 별 생각은 없었고 그냥 조용한 공간이 필요했던 것 같다.',
    createdAt: '2026-05-15T22:18:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r007', userId: 'm_09', originalLanguage: 'ko', originalContent: '그 5분이 있어야 사람이 굴러갑니다. 다들 비슷할 거예요.', createdAt: '2026-05-15T22:46:00+09:00', isSample: true },
      { replyId: 'r008', userId: 'f_08', originalLanguage: 'ko', originalContent: '화장실이 사실상 회사 안의 유일한 사적 공간이죠.', createdAt: '2026-05-15T23:11:00+09:00', isSample: true },
      { replyId: 'r009', userId: 'm_07', originalLanguage: 'ko', originalContent: '저는 옥상 갑니다. 누가 있으면 그냥 도로 내려와요.', createdAt: '2026-05-16T08:33:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p004',
    userId: 'f_01',
    categoryId: 'quiet-loneliness',
    originalLanguage: 'ko',
    originalContent: '퇴근하고 집 들어와서 불 켜는 순간이 가끔 좀 그래요. 누가 기다리는 것도 아니고 슬픈 것도 아닌데, 새삼스러울 때가 있어요.',
    createdAt: '2026-05-15T19:45:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r010', userId: 'f_06', originalLanguage: 'ko', originalContent: '그 감각 알 것 같아요. 슬프다고 부르기엔 너무 일상이고.', createdAt: '2026-05-15T20:18:00+09:00', isSample: true },
      { replyId: 'r011', userId: 'm_01', originalLanguage: 'ko', originalContent: '저는 일부러 들어오기 전에 음악 틀어놓고 들어와요. 별거 아닌데 도움이 돼요.', createdAt: '2026-05-15T20:55:00+09:00', isSample: true, conversationInvite: { inviteId: 'inv_002', userId: 'f_01', originalLanguage: 'ko', originalContent: '그 방법, 저도 한번 해보려고요. 괜찮다면 이 문장을 계기로 조금 더 이야기 나눠보고 싶어요.', createdAt: '2026-05-15T23:42:00+09:00', isSample: true } },
      { replyId: 'r012', userId: 'f_10', originalLanguage: 'ko', originalContent: '혼자 사는 게 익숙해진다는 건 그런 순간들에 무뎌지는 거더라고요.', createdAt: '2026-05-15T22:01:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p005',
    userId: 'm_09',
    categoryId: 'quiet-loneliness',
    originalLanguage: 'ko',
    originalContent: '단톡방이 시끄러운데 정작 나한테 말 거는 사람은 없는 묘한 감각. 어렸을 땐 이런 게 외로움이라고 생각 안 했는데.',
    createdAt: '2026-05-15T14:30:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r013', userId: 'f_09', originalLanguage: 'ko', originalContent: '무리 속에서 외로운 게 진짜 외로움인 것 같아요.', createdAt: '2026-05-15T15:02:00+09:00', isSample: true },
      { replyId: 'r014', userId: 'm_10', originalLanguage: 'ko', originalContent: '그 단톡방을 굳이 안 나가는 이유는 또 뭘까요. 저도 비슷합니다.', createdAt: '2026-05-15T16:37:00+09:00', isSample: true },
      { replyId: 'r015', userId: 'm_05', originalLanguage: 'ko', originalContent: '마지막 줄이 뼈입니다.', createdAt: '2026-05-15T18:10:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p006',
    userId: 'f_02',
    categoryId: 'quiet-loneliness',
    originalLanguage: 'ko',
    originalContent: '점심 혼자 먹는 건 괜찮은데 옆 테이블에서 웃는 소리 들릴 때 잠깐 멈칫해요. 외롭다기보단 그냥 거리감?',
    createdAt: '2026-05-15T08:12:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r016', userId: 'f_04', originalLanguage: 'ko', originalContent: '거리감이라는 표현 적절하네요. 외롭다고 말하기엔 좀 과하고.', createdAt: '2026-05-15T09:25:00+09:00', isSample: true },
      { replyId: 'r017', userId: 'm_03', originalLanguage: 'ko', originalContent: '저는 그래서 일부러 시끄러운 식당은 잘 안 가요.', createdAt: '2026-05-15T12:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p007',
    userId: 'f_05',
    categoryId: 'lasting-affection',
    originalLanguage: 'ko',
    originalContent: '고등학교 때 야자 빠지고 친구랑 무작정 버스 종점까지 갔던 거. 별일도 없었고 떡볶이 먹고 돌아왔는데, 그 버스 흔들림이 가끔 떠올라요.',
    createdAt: '2026-05-14T23:55:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r018', userId: 'f_02', originalLanguage: 'ko', originalContent: '그런 거 진짜 별일 아닌데 왜 그렇게 또렷한지 신기해요.', createdAt: '2026-05-15T00:42:00+09:00', isSample: true },
      { replyId: 'r019', userId: 'm_06', originalLanguage: 'ko', originalContent: '그 친구분은 지금도 연락하세요?', createdAt: '2026-05-15T08:18:00+09:00', isSample: true },
      { replyId: 'r020', userId: 'f_08', originalLanguage: 'ko', originalContent: '야자 빠지고 어디 가본 적 없는 사람으로서 부럽기까지 합니다.', createdAt: '2026-05-15T10:33:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p008',
    userId: 'm_10',
    categoryId: 'lasting-affection',
    originalLanguage: 'ko',
    originalContent: '군대 시절 동기랑 야간 근무 서면서 같이 별 봤던 거 가끔 떠오릅니다. 그땐 빨리 끝나길 바랐던 시간이 지금은 좀 그립네요. 이상한 일이죠.',
    createdAt: '2026-05-14T20:34:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r021', userId: 'm_08', originalLanguage: 'ko', originalContent: '그 동기분 잘 지내시려나 모르겠네요.', createdAt: '2026-05-14T21:14:00+09:00', isSample: true },
      { replyId: 'r022', userId: 'm_07', originalLanguage: 'ko', originalContent: '지나고 나면 다 그런 거 같습니다. 신기해요.', createdAt: '2026-05-14T22:48:00+09:00', isSample: true },
      { replyId: 'r023', userId: 'f_10', originalLanguage: 'ko', originalContent: '그리울 시간이 따로 있었던 줄 그때는 모르죠.', createdAt: '2026-05-15T07:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p009',
    userId: 'f_08',
    categoryId: 'stance-in-relationships',
    originalLanguage: 'ko',
    originalContent: '늦었다고 미안해하는 사람보다, 늦지 않으려고 미리 움직이는 사람이 더 좋습니다. 사과보다 습관이 중요해요.',
    createdAt: '2026-05-14T16:08:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r024', userId: 'm_08', originalLanguage: 'ko', originalContent: '맞아요. 사과를 잘하는 게 미덕인 줄 알았는데 안 늦는 게 미덕이더라고요.', createdAt: '2026-05-14T16:42:00+09:00', isSample: true },
      { replyId: 'r025', userId: 'f_07', originalLanguage: 'ko', originalContent: '저는 둘 다 못하는 인간이라 댓글 단 게 부끄럽네요.', createdAt: '2026-05-14T17:30:00+09:00', isSample: true },
      { replyId: 'r026', userId: 'm_02', originalLanguage: 'ko', originalContent: '근데 어쩌다 한 번 늦는 사람한테 너무 매정하게 굴면 안 된다고 생각해요. 사정이 있는 날도 있으니까.', createdAt: '2026-05-14T19:11:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p010',
    userId: 'm_02',
    categoryId: 'stance-in-relationships',
    originalLanguage: 'ko',
    originalContent: '말이 잘 통하는 사이보다 침묵이 편한 사이가 더 가깝다고 생각해요. 잘 통한다는 건 결국 비슷한 말을 좋아한다는 거잖아요.',
    createdAt: '2026-05-14T11:42:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r027', userId: 'f_06', originalLanguage: 'ko', originalContent: '이거 진짜 동의. 침묵을 못 견디는 관계는 어딘가 피곤해요.', createdAt: '2026-05-14T12:35:00+09:00', isSample: true, conversationInvite: { inviteId: 'inv_003', userId: 'm_02', originalLanguage: 'ko', originalContent: '이 문장에 같은 결로 답해주신 게 반가웠어요. 이 문장을 계기로 조금 더 이야기 나눠보고 싶어요.', createdAt: '2026-05-14T15:22:00+09:00', isSample: true, conversationJoin: { joinId: 'jon_003', userId: 'f_06', originalLanguage: 'ko', originalContent: '그렇게 말씀해주셔서 좋습니다. 급할 거 없이 천천히 이어가 봐요.', createdAt: '2026-05-14T17:08:00+09:00', isSample: true } } },
      { replyId: 'r028', userId: 'm_05', originalLanguage: 'ko', originalContent: '근데 침묵이 편하려면 시간이 좀 필요한 거 같아요. 처음부터는 안 되더라고요.', createdAt: '2026-05-14T13:48:00+09:00', isSample: true },
      { replyId: 'r029', userId: 'f_05', originalLanguage: 'ko', originalContent: '그래서 오래된 친구가 좋아요.', createdAt: '2026-05-14T15:22:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p011',
    userId: 'm_04',
    categoryId: 'stance-in-relationships',
    originalLanguage: 'ko',
    originalContent: '고마운 일에 진짜 고맙다고 말하는 사람. 별거 아닌데 의외로 드물어요.',
    createdAt: '2026-05-13T23:18:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r030', userId: 'f_01', originalLanguage: 'ko', originalContent: '익숙해지면 안 말하게 되는 거 같아요. 의식적으로 말하는 사람이 좋더라고요.', createdAt: '2026-05-14T08:15:00+09:00', isSample: true },
      { replyId: 'r031', userId: 'm_09', originalLanguage: 'ko', originalContent: '회사에서도 그게 잘 안 되더라고요. 다들 당연하다고 생각해서.', createdAt: '2026-05-14T09:44:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p012',
    userId: 'm_05',
    categoryId: 'private-habit',
    originalLanguage: 'ko',
    originalContent: '자기 전에 냉장고 한 번 열어서 안 먹을 거 알면서 그냥 들여다본다. 십 년째 그러고 있다.',
    createdAt: '2026-05-13T21:05:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r032', userId: 'm_06', originalLanguage: 'ko', originalContent: '그게 정신과 갈 일은 아니지만 누가 알아줘서 다행이라는 생각은 듭니다 ㅋㅋ', createdAt: '2026-05-13T21:38:00+09:00', isSample: true },
      { replyId: 'r033', userId: 'f_03', originalLanguage: 'ko', originalContent: '저는 화장실 안 마려운데 자기 전에 한 번 갑니다. 의식 같은 거.', createdAt: '2026-05-13T22:11:00+09:00', isSample: true },
      { replyId: 'r034', userId: 'm_04', originalLanguage: 'ko', originalContent: '닫고 자세요 형. 전기세 생각하세요.', createdAt: '2026-05-13T23:02:00+09:00', isSample: true },
      { replyId: 'r035', userId: 'f_07', originalLanguage: 'ko', originalContent: '어이없게 친근하네요.', createdAt: '2026-05-14T07:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p013',
    userId: 'f_10',
    categoryId: 'private-habit',
    originalLanguage: 'ko',
    originalContent: '매일 아침 같은 컵에 같은 양만큼 커피를 따라요. 손님이 다른 컵을 쓰면 하루가 약간 어긋난 기분이 들어요. 사소한 거에 안정감을 느끼는 게 나이가 든 건가도 싶고.',
    createdAt: '2026-05-13T17:33:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r036', userId: 'f_09', originalLanguage: 'ko', originalContent: '그게 사소한 의식이라는 거예요. 나이 들수록 좋아지는 거 같아요.', createdAt: '2026-05-13T18:21:00+09:00', isSample: true },
      { replyId: 'r037', userId: 'm_10', originalLanguage: 'ko', originalContent: '저도 신문 안 보는 사람이지만 신문 자리는 비워둡니다. 비슷한 거겠죠.', createdAt: '2026-05-13T20:14:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p014',
    userId: 'm_03',
    categoryId: 'quiet-message',
    originalLanguage: 'ko',
    originalContent: '누나, 그때 화났던 건 누나 때문 아니었어. 별거 아닌 일로 짜증냈는데 누나가 받아준 거 알아. 늦었지만 미안.',
    createdAt: '2026-05-13T13:24:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r038', userId: 'f_05', originalLanguage: 'ko', originalContent: '누나가 보시면 좋겠네요. 그런 말은 늦어도 닿는 거 같아요.', createdAt: '2026-05-13T14:12:00+09:00', isSample: true },
      { replyId: 'r039', userId: 'm_07', originalLanguage: 'ko', originalContent: '이런 글 보면 우리 동생한테도 비슷한 마음 빚 있다는 게 떠오릅니다.', createdAt: '2026-05-13T15:48:00+09:00', isSample: true },
      { replyId: 'r040', userId: 'f_04', originalLanguage: 'ko', originalContent: '남매가 이렇게 글로 표현하는 거 자체가 좋아 보여요.', createdAt: '2026-05-13T17:02:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p015',
    userId: 'f_09',
    categoryId: 'quiet-message',
    originalLanguage: 'ko',
    originalContent: '엄마, 김치는 이제 제가 담글게요. 작년에 도와드린다고 했다가 결국 다 망친 거 미안해요.',
    createdAt: '2026-05-13T09:11:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r041', userId: 'f_10', originalLanguage: 'ko', originalContent: '엄마는 망쳐도 좋아하셨을 거예요. 옆에 있는 게 중요한 거지.', createdAt: '2026-05-13T10:08:00+09:00', isSample: true },
      { replyId: 'r042', userId: 'f_06', originalLanguage: 'ko', originalContent: '내년에도 망치셔도 괜찮아요. 그래도 같이 하시는 거니까.', createdAt: '2026-05-13T11:33:00+09:00', isSample: true },
      { replyId: 'r043', userId: 'm_08', originalLanguage: 'ko', originalContent: '저는 엄마 김치 담그시는 거 한 번도 못 도와드렸네요. 보고 갑니다.', createdAt: '2026-05-13T12:47:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p016',
    userId: 'm_06',
    categoryId: 'quiet-message',
    originalLanguage: 'ko',
    originalContent: '전 직장 팀장님, 사실 그때 진짜 많이 배웠어요. 저도 모르게 따라 하고 있더라고요. 본인이 알면 부담스러우실까봐 여기 적습니다.',
    createdAt: '2026-05-12T22:48:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r044', userId: 'm_09', originalLanguage: 'ko', originalContent: '본인 모르게 영향 끼치는 사람이 진짜 좋은 사람이에요.', createdAt: '2026-05-12T23:19:00+09:00', isSample: true },
      { replyId: 'r045', userId: 'f_08', originalLanguage: 'ko', originalContent: '팀장님이 우연히 보시면 좋겠네요. 그런 일은 일어나기도 하니까.', createdAt: '2026-05-13T07:42:00+09:00', isSample: true },
      { replyId: 'r046', userId: 'm_02', originalLanguage: 'ko', originalContent: '근데 부담스러워하실 분이면 듣고 좋아하실 분이기도 합니다. 한 번 연락해보세요.', createdAt: '2026-05-13T09:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p017',
    userId: 'f_06',
    categoryId: 'lingering-sentence',
    originalLanguage: 'ko',
    originalContent: '엄마가 "너 어렸을 땐 잘 웃었는데" 하셨는데, 그게 왜 그렇게 마음에 걸리는지 모르겠어요.',
    createdAt: '2026-05-12T19:30:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r047', userId: 'f_05', originalLanguage: 'ko', originalContent: '엄마는 별 뜻 없이 하신 말씀일 텐데, 그런 게 오래 남아요.', createdAt: '2026-05-12T20:11:00+09:00', isSample: true },
      { replyId: 'r048', userId: 'm_01', originalLanguage: 'ko', originalContent: '어른이 된다는 게 좀 그런 거 같습니다. 잘 안 웃는 사람이 되는 거.', createdAt: '2026-05-12T21:34:00+09:00', isSample: true, conversationInvite: { inviteId: 'inv_004', userId: 'f_06', originalLanguage: 'ko', originalContent: '오래 머무는 문장이었어요. 이 문장을 계기로 한두 마디 더 나눠보고 싶습니다.', createdAt: '2026-05-13T08:14:00+09:00', isSample: true, conversationJoin: { joinId: 'jon_004', userId: 'm_01', originalLanguage: 'ko', originalContent: '그렇게 봐주신 것만으로도 감사합니다. 천천히 답해도 괜찮다면 이어가 보고 싶어요.', createdAt: '2026-05-13T11:45:00+09:00', isSample: true } } },
      { replyId: 'r049', userId: 'f_02', originalLanguage: 'ko', originalContent: '다시 잘 웃기 시작하는 시기도 있어요. 시간이 좀 걸려요.', createdAt: '2026-05-12T22:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p018',
    userId: 'm_07',
    categoryId: 'lingering-sentence',
    originalLanguage: 'ko',
    originalContent: '오늘 회사 후배가 "선배는 안 힘드세요?" 하고 물었는데 대답을 못 했어요. 한참 지나서 생각났는데 그 질문 자체가 위로였던 것 같아요.',
    createdAt: '2026-05-12T15:17:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r050', userId: 'f_09', originalLanguage: 'ko', originalContent: '그런 질문 받으면 의외로 말이 안 나오죠. 위로받았다는 거 후배는 모를 거예요.', createdAt: '2026-05-12T16:08:00+09:00', isSample: true },
      { replyId: 'r051', userId: 'm_05', originalLanguage: 'ko', originalContent: '다음에 그 후배한테 밥 한 번 사주세요. 그게 답인 거 같아요.', createdAt: '2026-05-12T17:42:00+09:00', isSample: true },
      { replyId: 'r052', userId: 'f_07', originalLanguage: 'ko', originalContent: '선배도 사람이라는 걸 알아주는 거. 그게 어렵습니다.', createdAt: '2026-05-12T18:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p019',
    userId: 'f_03',
    categoryId: 'unsaid-words',
    originalLanguage: 'ko',
    originalContent: '마지막에 헤어진 게 너 잘못 아니었다고. 그땐 자존심 상해서 못 했고 지금은 다시 연락할 사이가 아니라서.',
    createdAt: '2026-05-12T11:02:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r053', userId: 'f_04', originalLanguage: 'ko', originalContent: '이런 거 적어두는 것만으로도 좀 풀리지 않아요?', createdAt: '2026-05-12T11:48:00+09:00', isSample: true },
      { replyId: 'r054', userId: 'm_03', originalLanguage: 'ko', originalContent: '닿지 않을 말이라는 걸 알면서 적는 게 가끔 필요해요.', createdAt: '2026-05-12T13:21:00+09:00', isSample: true },
      { replyId: 'r055', userId: 'm_09', originalLanguage: 'ko', originalContent: '그쪽도 비슷한 글을 어디서 적고 있을지도 몰라요.', createdAt: '2026-05-12T14:30:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p020',
    userId: 'm_01',
    categoryId: 'unsaid-words',
    originalLanguage: 'ko',
    originalContent: '아빠한테 미안하다고 한 번도 제대로 해본 적이 없다. 우리 집은 그런 거 잘 안 한다.',
    createdAt: '2026-05-12T08:46:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r056', userId: 'm_08', originalLanguage: 'ko', originalContent: '우리 집도 비슷합니다. 어색해서 안 하게 되더라고요.', createdAt: '2026-05-12T09:22:00+09:00', isSample: true },
      { replyId: 'r057', userId: 'f_06', originalLanguage: 'ko', originalContent: '한 번은 해보세요. 어색한 만큼 오래 기억되더라고요.', createdAt: '2026-05-12T10:18:00+09:00', isSample: true },
      { replyId: 'r058', userId: 'm_10', originalLanguage: 'ko', originalContent: '아버지 살아 계실 때 해두세요. 그게 가장 큰 후회 안 만드는 길입니다.', createdAt: '2026-05-12T10:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p021',
    userId: 'f_01',
    categoryId: 'unsaid-words',
    originalLanguage: 'ko',
    originalContent: '친구한테 결혼식 못 갈 거 같다는 말 끝까지 못 했어요. 설명하기에는 길고, 안 갈 핑계로 보이긴 싫어서 그냥 갔는데, 사실 그때 진짜 못 갈 상황이었어요.',
    createdAt: '2026-05-11T23:21:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r059', userId: 'f_05', originalLanguage: 'ko', originalContent: '결국 가셨으니까 친구는 모르겠지만 본인은 알고 계시잖아요. 그게 더 큰 일인 거 같아요.', createdAt: '2026-05-12T08:11:00+09:00', isSample: true },
      { replyId: 'r060', userId: 'm_04', originalLanguage: 'ko', originalContent: '이런 거 알아주는 친구가 좋은 친구죠. 다음에 솔직하게 말해도 괜찮을 거예요.', createdAt: '2026-05-12T09:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p022',
    userId: 'f_04',
    categoryId: 'recurring-feeling',
    originalLanguage: 'ko',
    originalContent: '잘 살고 있다고 생각하다가도 가끔 다 그만두고 싶어진다. 진짜 그만두려는 건 아닌데 그 감각이 자꾸 들이닥친다.',
    createdAt: '2026-05-11T20:15:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r061', userId: 'm_06', originalLanguage: 'ko', originalContent: '그 감각 알아요. 자주 오는 건 좀 걱정되긴 합니다.', createdAt: '2026-05-11T21:02:00+09:00', isSample: true },
      { replyId: 'r062', userId: 'f_02', originalLanguage: 'ko', originalContent: '괜찮으세요? 가끔이면 다행이지만 너무 자주 오면 잠깐 멈춰가도 돼요.', createdAt: '2026-05-11T21:48:00+09:00', isSample: true },
      { replyId: 'r063', userId: 'm_05', originalLanguage: 'ko', originalContent: '그만두고 싶은 게 정확히 뭔지 적어보면 의외로 도움 돼요.', createdAt: '2026-05-11T22:35:00+09:00', isSample: true },
      { replyId: 'r064', userId: 'f_08', originalLanguage: 'ko', originalContent: '이상하지 않은 감각이에요. 그래도 들을 사람 옆에 두세요.', createdAt: '2026-05-12T07:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p023',
    userId: 'f_07',
    categoryId: 'recurring-feeling',
    originalLanguage: 'ko',
    originalContent: '내가 별로 한 게 없는데 왜 이렇게 피곤한지. 답은 아는데 인정하기 싫다.',
    createdAt: '2026-05-11T16:48:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r065', userId: 'm_02', originalLanguage: 'ko', originalContent: '답이 뭘까요 ㅋㅋ', createdAt: '2026-05-11T17:14:00+09:00', isSample: true },
      { replyId: 'r066', userId: 'f_03', originalLanguage: 'ko', originalContent: 'ㅋㅋㅋ 인정 안 하시는 거 보니 진짜 그거 맞네요.', createdAt: '2026-05-11T18:33:00+09:00', isSample: true },
      { replyId: 'r067', userId: 'm_07', originalLanguage: 'ko', originalContent: '사회생활은 가만히 있어도 에너지를 빼앗아갑니다.', createdAt: '2026-05-11T19:25:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p024',
    userId: 'm_09',
    categoryId: 'recurring-feeling',
    originalLanguage: 'ko',
    originalContent: '중요한 사람들한테 무심해진 것 같다는 생각이 자꾸 든다. 챙기려고 마음먹어도 막상 손이 안 가니까 더 그래요.',
    createdAt: '2026-05-11T12:33:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r068', userId: 'f_10', originalLanguage: 'ko', originalContent: '그게 정말 무심한 건 아니에요. 무심하면 그런 생각도 안 들어요.', createdAt: '2026-05-11T13:18:00+09:00', isSample: true },
      { replyId: 'r069', userId: 'm_08', originalLanguage: 'ko', originalContent: '오늘 저녁에 전화 한 번만 해보세요. 손은 그렇게 움직여요.', createdAt: '2026-05-11T14:42:00+09:00', isSample: true },
      { replyId: 'r070', userId: 'f_09', originalLanguage: 'ko', originalContent: '마음먹는 거 자체가 챙기는 거 같아요.', createdAt: '2026-05-11T15:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p025',
    userId: 'f_06',
    categoryId: 'comforting-presence',
    originalLanguage: 'ko',
    originalContent: '내가 말 안 해도 분위기 알아채는 사람보다, 모르겠으면 그냥 물어봐주는 사람이 더 편해요. 알아맞히는 거 부담스러워요 사실.',
    createdAt: '2026-05-11T09:08:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r071', userId: 'f_01', originalLanguage: 'ko', originalContent: '이거 너무 동감해요. 알아맞혀주는 거 처음엔 좋은데 점점 부담스러워져요.', createdAt: '2026-05-11T10:12:00+09:00', isSample: true },
      { replyId: 'r072', userId: 'm_03', originalLanguage: 'ko', originalContent: '저도 알아채는 거 잘 못해서 다행입니다.', createdAt: '2026-05-11T11:33:00+09:00', isSample: true },
      { replyId: 'r073', userId: 'm_06', originalLanguage: 'ko', originalContent: '알아채는 척하는 사람들이 더 부담스럽긴 합니다.', createdAt: '2026-05-11T12:08:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p026',
    userId: 'm_10',
    categoryId: 'comforting-presence',
    originalLanguage: 'ko',
    originalContent: '오랜만에 만나도 그동안 안부 캐묻지 않고 그냥 옆에 앉는 친구. 그게 진짜인 거 같습니다.',
    createdAt: '2026-05-10T22:54:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r074', userId: 'm_09', originalLanguage: 'ko', originalContent: '그런 친구 한 명이면 인생 잘 산 거라고 하잖아요.', createdAt: '2026-05-10T23:42:00+09:00', isSample: true },
      { replyId: 'r075', userId: 'f_05', originalLanguage: 'ko', originalContent: '안부를 안 묻는 게 진짜 안부인 경우가 있어요.', createdAt: '2026-05-11T08:18:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p027',
    userId: 'm_08',
    categoryId: 'what-matters-in-love',
    originalLanguage: 'ko',
    originalContent: '화났을 때 어떻게 화내는지가 중요해요. 좋아한다는 말은 누구나 하는 거고.',
    createdAt: '2026-05-10T19:27:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r076', userId: 'f_08', originalLanguage: 'ko', originalContent: '이거 결혼 전에 봤어야 했네요.', createdAt: '2026-05-10T20:14:00+09:00', isSample: true },
      { replyId: 'r077', userId: 'm_05', originalLanguage: 'ko', originalContent: 'ㅋㅋㅋㅋ 댓글에 답이 다 나와있네요.', createdAt: '2026-05-10T21:33:00+09:00', isSample: true },
      { replyId: 'r078', userId: 'f_06', originalLanguage: 'ko', originalContent: '다툴 때 인격이 보인다는 게 진짜인 거 같아요.', createdAt: '2026-05-10T22:18:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p028',
    userId: 'f_02',
    categoryId: 'what-matters-in-love',
    originalLanguage: 'ko',
    originalContent: '같은 영화 보고 같은 장면에서 울 수 있는 사람. 굳이 설명 안 해도 되는 게 너무 좋아요.',
    createdAt: '2026-05-10T15:11:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r079', userId: 'f_03', originalLanguage: 'ko', originalContent: '그건 진짜 운입니다. 노력으로 안 돼요.', createdAt: '2026-05-10T16:22:00+09:00', isSample: true },
      { replyId: 'r080', userId: 'm_01', originalLanguage: 'ko', originalContent: '근데 같이 안 우는 사람이랑도 잘 만날 수 있어요. 우는 사람 옆에 휴지 가져다주는 사람도 있는 거잖아요.', createdAt: '2026-05-10T17:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p029',
    userId: 'm_05',
    categoryId: 'free-thought',
    originalLanguage: 'ko',
    originalContent: '오늘 점심으로 김밥이랑 우동 같이 먹은 거 후회 안 합니다. 누가 뭐라 해도.',
    createdAt: '2026-05-10T11:48:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r081', userId: 'f_04', originalLanguage: 'ko', originalContent: '탄수화물 두 번이라고 뭐라 하는 사람이 이상한 거예요.', createdAt: '2026-05-10T12:14:00+09:00', isSample: true },
      { replyId: 'r082', userId: 'm_06', originalLanguage: 'ko', originalContent: '그게 한국인의 점심입니다.', createdAt: '2026-05-10T12:55:00+09:00', isSample: true },
      { replyId: 'r083', userId: 'f_07', originalLanguage: 'ko', originalContent: '저녁에 라면도 드세요. 응원합니다.', createdAt: '2026-05-10T14:22:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p030',
    userId: 'm_04',
    categoryId: 'free-thought',
    originalLanguage: 'ko',
    originalContent: '비 오는 날 출근하기 싫은 건 게으름이 아니라 신체의 자연스러운 반응이라고 생각합니다.',
    createdAt: '2026-05-10T08:33:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r084', userId: 'm_02', originalLanguage: 'ko', originalContent: '그 자연스러운 반응에 회사가 동의하지 않는다는 게 문제죠.', createdAt: '2026-05-10T09:18:00+09:00', isSample: true },
      { replyId: 'r085', userId: 'f_10', originalLanguage: 'ko', originalContent: '비 오는 날 늦잠 자도 되는 사회를 만들어야 합니다.', createdAt: '2026-05-10T10:42:00+09:00', isSample: true },
      { replyId: 'r086', userId: 'm_07', originalLanguage: 'ko', originalContent: '진화론적으로 설명 가능한 현상입니다.', createdAt: '2026-05-10T11:08:00+09:00', isSample: true },
    ],
  },

  {
    postId: 'p031',
    userId: 'en_01',
    categoryId: 'quiet-loneliness',
    originalLanguage: 'en',
    originalContent: "Sometimes I'll go a whole weekend without speaking to anyone in person and not notice until Monday. Not bad exactly. Just quiet in a way that catches me later.",
    createdAt: '2026-05-16T11:42:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r087', userId: 'en_02', originalLanguage: 'en', originalContent: "I do this without realizing. Then someone at the grocery store says hi and I sound like I forgot how to talk.", createdAt: '2026-05-16T12:14:00+09:00', isSample: true },
      { replyId: 'r088', userId: 'en_04', originalLanguage: 'en', originalContent: "There's a difference between alone and lonely. You're describing the first one, I think.", createdAt: '2026-05-16T13:02:00+09:00', isSample: true },
      { replyId: 'r089', userId: 'f_05', originalLanguage: 'ko', originalContent: '조용한 주말이 깊은 휴식이 되는 사람도 있고 외로움이 되는 사람도 있는 거 같아요. 두 감각이 비슷한 얼굴로 와서 헷갈리기도 하고요.', createdAt: '2026-05-16T15:38:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p032',
    userId: 'en_02',
    categoryId: 'lingering-sentence',
    originalLanguage: 'en',
    originalContent: "My friend said you're allowed to rest before you're tired, and I've been thinking about it for three days. I don't know why that one landed.",
    createdAt: '2026-05-16T07:18:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r090', userId: 'en_03', originalLanguage: 'en', originalContent: "I needed to read this today. Thank you.", createdAt: '2026-05-16T08:22:00+09:00', isSample: true },
      { replyId: 'r091', userId: 'en_01', originalLanguage: 'en', originalContent: "Pretty sure I've been ignoring that exact rule for fifteen years.", createdAt: '2026-05-16T09:48:00+09:00', isSample: true },
      { replyId: 'r092', userId: 'en_04', originalLanguage: 'en', originalContent: "Saving this. Who said it?", createdAt: '2026-05-16T10:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p033',
    userId: 'en_03',
    categoryId: 'comforting-presence',
    originalLanguage: 'en',
    originalContent: "I have one friend who never asks how I am when I haven't slept well. He just slides his coffee over.",
    createdAt: '2026-05-15T17:08:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r093', userId: 'en_02', originalLanguage: 'en', originalContent: "That's a good friend. Don't lose track of him.", createdAt: '2026-05-15T18:24:00+09:00', isSample: true },
      { replyId: 'r094', userId: 'en_01', originalLanguage: 'en', originalContent: "The not-asking is the whole thing, isn't it.", createdAt: '2026-05-15T20:08:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p034',
    userId: 'en_04',
    categoryId: 'free-thought',
    originalLanguage: 'en',
    originalContent: "Bought flowers for myself today. Felt slightly embarrassing for about four seconds, and then completely fine.",
    createdAt: '2026-05-15T12:30:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r095', userId: 'en_03', originalLanguage: 'en', originalContent: "Do this once a month. Truly recommend.", createdAt: '2026-05-15T13:55:00+09:00', isSample: true },
      { replyId: 'r096', userId: 'en_02', originalLanguage: 'en', originalContent: "Why do we get embarrassed about being kind to ourselves. Strange habit.", createdAt: '2026-05-15T15:12:00+09:00', isSample: true },
      { replyId: 'r097', userId: 'en_01', originalLanguage: 'en', originalContent: "What kind?", createdAt: '2026-05-15T16:48:00+09:00', isSample: true },
    ],
  },

  {
    postId: 'p035',
    userId: 'ja_01',
    categoryId: 'quiet-loneliness',
    originalLanguage: 'ja',
    originalContent: '電車の中で誰かが読んでいる本のタイトルが気になって、声をかけたい気持ちになるけど、結局ずっと声をかけない。あの感覚に名前があればいいのに。',
    createdAt: '2026-05-14T14:22:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r098', userId: 'ja_02', originalLanguage: 'ja', originalContent: 'それ、すごくわかります。私も結局ずっと話しかけない側です。', createdAt: '2026-05-14T15:08:00+09:00', isSample: true },
      { replyId: 'r099', userId: 'ja_04', originalLanguage: 'ja', originalContent: '勇気がある人に憧れるけど、自分はそうはなれない、そんな感じですよね。', createdAt: '2026-05-14T17:33:00+09:00', isSample: true },
      { replyId: 'r100', userId: 'm_09', originalLanguage: 'ko', originalContent: '그 감각, 일본어로는 어떻게 부르세요? 한국에는 딱 맞는 단어가 없네요.', createdAt: '2026-05-14T19:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p036',
    userId: 'ja_02',
    categoryId: 'private-habit',
    originalLanguage: 'ja',
    originalContent: '夜寝る前に必ず冷蔵庫を開けて、何も取らずに閉める。意味はないんだけど、しないとなんとなく落ち着かない。',
    createdAt: '2026-05-14T08:55:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r101', userId: 'ja_03', originalLanguage: 'ja', originalContent: 'わかります。中を見るというより、儀式みたいなものですよね。', createdAt: '2026-05-14T10:22:00+09:00', isSample: true },
      { replyId: 'r102', userId: 'ja_01', originalLanguage: 'ja', originalContent: 'うちもです。意味のない習慣のおかげで眠れる夜があると思ってます。', createdAt: '2026-05-14T12:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p037',
    userId: 'ja_03',
    categoryId: 'lasting-affection',
    originalLanguage: 'ja',
    originalContent: '高校のときの帰り道、自転車で坂を下りながら一緒に歌った歌があるんだけど、その曲を今聴くと、その坂の風がまだ顔に当たる気がする。',
    createdAt: '2026-05-13T19:48:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r103', userId: 'ja_04', originalLanguage: 'ja', originalContent: 'あの時期の記憶って、なんであんなに鮮明なんでしょうね。', createdAt: '2026-05-13T20:45:00+09:00', isSample: true },
      { replyId: 'r104', userId: 'ja_02', originalLanguage: 'ja', originalContent: '風と歌、もう完璧に映画のシーンですよね。', createdAt: '2026-05-13T22:14:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p038',
    userId: 'ja_04',
    categoryId: 'recurring-feeling',
    originalLanguage: 'ja',
    originalContent: 'がんばっている人を見ると、ちゃんと褒めたいのに、口に出すのが恥ずかしくて結局言えない。最近よくそう思う。',
    createdAt: '2026-05-13T15:11:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r105', userId: 'ja_01', originalLanguage: 'ja', originalContent: 'わかります。心の中ではちゃんと褒めてるんですけど、口に出すと急に変な感じになるんですよね。', createdAt: '2026-05-13T16:28:00+09:00', isSample: true },
      { replyId: 'r106', userId: 'ja_03', originalLanguage: 'ja', originalContent: '本人に届かないとしても、思ってることが大事だと思います。', createdAt: '2026-05-13T18:42:00+09:00', isSample: true },
    ],
  },

  {
    postId: 'p039',
    userId: 'zh_01',
    categoryId: 'stance-in-relationships',
    originalLanguage: 'zh',
    originalContent: '我现在比较看重那种,你不联系他他也不会觉得你冷淡的关系。不用解释自己,挺难得的。',
    createdAt: '2026-05-13T07:33:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r107', userId: 'zh_02', originalLanguage: 'zh', originalContent: '这种关系真的难得,大部分人都会觉得需要不停回应。', createdAt: '2026-05-13T09:18:00+09:00', isSample: true },
      { replyId: 'r108', userId: 'zh_03', originalLanguage: 'zh', originalContent: '我和最好的朋友就是这样,三个月不联系也不会觉得疏远。', createdAt: '2026-05-13T11:55:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p040',
    userId: 'zh_02',
    categoryId: 'unsaid-words',
    originalLanguage: 'zh',
    originalContent: '想跟以前的同桌说一句:那时候我抄你作业,其实是因为我家里那阵子很乱。一直没找到合适的时机说。',
    createdAt: '2026-05-12T17:25:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r109', userId: 'zh_04', originalLanguage: 'zh', originalContent: '她可能早就忘了,但你说出来对自己也好。', createdAt: '2026-05-12T18:42:00+09:00', isSample: true },
      { replyId: 'r110', userId: 'zh_01', originalLanguage: 'zh', originalContent: '找不到合适的时机,本身就是很多话留下来的原因。', createdAt: '2026-05-12T21:08:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p041',
    userId: 'zh_03',
    categoryId: 'quiet-message',
    originalLanguage: 'zh',
    originalContent: '老爸,我现在才明白你年轻时候为什么不爱说话。压在心里的事情,有时候真的不知道怎么开口。',
    createdAt: '2026-05-12T13:42:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r111', userId: 'zh_02', originalLanguage: 'zh', originalContent: '你说出来本身就是一种回应,他可能也在用同样的方式想你。', createdAt: '2026-05-12T15:28:00+09:00', isSample: true },
      { replyId: 'r112', userId: 'zh_04', originalLanguage: 'zh', originalContent: '我也是这两年才开始有点明白父母年轻时的沉默。', createdAt: '2026-05-12T17:15:00+09:00', isSample: true },
      { replyId: 'r113', userId: 'm_08', originalLanguage: 'ko', originalContent: '저도 아버지께 비슷한 마음 빚이 있어요. 우리 세대 남자들이 다 그런 거 같습니다.', createdAt: '2026-05-12T19:42:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p042',
    userId: 'zh_04',
    categoryId: 'comforting-presence',
    originalLanguage: 'zh',
    originalContent: '和他在一起最舒服的是,我可以发呆很久,他也不会问我在想什么。这种安静比聊天还让人放松。',
    createdAt: '2026-05-12T09:18:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r114', userId: 'zh_01', originalLanguage: 'zh', originalContent: '这种相处真的舒服,不用解释每一个表情。', createdAt: '2026-05-12T10:55:00+09:00', isSample: true },
      { replyId: 'r115', userId: 'zh_03', originalLanguage: 'zh', originalContent: '安静的陪伴比说话更有重量。', createdAt: '2026-05-12T12:22:00+09:00', isSample: true },
    ],
  },

  {
    postId: 'p043',
    userId: 'es_01',
    categoryId: 'what-matters-in-love',
    originalLanguage: 'es',
    originalContent: 'Me importa más cómo alguien escucha que cómo habla. Lo aprendí tarde, pero lo aprendí.',
    createdAt: '2026-05-11T18:55:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r116', userId: 'es_02', originalLanguage: 'es', originalContent: 'Llegué a la misma conclusión, pero después de demasiados años hablando demasiado.', createdAt: '2026-05-11T20:14:00+09:00', isSample: true },
      { replyId: 'r117', userId: 'es_03', originalLanguage: 'es', originalContent: 'Escuchar bien es un arte que casi nadie practica.', createdAt: '2026-05-11T22:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p044',
    userId: 'es_02',
    categoryId: 'todays-passing-thought',
    originalLanguage: 'es',
    originalContent: 'Hoy en la cafetería un señor le dio su periódico a otro señor sin decir nada, como si fueran amigos de hace cuarenta años. Quizá lo eran.',
    createdAt: '2026-05-11T14:08:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r118', userId: 'es_04', originalLanguage: 'es', originalContent: 'Esas escenas pequeñas valen más que muchas películas. Gracias por contarla.', createdAt: '2026-05-11T15:38:00+09:00', isSample: true },
      { replyId: 'r119', userId: 'es_01', originalLanguage: 'es', originalContent: 'Me imagino que sí lo eran. Hay amistades que no necesitan palabras.', createdAt: '2026-05-11T17:22:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p045',
    userId: 'es_03',
    categoryId: 'lingering-sentence',
    originalLanguage: 'es',
    originalContent: 'Mi abuela me dijo una vez que no se trata de no llorar — se trata de no llorar solo. Tenía razón en demasiadas cosas.',
    createdAt: '2026-05-11T07:42:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r120', userId: 'es_02', originalLanguage: 'es', originalContent: 'Tu abuela tenía razón. La compañía cambia todo, incluso el llanto.', createdAt: '2026-05-11T09:14:00+09:00', isSample: true },
      { replyId: 'r121', userId: 'es_04', originalLanguage: 'es', originalContent: 'Guardé esta frase. Gracias por compartirla.', createdAt: '2026-05-11T11:48:00+09:00', isSample: true },
    ],
  },
  {
    postId: 'p046',
    userId: 'es_04',
    categoryId: 'private-habit',
    originalLanguage: 'es',
    originalContent: 'Siempre dejo una luz prendida cuando salgo de casa, aunque sé que no hay nadie esperándome. Llegar a una casa con luz se siente distinto.',
    createdAt: '2026-05-10T20:14:00+09:00',
    isSample: true,
    replies: [
      { replyId: 'r122', userId: 'es_01', originalLanguage: 'es', originalContent: 'Yo también dejo una lámpara prendida. Y nunca lo había pensado así.', createdAt: '2026-05-10T21:38:00+09:00', isSample: true },
      { replyId: 'r123', userId: 'es_03', originalLanguage: 'es', originalContent: 'Me parece tierno. Una luz vale más que un cartel de bienvenida.', createdAt: '2026-05-10T22:55:00+09:00', isSample: true },
      { replyId: 'r124', userId: 'f_01', originalLanguage: 'ko', originalContent: '불 켜진 집에 들어가는 게 다른 거, 그 표현이 너무 좋아요. 저도 그래서 가끔 그래요.', createdAt: '2026-05-11T08:22:00+09:00', isSample: true },
    ],
  },
];

export const SEED_TRANSLATIONS: SeedTranslation[] = [
  { translationId: 'tr_001', targetType: 'post', targetId: 'p031', sourceLanguage: 'en', targetLanguage: 'ko', translatedContent: '주말 내내 누구와도 직접 한마디도 안 하고 지내다가 월요일에야 그걸 깨닫는 날들이 있어요. 나쁘다고는 못 하겠고요. 그냥 나중에 와 닿는 종류의 고요함이에요.', provider: 'manual', status: 'completed', createdAt: '2026-05-16T11:50:00+09:00' },
  { translationId: 'tr_002', targetType: 'post', targetId: 'p032', sourceLanguage: 'en', targetLanguage: 'ko', translatedContent: '친구가 지치기 전에 쉬어도 되는 거라고 말해줬는데, 그 말이 사흘째 머릿속을 떠나지 않아요. 왜 그 말이 그렇게 와닿았는지 모르겠어요.', provider: 'manual', status: 'completed', createdAt: '2026-05-16T07:25:00+09:00' },
  { translationId: 'tr_003', targetType: 'post', targetId: 'p033', sourceLanguage: 'en', targetLanguage: 'ko', translatedContent: '잠 못 잔 날에는 안부를 안 묻는 친구가 한 명 있어요. 그냥 자기 커피를 슬쩍 옆으로 밀어주는 친구.', provider: 'manual', status: 'completed', createdAt: '2026-05-15T17:14:00+09:00' },
  { translationId: 'tr_004', targetType: 'post', targetId: 'p034', sourceLanguage: 'en', targetLanguage: 'ko', translatedContent: '오늘은 나한테 꽃을 사줬어요. 한 4초 정도 약간 머쓱했고, 그 뒤로는 그냥 좋았어요.', provider: 'manual', status: 'completed', createdAt: '2026-05-15T12:38:00+09:00' },

  { translationId: 'tr_005', targetType: 'post', targetId: 'p035', sourceLanguage: 'ja', targetLanguage: 'ko', translatedContent: '전철에서 누가 읽는 책 제목이 신경 쓰여서 말 걸고 싶어지는데, 결국 끝까지 말 못 걸어요. 그 감각에 이름이 있었으면 좋겠어요.', provider: 'manual', status: 'completed', createdAt: '2026-05-14T14:30:00+09:00' },
  { translationId: 'tr_006', targetType: 'post', targetId: 'p035', sourceLanguage: 'ja', targetLanguage: 'en', translatedContent: "Something about a stranger's book on the train pulls at me, like I should say something. I never do. I wish that feeling had a name.", provider: 'manual', status: 'completed', createdAt: '2026-05-14T14:30:00+09:00' },
  { translationId: 'tr_007', targetType: 'post', targetId: 'p036', sourceLanguage: 'ja', targetLanguage: 'ko', translatedContent: '자기 전에 꼭 냉장고를 열어요. 아무것도 안 꺼내고 그냥 닫는데, 안 하면 어쩐지 잠이 안 와요.', provider: 'manual', status: 'completed', createdAt: '2026-05-14T09:00:00+09:00' },
  { translationId: 'tr_008', targetType: 'post', targetId: 'p037', sourceLanguage: 'ja', targetLanguage: 'ko', translatedContent: '고등학교 때 자전거로 비탈길을 내려가면서 같이 부르던 노래가 있어요. 지금 그 곡을 들으면 그 비탈길의 바람이 아직 얼굴에 닿는 느낌이에요.', provider: 'manual', status: 'completed', createdAt: '2026-05-13T19:55:00+09:00' },
  { translationId: 'tr_009', targetType: 'post', targetId: 'p037', sourceLanguage: 'ja', targetLanguage: 'en', translatedContent: "We used to sing a song on the way home from school, riding down a hill on bikes. When I hear it now, I can still feel the wind from that hill on my face.", provider: 'manual', status: 'completed', createdAt: '2026-05-13T19:55:00+09:00' },
  { translationId: 'tr_010', targetType: 'post', targetId: 'p038', sourceLanguage: 'ja', targetLanguage: 'ko', translatedContent: '열심히 사는 사람을 보면 제대로 칭찬하고 싶은데, 말로 꺼내는 게 부끄러워서 결국 못 해요. 요즘 자주 그래요.', provider: 'manual', status: 'completed', createdAt: '2026-05-13T15:18:00+09:00' },

  { translationId: 'tr_011', targetType: 'post', targetId: 'p039', sourceLanguage: 'zh', targetLanguage: 'ko', translatedContent: '요즘은 연락 안 한다고 차갑게 느끼지 않는 사이가 더 좋아요. 자기를 설명하지 않아도 되는 관계는 흔치 않아요.', provider: 'manual', status: 'completed', createdAt: '2026-05-13T07:40:00+09:00' },
  { translationId: 'tr_012', targetType: 'post', targetId: 'p040', sourceLanguage: 'zh', targetLanguage: 'ko', translatedContent: '예전 짝꿍한테 한마디 하고 싶어요. 그때 내가 너 숙제 베낀 거, 사실 우리 집이 한참 어수선해서였어. 적당한 때를 못 찾았을 뿐이야.', provider: 'manual', status: 'completed', createdAt: '2026-05-12T17:32:00+09:00' },
  { translationId: 'tr_013', targetType: 'post', targetId: 'p041', sourceLanguage: 'zh', targetLanguage: 'ko', translatedContent: '아빠, 이제야 알았어요. 젊을 때 왜 말이 없으셨는지. 마음에 쌓인 게 있을 때는 정말 어떻게 꺼내야 할지 모르겠더라고요.', provider: 'manual', status: 'completed', createdAt: '2026-05-12T13:48:00+09:00' },
  { translationId: 'tr_014', targetType: 'post', targetId: 'p041', sourceLanguage: 'zh', targetLanguage: 'en', translatedContent: "Dad, I only get it now — why you didn't speak much when you were young. When something is heavy inside, you really don't know how to open your mouth.", provider: 'manual', status: 'completed', createdAt: '2026-05-12T13:48:00+09:00' },
  { translationId: 'tr_015', targetType: 'post', targetId: 'p042', sourceLanguage: 'zh', targetLanguage: 'ko', translatedContent: '그 사람이랑 같이 있을 때 제일 편한 건, 내가 한참 멍하니 있어도 뭐 생각하느냐고 안 묻는다는 거예요. 대화보다 그 고요함이 더 편안해요.', provider: 'manual', status: 'completed', createdAt: '2026-05-12T09:25:00+09:00' },

  { translationId: 'tr_016', targetType: 'post', targetId: 'p043', sourceLanguage: 'es', targetLanguage: 'ko', translatedContent: '누가 말하는 방식보다 듣는 방식이 더 중요해요. 늦게 배웠지만 어쨌든 배웠어요.', provider: 'manual', status: 'completed', createdAt: '2026-05-11T19:02:00+09:00' },
  { translationId: 'tr_017', targetType: 'post', targetId: 'p044', sourceLanguage: 'es', targetLanguage: 'ko', translatedContent: '오늘 카페에서 어떤 아저씨가 다른 아저씨한테 아무 말 없이 신문을 건넸어요. 40년 친구처럼요. 어쩌면 진짜 그럴지도.', provider: 'manual', status: 'completed', createdAt: '2026-05-11T14:15:00+09:00' },
  { translationId: 'tr_018', targetType: 'post', targetId: 'p045', sourceLanguage: 'es', targetLanguage: 'ko', translatedContent: '할머니가 저한테 한 번 말씀하셨어요. 울지 않는 게 중요한 게 아니라 혼자 울지 않는 게 중요한 거라고요. 너무 많은 일에 맞는 말이었어요.', provider: 'manual', status: 'completed', createdAt: '2026-05-11T07:50:00+09:00' },
  { translationId: 'tr_019', targetType: 'post', targetId: 'p045', sourceLanguage: 'es', targetLanguage: 'en', translatedContent: "My grandmother told me once that it's not about not crying — it's about not crying alone. She was right about too many things.", provider: 'manual', status: 'completed', createdAt: '2026-05-11T07:50:00+09:00' },
  { translationId: 'tr_020', targetType: 'post', targetId: 'p046', sourceLanguage: 'es', targetLanguage: 'ko', translatedContent: '외출할 때 늘 불을 하나 켜두고 나가요. 아무도 기다리지 않는 집인데도요. 불 켜진 집에 들어가는 건 느낌이 달라요.', provider: 'manual', status: 'completed', createdAt: '2026-05-10T20:22:00+09:00' },

  { translationId: 'tr_021', targetType: 'reply', targetId: 'r089', sourceLanguage: 'ko', targetLanguage: 'en', translatedContent: "Some people find deep rest in a quiet weekend; others find loneliness. The two can wear similar faces, and it's hard to tell which one showed up.", provider: 'manual', status: 'completed', createdAt: '2026-05-16T15:45:00+09:00' },
  { translationId: 'tr_022', targetType: 'reply', targetId: 'r100', sourceLanguage: 'ko', targetLanguage: 'ja', translatedContent: 'その感覚、日本語ではどう呼ぶんですか? 韓国語にはぴったりの言葉がなくて。', provider: 'manual', status: 'completed', createdAt: '2026-05-14T20:02:00+09:00' },
  { translationId: 'tr_023', targetType: 'reply', targetId: 'r113', sourceLanguage: 'ko', targetLanguage: 'zh', translatedContent: '我对父亲也有类似的心债。我们这代男人,好像都是这样。', provider: 'manual', status: 'completed', createdAt: '2026-05-12T19:48:00+09:00' },
  { translationId: 'tr_024', targetType: 'reply', targetId: 'r124', sourceLanguage: 'ko', targetLanguage: 'es', translatedContent: 'Entrar a una casa con luz se siente distinto — esa frase me encantó. Yo también lo hago a veces.', provider: 'manual', status: 'completed', createdAt: '2026-05-11T08:28:00+09:00' },
];

export const SEED_CONVERSATIONS: SeedConversation[] = [
  { conversationId: 'conv_001', postId: 'p001', rootCommentId: 'r003', inviterUserId: 'm_01', invitedUserId: 'f_05', participants: ['m_01', 'f_05'], createdAt: '2026-05-16T22:14:00+09:00', lastMessageAt: '2026-05-17T09:48:00+09:00', status: 'active', isSample: true },
  { conversationId: 'conv_002', postId: 'p017', rootCommentId: 'r048', inviterUserId: 'f_06', invitedUserId: 'm_01', participants: ['f_06', 'm_01'], createdAt: '2026-05-13T11:45:00+09:00', lastMessageAt: '2026-05-13T18:22:00+09:00', status: 'active', isSample: true },
  { conversationId: 'conv_003', postId: 'p010', rootCommentId: 'r027', inviterUserId: 'm_02', invitedUserId: 'f_06', participants: ['m_02', 'f_06'], createdAt: '2026-05-14T17:08:00+09:00', lastMessageAt: '2026-05-15T08:33:00+09:00', status: 'active', isSample: true },
];

export const SEED_MESSAGES: SeedMessage[] = [
  { messageId: 'msg_001', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '여기로 이어주셔서 고맙습니다. 처음이라 그런지 한 줄 적기도 조심스러워지네요.', createdAt: '2026-05-16T22:48:00+09:00', isSample: true },
  { messageId: 'msg_002', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '저도요. 글 아래보다 조금 더 천천히 말 걸어볼 수 있어서 다행이에요.', createdAt: '2026-05-17T08:12:00+09:00', isSample: true },
  { messageId: 'msg_003', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '그러게요. 단무지 잘못 들어간 이야기로 시작했는데, 이렇게 이어질 줄은 몰랐어요.', createdAt: '2026-05-17T09:22:00+09:00', isSample: true },
  { messageId: 'msg_004', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '그런 게 좋은 거 같아요. 별일 아닌 게 어떻게 한 자리에 데려다 놓는지.', createdAt: '2026-05-17T09:48:00+09:00', isSample: true },

  { messageId: 'msg_005', conversationId: 'conv_002', senderId: 'f_06', originalLanguage: 'ko', originalContent: '이쪽으로 와주셔서 감사해요. 글 한 줄에서 이어진 건 처음이에요.', createdAt: '2026-05-13T12:08:00+09:00', isSample: true },
  { messageId: 'msg_006', conversationId: 'conv_002', senderId: 'm_01', originalLanguage: 'ko', originalContent: '저도 처음이에요. 그래서 어떻게 시작해야 할지 몰라서, 인사부터 적어봅니다.', createdAt: '2026-05-13T14:33:00+09:00', isSample: true },
  { messageId: 'msg_007', conversationId: 'conv_002', senderId: 'f_06', originalLanguage: 'ko', originalContent: '그 정도가 적당한 거 같아요. 천천히 가는 게 우리 둘 다 편할 거 같아요.', createdAt: '2026-05-13T18:22:00+09:00', isSample: true },

  { messageId: 'msg_008', conversationId: 'conv_003', senderId: 'm_02', originalLanguage: 'ko', originalContent: '여기서 이어가게 됐네요. 그쪽 답글이 너무 정확해서 한 번 더 적게 됐어요.', createdAt: '2026-05-14T18:14:00+09:00', isSample: true },
  { messageId: 'msg_009', conversationId: 'conv_003', senderId: 'f_06', originalLanguage: 'ko', originalContent: '그렇게 봐주셔서 좋아요. 글 결이 잘 맞는 사람과 이야기하는 게 드문 일이에요.', createdAt: '2026-05-14T20:42:00+09:00', isSample: true },
  { messageId: 'msg_010', conversationId: 'conv_003', senderId: 'm_02', originalLanguage: 'ko', originalContent: '맞아요. 그래서 너무 서두르고 싶지 않아요. 천천히 가요.', createdAt: '2026-05-15T08:33:00+09:00', isSample: true },

  { messageId: 'msg_011', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '괜찮다면 서로 지역을 슬쩍 열어볼까요?', createdAt: '2026-05-17T10:14:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'region' },
  { messageId: 'msg_012', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '좋아요. 천천히 알아가는 거니까요.', createdAt: '2026-05-17T10:35:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'region' },
  { messageId: 'msg_013', conversationId: 'conv_001', senderId: 'system', originalLanguage: 'ko', originalContent: '지역이 서로에게 열렸어요.', createdAt: '2026-05-17T10:35:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'region' },
  { messageId: 'msg_014', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '꽤 가까운 동네라 신기했어요.', createdAt: '2026-05-17T13:22:00+09:00', isSample: true },
  { messageId: 'msg_015', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '저도요. 의외인 게 의외로 가까이 있더라고요.', createdAt: '2026-05-17T14:08:00+09:00', isSample: true },
  { messageId: 'msg_016', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '괜찮으면 나이도 같이 알려줄까요?', createdAt: '2026-05-17T18:42:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'age' },
  { messageId: 'msg_017', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '그렇게 해요.', createdAt: '2026-05-17T19:18:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'age' },
  { messageId: 'msg_018', conversationId: 'conv_001', senderId: 'system', originalLanguage: 'ko', originalContent: '나이가 서로에게 열렸어요.', createdAt: '2026-05-17T19:18:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'age' },
  { messageId: 'msg_019', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '비슷한 또래라 더 편한 느낌이에요.', createdAt: '2026-05-17T21:48:00+09:00', isSample: true },
  { messageId: 'msg_020', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '사진도 공유해볼까요?', createdAt: '2026-05-18T09:22:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'photo' },
  { messageId: 'msg_021', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '좋아요. 부담스럽지 않게요.', createdAt: '2026-05-18T11:35:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'photo' },
  { messageId: 'msg_022', conversationId: 'conv_001', senderId: 'system', originalLanguage: 'ko', originalContent: '사진이 서로에게 열렸어요.', createdAt: '2026-05-18T11:35:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'photo' },
  { messageId: 'msg_023', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '사진 보고 더 편해진 것 같아요.', createdAt: '2026-05-18T14:48:00+09:00', isSample: true },
  { messageId: 'msg_024', conversationId: 'conv_001', senderId: 'm_01', originalLanguage: 'ko', originalContent: '이제 연락처도 알려줄 수 있을까요?', createdAt: '2026-05-18T20:14:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'contact' },
  { messageId: 'msg_025', conversationId: 'conv_001', senderId: 'f_05', originalLanguage: 'ko', originalContent: '좋아요. 천천히 시작해 봐요.', createdAt: '2026-05-18T22:38:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'contact' },
  { messageId: 'msg_026', conversationId: 'conv_001', senderId: 'system', originalLanguage: 'ko', originalContent: '연락처가 서로에게 열렸어요.', createdAt: '2026-05-18T22:38:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'contact' },

  { messageId: 'msg_027', conversationId: 'conv_002', senderId: 'f_06', originalLanguage: 'ko', originalContent: '괜찮다면 지역도 슬쩍 열어볼까요?', createdAt: '2026-05-13T20:08:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'region' },
  { messageId: 'msg_028', conversationId: 'conv_002', senderId: 'm_01', originalLanguage: 'ko', originalContent: '좋아요. 가까운 곳이면 좋겠네요.', createdAt: '2026-05-13T22:14:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'region' },
  { messageId: 'msg_029', conversationId: 'conv_002', senderId: 'system', originalLanguage: 'ko', originalContent: '지역이 서로에게 열렸어요.', createdAt: '2026-05-13T22:14:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'region' },
  { messageId: 'msg_030', conversationId: 'conv_002', senderId: 'f_06', originalLanguage: 'ko', originalContent: '괜찮다면 나이도 같이 알려줄까요?', createdAt: '2026-05-14T08:42:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'age' },
  { messageId: 'msg_031', conversationId: 'conv_002', senderId: 'm_01', originalLanguage: 'ko', originalContent: '조금 더 천천히 알아가고 싶어요.', createdAt: '2026-05-14T10:18:00+09:00', isSample: true, kind: 'disclosure_declined', disclosureKind: 'age' },

  { messageId: 'msg_032', conversationId: 'conv_003', senderId: 'm_02', originalLanguage: 'ko', originalContent: '괜찮다면 서로 지역을 슬쩍 열어볼까요?', createdAt: '2026-05-15T11:22:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'region' },
  { messageId: 'msg_033', conversationId: 'conv_003', senderId: 'f_06', originalLanguage: 'ko', originalContent: '좋아요.', createdAt: '2026-05-15T13:48:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'region' },
  { messageId: 'msg_034', conversationId: 'conv_003', senderId: 'system', originalLanguage: 'ko', originalContent: '지역이 서로에게 열렸어요.', createdAt: '2026-05-15T13:48:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'region' },
  { messageId: 'msg_035', conversationId: 'conv_003', senderId: 'm_02', originalLanguage: 'ko', originalContent: '나이도 같이 알려줄까요?', createdAt: '2026-05-15T17:22:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'age' },
  { messageId: 'msg_036', conversationId: 'conv_003', senderId: 'f_06', originalLanguage: 'ko', originalContent: '그러죠.', createdAt: '2026-05-15T19:08:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'age' },
  { messageId: 'msg_037', conversationId: 'conv_003', senderId: 'system', originalLanguage: 'ko', originalContent: '나이가 서로에게 열렸어요.', createdAt: '2026-05-15T19:08:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'age' },
  { messageId: 'msg_038', conversationId: 'conv_003', senderId: 'm_02', originalLanguage: 'ko', originalContent: '이제 사진도 공유해볼까요?', createdAt: '2026-05-16T11:22:00+09:00', isSample: true, kind: 'disclosure_request', disclosureKind: 'photo' },
  { messageId: 'msg_039', conversationId: 'conv_003', senderId: 'f_06', originalLanguage: 'ko', originalContent: '좋아요. 천천히요.', createdAt: '2026-05-16T14:48:00+09:00', isSample: true, kind: 'disclosure_accepted', disclosureKind: 'photo' },
  { messageId: 'msg_040', conversationId: 'conv_003', senderId: 'system', originalLanguage: 'ko', originalContent: '사진이 서로에게 열렸어요.', createdAt: '2026-05-16T14:48:02+09:00', isSample: true, kind: 'disclosure_info', disclosureKind: 'photo' },
];
