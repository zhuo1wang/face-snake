/**
 * 多套默认皮肤：蛇头 + 食物 + 蛇身配色
 * 程序化头偏材质/几何，少涂鸦五官；classic 默认仍用吉祥物贴纸。
 */

/**
 * @param {(ctx: CanvasRenderingContext2D, size: number) => void} draw
 * @param {{ clipCircle?: boolean }} [opts] clipCircle=false 时保留角/帽等伸出圆形的部分
 */
function circleCanvas(draw, opts = {}) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  if (opts.clipCircle !== false) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }
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

function paintRoundFace(ctx, size, c0, c1, c2, cy = 0.52) {
  const cx = size / 2;
  const y = size * cy;
  const g = ctx.createRadialGradient(size * 0.38, size * (cy - 0.12), 4, cx, y, size * 0.4);
  g.addColorStop(0, c0);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, y, size * 0.34, 0, Math.PI * 2);
  ctx.fill();
}

/** 竹青：双叶 */
function drawBambooHead(ctx, size) {
  paintRoundFace(ctx, size, "#c5d9c8", "#6d9a78", "#2a4534");
  ctx.fillStyle = "#3d6b48";
  ctx.beginPath();
  ctx.ellipse(size * 0.28, size * 0.28, size * 0.12, size * 0.055, -0.7, 0, Math.PI * 2);
  ctx.ellipse(size * 0.72, size * 0.26, size * 0.12, size * 0.055, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1e3a28";
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(size * 0.34, size * 0.32);
  ctx.lineTo(size * 0.42, size * 0.42);
  ctx.moveTo(size * 0.66, size * 0.3);
  ctx.lineTo(size * 0.58, size * 0.42);
  ctx.stroke();
  ctx.fillStyle = "#1e3a28";
  ctx.beginPath();
  ctx.arc(size * 0.42, size * 0.54, size * 0.035, 0, Math.PI * 2);
  ctx.arc(size * 0.58, size * 0.54, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawBambooFood(ctx, size) {
  paintRoundFace(ctx, size, "#d4e8d8", "#4a7a58", "#243828", 0.5);
  ctx.fillStyle = "#2f5a3a";
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.32, size * 0.14, size * 0.06, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** 琥珀：金环 + 六边高光 */
function drawAmberHead(ctx, size) {
  paintRoundFace(ctx, size, "#ffe0a0", "#e89a30", "#6b3a12");
  ctx.strokeStyle = "#fff0c0";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.52, size * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 240, 180, 0.85)";
  ctx.beginPath();
  const hx = size / 2;
  const hy = size * 0.42;
  const r = size * 0.1;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = hx + Math.cos(a) * r;
    const y = hy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5a2e0c";
  ctx.beginPath();
  ctx.arc(size * 0.42, size * 0.56, size * 0.035, 0, Math.PI * 2);
  ctx.arc(size * 0.58, size * 0.56, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawAmberFood(ctx, size) {
  paintRoundFace(ctx, size, "#ffd78a", "#c46a18", "#5a2e0c", 0.5);
  ctx.strokeStyle = "#fff0c0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.5, size * 0.22, 0, Math.PI * 2);
  ctx.stroke();
}

/** 霜蓝：冰晶冠 */
function drawFrostHead(ctx, size) {
  paintRoundFace(ctx, size, "#f0fbff", "#7ec8f0", "#2a5080");
  ctx.strokeStyle = "#e8f7ff";
  ctx.fillStyle = "rgba(200, 235, 255, 0.9)";
  ctx.lineWidth = Math.max(2.5, size * 0.04);
  ctx.lineJoin = "round";
  // 三叉冰晶
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.08);
  ctx.lineTo(size * 0.5, size * 0.36);
  ctx.moveTo(size * 0.5, size * 0.18);
  ctx.lineTo(size * 0.32, size * 0.3);
  ctx.moveTo(size * 0.5, size * 0.18);
  ctx.lineTo(size * 0.68, size * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.1);
  ctx.lineTo(size * 0.44, size * 0.22);
  ctx.lineTo(size * 0.5, size * 0.2);
  ctx.lineTo(size * 0.56, size * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1a4068";
  ctx.beginPath();
  ctx.arc(size * 0.42, size * 0.54, size * 0.035, 0, Math.PI * 2);
  ctx.arc(size * 0.58, size * 0.54, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(size * 0.41, size * 0.52, size * 0.015, 0, Math.PI * 2);
  ctx.arc(size * 0.57, size * 0.52, size * 0.015, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrostFood(ctx, size) {
  paintRoundFace(ctx, size, "#e8f7ff", "#3a7ab0", "#1a4068", 0.5);
  ctx.strokeStyle = "#f0fbff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.28);
  ctx.lineTo(size * 0.5, size * 0.55);
  ctx.moveTo(size * 0.5, size * 0.36);
  ctx.lineTo(size * 0.36, size * 0.48);
  ctx.moveTo(size * 0.5, size * 0.36);
  ctx.lineTo(size * 0.64, size * 0.48);
  ctx.stroke();
}

/** 电光：侧闪 + 电弧眼 */
function drawVoltHead(ctx, size) {
  paintRoundFace(ctx, size, "#fffce8", "#ffe566", "#5a28a8");
  ctx.strokeStyle = "#fff8a0";
  ctx.fillStyle = "#b8ff60";
  ctx.lineWidth = Math.max(3, size * 0.05);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(size * 0.12, size * 0.32);
  ctx.lineTo(size * 0.28, size * 0.42);
  ctx.lineTo(size * 0.18, size * 0.48);
  ctx.lineTo(size * 0.34, size * 0.58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.88, size * 0.32);
  ctx.lineTo(size * 0.72, size * 0.42);
  ctx.lineTo(size * 0.82, size * 0.48);
  ctx.lineTo(size * 0.66, size * 0.58);
  ctx.stroke();
  // 电弧眼
  ctx.strokeStyle = "#5a28a8";
  ctx.lineWidth = Math.max(2.5, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(size * 0.36, size * 0.52);
  ctx.lineTo(size * 0.4, size * 0.48);
  ctx.lineTo(size * 0.44, size * 0.54);
  ctx.lineTo(size * 0.48, size * 0.5);
  ctx.moveTo(size * 0.52, size * 0.5);
  ctx.lineTo(size * 0.56, size * 0.54);
  ctx.lineTo(size * 0.6, size * 0.48);
  ctx.lineTo(size * 0.64, size * 0.52);
  ctx.stroke();
}

function drawVoltFood(ctx, size) {
  paintRoundFace(ctx, size, "#fff6b0", "#8a40d0", "#3a1860", 0.5);
  ctx.strokeStyle = "#ffe566";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.42, size * 0.28);
  ctx.lineTo(size * 0.55, size * 0.42);
  ctx.lineTo(size * 0.45, size * 0.48);
  ctx.lineTo(size * 0.58, size * 0.64);
  ctx.stroke();
}

/** 熔核：双角 + 岩浆裂纹 + 炽瞳（刻意加粗，小格子也认得出） */
function drawMagmaHead(ctx, size) {
  const cx = size / 2;
  const cy = size * 0.55;

  // 角（伸出画布上沿，局里不再裁圆才能看见）
  ctx.fillStyle = "#2a1008";
  ctx.beginPath();
  ctx.moveTo(size * 0.28, size * 0.48);
  ctx.lineTo(size * 0.08, size * 0.02);
  ctx.lineTo(size * 0.42, size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.72, size * 0.48);
  ctx.lineTo(size * 0.92, size * 0.02);
  ctx.lineTo(size * 0.58, size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff6a20";
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.46);
  ctx.lineTo(size * 0.14, size * 0.08);
  ctx.lineTo(size * 0.4, size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.7, size * 0.46);
  ctx.lineTo(size * 0.86, size * 0.08);
  ctx.lineTo(size * 0.6, size * 0.4);
  ctx.closePath();
  ctx.fill();

  const g = ctx.createRadialGradient(size * 0.4, size * 0.42, 4, cx, cy, size * 0.42);
  g.addColorStop(0, "#ffd0a0");
  g.addColorStop(0.45, "#ff4a18");
  g.addColorStop(1, "#1a0808");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffe08a";
  ctx.lineWidth = Math.max(3, size * 0.055);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(size * 0.34, size * 0.38);
  ctx.lineTo(size * 0.44, size * 0.55);
  ctx.lineTo(size * 0.38, size * 0.7);
  ctx.moveTo(size * 0.6, size * 0.4);
  ctx.lineTo(size * 0.54, size * 0.56);
  ctx.lineTo(size * 0.64, size * 0.72);
  ctx.stroke();

  ctx.fillStyle = "#1a0808";
  ctx.beginPath();
  ctx.ellipse(size * 0.4, size * 0.54, size * 0.08, size * 0.055, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.6, size * 0.54, size * 0.08, size * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe566";
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.54, size * 0.035, 0, Math.PI * 2);
  ctx.arc(size * 0.6, size * 0.54, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawMagmaFood(ctx, size) {
  const g = ctx.createRadialGradient(size * 0.4, size * 0.35, 2, size / 2, size / 2, size * 0.45);
  g.addColorStop(0, "#ffe0a8");
  g.addColorStop(0.55, "#ff5020");
  g.addColorStop(1, "#401010");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffe08a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.35, size * 0.32);
  ctx.lineTo(size * 0.48, size * 0.55);
  ctx.moveTo(size * 0.58, size * 0.36);
  ctx.lineTo(size * 0.52, size * 0.6);
  ctx.stroke();
}

/** 幽影：尖帽 + 眼镜光 + 侧角（加粗，小格子可辨） */
function drawWraithHead(ctx, size) {
  const cx = size / 2;
  const cy = size * 0.56;

  ctx.fillStyle = "#1a1528";
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.02);
  ctx.lineTo(size * 0.14, size * 0.5);
  ctx.lineTo(size * 0.86, size * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2a2038";
  ctx.beginPath();
  ctx.moveTo(size * 0.18, size * 0.42);
  ctx.lineTo(size * 0.02, size * 0.18);
  ctx.lineTo(size * 0.3, size * 0.38);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.82, size * 0.42);
  ctx.lineTo(size * 0.98, size * 0.18);
  ctx.lineTo(size * 0.7, size * 0.38);
  ctx.fill();

  const face = ctx.createRadialGradient(size * 0.42, size * 0.48, 4, cx, cy, size * 0.36);
  face.addColorStop(0, "#9a8cb8");
  face.addColorStop(0.55, "#4a3c68");
  face.addColorStop(1, "#12101a");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(200, 220, 255, 0.95)";
  ctx.lineWidth = Math.max(3, size * 0.05);
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.54, size * 0.11, 0, Math.PI * 2);
  ctx.arc(size * 0.6, size * 0.54, size * 0.11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.51, size * 0.54);
  ctx.lineTo(size * 0.49, size * 0.54);
  ctx.stroke();

  ctx.fillStyle = "rgba(160, 220, 255, 0.4)";
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.54, size * 0.085, 0, Math.PI * 2);
  ctx.arc(size * 0.6, size * 0.54, size * 0.085, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8f4ff";
  ctx.beginPath();
  ctx.arc(size * 0.38, size * 0.51, size * 0.03, 0, Math.PI * 2);
  ctx.arc(size * 0.58, size * 0.51, size * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

function drawWraithFood(ctx, size) {
  const g = ctx.createRadialGradient(size * 0.4, size * 0.36, 2, size / 2, size / 2, size * 0.42);
  g.addColorStop(0, "#ddd0f0");
  g.addColorStop(0.5, "#6a5888");
  g.addColorStop(1, "#120e18");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 210, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(200, 230, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(size * 0.42, size * 0.42, size * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * @typedef {{id:string,name:string,body:string,bodyEnd:string,makeHead:Function,makeFood:Function,unlockTaskId?:string, bodyStyle?: 'magma'|'wraith'|null}} SkinDef
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
    makeHead: () => circleCanvas(drawBambooHead, { clipCircle: false }),
    makeFood: () => circleCanvas(drawBambooFood),
  },
  amber: {
    id: "amber",
    name: "琥珀",
    body: "240, 170, 60",
    bodyEnd: "120, 70, 30",
    unlockTaskId: "classic_best_30",
    makeHead: () => circleCanvas(drawAmberHead, { clipCircle: false }),
    makeFood: () => circleCanvas(drawAmberFood),
  },
  magma: {
    id: "magma",
    name: "熔核",
    body: "255, 90, 40",
    bodyEnd: "50, 25, 30",
    bodyStyle: "magma",
    unlockTaskId: "classic_best_50",
    makeHead: () => circleCanvas(drawMagmaHead, { clipCircle: false }),
    makeFood: () => circleCanvas(drawMagmaFood),
  },
  frost: {
    id: "frost",
    name: "霜蓝",
    body: "160, 220, 255",
    bodyEnd: "40, 80, 140",
    unlockTaskId: "timed_run_12",
    makeHead: () => circleCanvas(drawFrostHead, { clipCircle: false }),
    makeFood: () => circleCanvas(drawFrostFood),
  },
  volt: {
    id: "volt",
    name: "电光",
    body: "255, 240, 120",
    bodyEnd: "120, 60, 200",
    unlockTaskId: "timed_full_15",
    makeHead: () => circleCanvas(drawVoltHead, { clipCircle: false }),
    makeFood: () => circleCanvas(drawVoltFood),
  },
  wraith: {
    id: "wraith",
    name: "幽影",
    body: "140, 120, 170",
    bodyEnd: "25, 20, 40",
    bodyStyle: "wraith",
    unlockTaskId: "timed_run_25",
    makeHead: () => circleCanvas(drawWraithHead, { clipCircle: false }),
    makeFood: () => circleCanvas(drawWraithFood),
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
