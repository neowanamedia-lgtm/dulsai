// 마지막 로그인 시 사용한 이메일만 보관.
// 비밀번호는 절대 저장하지 않는다 — OS Keychain / Password Manager 가 대신 처리한다.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from './logger';

const KEY = 'dulsai:lastLoginEmail';

export async function getLastLoginEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch (err) {
    logger.warn('getLastLoginEmail failed', {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function setLastLoginEmail(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) return;
  try {
    await AsyncStorage.setItem(KEY, trimmed);
  } catch (err) {
    logger.warn('setLastLoginEmail failed', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function clearLastLoginEmail(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (err) {
    logger.warn('clearLastLoginEmail failed', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
