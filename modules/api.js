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

export function effectiveProvider() {
  return GEMINI_PROXY ? "gemini" : state.aiProvider;
}
