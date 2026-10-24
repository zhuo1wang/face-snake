/** 地图数据：按格数生成；手机用较少格以放大单元格 */

export const GRID_DESKTOP = 20;
export const GRID_MOBILE = 14;

/** 兼容旧引用 */
export const GRID = GRID_DESKTOP;

/**
 * @typedef {{x:number,y:number}} Cell
 * @typedef {{id:string,name:string,walls:Cell[],portals:{a:Cell,b:Cell}[]}} GameMap
 */

/** @param {number} x @param {number} y */
function c(x, y) {
  return { x, y };
}

function hWall(y, x0, x1) {
  const out = [];
  for (let x = x0; x <= x1; x++) out.push(c(x, y));
  return out;
}

function vWall(x, y0, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) out.push(c(x, y));
  return out;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** @param {number} n 边长格数 */
function buildEmpty(n) {
  return { id: "empty", name: "空板", walls: [], portals: [] };
}

/** 回廊：外框 + 上下开口 */
function buildCorridor(n) {
  const inset = clamp(Math.round(n * 0.2), 2, 4);
  const y0 = inset;
  const y1 = n - 1 - inset;
  const x0 = inset;
  const x1 = n - 1 - inset;
  const gap0 = Math.floor(n / 2) - 1;
  const gap1 = Math.floor(n / 2);
  const walls = [
    ...hWall(y0, x0, x1),
    ...hWall(y1, x0, x1),
    ...vWall(x0, y0 + 1, y1 - 1),
    ...vWall(x1, y0 + 1, y1 - 1),
  ].filter(
    (p) =>
      !(
        (p.y === y0 || p.y === y1) &&
        p.x >= gap0 &&
        p.x <= gap1
      )
  );
  return { id: "corridor", name: "回廊", walls, portals: [] };
}

/** 四角 L 形 */
function buildCorners(n) {
  const arm = clamp(Math.round(n * 0.22), 2, 4);
  const lo = 1;
  const hi = n - 2;
  const walls = [
    ...hWall(lo, lo, lo + arm),
    ...vWall(lo, lo + 1, lo + arm),
    ...hWall(lo, hi - arm, hi),
    ...vWall(hi, lo + 1, lo + arm),
    ...hWall(hi, lo, lo + arm),
    ...vWall(lo, hi - arm, hi - 1),
    ...hWall(hi, hi - arm, hi),
    ...vWall(hi, hi - arm, hi - 1),
  ];
  return { id: "corners", name: "四角堡", walls, portals: [] };
}

/** 隔断 + 一对洞口 */
function buildGates(n) {
  const xL = clamp(Math.round(n * 0.3), 3, n - 5);
  const xR = n - 1 - xL;
  const midY = Math.floor(n / 2);
  const gap = clamp(Math.round(n * 0.18), 2, 3);
  const walls = [
    ...vWall(xL, 1, midY - gap),
    ...vWall(xL, midY + gap, n - 2),
    ...vWall(xR, 1, midY - gap),
    ...vWall(xR, midY + gap, n - 2),
    ...hWall(midY, Math.floor(n / 2) - 1, Math.floor(n / 2) + 1),
  ];
  const p = clamp(Math.round(n * 0.15), 2, 3);
  return {
    id: "gates",
    name: "双门",
    walls,
    portals: [{ a: c(p, p), b: c(n - 1 - p, n - 1 - p) }],
  };
}

/** 随机池：不含空板 */
export const RANDOM_MAP_IDS = ["corridor", "corners", "gates"];

const BUILDERS = {
  empty: buildEmpty,
  corridor: buildCorridor,
  corners: buildCorners,
  gates: buildGates,
};

export function normalizeGridSize(n) {
  const v = Math.floor(Number(n) || GRID_DESKTOP);
  if (v === GRID_MOBILE) return GRID_MOBILE;
  return GRID_DESKTOP;
}

/** @param {string} id @param {number} [gridSize] */
export function getMap(id, gridSize = GRID_DESKTOP) {
  const n = normalizeGridSize(gridSize);
  const build = BUILDERS[id] || buildEmpty;
  return build(n);
}

export function pickRandomObstacleMap(gridSize = GRID_DESKTOP) {
  const id = RANDOM_MAP_IDS[Math.floor(Math.random() * RANDOM_MAP_IDS.length)];
  return getMap(id, gridSize);
}

/** 空板快捷 */
export const MAP_EMPTY = buildEmpty(GRID_DESKTOP);

/** @param {GameMap} map */
export function buildMapIndex(map) {
  const wallSet = new Set((map.walls || []).map((p) => `${p.x},${p.y}`));
  /** @type {Map<string, Cell>} */
  const portalTo = new Map();
  for (const pair of map.portals || []) {
    const ak = `${pair.a.x},${pair.a.y}`;
    const bk = `${pair.b.x},${pair.b.y}`;
    portalTo.set(ak, { x: pair.b.x, y: pair.b.y });
    portalTo.set(bk, { x: pair.a.x, y: pair.a.y });
    wallSet.delete(ak);
    wallSet.delete(bk);
  }
  return { wallSet, portalTo };
}
