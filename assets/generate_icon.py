"""Generate multi-resolution PrismMBTI application icon (.ico and .png)."""

import math
from pathlib import Path
from PIL import Image, ImageDraw


def lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def generate_prism_icon(out_dir: Path) -> tuple[Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    # Render at 1024x1024 (4x supersampling) for crisp anti-aliasing
    size = 1024
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Build rounded-square mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    margin = 64
    radius = 224
    mask_draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=255,
    )

    # Diagonal gradient from deep teal (#0F766E) -> teal (#14B8A6) -> indigo (#4F46E5)
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grad_px = grad.load()
    c_start = (13, 108, 102)
    c_mid = (20, 184, 166)
    c_end = (79, 70, 229)

    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            if t < 0.62:
                lt = t / 0.62
                r = lerp(c_start[0], c_mid[0], lt)
                g = lerp(c_start[1], c_mid[1], lt)
                b = lerp(c_start[2], c_mid[2], lt)
            else:
                lt = (t - 0.62) / 0.38
                r = lerp(c_mid[0], c_end[0], lt)
                g = lerp(c_mid[1], c_end[1], lt)
                b = lerp(c_mid[2], c_end[2], lt)
            grad_px[x, y] = (r, g, b, 255)

    img.paste(grad, (0, 0), mask)

    # Translucent facets overlay (properly alpha-composited)
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ov = ImageDraw.Draw(overlay)

    # Subtle inner border inside the rounded square
    ov.rounded_rectangle(
        [margin + 14, margin + 14, size - margin - 14, size - margin - 14],
        radius=radius - 14,
        outline=(255, 255, 255, 55),
        width=10,
    )

    cx, cy = size // 2, size // 2
    hex_r = 290
    pts = []
    # Vertices: 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
    for i in range(6):
        angle = math.radians(-90 + i * 60)
        pts.append((cx + hex_r * math.cos(angle), cy + hex_r * math.sin(angle)))

    # 3 distinct isometric cube/prism faces using proper alpha blending
    top_face = [pts[5], pts[0], pts[1], (cx, cy)]
    left_face = [pts[5], (cx, cy), pts[3], pts[4]]
    right_face = [(cx, cy), pts[1], pts[2], pts[3]]

    ov.polygon(top_face, fill=(255, 255, 255, 68))
    ov.polygon(left_face, fill=(255, 255, 255, 28))
    ov.polygon(right_face, fill=(15, 23, 42, 48))

    img = Image.alpha_composite(img, overlay)

    # Crisp linework layer (properly alpha-composited with rounded vertex caps)
    lines = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lines)

    line_w = 34
    inner_w = 26
    white_hi = (255, 255, 255, 245)
    white_soft = (255, 255, 255, 215)

    # Hexagon perimeter segments + rounded caps at vertices so corners never spike
    for i in range(6):
        p1 = pts[i]
        p2 = pts[(i + 1) % 6]
        ld.line([p1, p2], fill=white_hi, width=line_w)
        r_cap = line_w / 2
        ld.ellipse([p1[0] - r_cap, p1[1] - r_cap, p1[0] + r_cap, p1[1] + r_cap], fill=white_hi)

    # Internal prism struts matching the SVG logo: center to top, top-right, top-left, bottom
    for idx in (0, 1, 5, 3):
        ld.line([(cx, cy), pts[idx]], fill=white_soft, width=inner_w)

    # Center glowing prism core dot
    node_r = 32
    ld.ellipse([cx - node_r, cy - node_r, cx + node_r, cy + node_r], fill=(255, 255, 255, 255))

    img = Image.alpha_composite(img, lines)

    # Save 256x256 PNG and multi-size ICO
    png_img = img.resize((256, 256), Image.Resampling.LANCZOS)
    png_path = out_dir / "prism_mbti.png"
    ico_path = out_dir / "prism_mbti.ico"

    png_img.save(png_path, format="PNG")
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format="ICO", sizes=ico_sizes)

    return ico_path, png_path


if __name__ == "__main__":
    base = Path(__file__).resolve().parent
    ico, png = generate_prism_icon(base)
    print(f"Generated ICO: {ico}")
    print(f"Generated PNG: {png}")
