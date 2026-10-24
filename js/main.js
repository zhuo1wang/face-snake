import { createGame } from "./game.js";
import { createInput } from "./input.js";
import {
  getModeId,
  setModeId as saveModeId,
  getMapSelectId,
  setMapSelectId as saveMapSelectId,
  getMapHighScore,
  setMapHighScore,
  getImageDataUrl,
  setImageDataUrl,
  getSkinId,
  setSkinId,
  getDifficultyId,
  setDifficultyId,
  getSoundEnabled,
  setSoundEnabled as saveSoundEnabled,
  getFoodCount,
  setFoodCount as saveFoodCount,
  getThemeId,
  setThemeId as saveThemeId,
} from "./storage.js";
import { loadImage, shrinkDataUrlIfNeeded } from "./avatar.js";
import { createCropEditor, loadImageFromFile } from "./crop.js";
import {
  SKIN_LIST,
  getSkin,
  DIFFICULTY_LIST,
  getDifficulty,
} from "./skins.js";
import {
  getMap,
  pickRandomObstacleMap,
  MAP_EMPTY,
  GRID_DESKTOP,
  GRID_MOBILE,
} from "./maps.js";
import {
  setSoundEnabled,
  unlockAudio,
  playEat,
  playDie,
  playClick,
  playStart,
} from "./sound.js";
import {
  createScoreCard,
  downloadScoreCard,
  shareScoreCard,
  canShareScoreImage,
} from "./share.js";

const els = {
  viewHome: document.getElementById("view-home"),
  viewSettings: document.getElementById("view-settings"),
  btnOpenSettings: document.getElementById("btn-open-settings"),
  btnBackHome: document.getElementById("btn-back-home"),
  canvas: document.getElementById("game"),
  wrap: document.getElementById("canvas-wrap"),
  scoreCards: document.getElementById("score-cards"),
  score: document.getElementById("score"),
  high: document.getElementById("high-score"),
  highLabel: document.getElementById("high-score-label"),
  timerCard: document.getElementById("timer-card"),
  timer: document.getElementById("timer"),
  modeRow: document.getElementById("mode-row"),
  mapRow: document.getElementById("map-row"),
  overlay: document.getElementById("overlay"),
  overlayMascot: document.getElementById("overlay-mascot"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayHint: document.getElementById("overlay-hint"),
  btnOverlayStart: document.getElementById("btn-overlay-start"),
  btnSaveScore: document.getElementById("btn-save-score"),
  btnShareScore: document.getElementById("btn-share-score"),
  btnStart: document.getElementById("btn-start"),
  btnPause: document.getElementById("btn-pause"),
  btnReset: document.getElementById("btn-reset"),
  btnSetHead: document.getElementById("btn-set-head"),
  btnSetFood: document.getElementById("btn-set-food"),
  previewHead: document.getElementById("preview-head"),
  previewFood: document.getElementById("preview-food"),
  skinRow: document.getElementById("skin-row"),
  difficultyRow: document.getElementById("difficulty-row"),
  foodCountRow: document.getElementById("food-count-row"),
  themeRow: document.getElementById("theme-row"),
  toggleSound: document.getElementById("toggle-sound"),
  btnInstallPwa: document.getElementById("btn-install-pwa"),
  pwaHint: document.getElementById("pwa-hint"),
  pwaIosHint: document.getElementById("pwa-ios-hint"),
  modal: document.getElementById("avatar-modal"),
  modalTitle: document.getElementById("modal-title"),
  cropPreview: document.getElementById("crop-preview"),
  zoomSlider: document.getElementById("zoom-slider"),
  fileInput: document.getElementById("file-input"),
  btnRestore: document.getElementById("btn-restore-default"),
  btnConfirm: document.getElementById("btn-confirm-avatar"),
  btnCloseModal: document.getElementById("btn-close-modal"),
  wechatTip: document.getElementById("wechat-tip"),
  btnDismissWechat: document.getElementById("btn-dismiss-wechat"),
};

const skinThumbs = Object.fromEntries(
  SKIN_LIST.map((s) => [s.id, { head: s.makeHead(), food: s.makeFood() }])
);

const TIMED_SECONDS = 60;
const MODE_OPTIONS = [
  { id: "classic", name: "经典无尽" },
  { id: "timed", name: "限时 60 秒" },
];
const MAP_SELECT_OPTIONS = [
  { id: "empty", name: "空板" },
  { id: "random", name: "每局随机" },
];

let skinId = getSkin(getSkinId()).id;
let difficultyId = getDifficulty(getDifficultyId()).id;
let foodCount = getFoodCount();
let themeId = getThemeId();
let modeId = getModeId();
let mapSelectId = getMapSelectId();
let activeMap = MAP_EMPTY;
let gridSize = preferredGridSize();
let currentSkin = getSkin(skinId);

function preferredGridSize() {
  // 窄屏手机自动 14 格，单元格大约比 20 格大 40%+
  if (typeof window !== "undefined" && window.matchMedia) {
    if (window.matchMedia("(max-width: 600px)").matches) return GRID_MOBILE;
  }
  return GRID_DESKTOP;
}
if (getSkinId() !== skinId) setSkinId(skinId);
if (getDifficultyId() !== difficultyId) setDifficultyId(difficultyId);

let headDataUrl = getImageDataUrl("head") || skinThumbs[skinId].head;
let foodDataUrl = getImageDataUrl("food") || skinThumbs[skinId].food;
let editingKind = "head";
let baselineDataUrl = null;
let wantDefault = false;
let lastGameScore = 0;
let deferredInstallPrompt = null;

const soundOn = getSoundEnabled();
els.toggleSound.checked = soundOn;
setSoundEnabled(soundOn);

const cropper = createCropEditor(els.cropPreview, els.zoomSlider);

function isTimedMode() {
  return modeId === "timed";
}

function readModeHigh() {
  return getMapHighScore(modeId, activeMap.id);
}

function writeModeHigh(score) {
  return setMapHighScore(modeId, activeMap.id, score);
}

function modeLabel() {
  return isTimedMode() ? "限时 60 秒" : "经典无尽";
}

function mapLabel() {
  return activeMap?.name || "空板";
}

/** 准备本局地图：空板固定；随机则从障碍池抽取（按当前格数生成） */
function prepareRoundMap() {
  const n = game.getGridSize();
  activeMap =
    mapSelectId === "random"
      ? pickRandomObstacleMap(n)
      : getMap("empty", n);
  game.setMap(activeMap);
  refreshHighScoreUi();
}

/** 按屏幕宽度切换格数；进行中则打断并重开准备态 */
function applyPreferredGridSize(forceReset = false) {
  const next = preferredGridSize();
  const changed = game.setGridSize(next);
  gridSize = game.getGridSize();
  if (!changed && !forceReset) return;
  const wasPlaying = game.isRunning() || game.isPaused();
  prepareRoundMap();
  game.reset();
  els.score.textContent = "0";
  if (isTimedMode()) updateTimerDisplay(TIMED_SECONDS * 1000);
  if (wasPlaying) {
    showOverlay("贴图贪吃蛇", readyHint(), "开始游戏", false);
    syncButtons("ready");
  }
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay(ms) {
  if (!els.timer) return;
  els.timer.textContent = formatTime(ms);
  els.timerCard?.classList.toggle("is-urgent", ms > 0 && ms <= 10000);
}

function refreshHighScoreUi() {
  if (els.highLabel) {
    if (isTimedMode()) {
      els.highLabel.textContent =
        activeMap.id === "empty" ? "限时最高" : `${activeMap.name}·限时`;
    } else {
      els.highLabel.textContent =
        activeMap.id === "empty" ? "最高分" : `${activeMap.name}最高`;
    }
  }
  els.high.textContent = String(readModeHigh());
}

function applyModeUi() {
  const timed = isTimedMode();
  els.scoreCards?.classList.toggle("has-timer", timed);
  if (els.timerCard) els.timerCard.hidden = !timed;
  refreshHighScoreUi();
  updateTimerDisplay(timed ? TIMED_SECONDS * 1000 : 0);
}

const game = createGame(els.canvas, {
  gridSize: preferredGridSize(),
  onScore(score) {
    els.score.textContent = String(score);
    els.high.textContent = String(writeModeHigh(score));
  },
  onEat() {
    playEat();
  },
  onTime(ms) {
    updateTimerDisplay(ms);
  },
  onGameOver(score, reason = "crash") {
    lastGameScore = score;
    // 撞死与时间到都保留本局分；仅撞死播死亡音
    if (reason === "crash") playDie();
    else playStart();
    const high = writeModeHigh(score);
    els.high.textContent = String(high);
    const mapBit = activeMap.id === "empty" ? "" : ` · ${activeMap.name}`;
    if (reason === "time") {
      showOverlay(
        "时间到",
        `60 秒得分 ${score}${mapBit} · 最高 ${high}`,
        "再来一局",
        true
      );
    } else if (isTimedMode()) {
      showOverlay(
        "游戏结束",
        `本局得分 ${score}${mapBit} · 最高 ${high}`,
        "再来一局",
        true
      );
    } else {
      showOverlay(
        "游戏结束",
        `本局得分 ${score}${mapBit} · 最高 ${high}`,
        "再来一局",
        true
      );
    }
    syncButtons("over");
  },
  onStatus(status) {
    if (status === "playing") {
      hideOverlay();
      syncButtons("playing");
    } else if (status === "paused") {
      showOverlay("已暂停", "点继续或按开始恢复", "继续", false);
      syncButtons("paused");
    } else if (status === "ready") {
      showOverlay("贴图贪吃蛇", readyHint(), "开始游戏", false);
      syncButtons("ready");
    }
  },
});

function readyHint() {
  const parts = [];
  if (isTimedMode()) parts.push("限时 60 秒");
  if (mapSelectId === "random") parts.push(`本局地图：${mapLabel()}`);
  else if (!isTimedMode()) parts.push("方向键 / WASD / 滑动屏幕");
  if (isTimedMode() && mapSelectId === "empty") {
    parts.push("撞死也保留分数");
  }
  return parts.join(" · ") || "方向键 / WASD / 滑动屏幕";
}

createInput({
  onDirection: (dir) => game.setDirection(dir),
  swipeTarget: els.wrap,
});

function skinDefault(kind) {
  const pack = skinThumbs[currentSkin.id] || skinThumbs.classic;
  return kind === "head" ? pack.head : pack.food;
}

async function applyAvatars() {
  els.previewHead.src = headDataUrl;
  els.previewFood.src = foodDataUrl;
  await game.setHeadImage(headDataUrl);
  await game.setFoodImage(foodDataUrl);
}

function applyBodyTheme() {
  game.setBodyTheme(currentSkin.body, currentSkin.bodyEnd);
}

function applyDifficulty() {
  game.setTickMs(getDifficulty(difficultyId).tickMs);
}

function applyFoodCount() {
  game.setFoodCount(foodCount);
}

function applyMode() {
  game.setTimeLimit(isTimedMode() ? TIMED_SECONDS : 0);
  applyModeUi();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", themeId);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeId === "light" ? "#eaf5ee" : "#0a100e");
  }
}

function showOverlay(title, hint, btnText, showScoreActions) {
  els.overlay.hidden = false;
  els.overlayTitle.textContent = title;
  els.overlayHint.textContent = hint;
  els.btnOverlayStart.textContent = btnText;
  els.btnSaveScore.hidden = !showScoreActions;
  // 分享按钮：仅在游戏结束且浏览器支持时显示
  els.btnShareScore.hidden = !(showScoreActions && canShareScoreImage());
  // 贴纸吉祥物 + 浅色开局样式，仅在「开始游戏」引导时使用
  const isStartGuide = btnText === "开始游戏" && !showScoreActions;
  els.overlay.classList.toggle("overlay--home", isStartGuide);
  setMascotPlaying(isStartGuide);
}

function setMascotPlaying(show) {
  const el = els.overlayMascot;
  if (!el) return;
  el.hidden = !show;
  const reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 减少动效时用静态海报；否则播透明 WebP 动图
  const animSrc = "assets/mascot-anim.webp";
  const stillSrc = "assets/mascot.png";
  const want = !show ? el.src : reduceMotion ? stillSrc : animSrc;
  if (show && el.getAttribute("src") !== want) {
    el.src = want;
  }
}

function hideOverlay() {
  els.overlay.hidden = true;
  els.btnSaveScore.hidden = true;
  els.btnShareScore.hidden = true;
  setMascotPlaying(false);
}

async function buildScoreCanvas() {
  return createScoreCard({
    score: lastGameScore,
    highScore: readModeHigh(),
    difficultyName: getDifficulty(difficultyId).name,
    skinName: currentSkin.name,
    modeName: modeLabel(),
    mapName: mapLabel(),
    headDataUrl,
  });
}

function syncButtons(state) {
  if (state === "playing") {
    els.btnStart.disabled = true;
    els.btnPause.disabled = false;
    els.btnPause.textContent = "暂停";
  } else if (state === "paused") {
    els.btnStart.disabled = false;
    els.btnStart.textContent = "继续";
    els.btnPause.disabled = false;
  } else if (state === "over") {
    els.btnStart.disabled = false;
    els.btnStart.textContent = "再来一局";
    els.btnPause.disabled = true;
  } else {
    els.btnStart.disabled = false;
    els.btnStart.textContent = "开始";
    els.btnPause.disabled = true;
    els.btnPause.textContent = "暂停";
  }
}

function startOrResume() {
  unlockAudio();
  if (game.isPaused()) {
    game.pause();
    return;
  }
  // 死后开新局：随机模式下重新抽地图
  if (game.isDead()) {
    prepareRoundMap();
  }
  playStart();
  game.start();
}

function openSettings() {
  playClick();
  unlockAudio();
  els.viewHome.hidden = true;
  els.viewSettings.hidden = false;
  // 进设置时若在玩，自动暂停，避免后台继续跑
  if (game.isRunning()) game.pause();
  game.resize();
}

function backHome() {
  playClick();
  els.viewSettings.hidden = true;
  els.viewHome.hidden = false;
  requestAnimationFrame(() => game.resize());
}

els.btnOpenSettings.addEventListener("click", openSettings);
els.btnBackHome.addEventListener("click", backHome);
els.btnStart.addEventListener("click", startOrResume);
els.btnOverlayStart.addEventListener("click", startOrResume);
els.btnPause.addEventListener("click", () => {
  unlockAudio();
  playClick();
  game.pause();
});
els.btnReset.addEventListener("click", () => {
  unlockAudio();
  playClick();
  prepareRoundMap();
  game.reset();
  els.score.textContent = "0";
  if (isTimedMode()) updateTimerDisplay(TIMED_SECONDS * 1000);
  els.btnSaveScore.hidden = true;
  els.btnShareScore.hidden = true;
});

els.btnSaveScore.addEventListener("click", async () => {
  unlockAudio();
  playClick();
  const label = "保存图片";
  els.btnSaveScore.disabled = true;
  els.btnSaveScore.textContent = "保存中…";
  try {
    const canvas = await buildScoreCanvas();
    await downloadScoreCard(canvas);
    els.btnSaveScore.textContent = "已保存";
  } catch (err) {
    console.error(err);
    alert("保存失败，请换浏览器再试（微信内置浏览器可能拦截下载）");
    els.btnSaveScore.textContent = label;
  } finally {
    els.btnSaveScore.disabled = false;
    setTimeout(() => {
      if (!els.btnSaveScore.hidden) els.btnSaveScore.textContent = label;
    }, 1600);
  }
});

els.btnShareScore.addEventListener("click", async () => {
  unlockAudio();
  playClick();
  const label = "分享";
  els.btnShareScore.disabled = true;
  els.btnShareScore.textContent = "准备中…";
  try {
    const canvas = await buildScoreCanvas();
    await shareScoreCard(canvas);
    els.btnShareScore.textContent = "已分享";
  } catch (err) {
    console.error(err);
    if (err?.name === "AbortError") {
      els.btnShareScore.textContent = label;
    } else {
      alert("当前浏览器无法分享图片，请改用「保存图片」后自行发送");
      els.btnShareScore.textContent = label;
    }
  } finally {
    els.btnShareScore.disabled = false;
    setTimeout(() => {
      if (!els.btnShareScore.hidden) els.btnShareScore.textContent = label;
    }, 1600);
  }
});

els.toggleSound.addEventListener("change", () => {
  const on = els.toggleSound.checked;
  setSoundEnabled(on);
  saveSoundEnabled(on);
  unlockAudio();
  if (on) playClick();
});

function renderSkinChips() {
  els.skinRow.innerHTML = "";
  for (const skin of SKIN_LIST) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (skin.id === skinId ? " active" : "");
    const preview = skinThumbs[skin.id].head;
    btn.innerHTML = `<span class="dot" style="background-image:url('${preview}')"></span>${skin.name}`;
    btn.addEventListener("click", () => selectSkin(skin.id));
    els.skinRow.appendChild(btn);
  }
}

function renderModeChips() {
  els.modeRow.innerHTML = "";
  for (const m of MODE_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (m.id === modeId ? " active" : "");
    btn.textContent = m.name;
    btn.addEventListener("click", () => selectMode(m.id));
    els.modeRow.appendChild(btn);
  }
}

function renderMapChips() {
  if (!els.mapRow) return;
  els.mapRow.innerHTML = "";
  for (const m of MAP_SELECT_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (m.id === mapSelectId ? " active" : "");
    btn.textContent = m.name;
    btn.addEventListener("click", () => selectMapSelect(m.id));
    els.mapRow.appendChild(btn);
  }
}

function renderDifficultyChips() {
  els.difficultyRow.innerHTML = "";
  for (const d of DIFFICULTY_LIST) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (d.id === difficultyId ? " active" : "");
    btn.textContent = d.name;
    btn.addEventListener("click", () => selectDifficulty(d.id));
    els.difficultyRow.appendChild(btn);
  }
}

function renderFoodCountChips() {
  els.foodCountRow.innerHTML = "";
  for (const n of [1, 2, 3]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (n === foodCount ? " active" : "");
    btn.textContent = `${n} 个`;
    btn.addEventListener("click", () => selectFoodCount(n));
    els.foodCountRow.appendChild(btn);
  }
}

const THEME_OPTIONS = [
  { id: "dark", name: "深色" },
  { id: "light", name: "浅色" },
];

function renderThemeChips() {
  els.themeRow.innerHTML = "";
  for (const t of THEME_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (t.id === themeId ? " active" : "");
    btn.textContent = t.name;
    btn.addEventListener("click", () => selectTheme(t.id));
    els.themeRow.appendChild(btn);
  }
}

async function selectSkin(id) {
  playClick();
  const skin = getSkin(id);
  skinId = skin.id;
  currentSkin = skin;
  setSkinId(skinId);
  setImageDataUrl("head", null);
  setImageDataUrl("food", null);
  headDataUrl = skinThumbs[skinId].head;
  foodDataUrl = skinThumbs[skinId].food;
  applyBodyTheme();
  await applyAvatars();
  renderSkinChips();
}

function selectMode(id) {
  playClick();
  modeId = id === "timed" ? "timed" : "classic";
  saveModeId(modeId);
  // 切换模式时重置本局，避免经典/限时分数串味
  game.reset();
  els.score.textContent = "0";
  applyMode();
  renderModeChips();
}

function selectMapSelect(id) {
  playClick();
  mapSelectId = id === "random" ? "random" : "empty";
  saveMapSelectId(mapSelectId);
  prepareRoundMap();
  game.reset();
  els.score.textContent = "0";
  if (isTimedMode()) updateTimerDisplay(TIMED_SECONDS * 1000);
  renderMapChips();
}

function selectDifficulty(id) {
  playClick();
  const d = getDifficulty(id);
  difficultyId = d.id;
  setDifficultyId(difficultyId);
  applyDifficulty();
  renderDifficultyChips();
}

function selectFoodCount(n) {
  playClick();
  foodCount = n === 2 || n === 3 ? n : 1;
  saveFoodCount(foodCount);
  applyFoodCount();
  renderFoodCountChips();
}

function selectTheme(id) {
  playClick();
  themeId = id === "light" ? "light" : "dark";
  saveThemeId(themeId);
  applyTheme();
  renderThemeChips();
}

async function openAvatarModal(kind) {
  playClick();
  unlockAudio();
  editingKind = kind;
  wantDefault = false;
  baselineDataUrl = kind === "head" ? headDataUrl : foodDataUrl;
  const isDefault = !getImageDataUrl(kind);
  els.modalTitle.textContent = kind === "head" ? "设置蛇头" : "设置食物";
  els.fileInput.value = "";
  const img = await loadImage(baselineDataUrl);
  cropper.setImage(img, { asDefault: isDefault });
  if (typeof els.modal.showModal === "function") els.modal.showModal();
  else els.modal.setAttribute("open", "");
}

els.btnSetHead.addEventListener("click", () => openAvatarModal("head"));
els.btnSetFood.addEventListener("click", () => openAvatarModal("food"));
els.btnCloseModal.addEventListener("click", () => els.modal.close());

els.fileInput.addEventListener("change", async () => {
  const file = els.fileInput.files?.[0];
  if (!file) return;
  try {
    const img = await loadImageFromFile(file);
    wantDefault = false;
    cropper.setImage(img, { asDefault: false });
  } catch (err) {
    alert("图片处理失败，请换一张再试");
    console.error(err);
  }
});

els.btnRestore.addEventListener("click", async () => {
  wantDefault = true;
  const data = skinDefault(editingKind);
  const img = await loadImage(data);
  cropper.setImage(img, { asDefault: true });
});

els.btnConfirm.addEventListener("click", async (e) => {
  e.preventDefault();
  playClick();
  let nextUrl;
  if (wantDefault || cropper.isUsingDefault()) {
    nextUrl = skinDefault(editingKind);
    setImageDataUrl(editingKind, null);
  } else {
    let dataUrl = cropper.exportDataUrl();
    if (!dataUrl) {
      nextUrl = baselineDataUrl;
    } else {
      dataUrl = await shrinkDataUrlIfNeeded(dataUrl);
      const ok = setImageDataUrl(editingKind, dataUrl);
      if (!ok) {
        alert("保存失败：图片可能太大。请缩小后再试。");
        return;
      }
      nextUrl = dataUrl;
    }
  }

  if (editingKind === "head") {
    headDataUrl = nextUrl;
    els.previewHead.src = headDataUrl;
    await game.setHeadImage(headDataUrl);
  } else {
    foodDataUrl = nextUrl;
    els.previewFood.src = foodDataUrl;
    await game.setFoodImage(foodDataUrl);
  }
  els.modal.close();
});

/** PWA */
function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true
  );
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  els.btnInstallPwa.hidden = false;
  els.pwaHint.textContent = "可安装到桌面，下次从图标直接打开。";
});

els.btnInstallPwa.addEventListener("click", async () => {
  playClick();
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.btnInstallPwa.hidden = true;
  els.pwaHint.textContent = "已处理安装请求。若已安装，可从桌面打开。";
});

if (isStandalone()) {
  els.pwaHint.textContent = "已在主屏幕 / 独立窗口中运行。";
  els.btnInstallPwa.hidden = true;
} else if (isIos()) {
  els.pwaIosHint.hidden = false;
  els.pwaHint.textContent = "iPhone 请按下面说明添加。";
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service Worker 注册失败", err);
    });
  });
}

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}
if (isWeChat() && !sessionStorage.getItem("face-snake:wechat-tip")) {
  els.wechatTip.hidden = false;
}
els.btnDismissWechat.addEventListener("click", () => {
  els.wechatTip.hidden = true;
  sessionStorage.setItem("face-snake:wechat-tip", "1");
});

applyTheme();
applyBodyTheme();
applyDifficulty();
applyFoodCount();
applyMode();
prepareRoundMap();
renderSkinChips();
renderModeChips();
renderMapChips();
renderDifficultyChips();
renderFoodCountChips();
renderThemeChips();
applyAvatars().then(() => {
  showOverlay("贴图贪吃蛇", readyHint(), "开始游戏", false);
  syncButtons("ready");
});

window.addEventListener("resize", () => {
  applyPreferredGridSize(false);
  game.resize();
});
