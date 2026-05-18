// DulSai — 운영용 메일 발송 Edge Function.
//
// 호출 위치:
//   - 모더레이션 결과 안내 / 신고 결과 / 운영 알림 등 "Supabase Auth 가 직접 보내지 않는" 커스텀 메일.
//   - 회원가입 인증 / 비밀번호 재설정 메일은 이 함수가 아니라 Supabase Auth (SMTP) 가 직접 처리한다.
//
// 보안 원칙:
//   - RESEND_API_KEY, MAIL_FROM 은 모두 Supabase Edge Function secrets 로만 주입.
//     ▸ supabase secrets set RESEND_API_KEY=re_xxx
//     ▸ supabase secrets set "MAIL_FROM=DulSai <noreply@dulsai.com>"
//   - 클라이언트(RN 앱) 에서 직접 호출하는 경우 RLS / verify_jwt 로 인증된 요청만 허용.
//   - 익명 호출 차단 — Authorization 헤더의 Supabase JWT 검증을 supabase functions 자체가 처리.
//
// 배포:
//   supabase functions deploy send-mail
//
// 호출 예 (클라이언트):
//   const { data, error } = await supabase.functions.invoke('send-mail', {
//     body: { to: 'someone@example.com', subject: '...', html: '<p>...</p>' },
//   });

// @ts-nocheck — Deno 런타임. 로컬 TS 타입체크 (Node) 와는 분리된 환경.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type SendMailRequest = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
};

type SendMailResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('MAIL_FROM') ?? 'DulSai <noreply@dulsai.com>';
  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'missing_resend_api_key' }, 500);
  }

  let body: SendMailRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const { to, subject, html, text } = body ?? {};
  if (!to || !subject || (!html && !text)) {
    return jsonResponse(
      { ok: false, error: 'missing_required_fields' },
      400,
    );
  }

  const recipients = Array.isArray(to) ? to : [to];

  const upstream = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
      text,
    }),
  });

  if (!upstream.ok) {
    const msg = await upstream.text();
    return jsonResponse(
      { ok: false, error: `resend_failed:${upstream.status}:${msg}` },
      502,
    );
  }

  const data = (await upstream.json()) as { id?: string };
  const result: SendMailResponse = { ok: true, id: data.id ?? '' };
  return jsonResponse(result, 200);
});

function jsonResponse(payload: SendMailResponse, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
