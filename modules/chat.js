import { state, saveState, activeLevel } from "./store.js";
import { openaiChatUrl, cloudTtsReady } from "./api.js";
import { speak, clearTtsCache, renderVoiceOptions } from "./tts.js";
import { sttSupported, isRecording, startRecording, stopRecording, transcribe } from "./stt.js";
import { chatCharacters, talkMissions, suggestedPrompts, LEVELS } from "./data.js";
import { $, $$ } from "./dom.js";

let _getLesson = () => ({ levelKey: "starter", day: {}, dialogue: [] });
export function initChat({ getLesson }) {
  _getLesson = getLesson;
}

export function activeCharacter() {
  return chatCharacters[state.chatCharacter] || chatCharacters.sunny;
}

// ---- 렛츠톡식 대화 미션 ----

function getTalkMissions() {
  const levelKey = activeLevel();
  const pool = talkMissions[levelKey] || talkMissions.starter;
  const key = `${levelKey}:${state.viewDay}`;
  if (state.talkMissionKey !== key) {
    const start = (state.viewDay - 1) % pool.length;
    state.talkMissionKey = key;
    state.talkMissions = [0, 1, 2].map((offset) => pool[(start + offset) % pool.length]);
    state.talkMissionDone = [];
  }
  return state.talkMissions;
}

export function renderTalkMissions() {
  const missions = getTalkMissions();
  const list = $("#missionList");
  list.innerHTML = "";
  missions.forEach((mission, index) => {
    const done = state.talkMissionDone.includes(index);
    const item = document.createElement("button");
    item.type = "button";
    item.className = `mission-item ${done ? "done" : ""}`;
    item.innerHTML = `
      <span class="mission-check">${done ? "✅" : "🎯"}</span>
      <span class="mission-text"><strong></strong><span></span></span>
      <span class="mission-say">🔊</span>
    `;
    item.querySelector("strong").textContent = mission.en;
    item.querySelector(".mission-text span").textContent = mission.ko;
    item.addEventListener("click", () => {
      speak(mission.en.replace(/_+/g, "something"));
    });
    list.appendChild(item);
  });
  $("#missionScore").textContent = `${state.talkMissionDone.length} / ${missions.length}`;
}

const SKIP_WORDS = new Set(["a", "an", "the", "to", "of", "in", "on", "is", "it", "i", "at", "my", "do", "so"]);

function wordMatches(keyword, paddedText) {
  const w = keyword.toLowerCase();
  if (paddedText.includes(` ${w} `)) return true;
  // 기본 굴절 변형: -s, -ed, -ing, -e+d, -e+s
  if (paddedText.includes(` ${w}s `) || paddedText.includes(` ${w}ed `) || paddedText.includes(` ${w}ing `)) return true;
  if (w.endsWith("e") && (paddedText.includes(` ${w}d `) || paddedText.includes(` ${w}s `))) return true;
  return false;
}

export function checkMissionProgress(userText) {
  const paddedText = ` ${userText.toLowerCase().replace(/[^a-z\s']/g, " ")} `;
  const missions = getTalkMissions();
  let newlyDone = false;
  missions.forEach((mission, index) => {
    if (state.talkMissionDone.includes(index)) return;
    const meaningful = mission.keywords.filter((w) => w.length > 2 && !SKIP_WORDS.has(w.toLowerCase()));
    const hit = meaningful.length === 0
      ? mission.keywords.every((w) => wordMatches(w, paddedText))
      : meaningful.every((w) => wordMatches(w, paddedText));
    if (hit) {
      state.talkMissionDone.push(index);
      newlyDone = true;
    }
  });
  if (newlyDone) {
    renderTalkMissions();
    const total = missions.length;
    const done = state.talkMissionDone.length;
    if (done >= total) {
      pushChat("system", `🎉 오늘의 대화 미션 ${total}개를 모두 성공했어요! 정말 멋져요!`);
    } else {
      pushChat("system", `⭐ 미션 성공! (${done}/${total}) 계속 대화해볼까요?`);
    }
  }
}

function getCoachPrompt() {
  const { levelKey, day } = _getLesson();
  const missions = getTalkMissions()
    .filter((_, index) => !state.talkMissionDone.includes(index))
    .map((mission) => mission.en)
    .join(" / ");
  return [
    "You are a friendly English conversation buddy for a Korean elementary school 5th grader.",
    activeCharacter().persona,
    "Always stay in character and keep the chat going like a real friend.",
    `Student level: ${LEVELS[levelKey].label}. Today's topic: ${day.title}. Goal: ${day.goal}.`,
    missions ? `Gently guide the student to naturally use these target expressions: ${missions}.` : "",
    "Reply in this exact style:",
    "1) React warmly to what the student said (1 short sentence).",
    "2) One natural English response or comment at the student's level.",
    "3) A tiny Korean hint in parentheses.",
    "4) One open follow-up question that invites the student to say more.",
    "Encourage longer answers over time, but never correct harshly. Keep it under 60 words.",
    "Do not discuss adult, violent, romantic, or private personal topics. Keep it safe and kind.",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderCharacterRow() {
  const row = $("#characterRow");
  row.innerHTML = "";
  Object.entries(chatCharacters).forEach(([key, character]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `character-btn ${key === state.chatCharacter ? "active" : ""}`;
    button.innerHTML = `
      <span class="character-emoji">${character.emoji}</span>
      <strong>${character.name}</strong>
      <span>${character.ko}</span>
    `;
    button.addEventListener("click", () => selectCharacter(key));
    row.appendChild(button);
  });
}

function selectCharacter(key) {
  if (key === state.chatCharacter) return;
  state.chatCharacter = key;
  saveState();
  renderCharacterRow();
  const character = activeCharacter();
  pushChat("system", `이제 ${character.emoji} ${character.name}(${character.ko})와 대화해요!`);
  pushChat("ai", `Hi! I am ${character.name} ${character.emoji}. Let's keep talking in English!`);
}

export function renderChat() {
  $("#providerSelect").value = state.aiProvider;
  $("#apiKeyInput").value = state.aiKey;
  renderCharacterRow();
  renderTalkMissions();

  if (state.chatMessages.length === 0) {
    const { day } = _getLesson();
    const character = activeCharacter();
    state.chatMessages = [
      {
        role: "ai",
        character: state.chatCharacter,
        text: `Hi! I am ${character.name} ${character.emoji}. Let's talk about "${day.title}". Look at today's missions below and try to use them. What did you do today?`,
      },
    ];
  }

  $("#chatLog").innerHTML = "";
  state.chatMessages.forEach((message) => addChatBubble(message.role, message.text, message.character));
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}

function addChatBubble(role, text, characterKey) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  const character = chatCharacters[characterKey] || activeCharacter();
  const label =
    role === "user" ? "You" : role === "system" ? "Note" : `${character.emoji} ${character.name}`;
  bubble.innerHTML = `<strong>${label}</strong><p></p>`;
  bubble.querySelector("p").textContent = text;
  // AI 말풍선은 탭해서 그 문장을 바로 들을 수 있게 듣기 버튼을 단다
  if (role === "ai") {
    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "bubble-play";
    playBtn.textContent = "🔊 듣기";
    playBtn.setAttribute("aria-label", "이 문장 듣기");
    playBtn.addEventListener("click", () => speak(extractEnglishForSpeech(text)));
    bubble.appendChild(playBtn);
  }
  $("#chatLog").appendChild(bubble);
}

export function pushChat(role, text) {
  const message = { role, text };
  if (role === "ai") {
    message.character = state.chatCharacter;
    state.lastAiReply = text;
  }
  state.chatMessages.push(message);
  saveState();
  renderChat();
}

export async function sendAiMessage(text) {
  const cleanText = text.trim();
  if (!cleanText) return;

  pushChat("user", cleanText);
  $("#chatInput").value = "";
  checkMissionProgress(cleanText);
  addChatBubble("system", "AI가 짧고 쉬운 영어 답변을 준비하고 있어요...");

  try {
    const reply = await callOpenAiChat(cleanText);
    pushChat("ai", reply);
    speak(extractEnglishForSpeech(reply));
  } catch (error) {
    pushChat(
      "system",
      `연결이 안 돼서 로컬 코치로 답할게요. ${error.message ? `(${error.message})` : ""}`
    );
    const reply = makeLocalReply(cleanText);
    pushChat("ai", reply);
  }
}

// 대화 생성은 OpenAI(gpt-4o-mini)로 한다. 빠르고 안정적이며 키는 Worker에만 있다.
async function callOpenAiChat(text) {
  if (!cloudTtsReady()) return makeLocalReply(text);
  const response = await fetch(openaiChatUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: buildChatMessages(text),
      temperature: 0.7,
      max_tokens: 200,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "OpenAI 대화 오류");
  return data.choices?.[0]?.message?.content?.trim() || makeLocalReply(text);
}

function buildChatMessages(text) {
  const history = state.chatMessages
    .filter((message) => message.role !== "system")
    .slice(0, -1)
    .slice(-8)
    .map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.text,
    }));
  return [
    { role: "system", content: getCoachPrompt() },
    ...history,
    { role: "user", content: text },
  ];
}

function makeLocalReply(text) {
  const { levelKey, day } = _getLesson();
  const starters = {
    starter: "Great! I like your sentence.",
    a1: "Nice answer! You can add one more detail.",
    a1plus: "Good idea! Try adding a reason with because.",
  };
  const question = {
    starter: "What do you like?",
    a1: "Why do you like it?",
    a1plus: "Can you tell me one more thing about it?",
  };
  return `${starters[levelKey]} (${day.goal} 연습 중이에요.)\nYou said: "${text}"\n${question[levelKey]}`;
}

function extractEnglishForSpeech(text) {
  // 괄호 안 한국어 힌트는 빼고, 영어가 있는 줄은 마지막 질문까지 모두 읽는다
  return text
    .split("\n")
    .map((line) => line.replace(/\([^)]*\)/g, "").trim())
    .filter((line) => /[a-z]/i.test(line))
    .join(" ");
}

export function saveAiSettings() {
  state.aiProvider = $("#providerSelect").value;
  state.aiKey = $("#apiKeyInput").value.trim();
  saveState();
  clearTtsCache();
  renderVoiceOptions();
  const hasCloudVoice = state.aiProvider !== "local" && state.aiKey;
  pushChat(
    "system",
    state.aiProvider === "local"
      ? "로컬 연습 모드로 설정했어요. API 키 없이 기본 회화 코치가 답합니다."
      : `${state.aiProvider === "gemini" ? "Gemini" : "OpenAI"} 연결 설정을 저장했어요.${
          hasCloudVoice ? " 이제 듣기 음성도 AI 목소리로 나와요. 🔊" : ""
        }`
  );
}

export function suggestChatPrompt() {
  // 아직 못 깬 미션이 있으면 그 표현을 힌트로, 다 깼으면 자유 질문을 추천
  const missions = getTalkMissions();
  const remaining = missions.filter((_, index) => !state.talkMissionDone.includes(index));

  if (remaining.length) {
    const mission = remaining[Math.floor(Math.random() * remaining.length)];
    pushChat("system", `💡 힌트: "${mission.en}" (${mission.ko}) — 빈칸은 자유롭게 채워서 말해보세요!`);
    $("#chatInput").value = mission.en.includes("_") ? mission.en.replace(/_+/g, "") : mission.en;
  } else {
    const prompts = suggestedPrompts[activeLevel()];
    $("#chatInput").value = prompts[Math.floor(Math.random() * prompts.length)];
  }
  $("#chatInput").focus();
}

export async function startAiRecognition() {
  if (!sttSupported()) {
    pushChat("system", "이 브라우저에서는 말 입력이 안 돼요. 문장을 직접 입력해보세요.");
    return;
  }
  const btn = $("#aiMicBtn");

  // 녹음 중이면: 멈추고 Whisper로 글자 변환
  if (isRecording()) {
    const blob = await stopRecording();
    if (btn) btn.textContent = "말로 입력";
    if (!blob) return;

    const loading = document.createElement("div");
    loading.className = "chat-bubble system";
    loading.innerHTML = "<strong>Note</strong><p>🎧 말을 글자로 바꾸는 중...</p>";
    $("#chatLog").appendChild(loading);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;

    try {
      const text = await transcribe(blob);
      loading.remove();
      if (text) {
        $("#chatInput").value = text;
        $("#chatInput").focus();
      } else {
        pushChat("system", "잘 안 들렸어요. 다시 한 번 말해볼까요?");
      }
    } catch {
      loading.remove();
      pushChat("system", "음성 변환에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
    return;
  }

  // 녹음 시작
  try {
    await startRecording();
    if (btn) btn.textContent = "🔴 멈추기";
  } catch {
    pushChat("system", "마이크 권한을 허용해주세요.");
  }
}
