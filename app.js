import {
  LEVELS,
  APP_VERSION,
  quiz,
  curriculumSeeds,
  dialogues,
  phraseBank,
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
  storeSet,
  storeRemove,
} from "./modules/profiles.js";
import { applyHybridProgress, dateStamp } from "./modules/progress.js";
import { sttSupported, isRecording, startRecording, stopRecording, transcribe } from "./modules/stt.js";
import { state, saveState, activeLevel } from "./modules/store.js";
import { GEMINI_PROXY } from "./modules/api.js";
import { renderGarden } from "./modules/garden.js";
import {
  speak,
  speakLine,
  stopAllAudio,
  renderVoiceOptions,
  selectVoice,
  primeAudio,
  bumpSpeakSession,
  getSpeakSession,
} from "./modules/tts.js";
import {
  initChat,
  renderChat,
  sendAiMessage,
  activeCharacter,
  renderTalkMissions,
  saveAiSettings,
  suggestChatPrompt,
  startAiRecognition,
} from "./modules/chat.js";
import {
  initParent,
  isParentMode,
  openParentGate,
  submitParentGate,
  lockParentMode,
  startPinReset,
  renderParentDashboard,
  updateModeUI,
} from "./modules/parent.js";

ensureProfiles();

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
  if (tabId === "garden") renderGarden();
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
  bumpSpeakSession();
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
  const session = bumpSpeakSession();

  for (const line of lines) {
    if (session !== getSpeakSession()) return;
    await speakLine(line, 0.84, 1.04, "");
    if (session !== getSpeakSession()) return;
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

async function startRecognition() {
  const target = dialogueTarget();

  if (!sttSupported()) {
    $("#coachLine").textContent = `이 브라우저에서는 녹음이 안 돼요. 대신 "${target}"를 크게 따라 말해보세요.`;
    speak(target, 0.76);
    return;
  }

  // 녹음 중이면: 멈추고 Whisper로 전사한 뒤 발음 채점
  if (isRecording()) {
    const blob = await stopRecording();
    $("#recordBtn").textContent = "말하기";
    if (!blob) return;
    $("#coachLine").textContent = "🎧 듣고 있어요...";
    try {
      const transcript = await transcribe(blob);
      if (!transcript) {
        $("#coachLine").textContent = "잘 안 들렸어요. 다시 한 번 말해볼까요?";
        return;
      }
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
    } catch {
      $("#coachLine").textContent = "음성 변환에 실패했어요. 잠시 후 다시 눌러주세요.";
    }
    return;
  }

  // 녹음 시작
  try {
    await startRecording();
    $("#recordBtn").textContent = "🔴 멈추기";
    $("#coachLine").textContent = `"${target}"를 말한 뒤, 버튼을 다시 누르세요.`;
  } catch {
    $("#coachLine").textContent = "마이크 권한을 허용해주세요.";
  }
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
  storeRemove("flowerType");
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
  // 새로 시작하면 다음 화분 진입 때 꽃을 다시 무작위 배정한다
  state.flowerType = "";
  $("#testIntro").classList.remove("hidden");
  $("#quizPanel").classList.add("hidden");
  $("#resultPanel").classList.add("hidden");
  updateStatus();
  renderToday();
  renderPlan();
  renderRoadmap();
  renderChat();
  renderGarden();
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
  renderGarden();
  $("#coachLine").textContent = state.versionComplete
    ? `${APP_VERSION.id} 28일을 완료했어요. 🌸 화분 탭에서 활짝 핀 꽃을 확인하고, ${APP_VERSION.next} 업데이트를 요청할 수 있어요.`
    : `Day ${state.progressDay} 완료! 🌱 화분 탭에서 꽃이 자란 모습을 볼 수 있어요. 내일 다음 미션(Day ${state.progressDay + 1})으로 넘어가요.`;
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

function bindEvents() {
  // iOS: 첫 사용자 제스처에서 오디오를 깨워 두면 이후 AI 음성이 정상 재생된다
  document.addEventListener("pointerdown", primeAudio, { once: true });
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
    speak(extractEnglishForSpeech(state.lastAiReply));
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

// AI 답변에서 영어 부분만 골라 읽기용으로 다듬는다 (aiReadBtn 핸들러용)
function extractEnglishForSpeech(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/\([^)]*\)/g, "").trim())
    .filter((line) => /[a-z]/i.test(line))
    .slice(0, 2)
    .join(" ");
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

window.speechSynthesis?.addEventListener?.("voiceschanged", renderVoiceOptions);
applyHybridProgress(state, APP_VERSION, saveState);
initChat({ getLesson });
initParent({ switchTab });
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
