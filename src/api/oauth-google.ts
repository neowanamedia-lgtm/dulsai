// Google 로그인 — @react-native-google-signin/google-signin 기반.
// Expo Go 에서는 native module 이 없으므로 안내만 반환한다.
// 실제 검증은 EAS development build / production build 에서 가능.

import Constants from 'expo-constants';

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

type Status = {
  SIGN_IN_CANCELLED: number | string;
};

type GoogleSigninModule = {
  configure: (opts: {
    webClientId?: string;
    iosClientId?: string;
  }) => void;
  hasPlayServices: (opts?: {
    showPlayServicesUpdateDialog?: boolean;
  }) => Promise<boolean>;
  signIn: () => Promise<
    | {
        idToken?: string | null;
        data?: { idToken?: string | null } | null;
      }
    | { type?: 'cancelled'; data?: null }
  >;
};

const isExpoGo = Constants.appOwnership === 'expo';

let googleSigninModule: GoogleSigninModule | null = null;
let statusCodes: Status | null = null;
let configured = false;

function loadNativeModule(): GoogleSigninModule | null {
  if (isExpoGo) return null;
  if (googleSigninModule) return googleSigninModule;
  try {
    // 동적 require — Expo Go 에서 import 자체로 죽는 것을 막는다.

    const mod = require('@react-native-google-signin/google-signin');
    googleSigninModule = mod.GoogleSignin as GoogleSigninModule;
    statusCodes = mod.statusCodes as Status;
    return googleSigninModule;
  } catch (err) {
    logger.warn('google-signin native module not available', {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function ensureConfigured(mod: GoogleSigninModule) {
  if (configured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!webClientId) {
    logger.warn('googleSignIn: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing', {});
  }
  mod.configure({ webClientId, iosClientId });
  configured = true;
}

export type GoogleSignInResult = {
  ok: boolean;
  cancelled: boolean;
  errorMessage?: string;
};

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (isExpoGo) {
    return {
      ok: false,
      cancelled: false,
      errorMessage:
        'Expo Go 에서는 Google 로그인을 검증할 수 없어요. dev build 가 필요해요.',
    };
  }

  const mod = loadNativeModule();
  if (!mod) {
    return {
      ok: false,
      cancelled: false,
      errorMessage: 'Google 로그인 모듈이 준비되지 않았어요.',
    };
  }

  try {
    ensureConfigured(mod);
    await mod.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await mod.signIn();
    // 라이브러리 버전에 따라 두 가지 응답 형식 지원
    const idToken =
      (result as { data?: { idToken?: string | null } }).data?.idToken ??
      (result as { idToken?: string | null }).idToken ??
      null;
    if (!idToken) {
      logger.error('googleSignIn: no idToken', { keys: Object.keys(result) });
      return {
        ok: false,
        cancelled: false,
        errorMessage: 'Google 인증 토큰을 받지 못했어요.',
      };
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) {
      logger.error('googleSignIn supabase failed', {
        code: error.status,
        message: error.message,
      });
      return { ok: false, cancelled: false, errorMessage: error.message };
    }
    logger.info('googleSignIn ok');
    return { ok: true, cancelled: false };
  } catch (err) {
    const code = (err as { code?: string | number })?.code;
    if (statusCodes && code === statusCodes.SIGN_IN_CANCELLED) {
      return { ok: false, cancelled: true };
    }
    logger.error('googleSignIn threw', {
      code,
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      cancelled: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
