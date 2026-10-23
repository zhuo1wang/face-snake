import { createGame } from "./game.js";
import { createInput } from "./input.js";
import {
  getHighScore,
  setHighScore,
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
  score: document.getElementById("score"),
  high: document.getElementById("high-score"),
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

let skinId = getSkin(getSkinId()).id;
let difficultyId = getDifficulty(getDifficultyId()).id;
let foodCount = getFoodCount();
let themeId = getThemeId();
let currentSkin = getSkin(skinId);
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

els.high.textContent = String(getHighScore());

const cropper = createCropEditor(els.cropPreview, els.zoomSlider);

const game = createGame(els.canvas, {
  onScore(score) {
    els.score.textContent = String(score);
    const high = setHighScore(score);
    els.high.textContent = String(high);
  },
  onEat() {
    playEat();
  },
  onGameOver(score) {
    lastGameScore = score;
    playDie();
    const high = setHighScore(score);
    els.high.textContent = String(high);
    showOverlay("游戏结束", `本局得分 ${score} · 最高 ${high}`, "再来一局", true);
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
      showOverlay("贴图贪吃蛇", "方向键 / WASD / 滑动屏幕", "开始游戏", false);
      syncButtons("ready");
    }
  },
});

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
  if (els.overlayMascot) {
    els.overlayMascot.hidden = !isStartGuide;
  }
}

function hideOverlay() {
  els.overlay.hidden = true;
  els.btnSaveScore.hidden = true;
  els.btnShareScore.hidden = true;
}

async function buildScoreCanvas() {
  return createScoreCard({
    score: lastGameScore,
    highScore: getHighScore(),
    difficultyName: getDifficulty(difficultyId).name,
    skinName: currentSkin.name,
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
  game.reset();
  els.score.textContent = "0";
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
renderSkinChips();
renderDifficultyChips();
renderFoodCountChips();
renderThemeChips();
applyAvatars().then(() => {
  showOverlay("贴图贪吃蛇", "方向键 / WASD / 滑动屏幕", "开始游戏", false);
  syncButtons("ready");
});

window.addEventListener("resize", () => game.resize());
