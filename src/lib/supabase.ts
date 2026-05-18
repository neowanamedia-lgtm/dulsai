import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { logger } from './logger';
import type { Database } from '../types/db';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const configured = typeof url === 'string' && url.length > 0
  && typeof anonKey === 'string' && anonKey.length > 0;

if (!configured) {
  logger.warn('Supabase env not set', {
    hasUrl: !!url,
    hasKey: !!anonKey,
  });
}

// configured 가 false 라도 client 자체는 만들어 두고, 호출 시점에 isSupabaseConfigured 로 가드한다.
// 사용자 노출 메시지는 호출 측에서 처리하지 않고, 내부 logger 에만 기록한다.
export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // 모바일 OAuth (Kakao 등) 에서 안전한 PKCE flow 사용.
      // signInWithOAuth → exchangeCodeForSession 흐름을 위해 필수.
      flowType: 'pkce',
      detectSessionInUrl: false,
    },
  },
);

export function isSupabaseConfigured(): boolean {
  return configured;
}
