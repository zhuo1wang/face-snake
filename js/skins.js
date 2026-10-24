/**
 * 多套默认皮肤：蛇头 + 食物 + 蛇身配色
 * 程序化头偏材质/几何，少涂鸦五官；classic 默认仍用吉祥物贴纸。
 */

function circleCanvas(draw) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  draw(ctx, size);
  return canvas.toDataURL("image/png");
}

/** 备用经典头：金属薄荷绿，无笑脸线稿（classic 默认仍用 mascot） */
function drawClassicHead(ctx, size) {
  const g = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.55
  );
  g.addColorStop(0, "#9affd4");
  g.addColorStop(0.45, "#3dff9a");
  g.addColorStop(1, "#0d5c3a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.15);
  ctx.lineTo(size * 0.55, size * 0.05);
  ctx.lineTo(size * 0.4, size * 0.45);
  ctx.lineTo(size * 0.05, size * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(180, 255, 220, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(6, 32, 22, 0.85)";
  ctx.fillRect(size * 0.28, size * 0.4, size * 0.18, size * 0.1);
  ctx.fillRect(size * 0.54, size * 0.4, size * 0.18, size * 0.1);
  ctx.fillStyle = "#7cffc0";
  ctx.fillRect(size * 0.32, size * 0.43, size * 0.1, size * 0.04);
  ctx.fillRect(size * 0.58, size * 0.43, size * 0.1, size * 0.04);
}

function drawClassicFood(ctx, size) {
  const g = ctx.createRadialGradient(
    size * 0.38,
    size * 0.32,
    4,
    size / 2,
    size / 2,
    size * 0.5
  );
  g.addColorStop(0, "#ffd0bc");
  g.addColorStop(0.55, "#ff7a59");
  g.addColorStop(1, "#c43a28");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.ellipse(size * 0.38, size * 0.34, size * 0.14, size * 0.08, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCyberHead(ctx, size) {
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#a8ffff");
  g.addColorStop(0.4, "#4de0ff");
  g.addColorStop(1, "#3a4dff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 暗层网格感
  ctx.strokeStyle = "rgba(10, 16, 40, 0.35)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    const p = (size * i) / 4;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // 横条 HUD
  ctx.fillStyle = "rgba(8, 12, 28, 0.75)";
  ctx.fillRect(size * 0.18, size * 0.32, size * 0.64, size * 0.2);
  ctx.fillStyle = "#7cf7ff";
  ctx.shadowColor = "#7cf7ff";
  ctx.shadowBlur = 8;
  ctx.fillRect(size * 0.24, size * 0.38, size * 0.2, size * 0.08);
  ctx.fillRect(size * 0.56, size * 0.38, size * 0.2, size * 0.08);
  ctx.shadowBlur = 0;

  // 底部能量条
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(size * 0.22, size * 0.68, size * 0.56, size * 0.06);
  ctx.fillStyle = "#ffe66d";
  ctx.fillRect(size * 0.22, size * 0.68, size * 0.38, size * 0.06);
}

function drawCyberFood(ctx, size) {
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "#fff3a8");
  g.addColorStop(0.4, "#ff5ea8");
  g.addColorStop(1, "#7a1fff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(124, 247, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.2, 0.2 * Math.PI, 1.4 * Math.PI);
  ctx.stroke();
}

function drawKittyHead(ctx, size) {
  const g = ctx.createRadialGradient(
    size * 0.4,
    size * 0.35,
    8,
    size / 2,
    size / 2,
    size * 0.55
  );
  g.addColorStop(0, "#ffd7b8");
  g.addColorStop(1, "#d4895c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 简约耳尖高光（几何三角，不画五官）
  ctx.fillStyle = "rgba(255, 200, 160, 0.9)";
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.4);
  ctx.lineTo(size * 0.3, size * 0.08);
  ctx.lineTo(size * 0.42, size * 0.36);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.8, size * 0.4);
  ctx.lineTo(size * 0.7, size * 0.08);
  ctx.lineTo(size * 0.58, size * 0.36);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  // 金属感横切高光
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(size * 0.2, size * 0.48, size * 0.6, size * 0.08);
}

function drawKittyFood(ctx, size) {
  const g = ctx.createRadialGradient(
    size * 0.4,
    size * 0.35,
    4,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "#d4f0ff");
  g.addColorStop(1, "#4a9ec4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(size * 0.4, size * 0.36, size * 0.12, size * 0.07, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPixelHead(ctx, size) {
  const cell = size / 8;
  const colors = [
    ["#062016", "#0a2e20", "#0a2e20", "#062016", "#062016", "#0a2e20", "#0a2e20", "#062016"],
    ["#0a2e20", "#1fa86a", "#3dd68c", "#3dd68c", "#3dd68c", "#3dd68c", "#1fa86a", "#0a2e20"],
    ["#0a2e20", "#3dd68c", "#7CFFC0", "#7CFFC0", "#7CFFC0", "#7CFFC0", "#3dd68c", "#0a2e20"],
    ["#0a2e20", "#3dd68c", "#7CFFC0", "#062016", "#062016", "#7CFFC0", "#3dd68c", "#0a2e20"],
    ["#0a2e20", "#3dd68c", "#7CFFC0", "#062016", "#062016", "#7CFFC0", "#3dd68c", "#0a2e20"],
    ["#0a2e20", "#3dd68c", "#3dd68c", "#3dd68c", "#3dd68c", "#3dd68c", "#3dd68c", "#0a2e20"],
    ["#0a2e20", "#1fa86a", "#3dd68c", "#1fa86a", "#1fa86a", "#3dd68c", "#1fa86a", "#0a2e20"],
    ["#062016", "#0a2e20", "#0a2e20", "#062016", "#062016", "#0a2e20", "#0a2e20", "#062016"],
  ];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = colors[y][x];
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }
  // 亮像素点
  ctx.fillStyle = "#e8fff4";
  ctx.fillRect(cell * 3, cell * 3.2, cell * 0.45, cell * 0.45);
  ctx.fillRect(cell * 5.2, cell * 3.2, cell * 0.45, cell * 0.45);
}

function drawPixelFood(ctx, size) {
  const cell = size / 8;
  ctx.fillStyle = "#fb8500";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ffb703";
  ctx.fillRect(cell, cell, cell * 6, cell * 6);
  ctx.fillStyle = "#ffe566";
  ctx.fillRect(cell * 2, cell * 2, cell * 3, cell * 3);
  ctx.fillStyle = "#fff8";
  ctx.fillRect(cell * 2.5, cell * 2.5, cell * 1.5, cell * 1.5);
  ctx.fillStyle = "#c1121f";
  ctx.fillRect(cell, cell, cell * 6, cell);
  ctx.fillRect(cell, cell * 6, cell * 6, cell);
}

function drawHeartHead(ctx, size) {
  const g = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    6,
    size / 2,
    size / 2,
    size * 0.55
  );
  g.addColorStop(0, "#ffc1e0");
  g.addColorStop(0.5, "#ff5ea0");
  g.addColorStop(1, "#b01050");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  // 抽象心形高光块，非卡通脸
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  const x = size / 2;
  const y = size * 0.48;
  const s = size * 0.16;
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y, x - s, y - s * 0.15, x - s, y - s * 0.55);
  ctx.bezierCurveTo(x - s, y - s, x, y - s * 0.7, x, y - s * 0.3);
  ctx.bezierCurveTo(x, y - s * 0.7, x + s, y - s, x + s, y - s * 0.55);
  ctx.bezierCurveTo(x + s, y - s * 0.15, x, y, x, y + s * 0.35);
  ctx.fill();
}

function drawHeartFood(ctx, size) {
  ctx.fillStyle = "#2a1020";
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(
    size * 0.4,
    size * 0.35,
    4,
    size / 2,
    size / 2,
    size * 0.4
  );
  g.addColorStop(0, "#ff8fb8");
  g.addColorStop(1, "#ff2d6a");
  ctx.fillStyle = g;
  ctx.beginPath();
  const x = size / 2;
  const y = size * 0.58;
  const s = size * 0.3;
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s, y - s * 0.1, x - s, y - s * 0.55);
  ctx.bezierCurveTo(x - s, y - s, x, y - s * 0.75, x, y - s * 0.35);
  ctx.bezierCurveTo(x, y - s * 0.75, x + s, y - s, x + s, y - s * 0.55);
  ctx.bezierCurveTo(x + s, y - s * 0.1, x, y, x, y + s * 0.3);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** 奖励皮通用：径向材质头 + 细环 + 高光，无卡通五官 */
function drawRewardHead(ctx, size, c0, c1, c2, ring) {
  const g = ctx.createRadialGradient(
    size * 0.34,
    size * 0.3,
    6,
    size / 2,
    size / 2,
    size * 0.55
  );
  g.addColorStop(0, c0);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.ellipse(size * 0.36, size * 0.34, size * 0.16, size * 0.09, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRewardFood(ctx, size, c0, c1) {
  const g = ctx.createRadialGradient(
    size * 0.38,
    size * 0.34,
    4,
    size / 2,
    size / 2,
    size * 0.48
  );
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * @typedef {{id:string,name:string,body:string,bodyEnd:string,makeHead:Function,makeFood:Function,unlockTaskId?:string}} SkinDef
 * @type {Record<string, SkinDef>}
 */
export const SKINS = {
  classic: {
    id: "classic",
    name: "经典",
    body: "55, 230, 130",
    bodyEnd: "20, 90, 70",
    // 默认蛇头：与开场吉祥物同一张贴纸
    makeHead: () => "./assets/mascot.png",
    makeFood: () => circleCanvas(drawClassicFood),
  },
  cyber: {
    id: "cyber",
    name: "赛博",
    body: "80, 220, 255",
    bodyEnd: "50, 70, 200",
    makeHead: () => circleCanvas(drawCyberHead),
    makeFood: () => circleCanvas(drawCyberFood),
  },
  kitty: {
    id: "kitty",
    name: "小猫",
    body: "255, 180, 130",
    bodyEnd: "160, 90, 60",
    makeHead: () => circleCanvas(drawKittyHead),
    makeFood: () => circleCanvas(drawKittyFood),
  },
  pixel: {
    id: "pixel",
    name: "像素",
    body: "70, 240, 160",
    bodyEnd: "20, 70, 50",
    makeHead: () => circleCanvas(drawPixelHead),
    makeFood: () => circleCanvas(drawPixelFood),
  },
  heart: {
    id: "heart",
    name: "甜心",
    body: "255, 110, 180",
    bodyEnd: "160, 40, 100",
    makeHead: () => circleCanvas(drawHeartHead),
    makeFood: () => circleCanvas(drawHeartFood),
  },
  // —— 任务奖励皮（unlockTaskId 与 tasks.js 对应）——
  bamboo: {
    id: "bamboo",
    name: "竹青",
    body: "110, 150, 120",
    bodyEnd: "40, 70, 55",
    unlockTaskId: "classic_best_15",
    makeHead: () =>
      circleCanvas((ctx, s) =>
        drawRewardHead(ctx, s, "#c5d9c8", "#6d9a78", "#2a4534", "rgba(180,210,190,0.7)")
      ),
    makeFood: () =>
      circleCanvas((ctx, s) => drawRewardFood(ctx, s, "#d4e8d8", "#4a7a58")),
  },
  amber: {
    id: "amber",
    name: "琥珀",
    body: "240, 170, 60",
    bodyEnd: "120, 70, 30",
    unlockTaskId: "classic_best_30",
    makeHead: () =>
      circleCanvas((ctx, s) =>
        drawRewardHead(ctx, s, "#ffe0a0", "#e89a30", "#6b3a12", "rgba(255,220,150,0.75)")
      ),
    makeFood: () =>
      circleCanvas((ctx, s) => drawRewardFood(ctx, s, "#ffd78a", "#c46a18")),
  },
  magma: {
    id: "magma",
    name: "熔核",
    body: "255, 90, 40",
    bodyEnd: "50, 25, 30",
    unlockTaskId: "classic_best_50",
    makeHead: () =>
      circleCanvas((ctx, s) =>
        drawRewardHead(ctx, s, "#ffb080", "#ff4a20", "#2a1010", "rgba(255,160,100,0.8)")
      ),
    makeFood: () =>
      circleCanvas((ctx, s) => drawRewardFood(ctx, s, "#ffc4a0", "#d03018")),
  },
  frost: {
    id: "frost",
    name: "霜蓝",
    body: "160, 220, 255",
    bodyEnd: "40, 80, 140",
    unlockTaskId: "timed_run_12",
    makeHead: () =>
      circleCanvas((ctx, s) =>
        drawRewardHead(ctx, s, "#f0fbff", "#7ec8f0", "#2a5080", "rgba(200,235,255,0.8)")
      ),
    makeFood: () =>
      circleCanvas((ctx, s) => drawRewardFood(ctx, s, "#e8f7ff", "#3a7ab0")),
  },
  volt: {
    id: "volt",
    name: "电光",
    body: "255, 240, 120",
    bodyEnd: "120, 60, 200",
    unlockTaskId: "timed_full_15",
    makeHead: () =>
      circleCanvas((ctx, s) =>
        drawRewardHead(ctx, s, "#fffce8", "#ffe566", "#5a28a8", "rgba(255,255,180,0.85)")
      ),
    makeFood: () =>
      circleCanvas((ctx, s) => drawRewardFood(ctx, s, "#fff6b0", "#8a40d0")),
  },
  wraith: {
    id: "wraith",
    name: "幽影",
    body: "140, 120, 170",
    bodyEnd: "25, 20, 40",
    unlockTaskId: "timed_run_25",
    makeHead: () =>
      circleCanvas((ctx, s) =>
        drawRewardHead(ctx, s, "#d0c8e0", "#6a5a88", "#18141f", "rgba(200,190,230,0.55)")
      ),
    makeFood: () =>
      circleCanvas((ctx, s) => drawRewardFood(ctx, s, "#c8bdd8", "#3a3048")),
  },
};

export const SKIN_LIST = Object.values(SKINS);

export function getSkin(id) {
  return SKINS[id] || SKINS.classic;
}

/** 兼容旧接口 */
export function createDefaultAvatar(kind, skinId = "classic") {
  const skin = getSkin(skinId);
  return kind === "head" ? skin.makeHead() : skin.makeFood();
}

export const DIFFICULTY = {
  slow: { id: "slow", name: "慢", tickMs: 180 },
  medium: { id: "medium", name: "中", tickMs: 120 },
  fast: { id: "fast", name: "快", tickMs: 72 },
};

export const DIFFICULTY_LIST = Object.values(DIFFICULTY);

export function getDifficulty(id) {
  return DIFFICULTY[id] || DIFFICULTY.medium;
}
