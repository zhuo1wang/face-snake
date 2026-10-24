/** 地图数据：空板为默认；障碍图含墙与洞口 */

export const GRID = 20;

/**
 * @typedef {{x:number,y:number}} Cell
 * @typedef {{id:string,name:string,walls:Cell[],portals:{a:Cell,b:Cell}[]}} GameMap
 */

/** @param {number} x @param {number} y */
function c(x, y) {
  return { x, y };
}

/** 横墙 */
function hWall(y, x0, x1) {
  const out = [];
  for (let x = x0; x <= x1; x++) out.push(c(x, y));
  return out;
}

/** 竖墙 */
function vWall(x, y0, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) out.push(c(x, y));
  return out;
}

/** @type {GameMap} */
export const MAP_EMPTY = {
  id: "empty",
  name: "空板",
  walls: [],
  portals: [],
};

/** 十字回廊：中间留出生通道 */
export const MAP_CORRIDOR = {
  id: "corridor",
  name: "回廊",
  walls: [
    ...hWall(4, 4, 15),
    ...hWall(15, 4, 15),
    ...vWall(4, 5, 14),
    ...vWall(15, 5, 14),
    // 内框开口：上下各留口，避免封死
  ].filter((p) => !(p.x >= 9 && p.x <= 10 && (p.y === 4 || p.y === 15))),
  portals: [],
};

/** 四角 L 形堡垒 */
export const MAP_CORNERS = {
  id: "corners",
  name: "四角堡",
  walls: [
    ...hWall(2, 2, 5),
    ...vWall(2, 3, 5),
    ...hWall(2, 14, 17),
    ...vWall(17, 3, 5),
    ...hWall(17, 2, 5),
    ...vWall(2, 14, 16),
    ...hWall(17, 14, 17),
    ...vWall(17, 14, 16),
  ],
  portals: [],
};

/** 少量隔断 + 一对洞口 */
export const MAP_GATES = {
  id: "gates",
  name: "双门",
  walls: [
    ...vWall(6, 2, 7),
    ...vWall(6, 12, 17),
    ...vWall(13, 2, 7),
    ...vWall(13, 12, 17),
    ...hWall(9, 8, 11),
  ],
  portals: [{ a: c(3, 3), b: c(16, 16) }],
};

/** @type {GameMap[]} */
export const MAP_LIST = [MAP_EMPTY, MAP_CORRIDOR, MAP_CORNERS, MAP_GATES];

/** 随机池：不含空板 */
export const RANDOM_MAP_IDS = ["corridor", "corners", "gates"];

const MAP_BY_ID = Object.fromEntries(MAP_LIST.map((m) => [m.id, m]));

export function getMap(id) {
  return MAP_BY_ID[id] || MAP_EMPTY;
}

export function pickRandomObstacleMap() {
  const id = RANDOM_MAP_IDS[Math.floor(Math.random() * RANDOM_MAP_IDS.length)];
  return getMap(id);
}

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
    // 洞口格不可再当墙
    wallSet.delete(ak);
    wallSet.delete(bk);
  }
  return { wallSet, portalTo };
}
