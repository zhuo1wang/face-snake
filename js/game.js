const GRID = 20;

/**
 * @typedef {{x:number,y:number}} Cell
 */

export function createGame(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const onScore = options.onScore || (() => {});
  const onGameOver = options.onGameOver || (() => {});
  const onStatus = options.onStatus || (() => {});

  /** @type {Cell[]} */
  let snake = [];
  /** @type {Cell} */
  let food = { x: 10, y: 10 };
  /** @type {Cell} */
  let dir = { x: 1, y: 0 };
  /** @type {Cell} */
  let pendingDir = { x: 1, y: 0 };
  let score = 0;
  let running = false;
  let paused = false;
  let dead = false;
  let acc = 0;
  let lastTs = 0;
  let raf = 0;
  let tickMs = 120;
  let bodyRgb = "40, 180, 90";
  let bodyEndRgb = "40, 80, 90";

  /** @type {HTMLImageElement|null} */
  let headImg = null;
  /** @type {HTMLImageElement|null} */
  let foodImg = null;

  let dpr = 1;
  let cell = 20;
  let cssSize = 400;

  function resetSnake() {
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    dir = { x: 1, y: 0 };
    pendingDir = { x: 1, y: 0 };
    score = 0;
    dead = false;
    placeFood();
    onScore(score);
  }

  function placeFood() {
    const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
    const empty = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
      }
    }
    food = empty[Math.floor(Math.random() * empty.length)] || { x: 0, y: 0 };
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
    cell = px / GRID;
    draw();
  }

  function setDirection(next) {
    // 禁止直接 180° 掉头（相对当前已生效方向）
    if (next.x === -dir.x && next.y === -dir.y) return;
    pendingDir = next;
  }

  function tick() {
    dir = pendingDir;
    const head = snake[0];
    const next = { x: head.x + dir.x, y: head.y + dir.y };

    if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
      endGame();
      return;
    }
    if (snake.some((s) => s.x === next.x && s.y === next.y)) {
      endGame();
      return;
    }

    snake.unshift(next);
    if (next.x === food.x && next.y === food.y) {
      score += 1;
      onScore(score);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function endGame() {
    dead = true;
    running = false;
    paused = false;
    onStatus("over");
    onGameOver(score);
    draw();
  }

  function drawGrid() {
    const size = canvas.width;
    ctx.fillStyle = "#102018";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(93, 255, 176, 0.06)";
    ctx.lineWidth = Math.max(1, dpr * 0.5);
    for (let i = 0; i <= GRID; i++) {
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

  function drawImageCell(img, x, y, rotate = false) {
    if (!img) return;
    const pad = cell * 0.08;
    const s = cell - pad * 2;
    const cx = x * cell + cell / 2;
    const cy = y * cell + cell / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (rotate) {
      const angle = Math.atan2(dir.y, dir.x);
      ctx.rotate(angle);
    }
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  function draw() {
    drawGrid();

    // 蛇身（颜色随皮肤）
    for (let i = snake.length - 1; i >= 1; i--) {
      const t = i / Math.max(snake.length - 1, 1);
      const color = lerpRgb(bodyRgb, bodyEndRgb, t);
      drawRoundedCell(snake[i].x, snake[i].y, color);
    }

    // 食物
    if (foodImg) {
      drawImageCell(foodImg, food.x, food.y, false);
    } else {
      drawRoundedCell(food.x, food.y, "#ff7a59", 0.18);
    }

    // 蛇头
    const head = snake[0];
    if (head) {
      if (headImg) {
        drawImageCell(headImg, head.x, head.y, true);
      } else {
        drawRoundedCell(head.x, head.y, "#5dffb0", 0.1);
      }
    }
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!running || paused || dead) {
      lastTs = ts;
      return;
    }
    if (!lastTs) lastTs = ts;
    acc += ts - lastTs;
    lastTs = ts;
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

  function setBodyTheme(startRgb, endRgb) {
    bodyRgb = startRgb || bodyRgb;
    bodyEndRgb = endRgb || bodyEndRgb;
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
    setBodyTheme,
    resize,
    getScore: () => score,
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
