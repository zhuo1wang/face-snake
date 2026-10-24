"""用 rembg 抠透明贴纸，并盖掉角上水印后导出 WebP 动图。"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
FRAMES_DIR = ROOT / "assets" / "_frames"
OUT_WEBP = ROOT / "assets" / "mascot-anim.webp"
OUT_POSTER = ROOT / "assets" / "mascot.png"


def cover_watermark(im: Image.Image) -> Image.Image:
    """用邻近纸色盖住「豆包 AI 生成」水印区域。"""
    rgb = np.array(im.convert("RGB"))
    h, w = rgb.shape[:2]
    # 取右下外侧纸色（避开文字）
    bg = rgb[h - 120 : h - 90, w - 320 : w - 280].mean(axis=(0, 1))
    rgb[h - 78 : h, w - 270 : w] = bg
    rgb[0:42, 0:210] = rgb[50:60, 50:60].mean(axis=(0, 1))
    return Image.fromarray(rgb.astype(np.uint8), "RGB")


def trim_rgba(im: Image.Image, pad: int = 4) -> Image.Image:
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > 12)
    if len(xs) == 0:
        return im
    y1, y2 = max(0, ys.min() - pad), min(im.height, ys.max() + 1 + pad)
    x1, x2 = max(0, xs.min() - pad), min(im.width, xs.max() + 1 + pad)
    return im.crop((x1, y1, x2, y2))


def main() -> None:
    paths = sorted(FRAMES_DIR.glob("f_*.png"))
    if not paths:
        raise SystemExit(f"no frames in {FRAMES_DIR}")

    session = new_session("u2net")
    print(f"frames={len(paths)}")

    # 抽稀：约 20 帧
    step = max(1, len(paths) // 20)
    picked = paths[::step]
    print(f"process={len(picked)} step={step}")

    out_frames: list[Image.Image] = []
    for i, p in enumerate(picked):
        src = cover_watermark(Image.open(p).convert("RGB"))
        # 略缩小加速
        src = src.resize((512, 512), Image.Resampling.BILINEAR)
        buf = BytesIO()
        src.save(buf, format="PNG")
        cut = remove(buf.getvalue(), session=session)
        im = Image.open(BytesIO(cut)).convert("RGBA")
        im = trim_rgba(im, pad=6)
        out_frames.append(im)
        print(f"  [{i+1}/{len(picked)}] {p.name} -> {im.size}")

    # 统一画布尺寸（取最大包络，居中粘贴）
    max_w = max(f.width for f in out_frames)
    max_h = max(f.height for f in out_frames)
    # 再限制到 320
    scale = min(1.0, 320 / max(max_w, max_h))
    tw, th = max(1, int(max_w * scale)), max(1, int(max_h * scale))

    normalized: list[Image.Image] = []
    for f in out_frames:
        canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
        x = (max_w - f.width) // 2
        y = (max_h - f.height) // 2
        canvas.paste(f, (x, y), f)
        if scale < 1:
            canvas = canvas.resize((tw, th), Image.Resampling.LANCZOS)
        normalized.append(canvas)

    print(f"export size={normalized[0].size} frames={len(normalized)}")
    normalized[len(normalized) // 2].save(OUT_POSTER, optimize=True)

    duration = int(round(1000 / 12 * step))
    normalized[0].save(
        OUT_WEBP,
        save_all=True,
        append_images=normalized[1:],
        duration=duration,
        loop=0,
        disposal=2,
        optimize=True,
        method=4,
        quality=80,
    )
    print("wrote", OUT_WEBP, OUT_WEBP.stat().st_size)
    print("wrote", OUT_POSTER, OUT_POSTER.stat().st_size)


if __name__ == "__main__":
    main()
