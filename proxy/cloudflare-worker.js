// ============================================================
// AI초딩영어 — Gemini API 프록시 (Cloudflare Worker)
//
// 목적: API 키를 앱(브라우저)에 노출하지 않기 위해, 키는 이 서버에만
//       보관하고 앱은 이 주소로만 요청한다. 키는 절대 외부로 나가지 않는다.
//
// 배포 방법은 같은 폴더의 README.md 를 보세요. 요약:
//   1) Cloudflare 대시보드 → Workers & Pages → Create Worker
//   2) 이 파일 내용을 코드 칸에 붙여넣고 Deploy
//   3) Settings → Variables → "GEMINI_KEY" 시크릿에 본인 Gemini 키 입력
//   4) 배포된 주소(...workers.dev)를 app.js 의 GEMINI_PROXY 에 넣기
// ============================================================

// 우리 앱이 올라간 주소만 허용한다. 다른 사이트에서 이 프록시를 못 쓰게 막는다.
const ALLOWED_ORIGINS = [
  "https://tomysong.github.io",
  "http://localhost:4173", // 로컬 개발용
  "http://127.0.0.1:4173",
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_PATH = "/openai/v1/audio/speech";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_CHAT_PATH = "/openai/v1/chat/completions";
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_BLOCK_SECONDS = 600;
const MAX_BODY_BYTES = 30_000;

// 키 변수 이름을 조금 틀리게 넣어도 잡아주도록 흔한 이름들을 모두 확인한다
const KEY_NAMES = [
  "GEMINI_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_GENAI_API_KEY",
  "GENAI_API_KEY",
  "API_KEY",
];

// OpenAI TTS 키 (음성 합성용). Gemini 키와 별개로 관리한다.
const OPENAI_KEY_NAMES = ["OPENAI_KEY", "OPENAI_API_KEY"];

function readKeyFrom(env, names) {
  // 정확한 이름 우선
  for (const name of names) {
    const value = env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  // 변수 이름 앞뒤에 실수로 공백이 들어갔어도 잡아준다
  for (const [name, value] of Object.entries(env)) {
    if (typeof value === "string" && value.trim() && names.includes(name.trim())) {
      return value.trim();
    }
  }
  return "";
}

function readKey(env) {
  return readKeyFrom(env, KEY_NAMES);
}

function readOpenAiKey(env) {
  return readKeyFrom(env, OPENAI_KEY_NAMES);
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(body, status, cors, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function getClientIp(request) {
  const forwarded = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
  return forwarded.split(",")[0].trim() || "unknown";
}

function safeKeyPart(value) {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "_");
}

async function applyRateLimit(request, env) {
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true, enabled: false };
  }

  const now = Date.now();
  const clientIp = safeKeyPart(getClientIp(request));
  const blockedKey = `rl:block:${clientIp}`;
  const blockedUntil = Number(await env.RATE_LIMIT_KV.get(blockedKey) || 0);

  if (blockedUntil > now) {
    return {
      allowed: false,
      enabled: true,
      retryAfter: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
      remaining: 0,
    };
  }

  const bucket = Math.floor(now / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const bucketKey = `rl:count:${clientIp}:${bucket}`;
  const currentCount = Number(await env.RATE_LIMIT_KV.get(bucketKey) || 0);

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    const nextBlockedUntil = now + RATE_LIMIT_BLOCK_SECONDS * 1000;
    await env.RATE_LIMIT_KV.put(blockedKey, String(nextBlockedUntil), {
      expirationTtl: RATE_LIMIT_BLOCK_SECONDS,
    });
    return {
      allowed: false,
      enabled: true,
      retryAfter: RATE_LIMIT_BLOCK_SECONDS,
      remaining: 0,
    };
  }

  await env.RATE_LIMIT_KV.put(bucketKey, String(currentCount + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 60,
  });

  const resetIn = RATE_LIMIT_WINDOW_SECONDS - Math.floor((now / 1000) % RATE_LIMIT_WINDOW_SECONDS);
  return {
    allowed: true,
    enabled: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - (currentCount + 1)),
    resetIn,
  };
}

function rateLimitHeaders(result) {
  if (!result.enabled) return {};
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
    "X-RateLimit-Remaining": String(result.remaining ?? 0),
    "X-RateLimit-Window": String(RATE_LIMIT_WINDOW_SECONDS),
    ...(result.resetIn ? { "X-RateLimit-Reset": String(result.resetIn) } : {}),
    ...(result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {}),
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // 진단용: GET 요청 시 키 값은 절대 노출하지 않고, 등록된 변수 이름과
    // 키 감지 여부만 알려준다. 설정이 맞는지 확인하는 용도.
    if (request.method === "GET") {
      return jsonResponse({
        ok: Boolean(readKey(env)),
        keyDetected: Boolean(readKey(env)),
        openaiKeyDetected: Boolean(readOpenAiKey(env)),
        variableNamesFound: Object.keys(env).filter((name) => typeof env[name] === "string"),
        expectedOneOf: KEY_NAMES,
        openaiExpectedOneOf: OPENAI_KEY_NAMES,
        rateLimitKVBound: Boolean(env.RATE_LIMIT_KV),
        rateLimitRule: {
          windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
          maxRequests: RATE_LIMIT_MAX_REQUESTS,
          blockSeconds: RATE_LIMIT_BLOCK_SECONDS,
          maxBodyBytes: MAX_BODY_BYTES,
        },
      }, 200, cors);
    }

    // 허용 목록에 없는 사이트의 브라우저 요청은 막는다
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden origin", { status: 403, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    const url = new URL(request.url);
    // 허용 경로: Gemini generateContent + OpenAI TTS. 그 외는 모두 차단.
    const isGemini = /^\/v1beta\/models\/[^/]+:generateContent$/.test(url.pathname);
    const isOpenAiTts = url.pathname === OPENAI_TTS_PATH;
    const isOpenAiChat = url.pathname === OPENAI_CHAT_PATH;
    if (!isGemini && !isOpenAiTts && !isOpenAiChat) {
      return new Response("Not Found", { status: 404, headers: cors });
    }
    const apiKey = isGemini ? readKey(env) : readOpenAiKey(env);
    if (!apiKey) {
      return new Response(isGemini ? "Server missing GEMINI_KEY" : "Server missing OPENAI_KEY", {
        status: 500,
        headers: cors,
      });
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({
        error: "Request body too large",
        limitBytes: MAX_BODY_BYTES,
      }, 413, cors);
    }

    const limitResult = await applyRateLimit(request, env);
    if (!limitResult.allowed) {
      return jsonResponse({
        error: "Too many requests",
        message: "Please wait a little and try again.",
        retryAfterSeconds: limitResult.retryAfter,
      }, 429, cors, rateLimitHeaders(limitResult));
    }

    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return jsonResponse({
        error: "Request body too large",
        limitBytes: MAX_BODY_BYTES,
      }, 413, cors, rateLimitHeaders(limitResult));
    }

    const upstream = isGemini
      ? await fetch(`${GEMINI_BASE}${url.pathname}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body,
        })
      : await fetch(isOpenAiTts ? OPENAI_TTS_URL : OPENAI_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        });

    const headers = new Headers(cors);
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    for (const [key, value] of Object.entries(rateLimitHeaders(limitResult))) {
      headers.set(key, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
