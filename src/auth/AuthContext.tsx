import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getCurrentSession,
  subscribeAuthChanges,
} from '../api/auth';
import { upsertUser } from '../api/users';
import { logger } from '../lib/logger';

type AuthValue = {
  currentUserId: string | null;
  loading: boolean;
  signedIn: boolean;
};

const DEFAULT: AuthValue = {
  currentUserId: null,
  loading: true,
  signedIn: false,
};

const AuthContext = createContext<AuthValue>(DEFAULT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applySession = (
      userId: string | null,
      phone: string | null,
      verified: boolean,
    ) => {
      if (!mounted) return;
      setCurrentUserId(userId);
      if (userId) {
        // public.users.id === auth.users.id 보장을 위해 본인 row 를 upsert.
        // 실패해도 로그인 흐름 자체는 진행 — Metro 로그만 남김.
        void upsertUser({
          id: userId,
          phone,
          phone_verified: verified,
        }).then((row) => {
          if (!row) {
            logger.warn('upsertUser returned null', { userId });
          }
        });
      }
    };

    void getCurrentSession()
      .then((session) => {
        if (!mounted) return;
        applySession(
          session?.user?.id ?? null,
          session?.user?.phone ?? null,
          !!session?.user?.phone_confirmed_at,
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const unsub = subscribeAuthChanges((session) => {
      applySession(
        session?.user?.id ?? null,
        session?.user?.phone ?? null,
        !!session?.user?.phone_confirmed_at,
      );
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
    }),
    [currentUserId, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

export function useCurrentUserId(): string | null {
  return useContext(AuthContext).currentUserId;
}
