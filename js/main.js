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
} from "./storage.js";
import { loadImage, shrinkDataUrlIfNeeded } from "./avatar.js";
import { createCropEditor, loadImageFromFile } from "./crop.js";
import {
  SKIN_LIST,
  getSkin,
  DIFFICULTY_LIST,
  getDifficulty,
} from "./skins.js";

const els = {
  canvas: document.getElementById("game"),
  wrap: document.getElementById("canvas-wrap"),
  score: document.getElementById("score"),
  high: document.getElementById("high-score"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayHint: document.getElementById("overlay-hint"),
  btnOverlayStart: document.getElementById("btn-overlay-start"),
  btnStart: document.getElementById("btn-start"),
  btnPause: document.getElementById("btn-pause"),
  btnReset: document.getElementById("btn-reset"),
  btnSetHead: document.getElementById("btn-set-head"),
  btnSetFood: document.getElementById("btn-set-food"),
  previewHead: document.getElementById("preview-head"),
  previewFood: document.getElementById("preview-food"),
  skinRow: document.getElementById("skin-row"),
  difficultyRow: document.getElementById("difficulty-row"),
  dpad: document.getElementById("dpad"),
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

/** 缓存皮肤图，避免重复绘制 */
const skinThumbs = Object.fromEntries(
  SKIN_LIST.map((s) => [s.id, { head: s.makeHead(), food: s.makeFood() }])
);

// 校正本地存储里可能过期/非法的 id，避免皮肤表取不到而报错
let skinId = getSkin(getSkinId()).id;
let difficultyId = getDifficulty(getDifficultyId()).id;
let currentSkin = getSkin(skinId);
if (getSkinId() !== skinId) setSkinId(skinId);
if (getDifficultyId() !== difficultyId) setDifficultyId(difficultyId);

let headDataUrl = getImageDataUrl("head") || skinThumbs[skinId].head;
let foodDataUrl = getImageDataUrl("food") || skinThumbs[skinId].food;
let editingKind = "head";
let baselineDataUrl = null;
let wantDefault = false;

els.high.textContent = String(getHighScore());

const cropper = createCropEditor(els.cropPreview, els.zoomSlider);

const game = createGame(els.canvas, {
  onScore(score) {
    els.score.textContent = String(score);
    const high = setHighScore(score);
    els.high.textContent = String(high);
  },
  onGameOver(score) {
    const high = setHighScore(score);
    els.high.textContent = String(high);
    showOverlay("游戏结束", `本局得分 ${score} · 最高 ${high}`, "再来一局");
    syncButtons("over");
  },
  onStatus(status) {
    if (status === "playing") {
      hideOverlay();
      syncButtons("playing");
    } else if (status === "paused") {
      showOverlay("已暂停", "点继续或按开始恢复", "继续");
      syncButtons("paused");
    } else if (status === "ready") {
      showOverlay("换脸贪吃蛇", "方向键 / WASD · 手机滑动或点下方按键", "开始游戏");
      syncButtons("ready");
    }
  },
});

createInput({
  onDirection: (dir) => game.setDirection(dir),
  swipeTarget: els.wrap,
  dpad: els.dpad,
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
  const d = getDifficulty(difficultyId);
  game.setTickMs(d.tickMs);
}

function showOverlay(title, hint, btnText) {
  els.overlay.hidden = false;
  els.overlayTitle.textContent = title;
  els.overlayHint.textContent = hint;
  els.btnOverlayStart.textContent = btnText;
}

function hideOverlay() {
  els.overlay.hidden = true;
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
    els.btnPause.textContent = "暂停";
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
  if (game.isPaused()) {
    game.pause();
    return;
  }
  game.start();
}

els.btnStart.addEventListener("click", startOrResume);
els.btnOverlayStart.addEventListener("click", startOrResume);
els.btnPause.addEventListener("click", () => game.pause());
els.btnReset.addEventListener("click", () => {
  game.reset();
  els.score.textContent = "0";
});

/** —— 皮肤 / 难度 UI —— */
function renderSkinChips() {
  els.skinRow.innerHTML = "";
  for (const skin of SKIN_LIST) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (skin.id === skinId ? " active" : "");
    btn.dataset.skin = skin.id;
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
    btn.dataset.difficulty = d.id;
    btn.textContent = d.name;
    btn.addEventListener("click", () => selectDifficulty(d.id));
    els.difficultyRow.appendChild(btn);
  }
}

async function selectSkin(id) {
  const skin = getSkin(id);
  skinId = skin.id;
  currentSkin = skin;
  setSkinId(skinId);
  // 换皮肤：清掉自定义图，套用该皮肤默认头/食物
  setImageDataUrl("head", null);
  setImageDataUrl("food", null);
  headDataUrl = skinThumbs[skinId].head;
  foodDataUrl = skinThumbs[skinId].food;
  applyBodyTheme();
  await applyAvatars();
  renderSkinChips();
}

function selectDifficulty(id) {
  const d = getDifficulty(id);
  difficultyId = d.id;
  setDifficultyId(difficultyId);
  applyDifficulty();
  renderDifficultyChips();
}

async function openAvatarModal(kind) {
  editingKind = kind;
  wantDefault = false;
  baselineDataUrl = kind === "head" ? headDataUrl : foodDataUrl;
  // 没有自定义上传时，当前是皮肤默认图
  const isDefault = !getImageDataUrl(kind);

  els.modalTitle.textContent = kind === "head" ? "设置蛇头" : "设置食物";
  els.fileInput.value = "";

  const img = await loadImage(baselineDataUrl);
  cropper.setImage(img, { asDefault: isDefault });

  if (typeof els.modal.showModal === "function") {
    els.modal.showModal();
  } else {
    els.modal.setAttribute("open", "");
  }
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

// 初始化
applyBodyTheme();
applyDifficulty();
renderSkinChips();
renderDifficultyChips();
applyAvatars().then(() => {
  showOverlay("换脸贪吃蛇", "方向键 / WASD · 手机滑动或点下方按键", "开始游戏");
  syncButtons("ready");
});

window.addEventListener("resize", () => game.resize());
