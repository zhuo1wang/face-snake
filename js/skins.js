/**
 * 多套默认皮肤：蛇头 + 食物 + 蛇身配色
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

function drawClassicHead(ctx, size) {
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#5dffb0");
  g.addColorStop(1, "#1f9e63");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#062016";
  ctx.beginPath();
  ctx.arc(size * 0.38, size * 0.42, size * 0.08, 0, Math.PI * 2);
  ctx.arc(size * 0.62, size * 0.42, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.4, size * 0.03, 0, Math.PI * 2);
  ctx.arc(size * 0.64, size * 0.4, size * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#062016";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.52, size * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawClassicFood(ctx, size) {
  const g = ctx.createRadialGradient(size * 0.4, size * 0.35, 8, size / 2, size / 2, size / 2);
  g.addColorStop(0, "#ffb199");
  g.addColorStop(1, "#ff7a59");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(size * 0.38, size * 0.34, size * 0.16, size * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCyberHead(ctx, size) {
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#7cf7ff");
  g.addColorStop(1, "#4b6bff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#e8f5ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(size * 0.22, size * 0.28, size * 0.56, size * 0.22);
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(size * 0.3, size * 0.34, size * 0.14, size * 0.1);
  ctx.fillRect(size * 0.56, size * 0.34, size * 0.14, size * 0.1);
  ctx.fillStyle = "#7cf7ff";
  ctx.fillRect(size * 0.34, size * 0.62, size * 0.32, size * 0.06);
}

function drawCyberFood(ctx, size) {
  const g = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  g.addColorStop(0, "#ffe66d");
  g.addColorStop(1, "#ff3d81");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
  ctx.stroke();
}

function drawKittyHead(ctx, size) {
  ctx.fillStyle = "#f6c89f";
  ctx.fillRect(0, 0, size, size);
  // 耳朵
  ctx.fillStyle = "#e8a87c";
  ctx.beginPath();
  ctx.moveTo(size * 0.18, size * 0.42);
  ctx.lineTo(size * 0.28, size * 0.08);
  ctx.lineTo(size * 0.42, size * 0.38);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.82, size * 0.42);
  ctx.lineTo(size * 0.72, size * 0.08);
  ctx.lineTo(size * 0.58, size * 0.38);
  ctx.fill();
  ctx.fillStyle = "#2b2118";
  ctx.beginPath();
  ctx.arc(size * 0.38, size * 0.48, size * 0.06, 0, Math.PI * 2);
  ctx.arc(size * 0.62, size * 0.48, size * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e85d75";
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.58);
  ctx.lineTo(size * 0.44, size * 0.66);
  ctx.lineTo(size * 0.56, size * 0.66);
  ctx.fill();
}

function drawKittyFood(ctx, size) {
  ctx.fillStyle = "#7ec8e3";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#f7f7f7";
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size * 0.32, size * 0.18, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3d7ea6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.45);
  ctx.quadraticCurveTo(size * 0.5, size * 0.35, size * 0.7, size * 0.5);
  ctx.stroke();
}

function drawPixelHead(ctx, size) {
  const cell = size / 8;
  const palette = ["#1a3d2e", "#3dd68c", "#3dd68c", "#062016"];
  // 简单像素脸
  ctx.fillStyle = "#3dd68c";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#062016";
  ctx.fillRect(cell * 2, cell * 2.5, cell, cell);
  ctx.fillRect(cell * 5, cell * 2.5, cell, cell);
  ctx.fillRect(cell * 2.5, cell * 5, cell * 3, cell);
  ctx.fillStyle = "#fff";
  ctx.fillRect(cell * 2.3, cell * 2.6, cell * 0.35, cell * 0.35);
  ctx.fillRect(cell * 5.3, cell * 2.6, cell * 0.35, cell * 0.35);
  void palette;
}

function drawPixelFood(ctx, size) {
  const cell = size / 8;
  ctx.fillStyle = "#ffb703";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fb8500";
  ctx.fillRect(cell, cell, cell * 6, cell);
  ctx.fillRect(cell, cell * 6, cell * 6, cell);
  ctx.fillStyle = "#fff3";
  ctx.fillRect(cell * 2, cell * 2, cell * 2, cell * 2);
}

function drawHeartHead(ctx, size) {
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#ff9ecf");
  g.addColorStop(1, "#ff4d8d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(size * 0.38, size * 0.42, size * 0.07, 0, Math.PI * 2);
  ctx.arc(size * 0.62, size * 0.42, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a1030";
  ctx.beginPath();
  ctx.arc(size * 0.38, size * 0.43, size * 0.03, 0, Math.PI * 2);
  ctx.arc(size * 0.62, size * 0.43, size * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5a1030";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.55, size * 0.16, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
}

function drawHeartFood(ctx, size) {
  ctx.fillStyle = "#ffe0ec";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ff3b6b";
  ctx.beginPath();
  const x = size / 2;
  const y = size * 0.58;
  const s = size * 0.28;
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s, y - s * 0.1, x - s, y - s * 0.55);
  ctx.bezierCurveTo(x - s, y - s, x, y - s * 0.75, x, y - s * 0.35);
  ctx.bezierCurveTo(x, y - s * 0.75, x + s, y - s, x + s, y - s * 0.55);
  ctx.bezierCurveTo(x + s, y - s * 0.1, x, y, x, y + s * 0.3);
  ctx.fill();
}

/** @type {Record<string, {id:string,name:string,body:string,bodyEnd:string,makeHead:Function,makeFood:Function}>} */
export const SKINS = {
  classic: {
    id: "classic",
    name: "经典",
    body: "40, 180, 90",
    bodyEnd: "40, 80, 90",
    makeHead: () => circleCanvas(drawClassicHead),
    makeFood: () => circleCanvas(drawClassicFood),
  },
  cyber: {
    id: "cyber",
    name: "赛博",
    body: "60, 140, 255",
    bodyEnd: "40, 60, 140",
    makeHead: () => circleCanvas(drawCyberHead),
    makeFood: () => circleCanvas(drawCyberFood),
  },
  kitty: {
    id: "kitty",
    name: "小猫",
    body: "232, 168, 124",
    bodyEnd: "180, 120, 90",
    makeHead: () => circleCanvas(drawKittyHead),
    makeFood: () => circleCanvas(drawKittyFood),
  },
  pixel: {
    id: "pixel",
    name: "像素",
    body: "61, 214, 140",
    bodyEnd: "26, 61, 46",
    makeHead: () => circleCanvas(drawPixelHead),
    makeFood: () => circleCanvas(drawPixelFood),
  },
  heart: {
    id: "heart",
    name: "甜心",
    body: "255, 120, 170",
    bodyEnd: "180, 60, 110",
    makeHead: () => circleCanvas(drawHeartHead),
    makeFood: () => circleCanvas(drawHeartFood),
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
