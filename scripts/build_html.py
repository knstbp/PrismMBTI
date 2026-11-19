"""Build a universal self-contained single-file HTML (PC + Mobile) of PrismMBTI."""

from __future__ import annotations

import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT / "dist"
OUTPUT_FILE = DIST_DIR / "PrismMBTI.html"


def build_standalone_html(output_path: Path = OUTPUT_FILE) -> Path:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")

    # Inline hero-prism.jpg as base64 data URI
    hero_path = ROOT / "assets" / "illustrations" / "hero-prism.jpg"
    hero_b64 = base64.b64encode(hero_path.read_bytes()).decode("ascii")
    hero_data_uri = f"data:image/jpeg;base64,{hero_b64}"
    html = html.replace("assets/illustrations/hero-prism.jpg", hero_data_uri)

    # Inline stylesheet (replace <link rel="stylesheet" href="styles.css...">)
    safe_css = re.sub(r"</style", "<\\/style", css, flags=re.IGNORECASE)
    html, link_count = re.subn(
        r'<link\s+rel="stylesheet"\s+href="styles\.css[^"]*"\s*/?>',
        lambda _m: f"<style>\n{safe_css}\n  </style>",
        html,
    )
    if link_count != 1:
        raise RuntimeError(f"Expected 1 styles.css link in index.html, found {link_count}")

    # Find and inline every <script ... src="..."> in exact document order
    script_pattern = re.compile(r'<script(?:\s+defer)?\s+src="([^"]+)"></script>')
    script_srcs = script_pattern.findall(html)
    if not script_srcs:
        raise RuntimeError("No <script src=...> tags found in index.html")

    inlined_blocks: list[str] = []
    for raw_src in script_srcs:
        rel_path = raw_src.split("?", 1)[0]
        js_path = ROOT / rel_path
        if not js_path.exists():
            raise FileNotFoundError(f"Missing JS asset referenced by index.html: {js_path}")
        js_code = js_path.read_text(encoding="utf-8")
        safe_js = re.sub(r"</script", "<\\/script", js_code, flags=re.IGNORECASE)
        inlined_blocks.append(f"<!-- {rel_path} -->\n<script>\n{safe_js}\n</script>")

    html = script_pattern.sub("", html)
    bundle_text = "\n  ".join(inlined_blocks)
    if "</body>" not in html:
        raise RuntimeError("Missing </body> tag in index.html")
    html = html.replace("</body>", f"  {bundle_text}\n</body>", 1)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    return output_path


if __name__ == "__main__":
    out = build_standalone_html()
    size_kb = out.stat().st_size / 1024
    print(f"Built universal standalone HTML: {out} ({size_kb:.1f} KB)")
