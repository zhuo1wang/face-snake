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
  getFlavorEnabled,
  setFlavorEnabled as saveFlavorEnabled,
  getFlavorRecent,
  setFlavorRecent,
  getThemeId,
  setThemeId as saveThemeId,
  getCompletedTaskIds,
  addCompletedTaskId,
  getUnlockedSkinIds,
  addUnlockedSkinId,
  getModeBestScore,
  setModeBestScore,
} from "./storage.js";
import { pickFlavor, nextRecentFlavors } from "./flavor.js";
import {
  TASK_LIST,
  TASK_TRACKS,
  evaluateNewTasks,
  formatTaskProgress,
  isFreeSkin,
  getTaskForSkin,
  getTaskById,
  trackFillRatio,
} from "./tasks.js";
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
  RANDOM_MAP_IDS,
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
  viewTasks: document.getElementById("view-tasks"),
  btnOpenSettings: document.getElementById("btn-open-settings"),
  btnOpenTasks: document.getElementById("btn-open-tasks"),
  btnBackHome: document.getElementById("btn-back-home"),
  btnBackHomeTasks: document.getElementById("btn-back-home-tasks"),
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
  taskList: document.getElementById("task-list"),
  difficultyRow: document.getElementById("difficulty-row"),
  themeRow: document.getElementById("theme-row"),
  toggleSound: document.getElementById("toggle-sound"),
  toggleFlavor: document.getElementById("toggle-flavor"),
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
  updateBanner: document.getElementById("update-banner"),
  btnApplyUpdate: document.getElementById("btn-apply-update"),
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

seedModeBestsFromLegacy();
syncTasksFromExistingBest();

let skinId = getSkin(getSkinId()).id;
if (!isSkinUnlocked(skinId)) {
  skinId = "classic";
  setSkinId(skinId);
}
let difficultyId = getDifficulty(getDifficultyId()).id;
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
/** 本局开始时的最高分，用于判断破纪录 / 差点 */
let roundStartHigh = 0;
let deferredInstallPrompt = null;

const soundOn = getSoundEnabled();
els.toggleSound.checked = soundOn;
setSoundEnabled(soundOn);

const flavorOn = getFlavorEnabled();
if (els.toggleFlavor) els.toggleFlavor.checked = flavorOn;

const cropper = createCropEditor(els.cropPreview, els.zoomSlider);

function isTimedMode() {
  return modeId === "timed";
}

function isSkinUnlocked(id) {
  if (isFreeSkin(id)) return true;
  return getUnlockedSkinIds().includes(id);
}

function readModeHigh() {
  return getMapHighScore(modeId, activeMap.id);
}

function writeModeHigh(score) {
  const high = setMapHighScore(modeId, activeMap.id, score);
  setModeBestScore(modeId, high);
  return high;
}

/** 用各图旧最高分种子模式总最高（取 max），便于老存档直接对上任务 */
function seedModeBestsFromLegacy() {
  const mapIds = ["empty", ...RANDOM_MAP_IDS];
  for (const mode of /** @type {const} */ (["classic", "timed"])) {
    let best = 0;
    for (const mapId of mapIds) {
      best = Math.max(best, getMapHighScore(mode, mapId));
    }
    if (best > 0) setModeBestScore(mode, best);
  }
}

/**
 * 按快照检定任务并自动解锁奖励
 * @param {import('./tasks.js').RunSnapshot} snap
 * @param {{ skipRequireTimeUp?: boolean }} [opts] 启动补发时跳过「需撑满」任务
 */
function applyTaskRewards(snap, opts = {}) {
  const completed = new Set(getCompletedTaskIds());
  let newly = evaluateNewTasks(snap, completed);
  if (opts.skipRequireTimeUp) {
    newly = newly.filter((t) => !t.condition.requireTimeUp);
  }
  const unlockedNames = [];
  for (const task of newly) {
    addCompletedTaskId(task.id);
    if (task.reward?.type === "skin" && task.reward.skinId) {
      addUnlockedSkinId(task.reward.skinId);
      unlockedNames.push(getSkin(task.reward.skinId).name);
    }
  }
  return { newly, unlockedNames };
}

/** 启动时：已有最高分可补发 best_score / 普通 run_score（不含必须撑满） */
function syncTasksFromExistingBest() {
  for (const mode of /** @type {const} */ (["classic", "timed"])) {
    const best = getModeBestScore(mode);
    if (best <= 0) continue;
    applyTaskRewards(
      {
        mode,
        mapId: "empty",
        runScore: best,
        endedByTime: false,
        bestScore: best,
      },
      { skipRequireTimeUp: true }
    );
  }
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

/** 本局进行中（含暂停/结算）时不改格数，避免转屏打断 */
function isRoundInProgress() {
  return game.isRunning() || game.isPaused() || game.isDead();
}

/** 把格数同步到当前屏宽偏好；返回是否真的变了 */
function commitPreferredGridSize() {
  const next = preferredGridSize();
  const changed = game.setGridSize(next);
  gridSize = game.getGridSize();
  return changed;
}

/**
 * 按屏幕宽度切换格数。
 * 对局/暂停/结算中只推迟，等开新局再 commit（转过去又转回则偏好变回，等于不改）。
 */
function applyPreferredGridSize(forceReset = false) {
  if (!forceReset && isRoundInProgress()) return;
  const changed = commitPreferredGridSize();
  if (!changed && !forceReset) return;
  prepareRoundMap();
  game.reset();
  els.score.textContent = "0";
  if (isTimedMode()) updateTimerDisplay(TIMED_SECONDS * 1000);
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
  onGameOver(score, meta = {}) {
    lastGameScore = score;
    const reason = meta?.reason === "time" ? "time" : "crash";
    // 撞死与时间到都保留本局分；仅撞死播死亡音
    if (reason === "crash") playDie();
    else playStart();
    const high = writeModeHigh(score);
    els.high.textContent = String(high);
    const mapBit = activeMap.id === "empty" ? "" : ` · ${activeMap.name}`;
    const scoreHint =
      reason === "time"
        ? `60 秒得分 ${score}${mapBit} · 最高 ${high}`
        : `本局得分 ${score}${mapBit} · 最高 ${high}`;

    const modeBest = getModeBestScore(modeId);
    const { unlockedNames } = applyTaskRewards({
      mode: modeId,
      mapId: meta.mapId || activeMap.id,
      runScore: score,
      endedByTime: reason === "time",
      bestScore: modeBest,
    });

    let title = reason === "time" ? "时间到" : "游戏结束";
    if (getFlavorEnabled()) {
      const { text } = pickFlavor({
        score,
        prevHigh: roundStartHigh,
        endReason: reason,
        deathKind: meta.deathKind || null,
        moves: meta.moves || 0,
        mapId: meta.mapId || activeMap.id,
        recent: getFlavorRecent(),
      });
      title = text;
      setFlavorRecent(nextRecentFlavors(getFlavorRecent(), text));
    }

    const hintParts = [scoreHint];
    if (unlockedNames.length) {
      hintParts.push(`解锁皮肤：${unlockedNames.join("、")}`);
      renderSkinChips();
      renderTaskList();
    }

    showOverlay(title, hintParts.join("\n"), "再来一局", true);
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
  game.setBodyTheme(
    currentSkin.body,
    currentSkin.bodyEnd,
    currentSkin.bodyStyle || null
  );
}

function applyDifficulty() {
  game.setTickMs(getDifficulty(difficultyId).tickMs);
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
  els.overlay.classList.toggle("overlay--settle", !!showScoreActions);
  setMascotPlaying(isStartGuide);
}

function setMascotPlaying(show) {
  const el = els.overlayMascot;
  if (!el) return;
  el.hidden = !show;
  const stillSrc = "assets/mascot.png";
  if (show && el.getAttribute("src") !== stillSrc) {
    el.src = stillSrc;
  }
}

function hideOverlay() {
  els.overlay.hidden = true;
  els.btnSaveScore.hidden = true;
  els.btnShareScore.hidden = true;
  els.overlay.classList.remove("overlay--settle");
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
  // 开新局前应用转屏推迟的格数；变了或死后重开都要重备地图
  const gridChanged = commitPreferredGridSize();
  if (game.isDead() || gridChanged) {
    prepareRoundMap();
  }
  roundStartHigh = readModeHigh();
  playStart();
  game.start();
}

function showHomeOnly() {
  els.viewHome.hidden = false;
  if (els.viewSettings) els.viewSettings.hidden = true;
  if (els.viewTasks) els.viewTasks.hidden = true;
}

function openSettings() {
  playClick();
  unlockAudio();
  els.viewHome.hidden = true;
  if (els.viewTasks) els.viewTasks.hidden = true;
  els.viewSettings.hidden = false;
  // 进设置时若在玩，自动暂停，避免后台继续跑
  if (game.isRunning()) game.pause();
  game.resize();
}

function openTasks() {
  playClick();
  unlockAudio();
  els.viewHome.hidden = true;
  els.viewSettings.hidden = true;
  if (els.viewTasks) els.viewTasks.hidden = false;
  renderTaskList();
  if (game.isRunning()) game.pause();
  game.resize();
}

function backHome() {
  playClick();
  showHomeOnly();
  requestAnimationFrame(() => game.resize());
}

els.btnOpenSettings.addEventListener("click", openSettings);
els.btnOpenTasks?.addEventListener("click", openTasks);
els.btnBackHome.addEventListener("click", backHome);
els.btnBackHomeTasks?.addEventListener("click", backHome);
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

els.toggleFlavor?.addEventListener("change", () => {
  const on = els.toggleFlavor.checked;
  saveFlavorEnabled(on);
  unlockAudio();
  playClick();
});

function renderSkinChips() {
  els.skinRow.innerHTML = "";
  for (const skin of SKIN_LIST) {
    const unlocked = isSkinUnlocked(skin.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "chip" +
      (skin.id === skinId ? " active" : "") +
      (unlocked ? "" : " chip--locked");
    const preview = skinThumbs[skin.id].head;
    const lock = unlocked ? "" : '<span class="chip-lock" aria-hidden="true">锁</span>';
    btn.innerHTML = `<span class="dot" style="background-image:url('${preview}')"></span>${skin.name}${lock}`;
    if (!unlocked) {
      const task = getTaskForSkin(skin.id);
      btn.title = task ? `未解锁：${task.hint}` : "未解锁";
      btn.setAttribute("aria-disabled", "true");
    }
    btn.addEventListener("click", () => selectSkin(skin.id));
    els.skinRow.appendChild(btn);
  }
}

function renderTaskList() {
  if (!els.taskList) return;
  els.taskList.innerHTML = "";
  const completed = new Set(getCompletedTaskIds());
  const ctx = {
    classicBest: getModeBestScore("classic"),
    timedBest: getModeBestScore("timed"),
    completed,
  };

  for (const track of TASK_TRACKS) {
    const tasks = track.taskIds.map(getTaskById).filter(Boolean);
    const fill = trackFillRatio(track.mode, ctx);
    const fillPct = (fill * 100).toFixed(1);
    const best = track.mode === "timed" ? ctx.timedBest : ctx.classicBest;
    const next = tasks.find((t) => !completed.has(t.id));
    const nextLabel = next
      ? formatTaskProgress(next, ctx).label
      : "本线已全部完成";
    const n = Math.max(tasks.length, 1);

    const card = document.createElement("div");
    card.className =
      "task-track task-track--" +
      track.mode +
      (next ? "" : " is-complete");
    card.setAttribute("role", "listitem");

    const nodesHtml = tasks
      .map((task, i) => {
        const done = completed.has(task.id);
        const isCurrent = !done && next && next.id === task.id;
        const rewardName = getSkin(task.reward.skinId).name;
        const score = String(task.condition.minScore);
        const left = ((i + 0.5) / n) * 100;
        const needFull = !!task.condition.requireTimeUp;
        return `
          <div class="task-node${done ? " is-done" : ""}${isCurrent ? " is-current" : ""}${needFull ? " is-timeup" : ""}"
               style="left:${left.toFixed(2)}%"
               title="${task.hint} → ${rewardName}">
            <span class="task-node-pip" aria-hidden="true"></span>
            <span class="task-node-score">${score}</span>
            ${needFull ? '<span class="task-node-tag">撑满</span>' : ""}
            <span class="task-node-reward">${rewardName}</span>
          </div>`;
      })
      .join("");

    card.innerHTML = `
      <div class="task-track-head">
        <strong class="task-track-title">${track.title}</strong>
        <span class="task-track-meta">${nextLabel}</span>
      </div>
      <div class="task-track-rail">
        <div class="task-track-pill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(fill * 100)}" aria-label="${track.title}进度">
          <div class="task-track-fill" style="width:${fillPct}%"></div>
          <span class="task-track-label${fill < 0.12 ? " is-start" : ""}${fill > 0.88 ? " is-end" : ""}" style="left:${fillPct}%">${best}</span>
        </div>
        <div class="task-track-nodes">${nodesHtml}</div>
      </div>`;
    els.taskList.appendChild(card);
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
  if (!isSkinUnlocked(id)) {
    const task = getTaskForSkin(id);
    alert(task ? `尚未解锁「${getSkin(id).name}」\n完成任务：${task.hint}` : "尚未解锁该皮肤");
    return;
  }
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

/** 上传前门：类型 + 原文件大小（裁剪后仍会 shrink） */
const AVATAR_MAX_BYTES = 10 * 1024 * 1024;
const AVATAR_OK_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isAllowedAvatarFile(file) {
  if (AVATAR_OK_TYPES.has(file.type)) return true;
  // 部分环境 type 为空，退回扩展名
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
}

els.fileInput.addEventListener("change", async () => {
  const file = els.fileInput.files?.[0];
  if (!file) return;
  if (!isAllowedAvatarFile(file)) {
    alert("请选择 JPG / PNG / WebP / GIF 图片");
    els.fileInput.value = "";
    return;
  }
  if (file.size > AVATAR_MAX_BYTES) {
    alert("图片太大，请选不超过 10MB 的图");
    els.fileInput.value = "";
    return;
  }
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

/** 新 SW 已装好、等用户点「立即更新」再接管并刷新 */
let waitingWorker = null;
let refreshingForUpdate = false;

function showUpdateBanner(worker) {
  waitingWorker = worker;
  if (els.updateBanner) els.updateBanner.hidden = false;
}

function trackInstallingWorker(worker) {
  if (!worker) return;
  worker.addEventListener("statechange", () => {
    // 已有控制器 = 不是首次安装，而是更新
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      showUpdateBanner(worker);
    }
  });
}

els.btnApplyUpdate?.addEventListener("click", () => {
  playClick();
  if (!waitingWorker) return;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
  els.btnApplyUpdate.disabled = true;
  els.btnApplyUpdate.textContent = "更新中…";
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateBanner(reg.waiting);
        }
        reg.addEventListener("updatefound", () => {
          trackInstallingWorker(reg.installing);
        });
        // 回到前台时检查是否有新版本
        const check = () => {
          reg.update().catch(() => {});
        };
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        window.addEventListener("focus", check);
      })
      .catch((err) => {
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
applyMode();
prepareRoundMap();
renderSkinChips();
renderTaskList();
renderModeChips();
renderMapChips();
renderDifficultyChips();
renderThemeChips();
applyAvatars().then(() => {
  showOverlay("贴图贪吃蛇", readyHint(), "开始游戏", false);
  syncButtons("ready");
});

window.addEventListener("resize", () => {
  applyPreferredGridSize(false);
  game.resize();
});
