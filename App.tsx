import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { checkSupabaseHealth } from './src/api/health';
import { runSupabaseSmokeTests } from './src/api/smoke-test';
import { POST_LENGTH_RULES, REPLY_LENGTH_RULES } from './lib/post-policy';
import { checkSafety, isWriteBlocked, reportViolation } from './src/safety';
import {
  createPost as createPostRemote,
  listPosts as listPostsRemote,
  getPostById as getPostByIdRemote,
  updatePost as updatePostRemote,
  deletePost as deletePostRemote,
} from './src/api/posts';
import {
  createReply as createReplyRemote,
  listCommentsByPost as listCommentsByPostRemote,
  deleteComment as deleteCommentRemote,
  hideComment as hideCommentRemote,
  updateComment as updateCommentRemote,
} from './src/api/comments';
import {
  createInvite as createInviteRemote,
  acceptInvite as acceptInviteRemote,
  declineInvite as declineInviteRemote,
  withdrawInvite as withdrawInviteRemote,
} from './src/api/invites';
import {
  createConversation as createConversationRemote,
  listMyConversations as listMyConversationsRemote,
  leaveConversation as leaveConversationRemote,
} from './src/api/conversations';
import {
  getProfileByUserId,
  saveProfile as saveProfileRemote,
} from './src/api/profiles';
import { deleteAccount as deleteAccountRemote } from './src/api/account';
import {
  reportContent as reportContentRemote,
  REPORT_REASON_LABELS,
  type ReportTargetType,
  type ReportReasonKind,
} from './src/api/reports';
import {
  blockUser as blockUserRemote,
  listMyBlockedIds,
} from './src/api/blocks';
import type {
  ConversationInviteStatus,
  DbConversation,
  DbPost,
  DbPostComment,
} from './src/types/db';
import { logger } from './src/lib/logger';
import { AuthProvider, useAuth, useCurrentUserId } from './src/auth/AuthContext';
import {
  signUpWithEmail,
  signInWithEmail,
  resendEmailVerification,
  signOut as signOutRemote,
} from './src/api/auth';
import {
  getLastLoginEmail,
  setLastLoginEmail,
} from './src/lib/last-email';
import { bumpDailyCount, loadDailyCount } from './src/lib/daily-counter';
import { signInWithGoogle } from './src/api/oauth-google';
import { signInWithApple, isAppleAuthSupported } from './src/api/oauth-apple';
import { signInWithKakao } from './src/api/oauth-kakao';

import {
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_POSTS,
  SEED_TRANSLATIONS,
  SEED_USERS,
  type ConversationInvite,
  type ConversationJoin,
  type Language,
  type SeedConversation,
  type SeedMessage,
  type SeedPost,
  type SeedReply,
  type SeedTranslation,
  type SeedUser,
  type TranslationTargetType,
} from './seed/seed-content';
import { generateSeedRepliesForPost } from './seed/auto-seed-replies';

type Category = {
  id: string;
  labels: Record<Language, string>;
};

const CATEGORIES: Category[] = [
  {
    id: 'free-thought',
    labels: {
      ko: '그냥 지금 떠오르는 자유로운 생각?',
      en: 'Whatever happens to be on your mind?',
      ja: 'いま頭に浮かんだ自由な考え?',
      zh: '此刻自由地浮现出来的一个念头?',
      es: '¿Lo que sea que te pase por la cabeza ahora?',
    },
  },
  {
    id: 'todays-passing-thought',
    labels: {
      ko: '오늘 하루를 보내면서 문득 들었던 생각?',
      en: 'A thought that quietly came to you today?',
      ja: '今日ふと心に浮かんだ考え?',
      zh: '今天突然涌上心头的一个念头?',
      es: '¿Un pensamiento que te vino hoy sin avisar?',
    },
  },
  {
    id: 'funniest-moment-today',
    labels: {
      ko: '오늘 가장 웃겼던 순간은 무엇이었나요?',
      en: 'What was the funniest moment today?',
      ja: '今日いちばん笑えた瞬間は?',
      zh: '今天最让你发笑的瞬间是什么?',
      es: '¿Cuál fue el momento más gracioso de hoy?',
    },
  },
  {
    id: 'quiet-loneliness',
    labels: {
      ko: '이유 없이 조금 외롭게 느껴지는 순간?',
      en: 'A moment that felt lonely for no clear reason?',
      ja: '理由もなく少し寂しく感じた瞬間?',
      zh: '那些莫名感到孤独的瞬间?',
      es: '¿Un momento en que te sentiste solo sin saber por qué?',
    },
  },
  {
    id: 'lasting-affection',
    labels: {
      ko: '내가 오랫동안 떠올리는 추억들?',
      en: 'Memories that keep finding you?',
      ja: 'ずっと心に残っている思い出?',
      zh: '一直在心里反复浮现的回忆?',
      es: '¿Recuerdos que vuelven una y otra vez?',
    },
  },
  {
    id: 'good-mood-today',
    labels: {
      ko: '오늘은 어떤 이유로 기분이 좋았나요?',
      en: 'What lifted your mood today?',
      ja: '今日はどんな理由で気分がよかったですか?',
      zh: '今天因为什么事让你心情变好了?',
      es: '¿Qué te alegró el día hoy?',
    },
  },
  {
    id: 'stance-in-relationships',
    labels: {
      ko: '인간관계에서 내가 중요하게 생각하는 태도?',
      en: 'Something you value about how people treat each other?',
      ja: '人との関わりで大切にしている姿勢?',
      zh: '在人际关系里你最看重的态度?',
      es: '¿Algo que valoras en cómo nos tratamos los unos a los otros?',
    },
  },
  {
    id: 'private-habit',
    labels: {
      ko: '혼자만 조용히 반복하는 나만의 습관?',
      en: 'A quiet habit only you repeat?',
      ja: 'ひそかに繰り返している自分だけの習慣?',
      zh: '只属于你的一个安静小习惯?',
      es: '¿Una pequeña costumbre que solo tú repites?',
    },
  },
  {
    id: 'small-mishap-today',
    labels: {
      ko: '오늘 있었던 작은 해프닝이 있나요?',
      en: 'Any small mishap that happened today?',
      ja: '今日あったちょっとしたハプニング?',
      zh: '今天发生过什么小插曲吗?',
      es: '¿Algún pequeño percance que te pasó hoy?',
    },
  },
  {
    id: 'quiet-message',
    labels: {
      ko: '누군가에게 조용히 전하고 싶은 마음?',
      en: 'Something you quietly want someone to hear?',
      ja: 'そっと誰かに伝えたい気持ち?',
      zh: '想悄悄说给某个人听的话?',
      es: '¿Algo que quisieras decirle a alguien en voz baja?',
    },
  },
  {
    id: 'lingering-sentence',
    labels: {
      ko: '오늘 마음속에 오래 남은 한 문장?',
      en: 'A sentence that stayed with you today?',
      ja: '今日心に長く残った一文?',
      zh: '今天在心里留得最久的一句话?',
      es: '¿Una frase que se te quedó hoy?',
    },
  },
  {
    id: 'unexpected-buoyancy',
    labels: {
      ko: '오늘 따라 괜히 들뜬 이유가 있나요?',
      en: 'Anything quietly lifting you today?',
      ja: 'なぜか今日少し浮き立っている理由は?',
      zh: '今天有什么让你莫名雀跃的事吗?',
      es: '¿Algo que te tiene de buen ánimo hoy sin saber por qué?',
    },
  },
  {
    id: 'unsaid-words',
    labels: {
      ko: '끝내 누군가에게 하지 못했던 말?',
      en: 'Words you never quite said to someone?',
      ja: '結局誰かに言えなかった言葉?',
      zh: '终究没能对某人说出口的话?',
      es: '¿Palabras que nunca llegaste a decirle a alguien?',
    },
  },
  {
    id: 'recurring-feeling',
    labels: {
      ko: '요즘 자꾸 반복해서 떠오르는 마음?',
      en: 'A feeling that keeps coming back lately?',
      ja: '最近何度も繰り返し浮かぶ気持ち?',
      zh: '最近一直反复涌起的一种心情?',
      es: '¿Un sentimiento que vuelve a ti estos días?',
    },
  },
  {
    id: 'only-me-moment',
    labels: {
      ko: '나만 이런가 싶었던 순간이 있었나요?',
      en: 'A moment where you thought "is it just me"?',
      ja: '「私だけかな」と思った瞬間?',
      zh: '有没有过"是不是只有我这样"的瞬间?',
      es: '¿Un momento en que pensaste "¿solo me pasa a mí?"?',
    },
  },
  {
    id: 'comforting-presence',
    labels: {
      ko: '함께 있으면 편안해지는 사람에 대한 생각?',
      en: 'A person who lets you breathe easier?',
      ja: '一緒にいると安心する人について?',
      zh: '和谁在一起时你能轻松呼吸?',
      es: '¿Una persona que te hace respirar más tranquilo?',
    },
  },
  {
    id: 'what-matters-in-love',
    labels: {
      ko: '사랑에서 내가 중요하게 여기는 것들?',
      en: "What you've come to value in love?",
      ja: '愛で大切にしていること?',
      zh: '在爱里你最珍视的东西?',
      es: '¿Qué has llegado a valorar en el amor?',
    },
  },
];

type TextSizeStep = 0 | 1 | 2 | 3;
type Route =
  | 'main'
  | 'category'
  | 'post'
  | 'profile'
  | 'auth'
  | 'conversation'
  | 'conversations'
  | 'compose';

const PALETTE = {
  bg: '#141210',
  card: '#1f1d1a',
  cardPressed: '#2a2622',
  settingsBg: '#1c1a17',
  brandRed: '#ff4757',
  textCategory: '#FFFFFF',
  textPrompt: '#FFFFFF',
  textMuted: '#8a8078',
  textBody: '#FFFFFF',
  chevron: '#8a8078',
  border: '#4a443c',
  buttonBg: '#2a2622',
  buttonBgDim: '#1a1815',
  profileMaleBg: '#3a5276',
  profileFemaleBg: '#a85f72',
  inviteAccent: '#7daa97',
  invitePanel: '#23211d',
  // 프로필 섹션 라벨 / 메인 상단 prompt 공통 색상.
  labelAccent: '#8fd9b6',
  bubbleMale: '#6f8298',
  bubbleFemale: '#a88990',
};

const SCALES: Record<TextSizeStep, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.2,
  3: 1.3,
};

const BOTTOM_BUTTON_HEIGHT = 32;
const BOTTOM_BUTTON_OFFSET = 14;
const BOTTOM_BAR_HEIGHT = BOTTOM_BUTTON_HEIGHT + BOTTOM_BUTTON_OFFSET + 14;
const SCROLL_BOTTOM_PADDING = 10;

// CURRENT_USER_ID 상수는 제거됨.
// 실제 작성/초대/전송 권한 판단은 useCurrentUserId() (Supabase auth session 기반) 으로 수행.
// 시드 사용자 m_01 등은 시드 표시용으로만 남아있다.

const PROFILE_IMAGES = {
  male: require('./assets/profile-male.png'),
  female: require('./assets/profile-female.png'),
} as const;

const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
};

const LANGUAGE_ORDER: readonly Language[] = ['ko', 'en', 'ja', 'zh', 'es'] as const;

const USER_MAP: Record<string, SeedUser> = Object.fromEntries(
  SEED_USERS.map((u) => [u.userId, u]),
);

const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

// ──────────────────────────────────────────────────────────────────────────
// Seed 데이터를 원본 그대로 사용.
// 이전 정책(이성 간 답글 강제)에 맞춰 답글 작성자를 swap 하던 normalize 흐름은 제거됨.
// 누구나 / 자기 글에도 / 무제한 답글이라는 새 정책에서는 swap 자체가 불필요.
// 글 작성자 성별 정보만 채워서 PostDetailScreen 등의 표시에 활용한다.
// ──────────────────────────────────────────────────────────────────────────

const SEED_POSTS_NORMALIZED: SeedPost[] = SEED_POSTS.map((post) => {
  const author = USER_MAP[post.userId];
  if (!author) return post;
  return { ...post, authorGender: author.gender as 'male' | 'female' };
});

const POSTS_BY_CATEGORY: Record<string, SeedPost[]> =
  SEED_POSTS_NORMALIZED.reduce(
    (acc, post) => {
      (acc[post.categoryId] ||= []).push(post);
      return acc;
    },
    {} as Record<string, SeedPost[]>,
  );

for (const list of Object.values(POSTS_BY_CATEGORY)) {
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function getProfileImage(user: SeedUser | undefined) {
  if (!user) return PROFILE_IMAGES.male;
  return PROFILE_IMAGES[user.gender];
}

type ResolvedContent = {
  text: string;
  isTranslated: boolean;
  originalLanguage: Language;
  viewerLanguage: Language;
};

function resolveContent(args: {
  targetType: TranslationTargetType;
  targetId: string;
  originalContent: string;
  originalLanguage: Language;
  viewerLanguage: Language;
  translations: SeedTranslation[];
}): ResolvedContent {
  const {
    targetType,
    targetId,
    originalContent,
    originalLanguage,
    viewerLanguage,
    translations,
  } = args;

  if (originalLanguage === viewerLanguage) {
    return { text: originalContent, isTranslated: false, originalLanguage, viewerLanguage };
  }

  const match = translations.find(
    (t) =>
      t.targetType === targetType &&
      t.targetId === targetId &&
      t.targetLanguage === viewerLanguage &&
      t.status === 'completed',
  );

  if (match) {
    return { text: match.translatedContent, isTranslated: true, originalLanguage, viewerLanguage };
  }

  return { text: originalContent, isTranslated: false, originalLanguage, viewerLanguage };
}

function ProfileAvatar({
  user,
  size,
  style,
  unknown,
}: {
  user: SeedUser | undefined;
  size: number;
  style?: StyleProp<ViewStyle>;
  // 탈퇴/식별 불가 사용자 — 텍스트 라벨 없이 조용한 X 아이콘으로 부재를 표현.
  unknown?: boolean;
}) {
  if (unknown) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Text
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: size * 0.55,
            lineHeight: size * 0.55,
            fontWeight: '300',
          }}
        >
          ×
        </Text>
      </View>
    );
  }
  const bgColor =
    user?.gender === 'female' ? PALETTE.profileFemaleBg : PALETTE.profileMaleBg;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={getProfileImage(user)}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

function findConversation(
  postId: string,
  rootCommentId: string,
): SeedConversation | undefined {
  return SEED_CONVERSATIONS.find(
    (c) => c.postId === postId && c.rootCommentId === rootCommentId,
  );
}

// 답글 정책: 누구나 / 자기 글에도 / 무제한.
// 옛 REPLY_LIMIT_PER_POST 상수는 제거됨. 서버 enforce 도 함께 풀림.

// seed/demo 사용자 id 식별. UUID 가 아니라 'm_01', 'f_05', 'en_02' 같은 prefix 패턴.
// 답글 작성자 / invite 대상이 seed 사용자인지 분기할 때 사용.
const SEED_USER_PATTERN = /^(m_|f_|en_|ja_|zh_|es_)/;
function isSeedUserId(id: string): boolean {
  return SEED_USER_PATTERN.test(id);
}

// 작성자 표시에서 "식별 불가/탈퇴 계정" 으로 간주할지 결정.
// 조건:
//   - 본인이 아님
//   - seed 사용자 목록(USER_MAP) 에도 없음
//   - id 가 UUID 형식 (server 사용자였음 — 현재 user_profiles 미존재)
// 위 셋 모두 만족이면 unknown=true → ProfileAvatar 가 X 아이콘으로 표시.
function isUnknownAuthorId(
  userId: string,
  currentUserId: string | null,
): boolean {
  if (!userId) return false;
  if (currentUserId && userId === currentUserId) return false;
  if (USER_MAP[userId]) return false;
  return isUuid(userId);
}

// Supabase 의 posts.id / post_comments.id 는 uuid 컬럼.
// seed/sample id ("p001", "r049" 등) 를 그대로 fetch 하면 Postgres 가
// "invalid input syntax for type uuid" 를 던지며 로그가 어지러워진다.
// 서버 조회를 시도하기 전에 형식 검사로 거른다.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

// 서버 row → UI 가 그대로 쓰는 SeedPost/SeedReply 모양으로 변환.
// 기존 UI 는 SeedPost.isSample 이 true literal 임을 전제로 작성되어 있어
// (CategoryScreen / PostDetailScreen 의 props 타입) 같은 모양으로 빚는다.
// `originalLanguage` 는 다국어 인프라가 들어오기 전까지 viewer 의 ko 로 보존.
function dbPostToSeed(p: DbPost): SeedPost {
  return {
    postId: p.id,
    userId: p.user_id,
    categoryId: p.category,
    originalLanguage: 'ko',
    originalContent: p.body,
    createdAt: p.created_at,
    replies: [],
    isSample: true,
    authorGender:
      p.author_gender === 'male' || p.author_gender === 'female'
        ? p.author_gender
        : undefined,
  };
}

function dbCommentToSeed(c: DbPostComment): SeedReply {
  return {
    replyId: c.id,
    userId: c.user_id,
    originalLanguage: 'ko',
    originalContent: c.body,
    createdAt: c.created_at,
    isSample: true,
  };
}

// id 기준 dedupe — 같은 id 가 여러 소스에 있으면 첫 소스 우선(서버 > local > seed 순으로 호출).
function dedupePostsById(...sources: SeedPost[][]): SeedPost[] {
  const seen = new Set<string>();
  const out: SeedPost[] = [];
  for (const src of sources) {
    for (const p of src) {
      if (seen.has(p.postId)) continue;
      seen.add(p.postId);
      out.push(p);
    }
  }
  return out;
}

function dedupeRepliesById(...sources: SeedReply[][]): SeedReply[] {
  const seen = new Set<string>();
  const out: SeedReply[] = [];
  for (const src of sources) {
    for (const r of src) {
      if (seen.has(r.replyId)) continue;
      seen.add(r.replyId);
      out.push(r);
    }
  }
  return out;
}

type MessageValidation = { ok: boolean; reason?: string };

function validateMessageBeforeSend(text: string): MessageValidation {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: '빈 메시지는 보낼 수 없어요.' };
  }
  // TODO: 개인정보/유해 표현 차단 필터 연결 지점
  //   - 전화번호 (예: /\d{3}-?\d{3,4}-?\d{4}/)
  //   - 카카오톡 / 인스타그램 / 텔레그램 ID
  //   - 이메일, 정확한 주소, 학교명, 직장명
  //   - 직접적인 나이 공개, 외부 메신저 유도
  //   - 욕설/혐오/위협/성희롱/스토킹성 표현
  return { ok: true };
}

function isPostVisibleIn(post: SeedPost, lang: Language): boolean {
  return post.originalLanguage === lang;
}

function isReplyVisibleIn(reply: SeedReply, lang: Language): boolean {
  return reply.originalLanguage === lang;
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return '방금 전';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  return `${Math.floor(diffSec / 86400)}일 전`;
}

// 두 ISO 시각이 같은 로컬 날짜인지 — 대화방 날짜 separator 분기에 사용.
function isSameLocalDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso);
  const b = new Date(bIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "2026년 5월 18일" 형태.
function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ────────────────────────────────────────────────────────────────
// 대화방 사진 전송 정책
// ────────────────────────────────────────────────────────────────
//
// 목적: "실제 사용자가 직접 촬영한 사진" 만 유통되게 한다.
// 차단 대상:
//   - AI 생성 이미지
//   - 인터넷에서 다운로드한 이미지
//   - 다른 사람이 찍은 사진을 받아 재업로드
//   - 스크린샷
//   - 편집/조작 흔적이 강한 이미지
//
// 검증 기준 (압축 전 원본 EXIF):
//   1) 촬영 시간(DateTimeOriginal/DateTime) 존재 필수
//   2) GPS 위치 정보 존재 필수
//   3) 카메라 메타(Make/Model) 가능하면 확인 — 없어도 1·2 가 있으면 통과
//   4) Software 가 Screenshot / Photoshop 등 알려진 편집·캡처 도구면 거부
//
// 검증을 통과한 사진은 그 다음 단계에서 압축한다.
// 압축 과정에서 EXIF 가 자연 제거되므로 신뢰 정보는 client 검증 시점에만 확인된다.

// 한 번 전송 시 최대 장수.
const MAX_IMAGES_PER_SEND = 5;
// 하루 누적 최대 장수. 자정에 리셋(로컬 기준).
const MAX_IMAGES_PER_DAY = 20;
// 압축 시 긴 변(픽셀) 최대값. 1280~1600 사이의 중간값.
const IMAGE_MAX_LONG_EDGE = 1440;
// JPEG 압축 품질 (0~1). 0.75~0.82 권장 중간값.
const IMAGE_JPEG_QUALITY = 0.78;
// 일일 카운터 prefix.
const DAILY_IMAGE_PREFIX = 'dulsai:img-day';

// 편집·캡처 도구로 알려진 software 마커. 발견되면 거부.
const FORBIDDEN_SOFTWARE_PATTERNS = [
  'screenshot',
  'snipping',
  'photoshop',
  'lightroom',
  'gimp',
  'pixelmator',
  'midjourney',
  'stable diffusion',
  'dall',
  'firefly',
  'novelai',
];

type ExifLike = Record<string, unknown> | null | undefined;

function readExifString(exif: ExifLike, ...keys: string[]): string | null {
  if (!exif || typeof exif !== 'object') return null;
  for (const key of keys) {
    const direct = (exif as Record<string, unknown>)[key];
    if (typeof direct === 'string' && direct.trim().length > 0) return direct;
    // iOS nested ({Exif}, {GPS}, ...)
    for (const k of Object.keys(exif as Record<string, unknown>)) {
      const v = (exif as Record<string, unknown>)[k];
      if (v && typeof v === 'object') {
        const nested = (v as Record<string, unknown>)[key];
        if (typeof nested === 'string' && nested.trim().length > 0) {
          return nested;
        }
      }
    }
  }
  return null;
}

function readExifNumber(exif: ExifLike, ...keys: string[]): number | null {
  if (!exif || typeof exif !== 'object') return null;
  for (const key of keys) {
    const direct = (exif as Record<string, unknown>)[key];
    if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
    for (const k of Object.keys(exif as Record<string, unknown>)) {
      const v = (exif as Record<string, unknown>)[k];
      if (v && typeof v === 'object') {
        const nested = (v as Record<string, unknown>)[key];
        if (typeof nested === 'number' && Number.isFinite(nested)) {
          return nested;
        }
      }
    }
  }
  return null;
}

export type RealPhotoCheck = { ok: true } | { ok: false; reason: string };

// EXIF 기반 "실제 촬영 사진" 검증.
// iOS / Android 양쪽 모두에서 expo-image-picker 의 exif: true 옵션 결과를 입력으로 받는다.
function validateRealPhotoExif(exif: ExifLike): RealPhotoCheck {
  if (!exif || typeof exif !== 'object') {
    return {
      ok: false,
      reason: '카메라로 직접 촬영한 사진만 보낼 수 있어요.',
    };
  }

  // 1) 촬영 시간
  const dateTime = readExifString(
    exif,
    'DateTimeOriginal',
    'DateTimeDigitized',
    'DateTime',
  );
  if (!dateTime) {
    return {
      ok: false,
      reason: '촬영 시간이 없는 이미지는 보낼 수 없어요.',
    };
  }

  // 2) GPS 위치
  const lat = readExifNumber(exif, 'GPSLatitude', 'Latitude');
  const lon = readExifNumber(exif, 'GPSLongitude', 'Longitude');
  const hasGpsRef =
    !!readExifString(exif, 'GPSLatitudeRef', 'GPSLongitudeRef') ||
    (lat !== null && lon !== null);
  if (!hasGpsRef) {
    return {
      ok: false,
      reason:
        '위치 정보가 없는 이미지는 보낼 수 없어요. 카메라 앱에서 위치 사용을 허용해 주세요.',
    };
  }

  // 4) 편집/캡처 도구 마커
  const software = (readExifString(exif, 'Software') ?? '').toLowerCase();
  if (
    software &&
    FORBIDDEN_SOFTWARE_PATTERNS.some((p) => software.includes(p))
  ) {
    return {
      ok: false,
      reason: '편집되거나 캡처된 이미지는 보낼 수 없어요.',
    };
  }

  // 3) 카메라 메타 — 약한 신호. 없어도 1·2 통과면 OK.
  return { ok: true };
}

// 사진 업로드 전 자동 압축.
// expo-image-manipulator 가 설치되어 있어야 한다 (동적 require).
// 긴 변을 IMAGE_MAX_LONG_EDGE 로 리사이즈, JPEG 로 변환(EXIF 자연 제거), 품질 78%.
// 원본 비율 유지. 실패하면 throw — 호출자가 원본 업로드를 우회 사용하지 못하게 한다.
async function compressImage(asset: {
  uri: string;
  width: number;
  height: number;
}): Promise<{ uri: string; width: number; height: number }> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ImageManipulator = require('expo-image-manipulator');
  const longEdge = Math.max(asset.width, asset.height);
  const actions: Array<{ resize: { width?: number; height?: number } }> = [];
  if (longEdge > IMAGE_MAX_LONG_EDGE) {
    if (asset.width >= asset.height) {
      actions.push({ resize: { width: IMAGE_MAX_LONG_EDGE } });
    } else {
      actions.push({ resize: { height: IMAGE_MAX_LONG_EDGE } });
    }
  }
  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: IMAGE_JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: result.uri,
    width: result.width ?? asset.width,
    height: result.height ?? asset.height,
  };
}

// 대화방 메시지용 시계 표시 ("오후 3:21").
// 말풍선 본문 끝에 inline 으로 따라붙는다. relTime 같은 상대시간은 메신저 톤이 어색해서 별도 포맷.
function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${ampm} ${h}:${mm}`;
}

type InviteUIState = {
  inviteId: string;
  status: ConversationInviteStatus;
  postId: string;
  replyId: string;
  senderId: string;
  receiverId: string;
  conversationId: string | null;
};

// 글/답글 작성 결과 — ComposeScreen 이 받아 hint 를 사용자에게 그대로 노출한다.
type ComposeSubmitResult = {
  ok: boolean;
  hint?: string;
};

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const currentUserId = useCurrentUserId();
  const [textSizeStep, setTextSizeStep] = useState<TextSizeStep>(0);
  const [route, setRoute] = useState<Route>('main');
  const [previousRoute, setPreviousRoute] = useState<Route>('main');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [deletedConversationIds, setDeletedConversationIds] = useState<string[]>([]);
  const [localPosts, setLocalPosts] = useState<SeedPost[]>([]);
  const [localReplies, setLocalReplies] = useState<Record<string, SeedReply[]>>(
    {},
  );
  const [localInvites, setLocalInvites] = useState<
    Record<string, ConversationInvite>
  >({});
  // replyId 단위로 invite 의 상태/conversation 연결을 관리.
  // realtime 구독을 추후 붙일 때도 id 기반이라 reducer 식 갱신이 가능.
  const [inviteStateByReply, setInviteStateByReply] = useState<
    Record<string, InviteUIState>
  >({});
  // 내가 참여 중인 대화방 목록 (서버 fetch 결과 + 로컬 갱신).
  const [myConversations, setMyConversations] = useState<DbConversation[]>([]);
  // 내가 차단한 사용자 id 집합. 글/답글 표시에서 즉시 제외.
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set());
  // 내보내기/삭제 처리한 답글 id. seed/demo 답글은 server row 가 없으므로 이 set 으로만 숨김.
  const [hiddenReplyIds, setHiddenReplyIds] = useState<Set<string>>(
    () => new Set(),
  );
  // 내 성별 — 이성 간 답글 정책에 사용. null 이면 답글/글 작성 자체가 막힌다.
  const [myProfileGender, setMyProfileGender] = useState<
    'male' | 'female' | null
  >(null);
  // 내 닉네임(display_name). trim 후 length > 0 일 때만 글/답글 작성 허용.
  const [myProfileDisplayName, setMyProfileDisplayName] = useState<
    string | null
  >(null);
  const profileReady = !!(
    myProfileDisplayName && myProfileDisplayName.trim().length > 0
  );
  type ComposeMode = 'post' | 'reply' | 'edit-post';
  const [composeMode, setComposeMode] = useState<ComposeMode>('post');
  // 'edit-post' 일 때 대상 post 의 본문을 prefill 하기 위해 들고 있는 정보.
  const [editingPost, setEditingPost] = useState<SeedPost | null>(null);
  const [viewerLanguage, setViewerLanguage] = useState<Language>('ko');

  useEffect(() => {
    (async () => {
      await checkSupabaseHealth();
      if (__DEV__) {
        await runSupabaseSmokeTests();
      }
    })();
  }, []);

  const scale = SCALES[textSizeStep];

  const changeTextSize = (delta: number) => {
    const next = Math.max(0, Math.min(3, textSizeStep + delta)) as TextSizeStep;
    setTextSizeStep(next);
  };

  const openCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setRoute('category');
  };

  const openPost = (postId: string) => {
    setSelectedPostId(postId);
    setRoute('post');
  };

  const openCompose = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setComposeMode('post');
    setRoute('compose');
  };

  // openComposeReply 폐지 — 답글은 PostDetailScreen 하단 인라인 입력창에서 직접 작성한다.

  // 본문 "수정" 진입 — ComposeScreen 의 'edit-post' 모드로 라우팅.
  const openComposePostEdit = (post: SeedPost) => {
    setEditingPost(post);
    setSelectedCategoryId(post.categoryId);
    setSelectedPostId(post.postId);
    setComposeMode('edit-post');
    setRoute('compose');
  };

  // 본문 "삭제" — UUID 면 server 호출, 아니면 localPosts 만 정리.
  const handleDeletePost = async (post: SeedPost): Promise<boolean> => {
    if (isUuid(post.postId)) {
      const ok = await deletePostRemote(post.postId);
      if (!ok) {
        Alert.alert(
          '삭제 실패',
          '글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
        return false;
      }
    }
    setLocalPosts((prev) => prev.filter((p) => p.postId !== post.postId));
    // 답글 미러도 정리.
    setLocalReplies((prev) => {
      const next = { ...prev };
      delete next[post.postId];
      return next;
    });
    // 글 상세에서 호출된 경우 카테고리로 복귀.
    if (route === 'post' && selectedPostId === post.postId) {
      setSelectedPostId(null);
      setRoute('category');
    }
    return true;
  };

  // Edge Function 호출 결과를 받아 hint(서버 측 안전 차단 메시지) 까지 ComposeScreen 으로 전달.
  // 화면 재진입 시 listPosts/listCommentsByPost 가 다시 서버를 fetch 하므로
  // 로컬 미러는 fetch 가 도착하기 전까지의 "낙관적 표시"용 임시 버퍼.
  const handleSubmitCompose = async (
    content: string,
  ): Promise<ComposeSubmitResult> => {
    if (!currentUserId) {
      return { ok: false, hint: '먼저 본인 확인을 완료해 주세요.' };
    }
    if (!profileReady) {
      return {
        ok: false,
        hint: '프로필 저장 후 글을 남길 수 있어요.',
      };
    }
    const me = currentUserId;
    if (composeMode === 'post' && selectedCategoryId) {
      const result = await createPostRemote({
        user_id: me,
        category: selectedCategoryId,
        body: content,
      });
      if (!result.ok || !result.post) {
        return {
          ok: false,
          hint:
            result.hint ??
            result.errorMessage ??
            '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
        };
      }
      setLocalPosts((prev) => [dbPostToSeed(result.post!), ...prev]);

      // 새 server post 직후 분위기 보조용 seed 답글 2~4개를 client-side 로 즉시 추가.
      // 서버 저장 없음 — local mirror 뿐이라 seed 사용자와의 1:1 대화방으로 이어지지 않는다.
      const newPost = result.post!;
      const autoReplies = generateSeedRepliesForPost({
        postId: newPost.id,
        authorUserId: newPost.user_id,
        originalContent: newPost.body,
        seedUsers: SEED_USERS,
      });
      if (autoReplies.length > 0) {
        setLocalReplies((prev) => ({
          ...prev,
          [newPost.id]: [...(prev[newPost.id] ?? []), ...autoReplies],
        }));
      }

      setRoute('category');
      return { ok: true };
    }
    if (composeMode === 'edit-post' && editingPost) {
      // 본문 수정. seed/local post 면 server 호출 없이 localPosts 갱신.
      const target = editingPost;
      if (isUuid(target.postId)) {
        const updated = await updatePostRemote(target.postId, {
          body: content,
        });
        if (!updated) {
          return {
            ok: false,
            hint: '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
          };
        }
      }
      // localPosts mirror — 없으면 새로 추가(서버 post 가 fetch 전인 경우), 있으면 본문 교체.
      setLocalPosts((prev) => {
        const exists = prev.some((p) => p.postId === target.postId);
        if (exists) {
          return prev.map((p) =>
            p.postId === target.postId ? { ...p, originalContent: content } : p,
          );
        }
        return [{ ...target, originalContent: content }, ...prev];
      });
      setEditingPost(null);
      setRoute('post');
      return { ok: true };
    }
    if (composeMode === 'reply' && selectedPostId) {
      const pid = selectedPostId;
      const result = await createReplyRemote({
        post_id: pid,
        user_id: me,
        body: content,
      });
      if (!result.ok || !result.comment) {
        return {
          ok: false,
          hint:
            result.hint ??
            result.errorMessage ??
            '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
        };
      }
      setLocalReplies((prev) => ({
        ...prev,
        [pid]: [...(prev[pid] ?? []), dbCommentToSeed(result.comment!)],
      }));
      setRoute('post');
      return { ok: true };
    }
    return { ok: false };
  };

  // 대화 초대 — Supabase 저장 성공 후에만 로컬 미러에 반영.
  // 중복 초대(이미 invites 에 같은 replyId 존재) 는 차단.
  // 내가 차단한 사용자에게는 초대 자체를 보내지 않는다.
  const handleSendInvite = async (
    replyId: string,
    receiverId: string,
    postId: string,
  ): Promise<boolean> => {
    if (!currentUserId) return false;
    if (inviteStateByReply[replyId] || localInvites[replyId]) return false;
    if (blockedIds.has(receiverId)) {
      Alert.alert('대화 초대', '차단한 사용자에게는 초대를 보낼 수 없어요.');
      return false;
    }
    const me = currentUserId;
    const content =
      '괜찮다면 이 문장을 계기로 조금 더 천천히 이야기 나눠보고 싶어요.';

    // seed/demo 사용자에게 초대 → 서버 호출 없이 "초대됨" 상태만 만든다.
    // seed 사용자는 절대 수락하지 않으므로 conversation 생성 흐름까지 가지 않는다.
    if (isSeedUserId(receiverId)) {
      const localInviteId = `seed_invite_${replyId}_${Date.now()}`;
      const stubInvite: ConversationInvite = {
        inviteId: localInviteId,
        userId: me,
        originalLanguage: 'ko',
        originalContent: content,
        createdAt: new Date().toISOString(),
        isSample: true,
      };
      setLocalInvites((prev) => ({ ...prev, [replyId]: stubInvite }));
      setInviteStateByReply((prev) => ({
        ...prev,
        [replyId]: {
          inviteId: localInviteId,
          status: 'pending',
          postId,
          replyId,
          senderId: me,
          receiverId,
          conversationId: null,
        },
      }));
      return true;
    }

    const saved = await createInviteRemote({
      postId,
      replyId,
      senderId: me,
      receiverId,
      content,
    });
    if (!saved) return false;
    const newInvite: ConversationInvite = {
      inviteId: saved.inviteId,
      userId: saved.senderId,
      originalLanguage: 'ko',
      originalContent: saved.content,
      createdAt: saved.createdAt,
      isSample: true,
    };
    setLocalInvites((prev) => ({ ...prev, [replyId]: newInvite }));
    setInviteStateByReply((prev) => ({
      ...prev,
      [replyId]: {
        inviteId: saved.inviteId,
        status: 'pending',
        postId: saved.postId,
        replyId: saved.replyId,
        senderId: saved.senderId,
        receiverId: saved.receiverId,
        conversationId: null,
      },
    }));
    return true;
  };

  const handleAcceptInvite = async (replyId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    const state = inviteStateByReply[replyId];
    if (!state || state.status !== 'pending') return false;
    if (state.receiverId !== currentUserId) return false;

    const accepted = await acceptInviteRemote(state.inviteId);
    if (!accepted) return false;

    const conv = await createConversationRemote({
      postId: state.postId,
      inviteId: state.inviteId,
      userIdA: state.senderId,
      userIdB: state.receiverId,
    });
    if (!conv) {
      // accept 자체는 됐지만 conversation 생성 실패 — 상태만 accepted 로 반영.
      setInviteStateByReply((prev) => ({
        ...prev,
        [replyId]: { ...state, status: 'accepted' },
      }));
      return false;
    }
    setInviteStateByReply((prev) => ({
      ...prev,
      [replyId]: { ...state, status: 'accepted', conversationId: conv.id },
    }));
    setMyConversations((prev) =>
      prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev],
    );
    return true;
  };

  const handleDeclineInvite = async (replyId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    const state = inviteStateByReply[replyId];
    if (!state || state.status !== 'pending') return false;
    if (state.receiverId !== currentUserId) return false;
    const declined = await declineInviteRemote(state.inviteId);
    if (!declined) return false;
    setInviteStateByReply((prev) => ({
      ...prev,
      [replyId]: { ...state, status: 'declined' },
    }));
    return true;
  };

  const handleWithdrawInvite = async (replyId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    const state = inviteStateByReply[replyId];
    if (!state || state.status !== 'pending') return false;
    if (state.senderId !== currentUserId) return false;

    // seed 사용자에 보낸 초대는 server row 가 없으므로 local 만 정리.
    if (
      state.inviteId.startsWith('seed_invite_') ||
      isSeedUserId(state.receiverId)
    ) {
      setInviteStateByReply((prev) => ({
        ...prev,
        [replyId]: { ...state, status: 'withdrawn' },
      }));
      setLocalInvites((prev) => {
        const next = { ...prev };
        delete next[replyId];
        return next;
      });
      return true;
    }

    const withdrawn = await withdrawInviteRemote(state.inviteId);
    if (!withdrawn) return false;
    setInviteStateByReply((prev) => ({
      ...prev,
      [replyId]: { ...state, status: 'withdrawn' },
    }));
    setLocalInvites((prev) => {
      const next = { ...prev };
      delete next[replyId];
      return next;
    });
    return true;
  };

  const openConversationById = (conversationId: string) => {
    setPreviousRoute(route);
    setSelectedConversationId(conversationId);
    setRoute('conversation');
  };

  const openConversationList = () => {
    setRoute('conversations');
  };

  // 인증 상태 변동 시 내 대화방 목록을 fetch. 실패하면 빈 배열.
  useEffect(() => {
    if (!currentUserId) {
      setMyConversations([]);
      return;
    }
    let cancelled = false;
    void listMyConversationsRemote(currentUserId).then((rows) => {
      if (!cancelled) setMyConversations(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // 인증 상태 변동 시 차단 목록 1회 fetch.
  useEffect(() => {
    if (!currentUserId) {
      setBlockedIds(new Set());
      return;
    }
    let cancelled = false;
    void listMyBlockedIds().then((ids) => {
      if (!cancelled) setBlockedIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // 내 프로필 1회 fetch — gender + display_name 둘 다 가져온다.
  // ProfileSetupScreen 에서 저장 직후에는 즉시 반영이 안 되지만, 다음 라우트 진입 또는
  // 앱 재실행 시 갱신된다. 추후 ProfileSetup save 콜백으로 즉시 갱신 가능.
  useEffect(() => {
    if (!currentUserId) {
      setMyProfileGender(null);
      setMyProfileDisplayName(null);
      return;
    }
    let cancelled = false;
    void getProfileByUserId(currentUserId).then((row) => {
      if (cancelled) return;
      const g = row?.gender ?? null;
      setMyProfileGender(g === 'male' || g === 'female' ? g : null);
      setMyProfileDisplayName(row?.display_name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // PostDetailScreen 하단 인라인 입력창에서 직접 답글 작성.
  // seed/demo 글이면 서버 호출을 건너뛰고 local 답글만 추가한다.
  // ComposeScreen 으로 이동하지 않고 같은 화면에서 즉시 처리.
  const handleSubmitInlineReply = async (
    postIdLocal: string,
    content: string,
  ): Promise<ComposeSubmitResult> => {
    if (!currentUserId) {
      return { ok: false, hint: '먼저 본인 확인을 완료해 주세요.' };
    }
    if (!profileReady) {
      return {
        ok: false,
        hint: '프로필 저장 후 답글을 남길 수 있어요.',
      };
    }
    const trimmed = content.trim();
    if (trimmed.length === 0) return { ok: false };

    if (isWriteBlocked(currentUserId)) {
      return { ok: false, hint: '잠시 쉬었다가 다시 이어가 주세요.' };
    }
    const safety = checkSafety(trimmed, 'reply');
    if (!safety.ok) {
      reportViolation({
        userId: currentUserId,
        context: 'reply',
        result: safety,
        rawText: trimmed,
      });
      return { ok: false, hint: safety.hint ?? '' };
    }

    // seed/demo 글 분기 — postId 가 UUID 가 아니면 서버 row 가 없는 전시용 글이다.
    // createReplyRemote 가 post_id 참조 실패로 422/500 을 던지므로 호출 자체를 건너뛰고
    // local 답글만 만든다. 사용자에게는 서버 저장 실패처럼 보이지 않게 즉시 ok.
    if (!isUuid(postIdLocal)) {
      const localReply: SeedReply = {
        replyId: `local_reply_${Date.now()}`,
        userId: currentUserId,
        originalLanguage: 'ko',
        originalContent: trimmed,
        createdAt: new Date().toISOString(),
        isSample: true,
      };
      setLocalReplies((prev) => ({
        ...prev,
        [postIdLocal]: [...(prev[postIdLocal] ?? []), localReply],
      }));
      return { ok: true };
    }

    // 실제 서버 글 — Edge Function 으로 정상 라우팅.
    const result = await createReplyRemote({
      post_id: postIdLocal,
      user_id: currentUserId,
      body: trimmed,
    });
    if (!result.ok || !result.comment) {
      return {
        ok: false,
        hint:
          result.hint ??
          result.errorMessage ??
          '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
      };
    }
    setLocalReplies((prev) => ({
      ...prev,
      [postIdLocal]: [
        ...(prev[postIdLocal] ?? []),
        dbCommentToSeed(result.comment!),
      ],
    }));
    return { ok: true };
  };

  // 본인 답글 수정. seed/demo 답글은 서버 호출 없이 localReplies 만 갱신.
  // dedupeRepliesById 호출 순서가 local-first 라서 server 답글도 local 미러로 즉시 화면 반영.
  const handleUpdateReplyContent = async (
    postIdLocal: string,
    replyId: string,
    newContent: string,
    originalReply: SeedReply,
  ): Promise<ComposeSubmitResult> => {
    if (!currentUserId) {
      return { ok: false, hint: '먼저 본인 확인을 완료해 주세요.' };
    }
    if (!profileReady) {
      return { ok: false, hint: '프로필 저장 후 답글을 남길 수 있어요.' };
    }
    const trimmed = newContent.trim();
    if (trimmed.length === 0) return { ok: false };
    if (isWriteBlocked(currentUserId)) {
      return { ok: false, hint: '잠시 쉬었다가 다시 이어가 주세요.' };
    }
    const safety = checkSafety(trimmed, 'reply');
    if (!safety.ok) {
      reportViolation({
        userId: currentUserId,
        context: 'reply',
        result: safety,
        rawText: trimmed,
      });
      return { ok: false, hint: safety.hint ?? '' };
    }

    if (isUuid(replyId)) {
      const updated = await updateCommentRemote(replyId, { body: trimmed });
      if (!updated) {
        return {
          ok: false,
          hint: '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
        };
      }
    }
    // local mirror 갱신 — 같은 id 가 이미 있으면 본문 교체, 없으면 새로 추가.
    setLocalReplies((prev) => {
      const list = prev[postIdLocal] ?? [];
      const exists = list.some((r) => r.replyId === replyId);
      if (exists) {
        return {
          ...prev,
          [postIdLocal]: list.map((r) =>
            r.replyId === replyId ? { ...r, originalContent: trimmed } : r,
          ),
        };
      }
      return {
        ...prev,
        [postIdLocal]: [...list, { ...originalReply, originalContent: trimmed }],
      };
    });
    return { ok: true };
  };

  // 답글을 화면에서 제거하는 공통 처리. seed/demo 답글이면 서버 호출 없이 hiddenReplyIds 로만 숨김.
  // 서버 답글이면 hide/delete API 시도 후 실패하면 Alert.
  const markReplyHidden = (postIdLocal: string, replyId: string) => {
    setLocalReplies((prev) => ({
      ...prev,
      [postIdLocal]: (prev[postIdLocal] ?? []).filter(
        (r) => r.replyId !== replyId,
      ),
    }));
    setHiddenReplyIds((prev) => {
      if (prev.has(replyId)) return prev;
      const next = new Set(prev);
      next.add(replyId);
      return next;
    });
  };

  const handleHideReply = async (postIdLocal: string, replyId: string) => {
    if (isUuid(replyId)) {
      const removed = await hideCommentRemote(replyId);
      if (!removed) {
        Alert.alert(
          '내보내기 실패',
          '답글을 내보내지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
    }
    // seed/demo (비-UUID) 답글은 서버 호출 없이 화면에서만 숨김.
    markReplyHidden(postIdLocal, replyId);
  };

  const handleDeleteReply = async (postIdLocal: string, replyId: string) => {
    if (isUuid(replyId)) {
      const removed = await deleteCommentRemote(replyId);
      if (!removed) {
        Alert.alert(
          '삭제 실패',
          '답글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
    }
    markReplyHidden(postIdLocal, replyId);
  };

  const handleBlockedUserAdded = (userId: string) => {
    setBlockedIds((prev) => {
      if (prev.has(userId)) return prev;
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>(
    'signin',
  );

  const openProfile = () => {
    Keyboard.dismiss();
    setPreviousRoute(route);
    setRoute('profile');
  };

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthInitialMode(mode);
    setPreviousRoute(route);
    setRoute('auth');
  };


  // seed 데모 진입점 — postId + rootCommentId 매핑이 SEED_CONVERSATIONS 에 있는 경우만 사용.
  // 실 사용자 흐름은 invite 수락 → conversationId 를 들고 openConversationById 로 직접 진입한다.
  const openConversation = (postId: string, rootCommentId: string) => {
    const existing = findConversation(postId, rootCommentId);
    if (!existing) {
      logger.warn('openConversation: no seed mapping', { postId, rootCommentId });
      return;
    }
    if (deletedConversationIds.includes(existing.conversationId)) {
      Alert.alert('대화방', '이 대화는 이미 정리되었어요.');
      return;
    }
    setSelectedConversationId(existing.conversationId);
    setRoute('conversation');
  };

  const handleLeaveConversation = (convId: string) => {
    // 클라이언트 hide 는 즉시 반영(UI 즉응). 서버 반영은 비동기로 보조 처리.
    // 서버 실패 시에도 사용자 화면 흐름은 막지 않음 (재로그인 후 다시 등장할 수 있음을
    // 인지한 단기 운영). 추후 conversation_participants 테이블 도입 시 user-level leave 로 보강.
    setDeletedConversationIds((prev) => [...prev, convId]);
    setSelectedConversationId(null);
    setRoute('post');
    setMyConversations((prev) => prev.filter((c) => c.id !== convId));
    void leaveConversationRemote(convId);
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (route === 'profile') setRoute('main');
    else if (route === 'auth') setRoute(previousRoute);
    else if (route === 'conversation') setRoute(previousRoute);
    else if (route === 'conversations') setRoute('main');
    else if (route === 'post') setRoute('category');
    else if (route === 'compose')
      setRoute(composeMode === 'reply' ? 'post' : 'category');
    else setRoute('main');
  };

  // 어느 화면에서든 로고를 탭하면 메인으로. 뒤로가기 스택이 꼬이지 않게 모든 selected* 를 초기화.
  const goHome = () => {
    Keyboard.dismiss();
    setRoute('main');
    setPreviousRoute('main');
    setSelectedCategoryId(null);
    setSelectedPostId(null);
    setSelectedConversationId(null);
    setComposeMode('post');
  };

  // BrandHeader 우측 보조 버튼(로그인/회원가입/로그아웃) 스타일.
  // 글로벌 헤더가 각 화면 위가 아니라 AppShell 의 단일 위치에서만 mount 되므로
  // 이 스타일도 AppShell 스코프에서 한 번만 만든다.
  const globalHeaderActionStyles = useMemo(
    () =>
      StyleSheet.create({
        headerActionGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        headerAction: {
          paddingHorizontal: 8,
          paddingVertical: 6,
        },
        headerActionPressed: {
          opacity: 0.5,
        },
        headerActionText: {
          color: PALETTE.labelAccent,
          fontSize: 11 * scale,
          fontWeight: '500',
          letterSpacing: 0.5,
        },
      }),
    [scale],
  );

  // 글로벌 헤더의 사용자 아이콘은 main/category/post/conversation 에서만 노출.
  const headerOnProfile =
    route === 'main' ||
    route === 'category' ||
    route === 'post' ||
    route === 'conversation'
      ? openProfile
      : undefined;

  // 프로필 화면에서만 우측 슬롯에 로그인/회원가입(미로그인) 또는 로그아웃(로그인) 표시.
  const headerRightSlot =
    route === 'profile'
      ? currentUserId
        ? (
          <Pressable
            onPress={() => {
              void signOutRemote();
            }}
            hitSlop={10}
            style={({ pressed }) => [
              globalHeaderActionStyles.headerAction,
              pressed && globalHeaderActionStyles.headerActionPressed,
            ]}
          >
            <Text style={globalHeaderActionStyles.headerActionText}>로그아웃</Text>
          </Pressable>
        )
        : (
          <View style={globalHeaderActionStyles.headerActionGroup}>
            <Pressable
              onPress={() => openAuth('signin')}
              hitSlop={10}
              style={({ pressed }) => [
                globalHeaderActionStyles.headerAction,
                pressed && globalHeaderActionStyles.headerActionPressed,
              ]}
            >
              <Text style={globalHeaderActionStyles.headerActionText}>로그인</Text>
            </Pressable>
            <Pressable
              onPress={() => openAuth('signup')}
              hitSlop={10}
              style={({ pressed }) => [
                globalHeaderActionStyles.headerAction,
                pressed && globalHeaderActionStyles.headerActionPressed,
              ]}
            >
              <Text style={globalHeaderActionStyles.headerActionText}>회원가입</Text>
            </Pressable>
          </View>
        )
      : undefined;

  return (
    // 루트에서만 safe-area 적용. 각 화면 내부의 SafeAreaView 는 일반 View 로 교체되어
    // 화면 전환 시 safe-area paddingTop 이 두 번 재계산되며 튀는 현상을 방지한다.
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.bg} />
      {/*
        SafeAreaView 와 자식 화면 사이에 일반 wrapper View 한 겹.
        모든 화면이 동일한 wrapper 의 normal flow 자식이라 BrandHeader y 좌표가 픽셀 단위까지 일관.
        BrandHeader 는 여기 wrapper 직속의 첫 번째 자식으로 항상 mount 된다 — route 가 바뀌어도
        헤더 자체는 unmount/remount 되지 않으므로 로고 텍스트의 layout/render 타이밍이 변하지 않는다.
        onLogo 는 route 와 무관하게 항상 goHome 으로 전달 — 그래야 Pressable 래핑 구조가 라우트
        전환 사이에 바뀌지 않고, 로고 텍스트의 React 위치(트리 상의 좌표)가 픽셀 단위로 고정된다.
      */}
      <View style={{ flex: 1 }}>
      <BrandHeader
        onProfile={headerOnProfile}
        onLogo={goHome}
        rightSlot={headerRightSlot}
      />
      {route === 'main' && (
        <MainScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          viewerLanguage={viewerLanguage}
          onOpenProfile={openProfile}
          onOpenCategory={openCategory}
        />
      )}
      {route === 'category' && selectedCategoryId && (
        <CategoryScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          categoryId={selectedCategoryId}
          viewerLanguage={viewerLanguage}
          localPosts={localPosts}
          localReplies={localReplies}
          blockedIds={blockedIds}
          profileReady={profileReady}
          onBack={goBack}
          onHome={goHome}
          onOpenPost={openPost}
          onOpenProfile={openProfile}
          onOpenCompose={openCompose}
        />
      )}
      {route === 'compose' && selectedCategoryId && (
        <ComposeScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          categoryId={selectedCategoryId}
          viewerLanguage={viewerLanguage}
          mode={composeMode}
          replyTargetPost={
            composeMode === 'reply' && selectedPostId
              ? SEED_POSTS_NORMALIZED.find((p) => p.postId === selectedPostId) ??
                localPosts.find((p) => p.postId === selectedPostId) ??
                null
              : null
          }
          editingPost={composeMode === 'edit-post' ? editingPost : null}
          onBack={goBack}
          onHome={goHome}
          onSubmit={handleSubmitCompose}
        />
      )}
      {route === 'post' && selectedPostId && (
        <PostDetailScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          postId={selectedPostId}
          viewerLanguage={viewerLanguage}
          localPosts={localPosts}
          localReplies={localReplies}
          localInvites={localInvites}
          inviteStateByReply={inviteStateByReply}
          blockedIds={blockedIds}
          hiddenReplyIds={hiddenReplyIds}
          profileReady={profileReady}
          viewerDisplayName={myProfileDisplayName}
          onBack={goBack}
          onHome={goHome}
          onOpenProfile={openProfile}
          onOpenConversation={openConversation}
          onOpenConversationById={openConversationById}
          onSendInvite={handleSendInvite}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
          onWithdrawInvite={handleWithdrawInvite}
          onHideReply={(replyId) =>
            void handleHideReply(selectedPostId, replyId)
          }
          onDeleteReply={(replyId) =>
            void handleDeleteReply(selectedPostId, replyId)
          }
          onSubmitInlineReply={(content) =>
            handleSubmitInlineReply(selectedPostId, content)
          }
          onUpdateReply={(replyId, content, original) =>
            handleUpdateReplyContent(
              selectedPostId,
              replyId,
              content,
              original,
            )
          }
          onEditPost={openComposePostEdit}
          onDeletePost={handleDeletePost}
        />
      )}
      {route === 'conversations' && (
        <ConversationListScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          conversations={myConversations}
          onBack={goBack}
          onHome={goHome}
          onOpenConversation={openConversationById}
        />
      )}
      {route === 'conversation' && selectedConversationId && (
        <ConversationScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          conversationId={selectedConversationId}
          myConversations={myConversations}
          onBack={goBack}
          onHome={goHome}
          onOpenProfile={openProfile}
          onLeave={handleLeaveConversation}
          onBlockedUser={handleBlockedUserAdded}
        />
      )}
      {route === 'auth' && (
        <AuthScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          initialMode={authInitialMode}
          onBack={goBack}
          onHome={goHome}
        />
      )}
      {route === 'profile' && (
        <ProfileSetupScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          myConversations={myConversations}
          onBack={goBack}
          onHome={goHome}
          onOpenConversation={openConversationById}
          onOpenAuth={openAuth}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

function MainScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  viewerLanguage,
  onOpenProfile,
  onOpenCategory,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  viewerLanguage: Language;
  onOpenProfile: () => void;
  onOpenCategory: (categoryId: string) => void;
}) {
  const styles = useMemo(() => createMainStyles(scale), [scale]);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <View style={styles.promptArea}>
        <Text style={styles.prompt}>어떤 생각을 나누고 싶나요?</Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.categoryList}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => onOpenCategory(c.id)}
                style={({ pressed }) => [
                  styles.categoryItem,
                  pressed && styles.categoryItemPressed,
                ]}
              >
                <Text style={styles.categoryText}>
                  {c.labels[viewerLanguage] ?? c.labels.ko}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      <View style={bottomBarStyles.bar}>
        <SizeButtons textSizeStep={textSizeStep} onChangeTextSize={onChangeTextSize} />
      </View>
    </View>
  );
}

function CategoryScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  categoryId,
  viewerLanguage,
  localPosts,
  localReplies,
  blockedIds,
  profileReady,
  onBack,
  onHome,
  onOpenPost,
  onOpenProfile,
  onOpenCompose,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  categoryId: string;
  viewerLanguage: Language;
  localPosts: SeedPost[];
  localReplies: Record<string, SeedReply[]>;
  blockedIds: Set<string>;
  profileReady: boolean;
  onBack: () => void;
  onHome: () => void;
  onOpenPost: (postId: string) => void;
  onOpenProfile: () => void;
  onOpenCompose: (categoryId: string) => void;
}) {
  const styles = useMemo(() => createCategoryStyles(scale), [scale]);
  const currentUserId = useCurrentUserId();
  const category = CATEGORY_MAP[categoryId];
  const categoryLabel = category
    ? category.labels[viewerLanguage] ?? category.labels.ko
    : '';

  // Supabase fetch — 카테고리 진입/전환 시 서버 글을 가져온다.
  // 다국어 인프라가 도입되기 전까지 서버 글은 viewerLanguage 필터를 우회한다(항상 노출).
  const [serverPosts, setServerPosts] = useState<SeedPost[]>([]);
  const [serverCommentCounts, setServerCommentCounts] = useState<
    Record<string, number>
  >({});
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);
    void listPostsRemote({ category: categoryId, limit: 50 }).then((rows) => {
      if (cancelled) return;
      setServerPosts(rows.map(dbPostToSeed));
      setServerCommentCounts(
        Object.fromEntries(rows.map((r) => [r.id, r.comment_count ?? 0])),
      );
      setLoadingPosts(false);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const posts = useMemo(() => {
    const seed = (POSTS_BY_CATEGORY[categoryId] ?? []).filter((p) =>
      isPostVisibleIn(p, viewerLanguage),
    );
    const local = localPosts.filter((p) => p.categoryId === categoryId);
    // 서버 우선(가장 최신·정확), 그 다음 local 미러(서버 fetch 가 아직 안 끝났을 때 작성한 글),
    // 마지막으로 seed 데모. id 중복은 dedupe 가 처리. 차단한 사용자의 글은 완전 제외.
    return dedupePostsById(serverPosts, local, seed)
      .filter((p) => !blockedIds.has(p.userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [categoryId, viewerLanguage, localPosts, serverPosts, blockedIds]);

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <View style={styles.titleArea}>
        <Text style={styles.categoryTitle}>{categoryLabel}</Text>
      </View>

      <ScrollView
        style={styles.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {posts.length === 0 ? (
          <Text style={styles.emptyText}>
            {loadingPosts
              ? '문장을 불러오고 있어요…'
              : '아직 이 카테고리에 남겨진 문장이 없어요.'}
          </Text>
        ) : (
          <View style={styles.postList}>
            {posts.map((post) => {
              const author = USER_MAP[post.userId];
              const resolved = resolveContent({
                targetType: 'post',
                targetId: post.postId,
                originalContent: post.originalContent,
                originalLanguage: post.originalLanguage,
                viewerLanguage,
                translations: SEED_TRANSLATIONS,
              });
              // 답글 수: 서버 카운트가 있으면 그 기준, 없으면 seed.replies.length.
              // localReplies 는 서버 fetch 이전 사용자가 막 단 답글의 임시 카운트.
              const serverCount = serverCommentCounts[post.postId];
              const replyCount =
                (serverCount !== undefined
                  ? serverCount
                  : post.replies.length) +
                (localReplies[post.postId]?.length ?? 0);
              return (
                <Pressable
                  key={post.postId}
                  onPress={() => onOpenPost(post.postId)}
                  style={({ pressed }) => [
                    styles.postCard,
                    pressed && styles.postCardPressed,
                  ]}
                >
                  <View style={styles.postHeader}>
                    <ProfileAvatar
                      user={author}
                      size={26}
                      style={styles.profileIconSmall}
                      unknown={isUnknownAuthorId(post.userId, currentUserId)}
                    />
                    <Text style={styles.authorName}>{author?.nickname ?? ''}</Text>
                    <Text style={styles.authorTime}>{relTime(post.createdAt)}</Text>
                    <View style={styles.headerRight}>
                      <Text style={styles.replyCount}>답글 {replyCount}</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </View>

                  <Text
                    style={styles.postPreview}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {resolved.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={bottomBarStyles.bar}>
        <SizeButtons textSizeStep={textSizeStep} onChangeTextSize={onChangeTextSize} />
        <Pressable
          onPress={() => {
            if (!profileReady) {
              Alert.alert(
                '프로필 저장 필요',
                '프로필 설정에서 닉네임을 저장한 뒤 글을 남길 수 있어요.',
                [
                  { text: '취소', style: 'cancel' },
                  { text: '프로필로 이동', onPress: onOpenProfile },
                ],
              );
              return;
            }
            onOpenCompose(categoryId);
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.composeBtn,
            !profileReady && { opacity: 0.5 },
            pressed && styles.composeBtnPressed,
          ]}
        >
          <Text style={styles.composeBtnText}>생각 남기기</Text>
        </Pressable>
        <NavButton position="right" onPress={onBack} icon="←" />
      </View>
    </View>
  );
}

function ComposeScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  categoryId,
  viewerLanguage,
  mode,
  replyTargetPost,
  editingPost,
  onBack,
  onHome,
  onSubmit,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  categoryId: string;
  viewerLanguage: Language;
  mode: 'post' | 'reply' | 'edit-post';
  replyTargetPost?: SeedPost | null;
  editingPost?: SeedPost | null;
  onBack: () => void;
  onHome: () => void;
  onSubmit: (content: string) => Promise<ComposeSubmitResult>;
}) {
  const currentUserId = useCurrentUserId();
  const styles = useMemo(() => createComposeStyles(scale), [scale]);
  // 'edit-post' 는 원글 작성 정책과 동일 길이 규칙.
  const rules = mode === 'reply' ? REPLY_LENGTH_RULES : POST_LENGTH_RULES;
  const placeholder =
    mode === 'reply'
      ? '이 글에 답글을 남겨보세요.'
      : '지금 마음에 있는 생각을 남겨보세요.';
  const [body, setBody] = useState(
    mode === 'edit-post' && editingPost ? editingPost.originalContent : '',
  );
  const [safetyHint, setSafetyHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const trimmed = body.trim();
  const charCount = trimmed.length;
  const canSubmit =
    !submitting && charCount >= 1 && charCount <= rules.maxChars;

  const category = CATEGORY_MAP[categoryId];
  const categoryLabel = category
    ? category.labels[viewerLanguage] ?? category.labels.ko
    : '';

  const replyAuthor =
    mode === 'reply' && replyTargetPost
      ? USER_MAP[replyTargetPost.userId]
      : undefined;
  const replyResolved =
    mode === 'reply' && replyTargetPost
      ? resolveContent({
          targetType: 'post',
          targetId: replyTargetPost.postId,
          originalContent: replyTargetPost.originalContent,
          originalLanguage: replyTargetPost.originalLanguage,
          viewerLanguage,
          translations: SEED_TRANSLATIONS,
        })
      : null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!currentUserId) {
      setSafetyHint('먼저 본인 확인을 완료해 주세요.');
      return;
    }
    const userId = currentUserId;
    if (isWriteBlocked(userId)) {
      setSafetyHint('잠시 쉬었다가 다시 이어가 주세요.');
      return;
    }
    const ctx = mode === 'reply' ? 'reply' : 'post';
    const result = checkSafety(trimmed, ctx);
    if (!result.ok) {
      setSafetyHint(result.hint);
      reportViolation({
        userId,
        context: ctx,
        result,
        rawText: trimmed,
      });
      return;
    }
    setSafetyHint(null);
    setSubmitting(true);
    try {
      const result = await onSubmit(trimmed);
      if (!result.ok) {
        setSafetyHint(
          result.hint ?? '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeBody = (v: string) => {
    setBody(v);
    if (safetyHint) setSafetyHint(null);
  };

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <View style={styles.headerArea}>
        {mode === 'reply' && replyTargetPost && replyAuthor ? (
          <View style={styles.replyTarget}>
            <View style={styles.replyTargetHeader}>
              <ProfileAvatar
                user={replyAuthor}
                size={26}
                style={styles.replyTargetAvatar}
                unknown={
                  !!replyTargetPost &&
                  isUnknownAuthorId(replyTargetPost.userId, currentUserId)
                }
              />
              <Text style={styles.replyTargetName} numberOfLines={1}>
                {replyAuthor.nickname}
              </Text>
              <Text style={styles.replyTargetTime}>
                {relTime(replyTargetPost.createdAt)}
              </Text>
            </View>
            <Text
              style={styles.replyTargetBody}
              numberOfLines={5}
              ellipsizeMode="tail"
            >
              {replyResolved?.text ?? replyTargetPost.originalContent}
            </Text>
          </View>
        ) : (
          <Text style={styles.categoryTitle} numberOfLines={1}>
            {categoryLabel}
          </Text>
        )}
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && styles.closeBtnPressed,
          ]}
        >
          <Text style={styles.closeIcon}>×</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
          <TextInput
            value={body}
            onChangeText={handleChangeBody}
            placeholder={placeholder}
            placeholderTextColor={PALETTE.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.input}
            maxLength={rules.maxChars}
            autoFocus
          />

          {safetyHint ? (
            <Text style={styles.safetyHint}>· {safetyHint}</Text>
          ) : null}

          {/*
            글자 수 카운터는 화면에 노출하지 않는다 — 사용자가 "검사받는 느낌"이 들지 않도록.
            max 길이는 TextInput 의 maxLength 와 canSubmit 가드로 내부에서만 조용히 동작.
          */}
          <View style={styles.footer}>
            <View style={styles.footerSpacer} />
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                !canSubmit && styles.submitBtnDisabled,
                pressed && canSubmit && styles.submitBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.submitBtnText,
                  !canSubmit && styles.submitBtnTextDisabled,
                ]}
              >
                남기기
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createComposeStyles(scale: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: PALETTE.bg },
    kav: { flex: 1 },
    headerArea: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 12,
    },
    categoryTitle: {
      color: '#FFFFFF',
      fontSize: 16 * scale,
      lineHeight: 25 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
      flex: 1,
    },
    replyTarget: {
      flex: 1,
      marginRight: 8,
    },
    replyTargetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    replyTargetAvatar: {
      marginRight: 10,
    },
    replyTargetName: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    replyTargetTime: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      marginLeft: 8,
    },
    replyTargetBody: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      lineHeight: 20 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
      opacity: 0.85,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    closeBtnPressed: {
      opacity: 0.5,
    },
    closeIcon: {
      color: PALETTE.textMuted,
      fontSize: 24,
      lineHeight: 26,
      fontWeight: '300',
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 12,
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 15 * scale,
      lineHeight: 24 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      paddingTop: 4,
      paddingBottom: 4,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingTop: 12,
      marginTop: 8,
    },
    footerSpacer: {
      flex: 1,
    },
    safetyHint: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      paddingTop: 8,
      opacity: 0.9,
    },
    submitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.border,
      backgroundColor: PALETTE.settingsBg,
    },
    submitBtnDisabled: {
      opacity: 0.4,
    },
    submitBtnPressed: {
      opacity: 0.7,
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 12 * scale,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    submitBtnTextDisabled: {
      color: PALETTE.textMuted,
    },
  });
}

function ConversationListScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  conversations,
  onBack,
  onHome,
  onOpenConversation,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  conversations: DbConversation[];
  onBack: () => void;
  onHome: () => void;
  onOpenConversation: (conversationId: string) => void;
}) {
  const currentUserId = useCurrentUserId();
  const styles = useMemo(() => createConversationListStyles(scale), [scale]);

  // 마지막 활동 시간 내림차순 + 상대 닉네임 / 최근 메시지 일부 매핑.
  // 닉네임은 우선 시드 USER_MAP, 추후 users 테이블 fetch 로 보강 예정.
  const enriched = useMemo(() => {
    return [...conversations]
      .map((c) => {
        const otherId =
          c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id;
        const other = USER_MAP[otherId];
        // 시드 메시지에 한해 lookup. 실제 새 conversation 은 마지막 메시지 없음.
        const msgs = SEED_MESSAGES.filter((m) => m.conversationId === c.id);
        const lastSeed =
          msgs.length === 0
            ? null
            : msgs.reduce(
                (acc, m) =>
                  acc.createdAt.localeCompare(m.createdAt) >= 0 ? acc : m,
                msgs[0],
              );
        const lastTime = c.last_message_at ?? lastSeed?.createdAt ?? c.created_at;
        return {
          conv: c,
          otherId,
          otherNickname: other?.nickname ?? '익명',
          excerpt: lastSeed?.originalContent ?? null,
          lastTime,
        };
      })
      .sort((a, b) => b.lastTime.localeCompare(a.lastTime));
  }, [conversations, currentUserId]);

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>지금 이어지고 있는 대화</Text>
      </View>
      <ScrollView
        style={styles.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {enriched.length === 0 ? (
          <Text style={styles.empty}>
            아직 이어지고 있는 대화가 없어요.
          </Text>
        ) : (
          enriched.map((item) => (
            <Pressable
              key={item.conv.id}
              onPress={() => onOpenConversation(item.conv.id)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.otherNickname}
                </Text>
                {item.excerpt ? (
                  <Text style={styles.rowExcerpt} numberOfLines={1}>
                    {item.excerpt}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.rowTime}>{relTime(item.lastTime)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
      <View style={bottomBarStyles.bar}>
        <SizeButtons
          textSizeStep={textSizeStep}
          onChangeTextSize={onChangeTextSize}
        />
        <NavButton position="right" onPress={onBack} icon="←" />
      </View>
    </View>
  );
}

function createConversationListStyles(scale: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: PALETTE.bg },
    scrollFlex: { flex: 1 },
    titleArea: {
      paddingTop: 4,
      paddingBottom: 16,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 15 * scale,
      lineHeight: 22 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
      paddingHorizontal: 24,
    },
    scrollContent: {
      paddingBottom: SCROLL_BOTTOM_PADDING,
      paddingHorizontal: 14,
    },
    empty: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      textAlign: 'center',
      paddingTop: 60,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    rowPressed: {
      backgroundColor: PALETTE.cardPressed,
    },
    rowMain: {
      flex: 1,
      marginRight: 10,
    },
    rowName: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    rowExcerpt: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
      marginTop: 3,
      opacity: 0.9,
    },
    rowTime: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
  });
}

function PostDetailScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  postId,
  viewerLanguage,
  localPosts,
  localReplies,
  localInvites,
  inviteStateByReply,
  blockedIds,
  hiddenReplyIds,
  profileReady,
  viewerDisplayName,
  onBack,
  onHome,
  onOpenProfile,
  onOpenConversation,
  onOpenConversationById,
  onSendInvite,
  onAcceptInvite,
  onDeclineInvite,
  onWithdrawInvite,
  onHideReply,
  onDeleteReply,
  onSubmitInlineReply,
  onUpdateReply,
  onEditPost,
  onDeletePost,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  postId: string;
  viewerLanguage: Language;
  localPosts: SeedPost[];
  localReplies: Record<string, SeedReply[]>;
  localInvites: Record<string, ConversationInvite>;
  inviteStateByReply: Record<string, InviteUIState>;
  blockedIds: Set<string>;
  hiddenReplyIds: Set<string>;
  profileReady: boolean;
  viewerDisplayName: string | null;
  onBack: () => void;
  onHome: () => void;
  onOpenProfile: () => void;
  onOpenConversation: (postId: string, rootCommentId: string) => void;
  onOpenConversationById: (conversationId: string) => void;
  onSendInvite: (
    replyId: string,
    receiverId: string,
    postId: string,
  ) => Promise<boolean>;
  onAcceptInvite: (replyId: string) => Promise<boolean>;
  onDeclineInvite: (replyId: string) => Promise<boolean>;
  onWithdrawInvite: (replyId: string) => Promise<boolean>;
  onHideReply: (replyId: string) => void;
  onDeleteReply: (replyId: string) => void;
  onSubmitInlineReply: (content: string) => Promise<ComposeSubmitResult>;
  onUpdateReply: (
    replyId: string,
    content: string,
    originalReply: SeedReply,
  ) => Promise<ComposeSubmitResult>;
  onEditPost: (post: SeedPost) => void;
  onDeletePost: (post: SeedPost) => Promise<boolean>;
}) {
  const styles = useMemo(() => createPostDetailStyles(scale), [scale]);

  // Supabase fetch — post 본문 + 답글 목록. seed/local 보다 우선.
  // 서버 데이터는 다국어 인프라 도입 전까지 viewerLanguage 필터를 우회한다.
  const [serverPost, setServerPost] = useState<SeedPost | null>(null);
  const [serverReplies, setServerReplies] = useState<SeedReply[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingPost(true);
    // seed/sample id (예: "p001", "p049") 는 서버 컬럼이 uuid 라 그대로 보내면
    // Postgres invalid input syntax 에러가 난다. 그런 id 는 fetch 자체를 건너뛰고
    // seed/local 데이터로만 화면을 구성한다.
    if (!isUuid(postId)) {
      setServerPost(null);
      setServerReplies([]);
      setLoadingPost(false);
      return () => {
        cancelled = true;
      };
    }
    void Promise.all([
      getPostByIdRemote(postId).then((row) => {
        if (cancelled) return;
        setServerPost(row ? dbPostToSeed(row) : null);
      }),
      listCommentsByPostRemote(postId).then((rows) => {
        if (cancelled) return;
        setServerReplies(rows.map(dbCommentToSeed));
      }),
    ]).finally(() => {
      if (!cancelled) setLoadingPost(false);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const post = useMemo(() => {
    if (serverPost) {
      if (blockedIds.has(serverPost.userId)) return undefined;
      return serverPost;
    }
    const found =
      SEED_POSTS_NORMALIZED.find((p) => p.postId === postId) ??
      localPosts.find((p) => p.postId === postId);
    if (!found) return undefined;
    if (blockedIds.has(found.userId)) return undefined;
    if (!isPostVisibleIn(found, viewerLanguage)) return undefined;
    return found;
  }, [serverPost, postId, viewerLanguage, localPosts, blockedIds]);

  const visibleReplies = useMemo(() => {
    const seedR = (post?.replies ?? []).filter((r) =>
      isReplyVisibleIn(r, viewerLanguage),
    );
    const localR = (localReplies[postId] ?? []).filter((r) =>
      isReplyVisibleIn(r, viewerLanguage),
    );
    // local-first — 사용자가 막 수정한 본문이 server 미러보다 우선해 즉시 화면 반영.
    return dedupeRepliesById(localR, serverReplies, seedR).filter(
      (r) => !blockedIds.has(r.userId) && !hiddenReplyIds.has(r.replyId),
    );
  }, [
    post,
    viewerLanguage,
    localReplies,
    postId,
    serverReplies,
    blockedIds,
    hiddenReplyIds,
  ]);

  const displayedReplies = useMemo(
    () =>
      visibleReplies.map((reply) => {
        if (!reply.conversationInvite && localInvites[reply.replyId]) {
          return { ...reply, conversationInvite: localInvites[reply.replyId] };
        }
        return reply;
      }),
    [visibleReplies, localInvites],
  );

  const author = post ? USER_MAP[post.userId] : undefined;
  const viewerId = useCurrentUserId();

  // seed/demo 글 식별 — postId 가 UUID 가 아니면 seed.
  // seed/demo 글은 배포 초기 사용자에게 보여지는 전시 콘텐츠라서
  // 본문 신고 / 답글 신고 같은 운영 동선 대신 "관리" 메뉴만 노출한다.
  const isSeedPost = !!post && !isUuid(post.postId);

  // 하단 인라인 답글 입력창 — 별도 작성 화면 없이 같은 화면에서 즉시 작성/수정.
  const [inlineDraft, setInlineDraft] = useState('');
  const [inlineHint, setInlineHint] = useState<string | null>(null);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  // 수정 모드 — 본인 답글의 "수정하기" 시트에서 시작. null 이면 새 답글 작성 모드.
  const [editingReply, setEditingReply] = useState<SeedReply | null>(null);

  const inlineCanSubmit =
    !!viewerId &&
    profileReady &&
    !inlineSubmitting &&
    inlineDraft.trim().length > 0;
  const inlinePlaceholder = !viewerId
    ? '로그인 후 답글을 남길 수 있어요'
    : !profileReady
      ? '프로필 저장 후 답글을 남길 수 있어요'
      : editingReply
        ? '답글을 수정하는 중'
        : '답글을 남겨보세요';
  const inlineSendLabel = editingReply ? '수정' : '보내기';

  const startEditReply = (reply: SeedReply) => {
    setEditingReply(reply);
    setInlineDraft(reply.originalContent);
    setInlineHint(null);
  };

  const cancelEditReply = () => {
    setEditingReply(null);
    setInlineDraft('');
    setInlineHint(null);
  };

  const handleInlineSend = async () => {
    if (!inlineCanSubmit) return;
    const trimmed = inlineDraft.trim();
    setInlineSubmitting(true);
    setInlineHint(null);
    try {
      const res = editingReply
        ? await onUpdateReply(editingReply.replyId, trimmed, editingReply)
        : await onSubmitInlineReply(trimmed);
      if (!res.ok) {
        setInlineHint(
          res.hint ?? '지금은 저장되지 않아요. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
      setInlineDraft('');
      setEditingReply(null);
    } finally {
      setInlineSubmitting(false);
    }
  };

  // 본문 "수정" → 시트 [수정하기/삭제하기/취소]. 본인 글에만 노출.
  const isMyPost = !!post && !!viewerId && post.userId === viewerId;
  const handleEditOrDeletePost = () => {
    if (!post) return;
    Alert.alert('내 글', '', [
      {
        text: '수정하기',
        onPress: () => onEditPost(post),
      },
      {
        text: '삭제하기',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            '글 삭제',
            '이 글과 답글을 모두 영구 삭제할까요? 복구할 수 없어요.',
            [
              { text: '취소', style: 'cancel' },
              {
                text: '삭제',
                style: 'destructive',
                onPress: () => void onDeletePost(post),
              },
            ],
          ),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <ScrollView
        style={styles.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {post ? (
          <>
            <View style={styles.postSection}>
              <View style={styles.authorRow}>
                <ProfileAvatar
                  user={author}
                  size={34}
                  style={styles.profileIcon}
                  unknown={isUnknownAuthorId(post.userId, viewerId)}
                />
                <Text style={styles.authorName}>{author?.nickname ?? ''}</Text>
                <Text style={styles.timeText}>{relTime(post.createdAt)}</Text>
                {/*
                  본문 우측 액션은 본인 글에만 "수정"으로 노출. 남의 글에는 액션 없음.
                  일반 사용자 신고 기능은 정책상 제거됨.
                */}
                {isMyPost ? (
                  <Pressable
                    onPress={handleEditOrDeletePost}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.reportLink,
                      pressed && styles.ctaPressed,
                    ]}
                  >
                    <Text style={styles.reportLinkText}>수정</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.postBody}>
                {resolveContent({
                  targetType: 'post',
                  targetId: post.postId,
                  originalContent: post.originalContent,
                  originalLanguage: post.originalLanguage,
                  viewerLanguage,
                  translations: SEED_TRANSLATIONS,
                }).text}
              </Text>
            </View>

            <View style={styles.repliesSection}>
              <Text style={styles.repliesHeader}>
                답글 {displayedReplies.length}
              </Text>
              {displayedReplies.map((reply) => (
                <ReplyRow
                  key={reply.replyId}
                  reply={reply}
                  styles={styles}
                  viewerLanguage={viewerLanguage}
                  postId={post.postId}
                  postAuthorId={post.userId}
                  isSeedPost={isSeedPost}
                  viewerDisplayName={viewerDisplayName}
                  onStartEditReply={startEditReply}
                  inviteState={inviteStateByReply[reply.replyId]}
                  onOpenConversation={onOpenConversation}
                  onOpenConversationById={onOpenConversationById}
                  onSendInvite={onSendInvite}
                  onAcceptInvite={onAcceptInvite}
                  onDeclineInvite={onDeclineInvite}
                  onWithdrawInvite={onWithdrawInvite}
                  onHideReply={onHideReply}
                  onDeleteReply={onDeleteReply}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.notFound}>
            {loadingPost ? '불러오는 중…' : '해당 글을 찾을 수 없습니다.'}
          </Text>
        )}
      </ScrollView>

      {/*
        하단 인라인 답글 입력창 + 작은 bottomBar.
        KeyboardAvoidingView 가 키보드 위로 올린다. SafeAreaView 안 ScrollView 의 contentContainerStyle
        에 paddingBottom 을 충분히 둬 마지막 답글이 입력창에 가리지 않게 한다.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {editingReply ? (
          <View style={styles.inlineEditBanner}>
            <Text style={styles.inlineEditBannerText}>답글 수정 중</Text>
            <Pressable
              onPress={cancelEditReply}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.ctaPressed}
            >
              <Text style={styles.inlineEditCancel}>수정 취소</Text>
            </Pressable>
          </View>
        ) : null}
        {inlineHint ? (
          <Text style={styles.inlineReplyHint}>· {inlineHint}</Text>
        ) : null}
        <View style={styles.inlineReplyRow}>
          <TextInput
            value={inlineDraft}
            onChangeText={(v) => {
              setInlineDraft(v);
              if (inlineHint) setInlineHint(null);
            }}
            placeholder={inlinePlaceholder}
            placeholderTextColor={PALETTE.textMuted}
            style={styles.inlineReplyInput}
            multiline
            maxLength={500}
            editable={!!viewerId && profileReady && !inlineSubmitting}
          />
          <Pressable
            onPress={() => {
              void handleInlineSend();
            }}
            hitSlop={8}
            disabled={!inlineCanSubmit}
            style={({ pressed }) => [
              styles.inlineReplySend,
              !inlineCanSubmit && { opacity: 0.4 },
              pressed && inlineCanSubmit && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.inlineReplySendText}>
              {inlineSubmitting ? '…' : inlineSendLabel}
            </Text>
          </Pressable>
        </View>
        <View style={bottomBarStyles.bar}>
          <SizeButtons
            textSizeStep={textSizeStep}
            onChangeTextSize={onChangeTextSize}
          />
          <NavButton position="right" onPress={onBack} icon="←" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ReplyRow({
  reply,
  styles,
  viewerLanguage,
  postId,
  postAuthorId,
  isSeedPost,
  viewerDisplayName,
  onStartEditReply,
  inviteState,
  onOpenConversation,
  onOpenConversationById,
  onSendInvite,
  onAcceptInvite,
  onDeclineInvite,
  onWithdrawInvite,
  onHideReply,
  onDeleteReply,
}: {
  reply: SeedReply;
  styles: ReturnType<typeof createPostDetailStyles>;
  viewerLanguage: Language;
  postId: string;
  postAuthorId: string;
  isSeedPost: boolean;
  viewerDisplayName: string | null;
  onStartEditReply: (reply: SeedReply) => void;
  inviteState?: InviteUIState;
  onOpenConversation: (postId: string, rootCommentId: string) => void;
  onOpenConversationById: (conversationId: string) => void;
  onSendInvite: (
    replyId: string,
    receiverId: string,
    postId: string,
  ) => Promise<boolean>;
  onAcceptInvite: (replyId: string) => Promise<boolean>;
  onDeclineInvite: (replyId: string) => Promise<boolean>;
  onWithdrawInvite: (replyId: string) => Promise<boolean>;
  onHideReply: (replyId: string) => void;
  onDeleteReply: (replyId: string) => void;
}) {
  const currentUserId = useCurrentUserId();
  const author = USER_MAP[reply.userId];
  const resolved = resolveContent({
    targetType: 'reply',
    targetId: reply.replyId,
    originalContent: reply.originalContent,
    originalLanguage: reply.originalLanguage,
    viewerLanguage,
    translations: SEED_TRANSLATIONS,
  });

  // 분기 (DulSai 최종 권한 정책):
  //   - 내가 쓴 답글 → "수정" → [수정하기/삭제하기/취소]
  //   - 원글 작성자가 보는 남의 답글 → "관리" → [내보내기/신고하기/삭제하기/취소]
  //   - 그 외 (다른 사용자) → 액션 없음 (일반 사용자 신고 기능 제거)
  //   - 비로그인 → 없음
  // 작성자(원글)가 단 답글 → 닉네임 옆 "작성자" badge (액션과 별개)
  const isPostAuthor = !!currentUserId && currentUserId === postAuthorId;
  const isReplyByMe = !!currentUserId && currentUserId === reply.userId;
  const isReplyByPostAuthor = reply.userId === postAuthorId;

  const canInvite =
    isPostAuthor && !isReplyByMe && !reply.conversationInvite;
  const canEditMine = isReplyByMe;
  const canManageThisReply = !isReplyByMe && isPostAuthor;

  const handleReportReply = () => {
    presentReportSheet('reply', reply.replyId, (reasonKind) => {
      void submitReport('reply', reply.replyId, reasonKind);
    });
  };

  // 원글 작성자가 보는 남의 답글 관리. seed/demo 답글이면 "신고하기" 항목 제거.
  const isSeedReply = reply.isAutoSeed === true || isSeedUserId(reply.userId);
  const handleManageReply = () => {
    const actions: Array<{
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }> = [
      { text: '내보내기', onPress: () => onHideReply(reply.replyId) },
    ];
    if (!isSeedReply) {
      actions.push({ text: '신고하기', onPress: handleReportReply });
    }
    actions.push({
      text: '삭제하기',
      style: 'destructive',
      onPress: () =>
        Alert.alert(
          '답글 삭제',
          '이 답글을 영구 삭제할까요? 복구할 수 없어요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: () => onDeleteReply(reply.replyId),
            },
          ],
        ),
    });
    actions.push({ text: '취소', style: 'cancel' });
    Alert.alert('답글 관리', '', actions);
  };

  const handleEditReply = () => {
    Alert.alert('답글', '', [
      {
        text: '수정하기',
        onPress: () => onStartEditReply(reply),
      },
      {
        text: '삭제하기',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            '답글 삭제',
            '이 답글을 영구 삭제할까요? 복구할 수 없어요.',
            [
              { text: '취소', style: 'cancel' },
              {
                text: '삭제',
                style: 'destructive',
                onPress: () => onDeleteReply(reply.replyId),
              },
            ],
          ),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // 답글 카드 우측 액션 — "수정" 또는 "관리" 또는 null (정확히 하나).
  // 일반 사용자 신고 노출은 정책상 제거됨. 신고는 원글 작성자의 "관리" 시트 안에서만.
  let replyActionLabel: '수정' | '관리' | null = null;
  let replyActionPress: (() => void) | null = null;
  if (canEditMine) {
    replyActionLabel = '수정';
    replyActionPress = handleEditReply;
  } else if (canManageThisReply) {
    replyActionLabel = '관리';
    replyActionPress = handleManageReply;
  }

  // ── dev 진단 ─────────────────────────────────────────────────────────
  // 화면에 보이는 결과가 의도와 다를 때 Metro 콘솔에서 currentUserId / postAuthorId /
  // reply.userId 가 실제로 어떤 값인지 확인할 수 있도록 한 줄 로그.
  // seed post 의 author id 와 인증 사용자 uuid 가 달라 isPostAuthor 가 false 가 되는 케이스를
  // 즉시 발견할 수 있다. production 빌드에서는 자동으로 비활성.
  if (__DEV__) {
    logger.debug('ReplyRow render', {
      replyId: reply.replyId,
      currentUserId,
      postAuthorId,
      replySenderId: reply.userId,
      isPostAuthor,
      isReplyByMe,
      canManageThisReply,
      replyActionLabel,
    });
  }

  return (
    <View style={styles.reply}>
      <ProfileAvatar
        user={author}
        size={26}
        style={styles.replyIcon}
        unknown={isUnknownAuthorId(reply.userId, currentUserId)}
      />
      <View style={styles.replyContent}>
        <View style={styles.replyHeader}>
          <Text style={styles.replyAuthor}>
            {author?.nickname ??
              (isReplyByMe && viewerDisplayName ? viewerDisplayName : '')}
          </Text>
          {isReplyByPostAuthor ? (
            <Text style={styles.authorBadge}>작성자</Text>
          ) : null}
          <Text style={styles.replyTime}>{relTime(reply.createdAt)}</Text>
          {replyActionLabel && replyActionPress ? (
            <Pressable
              onPress={replyActionPress}
              hitSlop={8}
              style={({ pressed }) => [
                styles.reportLink,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.reportLinkText}>{replyActionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.replyText}>{resolved.text}</Text>

        {reply.conversationInvite ? (
          <InviteBlock
            invite={reply.conversationInvite}
            styles={styles}
            postId={postId}
            postAuthorId={postAuthorId}
            replyAuthorId={reply.userId}
            rootCommentId={reply.replyId}
            inviteState={inviteState}
            onOpenConversation={onOpenConversation}
            onOpenConversationById={onOpenConversationById}
            onAcceptInvite={onAcceptInvite}
            onDeclineInvite={onDeclineInvite}
            onWithdrawInvite={onWithdrawInvite}
          />
        ) : null}

        {canInvite && !inviteState ? (
          <Pressable
            onPress={() => {
              void onSendInvite(reply.replyId, reply.userId, postId);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.inviteCta,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.inviteCtaText}>대화초대</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function InviteBlock({
  invite,
  styles,
  postId,
  postAuthorId,
  replyAuthorId,
  rootCommentId,
  inviteState,
  onOpenConversation,
  onOpenConversationById,
  onAcceptInvite,
  onDeclineInvite,
  onWithdrawInvite,
}: {
  invite: ConversationInvite;
  styles: ReturnType<typeof createPostDetailStyles>;
  postId: string;
  postAuthorId: string;
  replyAuthorId: string;
  rootCommentId: string;
  inviteState?: InviteUIState;
  onOpenConversation: (postId: string, rootCommentId: string) => void;
  onOpenConversationById: (conversationId: string) => void;
  onAcceptInvite: (replyId: string) => Promise<boolean>;
  onDeclineInvite: (replyId: string) => Promise<boolean>;
  onWithdrawInvite: (replyId: string) => Promise<boolean>;
}) {
  const currentUserId = useCurrentUserId();
  const author = USER_MAP[invite.userId];

  // 시드 invite 경로: 기존 conversationJoin 기반 분기 유지.
  // 새 invite 경로: inviteState.status 분기.
  const isSender = !!currentUserId && currentUserId === invite.userId;
  const isReceiver = !!currentUserId && currentUserId === replyAuthorId;
  const status: ConversationInviteStatus | null = inviteState?.status ?? null;
  const conversationId = inviteState?.conversationId ?? null;

  // 시드 데모 — conversationJoin 이 이미 완료된 시드 invite 는 인증 여부와 무관하게
  // 「대화 이어가기」 진입을 허용한다 (테스트/예시 확인용). 실제 새 invite 흐름은
  // inviteState 분기에서 별도 권한 검사를 한다.
  const seedCanContinue = !inviteState && !!invite.conversationJoin;

  return (
    <View style={styles.invite}>
      <Text style={styles.inviteLabel}>대화초대</Text>
      <View style={styles.inviteHeader}>
        <ProfileAvatar
          user={author}
          size={22}
          style={styles.inviteAvatar}
          unknown={isUnknownAuthorId(invite.userId, currentUserId)}
        />
        <Text style={styles.inviteAuthor}>{author?.nickname ?? ''}</Text>
        <Text style={styles.inviteTime}>{relTime(invite.createdAt)}</Text>
      </View>
      <Text style={styles.inviteText}>{invite.originalContent}</Text>

      {invite.conversationJoin && !inviteState ? (
        <JoinBlock join={invite.conversationJoin} styles={styles} />
      ) : null}

      {seedCanContinue ? (
        <Pressable
          onPress={() => onOpenConversation(postId, rootCommentId)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.continueCta,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text style={styles.continueCtaText}>대화 이어가기</Text>
        </Pressable>
      ) : null}

      {/* 새 경로 — inviteState.status 분기 */}
      {status === 'pending' && isReceiver ? (
        <View style={styles.inviteActions}>
          <Text style={styles.inviteStatusHint}>대화 초대 받음</Text>
          <View style={styles.inviteActionRow}>
            <Pressable
              onPress={() => {
                void onAcceptInvite(rootCommentId);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.continueCta,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.continueCtaText}>수락</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void onDeclineInvite(rootCommentId);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.joinCta,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.joinCtaText}>거절</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {status === 'pending' && isSender ? (
        <View style={styles.inviteActions}>
          <Text style={styles.inviteStatusHint}>초대 보냄</Text>
          <Pressable
            onPress={() => {
              void onWithdrawInvite(rootCommentId);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.joinCta,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.joinCtaText}>초대 취소</Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'accepted' && conversationId ? (
        <Pressable
          onPress={() => onOpenConversationById(conversationId)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.continueCta,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text style={styles.continueCtaText}>대화 이어가기</Text>
        </Pressable>
      ) : null}

      {status === 'declined' && isSender ? (
        <Text style={styles.inviteStatusHint}>거절됨</Text>
      ) : null}

      {status === 'withdrawn' && isSender ? (
        <Text style={styles.inviteStatusHint}>초대 취소됨</Text>
      ) : null}
    </View>
  );
}

function JoinBlock({
  join,
  styles,
}: {
  join: ConversationJoin;
  styles: ReturnType<typeof createPostDetailStyles>;
}) {
  const author = USER_MAP[join.userId];
  return (
    <View style={styles.join}>
      <Text style={styles.joinLabel}>대화참여</Text>
      <View style={styles.joinHeader}>
        <ProfileAvatar
          user={author}
          size={22}
          style={styles.joinAvatar}
          unknown={isUnknownAuthorId(join.userId, null)}
        />
        <Text style={styles.joinAuthor}>{author?.nickname ?? ''}</Text>
        <Text style={styles.joinTime}>{relTime(join.createdAt)}</Text>
      </View>
      <Text style={styles.joinText}>{join.originalContent}</Text>
    </View>
  );
}


// ConversationScreen 이 seed/실서버 두 출처 모두에서 동일하게 다룰 정규화 타입.
// SeedConversation 과 DbConversation 의 공통 정보만 추려 ViewConversation 으로 빚는다.
type ConversationView = {
  conversationId: string;
  participants: [string, string];
  // seed 데모(미인증 진입) 용 fallback. 실제 DB conversation 에는 inviter 정보가 없다.
  inviterUserId: string | null;
};

function ConversationScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  conversationId,
  myConversations,
  onBack,
  onHome,
  onOpenProfile,
  onLeave,
  onBlockedUser,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  conversationId: string;
  myConversations: DbConversation[];
  onBack: () => void;
  onHome: () => void;
  onOpenProfile: () => void;
  onLeave: (conversationId: string) => void;
  onBlockedUser: (userId: string) => void;
}) {
  const styles = useMemo(() => createConversationStyles(scale), [scale]);
  const currentUserId = useCurrentUserId();
  const [draft, setDraft] = useState('');
  const [extraMessages, setExtraMessages] = useState<SeedMessage[]>([]);
  // + 버튼으로 선택된 사진들은 첨부만 된 상태로 머문다. 보내기 버튼을 눌러야 실제 전송.
  // 한 번에 최대 MAX_IMAGES_PER_SEND 장까지.
  type PendingImage = { uri: string; width: number; height: number };
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  // 사진 메시지 전체보기 — 탭으로 열고 X 또는 배경 탭으로 닫는다.
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 새 흐름(실서버) > seed 데모 fallback 순으로 lookup. 둘 다 못 찾으면 null.
  const conversation = useMemo<ConversationView | null>(() => {
    const dbConv = myConversations.find((c) => c.id === conversationId);
    if (dbConv) {
      return {
        conversationId: dbConv.id,
        participants: [dbConv.user_a_id, dbConv.user_b_id],
        inviterUserId: null,
      };
    }
    const seed = SEED_CONVERSATIONS.find(
      (c) => c.conversationId === conversationId,
    );
    if (seed) {
      return {
        conversationId: seed.conversationId,
        participants: [...seed.participants],
        inviterUserId: seed.inviterUserId,
      };
    }
    return null;
  }, [conversationId, myConversations]);

  // 액션 권한(canDelete 등)은 항상 실제 로그인 사용자 기준.
  const myId = currentUserId;

  // 말풍선 좌/우 정렬용 pivot user id.
  //   1) 로그인 + 본인이 실제 이 대화 participants 에 포함 → currentUserId
  //   2) 로그인 + seed 데모(참여자 X) 인데 본인이 직접 보낸 메시지가 있으면 → currentUserId
  //      (인증 사용자가 seed 데모에서 사진/메시지를 보내도 내 메시지가 오른쪽에 가도록)
  //   3) 그 외(미인증 / 보낸 메시지 없음) → inviterUserId → participants[0]
  const rightSidePivotId: string | null = useMemo(() => {
    if (!conversation) return null;
    if (myId && conversation.participants.includes(myId)) return myId;
    if (myId && extraMessages.some((m) => m.senderId === myId)) return myId;
    return (
      conversation.inviterUserId ?? conversation.participants[0] ?? null
    );
  }, [conversation, myId, extraMessages]);

  // 상대 닉네임 표시 — pivot 의 반대편 user.
  const counterpart = useMemo(() => {
    if (!conversation) return undefined;
    const pivot = rightSidePivotId ?? conversation.participants[0];
    const otherId = conversation.participants.find((p) => p !== pivot);
    return otherId ? USER_MAP[otherId] : undefined;
  }, [conversation, rightSidePivotId]);

  const scrollRef = useRef<ScrollView>(null);

  const messages = useMemo(() => {
    const seed = SEED_MESSAGES.filter(
      (m) => m.conversationId === conversationId,
    ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return [...seed, ...extraMessages].filter(
      (m) => !deletedIds.includes(m.messageId),
    );
  }, [conversationId, extraMessages, deletedIds]);

  const handleDelete = (messageId: string) => {
    Alert.alert('메시지 삭제', '이 메시지를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setDeletedIds((prev) => [...prev, messageId]);
        },
      },
    ]);
  };

  const handleSend = async () => {
    if (!currentUserId) {
      Alert.alert('잠시만요', '먼저 본인 확인을 완료해 주세요.');
      return;
    }
    const userId = currentUserId;
    if (isWriteBlocked(userId)) {
      Alert.alert('잠시만요', '잠시 쉬었다가 다시 이어가 주세요.');
      return;
    }

    const trimmedDraft = draft.trim();
    const hasText = trimmedDraft.length > 0;
    const imageCount = pendingImages.length;
    if (!hasText && imageCount === 0) return;

    // 텍스트가 있을 때만 안전 필터 검사 (사진만 보내는 경우는 메시지 본문 검열 대상 외).
    if (hasText) {
      const validation = validateMessageBeforeSend(draft);
      if (!validation.ok) {
        Alert.alert('메시지 확인', validation.reason ?? '');
        return;
      }
      const safety = checkSafety(trimmedDraft, 'message');
      if (!safety.ok) {
        reportViolation({
          userId,
          context: 'message',
          result: safety,
          rawText: trimmedDraft,
        });
        Alert.alert('잠시만요', safety.hint ?? '');
        return;
      }
    }

    // 보내기 시점에 일일 한도 한 번 더 검사 (UI 가드와 race 방지).
    if (imageCount > 0) {
      const used = await loadDailyCount(DAILY_IMAGE_PREFIX);
      const remaining = Math.max(0, MAX_IMAGES_PER_DAY - used);
      if (remaining === 0 && imageCount > 0) {
        Alert.alert(
          '오늘 한도 도달',
          `사진은 하루 ${MAX_IMAGES_PER_DAY}장까지 보낼 수 있어요.`,
        );
        return;
      }
      if (imageCount > remaining) {
        Alert.alert(
          '오늘 남은 한도 초과',
          `오늘은 ${remaining}장까지 더 보낼 수 있어요. 첨부를 일부 줄여 주세요.`,
        );
        return;
      }
    }

    // 사진은 각각 별도의 메시지로 push (카톡과 동일). 텍스트는 1건.
    const nowMs = Date.now();
    const newMessages: SeedMessage[] = [];
    pendingImages.forEach((img, idx) => {
      newMessages.push({
        messageId: `local_${nowMs}_img_${idx}`,
        conversationId,
        senderId: currentUserId,
        originalLanguage: 'ko',
        originalContent: '',
        createdAt: new Date(nowMs + idx).toISOString(),
        isSample: true,
        imageUri: img.uri,
        imageWidth: img.width,
        imageHeight: img.height,
      });
    });
    if (hasText) {
      newMessages.push({
        messageId: `local_${nowMs}_txt`,
        conversationId,
        senderId: currentUserId,
        originalLanguage: 'ko',
        originalContent: trimmedDraft,
        createdAt: new Date(nowMs + imageCount).toISOString(),
        isSample: true,
      });
    }
    setExtraMessages((prev) => [...prev, ...newMessages]);
    setDraft('');
    setPendingImages([]);
    if (imageCount > 0) {
      void bumpDailyCount(DAILY_IMAGE_PREFIX, imageCount);
    }
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const openImageViewer = (uri: string) => setViewerImageUri(uri);
  const closeImageViewer = () => setViewerImageUri(null);

  // 전체보기 "저장" — 기기 사진첩에 저장. iOS / Android 모두 expo-media-library 사용.
  // 권한이 없으면 한 번 더 요청한다. 실패 시 정확한 error.message 를 사용자/로그에 노출.
  const handleSaveViewerImage = async () => {
    if (!viewerImageUri) return;

    // 1) 모듈 로드 — 미설치 시 정확히 알린다.
    let MediaLibrary:
      | {
          getPermissionsAsync: (writeOnly?: boolean) => Promise<{
            granted: boolean;
            canAskAgain: boolean;
          }>;
          requestPermissionsAsync: (writeOnly?: boolean) => Promise<{
            granted: boolean;
            canAskAgain: boolean;
          }>;
          saveToLibraryAsync: (uri: string) => Promise<void>;
        }
      | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      MediaLibrary = require('expo-media-library');
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger.error('expo-media-library require failed', { message: m });
      Alert.alert(
        '저장 모듈 없음',
        `expo-media-library 가 설치되어 있지 않아 사진을 저장할 수 없어요.\n(${m})`,
      );
      return;
    }
    if (!MediaLibrary) return;

    // 2) 권한 확인 → 부족하면 요청. iOS 는 writeOnly 권한만 있으면 saveToLibraryAsync 가능.
    try {
      let perm = await MediaLibrary.getPermissionsAsync(true);
      if (!perm.granted && perm.canAskAgain) {
        perm = await MediaLibrary.requestPermissionsAsync(true);
      }
      if (!perm.granted) {
        Alert.alert(
          '권한 필요',
          '사진을 저장하려면 설정에서 사진 접근 권한을 허용해 주세요.',
        );
        return;
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger.error('media-library permission failed', { message: m });
      Alert.alert('권한 확인 실패', m);
      return;
    }

    // 3) 저장. file:// 로컬 / http(s) remote 모두 saveToLibraryAsync 가 처리.
    try {
      await MediaLibrary.saveToLibraryAsync(viewerImageUri);
      logger.info('image saved to library', { uri: viewerImageUri });
      Alert.alert('저장 완료', '사진이 저장되었어요.');
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger.error('saveToLibrary failed', {
        uri: viewerImageUri,
        message: m,
      });
      Alert.alert('저장 실패', m);
    }
  };

  // + 버튼 탭 → 갤러리 다중 선택(최대 5). 자동 전송 없이 pendingImages 에 누적.
  // 일일 한도(20장) 와 현재 첨부 수, 남은 일일 한도를 모두 고려해 selectionLimit 을 결정한다.
  // 압축은 선택 직후 적용 (원본 그대로 절대 머무르지 않음).
  const handleAttach = async () => {
    if (!currentUserId) {
      Alert.alert('잠시만요', '먼저 본인 확인을 완료해 주세요.');
      return;
    }

    // 일일 남은 한도 계산.
    const used = await loadDailyCount(DAILY_IMAGE_PREFIX);
    const remainingDaily = Math.max(0, MAX_IMAGES_PER_DAY - used);
    if (remainingDaily === 0) {
      Alert.alert(
        '오늘 한도 도달',
        `사진은 하루 ${MAX_IMAGES_PER_DAY}장까지 보낼 수 있어요. 내일 다시 이어가 주세요.`,
      );
      return;
    }

    // 한 번 전송 한도 + 이미 첨부된 수 + 일일 한도 중 가장 작은 값.
    const slotForThisSend = Math.max(
      0,
      MAX_IMAGES_PER_SEND - pendingImages.length,
    );
    const allowed = Math.min(slotForThisSend, remainingDaily);
    if (allowed === 0) {
      Alert.alert(
        '한 번에 최대 5장',
        '먼저 첨부된 사진을 보내거나 일부를 취소한 뒤 다시 시도해 주세요.',
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해 주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: allowed,
      quality: 1, // 압축은 우리가 직접 적용. picker 단계에선 원본 그대로 받는다.
      exif: true, // 실제 촬영 사진 검증을 위해 EXIF 메타도 함께 가져온다.
    });
    if (result.canceled || result.assets.length === 0) return;

    // 1) EXIF 검증 — 한 장이라도 실패하면 그 장만 거부하지 않고 전체 첨부를 멈춰
    //    사용자가 어떤 사진이 거부됐는지 명확히 인지하게 한다.
    const compressed: PendingImage[] = [];
    const rejected: { uri: string; reason: string }[] = [];
    for (const a of result.assets.slice(0, allowed)) {
      const check = validateRealPhotoExif(
        (a as { exif?: Record<string, unknown> }).exif ?? null,
      );
      if (!check.ok) {
        logger.warn('image rejected by exif check', {
          uri: a.uri,
          reason: check.reason,
        });
        rejected.push({ uri: a.uri, reason: check.reason });
        continue;
      }
      // 2) 압축 — 검증 통과한 사진만.
      try {
        const out = await compressImage({
          uri: a.uri,
          width: a.width ?? 1,
          height: a.height ?? 1,
        });
        compressed.push(out);
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        logger.error('image compress failed', { message: m, uri: a.uri });
        Alert.alert(
          '사진 처리 실패',
          `사진을 보낼 수 있는 형태로 바꾸지 못했어요.\n(${m})`,
        );
        return;
      }
    }

    if (compressed.length > 0) {
      setPendingImages((prev) => [...prev, ...compressed]);
    }

    // 거부된 장이 있으면 묶어서 한 번에 안내.
    if (rejected.length > 0) {
      Alert.alert(
        '직접 촬영한 사진만 보낼 수 있어요',
        `${rejected.length}장이 보내지지 않았어요.\n${rejected[0].reason}`,
      );
    } else if (result.assets.length > allowed) {
      // 정책상 일부만 받은 경우 — 조용한 한 줄 안내.
      Alert.alert(
        '일부만 첨부됨',
        `한 번에 ${MAX_IMAGES_PER_SEND}장까지만 보낼 수 있어 ${allowed}장만 첨부했어요.`,
      );
    }
  };

  const removePendingImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLeave = () => {
    Alert.alert(
      '대화방 나가기',
      '이 대화방을 나가면 이 대화 기록은 더 이상 보이지 않아요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: () => onLeave(conversationId),
        },
      ],
    );
  };

  // 신고/차단 대상 식별용 — myId 가 null 이면 inviter/participants[0] fallback.
  const counterpartId = conversation
    ? (() => {
        const pivot =
          myId ?? conversation.inviterUserId ?? conversation.participants[0];
        return conversation.participants.find((p) => p !== pivot) ?? null;
      })()
    : null;

  const handleReport = () => {
    if (!counterpartId) {
      Alert.alert('신고', '신고할 사용자를 찾지 못했어요.');
      return;
    }
    const target = counterpartId;
    presentReportSheet('user', target, (reasonKind) => {
      void submitReport('user', target, reasonKind);
    });
  };

  const handleBlock = () => {
    if (!counterpartId) {
      Alert.alert('차단', '차단할 사용자를 찾지 못했어요.');
      return;
    }
    const target = counterpartId;
    Alert.alert(
      '사용자 차단',
      '이 사용자를 차단하면 더 이상 글·답글이 보이지 않고 이 대화방도 닫힙니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            const res = await blockUserRemote(target);
            if (!res.ok) {
              Alert.alert(
                '차단 실패',
                `${res.errorMessage ?? '잠시 후 다시 시도해 주세요.'}${
                  res.errorCode ? ` (${res.errorCode})` : ''
                }`,
              );
              return;
            }
            onBlockedUser(target);
            onLeave(conversationId);
          },
        },
      ],
    );
  };

  const handleMore = () => {
    Alert.alert('대화방 메뉴', '', [
      { text: '대화방 나가기', onPress: handleLeave },
      { text: '신고하기', onPress: handleReport },
      { text: '이 사용자 차단하기', onPress: handleBlock },
      { text: '닫기', style: 'cancel' },
    ]);
  };

  if (!conversation) {
    return (
      <View style={styles.safe}>
        {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundText}>대화를 찾을 수 없어요.</Text>
        </View>
        <View style={bottomBarStyles.bar}>
          <SizeButtons
            textSizeStep={textSizeStep}
            onChangeTextSize={onChangeTextSize}
          />
          <NavButton position="right" onPress={onBack} icon="←" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.title}>
              {counterpart?.nickname ?? '익명'}님과의 대화
            </Text>
          </View>
          <Pressable
            onPress={handleMore}
            hitSlop={10}
            style={({ pressed }) => pressed && styles.morePressed}
          >
            <Text style={styles.moreText}>⋯</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollFlex}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.map((m, idx) => {
            const isLast = idx === messages.length - 1;
            const canDelete = isLast && m.senderId === myId;
            const prev = idx > 0 ? messages[idx - 1] : null;
            const showDateSeparator =
              !prev || !isSameLocalDay(prev.createdAt, m.createdAt);
            return (
              <Fragment key={m.messageId}>
                {showDateSeparator ? (
                  <View style={styles.dateSeparator}>
                    <View style={styles.dateSepLine} />
                    <Text style={styles.dateSepText}>
                      {formatDateLabel(m.createdAt)}
                    </Text>
                    <View style={styles.dateSepLine} />
                  </View>
                ) : null}
                <MessageBubble
                  message={m}
                  myId={rightSidePivotId}
                  styles={styles}
                  onDelete={
                    canDelete ? () => handleDelete(m.messageId) : undefined
                  }
                  onOpenImage={openImageViewer}
                />
              </Fragment>
            );
          })}
        </ScrollView>

        {pendingImages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.attachPreviewScroll}
            contentContainerStyle={styles.attachPreviewRow}
          >
            {pendingImages.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} style={styles.attachPreviewItem}>
                <Image
                  source={{ uri: img.uri }}
                  style={styles.attachPreviewImg}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => removePendingImage(idx)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.attachPreviewClose,
                    pressed && styles.ctaPressed,
                  ]}
                >
                  <Text style={styles.attachPreviewCloseIcon}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.inputRow}>
          <Pressable
            onPress={() => {
              void handleAttach();
            }}
            hitSlop={10}
            style={({ pressed }) => [
              styles.attachBtn,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.attachIcon}>+</Text>
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="천천히 한 마디 적어보세요"
            placeholderTextColor={PALETTE.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={() => {
              void handleSend();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.sendText}>보내기</Text>
          </Pressable>
        </View>

        {!keyboardVisible ? (
          <View style={bottomBarStyles.bar}>
            <SizeButtons
              textSizeStep={textSizeStep}
              onChangeTextSize={onChangeTextSize}
            />
            <NavButton position="right" onPress={onBack} icon="←" />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {/*
        사진 메시지 전체보기 modal.
        배경 어둡게(dim), 사진은 화면 가득 + 원본 비율(contain).
        우상단 닫기 / 우하단 저장. 배경 탭으로도 닫힌다.
      */}
      <Modal
        visible={viewerImageUri !== null}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <Pressable style={styles.viewerBackdrop} onPress={closeImageViewer}>
          {viewerImageUri ? (
            <Image
              source={{ uri: viewerImageUri }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          ) : null}
          {/* 우측 하단에 [저장] [닫기] 한 row 로. 닫기가 더 오른쪽. */}
          <View style={styles.viewerActions}>
            <Pressable
              onPress={() => {
                void handleSaveViewerImage();
              }}
              hitSlop={10}
              style={({ pressed }) => [
                styles.viewerActionBtn,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.viewerActionText}>저장</Text>
            </Pressable>
            <Pressable
              onPress={closeImageViewer}
              hitSlop={10}
              style={({ pressed }) => [
                styles.viewerActionBtn,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.viewerActionText}>닫기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const PROFILE_REGION_OPTIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '강원',
  '제주',
  '전국',
] as const;

const PROFILE_LANGUAGE_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
];

// 약관 / 개인정보 처리방침 외부 링크. 페이지가 살아 있어야 App Store / Google Play 심사 통과.
const LEGAL_URLS = {
  terms: 'https://dulsai.com/terms',
  privacy: 'https://dulsai.com/privacy',
} as const;

// 신고 시트에 노출되는 사유 순서. 가장 자주 쓰이는 항목을 위에 둔다.
const REPORT_REASON_ORDER: ReadonlyArray<ReportReasonKind> = [
  'harassment_hate',
  'sexual',
  'minor_risk',
  'spam',
  'impersonation',
  'self_harm',
  'private_info',
  'other',
];

// 신고 시트 호출 헬퍼 — ConversationScreen, PostDetailScreen 등에서 재사용.
function presentReportSheet(
  targetType: ReportTargetType,
  targetId: string,
  onSubmit: (reasonKind: ReportReasonKind) => void,
) {
  Alert.alert('신고 사유 선택', '신고는 운영팀이 검토합니다.', [
    ...REPORT_REASON_ORDER.map((kind) => ({
      text: REPORT_REASON_LABELS[kind],
      onPress: () => onSubmit(kind),
    })),
    { text: '취소', style: 'cancel' as const },
  ]);
}

// 신고 실행 + 결과 안내 — 화면 어디서든 같은 톤으로 사용.
async function submitReport(
  targetType: ReportTargetType,
  targetId: string,
  reasonKind: ReportReasonKind,
) {
  const res = await reportContentRemote({ targetType, targetId, reasonKind });
  Alert.alert(
    res.ok ? '신고 접수' : '신고 실패',
    res.ok
      ? '검토 후 처리됩니다. 협조해 주셔서 감사해요.'
      : `${res.errorMessage ?? '잠시 후 다시 시도해 주세요.'}${
          res.errorCode ? ` (${res.errorCode})` : ''
        }`,
  );
}

const PROFILE_OCCUPATION_OPTIONS = [
  '사무직',
  '전문직',
  '자영업',
  '학생',
  'IT/기술',
  '서비스직',
  '의료/보건',
  '교육',
  '예술/문화',
  '공무원',
  '프리랜서',
  '그 외',
] as const;

// ──────────────────────────────────────────────────────────────────────────
// AuthScreen — Email signup/signin (Apple / Google 은 추후 단계에서 연결).
// 비로그인 사용자가 작성/초대/메시지를 시도하거나 프로필을 열려고 할 때 진입.
// ──────────────────────────────────────────────────────────────────────────

type AuthMode = 'signin' | 'signup';

function AuthScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  initialMode = 'signin',
  onBack,
  onHome,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  initialMode?: AuthMode;
  onBack: () => void;
  onHome: () => void;
}) {
  const { currentUserId, emailVerifiedNotice, clearEmailVerifiedNotice } =
    useAuth();
  const styles = useMemo(() => createAuthStyles(scale), [scale]);
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // 이메일 인증 deep link 처리 직후 안내 한 줄을 hint 자리에 흡수.
  useEffect(() => {
    if (emailVerifiedNotice) {
      setHint(emailVerifiedNotice);
      clearEmailVerifiedNotice();
    }
  }, [emailVerifiedNotice, clearEmailVerifiedNotice]);
  const [oauthBusy, setOauthBusy] =
    useState<'apple' | 'google' | 'kakao' | null>(null);

  const runOAuth = async (
    kind: 'apple' | 'google' | 'kakao',
    fn: () => Promise<{ ok: boolean; cancelled: boolean; errorMessage?: string }>,
  ) => {
    if (oauthBusy) return;
    setOauthBusy(kind);
    setHint(null);
    try {
      const res = await fn();
      if (!res.ok && !res.cancelled && res.errorMessage) {
        setHint(res.errorMessage);
      }
    } finally {
      setOauthBusy(null);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 마운트 시 기기에 저장된 마지막 로그인 이메일 1회 로드.
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const passwordConfirmInputRef = useRef<TextInput>(null);

  // 사용자가 이미 뭔가 입력했으면 덮어쓰지 않는다.
  useEffect(() => {
    let cancelled = false;
    void getLastLoginEmail().then((saved) => {
      if (cancelled) return;
      if (saved) {
        setEmail((cur) => (cur === '' ? saved : cur));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 인증 완료(currentUserId 도착) 시 자동으로 이전 화면으로 복귀.
  useEffect(() => {
    if (currentUserId) {
      onBack();
    }
  }, [currentUserId, onBack]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const passwordConfirmValid =
    mode === 'signin' ? true : password === passwordConfirm;

  const canSubmit =
    !submitting && emailValid && passwordValid && passwordConfirmValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setHint(null);
    setVerifyNotice(false);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const res = await signUpWithEmail({
          email: email.trim(),
          password,
        });
        if (!res.ok) {
          setHint('가입을 마칠 수 없었어요. 잠시 후 다시 시도해 주세요.');
          return;
        }
        // 이메일만 기기에 저장 (비밀번호는 OS Keychain / Password Manager 가 담당).
        void setLastLoginEmail(email);

        const { session, kind } = res.data;
        if (session) {
          // session 즉시 발급 — useEffect 가 자동 복귀 처리.
          return;
        }
        switch (kind) {
          case 'created':
            setVerifyNotice(true);
            setHint('인증 메일을 보냈어요. 메일함에서 확인해 주세요.');
            break;
          case 'unverified_resent':
            setVerifyNotice(true);
            setHint('아직 이메일 인증이 완료되지 않았어요. 인증 메일을 다시 보냈어요.');
            break;
          case 'unverified_resend_failed':
            setVerifyNotice(true);
            setHint('인증 메일을 바로 다시 보낼 수 없어요. 잠시 후 다시 시도해 주세요.');
            break;
          case 'already_registered':
            setHint('이미 가입된 이메일이에요. 로그인으로 들어와 주세요.');
            break;
        }
      } else {
        const res = await signInWithEmail({
          email: email.trim(),
          password,
        });
        if (!res.ok) {
          setHint('이메일이나 비밀번호를 다시 확인해 주세요.');
          return;
        }
        void setLastLoginEmail(email);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    const res = await resendEmailVerification(email.trim());
    if (res.ok) {
      setHint('인증 메일을 다시 보냈어요.');
    } else {
      setHint('지금은 메일 재전송이 어려워요.');
    }
  };

  return (
    <View style={styles.safe}>
      {/* BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음. */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
          {/* 주 동선 — Apple / Google / Kakao */}
          {isAppleAuthSupported ? (
            <Pressable
              onPress={() => runOAuth('apple', signInWithApple)}
              disabled={!!oauthBusy}
              style={({ pressed }) => [
                styles.oauthBtn,
                styles.oauthBtnApple,
                pressed && styles.pressed,
                oauthBusy && oauthBusy !== 'apple' && styles.secondaryBtnDisabled,
              ]}
            >
              <View style={styles.oauthContent}>
                <View style={styles.oauthIconSlot}>
                  <Image
                    source={require('./assets/auth/apple-logo-white.png')}
                    style={styles.oauthIconImage}
                  />
                </View>
                <View
                  style={[styles.oauthDivider, styles.oauthDividerLight]}
                />
                <Text style={[styles.oauthBtnText, styles.oauthBtnTextLight]}>
                  Apple 아이디로 시작하기
                </Text>
              </View>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => runOAuth('google', signInWithGoogle)}
            disabled={!!oauthBusy}
            style={({ pressed }) => [
              styles.oauthBtn,
              styles.oauthBtnGoogle,
              pressed && styles.pressed,
              oauthBusy && oauthBusy !== 'google' && styles.secondaryBtnDisabled,
            ]}
          >
            <View style={styles.oauthContent}>
              <View style={styles.oauthIconSlot}>
                <Image
                  source={require('./assets/auth/google-g-logo.png')}
                  style={[styles.oauthIconImage, styles.oauthIconImageGoogle]}
                />
              </View>
              <View style={[styles.oauthDivider, styles.oauthDividerDark]} />
              <Text style={[styles.oauthBtnText, styles.oauthBtnTextDark]}>
                Google 아이디로 시작하기
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => runOAuth('kakao', signInWithKakao)}
            disabled={!!oauthBusy}
            style={({ pressed }) => [
              styles.oauthBtn,
              styles.oauthBtnKakao,
              pressed && styles.pressed,
              oauthBusy && oauthBusy !== 'kakao' && styles.secondaryBtnDisabled,
            ]}
          >
            <View style={styles.oauthContent}>
              <View style={styles.oauthIconSlot}>
                <Image
                  source={require('./assets/auth/kakao-symbol.jpg')}
                  style={styles.oauthIconImage}
                />
              </View>
              <View style={[styles.oauthDivider, styles.oauthDividerDark]} />
              <Text style={[styles.oauthBtnText, styles.oauthBtnTextKakao]}>
                Kakao 아이디로 시작하기
              </Text>
            </View>
          </Pressable>

          {/* 보조 동선 — 이메일 */}
          <View style={[styles.section, styles.emailLeadSection]}>
            <Text style={styles.label}>이메일로 시작하기</Text>
            <TextInput
              ref={emailInputRef}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (hint) setHint(null);
              }}
              placeholder="name@example.com"
              placeholderTextColor={PALETTE.textMuted}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              importantForAutofill="yes"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              ref={passwordInputRef}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (hint) setHint(null);
              }}
              placeholder="8자 이상"
              placeholderTextColor={PALETTE.textMuted}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              importantForAutofill="yes"
              passwordRules={
                mode === 'signup'
                  ? 'minlength: 8; required: lower; required: upper; required: digit;'
                  : undefined
              }
              returnKeyType={mode === 'signup' ? 'next' : 'done'}
              blurOnSubmit={mode === 'signin'}
              onSubmitEditing={() => {
                if (mode === 'signup') {
                  passwordConfirmInputRef.current?.focus();
                } else {
                  void handleSubmit();
                }
              }}
            />
          </View>

          {mode === 'signup' ? (
            <View style={styles.section}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                ref={passwordConfirmInputRef}
                value={passwordConfirm}
                onChangeText={(v) => {
                  setPasswordConfirm(v);
                  if (hint) setHint(null);
                }}
                placeholder="다시 한 번 입력"
                placeholderTextColor={PALETTE.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="yes"
                returnKeyType="done"
                onSubmitEditing={() => {
                  void handleSubmit();
                }}
              />
              {password.length > 0 &&
              passwordConfirm.length > 0 &&
              password !== passwordConfirm ? (
                <Text style={styles.hint}>비밀번호가 서로 달라요.</Text>
              ) : null}
            </View>
          ) : null}

          {hint ? <Text style={styles.hintAccent}>· {hint}</Text> : null}

          {verifyNotice ? (
            <View style={styles.verifyBlock}>
              <Text style={styles.verifyText}>
                인증 메일을 보냈어요. 메일함을 확인한 뒤 다시 로그인해 주세요.
              </Text>
              <Pressable
                onPress={handleResend}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.resendBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.resendBtnText}>인증 메일 다시 보내기</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {!keyboardVisible ? (
          <View style={bottomBarStyles.bar}>
            <SizeButtons
              textSizeStep={textSizeStep}
              onChangeTextSize={onChangeTextSize}
            />
            <NavButton position="right" onPress={onBack} icon="←" />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

function createAuthStyles(scale: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: PALETTE.bg },
    kav: { flex: 1 },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      // 상단 로고 아래로 약 2cm 여백.
      paddingTop: 76,
      paddingBottom: 8,
    },
    title: {
      color: PALETTE.labelAccent,
      fontSize: 15 * scale,
      lineHeight: 22 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
      marginBottom: 18,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 16,
    },
    tab: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    tabActive: {
      borderColor: PALETTE.labelAccent,
    },
    tabText: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    tabTextActive: {
      color: PALETTE.labelAccent,
      fontWeight: '500',
    },
    section: {
      marginBottom: 12,
    },
    // 첫 이메일 입력 section — OAuth 버튼 그룹 아래 약 1cm 여백.
    emailLeadSection: {
      marginTop: 36,
    },
    label: {
      color: PALETTE.labelAccent,
      fontSize: 10 * scale,
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    input: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 38,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    hint: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      marginTop: 4,
      opacity: 0.8,
    },
    hintAccent: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
      marginBottom: 8,
    },
    verifyBlock: {
      marginBottom: 12,
    },
    verifyText: {
      color: '#FFFFFF',
      fontSize: 12 * scale,
      lineHeight: 18 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
      marginBottom: 8,
    },
    resendBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
    },
    resendBtnText: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    // 주 동선 — 각 OAuth provider 공식 톤. 좌측 고정 아이콘 + 중앙 정렬 텍스트.
    // 주 동선 — 아이콘 + 세로 구분선 + 텍스트가 row 그룹으로 묶여 좌측 정렬.
    oauthBtn: {
      marginBottom: 4,
      height: 42,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    oauthContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 13,
      gap: 10,
    },
    oauthIconSlot: {
      width: 31,
      alignItems: 'center',
      justifyContent: 'center',
    },
    oauthIconImage: {
      width: 27,
      height: 27,
      resizeMode: 'contain',
    },
    // Google 만 10% 더 크게.
    oauthIconImageGoogle: {
      width: 30,
      height: 30,
    },
    oauthDivider: {
      width: 1,
      height: 20,
    },
    oauthDividerLight: {
      backgroundColor: 'rgba(255,255,255,0.28)',
    },
    oauthDividerDark: {
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    // Apple — 검정 배경, 흰 텍스트, 얇은 흰 경계.
    oauthBtnApple: {
      backgroundColor: '#000000',
      borderColor: 'rgba(255,255,255,0.35)',
      borderWidth: 1,
    },
    // Google — 흰 배경, 어두운 텍스트, 얇은 회색 경계.
    oauthBtnGoogle: {
      backgroundColor: '#FFFFFF',
      borderColor: '#DADCE0',
      borderWidth: 1,
    },
    // Kakao — 카카오 옐로, 진한 텍스트.
    oauthBtnKakao: {
      backgroundColor: '#FEE500',
      borderColor: '#FEE500',
    },
    oauthBtnText: {
      fontSize: 12 * scale,
      fontWeight: '700',
      letterSpacing: 0.3,
      textAlign: 'left',
    },
    oauthBtnTextLight: {
      color: '#FFFFFF',
    },
    oauthBtnTextDark: {
      color: '#3C4043',
    },
    oauthBtnTextKakao: {
      color: '#191919',
    },
    // OAuth 와 이메일 폼 사이 구분 — 가는 라인 + "또는 이메일로" 텍스트.
    dividerWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 14,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerLabel: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.4,
      marginHorizontal: 10,
    },
    // 보조 동선 — 이메일 계속하기 버튼은 더 작고 muted.
    secondaryBtn: {
      marginTop: 4,
      paddingVertical: 8,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.18)',
      backgroundColor: 'transparent',
    },
    secondaryBtnDisabled: {
      opacity: 0.4,
    },
    secondaryBtnText: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.4,
    },
    secondaryBtnTextDisabled: {
      color: PALETTE.textMuted,
    },
    pressed: {
      opacity: 0.5,
    },
  });
}

function ProfileSetupScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  myConversations,
  onBack,
  onHome,
  onOpenConversation,
  onOpenAuth,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  myConversations: DbConversation[];
  onBack: () => void;
  onHome: () => void;
  onOpenConversation: (conversationId: string) => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}) {
  const currentUserId = useCurrentUserId();
  const styles = useMemo(() => createProfileSetupStyles(scale), [scale]);
  const [nickname, setNickname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  // 1차 배포 정책: 한국어만 지원. 다른 언어 선택 시 실제 변경은 막고, 짧은 안내만 표시한다.
  // 추후 다국어 인프라가 붙으면 이 플래그와 onPress 분기를 제거하면 된다.
  const [languageNotice, setLanguageNotice] = useState(false);
  const [occupation, setOccupation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // 프로필 화면 모드.
  //   'create' — 프로필 row 없음 또는 display_name 없음. 입력 활성, 버튼 "저장".
  //   'view'   — 프로필 저장 완료. 입력 비활성, 버튼 "수정".
  //   'edit'   — 사용자가 "수정" 탭함. 입력 활성, 버튼 "저장".
  type ProfileMode = 'create' | 'view' | 'edit';
  const [profileMode, setProfileMode] = useState<ProfileMode>('create');
  const [openDropdown, setOpenDropdown] = useState<
    | 'language'
    | 'gender'
    | 'region'
    | 'occupation'
    | 'convList'
    | null
  >(null);

  // 마운트 시 user_profiles 에서 기존 값을 1회 로드 + 모드 결정.
  // row 없음 또는 display_name 비어 있으면 'create', 있으면 'view'.
  useEffect(() => {
    if (!currentUserId) {
      setProfileMode('create');
      return;
    }
    let cancelled = false;
    void getProfileByUserId(currentUserId).then((row) => {
      if (cancelled) return;
      const trimmedName = (row?.display_name ?? '').trim();
      if (row) {
        setNickname((cur) => (cur === '' ? row.display_name ?? '' : cur));
        setGender((cur) => cur ?? (row.gender ?? null));
        setRegion((cur) => cur ?? (row.region ?? null));
        setBirthdate((cur) =>
          cur === '' && row.birth_year ? String(row.birth_year) : cur,
        );
      }
      setProfileMode(trimmedName.length > 0 ? 'view' : 'create');
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);
  const toggleDropdown = (
    key:
      | 'language'
      | 'gender'
      | 'region'
      | 'occupation'
      | 'convList',
  ) => setOpenDropdown((prev) => (prev === key ? null : key));
  const [removedConvIds, setRemovedConvIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSave = async () => {
    if (!currentUserId) {
      Alert.alert(
        '잠시만요',
        '로그인 또는 회원가입 후 프로필을 저장할 수 있어요.',
      );
      return;
    }
    if (saving) return;
    // birthdate 입력에서 연도 4자리만 추출 (YYYY 또는 YYYY.MM.DD 등 어떤 포맷이든 첫 4자리).
    const yearMatch = birthdate.match(/^(\d{4})/);
    const birthYear = yearMatch ? Number(yearMatch[1]) : null;

    setSaving(true);
    try {
      const trimmedNick = nickname.trim();
      const result = await saveProfileRemote(currentUserId, {
        display_name: trimmedNick.length > 0 ? trimmedNick : null,
        gender,
        birth_year: birthYear,
        region,
      });
      if (!result.ok) {
        // 운영 환경에서도 사용자가 원인 파악 가능하도록 정확한 메시지 표시.
        const detail = result.errorMessage ?? '알 수 없는 오류';
        const code = result.errorCode ? ` (코드 ${result.errorCode})` : '';
        Alert.alert('프로필 저장 실패', `${detail}${code}`);
        logger.warn('profile save failed (shown to user)', {
          userId: currentUserId,
          code: result.errorCode,
          message: result.errorMessage,
        });
        return;
      }
      logger.info('profile saved ok', {
        userId: currentUserId,
        hasRow: !!result.data,
      });
      // 저장 성공 → 'view' 모드로 전환. 화면 떠나지 않고 같은 화면에서 비활성 상태로 유지.
      setProfileMode('view');
      Alert.alert('저장 완료', '프로필이 저장되었어요.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnterEditMode = () => {
    setProfileMode('edit');
  };

  // 인증 사용자가 참여 중인 실제 1:1 대화. SEED_CONVERSATIONS 는 사용하지 않는다.
  const conversationList = useMemo(() => {
    if (!currentUserId) return [];
    return [...myConversations]
      .map((c) => {
        const otherId =
          c.user_a_id === currentUserId ? c.user_b_id : c.user_a_id;
        return {
          conv: c,
          otherId,
          user: USER_MAP[otherId] as SeedUser | undefined,
        };
      })
      .sort((a, b) => {
        const av = a.conv.last_message_at ?? a.conv.created_at;
        const bv = b.conv.last_message_at ?? b.conv.created_at;
        return bv.localeCompare(av);
      });
  }, [myConversations, currentUserId]);

  const visibleConvList = useMemo(
    () => conversationList.filter(({ conv }) => !removedConvIds.has(conv.id)),
    [conversationList, removedConvIds],
  );

  const handleRemoveConv = (convId: string) => {
    setRemovedConvIds((prev) => {
      const next = new Set(prev);
      next.add(convId);
      return next;
    });
  };

  const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}.${day}`;
  };

  const handleDeleteAccount = () => {
    if (!currentUserId) {
      Alert.alert('잠시만요', '먼저 로그인해 주세요.');
      return;
    }
    Alert.alert(
      '계정을 삭제할까요?',
      '계정 정보는 삭제되지만, 작성한 글과 답글은 유지될 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccountRemote();
            if (!res.ok) {
              Alert.alert(
                '계정 삭제 실패',
                `${res.errorMessage ?? '알 수 없는 오류'}${
                  res.errorCode ? ` (${res.errorCode})` : ''
                }`,
              );
              return;
            }
            // 세션 종료 — onAuthStateChange 가 currentUserId 를 null 로 떨어뜨리고
            // AppShell 의 다른 cascade(localPosts/Replies/blockedIds/myProfile*) 가 자동 정리.
            await signOutRemote();
            Alert.alert('계정 삭제 완료', '계정이 삭제되었어요.', [
              { text: '확인', onPress: () => onBack() },
            ]);
          },
        },
      ],
    );
  };

  const openLegal = (url: string) => {
    void Linking.openURL(url).catch((err) => {
      logger.warn('openURL failed', { url, message: String(err) });
      Alert.alert('링크 열기 실패', '브라우저를 여는 데 실패했어요.');
    });
  };

  return (
    <View style={styles.safe}>
      {/*
        BrandHeader 는 AppShell 글로벌 헤더에서 단일 mount — 화면별 헤더 없음.
        프로필 화면의 우측 슬롯(로그인/회원가입/로그아웃) 도 AppShell 에서 route==='profile' 일 때
        headerRightSlot 으로 직접 렌더한다.
      */}
      {/*
        ProfileSetupScreen 은 입력 영역이 짧고 화면 하단 bottomBar 가 키보드 위로 따라
        올라갈 필요가 없어 KeyboardAvoidingView 를 두지 않는다. iOS padding behavior 가
        화면 전환 시 safe area 를 다시 잡으며 튀어 보이던 현상도 같이 사라진다.
      */}
      <View style={styles.kav}>
        {/*
          content 는 항상 normal pointer 흐름. 입력 그룹만 별도 wrapper(inputArea) 로 묶어
          'view' 모드일 때 그쪽에만 pointerEvents='none' 을 적용한다. 그러면 footer/bottomBar
          가 영향을 받지 않고, content 자체의 레이아웃도 안정적으로 유지된다(전환 튐 방지).
        */}
        <View style={styles.content}>
          <View pointerEvents={profileMode === 'view' ? 'none' : 'auto'}>
          <View
            style={[
              styles.row50,
              openDropdown === 'language' && styles.row50Raised,
            ]}
          >
            <View style={styles.half}>
              <Text style={styles.label}>이름(닉네임)</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="탭해서 입력"
                placeholderTextColor={PALETTE.textMuted}
                style={styles.input}
                maxLength={20}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>언어</Text>
              <View
                style={[
                  styles.dropdownAnchor,
                  openDropdown === 'language' && styles.dropdownAnchorOpen,
                ]}
              >
                <Pressable
                  onPress={() => toggleDropdown('language')}
                  style={({ pressed }) => [
                    styles.selectInput,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      !language && styles.selectPlaceholder,
                    ]}
                  >
                    {PROFILE_LANGUAGE_OPTIONS.find((o) => o.code === language)
                      ?.label ?? '선택'}
                  </Text>
                  <Text style={styles.selectChevron}>
                    {openDropdown === 'language' ? '⌃' : '›'}
                  </Text>
                </Pressable>
                {openDropdown === 'language' ? (
                  <View style={styles.dropdownOverlay}>
                    {PROFILE_LANGUAGE_OPTIONS.map((o) => (
                      <Pressable
                        key={o.code}
                        onPress={() => {
                          // 1차 배포는 한국어만. 다른 언어를 누르면 실제 선택은 적용하지 않고
                          // 짧은 안내만 표시. UI/옵션 자체는 그대로 두어 다국어 인프라 도입 이후
                          // 그대로 활성화 가능하게 한다.
                          if (o.code === 'ko') {
                            setLanguage(o.code);
                            setLanguageNotice(false);
                          } else {
                            setLanguageNotice(true);
                          }
                          setOpenDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.dropdownRow,
                          pressed && styles.dropdownRowPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownText,
                            language === o.code && styles.dropdownTextSel,
                          ]}
                        >
                          {o.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {languageNotice ? (
                  <Text style={styles.hint}>· 추후 업데이트될 예정입니다</Text>
                ) : null}
              </View>
            </View>
          </View>


          <View
            style={[
              styles.row50,
              openDropdown === 'gender' && styles.row50Raised,
            ]}
          >
            <View style={styles.half}>
              <Text style={styles.label}>성별</Text>
              <View
                style={[
                  styles.dropdownAnchor,
                  openDropdown === 'gender' && styles.dropdownAnchorOpen,
                ]}
              >
                <Pressable
                  onPress={() => toggleDropdown('gender')}
                  style={({ pressed }) => [
                    styles.selectInput,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      !gender && styles.selectPlaceholder,
                    ]}
                  >
                    {gender === 'male'
                      ? '남성'
                      : gender === 'female'
                      ? '여성'
                      : '선택'}
                  </Text>
                  <Text style={styles.selectChevron}>
                    {openDropdown === 'gender' ? '⌃' : '›'}
                  </Text>
                </Pressable>
                {openDropdown === 'gender' ? (
                  <View style={styles.dropdownOverlay}>
                    {[
                      { code: 'male' as const, label: '남성' },
                      { code: 'female' as const, label: '여성' },
                    ].map((o) => (
                      <Pressable
                        key={o.code}
                        onPress={() => {
                          setGender(o.code);
                          setOpenDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.dropdownRow,
                          pressed && styles.dropdownRowPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownText,
                            gender === o.code && styles.dropdownTextSel,
                          ]}
                        >
                          {o.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>생년월일</Text>
              <TextInput
                value={birthdate}
                onChangeText={setBirthdate}
                placeholder="YYYYMMDD"
                placeholderTextColor={PALETTE.textMuted}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={8}
              />
              <Text style={styles.hint}>· 허락 이후 공개됩니다</Text>
            </View>
          </View>

          <View
            style={[
              styles.row50,
              (openDropdown === 'region' || openDropdown === 'occupation') &&
                styles.row50Raised,
            ]}
          >
            <View style={styles.half}>
              <Text style={styles.label}>지역</Text>
              <View
                style={[
                  styles.dropdownAnchor,
                  openDropdown === 'region' && styles.dropdownAnchorOpen,
                ]}
              >
                <Pressable
                  onPress={() => toggleDropdown('region')}
                  style={({ pressed }) => [
                    styles.selectInput,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      !region && styles.selectPlaceholder,
                    ]}
                  >
                    {region ?? '선택'}
                  </Text>
                  <Text style={styles.selectChevron}>
                    {openDropdown === 'region' ? '⌃' : '›'}
                  </Text>
                </Pressable>
                {openDropdown === 'region' ? (
                  <View
                    style={[styles.dropdownOverlay, styles.dropdownOverlayGrid]}
                  >
                    {PROFILE_REGION_OPTIONS.map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => {
                          setRegion(r);
                          setOpenDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.dropdownRow,
                          styles.dropdownRowHalf,
                          pressed && styles.dropdownRowPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownText,
                            region === r && styles.dropdownTextSel,
                          ]}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>· 허락 이후 공개됩니다</Text>
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>직업</Text>
              <View
                style={[
                  styles.dropdownAnchor,
                  openDropdown === 'occupation' && styles.dropdownAnchorOpen,
                ]}
              >
                <Pressable
                  onPress={() => toggleDropdown('occupation')}
                  style={({ pressed }) => [
                    styles.selectInput,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectText,
                      !occupation && styles.selectPlaceholder,
                    ]}
                  >
                    {occupation ?? '선택'}
                  </Text>
                  <Text style={styles.selectChevron}>
                    {openDropdown === 'occupation' ? '⌃' : '›'}
                  </Text>
                </Pressable>
                {openDropdown === 'occupation' ? (
                  <View style={styles.dropdownOverlay}>
                    {PROFILE_OCCUPATION_OPTIONS.map((o) => (
                      <Pressable
                        key={o}
                        onPress={() => {
                          setOccupation(o);
                          setOpenDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.dropdownRow,
                          pressed && styles.dropdownRowPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownText,
                            occupation === o && styles.dropdownTextSel,
                          ]}
                        >
                          {o}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>· 허락 이후 공개됩니다</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>대화 리스트</Text>
            <View>
              <Pressable
                onPress={() => toggleDropdown('convList')}
                style={({ pressed }) => [
                  styles.selectInput,
                  openDropdown === 'convList' && styles.selectInputOpenBottom,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.selectText,
                    visibleConvList.length === 0 && styles.selectPlaceholder,
                  ]}
                >
                  {visibleConvList.length === 0
                    ? '없음'
                    : `${visibleConvList.length}명`}
                </Text>
                <Text style={styles.selectChevron}>
                  {openDropdown === 'convList' ? '⌃' : '›'}
                </Text>
              </Pressable>
              {openDropdown === 'convList' ? (
                <View style={styles.convListInline}>
                  {visibleConvList.length === 0 ? (
                    <Text style={styles.convEmpty}>
                      아직 이어지고 있는 대화가 없어요.
                    </Text>
                  ) : (
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {visibleConvList.map(({ conv, user }, idx) => {
                        const timeIso = conv.last_message_at ?? conv.created_at;
                        return (
                          <Pressable
                            key={conv.id}
                            onPress={() => {
                              setOpenDropdown(null);
                              onOpenConversation(conv.id);
                            }}
                            style={({ pressed }) => [
                              styles.convListRow,
                              idx === visibleConvList.length - 1 &&
                                styles.convListRowLast,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={styles.convListName} numberOfLines={1}>
                              {user?.nickname ?? '익명'}
                            </Text>
                            <Text style={styles.convListTime}>
                              {formatShortDate(timeIso)}
                            </Text>
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                handleRemoveConv(conv.id);
                              }}
                              hitSlop={8}
                              style={({ pressed }) => [
                                styles.convRemoveBtn,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={styles.convRemoveIcon}>×</Text>
                            </Pressable>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          </View>
          {/*
            inputArea wrapper 가 끝났다. legalFooter 는 content 안 마지막에 위치 —
            footer 가 content 안 normal flow 에 있어 전환 시 레이아웃 흔들림이 없다.
            footer 의 Pressable 들은 inputArea 바깥이라 pointerEvents 차단을 받지 않는다.
          */}
          <View style={styles.legalFooter}>
            <Pressable
              onPress={() => openLegal(LEGAL_URLS.terms)}
              hitSlop={6}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.legalLink}>이용약관</Text>
            </Pressable>
            <Text style={styles.legalDot}> · </Text>
            <Pressable
              onPress={() => openLegal(LEGAL_URLS.privacy)}
              hitSlop={6}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.legalLink}>개인정보 처리방침</Text>
            </Pressable>
            {currentUserId ? (
              <>
                <Text style={styles.legalDot}> · </Text>
                <Pressable
                  onPress={handleDeleteAccount}
                  hitSlop={6}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.legalLink}>계정 삭제</Text>
                </Pressable>
              </>
            ) : null}
          </View>

        </View>

        {keyboardVisible ? (
          <View style={styles.kbToolbar}>
            <Pressable
              onPress={Keyboard.dismiss}
              style={({ pressed }) => [
                styles.kbCloseBtn,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.kbCloseCircle}>
                <Text style={styles.kbCloseIcon}>×</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={bottomBarStyles.bar}>
            <SizeButtons
              textSizeStep={textSizeStep}
              onChangeTextSize={onChangeTextSize}
            />
            <Pressable
              onPress={() => {
                if (saving) return;
                if (profileMode === 'view') {
                  handleEnterEditMode();
                } else {
                  void handleSave();
                }
              }}
              hitSlop={8}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveBtn,
                saving && { opacity: 0.5 },
                pressed && !saving && styles.pressed,
              ]}
            >
              <Text style={styles.saveBtnText}>
                {saving
                  ? '저장 중…'
                  : profileMode === 'view'
                    ? '수정'
                    : '저장'}
              </Text>
            </Pressable>
            <NavButton position="right" onPress={onBack} icon="←" />
          </View>
        )}
      </View>
    </View>
  );
}

function createProfileSetupStyles(scale: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: PALETTE.bg },
    kav: { flex: 1 },
    // BrandHeader 우측 슬롯에 들어가는 작은 텍스트 버튼.
    // 로고와 같은 row 의 alignItems: center 기준으로 baseline 정렬됨 — 별도 margin 불필요.
    headerActionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerAction: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    headerActionPressed: {
      opacity: 0.5,
    },
    headerActionText: {
      color: PALETTE.labelAccent,
      fontSize: 11 * scale,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    legalFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 24,
      paddingBottom: 12,
    },
    legalLink: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      textDecorationLine: 'underline',
      textDecorationColor: 'rgba(255,255,255,0.2)',
    },
    legalLinkDestructive: {
      color: '#c0837a',
      fontSize: 10 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      textDecorationLine: 'underline',
      textDecorationColor: 'rgba(192,131,122,0.3)',
    },
    legalDot: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '300',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      // 헤더(로고/로그아웃) 와 프로필 본문 사이 시각적 여백 약 1cm.
      paddingTop: 46,
      paddingBottom: 8,
    },
    section: {
      marginBottom: 10,
    },
    label: {
      color: PALETTE.labelAccent,
      fontSize: 10 * scale,
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    input: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 38,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    pressed: {
      opacity: 0.6,
    },
    selectInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minHeight: 38,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    selectText: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    selectPlaceholder: {
      color: PALETTE.textMuted,
    },
    selectChevron: {
      color: PALETTE.chevron,
      fontSize: 16,
      fontWeight: '300',
    },
    dropdownAnchor: {
      position: 'relative',
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backgroundColor: PALETTE.card,
    },
    chipPressed: {
      opacity: 0.6,
    },
    chipSelected: {
      borderColor: PALETTE.labelAccent,
      backgroundColor: 'transparent',
    },
    chipText: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    chipTextSelected: {
      color: PALETTE.labelAccent,
      fontWeight: '500',
    },
    dropdownAnchorOpen: {
      zIndex: 100,
      elevation: 12,
    },
    dropdownOverlay: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: PALETTE.card,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      overflow: 'hidden',
      zIndex: 200,
      elevation: 14,
    },
    dropdownOverlayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dropdownRowHalf: {
      width: '50%',
    },
    // 대화 리스트 전용 — 별도 overlay 가 아니라 selectInput 의 인라인 연장.
    selectInputOpenBottom: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottomWidth: 0,
    },
    convListInline: {
      backgroundColor: PALETTE.card,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      overflow: 'hidden',
      maxHeight: 200,
    },
    dropdownRow: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dropdownRowPressed: {
      backgroundColor: PALETTE.cardPressed,
    },
    dropdownText: {
      color: '#FFFFFF',
      fontSize: 12 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    dropdownTextSel: {
      color: PALETTE.labelAccent,
      fontWeight: '500',
    },
    hint: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      marginTop: 4,
      opacity: 0.8,
    },
    saveBtn: {
      position: 'absolute',
      bottom: BOTTOM_BUTTON_OFFSET,
      left: '50%',
      transform: [{ translateX: -55 }],
      width: 110,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
      backgroundColor: 'transparent',
    },
    saveBtnText: {
      color: PALETTE.inviteAccent,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.5,
    },
    row50: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    row50Raised: {
      zIndex: 100,
      elevation: 12,
    },
    half: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
    },
    sectionRaised: {
      zIndex: 100,
      elevation: 12,
    },
    convListOverlay: {
      maxHeight: 200,
    },
    convListRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    convListRowLast: {
      borderBottomWidth: 0,
    },
    convListName: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '400',
      letterSpacing: 0.2,
      flex: 1,
    },
    convListTime: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
      marginRight: 10,
    },
    convRemoveBtn: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    convRemoveIcon: {
      color: PALETTE.textMuted,
      fontSize: 18,
      lineHeight: 20,
      fontWeight: '300',
    },
    convEmpty: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      paddingHorizontal: 12,
      paddingVertical: 10,
      letterSpacing: 0.2,
    },
    kbToolbar: {
      height: 60,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      paddingHorizontal: 0,
      backgroundColor: PALETTE.bg,
    },
    kbCloseBtn: {
      paddingHorizontal: 16,
      paddingBottom: 6,
      height: 54,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    kbCloseCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: PALETTE.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kbCloseIcon: {
      color: '#FFFFFF',
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '400',
    },
  });
}

function MessageBubble({
  message,
  myId,
  styles,
  onDelete,
  onOpenImage,
}: {
  message: SeedMessage;
  myId: string | null;
  styles: ReturnType<typeof createConversationStyles>;
  onDelete?: () => void;
  onOpenImage?: (uri: string) => void;
}) {
  const isMine = message.senderId === myId;
  const author = USER_MAP[message.senderId];
  const nickname = author?.nickname ?? '';
  const bubbleBg =
    author?.gender === 'female' ? PALETTE.bubbleFemale : PALETTE.bubbleMale;

  // 말풍선 본체 — 텍스트/이미지/삭제 X. 좌·우 양쪽에서 공통으로 사용.
  const bubbleNode = (
    <View
      style={[
        message.imageUri ? styles.bubbleImageWrap : styles.bubble,
        message.imageUri ? null : { backgroundColor: bubbleBg },
        isMine ? styles.bubbleMine : styles.bubbleTheirs,
      ]}
    >
            {message.imageUri ? (
        <Pressable
          onPress={() => {
            if (message.imageUri) onOpenImage?.(message.imageUri);
          }}
          style={({ pressed }) => pressed && styles.imagePressed}
        >
          <Image
            source={{ uri: message.imageUri }}
            style={[
              styles.bubbleImage,
              {
                aspectRatio:
                  message.imageWidth && message.imageHeight
                    ? message.imageWidth / message.imageHeight
                    : 1,
              },
            ]}
            resizeMode="contain"
          />
          {/* 우측 하단 시간 + (본인 마지막 메시지면) 큰 빨간 × */}
          <View style={styles.bubbleImageOverlay} pointerEvents="box-none">
            <Text style={styles.bubbleImageTime}>
              {formatMessageTime(message.createdAt)}
            </Text>
            {onDelete ? (
              <Text
                onPress={onDelete}
                suppressHighlighting
                style={styles.bubbleImageDelete}
              >
                ×
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : (
        <Text style={styles.bubbleText}>
          {message.originalContent}
          {/* 본문 ↔ 시간 사이 NBSP — 한 토큰처럼 wrap. */}
          <Text style={styles.bubbleInlineTime}>
            {' ' + formatMessageTime(message.createdAt)}
          </Text>
          {/* 본인 마지막 메시지면 시간 옆 빨간 × — 삭제 가능 표시. */}
          {onDelete ? (
            <Text
              onPress={onDelete}
              suppressHighlighting
              style={styles.bubbleInlineDelete}
            >
              {'   ×'}
            </Text>
          ) : null}
        </Text>
      )}
    </View>
  );

  // 카톡 스타일:
  //   상대 메시지 — [아바타]  [이름 / 말풍선]  (좌측 정렬, 아바타는 상단 기준)
  //   내 메시지   — 말풍선만 (우측 정렬, 본인 아바타/이름 표시 X)
  if (isMine) {
    return (
      <View style={[styles.messageRow, styles.messageRowMine]}>
        {bubbleNode}
      </View>
    );
  }
  return (
    <View style={[styles.messageRow, styles.messageRowTheirs]}>
      <ProfileAvatar
        user={author}
        size={32}
        style={styles.sideAvatarLeft}
        unknown={isUnknownAuthorId(message.senderId, myId)}
      />
      <View style={styles.theirsColumn}>
        <Text style={styles.theirsName} numberOfLines={1}>
          {nickname}
        </Text>
        {bubbleNode}
      </View>
    </View>
  );
}

function NavButton({
  position,
  onPress,
  icon,
}: {
  position: 'left' | 'right';
  onPress: () => void;
  icon: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        navButtonStyles.base,
        position === 'left' ? navButtonStyles.left : navButtonStyles.right,
        pressed && navButtonStyles.pressed,
      ]}
    >
      <Text
        style={[
          navButtonStyles.icon,
          icon === '←' && navButtonStyles.iconBack,
        ]}
      >
        {icon}
      </Text>
    </Pressable>
  );
}

const bottomBarStyles = StyleSheet.create({
  bar: {
    height: BOTTOM_BAR_HEIGHT,
    backgroundColor: PALETTE.bg,
  },
});

const navButtonStyles = StyleSheet.create({
  base: {
    position: 'absolute',
    bottom: BOTTOM_BUTTON_OFFSET,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.settingsBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  left: { left: 20 },
  right: { right: 20 },
  pressed: { opacity: 0.6 },
  icon: {
    color: PALETTE.textCategory,
    fontSize: 16,
    fontWeight: '400',
  },
  iconBack: {
    fontSize: 18,
    marginTop: -2,
  },
});

function BrandHeader({
  onProfile,
  onLogo,
  bg,
  rightSlot,
}: {
  onProfile?: () => void;
  onLogo?: () => void;
  bg?: string;
  rightSlot?: ReactNode;
}) {
  // 로고는 메인(MainScreen)으로 안전 이동. 메인에서 onLogo 호출은 no-op 으로 둔다.
  return (
    <View
      style={[
        brandHeaderStyles.container,
        bg ? { backgroundColor: bg } : null,
      ]}
    >
      {onLogo ? (
        <Pressable
          onPress={onLogo}
          hitSlop={12}
          style={({ pressed }) => pressed && brandHeaderStyles.logoPressed}
        >
          <Text style={brandHeaderStyles.logo}>DULSAI</Text>
        </Pressable>
      ) : (
        <Text style={brandHeaderStyles.logo}>DULSAI</Text>
      )}
      {rightSlot !== undefined ? (
        rightSlot
      ) : onProfile ? (
        <Pressable
          onPress={onProfile}
          hitSlop={10}
          style={({ pressed }) => [
            brandHeaderStyles.profileButton,
            pressed && brandHeaderStyles.profileButtonPressed,
          ]}
        >
          <View style={brandHeaderStyles.profileIconWrap}>
            <View style={brandHeaderStyles.profileIconHead} />
            <View style={brandHeaderStyles.profileIconShoulders} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const brandHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 18,
    paddingHorizontal: 18,
    backgroundColor: PALETTE.bg,
  },
  logo: {
    color: PALETTE.brandRed,
    fontSize: 26,
    letterSpacing: 5,
    fontWeight: '400',
    textShadowColor: 'rgba(255, 71, 87, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logoPressed: {
    opacity: 0.6,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.buttonBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonPressed: {
    opacity: 0.6,
  },
  profileIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconHead: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
  },
  profileIconShoulders: {
    width: 13,
    height: 7,
    borderTopLeftRadius: 6.5,
    borderTopRightRadius: 6.5,
    backgroundColor: '#FFFFFF',
  },
});

function SizeButtons({
  textSizeStep,
  onChangeTextSize,
}: {
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
}) {
  const canDecrease = textSizeStep > 0;
  const canIncrease = textSizeStep < 3;
  return (
    <View style={sizeButtonsStyles.container}>
      <Pressable
        onPress={() => onChangeTextSize(-1)}
        disabled={!canDecrease}
        hitSlop={6}
        style={({ pressed }) => [
          sizeButtonsStyles.button,
          !canDecrease && sizeButtonsStyles.buttonDim,
          pressed && canDecrease && sizeButtonsStyles.buttonPressed,
        ]}
      >
        <Text
          style={[
            sizeButtonsStyles.text,
            !canDecrease && sizeButtonsStyles.textDim,
          ]}
        >
          −
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChangeTextSize(1)}
        disabled={!canIncrease}
        hitSlop={6}
        style={({ pressed }) => [
          sizeButtonsStyles.button,
          !canIncrease && sizeButtonsStyles.buttonDim,
          pressed && canIncrease && sizeButtonsStyles.buttonPressed,
        ]}
      >
        <Text
          style={[
            sizeButtonsStyles.text,
            !canIncrease && sizeButtonsStyles.textDim,
          ]}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}

const sizeButtonsStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_BUTTON_OFFSET,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.settingsBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  buttonDim: {
    backgroundColor: PALETTE.buttonBgDim,
    borderColor: '#332e29',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  text: {
    color: PALETTE.textCategory,
    fontSize: 18,
    fontWeight: '500',
    marginTop: -2,
  },
  textDim: {
    color: PALETTE.textMuted,
    opacity: 0.5,
  },
});

function createMainStyles(scale: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    promptArea: {
      paddingTop: 4,
      paddingBottom: 18,
      backgroundColor: PALETTE.bg,
    },
    prompt: {
      color: PALETTE.labelAccent,
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '400',
      letterSpacing: 0.5,
      paddingHorizontal: 26,
    },
    scrollContent: {
      paddingTop: 4,
      paddingBottom: SCROLL_BOTTOM_PADDING,
    },
    categoryList: {
      paddingHorizontal: 14,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: PALETTE.bg,
      borderRadius: 8,
      paddingVertical: 11 * scale,
      paddingHorizontal: 14,
      marginBottom: 4,
    },
    categoryItemPressed: {
      backgroundColor: PALETTE.cardPressed,
    },
    categoryText: {
      flex: 1,
      color: PALETTE.textCategory,
      fontSize: 15 * scale,
      lineHeight: 24 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      paddingRight: 12,
    },
    chevron: {
      color: PALETTE.chevron,
      fontSize: 22,
      fontWeight: '300',
      marginTop: -2,
    },
  });
}

function createCategoryStyles(scale: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    scrollFlex: {
      flex: 1,
    },
    titleArea: {
      paddingTop: 4,
      paddingBottom: 20,
      backgroundColor: PALETTE.bg,
    },
    categoryTitle: {
      color: '#FFFFFF',
      fontSize: 16 * scale,
      lineHeight: 25 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
      paddingHorizontal: 24,
    },
    scrollContent: {
      paddingTop: 0,
      paddingBottom: SCROLL_BOTTOM_PADDING,
    },
    postList: {
      paddingHorizontal: 14,
    },
    postCard: {
      backgroundColor: PALETTE.bg,
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    postCardPressed: {
      backgroundColor: PALETTE.cardPressed,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    profileIconSmall: {
      marginRight: 10,
    },
    authorName: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    authorTime: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      marginLeft: 8,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    postPreview: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    replyCount: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      letterSpacing: 0.3,
      marginRight: 4,
    },
    chevron: {
      color: PALETTE.chevron,
      fontSize: 15,
      fontWeight: '300',
    },
    emptyText: {
      color: PALETTE.textMuted,
      fontSize: 13 * scale,
      textAlign: 'center',
      paddingHorizontal: 32,
      marginTop: 48,
    },
    composeBtn: {
      position: 'absolute',
      bottom: BOTTOM_BUTTON_OFFSET,
      left: '50%',
      transform: [{ translateX: -55 }],
      width: 110,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
      backgroundColor: 'transparent',
    },
    composeBtnPressed: {
      opacity: 0.5,
    },
    composeBtnText: {
      color: PALETTE.inviteAccent,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.5,
    },
  });
}

function createPostDetailStyles(scale: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    scrollFlex: {
      flex: 1,
    },
    // 하단에 인라인 답글 입력창이 추가되어 마지막 답글이 가리지 않도록 padding 충분히 확보.
    scrollContent: {
      paddingTop: 8,
      paddingBottom: 24,
    },
    postSection: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 28,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    profileIcon: {
      marginRight: 12,
    },
    authorName: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    timeText: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      marginLeft: 10,
    },
    reportLink: {
      marginLeft: 'auto',
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    // 하단 인라인 답글 입력창. 채팅 입력처럼 텍스트 + 보내기.
    inlineReplyRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
      backgroundColor: PALETTE.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.06)',
    },
    inlineReplyInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.cardPressed,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      maxHeight: 120,
    },
    inlineReplySend: {
      alignSelf: 'flex-end',
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: PALETTE.cardPressed,
    },
    inlineReplySendText: {
      color: PALETTE.inviteAccent,
      fontSize: 13 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    inlineReplyHint: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      paddingHorizontal: 16,
      paddingTop: 6,
      opacity: 0.9,
    },
    // 답글 수정 모드 표시 — 입력창 위 작은 안내 줄 + 취소.
    inlineEditBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 2,
    },
    inlineEditBannerText: {
      color: PALETTE.labelAccent,
      fontSize: 11 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    inlineEditCancel: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      textDecorationLine: 'underline',
      textDecorationColor: 'rgba(255,255,255,0.2)',
    },
    reportLinkText: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      opacity: 0.6,
    },
    // 원글 작성자가 단 답글에 붙는 "작성자" 라벨 — 작고 옅게.
    authorBadge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: 'rgba(143, 217, 182, 0.15)',
      color: PALETTE.labelAccent,
      fontSize: 9 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
      overflow: 'hidden',
    },
    postBody: {
      color: '#FFFFFF',
      fontSize: 16 * scale,
      lineHeight: 26 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    repliesSection: {
      paddingTop: 24,
      paddingHorizontal: 24,
    },
    repliesHeader: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      letterSpacing: 1.5,
      marginBottom: 18,
      fontWeight: '300',
    },
    reply: {
      flexDirection: 'row',
      paddingBottom: 22,
    },
    replyIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    replyContent: {
      flex: 1,
    },
    replyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    replyAuthor: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    replyTime: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      marginLeft: 8,
    },
    replyText: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    invite: {
      marginTop: 14,
      paddingTop: 10,
      paddingBottom: 10,
      paddingHorizontal: 0,
      backgroundColor: PALETTE.bg,
    },
    inviteLabel: {
      color: PALETTE.inviteAccent,
      fontSize: 10 * scale,
      fontWeight: '400',
      letterSpacing: 1,
      marginBottom: 6,
      opacity: 0.85,
    },
    inviteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    inviteAvatar: {
      marginRight: 8,
    },
    inviteAuthor: {
      color: '#FFFFFF',
      fontSize: 12 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    inviteTime: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      marginLeft: 8,
    },
    inviteText: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    join: {
      marginTop: 12,
      paddingTop: 8,
      paddingBottom: 4,
    },
    joinLabel: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '400',
      letterSpacing: 1,
      marginBottom: 5,
      opacity: 0.8,
    },
    joinHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    joinAvatar: {
      marginRight: 8,
    },
    joinAuthor: {
      color: '#FFFFFF',
      fontSize: 12 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    joinTime: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      marginLeft: 8,
    },
    joinText: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    inviteCta: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
    },
    inviteCtaText: {
      color: PALETTE.inviteAccent,
      fontSize: 10 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    joinCta: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.border,
    },
    joinCtaText: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    continueCta: {
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
      backgroundColor: 'transparent',
    },
    continueCtaText: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    ctaPressed: {
      opacity: 0.5,
    },
    notFound: {
      color: PALETTE.textMuted,
      fontSize: 14 * scale,
      textAlign: 'center',
      paddingTop: 60,
    },
    composeBtn: {
      position: 'absolute',
      bottom: BOTTOM_BUTTON_OFFSET,
      left: '50%',
      transform: [{ translateX: -55 }],
      width: 110,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
      backgroundColor: 'transparent',
    },
    composeBtnPressed: {
      opacity: 0.5,
    },
    composeBtnText: {
      color: PALETTE.inviteAccent,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.5,
    },
    inviteActions: {
      marginTop: 4,
    },
    inviteActionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    inviteStatusHint: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
      marginTop: 4,
    },
  });
}


function createConversationStyles(scale: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    kav: {
      flex: 1,
    },
    scrollFlex: {
      flex: 1,
    },
    titleArea: {
      paddingTop: 4,
      paddingBottom: 14,
      paddingHorizontal: 24,
      backgroundColor: PALETTE.bg,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    titleLeft: {
      flex: 1,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 15 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    moreText: {
      color: PALETTE.textMuted,
      fontSize: 20,
      paddingHorizontal: 4,
      marginTop: -4,
    },
    morePressed: {
      opacity: 0.5,
    },
    messageList: {
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 10,
    },
    // 메시지 row.
    //   - 상대 메시지: [아바타] + [이름 / 말풍선] column (좌측 정렬)
    //   - 내 메시지: 말풍선만 (우측 정렬, 본인 아바타/이름 표시 X)
    // 아바타는 말풍선 상단과 baseline 을 맞추기 위해 alignItems 는 flex-start.
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: '100%',
      marginBottom: 10,
    },
    // 날짜 구분선 — 옅은 가로선 가운데에 "2026년 5월 18일" 한 줄.
    dateSeparator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    dateSepLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dateSepText: {
      marginHorizontal: 10,
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      fontWeight: '300',
      letterSpacing: 0.4,
      opacity: 0.7,
    },
    messageRowMine: {
      justifyContent: 'flex-end',
    },
    messageRowTheirs: {
      justifyContent: 'flex-start',
    },
    // 아바타와 [이름/말풍선] column 을 한 묶음으로 보이게 간격을 좁힌다.
    sideAvatarLeft: {
      marginRight: 4,
      marginTop: 2,
    },
    // 상대 메시지의 [이름 / 말풍선] 세로 묶음. 화면의 ~80% 까지 너비 허용.
    theirsColumn: {
      flexShrink: 1,
      maxWidth: '80%',
    },
    // 이름은 아바타 / 말풍선 흐름과 자연스럽게 이어지도록 margin 최소화.
    theirsName: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
      marginBottom: 2,
      marginLeft: 0,
    },
    // 본인 말풍선은 row 의 직접 자식이라 자체 maxWidth(80%) 가 들어간다(bubbleMine).
    // 상대 말풍선은 theirsColumn(maxWidth:80%) 안에 들어가므로 자체 maxWidth 제약 없이
    // 텍스트 길이만큼만 자라 — 짧은 문장이 불필요하게 wrap 되지 않는다.
    bubble: {
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: 12,
    },
    // 사진 메시지 wrapper — padding 없이 이미지가 자기 비율로 채운다.
    bubbleImageWrap: {
      maxWidth: '70%',
      borderRadius: 12,
      overflow: 'hidden',
    },
    // 사진 자체는 너비만 제한하고 높이는 inline aspectRatio 로 결정 (원본 비율 유지).
    bubbleImage: {
      width: 220,
    },
    imagePressed: {
      opacity: 0.85,
    },
    // 사진 전체보기 modal.
    viewerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.94)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewerImage: {
      width: '100%',
      height: '100%',
    },
    // [저장] [닫기] 우측 하단 row. 닫기가 더 오른쪽.
    viewerActions: {
      position: 'absolute',
      bottom: 38,
      right: 18,
      flexDirection: 'row',
      gap: 8,
    },
    viewerActionBtn: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    viewerActionText: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    // 사진 우측 하단 시간 + 삭제 X 묶음 (absolute row).
    bubbleImageOverlay: {
      position: 'absolute',
      right: 6,
      bottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bubbleImageTime: {
      color: '#FFFFFF',
      fontSize: 9 * scale,
      letterSpacing: -0.2,
      fontWeight: '400',
      backgroundColor: 'rgba(0,0,0,0.4)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 8,
      overflow: 'hidden',
    },
    // 사진 메시지의 큰 빨간 × — 본인 마지막 메시지에만 노출.
    bubbleImageDelete: {
      color: '#FF5A5F',
      fontSize: 22,
      fontWeight: '500',
      lineHeight: 24,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 3,
      paddingHorizontal: 4,
    },
    bubbleMine: {
      maxWidth: '80%',
      borderTopRightRadius: 4,
    },
    bubbleTheirs: {
      borderTopLeftRadius: 4,
    },
    bubbleText: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 19 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    // 시간은 본문 Text 안에 inline 으로 들어가서 마지막 줄 끝에 따라붙는다.
    // 본문과의 사이 공백은 NBSP 한 칸 + 음수 letterSpacing 으로 바짝 붙어 보인다.
    bubbleInlineTime: {
      color: 'rgba(255, 255, 255, 0.45)',
      fontSize: 9 * scale,
      letterSpacing: -0.2,
      fontWeight: '300',
    },
    // 텍스트 메시지의 inline 빨간 ×. 본인 마지막 메시지에만 시간 옆에 노출.
    // fontSize 가 본문(14)보다 크게(16) 잡혀 baseline 위 살짝 도드라진다.
    bubbleInlineDelete: {
      color: '#FF5A5F',
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: 0,
    },
    leaveRow: {
      paddingTop: 8,
      paddingBottom: 4,
      alignItems: 'center',
      backgroundColor: PALETTE.bg,
    },
    leaveButton: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.border,
      backgroundColor: PALETTE.card,
    },
    leaveText: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    leavePressed: {
      opacity: 0.6,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      backgroundColor: PALETTE.bg,
    },
    // 입력창 위 사진 미리보기 — 여러 장 가로 스크롤 + 각 X 로 개별 취소.
    attachPreviewScroll: {
      maxHeight: 92,
      backgroundColor: PALETTE.bg,
    },
    attachPreviewRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 8,
      gap: 8,
    },
    attachPreviewItem: {
      width: 72,
      height: 72,
    },
    attachPreviewImg: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: PALETTE.cardPressed,
    },
    attachPreviewClose: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    attachPreviewCloseIcon: {
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 14,
      fontWeight: '500',
    },
    // 입력창 왼쪽 + 버튼. 카톡식 복잡한 메뉴 없이 사진 한 장 보내는 동선만.
    attachBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: PALETTE.cardPressed,
      alignSelf: 'flex-end',
    },
    attachIcon: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '300',
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.cardPressed,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      maxHeight: 120,
    },
    sendButton: {
      alignSelf: 'flex-end',
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: PALETTE.cardPressed,
    },
    sendText: {
      color: PALETTE.inviteAccent,
      fontSize: 13 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    ctaPressed: {
      opacity: 0.5,
    },
    notFoundBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    notFoundText: {
      color: PALETTE.textMuted,
      fontSize: 14 * scale,
    },
  });
}
