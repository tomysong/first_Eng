import {
  LEVELS,
  APP_VERSION,
  quiz,
  curriculumSeeds,
  dialogues,
  phraseBank,
  suggestedPrompts,
  chatCharacters,
  talkMissions,
  yearlyRoadmap,
} from "./modules/data.js";
import { $, $$ } from "./modules/dom.js";
import {
  PROFILES_KEY,
  ACTIVE_PROFILE_KEY,
  PROFILE_EMOJIS,
  ensureProfiles,
  activeProfileId,
  currentProfile,
  storeGet,
  storeSet,
  storeRemove,
} from "./modules/profiles.js";
import { applyHybridProgress, dateStamp } from "./modules/progress.js";

// 키 프록시 서버 주소(Cloudflare Worker). 값이 있으면 아이가 키 입력 없이
// AI 대화·목소리를 쓰고 키는 절대 노출되지 않는다. 배포법: proxy/README.md
// 비워 두면 예전처럼 보호자가 키를 직접 입력하는 방식으로 동작한다.
const GEMINI_PROXY = "https://kid-eng-proxy.hssong1107.workers.dev";
const GEMINI_BASE = "https://generativelanguage.googleapis.com";

// 프록시가 있으면 Gemini를 키 없이 호출할 수 있으므로 항상 사용 가능
function geminiReady() {
  return Boolean(GEMINI_PROXY) || Boolean(state.aiKey);
}

// 실제로 사용할 AI 제공자(프록시가 있으면 Gemini 고정)
function effectiveProvider() {
  return GEMINI_PROXY ? "gemini" : state.aiProvider;
}

function geminiUrl(model) {
  return `${GEMINI_PROXY || GEMINI_BASE}/v1beta/models/${model}:generateContent`;
}

function geminiHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (!GEMINI_PROXY) headers["x-goog-api-key"] = state.aiKey;
  return headers;
}

ensureProfiles();

function readArray(name) {
  try {
    const value = JSON.parse(storeGet(name) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const state = {
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
};
state.viewDay = state.progressDay;

function saveState() {
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
}

function activeLevel() {
  return state.level || "starter";
}

function buildCurriculum(levelKey) {
  const seeds = curriculumSeeds[levelKey];
  return Array.from({ length: 28 }, (_, index) => {
    const dayNum = index + 1;
    const week = Math.floor(index / 7) + 1;
    if (dayNum % 7 === 0) {
      return {
        day: dayNum,
        week,
        title: `Week ${week} 보스 미션`,
        goal: "이번 주 문장 3개를 말하기로 통과하기",
        phrase: "Speak and clear!",
        boss: true,
      };
    }
    const seed = seeds[index % seeds.length];
    return {
      day: dayNum,
      week,
      title: seed[0],
      goal: seed[1],
      phrase: seed[2],
    };
  });
}

function ensureBossTargets() {
  const { levelKey, day } = getLesson();
  if (!day.boss) return [];
  const key = `${levelKey}:${day.day}`;
  if (state.bossKey !== key) {
    const pool = buildCurriculum(levelKey)
      .filter((item) => item.week === day.week && !item.boss)
      .map((item) => item.phrase);
    state.bossKey = key;
    state.bossTargets = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    state.bossPassed = [];
  }
  return state.bossTargets;
}

function updateStatus() {
  const info = state.level ? LEVELS[state.level] : null;
  $("#versionLabel").textContent = state.versionComplete ? `${APP_VERSION.id} 완료` : APP_VERSION.id;
  $("#levelLabel").textContent = info ? info.label : "미정";
  $("#dayLabel").textContent = `Day ${state.progressDay}`;
  $("#streakLabel").textContent = `${state.streak}일`;
  updateCharacter();
}

function updateCharacter() {
  const mark = $(".brand-mark");
  mark.classList.toggle("streak-7", state.streak >= 7);
  mark.classList.toggle("streak-14", state.streak >= 14);
  mark.classList.toggle("streak-28", state.streak >= 28);
}

function switchTab(tabId) {
  $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabId));
  $$(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === tabId));
  if (tabId === "today") renderToday();
  if (tabId === "plan") renderPlan();
  if (tabId === "chat") renderChat();
  if (tabId === "roadmap") renderRoadmap();
  if (tabId === "parent") {
    if (isParentMode()) renderParentDashboard();
    else openParentGate();
  }
}

function startTest() {
  state.quizIndex = 0;
  state.score = 0;
  $("#testIntro").classList.add("hidden");
  $("#resultPanel").classList.add("hidden");
  $("#quizPanel").classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const item = quiz[state.quizIndex];
  $("#quizCount").textContent = `${state.quizIndex + 1} / ${quiz.length}`;
  $("#quizTopic").textContent = item.topic;
  $("#questionText").textContent = item.question;
  $("#answerList").innerHTML = "";

  const options = item.answers
    .map((text, index) => ({ text, isCorrect: index === item.correct }))
    .sort(() => Math.random() - 0.5);

  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.type = "button";
    button.textContent = option.text;
    button.dataset.correct = String(option.isCorrect);
    button.addEventListener("click", () => chooseAnswer(button, option.isCorrect));
    $("#answerList").appendChild(button);
  });
}

function chooseAnswer(button, isCorrect) {
  const buttons = $$(".answer-btn");
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.correct === "true") btn.classList.add("correct");
  });

  if (isCorrect) {
    state.score += 1;
  } else {
    button.classList.add("wrong");
  }

  setTimeout(() => {
    state.quizIndex += 1;
    if (state.quizIndex < quiz.length) {
      renderQuestion();
    } else {
      finishTest();
    }
  }, 650);
}

function finishTest() {
  let level = "starter";
  if (state.score >= 8) level = "a1plus";
  else if (state.score >= 5) level = "a1";

  state.level = level;
  state.progressDay = 1;
  state.viewDay = 1;
  state.lastCompletedDate = "";
  state.lastCompletedDay = 0;
  state.weakPhrases = [];
  state.bossCleared = [];
  state.bossKey = "";
  state.bossTargets = [];
  state.bossPassed = [];
  state.versionComplete = false;
  state.updateRequested = false;
  saveState();
  updateStatus();

  $("#quizPanel").classList.add("hidden");
  $("#resultPanel").classList.remove("hidden");
  $("#resultTitle").textContent = `${LEVELS[level].label}로 시작`;
  $("#resultCopy").textContent = `점수 ${state.score}/${quiz.length}. ${LEVELS[level].coach}`;
  renderToday();
  renderPlan();
}

function getLesson() {
  const levelKey = activeLevel();
  const plan = buildCurriculum(levelKey);
  const day = plan[Math.max(0, Math.min(state.viewDay - 1, plan.length - 1))];
  const set = dialogues[levelKey];
  const dialogue = set[(state.viewDay - 1) % set.length];
  return { levelKey, day, dialogue };
}

function renderToday() {
  const { levelKey, day, dialogue } = getLesson();
  $("#lessonBadge").textContent = `Day ${state.viewDay}`;
  $("#lessonLevel").textContent = LEVELS[levelKey].label;
  $("#lessonTitle").textContent = day.title;
  $("#lessonGoal").textContent = day.goal;
  $("#coachLine").textContent = state.level
    ? `${LEVELS[levelKey].coach} 오늘 핵심 표현은 "${day.phrase}" 입니다.`
    : "테스트를 먼저 하면 더 잘 맞는 미션을 추천할 수 있어요.";
  if (day.boss) {
    const targets = ensureBossTargets();
    const passedCount = state.bossCleared.includes(day.day) ? targets.length : state.bossPassed.length;
    $("#coachLine").textContent =
      passedCount >= targets.length
        ? `Week ${day.week} 보스 미션 통과! 👑 다른 날 문장도 복습해보세요.`
        : `보스 미션 ${passedCount}/${targets.length}: 아래 문장을 "말하기" 버튼으로 통과하세요.`;
  }
  if (state.versionComplete) {
    $("#coachLine").textContent = `${APP_VERSION.id}를 마쳤어요. 커리큘럼 탭에서 복습 후 ${APP_VERSION.next} 업데이트 요청을 확인하세요.`;
  }
  $("#speechResult").textContent = "";
  $("#completeBtn").textContent =
    state.lastCompletedDate === dateStamp() ? "오늘 완료 ✓" : "오늘 완료";

  if (day.boss) {
    renderBossMission();
  } else {
    $("#dialogueList").innerHTML = "";
    dialogue.forEach((line, index) => {
      const row = document.createElement("div");
      row.className = "line-card";
      row.innerHTML = `
        <span class="speaker">${line[0]}</span>
        <div>
          <p class="english-line">${line[1]}</p>
          <span class="korean-line">${line[2]}</span>
        </div>
        <button class="icon-btn speak-small" type="button" title="문장 듣기">▶</button>
      `;
      row.querySelector("button").addEventListener("click", () => speak(line[1]));
      row.addEventListener("click", (event) => {
        if (event.target.tagName !== "BUTTON") {
          state.sentenceIndex = index;
          speak(line[1]);
        }
      });
      $("#dialogueList").appendChild(row);
    });
  }

  renderPhraseCards();
  updateStatus();
}

function renderBossMission() {
  const { day } = getLesson();
  const targets = ensureBossTargets();
  const cleared = state.bossCleared.includes(day.day);
  const list = $("#dialogueList");
  list.innerHTML = "";

  targets.forEach((phrase, index) => {
    const passed = cleared || state.bossPassed.includes(index);
    const row = document.createElement("div");
    row.className = `line-card boss-line ${passed ? "passed" : ""}`;
    row.innerHTML = `
      <span class="speaker">${passed ? "✅" : `미션 ${index + 1}`}</span>
      <div>
        <p class="english-line">${phrase}</p>
        <span class="korean-line">${passed ? "통과!" : "듣고 따라 말해보세요"}</span>
      </div>
      <button class="icon-btn speak-small" type="button" title="문장 듣기">▶</button>
    `;
    row.querySelector("button").addEventListener("click", () => speak(phrase));
    list.appendChild(row);
  });
}

function renderPhraseCards() {
  const phrases = [...phraseBank[activeLevel()]].sort(() => Math.random() - 0.5);
  $("#phraseCards").innerHTML = "";

  state.weakPhrases.slice(0, 4).forEach((item) => {
    const card = document.createElement("button");
    card.className = "phrase-card weak";
    card.type = "button";
    card.innerHTML = `<strong></strong><span>🔁 복습 카드 · 잘 말하면 사라져요</span>`;
    card.querySelector("strong").textContent = item.en;
    card.addEventListener("click", () => speak(item.en));
    $("#phraseCards").appendChild(card);
  });

  phrases.forEach(([en, ko]) => {
    const card = document.createElement("button");
    card.className = "phrase-card";
    card.type = "button";
    card.innerHTML = `<strong>${en}</strong><span>${ko}</span>`;
    card.addEventListener("click", () => speak(en));
    $("#phraseCards").appendChild(card);
  });
}

function renderPlan() {
  const plan = buildCurriculum(activeLevel());
  $("#curriculumList").innerHTML = "";
  renderVersionGate(plan);

  for (let week = 1; week <= 4; week += 1) {
    const block = document.createElement("div");
    block.className = "week-block";
    block.innerHTML = `<div class="week-title">Week ${week}</div>`;
    plan
      .filter((day) => day.week === week)
      .forEach((day) => {
        const done =
          state.versionComplete ||
          day.day < state.progressDay ||
          (state.lastCompletedDate && day.day === state.lastCompletedDay);
        const row = document.createElement("button");
        row.className = `day-row ${day.day === state.viewDay ? "active-day" : ""} ${done ? "done-day" : ""}`;
        row.type = "button";
        const bossMark = day.boss ? "👑 " : "";
        const clearMark = day.boss && state.bossCleared.includes(day.day) ? " ⭐" : "";
        row.innerHTML = `
          <span class="day-num">D${day.day}</span>
          <span><strong>${bossMark}${day.title}${clearMark}</strong><span>${day.goal} · ${day.phrase}</span></span>
        `;
        row.addEventListener("click", () => {
          state.viewDay = day.day;
          renderPlan();
          renderToday();
          switchTab("today");
        });
        block.appendChild(row);
      });
    $("#curriculumList").appendChild(block);
  }
}

function renderVersionGate(plan) {
  const gate = $("#versionGate");
  if (!state.versionComplete && state.progressDay < APP_VERSION.days) {
    gate.classList.add("hidden");
    gate.innerHTML = "";
    return;
  }

  const reviewItems = plan
    .filter((day) => [1, 7, 14, 21, 28].includes(day.day))
    .map((day) => `<li><strong>D${day.day}</strong> ${day.goal} · ${day.phrase}</li>`)
    .join("");

  gate.classList.remove("hidden");
  gate.innerHTML = `
    <div>
      <span class="badge">${APP_VERSION.id} Review</span>
      <h3>28일 완료 후 진행 방식</h3>
      <p>먼저 v1에서 배운 핵심 문장을 복습하고, 다음 달 콘텐츠는 ${APP_VERSION.next} 업데이트로 열어갑니다.</p>
      <ul>${reviewItems}</ul>
    </div>
    <button id="requestUpdateBtn" class="primary-btn" type="button">
      ${state.updateRequested ? `${APP_VERSION.next} 요청 저장됨` : `${APP_VERSION.next} 업데이트 요청`}
    </button>
  `;
  $("#requestUpdateBtn").addEventListener("click", requestNextVersion);
}

function requestNextVersion() {
  const payload = buildUpdatePayload();
  storeSet("pendingUpdateRequest", JSON.stringify(payload));
  state.updateRequested = true;
  saveState();
  renderPlan();
}

function buildUpdatePayload() {
  const { levelKey } = getLesson();
  return {
    app: "AI초딩영어",
    learner: currentProfile().name,
    completedVersion: APP_VERSION.id,
    requestedVersion: APP_VERSION.next,
    level: LEVELS[levelKey].label,
    completedDays: APP_VERSION.days,
    streak: state.streak,
    requestedAt: new Date().toISOString(),
    reviewBeforeUnlock: true,
    weakPhrases: state.weakPhrases.map((item) => item.en),
    bossCleared: [...state.bossCleared],
    storagePlan: "POST /api/version-requests -> server stores progress, weak phrases, next curriculum unlock state",
  };
}

function renderRoadmap() {
  $("#yearRoadmap").innerHTML = "";
  yearlyRoadmap.forEach((item) => {
    const card = document.createElement("article");
    card.className = `roadmap-card ${item.version === APP_VERSION.id ? "current" : "locked"}`;
    card.innerHTML = `
      <div>
        <span class="badge ${item.version === APP_VERSION.id ? "" : "muted"}">${item.version}</span>
        <span class="roadmap-month">${item.month}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.focus}</p>
      <strong>${item.unlock}</strong>
    `;
    $("#yearRoadmap").appendChild(card);
  });
}

function activeCharacter() {
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

function renderTalkMissions() {
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
      const character = activeCharacter();
      speak(mission.en.replace(/_+/g, "something"), character.rate, character.pitch, characterCloudVoice(character));
    });
    list.appendChild(item);
  });
  $("#missionScore").textContent = `${state.talkMissionDone.length} / ${missions.length}`;
}

function checkMissionProgress(userText) {
  const text = ` ${userText.toLowerCase().replace(/[^a-z\s']/g, " ")} `;
  const missions = getTalkMissions();
  let newlyDone = false;
  missions.forEach((mission, index) => {
    if (state.talkMissionDone.includes(index)) return;
    const hit = mission.keywords.every((word) => text.includes(` ${word.toLowerCase()} `));
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
  const { levelKey, day } = getLesson();
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

function renderChat() {
  $("#providerSelect").value = state.aiProvider;
  $("#apiKeyInput").value = state.aiKey;
  renderCharacterRow();
  renderTalkMissions();

  if (state.chatMessages.length === 0) {
    const { day } = getLesson();
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
  $("#chatLog").appendChild(bubble);
}

function pushChat(role, text) {
  const message = { role, text };
  if (role === "ai") {
    message.character = state.chatCharacter;
    state.lastAiReply = text;
  }
  state.chatMessages.push(message);
  saveState();
  renderChat();
}

async function sendAiMessage(text) {
  const cleanText = text.trim();
  if (!cleanText) return;

  pushChat("user", cleanText);
  $("#chatInput").value = "";
  checkMissionProgress(cleanText);
  addChatBubble("system", "AI가 짧고 쉬운 영어 답변을 준비하고 있어요...");

  try {
    const provider = effectiveProvider();
    const reply =
      provider === "gemini"
        ? await callGemini(cleanText)
        : provider === "openai"
          ? await callOpenAI(cleanText)
          : makeLocalReply(cleanText);
    pushChat("ai", reply);
    const character = activeCharacter();
    speak(extractEnglishForSpeech(reply), character.rate, character.pitch, characterCloudVoice(character));
  } catch (error) {
    pushChat(
      "system",
      `연결이 안 돼서 로컬 코치로 답할게요. ${error.message ? `(${error.message})` : ""}`
    );
    const reply = makeLocalReply(cleanText);
    pushChat("ai", reply);
  }
}

async function callGemini(text) {
  if (!geminiReady()) return makeLocalReply(text);
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: getCoachPrompt() }] },
    contents: buildGeminiHistory(text),
    generationConfig: {
      temperature: 0.7,
      // thinking 토큰이 출력 한도에 합산되어 빈 응답이 오는 것을 방지
      maxOutputTokens: 400,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  // Gemini가 일시적으로 바쁠 때(503/UNAVAILABLE)는 잠깐 쉬고 다시 시도
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(geminiUrl("gemini-3.5-flash"), {
      method: "POST",
      headers: geminiHeaders(),
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return (
        data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() ||
        makeLocalReply(text)
      );
    }
    const busy = response.status === 503 || data.error?.status === "UNAVAILABLE";
    if (busy && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      continue;
    }
    throw new Error(data.error?.message || "Gemini API 오류");
  }
  return makeLocalReply(text);
}

function buildGeminiHistory(text) {
  const recent = state.chatMessages
    .filter((message) => message.role !== "system")
    .slice(0, -1)
    .slice(-8)
    .map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.text }],
    }));
  recent.push({ role: "user", parts: [{ text }] });
  return recent;
}

async function callOpenAI(text) {
  if (!state.aiKey) return makeLocalReply(text);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.aiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      instructions: getCoachPrompt(),
      input: buildPlainHistory(text),
      max_output_tokens: 140,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "OpenAI API 오류");
  return extractOpenAIText(data) || makeLocalReply(text);
}

function buildPlainHistory(text) {
  const history = state.chatMessages
    .filter((message) => message.role !== "system")
    .slice(0, -1)
    .slice(-8)
    .map((message) => `${message.role === "user" ? "Student" : "Coach"}: ${message.text}`)
    .join("\n");
  return `${history}\nStudent: ${text}`.trim();
}

function extractOpenAIText(data) {
  if (data.output_text) return data.output_text.trim();
  return (
    data.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("\n")
      .trim() || ""
  );
}

function makeLocalReply(text) {
  const { levelKey, day } = getLesson();
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
  return text
    .split("\n")
    .map((line) => line.replace(/\([^)]*\)/g, "").trim())
    .filter((line) => /[a-z]/i.test(line))
    .slice(0, 2)
    .join(" ");
}

function saveAiSettings() {
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

function suggestChatPrompt() {
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

function startAiRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    pushChat("system", "이 브라우저에서는 말 입력이 제한될 수 있어요. 문장을 직접 입력해보세요.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();
  recognition.onresult = (event) => {
    $("#chatInput").value = event.results[0][0].transcript;
  };
  recognition.onerror = () => {
    pushChat("system", "마이크 권한을 확인하고 다시 시도해주세요.");
  };
}

function getBestVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const english = voices.filter((voice) => /^en/i.test(voice.lang));

  // 사용자가 직접 고른 목소리가 있으면 최우선
  if (state.voiceName) {
    const saved = english.find((voice) => voice.name === state.voiceName);
    if (saved) return saved;
  }

  // 미국 여성/밝은 음성 우선. 같은 이름이면 Enhanced/Premium/Natural 변형 우선
  const preferredNames = [
    "Ava",
    "Samantha",
    "Allison",
    "Susan",
    "Joelle",
    "Google US English",
    "Aria",
    "Jenny",
    "Michelle",
    "Zoe",
    "Serena",
  ];
  for (const name of preferredNames) {
    const matches = english.filter((voice) => voice.name.includes(name));
    if (matches.length) {
      return matches.find((voice) => /enhanced|premium|natural/i.test(voice.name)) || matches[0];
    }
  }

  return (
    english.find((voice) => /^en-US/i.test(voice.lang)) ||
    english[0] ||
    null
  );
}

// macOS의 효과음/장난 음성은 학습용 목록에서 제외
const NOVELTY_VOICES =
  /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox/i;

function listLearningVoices() {
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

function renderVoiceOptions() {
  const select = $("#voiceSelect");
  if (!select) return;
  const english = listLearningVoices();

  select.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  const cloudReady =
    Boolean(state.aiKey) && (state.aiProvider === "gemini" || state.aiProvider === "openai");
  auto.textContent = cloudReady
    ? `자동 (${state.aiProvider === "gemini" ? "Gemini" : "OpenAI"} AI 목소리)`
    : "자동 추천 (미국 여성 우선)";
  select.appendChild(auto);

  english.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    select.appendChild(option);
  });

  select.value = english.some((voice) => voice.name === state.voiceName) ? state.voiceName : "";
}

function selectVoice() {
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

function stopAllAudio() {
  window.speechSynthesis?.cancel?.();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

function cloudTtsEnabled() {
  if (state.voiceName || Date.now() < cloudTtsBlockedUntil) return false;
  if (GEMINI_PROXY) return true;
  return Boolean(state.aiKey) && (state.aiProvider === "gemini" || state.aiProvider === "openai");
}

function defaultCloudVoice() {
  return effectiveProvider() === "gemini" ? "Leda" : "marin";
}

function characterCloudVoice(character) {
  return effectiveProvider() === "gemini" ? character.geminiVoice : character.openaiVoice;
}

function clearTtsCache() {
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

async function speak(text, rate = 0.86, pitch = 1.04, cloudVoice = "") {
  speakSession += 1;
  await speakLine(text, rate, pitch, cloudVoice);
}

async function speakLine(text, rate, pitch, cloudVoice) {
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

function speakLocal(text, rate, pitch) {
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

let voiceRecorder = null;
let voiceChunks = [];
let voiceUrl = "";
let voiceStopTimer = 0;

function dialogueTarget() {
  const { day, dialogue } = getLesson();
  if (day.boss) {
    const targets = ensureBossTargets();
    const next = targets.find((_, index) => !state.bossPassed.includes(index));
    return next || targets[0];
  }
  return dialogue.find((line) => line[0] === "You")?.[1] || dialogue[0][1];
}

async function toggleVoiceRecording() {
  if (voiceRecorder && voiceRecorder.state === "recording") {
    voiceRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    $("#coachLine").textContent = "이 브라우저에서는 녹음을 지원하지 않아요.";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceChunks = [];
    voiceRecorder = new MediaRecorder(stream);
    voiceRecorder.ondataavailable = (event) => {
      if (event.data.size) voiceChunks.push(event.data);
    };
    voiceRecorder.onstop = () => {
      clearTimeout(voiceStopTimer);
      stream.getTracks().forEach((track) => track.stop());
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
      voiceUrl = URL.createObjectURL(new Blob(voiceChunks, { type: voiceRecorder.mimeType || "audio/webm" }));
      $("#voiceRecordBtn").textContent = "🎙 내 목소리 녹음";
      $("#voiceCompareBtn").disabled = false;
      $("#coachLine").textContent = "녹음 완료! 내 발음과 원어민 발음을 비교해보세요.";
    };
    voiceRecorder.start();
    $("#voiceRecordBtn").textContent = "■ 녹음 멈추기";
    $("#coachLine").textContent = `"${dialogueTarget()}"를 따라 말해보세요. 끝나면 버튼을 다시 눌러요.`;
    voiceStopTimer = setTimeout(() => {
      if (voiceRecorder?.state === "recording") voiceRecorder.stop();
    }, 12000);
  } catch {
    $("#coachLine").textContent = "마이크 권한을 확인하고 다시 시도해주세요.";
  }
}

function playVoiceComparison() {
  if (!voiceUrl) return;
  speakSession += 1;
  stopAllAudio();
  $("#coachLine").textContent = "먼저 내 목소리, 그다음 원어민 발음이 나와요.";
  const target = dialogueTarget();
  const audio = new Audio(voiceUrl);
  audio.onended = () => setTimeout(() => speak(target, 0.8), 300);
  audio.play();
}

async function speakDialogue() {
  const { day, dialogue } = getLesson();
  const lines = day.boss ? ensureBossTargets() : dialogue.map((line) => line[1]);
  speakSession += 1;
  const session = speakSession;

  for (const line of lines) {
    if (session !== speakSession) return;
    await speakLine(line, 0.84, 1.04, "");
    if (session !== speakSession) return;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

function speakNextSentence() {
  const { day, dialogue } = getLesson();
  const lines = day.boss ? ensureBossTargets() : dialogue.map((line) => line[1]);
  const line = lines[state.sentenceIndex % lines.length];
  state.sentenceIndex += 1;
  speak(line, 0.78);
}

function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const target = dialogueTarget();

  if (!SpeechRecognition) {
    $("#coachLine").textContent = `마이크 인식은 이 브라우저에서 제한될 수 있어요. 대신 "${target}"를 크게 따라 말해보세요.`;
    speak(target, 0.76);
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $("#coachLine").textContent = `"${target}"를 말해보세요.`;
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const score = compareSpeech(target, transcript);
    renderWordFeedback(target, transcript);
    recordSpeechScore(target, score);

    const { day } = getLesson();
    if (day.boss) {
      handleBossAttempt(target, score, day);
      return;
    }
    $("#coachLine").textContent =
      score > 0.7
        ? "좋아요. 핵심 단어가 잘 들렸어요."
        : "괜찮아요. 회색 단어를 살려서 한 번 더! 이 문장은 표현 카드에 복습으로 담아둘게요.";
  };

  recognition.onerror = () => {
    $("#coachLine").textContent = "마이크 권한을 확인하고 다시 눌러주세요.";
  };
}

function handleBossAttempt(target, score, day) {
  if (score < 0.6) {
    $("#coachLine").textContent = "아쉬워요! 초록 단어는 잘 들렸어요. 한 번 더 도전!";
    return;
  }
  const index = state.bossTargets.indexOf(target);
  if (index >= 0 && !state.bossPassed.includes(index)) state.bossPassed.push(index);

  if (state.bossPassed.length >= state.bossTargets.length && !state.bossCleared.includes(day.day)) {
    state.bossCleared.push(day.day);
    saveState();
  }
  renderBossMission();
  $("#coachLine").textContent = state.bossCleared.includes(day.day)
    ? `Week ${day.week} 보스 클리어! 👑 정말 멋져요!`
    : `통과! 🎉 (${state.bossPassed.length}/${state.bossTargets.length}) 다음 문장에 도전하세요.`;
}

function cleanWords(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function compareSpeech(target, transcript) {
  const targetWords = cleanWords(target);
  const heardWords = new Set(cleanWords(transcript));
  const matches = targetWords.filter((word) => heardWords.has(word)).length;
  return matches / Math.max(1, targetWords.length);
}

function renderWordFeedback(target, transcript) {
  const heardWords = new Set(cleanWords(transcript));
  const colored = target
    .split(/\s+/)
    .map((word) => {
      const key = cleanWords(word)[0] || "";
      const hit = key && heardWords.has(key);
      return `<span class="${hit ? "word-hit" : "word-miss"}">${word}</span>`;
    })
    .join(" ");
  const heardLine = document.createElement("span");
  heardLine.textContent = `들은 문장: ${transcript}`;
  $("#speechResult").innerHTML = `${heardLine.outerHTML}<br>${colored}`;
}

function recordSpeechScore(target, score) {
  const index = state.weakPhrases.findIndex((item) => item.en === target);
  if (score < 0.7) {
    if (index >= 0) state.weakPhrases[index].tries += 1;
    else state.weakPhrases.unshift({ en: target, tries: 1 });
    state.weakPhrases = state.weakPhrases.slice(0, 12);
  } else if (index >= 0) {
    // 잘 말했으면 복습 카드에서 졸업
    state.weakPhrases.splice(index, 1);
  }
  saveState();
  renderPhraseCards();
}

function resetApp() {
  // 현재 프로필의 기록만 초기화한다 (다른 친구 기록은 유지)
  storeRemove("level");
  storeRemove("day");
  storeRemove("streak");
  storeRemove("lastCompletedDate");
  storeRemove("lastCompletedDay");
  storeRemove("versionComplete");
  storeRemove("updateRequested");
  storeRemove("chatMessages");
  storeRemove("pendingUpdateRequest");
  storeRemove("lastAiReply");
  storeRemove("weakPhrases");
  storeRemove("bossCleared");
  state.level = "";
  state.progressDay = 1;
  state.viewDay = 1;
  state.streak = 0;
  state.lastCompletedDate = "";
  state.lastCompletedDay = 0;
  state.weakPhrases = [];
  state.bossCleared = [];
  state.bossKey = "";
  state.bossTargets = [];
  state.bossPassed = [];
  state.versionComplete = false;
  state.updateRequested = false;
  state.quizIndex = 0;
  state.score = 0;
  state.chatMessages = [];
  state.lastAiReply = "";
  $("#testIntro").classList.remove("hidden");
  $("#quizPanel").classList.add("hidden");
  $("#resultPanel").classList.add("hidden");
  updateStatus();
  renderToday();
  renderPlan();
  renderRoadmap();
  renderChat();
}

function completeToday() {
  const today = dateStamp();
  if (state.lastCompletedDate === today) {
    $("#coachLine").textContent = "오늘 학습은 이미 완료했어요. 내일 또 만나요!";
    return;
  }

  // 어제 완료했으면 연속 +1, 하루라도 건너뛰었으면 1부터 다시
  state.streak = state.lastCompletedDate === dateStamp(-1) ? state.streak + 1 : 1;
  state.lastCompletedDate = today;
  state.lastCompletedDay = state.progressDay;

  if (state.progressDay >= APP_VERSION.days) {
    state.versionComplete = true;
  }
  state.viewDay = state.progressDay;
  saveState();
  updateStatus();
  renderToday();
  renderPlan();
  $("#coachLine").textContent = state.versionComplete
    ? `${APP_VERSION.id} 28일을 완료했어요. v1 복습 후 ${APP_VERSION.next} 업데이트를 요청할 수 있어요.`
    : `Day ${state.progressDay} 완료! 내일 앱을 열면 다음 미션(Day ${state.progressDay + 1})으로 넘어가요.`;
}

// 넷플릭스 스타일 프로필 게이트: 앱을 열면 먼저 프로필을 고르고 본 화면으로 진입
const PROFILE_COLORS = ["#d8f3e7", "#d9ecff", "#ffe9c7", "#ffe0d8", "#ece4ff", "#fff3c4", "#dff6ff", "#ffe2ef"];

function renderProfileGate() {
  const grid = $("#profileGrid");
  const profiles = ensureProfiles();
  const active = activeProfileId();
  grid.innerHTML = "";

  profiles.forEach((profile, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `profile-card ${profile.id === active ? "current" : ""}`;
    const avatar = document.createElement("span");
    avatar.className = "profile-avatar";
    avatar.style.background = PROFILE_COLORS[index % PROFILE_COLORS.length];
    avatar.textContent = profile.emoji;
    const name = document.createElement("span");
    name.className = "profile-name";
    name.textContent = profile.name;
    card.appendChild(avatar);
    card.appendChild(name);
    card.addEventListener("click", () => selectProfile(profile.id));
    grid.appendChild(card);
  });

  const addCard = document.createElement("button");
  addCard.type = "button";
  addCard.className = "profile-card add";
  addCard.innerHTML = `<span class="profile-avatar">＋</span><span class="profile-name">새 프로필</span>`;
  addCard.addEventListener("click", () => {
    $("#gateAdd").classList.toggle("hidden");
    $("#profileNameInput").focus();
  });
  grid.appendChild(addCard);
}

function showProfileGate() {
  renderProfileGate();
  $("#gateAdd").classList.add("hidden");
  $("#profileGate").classList.remove("hidden");
}

function hideProfileGate() {
  $("#profileGate").classList.add("hidden");
  updateProfileSwitch();
}

function updateProfileSwitch() {
  const profile = currentProfile();
  const button = $("#profileSwitchBtn");
  button.textContent = profile.emoji;
  button.title = `${profile.name} · 프로필 바꾸기`;
}

function selectProfile(id) {
  if (id === activeProfileId()) {
    hideProfileGate();
    return;
  }
  // 다른 프로필은 상태를 처음부터 다시 읽도록 새로고침하고, 게이트는 건너뛴다
  sessionStorage.setItem("kidEnglish.autoEnter", "1");
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  location.reload();
}

function addProfile() {
  const name = $("#profileNameInput").value.trim().slice(0, 10);
  if (!name) {
    $("#profileNameInput").focus();
    return;
  }
  const profiles = ensureProfiles();
  const id = `p${Date.now().toString(36)}`;
  const emoji = PROFILE_EMOJIS[(profiles.length - 1) % PROFILE_EMOJIS.length];
  profiles.push({ id, name, emoji });
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  sessionStorage.setItem("kidEnglish.autoEnter", "1");
  location.reload();
}

// ---- 보호자 모드: 아이 화면(테스트·오늘·AI대화)과 보호자 화면 분리 ----
// 보호자가 직접 만든 4자리 비밀번호로 잠근다. 5회 오답 시 60초 잠금,
// 재설정은 두 자리 곱셈 검증을 거친다.

const PIN_KEY = "kidEnglish.parentPinHash";
const PIN_FAILS_KEY = "kidEnglish.pinFails";
const PIN_LOCK_KEY = "kidEnglish.pinLockUntil";

let gateMode = "enter"; // enter | setup | reset
let resetAnswer = 0;

function isParentMode() {
  return sessionStorage.getItem("kidEnglish.parentMode") === "1";
}

function updateModeUI() {
  document.body.classList.toggle("parent-mode", isParentMode());
  $("#parentGatePanel").classList.toggle("hidden", isParentMode());
  $("#parentContent").classList.toggle("hidden", !isParentMode());
  $("#parentLockBtn").classList.toggle("hidden", !isParentMode());
}

function hasParentPin() {
  return Boolean(localStorage.getItem(PIN_KEY));
}

async function hashPin(pin) {
  if (!window.crypto?.subtle) return `plain:${pin}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`kidEnglish:${pin}`)
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function openParentGate() {
  gateMode = hasParentPin() ? "enter" : "setup";
  renderParentGate("");
}

function renderParentGate(message) {
  const titles = {
    enter: "보호자 확인",
    setup: "보호자 비밀번호 만들기",
    reset: "비밀번호 재설정",
  };
  const descs = {
    enter: "보호자 비밀번호 4자리를 입력해주세요.",
    setup: "아이가 모르는 숫자 4자리로 정해주세요. 이 기기에만 저장됩니다.",
    reset: "보호자 확인을 위해 곱셈 문제를 풀면 비밀번호를 새로 만들 수 있어요.",
  };
  $("#parentGateTitle").textContent = titles[gateMode];
  $("#parentGateDesc").textContent = descs[gateMode];

  const question = $("#parentQuestion");
  if (gateMode === "reset") {
    const a = 23 + Math.floor(Math.random() * 60);
    const b = 13 + Math.floor(Math.random() * 60);
    resetAnswer = a * b;
    question.textContent = `${a} × ${b} = ?`;
    question.classList.remove("hidden");
  } else {
    question.classList.add("hidden");
  }

  const input = $("#parentAnswerInput");
  input.value = "";
  input.type = gateMode === "reset" ? "tel" : "password";
  input.placeholder = gateMode === "reset" ? "정답" : "비밀번호 4자리";
  $("#parentPinConfirm").value = "";
  $("#parentPinConfirm").classList.toggle("hidden", gateMode !== "setup");
  $("#pinForgotBtn").classList.toggle("hidden", gateMode !== "enter");
  $("#parentGateMsg").textContent = message || "";
}

function unlockParentMode() {
  localStorage.setItem(PIN_FAILS_KEY, "0");
  sessionStorage.setItem("kidEnglish.parentMode", "1");
  updateModeUI();
  renderParentDashboard();
}

async function submitParentGate(event) {
  event.preventDefault();
  const value = $("#parentAnswerInput").value.trim();

  if (gateMode === "setup") {
    if (!/^\d{4}$/.test(value)) {
      renderParentGate("숫자 4자리로 입력해주세요.");
      return;
    }
    if (value !== $("#parentPinConfirm").value.trim()) {
      renderParentGate("두 입력이 서로 달라요. 다시 확인해주세요.");
      return;
    }
    localStorage.setItem(PIN_KEY, await hashPin(value));
    unlockParentMode();
    return;
  }

  if (gateMode === "reset") {
    if (Number(value) === resetAnswer) {
      localStorage.removeItem(PIN_KEY);
      gateMode = "setup";
      renderParentGate("확인됐어요. 새 비밀번호를 만들어주세요.");
    } else {
      renderParentGate("정답이 아니에요. 새 문제로 다시 풀어주세요.");
    }
    return;
  }

  // enter 모드
  const lockUntil = Number(localStorage.getItem(PIN_LOCK_KEY) || 0);
  if (Date.now() < lockUntil) {
    const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
    renderParentGate(`시도가 너무 많았어요. ${seconds}초 후에 다시 해주세요.`);
    return;
  }
  if ((await hashPin(value)) === localStorage.getItem(PIN_KEY)) {
    unlockParentMode();
    return;
  }
  const fails = Number(localStorage.getItem(PIN_FAILS_KEY) || 0) + 1;
  if (fails >= 5) {
    localStorage.setItem(PIN_FAILS_KEY, "0");
    localStorage.setItem(PIN_LOCK_KEY, String(Date.now() + 60000));
    renderParentGate("5번 틀려서 60초 동안 잠겼어요.");
  } else {
    localStorage.setItem(PIN_FAILS_KEY, String(fails));
    renderParentGate(`비밀번호가 달라요. (${fails}/5)`);
  }
}

function startPinReset() {
  gateMode = "reset";
  renderParentGate("");
}

function lockParentMode() {
  sessionStorage.removeItem("kidEnglish.parentMode");
  updateModeUI();
  switchTab("today");
}

function profileStoreGet(profileId, name) {
  const key = profileId === "me" ? `kidEnglish.${name}` : `kidEnglish.${profileId}.${name}`;
  return localStorage.getItem(key);
}

function renderParentDashboard() {
  const wrap = $("#profileSummary");
  wrap.innerHTML = "";
  ensureProfiles().forEach((profile) => {
    const levelKey = profileStoreGet(profile.id, "level") || "";
    const day = Number(profileStoreGet(profile.id, "day") || 1);
    const streak = Number(profileStoreGet(profile.id, "streak") || 0);
    const done = profileStoreGet(profile.id, "versionComplete") === "true";
    let weak = [];
    try {
      weak = JSON.parse(profileStoreGet(profile.id, "weakPhrases") || "[]");
    } catch {
      weak = [];
    }

    const row = document.createElement("div");
    row.className = "summary-row";
    const title = document.createElement("strong");
    title.textContent = `${profile.emoji} ${profile.name}`;
    const stats = document.createElement("span");
    stats.textContent = [
      levelKey ? `레벨 ${LEVELS[levelKey]?.label || levelKey}` : "테스트 전",
      done ? `${APP_VERSION.id} 완료` : `Day ${day}`,
      `연속 ${streak}일`,
      weak.length ? `복습할 표현 ${weak.length}개` : "복습 카드 없음",
    ].join(" · ");
    row.appendChild(title);
    row.appendChild(stats);
    wrap.appendChild(row);
  });
}

function bindEvents() {
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
  $("#profileSaveBtn").addEventListener("click", addProfile);
  $("#profileSwitchBtn").addEventListener("click", showProfileGate);
  $("#parentGateForm").addEventListener("submit", submitParentGate);
  $("#parentLockBtn").addEventListener("click", lockParentMode);
  $("#pinForgotBtn").addEventListener("click", startPinReset);
  $("#profileNameInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addProfile();
    }
  });
  $("#startTestBtn").addEventListener("click", startTest);
  $("#goTodayBtn").addEventListener("click", () => switchTab("today"));
  $("#resetBtn").addEventListener("click", resetApp);
  $("#listenBtn").addEventListener("click", speakDialogue);
  $("#repeatBtn").addEventListener("click", speakNextSentence);
  $("#recordBtn").addEventListener("click", startRecognition);
  $("#shuffleBtn").addEventListener("click", renderPhraseCards);
  $("#completeBtn").addEventListener("click", completeToday);
  $("#saveAiBtn").addEventListener("click", saveAiSettings);
  $("#clearChatBtn").addEventListener("click", () => {
    state.chatMessages = [];
    state.lastAiReply = "";
    // 대화를 지우면 오늘의 미션도 다시 도전
    state.talkMissionKey = "";
    state.talkMissionDone = [];
    saveState();
    renderChat();
  });
  $("#aiPromptBtn").addEventListener("click", suggestChatPrompt);
  $("#aiMicBtn").addEventListener("click", startAiRecognition);
  $("#aiReadBtn").addEventListener("click", () => {
    const character = activeCharacter();
    speak(extractEnglishForSpeech(state.lastAiReply), character.rate, character.pitch, characterCloudVoice(character));
  });
  $("#voiceRecordBtn").addEventListener("click", toggleVoiceRecording);
  $("#voiceCompareBtn").addEventListener("click", playVoiceComparison);
  $("#voiceSelect").addEventListener("change", selectVoice);
  $("#chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sendAiMessage($("#chatInput").value);
  });
  $("#prevDayBtn").addEventListener("click", () => {
    state.viewDay = Math.max(1, state.viewDay - 1);
    renderToday();
    renderPlan();
  });
  $("#nextDayBtn").addEventListener("click", () => {
    state.viewDay = Math.min(APP_VERSION.days, state.viewDay + 1);
    renderToday();
    renderPlan();
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

window.speechSynthesis?.addEventListener?.("voiceschanged", renderVoiceOptions);
applyHybridProgress(state, APP_VERSION, saveState);
bindEvents();
if (GEMINI_PROXY) {
  // 서버 프록시 사용 시 키 입력이 필요 없으므로 안내로 대체
  state.aiProvider = "gemini";
  const keyInput = $("#apiKeyInput");
  if (keyInput) {
    keyInput.disabled = true;
    keyInput.placeholder = "서버에 연결됨 — 키 입력 불필요";
  }
}
renderProfileGate();
updateProfileSwitch();
updateModeUI();
if (sessionStorage.getItem("kidEnglish.autoEnter")) {
  // 프로필 선택/추가 직후의 새로고침에서는 게이트를 건너뛴다
  sessionStorage.removeItem("kidEnglish.autoEnter");
  hideProfileGate();
}
renderVoiceOptions();
updateStatus();
renderToday();
renderPlan();
renderRoadmap();
renderChat();
