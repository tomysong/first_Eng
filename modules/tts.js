import { state, saveState } from "./store.js";
import { openaiTtsUrl, cloudTtsReady } from "./api.js";
import { $ } from "./dom.js";

// ---- 음성: OpenAI TTS 3종(여자/남자/여성아이). 키는 Worker에만 있음 ----

const VOICE_PRESETS = {
  female: {
    label: "여자 (기본)",
    voice: "nova",
    instructions:
      "Speak as a warm, friendly woman English teacher for a young Korean child. Clear, gentle, encouraging, at a slightly slow pace.",
  },
  male: {
    label: "남자",
    voice: "onyx",
    instructions:
      "Speak as a warm, friendly man English teacher for a young Korean child. Clear, gentle, encouraging, at a slightly slow pace.",
  },
  girl: {
    label: "여성 아이",
    voice: "coral",
    instructions:
      "Speak as a cheerful young girl friend for a young Korean child learning English. Bright, playful, clear, at a slightly slow pace.",
  },
};
const DEFAULT_PRESET = "female";

function currentPreset() {
  return VOICE_PRESETS[state.voiceName] ? state.voiceName : DEFAULT_PRESET;
}

// 클라우드(OpenAI) 음성이 안 될 때만 쓰는 기기 내장 음성 폴백 선택기
const PREFERRED_VOICES = [
  "Samantha",
  "Ava",
  "Allison",
  "Susan",
  "Zoe",
  "Nicky",
  "Karen",
  "Moira",
  "Google US English",
  "Google UK English Female",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Michelle",
  "Microsoft Zira",
];

function getBestVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const english = voices.filter((voice) => /^en/i.test(voice.lang));
  if (!english.length) return null;
  const sorted = [...english].sort(
    (a, b) => (/^en[-_]US/i.test(a.lang) ? 0 : 1) - (/^en[-_]US/i.test(b.lang) ? 0 : 1)
  );
  for (const name of PREFERRED_VOICES) {
    const matches = sorted.filter((voice) => voice.name.includes(name));
    if (matches.length) {
      return (
        matches.find((voice) => /natural|neural|enhanced|premium|online/i.test(voice.name)) ||
        matches[0]
      );
    }
  }
  return (
    sorted.find((voice) => /natural|neural|enhanced|premium/i.test(voice.name)) ||
    sorted.find((voice) => /^en[-_]US/i.test(voice.lang)) ||
    sorted[0]
  );
}

export function renderVoiceOptions() {
  const select = $("#voiceSelect");
  if (!select) return;
  select.innerHTML = "";
  Object.entries(VOICE_PRESETS).forEach(([key, preset]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = preset.label;
    select.appendChild(option);
  });
  select.value = currentPreset();
}

export function selectVoice() {
  state.voiceName = $("#voiceSelect").value || DEFAULT_PRESET;
  saveState();
  speak("Hi! Nice to meet you. Let's speak English together!");
}

// ---- 재생 엔진 ----

let speakSession = 0;
let currentAudio = null;
let cloudTtsBlockedUntil = 0;
const ttsCache = new Map();

// iOS Safari는 '사용자 제스처 중 한 번 재생한 적 있는' <audio>만 이후
// 프로그램적으로 재생할 수 있다. 오디오 요소 하나를 재사용하고,
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
  if (Date.now() < cloudTtsBlockedUntil) return false;
  return cloudTtsReady();
}

export function clearTtsCache() {
  ttsCache.forEach((url) => URL.revokeObjectURL(url));
  ttsCache.clear();
  cloudTtsBlockedUntil = 0;
}

// override = { voice, instructions } 가 있으면 그걸 사용 (캐릭터 음성용)
function resolveVoiceSpec(override) {
  if (override && override.voice) {
    return { voice: override.voice, instructions: override.instructions || "" };
  }
  const preset = VOICE_PRESETS[currentPreset()] || VOICE_PRESETS[DEFAULT_PRESET];
  return { voice: preset.voice, instructions: preset.instructions };
}

async function fetchOpenAiTts(text, override) {
  const spec = resolveVoiceSpec(override);
  const response = await fetch(openaiTtsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: spec.voice,
      input: text,
      response_format: "mp3",
      instructions: spec.instructions,
    }),
  });
  if (!response.ok) throw new Error("OpenAI TTS 오류");
  return URL.createObjectURL(await response.blob());
}

// 같은 문장에 대한 동시 요청은 하나로 합친다(프리페치+클릭 중복 방지)
const inflight = new Map();

function cacheKey(text, override) {
  const spec = resolveVoiceSpec(override);
  return `${spec.voice}:${text}`;
}

async function fetchCloudAudio(text, override) {
  const key = cacheKey(text, override);
  if (ttsCache.has(key)) return ttsCache.get(key);
  if (inflight.has(key)) return inflight.get(key);
  const promise = (async () => {
    const url = await fetchOpenAiTts(text, override);
    ttsCache.set(key, url);
    if (ttsCache.size > 40) {
      const oldest = ttsCache.keys().next().value;
      URL.revokeObjectURL(ttsCache.get(oldest));
      ttsCache.delete(oldest);
    }
    return url;
  })();
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

// 같은 문장을 다시 들을 때 즉시 재생되도록 미리 받아 캐시에 넣어둔다.
export function prefetchCloudAudio(text, override) {
  if (!cloudTtsEnabled() || !text) return;
  fetchCloudAudio(text, override).catch(() => {});
}

// 캐릭터(chatCharacters 항목) → speak/prefetch에 넘길 override 객체
export function characterVoiceOverride(character) {
  if (!character) return undefined;
  return {
    voice: character.openaiVoice,
    instructions: character.voiceInstructions || "",
  };
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

// override = { voice, instructions, rate, pitch } 형태. 캐릭터 음성에 사용.
export async function speak(text, rate = 0.92, pitch = 1.02, override) {
  speakSession += 1;
  await speakLine(text, rate, pitch, override);
}

export async function speakLine(text, rate, pitch, override) {
  stopAllAudio();
  if (cloudTtsEnabled()) {
    try {
      const url = await fetchCloudAudio(text, override);
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
