/**
 * 圆形裁剪：拖动平移图片 + 滚轮/滑块/双指缩放
 */

const MAX_EDGE = 256;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLInputElement} [zoomSlider]
 */
export function createCropEditor(canvas, zoomSlider) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width; // 假定正方形
  const radius = size / 2 - 4;

  /** @type {HTMLImageElement|null} */
  let img = null;
  let scale = 1;
  let minScale = 1;
  let maxScale = 4;
  let ox = 0; // 图片中心相对画布中心的偏移（屏幕像素）
  let oy = 0;

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinchDist = 0;
  let usingDefault = false;

  function naturalSize() {
    if (!img) return { w: 1, h: 1 };
    return { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height };
  }

  /** 让图片至少盖住圆形裁剪区 */
  function fitCover() {
    if (!img) return;
    const { w, h } = naturalSize();
    const diameter = radius * 2;
    minScale = Math.max(diameter / w, diameter / h);
    maxScale = Math.max(minScale * 6, minScale + 0.01);
    scale = minScale;
    ox = 0;
    oy = 0;
    syncSlider();
    clampOffset();
  }

  function clampOffset() {
    if (!img) return;
    const { w, h } = naturalSize();
    const dw = (w * scale) / 2;
    const dh = (h * scale) / 2;
    // 圆形必须完全落在图片内
    const maxOx = Math.max(0, dw - radius);
    const maxOy = Math.max(0, dh - radius);
    ox = Math.min(maxOx, Math.max(-maxOx, ox));
    oy = Math.min(maxOy, Math.max(-maxOy, oy));
  }

  function syncSlider() {
    if (!zoomSlider || !img) return;
    const t = (scale - minScale) / (maxScale - minScale || 1);
    zoomSlider.min = "0";
    zoomSlider.max = "100";
    zoomSlider.value = String(Math.round(t * 100));
    zoomSlider.disabled = false;
  }

  function setScaleFromSlider(percent) {
    if (!img) return;
    const t = Number(percent) / 100;
    scale = minScale + t * (maxScale - minScale);
    clampOffset();
    draw();
  }

  function draw() {
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    // 背景
    ctx.fillStyle = "#0a1210";
    ctx.fillRect(0, 0, size, size);

    if (!img) {
      ctx.fillStyle = "#8aab9a";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("请选择图片", cx, cy);
      return;
    }

    const { w, h } = naturalSize();
    const dw = w * scale;
    const dh = h * scale;
    const dx = cx + ox - dw / 2;
    const dy = cy + oy - dh / 2;

    // 底层完整图（略暗）
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    // 圆形内清晰图
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    // 遮罩环（圆外更深）
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();

    // 圆边框
    ctx.strokeStyle = "#5dffb0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * @param {HTMLImageElement} image
   * @param {{ asDefault?: boolean }} [opts]
   */
  function setImage(image, opts = {}) {
    img = image;
    usingDefault = !!opts.asDefault;
    fitCover();
    draw();
  }

  function clear() {
    img = null;
    usingDefault = false;
    if (zoomSlider) {
      zoomSlider.value = "0";
      zoomSlider.disabled = true;
    }
    draw();
  }

  function isUsingDefault() {
    return usingDefault;
  }

  function hasImage() {
    return !!img;
  }

  /** 导出圆形 PNG DataURL */
  function exportDataUrl() {
    if (!img) return null;
    if (usingDefault) return null; // 调用方用默认图

    const { w, h } = naturalSize();
    const out = document.createElement("canvas");
    out.width = MAX_EDGE;
    out.height = MAX_EDGE;
    const octx = out.getContext("2d");

    // 画布坐标 → 图片像素
    // 圆中心对应图片坐标：
    const cx = size / 2;
    const cy = size / 2;
    const dw = w * scale;
    const dh = h * scale;
    const dx = cx + ox - dw / 2;
    const dy = cy + oy - dh / 2;

    // 裁剪圆在源图上的外接正方形
    const srcLeft = (cx - radius - dx) / scale;
    const srcTop = (cy - radius - dy) / scale;
    const srcSide = (radius * 2) / scale;

    octx.beginPath();
    octx.arc(MAX_EDGE / 2, MAX_EDGE / 2, MAX_EDGE / 2, 0, Math.PI * 2);
    octx.closePath();
    octx.clip();
    octx.drawImage(img, srcLeft, srcTop, srcSide, srcSide, 0, 0, MAX_EDGE, MAX_EDGE);
    return out.toDataURL("image/png");
  }

  function onPointerDown(e) {
    if (!img || usingDefault) return;
    if (e.pointerType === "touch" && e.target.setPointerCapture) {
      // multi-touch handled separately
    }
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  }

  function canvasScale() {
    const rect = canvas.getBoundingClientRect();
    return {
      sx: canvas.width / (rect.width || canvas.width),
      sy: canvas.height / (rect.height || canvas.height),
    };
  }

  function onPointerMove(e) {
    if (!dragging || !img) return;
    const { sx, sy } = canvasScale();
    const dx = (e.clientX - lastX) * sx;
    const dy = (e.clientY - lastY) * sy;
    lastX = e.clientX;
    lastY = e.clientY;
    ox += dx;
    oy += dy;
    clampOffset();
    draw();
  }

  function onPointerUp(e) {
    dragging = false;
    try {
      canvas.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onWheel(e) {
    if (!img || usingDefault) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    scale = Math.min(maxScale, Math.max(minScale, scale * factor));
    clampOffset();
    syncSlider();
    draw();
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      dragging = false;
      const [a, b] = e.touches;
      pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
  }

  function onTouchMove(e) {
    if (!img || usingDefault) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinchDist > 0) {
        const factor = dist / pinchDist;
        scale = Math.min(maxScale, Math.max(minScale, scale * factor));
        clampOffset();
        syncSlider();
        draw();
      }
      pinchDist = dist;
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) pinchDist = 0;
  }

  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);

  if (zoomSlider) {
    zoomSlider.addEventListener("input", () => setScaleFromSlider(zoomSlider.value));
    zoomSlider.disabled = true;
  }

  draw();

  return {
    setImage,
    clear,
    draw,
    exportDataUrl,
    isUsingDefault,
    hasImage,
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    },
  };
}

export async function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageEl(url);
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}
