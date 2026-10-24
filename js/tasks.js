/**
 * 任务表 + 结算检定（可扩展）
 * 设计见 docs/tasks-skins.md
 */

/** @typedef {'classic'|'timed'} GameMode */

/**
 * @typedef {object} RunSnapshot
 * @property {GameMode} mode
 * @property {string} mapId
 * @property {number} runScore
 * @property {boolean} endedByTime
 * @property {number} bestScore  该模式跨地图历史最高
 */

/**
 * @typedef {object} TaskDef
 * @property {string} id
 * @property {string} title
 * @property {GameMode} mode
 * @property {{ type:'best_score'|'run_score', mode:GameMode, minScore:number, requireTimeUp?:boolean }} condition
 * @property {{ type:'skin', skinId:string }} reward
 * @property {string} hint
 */

/** @type {TaskDef[]} */
export const TASK_LIST = [
  {
    id: "classic_best_15",
    title: "经典入门",
    mode: "classic",
    condition: { type: "best_score", mode: "classic", minScore: 15 },
    reward: { type: "skin", skinId: "bamboo" },
    hint: "经典最高分 ≥ 15",
  },
  {
    id: "classic_best_30",
    title: "经典进阶",
    mode: "classic",
    condition: { type: "best_score", mode: "classic", minScore: 30 },
    reward: { type: "skin", skinId: "amber" },
    hint: "经典最高分 ≥ 30",
  },
  {
    id: "classic_best_50",
    title: "经典高手",
    mode: "classic",
    condition: { type: "best_score", mode: "classic", minScore: 50 },
    reward: { type: "skin", skinId: "magma" },
    hint: "经典最高分 ≥ 50",
  },
  {
    id: "timed_run_12",
    title: "限时热身",
    mode: "timed",
    condition: { type: "run_score", mode: "timed", minScore: 12 },
    reward: { type: "skin", skinId: "frost" },
    hint: "限时单局 ≥ 12",
  },
  {
    id: "timed_full_15",
    title: "限时熬穿",
    mode: "timed",
    condition: {
      type: "run_score",
      mode: "timed",
      minScore: 15,
      requireTimeUp: true,
    },
    reward: { type: "skin", skinId: "volt" },
    hint: "限时撑满 60 秒且得分 ≥ 15",
  },
  {
    id: "timed_run_25",
    title: "限时冲刺",
    mode: "timed",
    condition: { type: "run_score", mode: "timed", minScore: 25 },
    reward: { type: "skin", skinId: "wraith" },
    hint: "限时单局 ≥ 25",
  },
];

/** 任务页：按模式两条进度条，每条 3 个节点 */
export const TASK_TRACKS = [
  {
    id: "classic",
    title: "经典",
    mode: "classic",
    taskIds: ["classic_best_15", "classic_best_30", "classic_best_50"],
  },
  {
    id: "timed",
    title: "限时",
    mode: "timed",
    taskIds: ["timed_run_12", "timed_full_15", "timed_run_25"],
  },
];

export const FREE_SKIN_IDS = ["classic", "cyber", "kitty", "pixel", "heart"];

/** @param {string} id */
export function getTaskById(id) {
  return TASK_LIST.find((t) => t.id === id) || null;
}

/**
 * 进度条填充 0～1（按该线最后一档分数估算；「撑满」节点仍以完成态点亮）
 * @param {'classic'|'timed'} mode
 * @param {{ classicBest:number, timedBest:number }} ctx
 */
export function trackFillRatio(mode, ctx) {
  const best = mode === "timed" ? ctx.timedBest : ctx.classicBest;
  const cap = mode === "timed" ? 25 : 50;
  return Math.max(0, Math.min(1, best / cap));
}

/** @param {string} skinId */
export function isFreeSkin(skinId) {
  return FREE_SKIN_IDS.includes(skinId);
}

/** @param {TaskDef} task @param {RunSnapshot} snap */
export function isTaskMet(task, snap) {
  const c = task.condition;
  if (c.mode && snap.mode !== c.mode) return false;
  if (c.type === "best_score") {
    return snap.bestScore >= c.minScore;
  }
  if (c.type === "run_score") {
    if (snap.runScore < c.minScore) return false;
    if (c.requireTimeUp && !snap.endedByTime) return false;
    return true;
  }
  return false;
}

/**
 * @param {RunSnapshot} snap
 * @param {Set<string>|string[]} completed
 * @returns {TaskDef[]} 本局新完成的任务
 */
export function evaluateNewTasks(snap, completed) {
  const done = completed instanceof Set ? completed : new Set(completed || []);
  const newly = [];
  for (const task of TASK_LIST) {
    if (done.has(task.id)) continue;
    if (isTaskMet(task, snap)) newly.push(task);
  }
  return newly;
}

/**
 * 设置页进度文案
 * @param {TaskDef} task
 * @param {{ classicBest:number, timedBest:number, completed:Set<string>|string[] }} ctx
 */
export function formatTaskProgress(task, ctx) {
  const done =
    ctx.completed instanceof Set
      ? ctx.completed.has(task.id)
      : (ctx.completed || []).includes(task.id);
  if (done) return { done: true, label: "已完成", current: task.condition.minScore, target: task.condition.minScore };

  const c = task.condition;
  if (c.type === "best_score") {
    const cur = c.mode === "timed" ? ctx.timedBest : ctx.classicBest;
    return {
      done: false,
      label: `${Math.min(cur, c.minScore)} / ${c.minScore}`,
      current: cur,
      target: c.minScore,
    };
  }
  // run_score：用该模式历史最高作参考进度；需撑满的单独说明
  const cur = c.mode === "timed" ? ctx.timedBest : ctx.classicBest;
  if (c.requireTimeUp) {
    return {
      done: false,
      label: `需撑满 60 秒 · 参考最高 ${cur}`,
      current: cur,
      target: c.minScore,
    };
  }
  return {
    done: false,
    label: `${Math.min(cur, c.minScore)} / ${c.minScore}`,
    current: cur,
    target: c.minScore,
  };
}

/** @param {string} skinId */
export function getTaskForSkin(skinId) {
  return TASK_LIST.find((t) => t.reward?.skinId === skinId) || null;
}
