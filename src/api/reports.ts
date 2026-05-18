// 콘텐츠 신고. content_reports 테이블에 insert 한다.
// 운영자는 Supabase Dashboard 의 SQL editor 에서 정기적으로 status='open' row 를 검토한다.

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type ReportTargetType =
  | 'user'
  | 'post'
  | 'reply'
  | 'message'
  | 'conversation';

export type ReportReasonKind =
  | 'harassment_hate' // 괴롭힘·혐오·차별
  | 'sexual' // 성희롱·성적 콘텐츠
  | 'minor_risk' // 미성년자 위험 (CSAM 의심·미성년 대상 부적절 접근)
  | 'spam' // 스팸·광고·도배
  | 'impersonation' // 사칭
  | 'self_harm' // 자해·자살 위험
  | 'private_info' // 개인정보 노출 요구·유도
  | 'other';

// 사용자에게 보여줄 사유 라벨. (한국어)
export const REPORT_REASON_LABELS: Record<ReportReasonKind, string> = {
  harassment_hate: '괴롭힘·혐오',
  sexual: '성희롱',
  minor_risk: '미성년자 위험',
  spam: '스팸·광고',
  impersonation: '사칭',
  self_harm: '자해 위험',
  private_info: '개인정보 노출 요구',
  other: '기타',
};

export type ReportResult = {
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export async function reportContent(args: {
  targetType: ReportTargetType;
  targetId: string;
  reasonKind: ReportReasonKind;
  reasonDetail?: string;
}): Promise<ReportResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, errorMessage: '로그인 후 다시 시도해 주세요.' };
  }

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    target_type: args.targetType,
    target_id: args.targetId,
    reason_kind: args.reasonKind,
    reason_detail: args.reasonDetail ?? null,
  });

  if (error) {
    logger.error('reportContent failed', {
      code: error.code,
      message: error.message,
      targetType: args.targetType,
    });
    return {
      ok: false,
      errorCode: error.code ?? undefined,
      errorMessage: error.message,
    };
  }
  logger.info('reportContent ok', {
    targetType: args.targetType,
    reasonKind: args.reasonKind,
  });
  return { ok: true };
}
