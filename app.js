const LEVELS = {
  starter: {
    label: "Starter",
    range: "처음~A0",
    coach: "짧은 인사와 내 이야기부터 시작하면 좋아요.",
  },
  a1: {
    label: "A1",
    range: "기초 회화",
    coach: "문장 하나를 바꿔 말하는 연습을 늘려볼게요.",
  },
  a1plus: {
    label: "A1+",
    range: "자신감 확장",
    coach: "이유 말하기와 짧은 질문 주고받기를 섞어볼게요.",
  },
};

const APP_VERSION = {
  id: "v1",
  title: "AI초딩영어 v.1",
  days: 28,
  next: "v2",
};

const quiz = [
  {
    topic: "Greeting",
    question: "'안녕, 만나서 반가워'에 가장 가까운 문장은?",
    answers: ["Hi, nice to meet you.", "I am eleven years old.", "It is under the desk."],
    correct: 0,
  },
  {
    topic: "Feeling",
    question: "친구가 'How are you?'라고 물으면 자연스러운 대답은?",
    answers: ["I am good, thanks.", "It is a pencil.", "She likes pizza."],
    correct: 0,
  },
  {
    topic: "Like",
    question: "'나는 축구를 좋아해'를 고르세요.",
    answers: ["I like soccer.", "I have soccer.", "I am soccer."],
    correct: 0,
  },
  {
    topic: "Question",
    question: "'너는 무엇을 좋아하니?'",
    answers: ["What do you like?", "Where is your bag?", "Can I go now?"],
    correct: 0,
  },
  {
    topic: "Food",
    question: "식당에서 물을 부탁할 때 자연스러운 말은?",
    answers: ["Can I have some water?", "I can water some have.", "Where water can I?"],
    correct: 0,
  },
  {
    topic: "Time",
    question: "'나는 7시에 일어나'를 고르세요.",
    answers: ["I get up at seven.", "I go seven up.", "I seven get at up."],
    correct: 0,
  },
  {
    topic: "Reason",
    question: "'왜냐하면 재미있어'에 맞는 표현은?",
    answers: ["Because it is fun.", "Before it is fun.", "Behind it is fun."],
    correct: 0,
  },
  {
    topic: "Past",
    question: "'어제 영화를 봤어'에 가장 가까운 문장은?",
    answers: ["I watched a movie yesterday.", "I watch a movie tomorrow.", "I watching a movie now."],
    correct: 0,
  },
  {
    topic: "Invite",
    question: "친구에게 같이 놀자고 할 때 자연스러운 말은?",
    answers: ["Do you want to play together?", "Are you play yesterday?", "What play is desk?"],
    correct: 0,
  },
  {
    topic: "Opinion",
    question: "'나는 그것이 조금 어렵지만 재미있다고 생각해'를 고르세요.",
    answers: [
      "I think it is a little difficult, but fun.",
      "I think fun little but difficult is.",
      "I am think it little difficult.",
    ],
    correct: 0,
  },
];

const curriculumSeeds = {
  starter: [
    ["Hello world", "인사하고 이름 말하기", "Hi, I am Mina."],
    ["Feelings", "기분 말하기", "I am happy today."],
    ["My favorites", "좋아하는 것 말하기", "I like games."],
    ["School things", "물건 묻고 답하기", "It is my notebook."],
    ["Colors and size", "색과 크기 말하기", "It is a small blue bag."],
    ["Family", "가족 소개하기", "This is my brother."],
    ["Review cafe", "배운 표현으로 짧은 주문하기", "Can I have juice?"],
  ],
  a1: [
    ["My day", "하루 일과 말하기", "I get up at seven."],
    ["At school", "수업과 과목 말하기", "I have science today."],
    ["Food talk", "음식 취향 말하기", "I like pasta because it is tasty."],
    ["Weekend plan", "주말 계획 말하기", "I want to ride my bike."],
    ["Directions", "위치와 길 묻기", "It is next to the library."],
    ["Can you?", "할 수 있는 것 말하기", "I can swim well."],
    ["Mini interview", "질문 세 개 이어가기", "What do you do after school?"],
  ],
  a1plus: [
    ["Story starter", "어제 한 일 말하기", "I watched a movie yesterday."],
    ["Why talk", "좋아하는 이유 설명하기", "I like it because it is exciting."],
    ["Compare it", "두 가지 비교하기", "Math is harder than art."],
    ["Help please", "문제 상황에서 부탁하기", "Can you help me with this?"],
    ["Opinion", "생각 말하기", "I think it is useful."],
    ["Role play", "가게와 학교 상황극", "How much is this notebook?"],
    ["Show and tell", "내 물건 소개하기", "This is special because..."],
  ],
};

const dialogues = {
  starter: [
    [
      ["Coach", "Hi! What is your name?", "안녕! 이름이 뭐니?"],
      ["You", "Hi, I am Minjun.", "안녕, 나는 민준이야."],
      ["Coach", "Nice to meet you, Minjun.", "만나서 반가워, 민준아."],
    ],
    [
      ["Coach", "How are you today?", "오늘 기분이 어때?"],
      ["You", "I am happy today.", "오늘 행복해."],
      ["Coach", "Great! I am happy, too.", "좋아! 나도 행복해."],
    ],
  ],
  a1: [
    [
      ["Coach", "What do you do after school?", "방과 후에 무엇을 하니?"],
      ["You", "I play soccer after school.", "방과 후에 축구를 해."],
      ["Coach", "Why do you like soccer?", "왜 축구를 좋아해?"],
      ["You", "Because it is exciting.", "신나기 때문이야."],
    ],
    [
      ["Coach", "Can I have some water?", "물 좀 마실 수 있을까요?"],
      ["You", "Sure. Here you are.", "물론이죠. 여기 있어요."],
      ["Coach", "Thank you.", "고마워요."],
    ],
  ],
  a1plus: [
    [
      ["Coach", "What did you do yesterday?", "어제 무엇을 했니?"],
      ["You", "I watched a movie with my family.", "가족과 영화를 봤어."],
      ["Coach", "How was it?", "어땠어?"],
      ["You", "It was funny and a little surprising.", "재미있고 조금 놀라웠어."],
    ],
    [
      ["Coach", "Which is better, games or books?", "게임과 책 중 무엇이 더 좋아?"],
      ["You", "I think books are better for bedtime.", "잠자기 전에는 책이 더 좋은 것 같아."],
      ["Coach", "Good reason.", "좋은 이유야."],
    ],
  ],
};

const phraseBank = {
  starter: [
    ["Nice to meet you.", "만나서 반가워."],
    ["I am excited.", "나 신나."],
    ["What is this?", "이것은 뭐야?"],
    ["I like music.", "나는 음악을 좋아해."],
  ],
  a1: [
    ["What do you do after school?", "방과 후에 뭐 해?"],
    ["Can I have some water?", "물 좀 마실 수 있을까요?"],
    ["Because it is fun.", "재미있기 때문이야."],
    ["I want to try it.", "그것을 해보고 싶어."],
  ],
  a1plus: [
    ["I think it is useful.", "그것이 유용하다고 생각해."],
    ["It was a little difficult.", "조금 어려웠어."],
    ["Can you help me with this?", "이것 좀 도와줄래?"],
    ["Which one do you prefer?", "어느 쪽을 더 좋아해?"],
  ],
};

const suggestedPrompts = {
  starter: [
    "Hi! I am Minjun.",
    "I like music.",
    "How are you today?",
    "What is your favorite color?",
  ],
  a1: [
    "I play soccer after school.",
    "What do you do on weekends?",
    "I like pizza because it is tasty.",
    "Can we talk about school?",
  ],
  a1plus: [
    "Yesterday, I watched a movie with my family.",
    "I think books are better for bedtime.",
    "Can you ask me three questions?",
    "I want to talk about my weekend plan.",
  ],
};

const chatCharacters = {
  sunny: {
    name: "Sunny",
    emoji: "🐰",
    ko: "명랑 토끼",
    persona:
      "Your character: Sunny, a cheerful bunny friend. You are playful and full of energy, cheer loudly for every try, and sometimes add a cute action like *hop hop*.",
    rate: 0.9,
    pitch: 1.22,
    geminiVoice: "Zephyr",
    openaiVoice: "coral",
  },
  max: {
    name: "Max",
    emoji: "🤖",
    ko: "척척 로봇",
    persona:
      "Your character: Max, a kind robot tutor. You speak slowly and clearly, love numbers and facts, and sometimes say 'Beep!' when the student does well.",
    rate: 0.78,
    pitch: 0.92,
    geminiVoice: "Charon",
    openaiVoice: "onyx",
  },
  coco: {
    name: "Coco",
    emoji: "🐱",
    ko: "호기심 고양이",
    persona:
      "Your character: Coco, a curious cat. You are full of questions, get excited about small details, and sometimes add a soft 'Meow!'.",
    rate: 0.86,
    pitch: 1.1,
    geminiVoice: "Aoede",
    openaiVoice: "nova",
  },
};

const yearlyRoadmap = [
  {
    version: "v1",
    month: "Month 1",
    title: "말문 열기",
    focus: "인사, 감정, 좋아하는 것, 학교 물건",
    unlock: "기초 문장 20개를 듣고 따라 말한 뒤 v2 요청",
  },
  {
    version: "v2",
    month: "Month 2",
    title: "My World",
    focus: "가족, 친구, 학교생활, 취미 소개",
    unlock: "v1 표현 복습 후 자기소개 1분 말하기",
  },
  {
    version: "v3",
    month: "Month 3",
    title: "Daily Conversation",
    focus: "카페, 가게, 교실, 도움 요청 역할극",
    unlock: "v2 자기소개 문장 재사용 후 상황극 진입",
  },
  {
    version: "v4",
    month: "Month 4",
    title: "Story Speaking",
    focus: "어제 한 일, 주말 이야기, 순서 말하기",
    unlock: "과거형 핵심 표현 복습 후 짧은 이야기 만들기",
  },
  {
    version: "v5",
    month: "Month 5",
    title: "Opinion English",
    focus: "I think, because, agree, better than",
    unlock: "좋아하는 이유 말하기 복습 후 의견 말하기",
  },
  {
    version: "v6",
    month: "Month 6",
    title: "Mission English",
    focus: "영어로 미션 해결, 초대, 주문, 계획하기",
    unlock: "역할극 표현 복습 후 미션 성공 배지",
  },
  {
    version: "v7",
    month: "Month 7",
    title: "Travel Starter",
    focus: "공항, 호텔, 길 묻기, 여행 물건",
    unlock: "도움 요청 표현 복습 후 여행 역할극",
  },
  {
    version: "v8",
    month: "Month 8",
    title: "School Project",
    focus: "발표, 그림 설명, 간단한 조사 결과 말하기",
    unlock: "내 물건 소개 복습 후 90초 발표",
  },
  {
    version: "v9",
    month: "Month 9",
    title: "Story Maker",
    focus: "캐릭터, 문제, 해결, 결말 만들기",
    unlock: "과거형과 순서 표현 복습 후 이야기 완성",
  },
  {
    version: "v10",
    month: "Month 10",
    title: "Culture Talk",
    focus: "음식, 명절, 놀이, 나라 비교",
    unlock: "비교 표현 복습 후 한국 문화 소개",
  },
  {
    version: "v11",
    month: "Month 11",
    title: "Confidence Chat",
    focus: "3분 자유대화, 되묻기, 고쳐 말하기",
    unlock: "약한 표현 자동 복습 후 자유대화",
  },
  {
    version: "v12",
    month: "Month 12",
    title: "My English Show",
    focus: "1년 포트폴리오, 최종 인터뷰, 발표 녹음",
    unlock: "v1~v11 핵심 문장 복습 후 최종 쇼케이스",
  },
];

const state = {
  level: localStorage.getItem("kidEnglish.level") || "",
  progressDay: Number(localStorage.getItem("kidEnglish.day") || 1),
  viewDay: 1,
  streak: Number(localStorage.getItem("kidEnglish.streak") || 0),
  lastCompletedDate: localStorage.getItem("kidEnglish.lastCompletedDate") || "",
  lastCompletedDay: Number(localStorage.getItem("kidEnglish.lastCompletedDay") || 0),
  versionComplete: localStorage.getItem("kidEnglish.versionComplete") === "true",
  updateRequested: localStorage.getItem("kidEnglish.updateRequested") === "true",
  quizIndex: 0,
  score: 0,
  sentenceIndex: 0,
  aiProvider: localStorage.getItem("kidEnglish.aiProvider") || "gemini",
  aiKey: localStorage.getItem("kidEnglish.aiKey") || "",
  chatCharacter: localStorage.getItem("kidEnglish.chatCharacter") || "sunny",
  voiceName: localStorage.getItem("kidEnglish.voiceName") || "",
  chatMessages: JSON.parse(localStorage.getItem("kidEnglish.chatMessages") || "[]"),
  lastAiReply: localStorage.getItem("kidEnglish.lastAiReply") || "",
  weakPhrases: JSON.parse(localStorage.getItem("kidEnglish.weakPhrases") || "[]"),
  bossCleared: JSON.parse(localStorage.getItem("kidEnglish.bossCleared") || "[]"),
  bossKey: "",
  bossTargets: [],
  bossPassed: [],
};
state.viewDay = state.progressDay;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function saveState() {
  localStorage.setItem("kidEnglish.level", state.level);
  localStorage.setItem("kidEnglish.day", String(state.progressDay));
  localStorage.setItem("kidEnglish.streak", String(state.streak));
  localStorage.setItem("kidEnglish.lastCompletedDate", state.lastCompletedDate);
  localStorage.setItem("kidEnglish.lastCompletedDay", String(state.lastCompletedDay));
  localStorage.setItem("kidEnglish.versionComplete", String(state.versionComplete));
  localStorage.setItem("kidEnglish.updateRequested", String(state.updateRequested));
  localStorage.setItem("kidEnglish.aiProvider", state.aiProvider);
  localStorage.setItem("kidEnglish.aiKey", state.aiKey);
  localStorage.setItem("kidEnglish.chatCharacter", state.chatCharacter);
  localStorage.setItem("kidEnglish.voiceName", state.voiceName);
  localStorage.setItem("kidEnglish.chatMessages", JSON.stringify(state.chatMessages.slice(-16)));
  localStorage.setItem("kidEnglish.lastAiReply", state.lastAiReply);
  localStorage.setItem("kidEnglish.weakPhrases", JSON.stringify(state.weakPhrases.slice(0, 12)));
  localStorage.setItem("kidEnglish.bossCleared", JSON.stringify(state.bossCleared));
}

function dateStamp(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function applyHybridProgress() {
  const completedOnPreviousDate = state.lastCompletedDate && state.lastCompletedDate !== dateStamp();
  const currentDayWasCompleted = state.lastCompletedDay === state.progressDay;
  if (!state.versionComplete && completedOnPreviousDate && currentDayWasCompleted) {
    if (state.progressDay < APP_VERSION.days) {
      state.progressDay += 1;
    } else {
      state.versionComplete = true;
    }
    state.viewDay = state.progressDay;
    saveState();
  }
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
  $("#completeBtn").textContent =
    state.lastCompletedDate === dateStamp() ? "오늘 완료 ✓" : "오늘 완료";
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
  localStorage.setItem("kidEnglish.pendingUpdateRequest", JSON.stringify(payload));
  state.updateRequested = true;
  saveState();
  renderPlan();
}

function buildUpdatePayload() {
  const { levelKey } = getLesson();
  return {
    app: "AI초딩영어",
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

function getCoachPrompt() {
  const { levelKey, day } = getLesson();
  return [
    "You are a friendly English conversation coach for a Korean elementary school 5th grader.",
    activeCharacter().persona,
    "Always stay in character.",
    `Student level: ${LEVELS[levelKey].label}. Today's topic: ${day.title}. Goal: ${day.goal}.`,
    "Reply in this exact style:",
    "1) One short, natural English response at the student's level.",
    "2) A tiny Korean hint in parentheses.",
    "3) One simple follow-up question in English.",
    "Keep it warm, safe, and under 55 words. Do not discuss adult, violent, romantic, or private personal topics.",
  ].join("\n");
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

  if (state.chatMessages.length === 0) {
    const { day } = getLesson();
    const character = activeCharacter();
    state.chatMessages = [
      {
        role: "ai",
        character: state.chatCharacter,
        text: `Hi! I am ${character.name} ${character.emoji}. Let's talk about "${day.title}". Try one sentence in English. What did you do today?`,
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
  addChatBubble("system", "AI가 짧고 쉬운 영어 답변을 준비하고 있어요...");

  try {
    const reply =
      state.aiProvider === "gemini"
        ? await callGemini(cleanText)
        : state.aiProvider === "openai"
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
  if (!state.aiKey) return makeLocalReply(text);
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": state.aiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: getCoachPrompt() }] },
        contents: buildGeminiHistory(text),
        generationConfig: {
          temperature: 0.7,
          // thinking 토큰이 출력 한도에 합산되어 빈 응답이 오는 것을 방지
          maxOutputTokens: 400,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Gemini API 오류");
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() || makeLocalReply(text);
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
  const prompts = suggestedPrompts[activeLevel()];
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  $("#chatInput").value = prompt;
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
  return (
    !state.voiceName &&
    Boolean(state.aiKey) &&
    (state.aiProvider === "gemini" || state.aiProvider === "openai") &&
    Date.now() >= cloudTtsBlockedUntil
  );
}

function defaultCloudVoice() {
  return state.aiProvider === "gemini" ? "Leda" : "marin";
}

function characterCloudVoice(character) {
  return state.aiProvider === "gemini" ? character.geminiVoice : character.openaiVoice;
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
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": state.aiKey,
        },
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
  const key = `${state.aiProvider}:${voice}:${text}`;
  if (ttsCache.has(key)) return ttsCache.get(key);

  const url =
    state.aiProvider === "gemini" ? await fetchGeminiTts(text, voice) : await fetchOpenAiTts(text, voice);
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
  localStorage.removeItem("kidEnglish.level");
  localStorage.removeItem("kidEnglish.day");
  localStorage.removeItem("kidEnglish.streak");
  localStorage.removeItem("kidEnglish.lastCompletedDate");
  localStorage.removeItem("kidEnglish.lastCompletedDay");
  localStorage.removeItem("kidEnglish.versionComplete");
  localStorage.removeItem("kidEnglish.updateRequested");
  localStorage.removeItem("kidEnglish.chatMessages");
  localStorage.removeItem("kidEnglish.pendingUpdateRequest");
  localStorage.removeItem("kidEnglish.lastAiReply");
  localStorage.removeItem("kidEnglish.weakPhrases");
  localStorage.removeItem("kidEnglish.bossCleared");
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

function bindEvents() {
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
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
applyHybridProgress();
bindEvents();
renderVoiceOptions();
updateStatus();
renderToday();
renderPlan();
renderRoadmap();
renderChat();
