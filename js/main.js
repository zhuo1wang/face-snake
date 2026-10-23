import { createGame } from "./game.js";
import { createInput } from "./input.js";
import {
  getHighScore,
  setHighScore,
  getImageDataUrl,
  setImageDataUrl,
} from "./storage.js";
import {
  createDefaultAvatar,
  processAvatarFile,
  loadImage,
  drawPreview,
  shrinkDataUrlIfNeeded,
} from "./avatar.js";

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
  dpad: document.getElementById("dpad"),
  modal: document.getElementById("avatar-modal"),
  modalTitle: document.getElementById("modal-title"),
  cropPreview: document.getElementById("crop-preview"),
  fileInput: document.getElementById("file-input"),
  btnRestore: document.getElementById("btn-restore-default"),
  btnConfirm: document.getElementById("btn-confirm-avatar"),
  btnCloseModal: document.getElementById("btn-close-modal"),
  wechatTip: document.getElementById("wechat-tip"),
  btnDismissWechat: document.getElementById("btn-dismiss-wechat"),
};

const defaultHead = createDefaultAvatar("head");
const defaultFood = createDefaultAvatar("food");

let headDataUrl = getImageDataUrl("head") || defaultHead;
let foodDataUrl = getImageDataUrl("food") || defaultFood;
let editingKind = "head"; // 'head' | 'food'
let pendingDataUrl = null;

els.high.textContent = String(getHighScore());

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

async function applyAvatars() {
  els.previewHead.src = headDataUrl;
  els.previewFood.src = foodDataUrl;
  await game.setHeadImage(headDataUrl);
  await game.setFoodImage(foodDataUrl);
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
    game.pause(); // toggle off pause
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

function openAvatarModal(kind) {
  editingKind = kind;
  pendingDataUrl = kind === "head" ? headDataUrl : foodDataUrl;
  els.modalTitle.textContent = kind === "head" ? "设置蛇头" : "设置食物";
  els.fileInput.value = "";
  loadImage(pendingDataUrl).then((img) => drawPreview(els.cropPreview, img));
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
    let dataUrl = await processAvatarFile(file);
    dataUrl = await shrinkDataUrlIfNeeded(dataUrl);
    pendingDataUrl = dataUrl;
    const img = await loadImage(dataUrl);
    drawPreview(els.cropPreview, img);
  } catch (err) {
    alert("图片处理失败，请换一张再试");
    console.error(err);
  }
});

els.btnRestore.addEventListener("click", async () => {
  pendingDataUrl = editingKind === "head" ? defaultHead : defaultFood;
  const img = await loadImage(pendingDataUrl);
  drawPreview(els.cropPreview, img);
});

els.btnConfirm.addEventListener("click", async (e) => {
  e.preventDefault();
  const isDefault =
    (editingKind === "head" && pendingDataUrl === defaultHead) ||
    (editingKind === "food" && pendingDataUrl === defaultFood);

  if (isDefault) {
    setImageDataUrl(editingKind, null);
  } else {
    const ok = setImageDataUrl(editingKind, pendingDataUrl);
    if (!ok) {
      alert("保存失败：图片可能太大。请换一张较小的图片。");
      return;
    }
  }

  if (editingKind === "head") {
    headDataUrl = pendingDataUrl;
    els.previewHead.src = headDataUrl;
    await game.setHeadImage(headDataUrl);
  } else {
    foodDataUrl = pendingDataUrl;
    els.previewFood.src = foodDataUrl;
    await game.setFoodImage(foodDataUrl);
  }
  els.modal.close();
});

// 微信内置浏览器提示
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

// 初始
applyAvatars().then(() => {
  showOverlay("换脸贪吃蛇", "方向键 / WASD · 手机滑动或点下方按键", "开始游戏");
  syncButtons("ready");
});

window.addEventListener("resize", () => game.resize());
