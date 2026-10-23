const KEYS = {
  highScore: "face-snake:highScore",
  head: "face-snake:headDataUrl",
  food: "face-snake:foodDataUrl",
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
