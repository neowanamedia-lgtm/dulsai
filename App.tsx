import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
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

import {
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_POSTS,
  SEED_TRANSLATIONS,
  SEED_USERS,
  type ConversationInvite,
  type ConversationJoin,
  type DisclosureKind,
  type Language,
  type SeedConversation,
  type SeedMessage,
  type SeedPost,
  type SeedReply,
  type SeedTranslation,
  type SeedUser,
  type TranslationTargetType,
} from './seed/seed-content';

type Category = {
  id: string;
  labels: Record<Language, string>;
};

const CATEGORIES: Category[] = [
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
];

type TextSizeStep = 0 | 1 | 2 | 3;
type Route =
  | 'main'
  | 'category'
  | 'post'
  | 'profile'
  | 'conversation';

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

const CURRENT_USER_ID: string | null = 'm_01';

const DISCLOSURE_LABEL: Record<DisclosureKind, string> = {
  region: '지역',
  age: '나이',
  photo: '사진',
  contact: '연락처',
};

const DISCLOSURE_REQUEST_LINE: Record<DisclosureKind, string> = {
  region: '괜찮다면 서로 지역을 슬쩍 열어볼까요?',
  age: '괜찮으면 나이도 같이 알려줄까요?',
  photo: '사진도 공유해볼까요?',
  contact: '이제 연락처도 알려줄 수 있을까요?',
};

const DISCLOSURE_INFO_LINE: Record<DisclosureKind, string> = {
  region: '지역이 서로에게 열렸어요.',
  age: '나이가 서로에게 열렸어요.',
  photo: '사진이 서로에게 열렸어요.',
  contact: '연락처가 서로에게 열렸어요.',
};

const DISCLOSURE_ACCEPT_LINE = '좋아요. 천천히요.';
const DISCLOSURE_DECLINE_LINE = '조금 더 천천히 알아가고 싶어요.';

const STAGE_ORDER: DisclosureKind[] = ['region', 'age', 'photo', 'contact'];

function computeNextStage(messages: SeedMessage[]): DisclosureKind | null {
  const unresolved = messages.some(
    (m) =>
      m.kind === 'disclosure_request' &&
      !messages.some(
        (s) =>
          (s.kind === 'disclosure_accepted' ||
            s.kind === 'disclosure_declined') &&
          s.disclosureKind === m.disclosureKind,
      ),
  );
  if (unresolved) return null;
  const anyDeclined = messages.some((m) => m.kind === 'disclosure_declined');
  if (anyDeclined) return null;
  for (const stage of STAGE_ORDER) {
    const done = messages.some(
      (m) => m.kind === 'disclosure_info' && m.disclosureKind === stage,
    );
    if (!done) return stage;
  }
  return null;
}

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

const POSTS_BY_CATEGORY: Record<string, SeedPost[]> = SEED_POSTS.reduce(
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
}: {
  user: SeedUser | undefined;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
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

export default function App() {
  const [textSizeStep, setTextSizeStep] = useState<TextSizeStep>(0);
  const [route, setRoute] = useState<Route>('main');
  const [previousRoute, setPreviousRoute] = useState<Route>('main');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [deletedConversationIds, setDeletedConversationIds] = useState<string[]>([]);
  const [viewerLanguage, setViewerLanguage] = useState<Language>('ko');

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

  const openProfile = () => {
    setPreviousRoute(route);
    setRoute('profile');
  };


  const openConversation = (postId: string, rootCommentId: string) => {
    const existing = findConversation(postId, rootCommentId);
    if (existing) {
      if (deletedConversationIds.includes(existing.conversationId)) {
        Alert.alert('대화방', '이 대화는 이미 정리되었어요.');
        return;
      }
      setSelectedConversationId(existing.conversationId);
      setRoute('conversation');
    } else {
      // TODO: 대화방이 없으면 새로 생성한다 (postId + rootCommentId 기준 중복 방지)
      Alert.alert('대화방', '대화방 생성은 곧 추가됩니다.');
    }
  };

  const handleLeaveConversation = (convId: string) => {
    setDeletedConversationIds((prev) => [...prev, convId]);
    setSelectedConversationId(null);
    setRoute('post');
  };

  const goBack = () => {
    if (route === 'profile') setRoute(previousRoute);
    else if (route === 'conversation') setRoute('post');
    else if (route === 'post') setRoute('category');
    else setRoute('main');
  };


  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.bg} />
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
          onBack={goBack}
          onOpenPost={openPost}
          onOpenProfile={openProfile}
        />
      )}
      {route === 'post' && selectedPostId && (
        <PostDetailScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          postId={selectedPostId}
          viewerLanguage={viewerLanguage}
          onBack={goBack}
          onOpenProfile={openProfile}
          onOpenConversation={openConversation}
        />
      )}
      {route === 'conversation' && selectedConversationId && (
        <ConversationScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          conversationId={selectedConversationId}
          onBack={goBack}
          onOpenProfile={openProfile}
          onLeave={handleLeaveConversation}
        />
      )}
      {route === 'profile' && (
        <ProfileSetupScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          onBack={goBack}
        />
      )}
    </View>
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
    <SafeAreaView style={styles.safe}>
      <BrandHeader onProfile={onOpenProfile} />

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
    </SafeAreaView>
  );
}

function CategoryScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  categoryId,
  viewerLanguage,
  onBack,
  onOpenPost,
  onOpenProfile,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  categoryId: string;
  viewerLanguage: Language;
  onBack: () => void;
  onOpenPost: (postId: string) => void;
  onOpenProfile: () => void;
}) {
  const styles = useMemo(() => createCategoryStyles(scale), [scale]);
  const category = CATEGORY_MAP[categoryId];
  const categoryLabel = category
    ? category.labels[viewerLanguage] ?? category.labels.ko
    : '';
  const posts = useMemo(
    () =>
      (POSTS_BY_CATEGORY[categoryId] ?? []).filter((p) =>
        isPostVisibleIn(p, viewerLanguage),
      ),
    [categoryId, viewerLanguage],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader onProfile={onOpenProfile} />

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
            아직 이 카테고리에 남겨진 문장이 없어요.
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
                    />
                    <Text style={styles.authorName}>{author?.nickname ?? '익명'}</Text>
                    <Text style={styles.authorTime}>{relTime(post.createdAt)}</Text>
                    <View style={styles.headerRight}>
                      <Text style={styles.replyCount}>
                        답글 {post.replies.length}
                      </Text>
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
        <NavButton position="right" onPress={onBack} icon="←" />
      </View>
    </SafeAreaView>
  );
}

function PostDetailScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  postId,
  viewerLanguage,
  onBack,
  onOpenProfile,
  onOpenConversation,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  postId: string;
  viewerLanguage: Language;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenConversation: (postId: string, rootCommentId: string) => void;
}) {
  const styles = useMemo(() => createPostDetailStyles(scale), [scale]);
  const post = useMemo(() => {
    const found = SEED_POSTS.find((p) => p.postId === postId);
    if (!found) return undefined;
    if (!isPostVisibleIn(found, viewerLanguage)) return undefined;
    return found;
  }, [postId, viewerLanguage]);
  const visibleReplies = useMemo(
    () =>
      (post?.replies ?? []).filter((r) =>
        isReplyVisibleIn(r, viewerLanguage),
      ),
    [post, viewerLanguage],
  );

  const [localInvites, setLocalInvites] = useState<
    Record<string, ConversationInvite>
  >({});

  const handleSendInvite = (replyId: string) => {
    const newInvite: ConversationInvite = {
      inviteId: `local_inv_${Date.now()}`,
      userId: CURRENT_USER_ID ?? 'm_01',
      originalLanguage: 'ko',
      originalContent:
        '괜찮다면 이 문장을 계기로 조금 더 천천히 이야기 나눠보고 싶어요.',
      createdAt: new Date().toISOString(),
      isSample: true,
    };
    setLocalInvites((prev) => ({ ...prev, [replyId]: newInvite }));
  };

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

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader onProfile={onOpenProfile} />
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
                />
                <Text style={styles.authorName}>{author?.nickname ?? '익명'}</Text>
                <Text style={styles.timeText}>{relTime(post.createdAt)}</Text>
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

            <View style={styles.divider} />

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
                  onOpenConversation={onOpenConversation}
                  onSendInvite={handleSendInvite}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.notFound}>해당 글을 찾을 수 없습니다.</Text>
        )}
      </ScrollView>

      <View style={bottomBarStyles.bar}>
        <SizeButtons textSizeStep={textSizeStep} onChangeTextSize={onChangeTextSize} />
        <NavButton position="right" onPress={onBack} icon="←" />
      </View>
    </SafeAreaView>
  );
}

function ReplyRow({
  reply,
  styles,
  viewerLanguage,
  postId,
  postAuthorId,
  onOpenConversation,
  onSendInvite,
}: {
  reply: SeedReply;
  styles: ReturnType<typeof createPostDetailStyles>;
  viewerLanguage: Language;
  postId: string;
  postAuthorId: string;
  onOpenConversation: (postId: string, rootCommentId: string) => void;
  onSendInvite: (replyId: string) => void;
}) {
  const author = USER_MAP[reply.userId];
  const resolved = resolveContent({
    targetType: 'reply',
    targetId: reply.replyId,
    originalContent: reply.originalContent,
    originalLanguage: reply.originalLanguage,
    viewerLanguage,
    translations: SEED_TRANSLATIONS,
  });

  const canInvite =
    CURRENT_USER_ID === postAuthorId &&
    CURRENT_USER_ID !== reply.userId &&
    !reply.conversationInvite;

  return (
    <View style={styles.reply}>
      <ProfileAvatar
        user={author}
        size={26}
        style={styles.replyIcon}
      />
      <View style={styles.replyContent}>
        <View style={styles.replyHeader}>
          <Text style={styles.replyAuthor}>{author?.nickname ?? '익명'}</Text>
          <Text style={styles.replyTime}>{relTime(reply.createdAt)}</Text>
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
            onOpenConversation={onOpenConversation}
          />
        ) : null}

        {canInvite ? (
          <Pressable
            onPress={() => onSendInvite(reply.replyId)}
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
  onOpenConversation,
}: {
  invite: ConversationInvite;
  styles: ReturnType<typeof createPostDetailStyles>;
  postId: string;
  postAuthorId: string;
  replyAuthorId: string;
  rootCommentId: string;
  onOpenConversation: (postId: string, rootCommentId: string) => void;
}) {
  const author = USER_MAP[invite.userId];
  const canJoin =
    CURRENT_USER_ID === replyAuthorId && !invite.conversationJoin;
  const canContinue =
    !!invite.conversationJoin &&
    (CURRENT_USER_ID === postAuthorId || CURRENT_USER_ID === replyAuthorId);

  return (
    <View style={styles.invite}>
      <Text style={styles.inviteLabel}>대화초대</Text>
      <View style={styles.inviteHeader}>
        <ProfileAvatar
          user={author}
          size={22}
          style={styles.inviteAvatar}
        />
        <Text style={styles.inviteAuthor}>{author?.nickname ?? '익명'}</Text>
        <Text style={styles.inviteTime}>{relTime(invite.createdAt)}</Text>
      </View>
      <Text style={styles.inviteText}>{invite.originalContent}</Text>

      {invite.conversationJoin ? (
        <JoinBlock join={invite.conversationJoin} styles={styles} />
      ) : null}

      {canJoin ? (
        <Pressable
          onPress={() =>
            Alert.alert('대화참여', '대화참여 기능은 곧 추가됩니다.')
          }
          hitSlop={8}
          style={({ pressed }) => [
            styles.joinCta,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text style={styles.joinCtaText}>대화참여</Text>
        </Pressable>
      ) : null}

      {canContinue ? (
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
        />
        <Text style={styles.joinAuthor}>{author?.nickname ?? '익명'}</Text>
        <Text style={styles.joinTime}>{relTime(join.createdAt)}</Text>
      </View>
      <Text style={styles.joinText}>{join.originalContent}</Text>
    </View>
  );
}


function ConversationScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  conversationId,
  onBack,
  onOpenProfile,
  onLeave,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  conversationId: string;
  onBack: () => void;
  onOpenProfile: () => void;
  onLeave: (conversationId: string) => void;
}) {
  const styles = useMemo(() => createConversationStyles(scale), [scale]);
  const [draft, setDraft] = useState('');
  const [extraMessages, setExtraMessages] = useState<SeedMessage[]>([]);
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

  const conversation = useMemo(
    () => SEED_CONVERSATIONS.find((c) => c.conversationId === conversationId),
    [conversationId],
  );

  const counterpart = useMemo(() => {
    if (!conversation) return undefined;
    const otherId = conversation.participants.find(
      (p) => p !== CURRENT_USER_ID,
    );
    return otherId ? USER_MAP[otherId] : undefined;
  }, [conversation]);

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

  const handleSend = () => {
    const validation = validateMessageBeforeSend(draft);
    if (!validation.ok) {
      Alert.alert('메시지 확인', validation.reason ?? '');
      return;
    }
    const newMsg: SeedMessage = {
      messageId: `local_${Date.now()}`,
      conversationId,
      senderId: CURRENT_USER_ID ?? 'm_01',
      originalLanguage: 'ko',
      originalContent: draft.trim(),
      createdAt: new Date().toISOString(),
      isSample: true,
    };
    setExtraMessages([...extraMessages, newMsg]);
    setDraft('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const requestDisclosure = (kind: DisclosureKind) => {
    const newMsg: SeedMessage = {
      messageId: `local_${Date.now()}`,
      conversationId,
      senderId: CURRENT_USER_ID ?? 'm_01',
      originalLanguage: 'ko',
      originalContent: DISCLOSURE_REQUEST_LINE[kind],
      createdAt: new Date().toISOString(),
      isSample: true,
      kind: 'disclosure_request',
      disclosureKind: kind,
    };
    setExtraMessages([...extraMessages, newMsg]);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  };

  const handleAcceptDisclosure = (request: SeedMessage) => {
    if (!request.disclosureKind) return;
    const now = Date.now();
    const acceptMsg: SeedMessage = {
      messageId: `local_${now}`,
      conversationId,
      senderId: CURRENT_USER_ID ?? 'm_01',
      originalLanguage: 'ko',
      originalContent: DISCLOSURE_ACCEPT_LINE,
      createdAt: new Date(now).toISOString(),
      isSample: true,
      kind: 'disclosure_accepted',
      disclosureKind: request.disclosureKind,
    };
    const infoMsg: SeedMessage = {
      messageId: `local_${now + 1}`,
      conversationId,
      senderId: 'system',
      originalLanguage: 'ko',
      originalContent: DISCLOSURE_INFO_LINE[request.disclosureKind],
      createdAt: new Date(now + 1).toISOString(),
      isSample: true,
      kind: 'disclosure_info',
      disclosureKind: request.disclosureKind,
    };
    setExtraMessages([...extraMessages, acceptMsg, infoMsg]);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  };

  const handleDeclineDisclosure = (request: SeedMessage) => {
    if (!request.disclosureKind) return;
    const declineMsg: SeedMessage = {
      messageId: `local_${Date.now()}`,
      conversationId,
      senderId: CURRENT_USER_ID ?? 'm_01',
      originalLanguage: 'ko',
      originalContent: DISCLOSURE_DECLINE_LINE,
      createdAt: new Date().toISOString(),
      isSample: true,
      kind: 'disclosure_declined',
      disclosureKind: request.disclosureKind,
    };
    setExtraMessages([...extraMessages, declineMsg]);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
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

  const handleMore = () => {
    Alert.alert('', '', [
      { text: '대화방 나가기', onPress: handleLeave },
      { text: '신고하기', onPress: () => {} },
      { text: '이 사용자 차단하기', onPress: () => {} },
      { text: '닫기', style: 'cancel' },
    ]);
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safe}>
        <BrandHeader onProfile={onOpenProfile} />
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader onProfile={onOpenProfile} />

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
            const isRegular = m.kind === undefined || m.kind === 'text';
            const canDelete =
              isLast && isRegular && m.senderId === CURRENT_USER_ID;
            let onAccept: (() => void) | undefined;
            let onDecline: (() => void) | undefined;
            if (
              m.kind === 'disclosure_request' &&
              m.senderId !== CURRENT_USER_ID
            ) {
              const subsequent = messages.slice(idx + 1);
              const resolved = subsequent.some(
                (s) =>
                  (s.kind === 'disclosure_accepted' ||
                    s.kind === 'disclosure_declined') &&
                  s.disclosureKind === m.disclosureKind,
              );
              if (!resolved) {
                onAccept = () => handleAcceptDisclosure(m);
                onDecline = () => handleDeclineDisclosure(m);
              }
            }
            return (
              <MessageBubble
                key={m.messageId}
                message={m}
                myId={CURRENT_USER_ID}
                styles={styles}
                onDelete={canDelete ? () => handleDelete(m.messageId) : undefined}
                onAcceptDisclosure={onAccept}
                onDeclineDisclosure={onDecline}
              />
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
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
            onPress={handleSend}
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
    </SafeAreaView>
  );
}

const PROFILE_REGION_OPTIONS = [
  '서울',
  '경기·인천',
  '부산',
  '대구',
  '대전·충청',
  '광주·전라',
  '그 외',
] as const;

const PROFILE_LANGUAGE_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
];

const PROFILE_COUNTRY_OPTIONS: ReadonlyArray<{
  code: string;
  label: string;
}> = [
  { code: '+82', label: '대한민국 +82' },
  { code: '+1', label: 'United States +1' },
  { code: '+81', label: '日本 +81' },
  { code: '+86', label: '中国 +86' },
  { code: '+34', label: 'España +34' },
  { code: 'custom', label: '그 외' },
];

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

function ProfileSetupScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  onBack,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  onBack: () => void;
}) {
  const styles = useMemo(() => createProfileSetupStyles(scale), [scale]);
  const [nickname, setNickname] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [customCountryCode, setCustomCountryCode] = useState('');
  const [customCountryEditing, setCustomCountryEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const effectiveCountryCode =
    countryCode === 'custom' ? customCountryCode : countryCode;
  const sanitizedCountry = effectiveCountryCode.replace(/[^+\d]/g, '');
  const sanitizedPhone = phoneNumber.replace(/\D/g, '');
  const fullPhoneNumber = `${sanitizedCountry}${sanitizedPhone}`;
  const handleCustomCountryChange = (v: string) => {
    const digits = v.replace(/\D/g, '');
    setCustomCountryCode(digits ? `+${digits}` : '');
  };
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<
    | 'country'
    | 'language'
    | 'gender'
    | 'region'
    | 'occupation'
    | 'convList'
    | null
  >(null);
  const toggleDropdown = (
    key:
      | 'country'
      | 'language'
      | 'gender'
      | 'region'
      | 'occupation'
      | 'convList',
  ) => setOpenDropdown((prev) => (prev === key ? null : key));
  const [profileImages, setProfileImages] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  const handleSendCode = () => {
    if (
      sanitizedCountry.length < 2 ||
      !sanitizedCountry.startsWith('+') ||
      sanitizedPhone.length < 7
    ) {
      Alert.alert('확인', '국가번호와 휴대폰 번호를 다시 확인해주세요.');
      return;
    }
    setCodeSent(true);
    Alert.alert(
      '인증번호 전송',
      `${fullPhoneNumber} 로 인증번호가 발송되었어요.`,
    );
  };

  const handleVerifyCode = () => {
    if (code.trim().length < 4) {
      Alert.alert('확인', '인증번호를 다시 확인해주세요.');
      return;
    }
    setIsVerified(true);
  };

  const handlePhotoSlot = async (idx: number) => {
    const existing = profileImages[idx];
    if (existing) {
      setPreviewImage(existing);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfileImages((prev) => {
        const next = [...prev];
        next[idx] = uri;
        return next;
      });
    }
  };

  const handleSave = () => {
    onBack();
  };

  const conversationList = useMemo(() => {
    const meId = CURRENT_USER_ID ?? '';
    return SEED_CONVERSATIONS.filter((c) => c.participants.includes(meId))
      .slice()
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map((c) => {
        const otherId = c.participants.find((p) => p !== meId);
        const user = otherId ? USER_MAP[otherId] : undefined;
        return user ? { conv: c, user } : null;
      })
      .filter(
        (x): x is { conv: SeedConversation; user: SeedUser } => x !== null,
      );
  }, []);

  const visibleConvList = useMemo(
    () =>
      conversationList.filter(
        ({ conv }) => !removedConvIds.has(conv.conversationId),
      ),
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

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
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
                          setLanguage(o.code);
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
              </View>
            </View>
          </View>

          <View
            style={[
              styles.section,
              openDropdown === 'country' && styles.sectionRaised,
            ]}
          >
            <Text style={styles.label}>휴대폰 번호</Text>
            <View style={styles.row}>
              <View
                style={[
                  styles.dropdownAnchor,
                  styles.countryAnchor,
                  openDropdown === 'country' && styles.dropdownAnchorOpen,
                ]}
              >
                <Pressable
                  onPress={() => toggleDropdown('country')}
                  disabled={isVerified}
                  style={({ pressed }) => [
                    styles.countrySelect,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.selectText} numberOfLines={1}>
                    {countryCode === 'custom'
                      ? customCountryCode || '그 외'
                      : countryCode}
                  </Text>
                  <Text style={styles.selectChevron}>
                    {openDropdown === 'country' ? '⌃' : '›'}
                  </Text>
                </Pressable>
                {openDropdown === 'country' ? (
                  <View style={styles.dropdownOverlay}>
                    {PROFILE_COUNTRY_OPTIONS.map((o) => (
                      <Pressable
                        key={o.code}
                        onPress={() => {
                          setCountryCode(o.code);
                          if (o.code === 'custom') {
                            setCustomCountryCode('');
                            setCustomCountryEditing(true);
                          } else {
                            setCustomCountryEditing(false);
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
                            countryCode === o.code && styles.dropdownTextSel,
                          ]}
                        >
                          {o.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="번호 입력"
                placeholderTextColor={PALETTE.textMuted}
                style={styles.flexInput}
                keyboardType="phone-pad"
                editable={!isVerified}
                maxLength={15}
              />
              {!isVerified ? (
                <Pressable
                  onPress={handleSendCode}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.smallBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.smallBtnText}>
                    {codeSent ? '재전송' : '인증요청'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {countryCode === 'custom' && customCountryEditing ? (
              <TextInput
                value={customCountryCode}
                onChangeText={handleCustomCountryChange}
                onBlur={() => setCustomCountryEditing(false)}
                onSubmitEditing={() => setCustomCountryEditing(false)}
                placeholder="직접 입력"
                placeholderTextColor={PALETTE.textMuted}
                style={styles.customCountryInput}
                keyboardType="phone-pad"
                editable={!isVerified}
                maxLength={6}
                autoFocus
              />
            ) : null}
          </View>

          {codeSent ? (
            <View style={styles.section}>
              <Text style={styles.label}>인증번호</Text>
              <View style={styles.row}>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6자리 숫자"
                  placeholderTextColor={PALETTE.textMuted}
                  style={styles.flexInput}
                  keyboardType="number-pad"
                  editable={!isVerified}
                  maxLength={6}
                />
                {!isVerified ? (
                  <Pressable
                    onPress={handleVerifyCode}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.smallBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.smallBtnText}>확인</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.verifiedBadge}>✓ 완료</Text>
                )}
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.row50,
              (openDropdown === 'region' || openDropdown === 'gender') &&
                styles.row50Raised,
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
                  <View style={styles.dropdownOverlay}>
                    {PROFILE_REGION_OPTIONS.map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => {
                          setRegion(r);
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
          </View>

          <View
            style={[
              styles.row50,
              openDropdown === 'occupation' && styles.row50Raised,
            ]}
          >
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
            <Text style={styles.label}>프로필 사진</Text>
            <View style={styles.photoRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const img = profileImages[i];
                return (
                  <Pressable
                    key={i}
                    onPress={() => handlePhotoSlot(i)}
                    style={({ pressed }) => [
                      styles.photoSlot,
                      pressed && styles.pressed,
                    ]}
                  >
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={styles.photoSlotImg}
                      />
                    ) : (
                      <Text style={styles.photoSlotPlus}>+</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>· 허락 이후 공개됩니다</Text>
          </View>

          <View
            style={[
              styles.section,
              openDropdown === 'convList' && styles.sectionRaised,
            ]}
          >
            <Text style={styles.label}>대화 리스트</Text>
            <View
              style={[
                styles.dropdownAnchor,
                openDropdown === 'convList' && styles.dropdownAnchorOpen,
              ]}
            >
              <Pressable
                onPress={() => toggleDropdown('convList')}
                style={({ pressed }) => [
                  styles.selectInput,
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
                <View style={[styles.dropdownOverlay, styles.convListOverlay]}>
                  {visibleConvList.length === 0 ? (
                    <Text style={styles.convEmpty}>없음</Text>
                  ) : (
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {visibleConvList.map(({ conv, user }, idx) => (
                        <View
                          key={conv.conversationId}
                          style={[
                            styles.convListRow,
                            idx === visibleConvList.length - 1 &&
                              styles.convListRowLast,
                          ]}
                        >
                          <Text style={styles.convListName} numberOfLines={1}>
                            {user.nickname}
                          </Text>
                          <Text style={styles.convListTime}>
                            {formatShortDate(conv.lastMessageAt)}
                          </Text>
                          <Pressable
                            onPress={() =>
                              handleRemoveConv(conv.conversationId)
                            }
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.convRemoveBtn,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={styles.convRemoveIcon}>×</Text>
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.saveBtnText}>저장</Text>
          </Pressable>
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
            <NavButton position="right" onPress={onBack} icon="←" />
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable
          style={styles.previewBackdrop}
          onPress={() => setPreviewImage(null)}
        >
          {previewImage ? (
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createProfileSetupStyles(scale: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: PALETTE.bg },
    kav: { flex: 1 },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    section: {
      marginBottom: 10,
    },
    label: {
      color: '#8fd9b6',
      fontSize: 10 * scale,
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    input: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    flexInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    smallBtn: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: PALETTE.cardPressed,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.border,
    },
    smallBtnText: {
      color: '#FFFFFF',
      fontSize: 11 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    pressed: {
      opacity: 0.6,
    },
    verifiedBadge: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '500',
      paddingHorizontal: 8,
      letterSpacing: 0.3,
    },
    selectInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 9,
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
    countryAnchor: {
      width: 92,
    },
    countrySelect: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    customCountryInput: {
      color: '#FFFFFF',
      fontSize: 13 * scale,
      fontWeight: '300',
      backgroundColor: PALETTE.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      marginTop: 4,
      alignSelf: 'flex-start',
      width: 110,
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
      color: '#8fd9b6',
      fontWeight: '500',
    },
    photoRow: {
      flexDirection: 'row',
      gap: 4,
    },
    photoSlot: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: PALETTE.card,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photoSlotImg: {
      width: '100%',
      height: '100%',
    },
    photoSlotPlus: {
      color: PALETTE.textMuted,
      fontSize: 18,
      fontWeight: '300',
      lineHeight: 20,
    },
    previewBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewImage: {
      width: '92%',
      height: '80%',
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
      alignSelf: 'flex-end',
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: PALETTE.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.border,
      marginTop: 10,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 12 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    row50: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    row50Raised: {
      zIndex: 100,
      elevation: 12,
    },
    half: {
      flex: 1,
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
  onAcceptDisclosure,
  onDeclineDisclosure,
}: {
  message: SeedMessage;
  myId: string | null;
  styles: ReturnType<typeof createConversationStyles>;
  onDelete?: () => void;
  onAcceptDisclosure?: () => void;
  onDeclineDisclosure?: () => void;
}) {
  const kind = message.kind;

  if (kind === 'disclosure_info') {
    return (
      <View style={styles.disclosureInfoRow}>
        <Text style={styles.disclosureInfoText}>
          · {message.originalContent} ·
        </Text>
      </View>
    );
  }

  const showDisclosureActions =
    kind === 'disclosure_request' &&
    !!onAcceptDisclosure &&
    !!onDeclineDisclosure;

  const isMine = message.senderId === myId;
  const author = USER_MAP[message.senderId];
  const nickname = author?.nickname ?? '익명';
  const bubbleBg =
    author?.gender === 'female' ? PALETTE.bubbleFemale : PALETTE.bubbleMale;
  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowTheirs,
      ]}
    >
      <View style={styles.messageMeta}>
        {isMine ? (
          <>
            <Text style={styles.metaName}>{nickname}</Text>
            <ProfileAvatar
              user={author}
              size={20}
              style={styles.metaAvatarMine}
            />
          </>
        ) : (
          <>
            <ProfileAvatar
              user={author}
              size={20}
              style={styles.metaAvatarTheirs}
            />
            <Text style={styles.metaName}>{nickname}</Text>
          </>
        )}
      </View>
      <View
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text style={styles.bubbleText}>{message.originalContent}</Text>
        {showDisclosureActions ? (
          <View style={styles.bubbleDisclosureActions}>
            <Pressable
              onPress={onAcceptDisclosure}
              hitSlop={8}
              style={({ pressed }) => [
                styles.bubbleActionAccept,
                pressed && styles.bubbleActionPressed,
              ]}
            >
              <Text style={styles.bubbleActionAcceptText}>수락</Text>
            </Pressable>
            <Pressable
              onPress={onDeclineDisclosure}
              hitSlop={8}
              style={({ pressed }) => [
                styles.bubbleActionDecline,
                pressed && styles.bubbleActionPressed,
              ]}
            >
              <Text style={styles.bubbleActionDeclineText}>거절</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.bubbleFooter}>
          <Text style={styles.bubbleTime}>{relTime(message.createdAt)}</Text>
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={10}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deletePressed,
              ]}
            >
              <Text style={styles.deleteX}>×</Text>
            </Pressable>
          ) : null}
        </View>
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
  bg,
}: {
  onProfile?: () => void;
  bg?: string;
}) {
  return (
    <View
      style={[
        brandHeaderStyles.container,
        bg ? { backgroundColor: bg } : null,
      ]}
    >
      <Text style={brandHeaderStyles.logo}>DULSAI</Text>
      {onProfile ? (
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
      color: '#FFFFFF',
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
      backgroundColor: PALETTE.card,
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
      backgroundColor: PALETTE.card,
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
    scrollContent: {
      paddingTop: 8,
      paddingBottom: SCROLL_BOTTOM_PADDING,
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
    postBody: {
      color: '#FFFFFF',
      fontSize: 16 * scale,
      lineHeight: 26 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    divider: {
      height: 1,
      backgroundColor: PALETTE.border,
      marginHorizontal: 24,
      opacity: 0.5,
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
      paddingHorizontal: 12,
      backgroundColor: PALETTE.invitePanel,
      borderRadius: 6,
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
      backgroundColor: PALETTE.invitePanel,
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
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    messageRow: {
      width: '100%',
      marginBottom: 14,
    },
    messageRowMine: {
      alignItems: 'flex-end',
    },
    messageRowTheirs: {
      alignItems: 'flex-start',
    },
    messageMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    metaAvatarTheirs: {
      marginRight: 6,
    },
    metaAvatarMine: {
      marginLeft: 6,
    },
    metaName: {
      color: PALETTE.textMuted,
      fontSize: 11 * scale,
      letterSpacing: 0.3,
      fontWeight: '400',
    },
    bubble: {
      maxWidth: '80%',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    bubbleMine: {
      borderTopRightRadius: 4,
    },
    bubbleTheirs: {
      borderTopLeftRadius: 4,
    },
    bubbleText: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    bubbleFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    bubbleTime: {
      color: 'rgba(255, 255, 255, 0.65)',
      fontSize: 10 * scale,
      letterSpacing: 0.3,
    },
    deleteButton: {
      marginLeft: 10,
      paddingHorizontal: 4,
    },
    deletePressed: {
      opacity: 0.4,
    },
    deleteX: {
      color: 'rgba(255, 255, 255, 0.45)',
      fontSize: 14,
      fontWeight: '300',
      lineHeight: 14,
    },
    disclosureInfoRow: {
      width: '100%',
      alignItems: 'center',
      marginVertical: 6,
    },
    disclosureInfoText: {
      color: PALETTE.textMuted,
      fontSize: 10 * scale,
      letterSpacing: 0.5,
      opacity: 0.7,
    },
    bubbleDisclosureActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
      alignSelf: 'flex-start',
    },
    bubbleActionAccept: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: PALETTE.inviteAccent,
      backgroundColor: 'rgba(125, 170, 151, 0.10)',
    },
    bubbleActionDecline: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    bubbleActionAcceptText: {
      color: PALETTE.inviteAccent,
      fontSize: 11 * scale,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    bubbleActionDeclineText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    bubbleActionPressed: {
      opacity: 0.55,
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
