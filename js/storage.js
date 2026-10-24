const KEYS = {
  highScore: "face-snake:highScore",
  highScoreTimed: "face-snake:highScoreTimed",
  mode: "face-snake:mode",
  head: "face-snake:headDataUrl",
  food: "face-snake:foodDataUrl",
  skin: "face-snake:skinId",
  difficulty: "face-snake:difficulty",
  sound: "face-snake:soundEnabled",
  foodCount: "face-snake:foodCount",
  theme: "face-snake:theme",
};

function readScore(key) {
  const n = Number(localStorage.getItem(key) || 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function writeScoreIfBest(key, score, prev) {
  if (score > prev) {
    localStorage.setItem(key, String(score));
    return score;
  }
  return prev;
}

export function getHighScore() {
  return readScore(KEYS.highScore);
}

export function setHighScore(score) {
  return writeScoreIfBest(KEYS.highScore, score, getHighScore());
}

/** 限时 60 秒模式独立最高分 */
export function getTimedHighScore() {
  return readScore(KEYS.highScoreTimed);
}

export function setTimedHighScore(score) {
  return writeScoreIfBest(KEYS.highScoreTimed, score, getTimedHighScore());
}

/** @returns {'classic'|'timed'} */
export function getModeId() {
  return localStorage.getItem(KEYS.mode) === "timed" ? "timed" : "classic";
}

export function setModeId(id) {
  localStorage.setItem(KEYS.mode, id === "timed" ? "timed" : "classic");
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
