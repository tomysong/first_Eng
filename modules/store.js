import { storeGet, storeSet } from "./profiles.js";

export function readArray(name) {
  try {
    const value = JSON.parse(storeGet(name) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const state = {
  level: storeGet("level") || "",
  progressDay: Number(storeGet("day") || 1),
  viewDay: 1,
  streak: Number(storeGet("streak") || 0),
  lastCompletedDate: storeGet("lastCompletedDate") || "",
  lastCompletedDay: Number(storeGet("lastCompletedDay") || 0),
  versionComplete: storeGet("versionComplete") === "true",
  updateRequested: storeGet("updateRequested") === "true",
  quizIndex: 0,
  score: 0,
  sentenceIndex: 0,
  // AI 설정과 목소리는 기기 공통(부모가 한 번만 입력)
  aiProvider: localStorage.getItem("kidEnglish.aiProvider") || "gemini",
  aiKey: localStorage.getItem("kidEnglish.aiKey") || "",
  chatCharacter: storeGet("chatCharacter") || "sunny",
  voiceName: localStorage.getItem("kidEnglish.voiceName") || "",
  chatMessages: readArray("chatMessages"),
  lastAiReply: storeGet("lastAiReply") || "",
  weakPhrases: readArray("weakPhrases"),
  bossCleared: readArray("bossCleared"),
  bossKey: "",
  bossTargets: [],
  bossPassed: [],
  talkMissionKey: "",
  talkMissions: [],
  talkMissionDone: [],
  // 화분 보상: 프로필별로 처음 한 번 무작위 배정되는 꽃 종류 인덱스("" = 미배정)
  flowerType: storeGet("flowerType") || "",
};
state.viewDay = state.progressDay;

export function saveState() {
  storeSet("level", state.level);
  storeSet("day", String(state.progressDay));
  storeSet("streak", String(state.streak));
  storeSet("lastCompletedDate", state.lastCompletedDate);
  storeSet("lastCompletedDay", String(state.lastCompletedDay));
  storeSet("versionComplete", String(state.versionComplete));
  storeSet("updateRequested", String(state.updateRequested));
  localStorage.setItem("kidEnglish.aiProvider", state.aiProvider);
  localStorage.setItem("kidEnglish.aiKey", state.aiKey);
  storeSet("chatCharacter", state.chatCharacter);
  localStorage.setItem("kidEnglish.voiceName", state.voiceName);
  storeSet("chatMessages", JSON.stringify(state.chatMessages.slice(-16)));
  storeSet("lastAiReply", state.lastAiReply);
  storeSet("weakPhrases", JSON.stringify(state.weakPhrases.slice(0, 12)));
  storeSet("bossCleared", JSON.stringify(state.bossCleared));
  storeSet("flowerType", String(state.flowerType));
}

export function activeLevel() {
  return state.level || "starter";
}
