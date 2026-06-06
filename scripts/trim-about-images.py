"""Trim uniform borders from about page screenshots."""
from pathlib import Path
from PIL import Image

ABOUT_DIR = Path(__file__).resolve().parent.parent / "public" / "about"

FILES = [
    "dbcover-home.png",
    "dbcover-eq.png",
    "dbcover-spl.png",
    "focus-app.png",
    "unit48-hardware.png",
    "unit48-layout.png",
    "unit48-eq.png",
    "anechoic-chamber.png",
]


def row_uniformity(im, y, threshold=18):
    w = im.size[0]
    pixels = [im.getpixel((x, y))[:3] for x in range(w)]
    if not pixels:
        return True
    avg = tuple(sum(c[i] for c in pixels) // len(pixels) for i in range(3))
    return all(
        abs(p[0] - avg[0]) + abs(p[1] - avg[1]) + abs(p[2] - avg[2]) < threshold
        for p in pixels
    )


def col_uniformity(im, x, threshold=18):
    h = im.size[1]
    pixels = [im.getpixel((x, y))[:3] for y in range(h)]
    if not pixels:
        return True
    avg = tuple(sum(c[i] for c in pixels) // len(pixels) for i in range(3))
    return all(
        abs(p[0] - avg[0]) + abs(p[1] - avg[1]) + abs(p[2] - avg[2]) < threshold
        for p in pixels
    )


def is_border_pixel(r, g, b, a=255):
    if a < 10:
        return True
    if max(r, g, b) < 28:
        return True
    if min(r, g, b) > 245:
        return True
    return False


def content_bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    """Bounding box of bright UI panels and dark UI chrome (ignores outer photo bg)."""
    px = im.convert("RGB").load()
    w, h = im.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            bright_ui = r > 175 and g > 175 and b > 175
            dark_ui = max(r, g, b) < 72
            if bright_ui or dark_ui:
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return None
    pad = 2
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(w, max_x + pad + 1),
        min(h, max_y + pad + 1),
    )


def trim_image(path: Path, mode: str = "border") -> None:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    pixels = im.load()

    def row_is_border(y):
        uniform = row_uniformity(im, y, threshold=22)
        if uniform:
            return True
        return all(is_border_pixel(*pixels[x, y][:4]) for x in range(w))

    def col_is_border(x):
        uniform = col_uniformity(im, x, threshold=22)
        if uniform:
            return True
        return all(is_border_pixel(*pixels[x, y][:4]) for y in range(h))

    top = 0
    while top < h and row_is_border(top):
        top += 1
    bottom = h - 1
    while bottom > top and row_is_border(bottom):
        bottom -= 1
    left = 0
    while left < w and col_is_border(left):
        left += 1
    right = w - 1
    while right > left and col_is_border(right):
        right -= 1

    if mode == "content":
        bbox = content_bbox(im)
        if not bbox:
            print(f"skip {path.name}: no content bounds")
            return
        cropped = im.crop(bbox)
    else:
        if right <= left or bottom <= top:
            print(f"skip {path.name}: no trim bounds")
            return
        cropped = im.crop((left, top, right + 1, bottom + 1))
    bg = Image.new("RGB", cropped.size, (9, 9, 11))
    bg.paste(cropped, mask=cropped.split()[3] if cropped.mode == "RGBA" else None)
    out = path.with_name(path.stem + "-trim.png")
    bg.save(out, optimize=True)
    print(f"{path.name} {w}x{h} -> {out.name} {bg.size[0]}x{bg.size[1]}")


CONTENT_MODE = {"dbcover-eq.png", "dbcover-spl.png"}

if __name__ == "__main__":
    for name in FILES:
        p = ABOUT_DIR / name
        if p.exists():
            trim_image(p, mode="content" if name in CONTENT_MODE else "border")
