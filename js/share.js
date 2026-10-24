/**
 * 生成成绩分享图
 */

/**
 * @param {object} opts
 * @param {number} opts.score
 * @param {number} opts.highScore
 * @param {string} opts.difficultyName
 * @param {string} opts.skinName
 * @param {string} [opts.modeName]
 * @param {string} [opts.mapName]
 * @param {string} [opts.headDataUrl]
 */
export async function createScoreCard(opts) {
  const W = 720;
  const H = 960;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 背景
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0c1612");
  g.addColorStop(0.5, "#13241c");
  g.addColorStop(1, "#1a3228");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 装饰光晕
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 20, W * 0.5, H * 0.22, 280);
  glow.addColorStop(0, "rgba(93, 255, 176, 0.22)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#5dffb0";
  ctx.font = "600 28px Fredoka, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STICKER SNAKE", W / 2, 88);

  ctx.fillStyle = "#e8f5ee";
  ctx.font = "700 52px Fredoka, 'Noto Sans SC', sans-serif";
  ctx.fillText("贴图贪吃蛇", W / 2, 150);

  // 头像
  if (opts.headDataUrl) {
    try {
      const img = await loadImg(opts.headDataUrl);
      const size = 160;
      const x = (W - size) / 2;
      const y = 190;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
      ctx.strokeStyle = "#5dffb0";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(W / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      /* ignore */
    }
  }

  ctx.fillStyle = "#8aab9a";
  ctx.font = "400 26px 'Noto Sans SC', sans-serif";
  {
    const bits = [opts.modeName, opts.mapName].filter(Boolean);
    ctx.fillText(bits.length ? `${bits.join(" · ")} · 本局得分` : "本局得分", W / 2, 420);
  }

  ctx.fillStyle = "#5dffb0";
  ctx.font = "700 120px Fredoka, sans-serif";
  ctx.fillText(String(opts.score ?? 0), W / 2, 540);

  // 信息条
  roundRect(ctx, 80, 590, W - 160, 140, 24);
  ctx.fillStyle = "rgba(26, 50, 40, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 220, 160, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#8aab9a";
  ctx.font = "400 22px 'Noto Sans SC', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("历史最高", 120, 645);
  ctx.fillText("难度", 120, 695);
  ctx.fillText("皮肤", 380, 695);

  ctx.fillStyle = "#e8f5ee";
  ctx.font = "700 36px Fredoka, sans-serif";
  ctx.fillText(String(opts.highScore ?? 0), 260, 650);
  ctx.font = "600 28px 'Noto Sans SC', sans-serif";
  ctx.fillText(opts.difficultyName || "中", 200, 700);
  ctx.fillText(opts.skinName || "经典", 460, 700);

  ctx.textAlign = "center";
  ctx.fillStyle = "#8aab9a";
  ctx.font = "400 22px 'Noto Sans SC', sans-serif";
  ctx.fillText("图片仅存本机 · 扫码也能玩", W / 2, 800);
  ctx.fillStyle = "#5dffb0";
  ctx.font = "600 24px Fredoka, sans-serif";
  ctx.fillText("zhuo1wang.github.io/face-snake", W / 2, 850);

  return canvas;
}

export async function downloadScoreCard(canvas, filename = "face-snake-score.png") {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 是否支持系统分享图片文件 */
export function canShareScoreImage() {
  try {
    if (!navigator.share) return false;
    const probe = new File([new Blob(["x"], { type: "image/png" })], "t.png", {
      type: "image/png",
    });
    if (typeof navigator.canShare === "function") {
      return navigator.canShare({ files: [probe] });
    }
    // 部分浏览器有 share 但没有 canShare，仍尝试分享
    return true;
  } catch {
    return false;
  }
}

/** 仅系统分享；不支持时抛错，由调用方提示改用「保存图片」 */
export async function shareScoreCard(canvas, title = "贴图贪吃蛇成绩") {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], "face-snake-score.png", { type: "image/png" });
  if (!navigator.share) {
    throw new Error("unsupported");
  }
  if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
    throw new Error("unsupported");
  }
  await navigator.share({ files: [file], title, text: title });
  return "shared";
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("导出失败"))), "image/png");
  });
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
