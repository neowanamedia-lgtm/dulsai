// DulSai 글 작성 Edge Function.
// 클라이언트는 supabase.from('posts').insert(...) 를 직접 호출하지 않고 이 함수를 통한다.
// 서버 측 안전 필터(`_shared/safety.ts`) 를 통과해야만 service_role 로 insert.
//
// 요청:
//   POST { category: string, body: string }
//   Authorization: Bearer <user-jwt>
//
// 응답:
//   { ok: true, post: <DbPost row> }                  — 정상
//   { ok: false, error: 'safety_blocked', category, hint }
//   { ok: false, error: 'unauthorized' | 'invalid_body' | 'insert_failed', detail? }

// @ts-ignore - Deno
import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkSafetyServer } from '../_shared/safety.ts';

// @ts-ignore
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

  let payload: { category?: unknown; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_body' }, 400);
  }
  const category = typeof payload.category === 'string' ? payload.category : null;
  const bodyText = typeof payload.body === 'string' ? payload.body : null;
  // 공백만 입력은 거부. 최소 길이 제한은 없음. 최대 1000자.
  if (!category || !bodyText || bodyText.trim().length === 0) {
    return jsonResponse({ ok: false, error: 'invalid_body' }, 400);
  }
  if (bodyText.trim().length > 1000) {
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

  // 프로필 검증 — display_name 이 trim 후 비어 있으면 작성 차단.
  // gender 는 보조 정보로만 같이 저장 (옛 정책의 잔존, 없어도 허용).
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('gender, display_name')
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
        hint: '프로필 저장 후 글을 남길 수 있어요.',
      },
      422,
    );
  }
  const rawGender = (profile?.gender ?? null) as 'male' | 'female' | null;
  const authorGender: 'male' | 'female' | null =
    rawGender === 'male' || rawGender === 'female' ? rawGender : null;

  const { data, error } = await admin
    .from('posts')
    .insert({
      user_id: userId,
      category,
      body: bodyText.trim(),
      author_gender: authorGender,
    })
    .select('*')
    .maybeSingle();
  if (error) {
    return jsonResponse(
      { ok: false, error: 'insert_failed', detail: error.message },
      500,
    );
  }
  return jsonResponse({ ok: true, post: data }, 200);
});
