import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  SEED_POSTS,
  SEED_TRANSLATIONS,
  SEED_USERS,
  type Language,
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
type Route = 'main' | 'category' | 'post' | 'profile';

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

function isPostVisibleIn(post: SeedPost, lang: Language): boolean {
  if (post.originalLanguage === lang) return true;
  return SEED_TRANSLATIONS.some(
    (t) =>
      t.targetType === 'post' &&
      t.targetId === post.postId &&
      t.targetLanguage === lang &&
      t.status === 'completed',
  );
}

function isReplyVisibleIn(reply: SeedReply, lang: Language): boolean {
  if (reply.originalLanguage === lang) return true;
  return SEED_TRANSLATIONS.some(
    (t) =>
      t.targetType === 'reply' &&
      t.targetId === reply.replyId &&
      t.targetLanguage === lang &&
      t.status === 'completed',
  );
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

  const goBack = () => {
    if (route === 'profile') setRoute(previousRoute);
    else if (route === 'post') setRoute('category');
    else setRoute('main');
  };

  const changeViewerLanguage = (lang: Language) => {
    setViewerLanguage(lang);
    if (previousRoute === 'post') {
      setPreviousRoute(selectedCategoryId ? 'category' : 'main');
      setSelectedPostId(null);
    }
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
        />
      )}
      {route === 'profile' && (
        <ProfileScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          viewerLanguage={viewerLanguage}
          onChangeViewerLanguage={changeViewerLanguage}
          onClose={goBack}
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
                  </View>

                  <Text
                    style={styles.postPreview}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {resolved.text}
                  </Text>

                  <View style={styles.postFooter}>
                    <Text style={styles.replyCount}>
                      답글 {post.replies.length}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
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
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  postId: string;
  viewerLanguage: Language;
  onBack: () => void;
  onOpenProfile: () => void;
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
                답글 {visibleReplies.length}
              </Text>
              {visibleReplies.map((reply) => (
                <ReplyRow
                  key={reply.replyId}
                  reply={reply}
                  styles={styles}
                  viewerLanguage={viewerLanguage}
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
}: {
  reply: SeedReply;
  styles: ReturnType<typeof createPostDetailStyles>;
  viewerLanguage: Language;
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
      </View>
    </View>
  );
}

function ProfileScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  viewerLanguage,
  onChangeViewerLanguage,
  onClose,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  viewerLanguage: Language;
  onChangeViewerLanguage: (lang: Language) => void;
  onClose: () => void;
}) {
  const styles = useMemo(() => createProfileStyles(scale), [scale]);

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader />

      <ScrollView
        style={styles.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.sectionLabel}>표시 언어</Text>
        <View style={styles.langRow}>
          {LANGUAGE_ORDER.map((lang) => {
            const selected = viewerLanguage === lang;
            return (
              <Pressable
                key={lang}
                onPress={() => onChangeViewerLanguage(lang)}
                style={({ pressed }) => [
                  styles.langButton,
                  selected && styles.langButtonSelected,
                  pressed && styles.langButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    selected && styles.langButtonTextSelected,
                  ]}
                >
                  {LANGUAGE_LABELS[lang]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionLabel}>프로필 정보</Text>
        <Text style={styles.sectionPlaceholder}>
          곧 닉네임·연령대·소개 같은 항목이 이 자리에 채워질 예정입니다.
        </Text>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionLabel}>계정</Text>
        <Text style={styles.sectionPlaceholder}>
          곧 계정 관리·로그아웃 같은 항목이 이 자리에 채워질 예정입니다.
        </Text>
      </ScrollView>

      <View style={bottomBarStyles.bar}>
        <SizeButtons textSizeStep={textSizeStep} onChangeTextSize={onChangeTextSize} />
        <NavButton position="right" onPress={onClose} icon="←" />
      </View>
    </SafeAreaView>
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

function BrandHeader({ onProfile }: { onProfile?: () => void }) {
  return (
    <View style={brandHeaderStyles.container}>
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
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    postCardPressed: {
      backgroundColor: PALETTE.cardPressed,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
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
    postPreview: {
      color: '#FFFFFF',
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '300',
      letterSpacing: 0.2,
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
    },
    replyCount: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      letterSpacing: 0.3,
    },
    chevron: {
      color: PALETTE.chevron,
      fontSize: 18,
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
    notFound: {
      color: PALETTE.textMuted,
      fontSize: 14 * scale,
      textAlign: 'center',
      paddingTop: 60,
    },
  });
}

function createProfileStyles(scale: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    scrollFlex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 26,
      paddingTop: 32,
      paddingBottom: SCROLL_BOTTOM_PADDING,
    },
    sectionLabel: {
      color: PALETTE.textMuted,
      fontSize: 12 * scale,
      letterSpacing: 1.5,
      marginBottom: 14,
      fontWeight: '300',
      textTransform: 'uppercase',
    },
    langRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    langButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: PALETTE.card,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    langButtonSelected: {
      borderColor: PALETTE.brandRed,
      backgroundColor: PALETTE.cardPressed,
    },
    langButtonPressed: {
      opacity: 0.7,
    },
    langButtonText: {
      color: PALETTE.textMuted,
      fontSize: 13 * scale,
      fontWeight: '400',
      letterSpacing: 0.3,
    },
    langButtonTextSelected: {
      color: PALETTE.textCategory,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: PALETTE.border,
      opacity: 0.4,
      marginVertical: 30,
    },
    sectionPlaceholder: {
      color: PALETTE.textMuted,
      fontSize: 14 * scale,
      lineHeight: 24 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
    },
  });
}
