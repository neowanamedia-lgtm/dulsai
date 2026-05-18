// DulSai 답글 작성 Edge Function.
// create-post 와 동일 패턴. 추가로 답글 한도(10개) 서버 측 enforce.
//
// 요청:
//   POST { post_id: string, body: string }
//   Authorization: Bearer <user-jwt>
//
// 응답:
//   { ok: true, comment: <DbPostComment row> }
//   { ok: false, error: 'safety_blocked' | 'reply_limit_reached' | 'unauthorized' | 'invalid_body' | 'insert_failed', ... }

// @ts-ignore - Deno
import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkSafetyServer } from '../_shared/safety.ts';

// @ts-ignore
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const REPLY_MAX_CHARS = 500;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ ok: false, error: 'server_misconfigured' }, 500);
  }

  let payload: { post_id?: unknown; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_body' }, 400);
  }
  const postId = typeof payload.post_id === 'string' ? payload.post_id : null;
  const bodyText = typeof payload.body === 'string' ? payload.body : null;
  // 공백만 입력은 거부. 최소 길이 제한 없음. 최대 500자.
  if (!postId || !bodyText || bodyText.trim().length === 0) {
    return jsonResponse({ ok: false, error: 'invalid_body' }, 400);
  }
  if (bodyText.trim().length > REPLY_MAX_CHARS) {
    return jsonResponse({ ok: false, error: 'too_long' }, 400);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: getUserError } =
    await userClient.auth.getUser();
  if (getUserError || !userData.user) {
    return jsonResponse(
      { ok: false, error: 'unauthorized', detail: getUserError?.message },
      401,
    );
  }
  const userId = userData.user.id;

  const safety = checkSafetyServer(bodyText);
  if (!safety.ok) {
    return jsonResponse(
      {
        ok: false,
        error: 'safety_blocked',
        category: safety.category,
        kinds: safety.kinds,
        hint: safety.hint,
      },
      422,
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 프로필 검증 — display_name 이 비어 있으면 답글 작성 차단 (익명 작성 방지).
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();
  if (profileError) {
    return jsonResponse(
      { ok: false, error: 'profile_lookup_failed', detail: profileError.message },
      500,
    );
  }
  const displayName = (profile?.display_name ?? '').trim();
  if (displayName.length === 0) {
    return jsonResponse(
      {
        ok: false,
        error: 'profile_required',
        hint: '프로필 저장 후 답글을 남길 수 있어요.',
      },
      422,
    );
  }

  // 정책: 누구나 / 자기 글에도 / 답글 개수 제한 없음.
  // (안전 필터는 본문에 대해 위에서 이미 적용)

  const { data, error } = await admin
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      body: bodyText.trim(),
    })
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.message?.includes('reply_limit_reached')) {
      return jsonResponse({ ok: false, error: 'reply_limit_reached' }, 409);
    }
    return jsonResponse(
      { ok: false, error: 'insert_failed', detail: error.message },
      500,
    );
  }
  return jsonResponse({ ok: true, comment: data }, 200);
});
