import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as Linking from 'expo-linking';

import {
  getCurrentSession,
  subscribeAuthChanges,
} from '../api/auth';
import { upsertUser } from '../api/users';
import { ensureProfile } from '../api/profiles';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

type AuthValue = {
  currentUserId: string | null;
  loading: boolean;
  signedIn: boolean;
  // 이메일 인증 deep link 가 도착해 처리된 직후 한 줄 안내. AuthScreen 이 read.
  emailVerifiedNotice: string | null;
  clearEmailVerifiedNotice: () => void;
};

const DEFAULT: AuthValue = {
  currentUserId: null,
  loading: true,
  signedIn: false,
  emailVerifiedNotice: null,
  clearEmailVerifiedNotice: () => {},
};

const AuthContext = createContext<AuthValue>(DEFAULT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerifiedNotice, setEmailVerifiedNotice] = useState<string | null>(
    null,
  );

  // dulsai://auth-callback deep link 처리.
  // 이메일 인증 메일에서 돌아오는 redirect 의 code 또는 token 을 잡아 Supabase 세션을 만든다.
  useEffect(() => {
    let mounted = true;

    // 디버그: 현재 빌드에서 OS 가 인식하는 deep link prefix 확인.
    // - dev build / standalone : "dulsai://"
    // - Expo Go               : "exp://192.168.x.x:8081/--/" 형태 (dulsai 인식 X)
    logger.info('deep link prefix', {
      sample: Linking.createURL('auth-callback'),
    });

    const handleUrl = async (url: string | null) => {
      if (!mounted || !url) return;
      if (!url.startsWith('dulsai://auth-callback')) return;

      logger.info('auth deep link received', { url });

      // ?query 와 #fragment 양쪽 파싱.
      const queryIdx = url.indexOf('?');
      const hashIdx = url.indexOf('#');
      let code: string | null = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let errCode: string | null = null;
      let errDescription: string | null = null;

      if (queryIdx >= 0) {
        const end = hashIdx >= 0 && hashIdx > queryIdx ? hashIdx : url.length;
        const q = new URLSearchParams(url.slice(queryIdx + 1, end));
        code = q.get('code');
        errCode = q.get('error');
        errDescription = q.get('error_description');
      }
      if (hashIdx >= 0) {
        const h = new URLSearchParams(url.slice(hashIdx + 1));
        accessToken = accessToken ?? h.get('access_token');
        refreshToken = refreshToken ?? h.get('refresh_token');
        errCode = errCode ?? h.get('error');
        errDescription = errDescription ?? h.get('error_description');
      }

      if (errCode) {
        logger.warn('auth deep link error', {
          error: errCode,
          description: errDescription,
        });
        setEmailVerifiedNotice('이메일 인증이 완료되지 않았어요. 다시 시도해 주세요.');
        return;
      }

      if (code) {
        logger.info('auth deep link code found');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          logger.error('exchangeCodeForSession failed', {
            message: error.message,
          });
          setEmailVerifiedNotice('이메일 인증을 마무리하지 못했어요. 다시 로그인해 주세요.');
        } else {
          logger.info('exchangeCodeForSession ok');
          setEmailVerifiedNotice('이메일 인증이 완료되었어요.');
        }
        return;
      }

      if (accessToken && refreshToken) {
        logger.info('auth deep link tokens found');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          logger.error('setSession from deep link failed', {
            message: error.message,
          });
          setEmailVerifiedNotice('이메일 인증을 마무리하지 못했어요. 다시 로그인해 주세요.');
        } else {
          logger.info('setSession from deep link ok');
          setEmailVerifiedNotice('이메일 인증이 완료되었어요.');
        }
        return;
      }

      // code/token 모두 없음 — Supabase 서버에서는 이미 검증된 상태일 수 있음.
      logger.warn('auth deep link no code/token');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        logger.warn('getSession after deep link failed', {
          message: error.message,
        });
      }
      if (data?.session) {
        setEmailVerifiedNotice('이메일 인증이 완료되었어요.');
      } else {
        setEmailVerifiedNotice('이메일 인증이 완료되었습니다. 다시 로그인해 주세요.');
      }
    };

    // 콜드 스타트(앱이 종료된 상태에서 deep link 로 열린 경우).
    void Linking.getInitialURL().then((url) => handleUrl(url));

    // 핫 스타트(앱이 백그라운드에 있을 때 deep link 도착).
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = (userId: string | null) => {
      if (!mounted) return;
      setCurrentUserId(userId);
      if (userId) {
        // public.users.id === auth.users.id 보장. phone 컬럼은 더 이상 사용하지 않음.
        // 실패해도 로그인 흐름 자체는 진행 — Metro 로그만 남김.
        void upsertUser({ id: userId }).then((row) => {
          if (!row) {
            logger.warn('upsertUser returned null', { userId });
          }
        });
        // user_profiles 에 본인 row 가 없으면 빈 row 생성.
        void ensureProfile(userId);
      }
    };

    void getCurrentSession()
      .then((session) => {
        if (!mounted) return;
        applySession(session?.user?.id ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const unsub = subscribeAuthChanges((session) => {
      applySession(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      currentUserId,
      loading,
      signedIn: !!currentUserId,
      emailVerifiedNotice,
      clearEmailVerifiedNotice: () => setEmailVerifiedNotice(null),
    }),
    [currentUserId, loading, emailVerifiedNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

export function useCurrentUserId(): string | null {
  return useContext(AuthContext).currentUserId;
}
