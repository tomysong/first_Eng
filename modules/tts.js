import { state, saveState } from "./store.js";
import { GEMINI_PROXY, geminiUrl, geminiHeaders, effectiveProvider } from "./api.js";
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
  auto.textContent = "자동 추천 (자연스러운 영어 음성)";
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

// ---- AI(클라우드) TTS: API 키가 있으면 해당 AI의 음성으로 자동 전환 ----

let speakSession = 0;
let currentAudio = null;
let cloudTtsBlockedUntil = 0;
let geminiTtsModel = "";
const ttsCache = new Map();

const GEMINI_TTS_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"];

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
  // 기기 내장(브라우저) 음성만 사용한다.
  // 클라우드 TTS는 한 문장 ~4.5초로 느리고, 무료 한도(429)에 쉽게 걸려
  // 로봇 음성으로 폴백되는 문제가 있어 비활성화했다.
  return false;
}

export function defaultCloudVoice() {
  return effectiveProvider() === "gemini" ? "Leda" : "marin";
}

export function characterCloudVoice(character) {
  return effectiveProvider() === "gemini" ? character.geminiVoice : character.openaiVoice;
}

export function clearTtsCache() {
  ttsCache.forEach((url) => URL.revokeObjectURL(url));
  ttsCache.clear();
  cloudTtsBlockedUntil = 0;
  geminiTtsModel = "";
}

function pcmToWavBlob(base64, sampleRate) {
  const binary = atob(base64);
  const pcm = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) pcm[i] = binary.charCodeAt(i);

  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, pcm.length, true);
  return new Blob([header, pcm], { type: "audio/wav" });
}

async function fetchGeminiTts(text, voice) {
  const models = geminiTtsModel ? [geminiTtsModel] : GEMINI_TTS_MODELS;
  let lastError = new Error("Gemini TTS 오류");
  for (const model of models) {
    const response = await fetch(
      geminiUrl(model),
      {
        method: "POST",
        headers: geminiHeaders(),
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      lastError = new Error(data.error?.message || "Gemini TTS 오류");
      continue;
    }
    const base64 = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData
      ?.data;
    if (!base64) {
      lastError = new Error("Gemini TTS 응답에 오디오가 없어요");
      continue;
    }
    geminiTtsModel = model;
    // Gemini TTS는 24kHz 16bit mono PCM을 돌려준다
    return URL.createObjectURL(pcmToWavBlob(base64, 24000));
  }
  throw lastError;
}

async function fetchOpenAiTts(text, voice) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.aiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      response_format: "mp3",
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || "OpenAI TTS 오류");
  }
  return URL.createObjectURL(await response.blob());
}

async function fetchCloudAudio(text, voice) {
  const provider = effectiveProvider();
  const key = `${provider}:${voice}:${text}`;
  if (ttsCache.has(key)) return ttsCache.get(key);

  const url =
    provider === "gemini" ? await fetchGeminiTts(text, voice) : await fetchOpenAiTts(text, voice);
  ttsCache.set(key, url);
  if (ttsCache.size > 24) {
    const oldest = ttsCache.keys().next().value;
    URL.revokeObjectURL(ttsCache.get(oldest));
    ttsCache.delete(oldest);
  }
  return url;
}

function playUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.play().catch(resolve);
  });
}

export async function speak(text, rate = 0.86, pitch = 1.04, cloudVoice = "") {
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
      // 실패하면 1분간 클라우드 TTS를 쉬고 브라우저 음성으로 폴백
      cloudTtsBlockedUntil = Date.now() + 60000;
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
