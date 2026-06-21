import { state, saveState } from "./store.js";
import { LEVELS, APP_VERSION } from "./data.js";
import { ensureProfiles } from "./profiles.js";
import { $ } from "./dom.js";

// ---- 보호자 모드: 아이 화면(테스트·오늘·AI대화)과 보호자 화면 분리 ----
// 보호자가 직접 만든 4자리 비밀번호로 잠근다. 5회 오답 시 60초 잠금,
// 재설정은 두 자리 곱셈 검증을 거친다.

const PIN_KEY = "kidEnglish.parentPinHash";
const PIN_FAILS_KEY = "kidEnglish.pinFails";
const PIN_LOCK_KEY = "kidEnglish.pinLockUntil";

let gateMode = "enter"; // enter | setup | reset
let resetAnswer = 0;

let _switchTab = () => {};
export function initParent({ switchTab }) {
  _switchTab = switchTab;
}

export function isParentMode() {
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

export function openParentGate() {
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

export async function submitParentGate(event) {
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

export function startPinReset() {
  gateMode = "reset";
  renderParentGate("");
}

export function lockParentMode() {
  sessionStorage.removeItem("kidEnglish.parentMode");
  updateModeUI();
  _switchTab("today");
}

// Service Worker 등록·캐시를 모두 비우고 새로고침해 최신 버전을 받는다.
// (프로필·진도 localStorage는 건드리지 않음)
export async function clearAppCache() {
  const msg = $("#cacheResetMsg");
  if (msg) msg.textContent = "캐시를 비우는 중...";
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if (msg) msg.textContent = "완료! 최신 버전으로 다시 불러옵니다...";
    setTimeout(() => location.reload(), 600);
  } catch {
    if (msg) msg.textContent = "초기화에 실패했어요. 다시 시도해주세요.";
  }
}

function profileStoreGet(profileId, name) {
  const key = profileId === "me" ? `kidEnglish.${name}` : `kidEnglish.${profileId}.${name}`;
  return localStorage.getItem(key);
}

export function renderParentDashboard() {
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

export { updateModeUI };
