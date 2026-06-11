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

// 키 변수 이름을 조금 틀리게 넣어도 잡아주도록 흔한 이름들을 모두 확인한다
const KEY_NAMES = [
  "GEMINI_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_GENAI_API_KEY",
  "GENAI_API_KEY",
  "API_KEY",
];

function readKey(env) {
  // 정확한 이름 우선
  for (const name of KEY_NAMES) {
    const value = env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  // 변수 이름 앞뒤에 실수로 공백이 들어갔어도 잡아준다
  for (const [name, value] of Object.entries(env)) {
    if (typeof value === "string" && value.trim() && KEY_NAMES.includes(name.trim())) {
      return value.trim();
    }
  }
  return "";
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
      const body = {
        ok: Boolean(readKey(env)),
        keyDetected: Boolean(readKey(env)),
        variableNamesFound: Object.keys(env).filter((name) => typeof env[name] === "string"),
        expectedOneOf: KEY_NAMES,
      };
      return new Response(JSON.stringify(body, null, 2), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 허용 목록에 없는 사이트의 브라우저 요청은 막는다
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden origin", { status: 403, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    const url = new URL(request.url);
    // Gemini generateContent 경로만 통과시킨다 (다른 호출 차단)
    if (!/^\/v1beta\/models\/[^/]+:generateContent$/.test(url.pathname)) {
      return new Response("Not Found", { status: 404, headers: cors });
    }
    const apiKey = readKey(env);
    if (!apiKey) {
      return new Response("Server missing GEMINI_KEY", { status: 500, headers: cors });
    }

    const body = await request.text();
    const upstream = await fetch(`${GEMINI_BASE}${url.pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body,
    });

    const headers = new Headers(cors);
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
