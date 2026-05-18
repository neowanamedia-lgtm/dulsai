// Apple 로그인 — expo-apple-authentication 기반. iOS 전용.

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const isAppleAuthSupported = Platform.OS === 'ios';

export type AppleSignInResult = {
  ok: boolean;
  cancelled: boolean;
  errorMessage?: string;
};

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!isAppleAuthSupported) {
    return {
      ok: false,
      cancelled: false,
      errorMessage: 'Apple 로그인은 iOS 기기에서만 가능해요.',
    };
  }
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        ok: false,
        cancelled: false,
        errorMessage: '이 기기에서는 Apple 로그인이 지원되지 않아요.',
      };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    if (!credential.identityToken) {
      logger.error('appleSignIn: no identityToken');
      return {
        ok: false,
        cancelled: false,
        errorMessage: 'Apple 인증 토큰을 받지 못했어요.',
      };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) {
      logger.error('appleSignIn supabase failed', {
        code: error.status,
        message: error.message,
      });
      return { ok: false, cancelled: false, errorMessage: error.message };
    }
    logger.info('appleSignIn ok');
    return { ok: true, cancelled: false };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
      return { ok: false, cancelled: true };
    }
    logger.error('appleSignIn threw', {
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
