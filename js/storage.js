const KEYS = {
  highScore: "face-snake:highScore",
  highScoreTimed: "face-snake:highScoreTimed",
  mode: "face-snake:mode",
  mapSelect: "face-snake:mapSelect",
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

/** @returns {'empty'|'random'} 默认空板；random=每局从障碍图池抽取 */
export function getMapSelectId() {
  return localStorage.getItem(KEYS.mapSelect) === "random" ? "random" : "empty";
}

export function setMapSelectId(id) {
  localStorage.setItem(KEYS.mapSelect, id === "random" ? "random" : "empty");
}

function mapScoreKey(modeId, mapId) {
  return `face-snake:high:${modeId === "timed" ? "timed" : "classic"}:${mapId || "empty"}`;
}

/** 分地图 + 分模式记最高分；空板兼容旧 key */
export function getMapHighScore(modeId, mapId) {
  const mode = modeId === "timed" ? "timed" : "classic";
  const map = mapId || "empty";
  const keyed = readScore(mapScoreKey(mode, map));
  if (keyed > 0) return keyed;
  if (map === "empty") {
    return mode === "timed" ? getTimedHighScore() : getHighScore();
  }
  return 0;
}

export function setMapHighScore(modeId, mapId, score) {
  const mode = modeId === "timed" ? "timed" : "classic";
  const map = mapId || "empty";
  const key = mapScoreKey(mode, map);
  const legacy =
    map === "empty"
      ? mode === "timed"
        ? getTimedHighScore()
        : getHighScore()
      : 0;
  const prev = Math.max(readScore(key), legacy);
  const next = writeScoreIfBest(key, score, prev);
  // 空板同步旧 key，避免老版页面读不到
  if (map === "empty") {
    if (mode === "timed") setTimedHighScore(score);
    else setHighScore(score);
  }
  return next;
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
