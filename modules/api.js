import { state } from "./store.js";

export const GEMINI_PROXY = "https://kid-eng-proxy.hssong1107.workers.dev";
const GEMINI_BASE = "https://generativelanguage.googleapis.com";

export function geminiUrl(model) {
  return `${GEMINI_PROXY || GEMINI_BASE}/v1beta/models/${model}:generateContent`;
}

export function geminiHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (!GEMINI_PROXY) headers["x-goog-api-key"] = state.aiKey;
  return headers;
}

export function geminiReady() {
  return Boolean(GEMINI_PROXY) || Boolean(state.aiKey);
}

// OpenAI TTS는 같은 Cloudflare Worker의 /openai 경로로 프록시한다.
// 키는 Worker 환경변수(OPENAI_KEY)에만 있고 앱에는 절대 노출되지 않는다.
export function openaiTtsUrl() {
  return `${GEMINI_PROXY}/openai/v1/audio/speech`;
}

export function cloudTtsReady() {
  return Boolean(GEMINI_PROXY);
}

export function effectiveProvider() {
  return GEMINI_PROXY ? "gemini" : state.aiProvider;
}
