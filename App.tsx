import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Category = { id: string; label: string };

const CATEGORIES: Category[] = [
  { id: 'todays-passing-thought',  label: '오늘 하루를 보내면서 문득 들었던 생각?' },
  { id: 'quiet-loneliness',        label: '이유 없이 조금 외롭게 느껴지는 순간?' },
  { id: 'lasting-affection',       label: '내가 오래 좋아하게 되는 감정들?' },
  { id: 'stance-in-relationships', label: '인간관계에서 내가 중요하게 생각하는 태도?' },
  { id: 'private-habit',           label: '혼자만 조용히 반복하는 나만의 습관?' },
  { id: 'quiet-message',           label: '누군가에게 조용히 전하고 싶은 마음?' },
  { id: 'lingering-sentence',      label: '오늘 마음속에 오래 남은 한 문장?' },
  { id: 'unsaid-words',            label: '끝내 누군가에게 하지 못했던 말?' },
  { id: 'recurring-feeling',       label: '요즘 자꾸 반복해서 떠오르는 마음?' },
  { id: 'comforting-presence',     label: '함께 있으면 편안해지는 사람에 대한 생각?' },
  { id: 'what-matters-in-love',    label: '사랑에서 내가 중요하게 여기는 것들?' },
  { id: 'free-thought',            label: '그냥 지금 떠오르는 자유로운 생각?' },
];

type TextSizeStep = 0 | 1 | 2 | 3;
type Route = 'main' | 'settings';

const PALETTE = {
  bg: '#141210',
  card: '#1f1d1a',
  cardPressed: '#2a2622',
  settingsBg: '#1c1a17',
  textLogo: '#f7f4ee',
  textCategory: '#ece4d6',
  textPrompt: '#c9c0b3',
  textMuted: '#8a8078',
  textBody: '#ece4d6',
  chevron: '#8a8078',
  border: '#4a443c',
  buttonBg: '#2a2622',
  buttonBgDim: '#1a1815',
};

const SCALES: Record<TextSizeStep, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.2,
  3: 1.3,
};

export default function App() {
  const [textSizeStep, setTextSizeStep] = useState<TextSizeStep>(0);
  const [route, setRoute] = useState<Route>('main');

  const scale = SCALES[textSizeStep];

  const changeTextSize = (delta: number) => {
    const next = Math.max(0, Math.min(3, textSizeStep + delta)) as TextSizeStep;
    setTextSizeStep(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.bg} />
      {route === 'main' ? (
        <MainScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          onOpenSettings={() => setRoute('settings')}
        />
      ) : (
        <SettingsScreen
          scale={scale}
          textSizeStep={textSizeStep}
          onChangeTextSize={changeTextSize}
          onClose={() => setRoute('main')}
        />
      )}
    </View>
  );
}

function MainScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  onOpenSettings,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  onOpenSettings: () => void;
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
      <BrandHeader
        textSizeStep={textSizeStep}
        onChangeTextSize={onChangeTextSize}
      />
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.prompt}>어떤 생각을 나누고 싶나요?</Text>

          <View style={styles.categoryList}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.categoryItem,
                  pressed && styles.categoryItemPressed,
                ]}
              >
                <Text style={styles.categoryText}>{c.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      <Pressable
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && styles.settingsButtonPressed,
        ]}
        hitSlop={8}
      >
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function SettingsScreen({
  scale,
  textSizeStep,
  onChangeTextSize,
  onClose,
}: {
  scale: number;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
  onClose: () => void;
}) {
  const styles = useMemo(() => createSettingsStyles(scale), [scale]);

  return (
    <SafeAreaView style={styles.safe}>
      <BrandHeader
        onBack={onClose}
        textSizeStep={textSizeStep}
        onChangeTextSize={onChangeTextSize}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.placeholder}>
          이 공간에는 곧 다른 설정들이 조용히 더해질 예정입니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BrandHeader({
  onBack,
  textSizeStep,
  onChangeTextSize,
}: {
  onBack?: () => void;
  textSizeStep: TextSizeStep;
  onChangeTextSize: (delta: number) => void;
}) {
  const styles = brandHeaderStyles;
  const canDecrease = textSizeStep > 0;
  const canIncrease = textSizeStep < 3;

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : null}
        <Text style={styles.logo}>DULSAI</Text>
      </View>

      <View style={styles.sizeButtons}>
        <Pressable
          onPress={() => onChangeTextSize(-1)}
          disabled={!canDecrease}
          hitSlop={6}
          style={({ pressed }) => [
            styles.sizeButton,
            !canDecrease && styles.sizeButtonDim,
            pressed && canDecrease && styles.sizeButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.sizeButtonText,
              !canDecrease && styles.sizeButtonTextDim,
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
            styles.sizeButton,
            !canIncrease && styles.sizeButtonDim,
            pressed && canIncrease && styles.sizeButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.sizeButtonText,
              !canIncrease && styles.sizeButtonTextDim,
            ]}
          >
            +
          </Text>
        </Pressable>
      </View>
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
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  backIcon: {
    color: PALETTE.textPrompt,
    fontSize: 22,
    fontWeight: '300',
  },
  logo: {
    color: PALETTE.textLogo,
    fontSize: 26,
    letterSpacing: 5,
    fontWeight: '500',
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.buttonBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonDim: {
    backgroundColor: PALETTE.buttonBgDim,
    borderColor: '#332e29',
  },
  sizeButtonPressed: {
    opacity: 0.6,
  },
  sizeButtonText: {
    color: PALETTE.textCategory,
    fontSize: 18,
    fontWeight: '500',
    marginTop: -2,
  },
  sizeButtonTextDim: {
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
    scrollContent: {
      paddingTop: 24,
      paddingBottom: 140,
    },
    prompt: {
      color: PALETTE.textPrompt,
      fontSize: 14 * scale,
      lineHeight: 22 * scale,
      fontWeight: '400',
      letterSpacing: 0.5,
      paddingHorizontal: 26,
      marginBottom: 14 + (scale - 1) * 6,
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
    settingsButton: {
      position: 'absolute',
      right: 20,
      bottom: 28,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: PALETTE.settingsBg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
      opacity: 0.92,
    },
    settingsButtonPressed: {
      opacity: 0.6,
    },
    settingsIcon: {
      color: PALETTE.textMuted,
      fontSize: 18,
    },
  });
}

function createSettingsStyles(scale: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    content: {
      paddingHorizontal: 26,
      paddingTop: 32,
      paddingBottom: 80,
    },
    placeholder: {
      color: PALETTE.textMuted,
      fontSize: 14 * scale,
      lineHeight: 24 * scale,
      fontWeight: '300',
      letterSpacing: 0.3,
    },
  });
}
