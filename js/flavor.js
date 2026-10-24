/**
 * 结算人格文案：先分桶，再抽句（近期去重）。
 * 新模式约定：加玩法时补专属桶或给旧桶加句。
 */

/** @typedef {'early'|'record'|'near'|'timeup'|'wall'|'self'|'border'|'steady'} FlavorBucket */

/** @type {Record<FlavorBucket, string[]>} */
const LINES = {
  early: [
    "出门就翻车",
    "今天不太想动",
    "蛇还没醒",
    "热身…失败了",
    "第一步就悬了",
    "再开一局呗",
    "手滑得挺干脆",
    "开局空气都不给",
    "蛇：我什么都没干",
    "这局当预告片",
  ],
  record: [
    "你的蛇今天情绪稳定",
    "这局能写进相册",
    "新高，稳的",
    "今天手感在线",
    "蛇终于争气了",
    "纪录更新，满意",
    "这一口吃出水平",
    "状态好到犯规",
    "可以，留下了",
    "今天的蛇很骄傲",
  ],
  near: [
    "差点翻车",
    "就差一口",
    "差一点点破纪录",
    "擦边了",
    "明明很近了",
    "可惜，差一截",
    "再稳一点就成了",
    "高分惜败",
    "纪录在招手",
    "差半格的故事",
  ],
  timeup: [
    "时间到了，蛇还在喘",
    "熬到了",
    "六十秒用满了",
    "铃响，收工",
    "时间不等人",
    "卡点下车",
    "倒计时说再见",
    "这一分钟够本",
    "时间到，分数留下",
    "跑表停了",
  ],
  wall: [
    "墙比蛇硬",
    "门没走对",
    "撞墙了，诚实",
    "障碍不同意",
    "这堵墙有意见",
    "路线规划失败",
    "砖头赢了",
    "地图说不",
    "拐弯拐进墙里",
    "墙：到此为止",
  ],
  self: [
    "咬到自己了",
    "蛇打结了",
    "自己绊倒自己",
    "尾巴有意见",
    "身段太长的烦恼",
    "回路短路",
    "别吃自己啊",
    "打了结，散不开",
    "身体跟不上脑子",
    "自撞，经典",
  ],
  border: [
    "冲出屏幕了",
    "边界说不",
    "外面没有路",
    "差一步掉出去",
    "边框更硬",
    "出界，老实点",
    "世界尽头到了",
    "别往外冲",
    "画布边缘很硬",
    "刹车没踩住",
  ],
  steady: [
    "稳，但不炸",
    "今天正常发挥",
    "一局平常心",
    "不亏不赚",
    "蛇走完了流程",
    "中规中矩",
    "练手也算练",
    "下局再冲",
    "分数到账了",
    "收工，下一位",
    "还行，能看",
    "平稳落地",
  ],
};

const RECENT_MAX = 8;

/**
 * @param {{
 *   score: number,
 *   prevHigh: number,
 *   endReason: 'time'|'crash',
 *   deathKind?: 'wall'|'self'|'border'|null,
 *   moves?: number,
 *   mapId?: string,
 *   recent?: string[],
 * }} ctx
 * @returns {{ bucket: FlavorBucket, text: string }}
 */
export function pickFlavor(ctx) {
  const bucket = resolveBucket(ctx);
  const recent = Array.isArray(ctx.recent) ? ctx.recent : [];
  const text = pickLine(bucket, recent);
  return { bucket, text };
}

/**
 * 优先级：破纪录 > 限时到点 > 秒挂 > 差点 > 死因专属 > 普通
 * @param {Parameters<typeof pickFlavor>[0]} ctx
 * @returns {FlavorBucket}
 */
export function resolveBucket(ctx) {
  const score = Math.max(0, Number(ctx.score) || 0);
  const prevHigh = Math.max(0, Number(ctx.prevHigh) || 0);
  const moves = Math.max(0, Number(ctx.moves) || 0);
  const endReason = ctx.endReason === "time" ? "time" : "crash";
  const deathKind = ctx.deathKind || null;

  if (score > prevHigh) return "record";
  if (endReason === "time") return "timeup";
  if (score <= 2 && moves < 28) return "early";
  if (prevHigh > 0 && score < prevHigh && score >= prevHigh * 0.9) return "near";
  if (deathKind === "wall") return "wall";
  if (deathKind === "self") return "self";
  if (deathKind === "border") return "border";
  return "steady";
}

/** @param {FlavorBucket} bucket @param {string[]} recent */
function pickLine(bucket, recent) {
  const pool = LINES[bucket] || LINES.steady;
  const fresh = pool.filter((line) => !recent.includes(line));
  const list = fresh.length ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)] || pool[0];
}

/** @param {string[]} recent @param {string} line */
export function nextRecentFlavors(recent, line) {
  const prev = Array.isArray(recent) ? recent.filter(Boolean) : [];
  const next = [line, ...prev.filter((x) => x !== line)];
  return next.slice(0, RECENT_MAX);
}

export function listFlavorBuckets() {
  return Object.keys(LINES);
}
