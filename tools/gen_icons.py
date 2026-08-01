#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
極光特調 Aurora Drinks — PWA 圖示產生器

用途：一次產生 manifest 需要的所有尺寸圖示（含 maskable 與 apple-touch-icon）。
用法：
    pip install pillow
    python3 tools/gen_icons.py

若日後換 logo，把品牌色或繪圖邏輯改一改再跑一次即可。
"""

import math
import os

from PIL import Image, ImageDraw

# ----------------------------------------------------------------
# 設定
# ----------------------------------------------------------------
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")

BG_DARK      = (10, 10, 10)
BG_DARK_SOFT = (26, 26, 26)
GOLD         = (217, 143, 34)
GOLD_LIGHT   = (242, 222, 163)
GOLD_DEEP    = (190, 112, 26)

SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]

SS = 4  # 超取樣倍率（先畫大再縮小 → 邊緣平滑）


# ----------------------------------------------------------------
# 繪圖
# ----------------------------------------------------------------
def radial_background(size, inset_ratio=0.0):
    """深色底 + 中央微弱金色光暈。"""
    img = Image.new("RGB", (size, size), BG_DARK)
    d = ImageDraw.Draw(img)

    steps = 60
    max_r = size * 0.72
    for i in range(steps, 0, -1):
        t = i / steps
        r = max_r * t
        # 由中心的 BG_DARK_SOFT 過渡到邊緣的 BG_DARK
        blend = (1 - t) ** 1.8
        color = tuple(
            int(BG_DARK[c] + (BG_DARK_SOFT[c] - BG_DARK[c]) * blend)
            for c in range(3)
        )
        d.ellipse(
            [size / 2 - r, size * 0.42 - r, size / 2 + r, size * 0.42 + r],
            fill=color,
        )
    return img


def draw_glass(d, size, cx, cy, scale):
    """繪製極光特調的杯型標誌（馬丁尼杯 + 皇冠光點）。"""
    w = size * 0.30 * scale       # 杯口半寬
    h = size * 0.26 * scale       # 杯身高
    stem = size * 0.17 * scale    # 杯腳長
    base_w = size * 0.16 * scale  # 底座半寬
    lw = max(2, int(size * 0.028 * scale))

    top_y = cy - h * 0.62
    tip_y = top_y + h

    # 杯身（倒三角）填色
    d.polygon(
        [(cx - w, top_y), (cx + w, top_y), (cx, tip_y)],
        fill=(GOLD[0], GOLD[1], GOLD[2]),
    )

    # 杯身輪廓
    d.line(
        [(cx - w, top_y), (cx + w, top_y), (cx, tip_y), (cx - w, top_y)],
        fill=GOLD_LIGHT, width=lw, joint="curve",
    )

    # 杯腳
    d.line([(cx, tip_y), (cx, tip_y + stem)], fill=GOLD_LIGHT, width=lw)

    # 底座
    d.line(
        [(cx - base_w, tip_y + stem), (cx + base_w, tip_y + stem)],
        fill=GOLD_LIGHT, width=lw,
    )

    # 杯中液面亮線
    d.line(
        [(cx - w * 0.78, top_y + h * 0.18), (cx + w * 0.78, top_y + h * 0.18)],
        fill=(255, 250, 235), width=max(1, lw // 2),
    )

    # 皇冠光點（三顆星）
    star_r = size * 0.028 * scale
    for i, (dx, dy, s) in enumerate([(-0.62, -0.30, 0.8), (0.0, -0.42, 1.0), (0.62, -0.30, 0.8)]):
        sx = cx + w * dx
        sy = top_y + h * dy
        r = star_r * s
        d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=GOLD_LIGHT)


def build_icon(size, maskable=False):
    big = size * SS
    img = radial_background(big).convert("RGBA")
    d = ImageDraw.Draw(img)

    # maskable 需保留 20% 安全邊距（內容縮到中央 60% 區域）
    scale = 0.62 if maskable else 0.92

    # 金色外環（僅一般圖示）
    if not maskable:
        pad = big * 0.055
        d.ellipse(
            [pad, pad, big - pad, big - pad],
            outline=(GOLD_DEEP[0], GOLD_DEEP[1], GOLD_DEEP[2], 140),
            width=max(2, int(big * 0.012)),
        )

    draw_glass(d, big, big / 2, big * 0.50, scale)

    return img.convert("RGB").resize((size, size), Image.LANCZOS)


def build_favicon_svg():
    """輸出向量 favicon，任何尺寸都銳利。"""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f2dea3"/>
      <stop offset="55%" stop-color="#d98f22"/>
      <stop offset="100%" stop-color="#be701a"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <circle cx="32" cy="32" r="28.5" fill="none" stroke="#be701a" stroke-opacity=".55" stroke-width="1.4"/>
  <path d="M14 22h36L32 44z" fill="url(#gold)" stroke="#f2dea3" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M32 44v9" stroke="#f2dea3" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M23 53h18" stroke="#f2dea3" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M18.5 25.5h27" stroke="#fffaeb" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>
  <circle cx="20" cy="16" r="1.8" fill="#f2dea3"/>
  <circle cx="32" cy="13" r="2.3" fill="#f2dea3"/>
  <circle cx="44" cy="16" r="1.8" fill="#f2dea3"/>
</svg>
"""


# ----------------------------------------------------------------
# 主流程
# ----------------------------------------------------------------
def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for size in SIZES:
        path = os.path.join(OUT_DIR, f"icon-{size}.png")
        build_icon(size).save(path, "PNG", optimize=True)
        print(f"  ✓ icon-{size}.png")

    for size in MASKABLE_SIZES:
        path = os.path.join(OUT_DIR, f"maskable-{size}.png")
        build_icon(size, maskable=True).save(path, "PNG", optimize=True)
        print(f"  ✓ maskable-{size}.png")

    # iOS 主畫面圖示（不可透明、建議 180x180）
    build_icon(180).save(os.path.join(OUT_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
    print("  ✓ apple-touch-icon.png")

    # 傳統 favicon.ico（多尺寸）
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    build_icon(64).save(os.path.join(OUT_DIR, "favicon.ico"), sizes=ico_sizes)
    print("  ✓ favicon.ico")

    with open(os.path.join(OUT_DIR, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(build_favicon_svg())
    print("  ✓ favicon.svg")

    print(f"\n完成！所有圖示已輸出至：{OUT_DIR}")


if __name__ == "__main__":
    main()
