#!/usr/bin/env node
// Apple Sign In Client Secret (JWT) 생성기.
//
// 외부 의존성 없이 Node.js 빌트인 crypto 만 사용한다.
// .p8 파일은 절대 로그에 출력하지 않으며, 메모리 안에서만 읽고 서명한다.
//
// 사용법(PowerShell 한 줄):
//   $env:APPLE_TEAM_ID="5CV6J5X2R7"; `
//   $env:APPLE_BUNDLE_ID="com.dulsai.app"; `
//   $env:APPLE_KEY_ID="8CFJ4S7MB8"; `
//   $env:APPLE_P8_PATH="C:\path\to\AuthKey_8CFJ4S7MB8.p8"; `
//   node scripts/generate-apple-client-secret.mjs
//
// 또는 argv 로:
//   node scripts/generate-apple-client-secret.mjs "C:\path\to\AuthKey_8CFJ4S7MB8.p8"
//
// 만료(일):
//   APPLE_EXP_DAYS=180  # 기본값. Apple 허용 최댓값은 180일(약 6개월).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const TEAM_ID = process.env.APPLE_TEAM_ID ?? '5CV6J5X2R7';
const BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? 'com.dulsai.app';
const KEY_ID = process.env.APPLE_KEY_ID ?? '8CFJ4S7MB8';
const P8_PATH = process.env.APPLE_P8_PATH ?? process.argv[2];
const EXP_DAYS_RAW = process.env.APPLE_EXP_DAYS ?? '180';

function fail(msg) {
  console.error(`[apple-client-secret] ${msg}`);
  process.exit(1);
}

if (!P8_PATH) {
  fail(
    'p8 파일 경로가 비었습니다. 환경변수 APPLE_P8_PATH 또는 argv[2] 로 전달하세요.',
  );
}

const expDays = Number(EXP_DAYS_RAW);
if (!Number.isFinite(expDays) || expDays <= 0 || expDays > 180) {
  fail('APPLE_EXP_DAYS 는 1~180 사이여야 합니다. (Apple 정책: 최대 6개월)');
}

const resolvedPath = path.resolve(P8_PATH);
if (!fs.existsSync(resolvedPath)) {
  fail(`p8 파일이 존재하지 않습니다: ${resolvedPath}`);
}

const pem = fs.readFileSync(resolvedPath, 'utf8');
if (!pem.includes('BEGIN PRIVATE KEY')) {
  fail(
    'PEM 헤더(BEGIN PRIVATE KEY)가 보이지 않습니다. Apple .p8 원본인지 다시 확인하세요.',
  );
}

let privateKey;
try {
  privateKey = crypto.createPrivateKey({ key: pem, format: 'pem' });
} catch (e) {
  fail(`p8 파일을 PEM 으로 읽지 못했습니다: ${e?.message ?? e}`);
}

const now = Math.floor(Date.now() / 1000);
const exp = now + expDays * 86400;

const header = { alg: 'ES256', typ: 'JWT', kid: KEY_ID };
const payload = {
  iss: TEAM_ID,
  iat: now,
  exp,
  aud: 'https://appleid.apple.com',
  sub: BUNDLE_ID,
};

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const headerB64 = b64url(JSON.stringify(header));
const payloadB64 = b64url(JSON.stringify(payload));
const signingInput = `${headerB64}.${payloadB64}`;

// dsaEncoding: 'ieee-p1363' → JWT 가 요구하는 raw r||s (64바이트). 기본 DER 안 됨.
const sigRaw = crypto.sign('SHA256', Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: 'ieee-p1363',
});
const sigB64 = b64url(sigRaw);

const jwt = `${signingInput}.${sigB64}`;

console.log('');
console.log('=== Apple Client Secret JWT ===');
console.log(jwt);
console.log('');
console.log('--- meta ---');
console.log(`iss (Team ID)   : ${TEAM_ID}`);
console.log(`sub (Bundle ID) : ${BUNDLE_ID}`);
console.log(`kid (Key ID)    : ${KEY_ID}`);
console.log(`aud             : https://appleid.apple.com`);
console.log(`alg             : ES256`);
console.log(`iat             : ${new Date(now * 1000).toISOString()}`);
console.log(`exp             : ${new Date(exp * 1000).toISOString()}`);
console.log(`만료까지         : ${expDays}일`);
console.log('');
console.log(
  '이 JWT 는 Supabase Authentication → Providers → Apple → "Secret Key (for OAuth)" 칸에 붙여 넣으세요.',
);
console.log(
  '만료일(exp) 전에 동일 스크립트로 재생성해서 갱신해야 Apple 로그인이 끊기지 않습니다.',
);
