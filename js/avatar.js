/**
 * 头像工具：加载、压缩；默认图见 skins.js
 */

import { createDefaultAvatar } from "./skins.js";

export { createDefaultAvatar };

const MAX_EDGE = 256;

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
