import { state, saveState } from "./store.js";
import { openaiTtsUrl, cloudTtsReady } from "./api.js";
import { $ } from "./dom.js";

// 자연스러운 영어 음성 우선순위 (Apple → Google → Microsoft)
const PREFERRED_VOICES = [
  // Apple (iOS/macOS) — 또렷하고 자연스러운 음성
  "Samantha",
  "Ava",
  "Allison",
  "Susan",
  "Zoe",
  "Nicky",
  "Karen",
  "Moira",
  // Google (Android/Chrome)
  "Google US English",
  "Google UK English Female",
  // Microsoft (Windows/Edge) — Neural/Online이 가장 자연스러움
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Michelle",
  "Microsoft Zira",
];

export function getBestVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  // 반드시 영어 음성만 쓴다(한국어 음성으로 영어를 읽으면 매우 어색해짐)
  const english = voices.filter((voice) => /^en/i.test(voice.lang));
  if (!english.length) return null;

  // 사용자가 직접 고른 목소리가 있으면 최우선
  if (state.voiceName) {
    const saved = english.find((voice) => voice.name === state.voiceName);
    if (saved) return saved;
  }

  // 미국 영어를 앞쪽으로 정렬
  const sorted = [...english].sort(
    (a, b) => (/^en[-_]US/i.test(a.lang) ? 0 : 1) - (/^en[-_]US/i.test(b.lang) ? 0 : 1)
  );

  // 선호 음성명 + 고품질 변형(natural/neural/enhanced/premium/online) 우선
  for (const name of PREFERRED_VOICES) {
    const matches = sorted.filter((voice) => voice.name.includes(name));
    if (matches.length) {
      return (
        matches.find((voice) => /natural|neural|enhanced|premium|online/i.test(voice.name)) ||
        matches[0]
      );
    }
  }

  // 선호 목록에 없으면: 고품질 키워드 음성 → 미국 영어 → 아무 영어
  return (
    sorted.find((voice) => /natural|neural|enhanced|premium/i.test(voice.name)) ||
    sorted.find((voice) => /^en[-_]US/i.test(voice.lang)) ||
    sorted[0]
  );
}

// macOS의 효과음/장난 음성은 학습용 목록에서 제외
const NOVELTY_VOICES =
  /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox/i;

export function listLearningVoices() {
  return (window.speechSynthesis?.getVoices?.() || [])
    .filter((voice) => /^en/i.test(voice.lang) && !NOVELTY_VOICES.test(voice.name))
    .sort((a, b) => {
      const rank = (voice) =>
        (/Ava|Samantha|Allison|Susan|Joelle|Google US English|Aria|Jenny|Michelle|Zoe|Serena/i.test(voice.name)
          ? 0
          : 2) + (/^en-US/i.test(voice.lang) ? 0 : 1);
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
}

export function renderVoiceOptions() {
  const select = $("#voiceSelect");
  if (!select) return;
  const english = listLearningVoices();

  select.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = cloudTtsReady() ? "자동 (AI 자연 음성)" : "자동 추천 (영어 음성)";
  select.appendChild(auto);

  english.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    select.appendChild(option);
  });

  select.value = english.some((voice) => voice.name === state.voiceName) ? state.voiceName : "";
}

export function selectVoice() {
  state.voiceName = $("#voiceSelect").value;
  saveState();
  speak("Hi! Nice to meet you. Let's speak English together!", 0.88);
}

// ---- 클라우드 TTS: OpenAI 자연 음성. 키는 Worker(OPENAI_KEY)에만 있음 ----

let speakSession = 0;
let currentAudio = null;
let cloudTtsBlockedUntil = 0;
const ttsCache = new Map();

// 기본 음성(문장·대화 읽기). OpenAI gpt-4o-mini-tts의 voice.
const DEFAULT_OPENAI_VOICE = "nova";
// 아이 학습에 맞춘 말투 지시 (gpt-4o-mini-tts instructions)
const TTS_INSTRUCTIONS =
  "Speak in a warm, friendly, encouraging voice for a young child learning English. Use clear, natural intonation at a slightly slow, gentle pace.";

// iOS Safari는 '사용자 제스처 중 한 번 재생한 적 있는' <audio>만 이후
// 프로그램적으로 재생할 수 있다. 그래서 오디오 요소 하나를 재사용하고,
// 첫 터치에서 무음으로 깨워둔다(primeAudio → app.js의 첫 클릭에서 호출).
let sharedAudio = null;
let audioPrimed = false;

export function primeAudio() {
  if (audioPrimed) return;
  audioPrimed = true;
  sharedAudio = new Audio();
  sharedAudio.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
  sharedAudio.play().then(() => sharedAudio.pause()).catch(() => {});
}

export function bumpSpeakSession() {
  speakSession += 1;
  return speakSession;
}

export function getSpeakSession() {
  return speakSession;
}

export function stopAllAudio() {
  window.speechSynthesis?.cancel?.();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

export function cloudTtsEnabled() {
  // 사용자가 기기 음성을 직접 고르면 그걸 쓰고, 아니면 OpenAI 클라우드 음성.
  if (state.voiceName) return false;
  if (Date.now() < cloudTtsBlockedUntil) return false;
  return cloudTtsReady();
}

export function defaultCloudVoice() {
  return DEFAULT_OPENAI_VOICE;
}

export function characterCloudVoice(character) {
  return character.openaiVoice || DEFAULT_OPENAI_VOICE;
}

export function clearTtsCache() {
  ttsCache.forEach((url) => URL.revokeObjectURL(url));
  ttsCache.clear();
  cloudTtsBlockedUntil = 0;
}

async function fetchOpenAiTts(text, voice) {
  const response = await fetch(openaiTtsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: voice || DEFAULT_OPENAI_VOICE,
      input: text,
      response_format: "mp3",
      instructions: TTS_INSTRUCTIONS,
    }),
  });
  if (!response.ok) throw new Error("OpenAI TTS 오류");
  return URL.createObjectURL(await response.blob());
}

async function fetchCloudAudio(text, voice) {
  const key = `${voice}:${text}`;
  if (ttsCache.has(key)) return ttsCache.get(key);

  const url = await fetchOpenAiTts(text, voice);
  ttsCache.set(key, url);
  if (ttsCache.size > 40) {
    const oldest = ttsCache.keys().next().value;
    URL.revokeObjectURL(ttsCache.get(oldest));
    ttsCache.delete(oldest);
  }
  return url;
}

// 같은 문장을 다시 들을 때 즉시 재생되도록 미리 받아 캐시에 넣어둔다.
export function prefetchCloudAudio(text, voice = DEFAULT_OPENAI_VOICE) {
  if (!cloudTtsEnabled() || !text) return;
  fetchCloudAudio(text, voice).catch(() => {});
}

function playUrl(url) {
  return new Promise((resolve) => {
    const audio = sharedAudio || new Audio();
    audio.src = url;
    currentAudio = audio;
    audio.onended = audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    const played = audio.play();
    if (played && typeof played.catch === "function") played.catch(() => resolve());
  });
}

export async function speak(text, rate = 0.92, pitch = 1.02, cloudVoice = "") {
  speakSession += 1;
  await speakLine(text, rate, pitch, cloudVoice);
}

export async function speakLine(text, rate, pitch, cloudVoice) {
  stopAllAudio();
  if (cloudTtsEnabled()) {
    try {
      const url = await fetchCloudAudio(text, cloudVoice || defaultCloudVoice());
      await playUrl(url);
      return;
    } catch {
      // 실패하면 잠깐(20초) 클라우드를 쉬고 기기 음성으로 폴백
      cloudTtsBlockedUntil = Date.now() + 20000;
    }
  }
  await speakLocal(text, rate, pitch);
}

export function speakLocal(text, rate, pitch) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      $("#coachLine").textContent = "이 브라우저에서는 듣기 기능을 지원하지 않아요.";
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.voice = getBestVoice();
    utterance.onend = utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
