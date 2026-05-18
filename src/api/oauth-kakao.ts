// Kakao 로그인 — Supabase Kakao provider 위에 WebBrowser 기반 OAuth flow.
// native module 이 없어 Expo Go / dev build 양쪽 모두에서 작동.

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type KakaoSignInResult = {
  ok: boolean;
  cancelled: boolean;
  errorMessage?: string;
};

export async function signInWithKakao(): Promise<KakaoSignInResult> {
  try {
    const redirectTo = Linking.createURL('auth-callback');
    // 디버그용 — Supabase Redirect URLs allow list 에 이 값이 등록돼 있어야 함.
    logger.info('kakaoSignIn redirectTo', { redirectTo });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      logger.error('kakaoSignIn init failed', {
        message: error?.message,
      });
      return {
        ok: false,
        cancelled: false,
        errorMessage: error?.message ?? 'Kakao 로그인 페이지를 열 수 없어요.',
      };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, cancelled: true };
    }
    if (result.type !== 'success' || !result.url) {
      logger.warn('kakaoSignIn webBrowser result not success', {
        type: result.type,
      });
      return { ok: false, cancelled: false };
    }

    // PKCE flow — ?code=... 가 redirect URL 에 도착.
    const url = result.url;
    const codeMatch = url.match(/[?&]code=([^&]+)/);
    if (codeMatch) {
      const code = decodeURIComponent(codeMatch[1]);
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        logger.error('kakaoSignIn exchange failed', {
          message: exchangeError.message,
        });
        return {
          ok: false,
          cancelled: false,
          errorMessage: exchangeError.message,
        };
      }
      logger.info('kakaoSignIn ok');
      return { ok: true, cancelled: false };
    }

    // implicit flow fallback — #access_token=...&refresh_token=...
    const hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      const hash = url.slice(hashIdx + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setError) {
          logger.error('kakaoSignIn setSession failed', {
            message: setError.message,
          });
          return {
            ok: false,
            cancelled: false,
            errorMessage: setError.message,
          };
        }
        logger.info('kakaoSignIn ok (implicit)');
        return { ok: true, cancelled: false };
      }
    }

    logger.warn('kakaoSignIn: no token in redirect url');
    return {
      ok: false,
      cancelled: false,
      errorMessage: '인증 토큰을 받지 못했어요.',
    };
  } catch (err) {
    logger.error('kakaoSignIn threw', {
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      cancelled: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
