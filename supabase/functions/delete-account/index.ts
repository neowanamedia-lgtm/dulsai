// DulSai 계정 탈퇴 Edge Function.
// 호출자의 JWT 로 user.id 를 식별한 뒤 service_role 키로 cascade 삭제 + auth.users 행 제거.
//
// 환경변수 (Supabase 가 자동 주입):
//   - SUPABASE_URL
//   - SUPABASE_ANON_KEY
//   - SUPABASE_SERVICE_ROLE_KEY
//
// Deploy:
//   supabase functions deploy delete-account
//
// 클라이언트 호출:
//   supabase.functions.invoke('delete-account')

// @ts-ignore - Deno 환경(Edge Functions). 로컬 RN 빌드에는 포함되지 않음 (tsconfig exclude).
import { createClient } from 'npm:@supabase/supabase-js@2';

// @ts-ignore - Deno global
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore - Deno global
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
// @ts-ignore - Deno global
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// @ts-ignore - Deno.serve
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  // 1. 호출자 식별 (anon 클라이언트 + 사용자 JWT)
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: getUserError } =
    await userClient.auth.getUser();
  if (getUserError || !userData.user) {
    return jsonResponse(
      { error: 'invalid_token', detail: getUserError?.message },
      401,
    );
  }
  const userId = userData.user.id;

  // 2. service_role 클라이언트로 cascade 삭제.
  //
  // 정책:
  //   - 개인 식별 정보(profile / photos / blocks / reports / invites / conversations) 는 제거.
  //   - 작성한 글(posts) / 답글(post_comments) 본문은 다른 사용자의 대화 흐름 보호 목적으로
  //     "유지" 한다. 단 작성자 user_id 컬럼은 그대로 두어 운영자가 추후 익명 라벨링 가능.
  //   - public.users 행도 제거하지 않는다(외래키 무결성을 위해 필요).
  //   - auth.users 만 마지막에 deleteUser 로 제거 → 동일 이메일/OAuth 로 재가입 가능.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const steps: Array<{ label: string; run: () => Promise<unknown> }> = [
    {
      label: 'content_reports (by reporter)',
      run: () =>
        admin.from('content_reports').delete().eq('reporter_id', userId),
    },
    {
      label: 'user_blocks (by blocker)',
      run: () => admin.from('user_blocks').delete().eq('blocker_id', userId),
    },
    {
      label: 'user_blocks (by blocked)',
      run: () => admin.from('user_blocks').delete().eq('blocked_id', userId),
    },
    {
      label: 'conversation_invites (sender/receiver)',
      run: () =>
        admin
          .from('conversation_invites')
          .delete()
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    },
    {
      label: 'conversations (user_a/user_b)',
      run: () =>
        admin
          .from('conversations')
          .delete()
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
    },
    {
      label: 'profile_photos',
      run: () =>
        admin.from('profile_photos').delete().eq('user_id', userId),
    },
    {
      label: 'user_profiles',
      run: () => admin.from('user_profiles').delete().eq('user_id', userId),
    },
    // posts / post_comments / public.users 는 의도적으로 보존.
    // 글·답글 본문이 사라지면 다른 사용자의 대화 맥락이 깨지므로 유지한다.
  ];

  const stepErrors: Array<{ step: string; message: string }> = [];
  for (const s of steps) {
    try {
      const result = (await s.run()) as { error?: { message?: string } | null };
      if (result?.error) {
        stepErrors.push({
          step: s.label,
          message: result.error.message ?? 'unknown',
        });
      }
    } catch (err) {
      stepErrors.push({
        step: s.label,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 3. auth.users 삭제 — 위 단계 일부 실패해도 마지막은 시도한다 (잔존 데이터 정리는 운영에서).
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return jsonResponse(
      {
        error: 'auth_delete_failed',
        message: deleteAuthError.message,
        stepErrors,
      },
      500,
    );
  }

  return jsonResponse({ ok: true, userId, stepErrors });
});
