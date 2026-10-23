const KEYS = {
  highScore: "face-snake:highScore",
  head: "face-snake:headDataUrl",
  food: "face-snake:foodDataUrl",
  skin: "face-snake:skinId",
  difficulty: "face-snake:difficulty",
  sound: "face-snake:soundEnabled",
  foodCount: "face-snake:foodCount",
  theme: "face-snake:theme",
};

export function getHighScore() {
  const n = Number(localStorage.getItem(KEYS.highScore) || 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function setHighScore(score) {
  const prev = getHighScore();
  if (score > prev) {
    localStorage.setItem(KEYS.highScore, String(score));
    return score;
  }
  return prev;
}

export function getImageDataUrl(kind) {
  try {
    return localStorage.getItem(kind === "head" ? KEYS.head : KEYS.food) || null;
  } catch {
    return null;
  }
}

export function setImageDataUrl(kind, dataUrl) {
  const key = kind === "head" ? KEYS.head : KEYS.food;
  try {
    if (dataUrl) localStorage.setItem(key, dataUrl);
    else localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn("localStorage 写入失败（可能超额）", err);
    return false;
  }
}

export function getSkinId() {
  return localStorage.getItem(KEYS.skin) || "classic";
}

export function setSkinId(id) {
  localStorage.setItem(KEYS.skin, id || "classic");
}

export function getDifficultyId() {
  return localStorage.getItem(KEYS.difficulty) || "medium";
}

export function setDifficultyId(id) {
  localStorage.setItem(KEYS.difficulty, id || "medium");
}

export function getSoundEnabled() {
  const v = localStorage.getItem(KEYS.sound);
  if (v === null) return true;
  return v !== "0";
}

export function setSoundEnabled(on) {
  localStorage.setItem(KEYS.sound, on ? "1" : "0");
}

export function getFoodCount() {
  const n = Number(localStorage.getItem(KEYS.foodCount) || 1);
  if (n === 2 || n === 3) return n;
  return 1;
}

export function setFoodCount(n) {
  const v = n === 2 || n === 3 ? n : 1;
  localStorage.setItem(KEYS.foodCount, String(v));
}

export function getThemeId() {
  const t = localStorage.getItem(KEYS.theme);
  return t === "light" ? "light" : "dark";
}

export function setThemeId(id) {
  localStorage.setItem(KEYS.theme, id === "light" ? "light" : "dark");
}
