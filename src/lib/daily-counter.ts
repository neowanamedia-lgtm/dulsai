// 하루 단위 카운터. AsyncStorage 의 키 prefix + YYYY-MM-DD 로 보관.
// 사용처: 대화방 사진 일일 전송 한도(20장) 등.
// 한국 KST 기준 로컬 날짜를 그대로 사용 — 자정 기준 리셋.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from './logger';

function todayKey(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${prefix}:${y}-${m}-${day}`;
}

export async function loadDailyCount(prefix: string): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(todayKey(prefix));
    if (!v) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (err) {
    logger.warn('loadDailyCount failed', {
      prefix,
      message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

export async function bumpDailyCount(
  prefix: string,
  delta: number,
): Promise<number> {
  try {
    const cur = await loadDailyCount(prefix);
    const next = cur + delta;
    await AsyncStorage.setItem(todayKey(prefix), String(next));
    return next;
  } catch (err) {
    logger.warn('bumpDailyCount failed', {
      prefix,
      delta,
      message: err instanceof Error ? err.message : String(err),
    });
    return -1;
  }
}
