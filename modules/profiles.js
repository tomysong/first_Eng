// ---- 프로필 (로그인 없는 사용자 전환) ----
// 한 기기를 여러 아이가 같이 써도 학습 기록이 섞이지 않도록
// 프로필별로 localStorage 키를 분리한다. 서버/계정은 필요 없다.

export const PROFILES_KEY = "kidEnglish.profiles";
export const ACTIVE_PROFILE_KEY = "kidEnglish.activeProfile";
export const PROFILE_EMOJIS = ["🦊", "🐻", "🐯", "🐸", "🐥", "🦄", "🐬", "🦁"];

export function ensureProfiles() {
  let profiles = [];
  try {
    profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
  } catch {
    profiles = [];
  }
  if (!profiles.length) {
    // 첫 프로필 "나"는 기존(접두사 없는) 데이터를 그대로 이어받는다
    profiles = [{ id: "me", name: "나", emoji: "🙂" }];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_PROFILE_KEY, "me");
  }
  return profiles;
}

export function activeProfileId() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY) || "me";
}

export function currentProfile() {
  const profiles = ensureProfiles();
  return profiles.find((profile) => profile.id === activeProfileId()) || profiles[0];
}

export function storageKey(name) {
  const id = activeProfileId();
  return id === "me" ? `kidEnglish.${name}` : `kidEnglish.${id}.${name}`;
}

export function storeGet(name) {
  return localStorage.getItem(storageKey(name));
}

export function storeSet(name, value) {
  localStorage.setItem(storageKey(name), value);
}

export function storeRemove(name) {
  localStorage.removeItem(storageKey(name));
}


