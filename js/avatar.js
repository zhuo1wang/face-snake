/**
 * 上传图片 → 居中裁方 → 裁圆 → 压缩为 DataURL
 */

const MAX_EDGE = 256;

/** 生成默认蛇头 / 食物（矢量绘制，无需外部 png） */
export function createDefaultAvatar(kind) {
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

  if (kind === "head") {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#5dffb0");
    g.addColorStop(1, "#1f9e63");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // 眼睛
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

    // 微笑
    ctx.strokeStyle = "#062016";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.52, size * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    const g = ctx.createRadialGradient(size * 0.4, size * 0.35, 8, size / 2, size / 2, size / 2);
    g.addColorStop(0, "#ffb199");
    g.addColorStop(1, "#ff7a59");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // 高光
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(size * 0.38, size * 0.34, size * 0.16, size * 0.1, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

/**
 * 将任意图片居中裁成正方形再裁圆，导出压缩 DataURL
 */
export async function processAvatarFile(file) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const out = Math.min(MAX_EDGE, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
  bitmap.close?.();

  // 优先 JPEG 更小；圆形透明边用 PNG 更合适，这里圆形背景已 clip，外圈透明需 PNG
  // localStorage 限额：PNG 圆形 + 压缩边长
  return canvas.toDataURL("image/png");
}

/** 在预览 canvas 上绘制圆形图 */
export function drawPreview(canvas, img) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();
}

/** 尝试 JPEG 再压缩（若仍过大）——当前圆形用 PNG，可选二次缩放 */
export function shrinkDataUrlIfNeeded(dataUrl, maxChars = 180_000) {
  if (!dataUrl || dataUrl.length <= maxChars) return Promise.resolve(dataUrl);

  return loadImage(dataUrl).then((img) => {
    const canvas = document.createElement("canvas");
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);
    // 无透明需求时可用 jpeg；保持圆形透明用 png
    return canvas.toDataURL("image/png");
  });
}
