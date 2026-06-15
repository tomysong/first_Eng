import { state, saveState } from "./store.js";
import { APP_VERSION, flowers } from "./data.js";
import { $ } from "./dom.js";

// 식물 성장은 "실제로 오늘 완료한 가장 높은 날(lastCompletedDay)" 기준.
// 28일 완주(versionComplete)면 만개로 고정한다.
function completedDays() {
  if (state.versionComplete) return APP_VERSION.days;
  return Math.max(0, Math.min(state.lastCompletedDay, APP_VERSION.days));
}

// 28일을 7단계로 나눈 성장 곡선. min은 "이 단계에 들어가는 최소 완료일 수".
const STAGES = [
  { min: 0, name: "씨앗", emoji: "🌰", msg: "씨앗을 심었어요. 매일 학습하면 쑥쑥 자라요!" },
  { min: 1, name: "새싹", emoji: "🌱", msg: "새싹이 빼꼼 올라왔어요. 잘하고 있어요!" },
  { min: 5, name: "떡잎", emoji: "🌿", msg: "잎이 두 장 났어요. 계속 가볼까요?" },
  { min: 10, name: "줄기", emoji: "🪴", msg: "줄기가 쑥 자랐어요. 절반 가까이 왔어요!" },
  { min: 16, name: "꽃봉오리", emoji: "🍃", msg: "꽃봉오리가 맺혔어요. 무슨 꽃일까요?" },
  { min: 22, name: "곧 개화", emoji: "🌷", msg: "봉오리에 색이 비쳐요. 며칠 안 남았어요!" },
  { min: 28, name: "활짝", emoji: "🌸", msg: "축하해요! 꽃이 활짝 피었어요!" },
];

function stageIndex(days) {
  let idx = 0;
  STAGES.forEach((stage, i) => {
    if (days >= stage.min) idx = i;
  });
  return idx;
}

// 프로필별로 처음 한 번 무작위 배정. 이후 28일 내내 같은 꽃으로 자란다.
function ensureFlower() {
  if (state.flowerType === "" || state.flowerType == null || flowers[Number(state.flowerType)] == null) {
    state.flowerType = Math.floor(Math.random() * flowers.length);
    saveState();
  }
  return flowers[Number(state.flowerType)];
}

// ---- SVG 조립 헬퍼 ----

// 중심(cx,cy) 둘레로 꽃잎 n장을 회전 배치
function petalRing(cx, cy, n, rx, ry, dist, fill, edge, rot = 0) {
  let out = "";
  for (let i = 0; i < n; i += 1) {
    const angle = rot + (360 / n) * i;
    out += `<ellipse cx="${cx}" cy="${cy - dist}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${edge}" stroke-width="1.4" transform="rotate(${angle} ${cx} ${cy})"/>`;
  }
  return out;
}

function leaf(cx, cy, angle, scale = 1) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${16 * scale}" ry="${7 * scale}" fill="#4ca64c" stroke="#3c8b3c" stroke-width="1.2" transform="rotate(${angle} ${cx} ${cy})"/>`;
}

function stem(topY) {
  return `<path d="M100 176 Q94 ${(176 + topY) / 2} 100 ${topY}" stroke="#3f9b46" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

// 꽃 종류별 만개 모양. style로 살짝씩 다르게 그린다.
function bloom(flower, cx, cy) {
  const { petalCount, petal, petalEdge, center, style } = flower;
  if (style === "sun") {
    return (
      petalRing(cx, cy, petalCount, 6, 16, 18, petal, petalEdge) +
      `<circle cx="${cx}" cy="${cy}" r="13" fill="${center}"/>` +
      `<circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="#5e3414" stroke-width="1.5"/>`
    );
  }
  if (style === "cup") {
    // 튤립: 위로 오므린 컵 느낌으로 꽃잎을 좁게 모음
    return (
      petalRing(cx, cy - 2, petalCount, 7, 15, 9, petal, petalEdge) +
      `<ellipse cx="${cx}" cy="${cy - 4}" rx="9" ry="13" fill="${petal}" stroke="${petalEdge}" stroke-width="1.4"/>` +
      `<circle cx="${cx}" cy="${cy + 2}" r="4" fill="${center}"/>`
    );
  }
  if (style === "layered") {
    // 장미: 바깥 한 겹 + 안쪽 작은 겹
    return (
      petalRing(cx, cy, petalCount, 8, 11, 12, petal, petalEdge) +
      petalRing(cx, cy, 5, 6, 8, 7, petalEdge, petalEdge, 36) +
      `<circle cx="${cx}" cy="${cy}" r="4" fill="${center}"/>`
    );
  }
  if (style === "radial") {
    // 무궁화: 5장 + 중심에서 뻗는 빨간 줄(국화 특징)
    let rays = "";
    for (let i = 0; i < 5; i += 1) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      rays += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * 9}" y2="${cy + Math.sin(a) * 9}" stroke="${center}" stroke-width="1.6"/>`;
    }
    return (
      petalRing(cx, cy, petalCount, 9, 12, 11, petal, petalEdge) +
      `<circle cx="${cx}" cy="${cy}" r="5.5" fill="${center}"/>` +
      rays
    );
  }
  // notch (벚꽃): 5장 + 노란 중심 점
  let dots = "";
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * 2 * i) / 6;
    dots += `<circle cx="${cx + Math.cos(a) * 4}" cy="${cy + Math.sin(a) * 4}" r="1.6" fill="#f0a500"/>`;
  }
  return (
    petalRing(cx, cy, petalCount, 8, 11, 11, petal, petalEdge) +
    `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${center}"/>` +
    dots
  );
}

// 단계별 식물(흙 위 부분)을 그린다. 만개 전에는 꽃 종류를 숨기되,
// 봉오리에는 곧 필 꽃의 색만 살짝 비친다.
function plant(stage, flower) {
  switch (stage) {
    case 0:
      return `<ellipse cx="100" cy="173" rx="6" ry="4" fill="#8a5a2b"/><ellipse cx="100" cy="171" rx="3" ry="2" fill="#a9743b"/>`;
    case 1:
      return stem(156) + leaf(108, 158, 35, 0.55) + leaf(92, 160, -35, 0.55);
    case 2:
      return stem(138) + leaf(116, 150, 35, 0.8) + leaf(84, 152, -35, 0.8);
    case 3:
      return (
        stem(108) +
        leaf(118, 150, 35, 0.85) +
        leaf(82, 152, -35, 0.85) +
        leaf(116, 124, 30, 0.7) +
        leaf(84, 126, -30, 0.7)
      );
    case 4:
      return (
        stem(86) +
        leaf(118, 150, 35, 0.9) +
        leaf(82, 152, -35, 0.9) +
        leaf(116, 122, 30, 0.75) +
        leaf(84, 124, -30, 0.75) +
        `<ellipse cx="100" cy="80" rx="9" ry="13" fill="#5bb05b" stroke="#3c8b3c" stroke-width="1.4"/>`
      );
    case 5:
      return (
        stem(76) +
        leaf(118, 150, 35, 0.9) +
        leaf(82, 152, -35, 0.9) +
        leaf(116, 120, 30, 0.78) +
        leaf(84, 122, -30, 0.78) +
        `<ellipse cx="100" cy="70" rx="10" ry="14" fill="${flower.petalEdge}" stroke="#3c8b3c" stroke-width="1.4"/>` +
        `<path d="M90 72 Q100 60 110 72" fill="none" stroke="#3c8b3c" stroke-width="1.4"/>`
      );
    default: // 6: 만개
      return (
        stem(72) +
        leaf(120, 148, 35, 0.95) +
        leaf(80, 150, -35, 0.95) +
        leaf(116, 116, 30, 0.8) +
        leaf(84, 118, -30, 0.8) +
        bloom(flower, 100, 58)
      );
  }
}

function gardenSvg(stage, flower) {
  return `
    <svg viewBox="0 0 200 240" role="img" aria-label="학습 진도에 따라 자라는 꽃 화분">
      <ellipse cx="100" cy="236" rx="54" ry="6" fill="rgba(0,0,0,0.08)"/>
      ${plant(stage, flower)}
      <path d="M58 186 L142 186 L134 232 L66 232 Z" fill="#d98c5f"/>
      <path d="M58 186 L142 186 L139 200 L61 200 Z" fill="#c97a4d"/>
      <ellipse cx="100" cy="180" rx="48" ry="9" fill="#6b4423"/>
      <rect x="50" y="170" width="100" height="18" rx="5" fill="#e09b6f"/>
      <rect x="50" y="170" width="100" height="6" rx="3" fill="#eaae87"/>
    </svg>`;
}

export function renderGarden() {
  const flower = ensureFlower();
  const days = completedDays();
  const stage = stageIndex(days);
  const info = STAGES[stage];
  const bloomed = stage >= STAGES.length - 1;

  $("#gardenArt").innerHTML = gardenSvg(stage, flower);

  $("#gardenStageName").textContent = `${info.emoji} ${info.name}`;
  $("#gardenDayCount").textContent = `${APP_VERSION.days}일 중 ${days}일째`;
  $("#gardenMsg").textContent = info.msg;

  // 진행 막대
  const pct = Math.round((days / APP_VERSION.days) * 100);
  $("#gardenBarFill").style.width = `${pct}%`;

  // 꽃 종류: 만개 전에는 숨기고, 28일 만개 시 공개
  const reveal = $("#gardenReveal");
  if (bloomed) {
    reveal.classList.add("bloomed");
    reveal.querySelector(".garden-flower-emoji").textContent = flower.emoji;
    reveal.querySelector(".garden-flower-name").textContent = `${flower.ko} (${flower.en})`;
    reveal.querySelector(".garden-flower-meaning").textContent = `꽃말: ${flower.meaning}`;
  } else {
    reveal.classList.remove("bloomed");
    reveal.querySelector(".garden-flower-emoji").textContent = "🤔";
    reveal.querySelector(".garden-flower-name").textContent = "무슨 꽃이 필까요?";
    const left = APP_VERSION.days - days;
    reveal.querySelector(".garden-flower-meaning").textContent =
      days === 0 ? "학습을 시작하면 싹이 터요!" : `만개까지 ${left}일 남았어요`;
  }
}
