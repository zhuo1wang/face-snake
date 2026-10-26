import { GRID_DESKTOP, MAP_EMPTY, buildMapIndex, normalizeGridSize } from "./maps.js";

/**
 * @typedef {{x:number,y:number}} Cell
 */

export function createGame(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const onScore = options.onScore || (() => {});
  const onEat = options.onEat || (() => {});
  const onGameOver = options.onGameOver || (() => {});
  const onStatus = options.onStatus || (() => {});
  const onTime = options.onTime || (() => {});

  /** @type {Cell[]} */
  let snake = [];
  /** @type {Cell[]} */
  let foods = [];
  /** 场上同时食物：最少 1、最多 5；吃后随机补 1～2 */
  const FOOD_MIN = 1;
  const FOOD_MAX = 5;
  /**
   * 生长：得分 ≤ 该值时吃 1 长 1；之后每吃 2 个才长 1 节。
   * 得分仍是每食物 +1，与任务分档无关。
   */
  const GROW_FULL_UNTIL = 15;
  /** 达到该长度后改用省电画法（少分层、不按节描边） */
  const DRAW_SIMPLE_LEN = 40;
  /** 更长时路径隔点取样，进一步降耗 */
  const DRAW_SPARSE_LEN = 70;
  /** @type {Cell} */
  let dir = { x: 1, y: 0 };
  /** @type {Cell} */
  let pendingDir = { x: 1, y: 0 };
  let score = 0;
  let moves = 0;
  let running = false;
  let paused = false;
  let dead = false;
  let acc = 0;
  let lastTs = 0;
  let raf = 0;
  let tickMs = 120;
  let bodyRgb = "40, 180, 90";
  let bodyEndRgb = "40, 80, 90";
  /** @type {null|'magma'|'wraith'} 终档身子装饰 */
  let bodyStyle = null;
  let timeLimitMs = 0;
  let timeLeftMs = 0;
  /** 手机用更少格，单元格更大 */
  let gridSize = normalizeGridSize(options.gridSize || GRID_DESKTOP);

  let map = MAP_EMPTY;
  let wallSet = new Set();
  /** @type {Map<string, Cell>} */
  let portalTo = new Map();

  /** @type {HTMLImageElement|null} */
  let headImg = null;
  /** @type {HTMLImageElement|null} */
  let foodImg = null;

  let dpr = 1;
  let cell = 20;
  let cssSize = 400;

  function applyMapData(next) {
    map = next || MAP_EMPTY;
    const idx = buildMapIndex(map);
    wallSet = idx.wallSet;
    portalTo = idx.portalTo;
  }

  function resetSnake() {
    const mid = Math.floor(gridSize / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    dir = { x: 1, y: 0 };
    pendingDir = { x: 1, y: 0 };
    score = 0;
    moves = 0;
    dead = false;
    foods = [];
    timeLeftMs = timeLimitMs;
    seedFoods();
    onScore(score);
    if (timeLimitMs > 0) onTime(timeLeftMs);
  }

  function cellKey(c) {
    return `${c.x},${c.y}`;
  }

  function isBlocked(x, y) {
    return wallSet.has(`${x},${y}`);
  }

  function pickEmptyCells(occupied) {
    const empty = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
      }
    }
    return empty;
  }

  /** 往场上补 n 个食物（受空位限制） */
  function spawnFoods(n) {
    if (n <= 0) return;
    const occupied = new Set([
      ...snake.map(cellKey),
      ...foods.map(cellKey),
      ...wallSet,
      ...portalTo.keys(),
    ]);
    let left = n;
    while (left > 0) {
      const empty = pickEmptyCells(occupied);
      if (!empty.length) break;
      const spot = empty[Math.floor(Math.random() * empty.length)];
      foods.push(spot);
      occupied.add(cellKey(spot));
      left -= 1;
    }
  }

  /** 开局 / 重置：随机放 1～2 个，保证 ≥1、≤5 */
  function seedFoods() {
    const want = FOOD_MIN + Math.floor(Math.random() * 2); // 1 或 2
    spawnFoods(Math.min(want, FOOD_MAX));
    if (foods.length < FOOD_MIN) spawnFoods(FOOD_MIN - foods.length);
  }

  /**
   * 吃掉之后补货：随机补 1 或 2，总数不超过 5；
   * 若场上已空，至少补到 1。
   */
  function refillAfterEat() {
    const room = FOOD_MAX - foods.length;
    if (room <= 0) return;
    let add = 1 + Math.floor(Math.random() * 2); // 1 或 2
    if (foods.length < FOOD_MIN) {
      add = Math.max(add, FOOD_MIN - foods.length);
    }
    spawnFoods(Math.min(add, room));
  }

  /** @deprecated 食物改为吃后随机补货，保留空操作兼容旧调用 */
  function setFoodCount() {
    /* no-op */
  }

  function resize() {
    const wrap = canvas.parentElement;
    cssSize = wrap ? wrap.clientWidth : 400;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const px = Math.floor(cssSize * dpr);
    canvas.width = px;
    canvas.height = px;
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    cell = px / gridSize;
    draw();
  }

  function setDirection(next) {
    if (next.x === -dir.x && next.y === -dir.y) return;
    pendingDir = next;
  }

  function tick() {
    dir = pendingDir;
    moves += 1;
    const head = snake[0];
    let next = { x: head.x + dir.x, y: head.y + dir.y };

    if (next.x < 0 || next.y < 0 || next.x >= gridSize || next.y >= gridSize) {
      endGame("crash", "border");
      return;
    }
    if (isBlocked(next.x, next.y)) {
      endGame("crash", "wall");
      return;
    }

    const portalExit = portalTo.get(cellKey(next));
    if (portalExit) {
      next = { x: portalExit.x, y: portalExit.y };
      if (isBlocked(next.x, next.y)) {
        endGame("crash", "wall");
        return;
      }
    }

    if (snake.some((s) => s.x === next.x && s.y === next.y)) {
      endGame("crash", "self");
      return;
    }

    snake.unshift(next);
    const eatIndex = foods.findIndex((f) => f.x === next.x && f.y === next.y);
    if (eatIndex >= 0) {
      foods.splice(eatIndex, 1);
      score += 1;
      // 前期每吃必长；超过阈值后每 2 分长 1 节
      const shouldGrow =
        score <= GROW_FULL_UNTIL || (score - GROW_FULL_UNTIL) % 2 === 0;
      if (!shouldGrow) snake.pop();
      onScore(score);
      onEat(score);
      refillAfterEat();
    } else {
      snake.pop();
    }
  }

  /**
   * @param {'crash'|'time'} reason
   * @param {'wall'|'self'|'border'|null} [deathKind]
   */
  function endGame(reason = "crash", deathKind = null) {
    if (dead) return;
    dead = true;
    running = false;
    paused = false;
    onStatus("over");
    onGameOver(score, {
      reason,
      deathKind: reason === "time" ? null : deathKind,
      moves,
      mapId: map.id,
    });
    draw();
  }

  function drawGrid() {
    const size = canvas.width;
    ctx.fillStyle = "#0c1612";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(93, 255, 176, 0.035)";
    ctx.lineWidth = Math.max(1, dpr * 0.5);
    for (let i = 0; i <= gridSize; i++) {
      const p = i * cell;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
  }

  function drawRoundedCell(x, y, color, padRatio = 0.12) {
    const pad = cell * padRatio;
    const r = cell * 0.28;
    const px = x * cell + pad;
    const py = y * cell + pad;
    const s = cell - pad * 2;
    ctx.fillStyle = color;
    roundRect(ctx, px, py, s, s, r);
    ctx.fill();
  }

  /** @param {number} [step] 隔几节取一个点；始终包含尾节 */
  function snakeCenters(step = 1) {
    const pts = [];
    const n = snake.length;
    const stride = Math.max(1, step | 0);
    for (let i = 0; i < n; i += stride) {
      const s = snake[i];
      pts.push({ x: s.x * cell + cell / 2, y: s.y * cell + cell / 2 });
    }
    if ((n - 1) % stride !== 0) {
      const s = snake[n - 1];
      pts.push({ x: s.x * cell + cell / 2, y: s.y * cell + cell / 2 });
    }
    return pts;
  }

  function traceSnakePath(pts) {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
  }

  /** 长蛇省电：整路径 1～2 次描边，无按节渐变 */
  function drawSnakeBodySimple(pts, baseW) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    traceSnakePath(pts);
    ctx.strokeStyle = `rgba(${bodyRgb}, 0.3)`;
    ctx.lineWidth = baseW * 1.35;
    ctx.stroke();

    traceSnakePath(pts);
    ctx.strokeStyle = `rgb(${bodyRgb})`;
    ctx.lineWidth = baseW;
    ctx.stroke();
  }

  /** 短蛇全特效：多层光 + 按节渐变 + 高光 */
  function drawSnakeBodyFancy(pts, baseW) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    traceSnakePath(pts);
    ctx.strokeStyle = `rgba(${bodyRgb}, 0.28)`;
    ctx.lineWidth = baseW * 1.55;
    ctx.stroke();

    traceSnakePath(pts);
    ctx.strokeStyle = `rgba(${bodyRgb}, 0.55)`;
    ctx.lineWidth = baseW * 1.12;
    ctx.stroke();

    const segs = Math.max(1, pts.length - 1);
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      const w = baseW * (1.06 - t0 * 0.34);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.strokeStyle = lerpRgb(bodyRgb, bodyEndRgb, (t0 + t1) / 2);
      ctx.lineWidth = w;
      ctx.stroke();
    }

    traceSnakePath(pts);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = Math.max(1.2, baseW * 0.22);
    ctx.stroke();
  }

  /** 熔核裂纹 / 幽影光点：沿蛇脊采样绘制 */
  function drawBodyDecor(pts, baseW) {
    if (!bodyStyle || pts.length < 2) return;
    const stride = bodyStyle === "wraith" ? 2 : 1;
    if (bodyStyle === "magma") {
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255, 220, 120, 0.85)";
      ctx.lineWidth = Math.max(1.5, baseW * 0.14);
      for (let i = 1; i < pts.length - 1; i += 2) {
        const a = pts[i - 1];
        const b = pts[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = (-dy / len) * baseW * 0.22;
        const py = (dx / len) * baseW * 0.22;
        ctx.beginPath();
        ctx.moveTo(b.x - px * 0.6, b.y - py * 0.6);
        ctx.lineTo(b.x + px, b.y + py);
        ctx.stroke();
      }
      return;
    }
    if (bodyStyle === "wraith") {
      for (let i = 1; i < pts.length; i += stride) {
        const p = pts[i];
        const t = i / pts.length;
        const rad = Math.max(1.2, baseW * (0.12 - t * 0.04));
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(160, 200, 255, 0.2)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(230, 240, 255, 0.75)";
        ctx.fill();
      }
    }
  }

  function drawSnakeBody() {
    if (snake.length < 2) return;
    const baseW = cell * 0.78;
    const simple = snake.length >= DRAW_SIMPLE_LEN;
    const step = snake.length >= DRAW_SPARSE_LEN ? 2 : 1;
    const pts = snakeCenters(step);
    if (simple) drawSnakeBodySimple(pts, baseW);
    else drawSnakeBodyFancy(pts, baseW);
    drawBodyDecor(pts, baseW);
  }

  function drawSnakeHead() {
    const head = snake[0];
    if (!head) return;
    const cx = head.x * cell + cell / 2;
    const cy = head.y * cell + cell / 2;
    const r = cell * 0.54;
    const angle = Math.atan2(dir.y, dir.x);
    const neck = snake[1];

    ctx.save();
    ctx.translate(cx, cy);

    if (neck) {
      const nx = neck.x * cell + cell / 2 - cx;
      const ny = neck.y * cell + cell / 2 - cy;
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(${bodyRgb}, 0.95)`;
      ctx.lineWidth = cell * 0.82;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(nx * 0.55, ny * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(nx * 0.22, ny * 0.22, r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${bodyRgb})`;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${bodyRgb})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${bodyRgb}, 0.26)`;
    ctx.fill();

    // 描边垫在头图下面，避免盖住角/帽檐等超出圆形的细节
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = `rgb(${bodyRgb})`;
    ctx.lineWidth = Math.max(2.5, cell * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = Math.max(1, cell * 0.035);
    ctx.stroke();

    ctx.save();
    ctx.rotate(angle);
    if (headImg) {
      // 不裁成圆：终档角/帽等要伸出头外；透明底的圆形皮不受影响
      const s = r * 2.15;
      ctx.drawImage(headImg, -s / 2, -s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${bodyRgb})`;
      ctx.fill();
    }
    ctx.restore();

    if (neck) {
      const nx = neck.x * cell + cell / 2 - cx;
      const ny = neck.y * cell + cell / 2 - cy;
      const neckAngle = Math.atan2(ny, nx);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, neckAngle - 0.95, neckAngle + 0.95);
      ctx.strokeStyle = `rgb(${bodyRgb})`;
      ctx.lineWidth = Math.max(3, cell * 0.14);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, neckAngle - 0.95, neckAngle + 0.95);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = Math.max(1, cell * 0.045);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawWalls() {
    for (const key of wallSet) {
      const [xs, ys] = key.split(",");
      const x = Number(xs);
      const y = Number(ys);
      drawRoundedCell(x, y, "#2a3d34", 0.08);
      // 顶缘高光
      const pad = cell * 0.08;
      ctx.fillStyle = "rgba(120, 160, 140, 0.22)";
      ctx.fillRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell * 0.22);
    }
  }

  function drawPortals() {
    (map.portals || []).forEach((pair, i) => {
      const color = i % 2 === 0 ? "#5ec8ff" : "#ff9b6a";
      drawPortalCell(pair.a.x, pair.a.y, color);
      drawPortalCell(pair.b.x, pair.b.y, color);
    });
  }

  function drawPortalCell(x, y, color) {
    const cx = x * cell + cell / 2;
    const cy = y * cell + cell / 2;
    const r = cell * 0.32;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(1.5, dpr);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawFoodCell(img, x, y) {
    const cx = x * cell + cell / 2;
    const cy = y * cell + cell / 2;
    const r = cell * (gridSize <= 14 ? 0.38 : 0.36);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 140, 100, 0.2)";
    ctx.fill();
    if (img) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      const s = r * 2;
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ff7a59";
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = Math.max(1, cell * 0.04);
    ctx.stroke();
  }

  function draw() {
    drawGrid();
    drawWalls();
    drawPortals();
    drawSnakeBody();
    for (const f of foods) {
      drawFoodCell(foodImg, f.x, f.y);
    }
    drawSnakeHead();
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!running || paused || dead) {
      lastTs = ts;
      return;
    }
    if (!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    acc += dt;
    lastTs = ts;

    if (timeLimitMs > 0) {
      timeLeftMs = Math.max(0, timeLeftMs - dt);
      onTime(timeLeftMs);
      if (timeLeftMs <= 0) {
        endGame("time");
        return;
      }
    }

    while (acc >= tickMs) {
      acc -= tickMs;
      tick();
      if (dead) break;
    }
    draw();
  }

  function setTickMs(ms) {
    tickMs = Math.max(40, Number(ms) || 120);
  }

  function setTimeLimit(seconds) {
    const sec = Number(seconds);
    timeLimitMs = Number.isFinite(sec) && sec > 0 ? Math.floor(sec * 1000) : 0;
    if (!running) {
      timeLeftMs = timeLimitMs;
      if (timeLimitMs > 0) onTime(timeLeftMs);
    }
  }

  function setMap(nextMap) {
    applyMapData(nextMap);
    if (!running) {
      // 准备阶段换图时重摆食物
      foods = [];
      seedFoods();
    }
    draw();
  }

  /** @param {number} n */
  function setGridSize(n) {
    const next = normalizeGridSize(n);
    if (next === gridSize) return false;
    gridSize = next;
    // 格数变化后蛇/食物坐标失效，由外部 reset + 重新 setMap
    cell = (canvas.width || 1) / gridSize;
    return true;
  }

  /**
   * @param {string} startRgb
   * @param {string} endRgb
   * @param {null|'magma'|'wraith'} [style]
   */
  function setBodyTheme(startRgb, endRgb, style) {
    bodyRgb = startRgb || bodyRgb;
    bodyEndRgb = endRgb || bodyEndRgb;
    bodyStyle = style === "magma" || style === "wraith" ? style : null;
    draw();
  }

  function start() {
    if (dead) resetSnake();
    running = true;
    paused = false;
    dead = false;
    lastTs = 0;
    acc = 0;
    onStatus("playing");
    draw();
  }

  function pause() {
    if (!running || dead) return;
    paused = !paused;
    onStatus(paused ? "paused" : "playing");
  }

  function reset() {
    running = false;
    paused = false;
    resetSnake();
    onStatus("ready");
    draw();
  }

  async function setHeadImage(src) {
    if (!src) {
      headImg = null;
      draw();
      return;
    }
    headImg = await loadHtmlImage(src);
    draw();
  }

  async function setFoodImage(src) {
    if (!src) {
      foodImg = null;
      draw();
      return;
    }
    foodImg = await loadHtmlImage(src);
    draw();
  }

  function loadHtmlImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  applyMapData(MAP_EMPTY);
  resetSnake();
  resize();
  raf = requestAnimationFrame(loop);
  window.addEventListener("resize", resize);

  return {
    start,
    pause,
    reset,
    setDirection,
    setHeadImage,
    setFoodImage,
    setTickMs,
    setTimeLimit,
    setFoodCount,
    setMap,
    setGridSize,
    setBodyTheme,
    resize,
    getScore: () => score,
    getFoodCount: () => foods.length,
    getMoves: () => moves,
    getTimeLeftMs: () => timeLeftMs,
    getMapId: () => map.id,
    getGridSize: () => gridSize,
    isTimed: () => timeLimitMs > 0,
    isRunning: () => running && !paused && !dead,
    isPaused: () => paused,
    isDead: () => dead,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    },
  };
}

function lerpRgb(a, b, t) {
  const pa = a.split(",").map((n) => Number(n.trim()));
  const pb = b.split(",").map((n) => Number(n.trim()));
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
