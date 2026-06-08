"""Sync product cover + gallery from product image folders into public/images/products/."""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCES = [
    Path(r"F:\工作资料-\产品图片"),
    Path(r"F:\工作资料-\产品资料\产品图片"),
]
DEST = ROOT / "public" / "images" / "products"
OUT_TS = ROOT / "data" / "product-images.ts"
CATALOG_TS = ROOT / "data" / "product-catalog.ts"

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}

MODEL_RE = re.compile(
    r"(?i)(206M|15N|Solo\s*C|Unit48|dBcover|"
    r"DO\d{3}[A-Z]?|LA\d{3}[A-Z]?|LA18W|LW\d{1,3}[A-Z]?|"
    r"MI\d{2}|SOL\d{3}|K\d{1,4}[A-Z]?|RE\d{1,2}|"
    r"VIT|V4SA?|V\d{2,4}[A-Z]?)"
)

MODEL_ALIASES: dict[str, str] = {
    "LA18W": "LA118W",
    "UNITE48": "Unit48",
    "V221": "V221S",
}

COVER_MAX_WIDTH = 960
COVER_JPEG_QUALITY = 82


def natural_key(name: str) -> list:
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r"(\d+)", name)]


def load_catalog_models() -> list[str]:
    text = CATALOG_TS.read_text(encoding="utf-8")
    models = re.findall(r'model:\s*"([^"]+)"', text)
    if not models:
        raise RuntimeError("No models found in product-catalog.ts")
    return models


def normalize_model(raw: str) -> str:
    key = raw.upper().replace(" ", "")
    if key in MODEL_ALIASES:
        return MODEL_ALIASES[key]
    if key == "206M":
        return "206M"
    if raw.lower() == "unit48":
        return "Unit48"
    if raw.lower() == "dbcover":
        return "dBcover"
    if raw.lower() == "solo c":
        return "Solo C"
    return raw.upper() if raw.isupper() or re.match(r"^[A-Z0-9]+$", raw) else raw


def extract_model_from_text(text: str) -> str | None:
    m = MODEL_RE.search(text)
    if not m:
        return None
    return normalize_model(m.group(1))


def resolve_catalog_model(model: str, catalog: set[str]) -> str | None:
    if model in catalog:
        return model
    key = model.upper().replace(" ", "")
    aliased = MODEL_ALIASES.get(key)
    if aliased and aliased in catalog:
        return aliased
    return None


def model_for_file(path: Path, source: Path, catalog: set[str]) -> str | None:
    rel_parts = path.relative_to(source).parts[:-1]
    for part in reversed(rel_parts):
        part_key = part.replace(" ", "").upper()
        for model in catalog:
            if part_key == model.replace(" ", "").upper():
                return model
        model = extract_model_from_text(part)
        if model:
            return resolve_catalog_model(model, catalog)
    return None


def image_sources() -> list[Path]:
    if os.environ.get("PRODUCT_IMAGE_SOURCE"):
        return [Path(os.environ["PRODUCT_IMAGE_SOURCE"])]
    extra = os.environ.get("PRODUCT_IMAGE_SOURCES", "")
    if extra:
        return [Path(p.strip()) for p in extra.split(";") if p.strip()]
    return [p for p in DEFAULT_SOURCES if p.is_dir()]


def normalize_stem(path: Path) -> str:
    stem = path.stem.lower()
    for token in (
        "png",
        "jpg",
        "jpeg",
        "webp",
        "baidi",
        "白底",
        "透明",
        "heibg",
        "zip",
    ):
        stem = stem.replace(token, "")
    stem = re.sub(r"[^a-z0-9]+", "", stem)
    return stem


def file_md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def perceptual_hash(path: Path) -> str | None:
    try:
        img = Image.open(path).convert("RGB").resize((48, 48), Image.Resampling.LANCZOS)
        return hashlib.md5(img.tobytes()).hexdigest()
    except OSError:
        return None


def prefer_file(a: Path, b: Path) -> Path:
    """Keep the better variant when two files are considered duplicates."""
    if a.suffix.lower() in {".jpg", ".jpeg"} and b.suffix.lower() == ".png":
        return a
    if b.suffix.lower() in {".jpg", ".jpeg"} and a.suffix.lower() == ".png":
        return b
    score_a = score_cover(a) + (10 if "白" in a.name or "baidi" in a.name.lower() else 0)
    score_b = score_cover(b) + (10 if "白" in b.name or "baidi" in b.name.lower() else 0)
    if score_a != score_b:
        return a if score_a > score_b else b
    return a if a.stat().st_size >= b.stat().st_size else b


def dedupe_images(files: list[Path]) -> list[Path]:
    """Remove stem / byte / near-visual duplicates; prefer JPG and white-bg variants."""
    if not files:
        return []

    stem_buckets: dict[str, Path] = {}
    stem_order: list[str] = []
    for f in sorted(files, key=lambda p: natural_key(p.name)):
        key = normalize_stem(f)
        if not key:
            key = f.stem.lower()
        if key not in stem_buckets:
            stem_buckets[key] = f
            stem_order.append(key)
            continue
        stem_buckets[key] = prefer_file(stem_buckets[key], f)

    after_stem = [stem_buckets[k] for k in stem_order]

    after_bytes: list[Path] = []
    seen_md5: set[str] = set()
    for f in after_stem:
        digest = file_md5(f)
        if digest in seen_md5:
            continue
        seen_md5.add(digest)
        after_bytes.append(f)

    final: list[Path] = []
    seen_visual: set[str] = set()
    for f in after_bytes:
        visual = perceptual_hash(f)
        if visual and visual in seen_visual:
            continue
        if visual:
            seen_visual.add(visual)
        final.append(f)

    return final


def gallery_files(files: list[Path], cover_src: Path) -> list[Path]:
    """Gallery excludes cover source and anything identical / visually same as cover."""
    cover_md5 = file_md5(cover_src)
    cover_visual = perceptual_hash(cover_src)
    gallery: list[Path] = []
    seen_md5: set[str] = {cover_md5}
    seen_visual: set[str] = set()
    if cover_visual:
        seen_visual.add(cover_visual)

    for f in files:
        if f == cover_src:
            continue
        digest = file_md5(f)
        if digest in seen_md5:
            continue
        visual = perceptual_hash(f)
        if visual and visual in seen_visual:
            continue
        seen_md5.add(digest)
        if visual:
            seen_visual.add(visual)
        gallery.append(f)

    return gallery


def score_cover(path: Path) -> int:
    name = path.name.lower()
    stem = path.stem.lower()
    score = 0
    white_keys = ("白底", "baidi", "白", "white", "正面", "正.", "正-", "正 ", " 正")
    side_keys = ("侧", "背", "角度", "仰视", "俯视", "堆", "组合", "cemian", "angle")
    gray_keys = ("灰", "hui", "heise", " hei", "-hei", "hei.", "黑", "黑底", "heibg")
    for k in white_keys:
        if k in name or k in stem:
            score += 120
    if re.search(r"(?<![a-z])正(?![a-z])", name) or re.search(r"(?<![a-z])正(?![a-z])", stem):
        score += 120
    for k in side_keys:
        if k in name or k in stem:
            score -= 90
    for k in gray_keys:
        if k in name or k in stem:
            score -= 70
    if re.search(r"(?<![a-z])hei(?![a-z])", name) or re.search(r"(?<![a-z])hei(?![a-z])", stem):
        score -= 70
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        score += 8
    if path.suffix.lower() == ".png":
        score -= 12
    return score


def pick_cover(files: list[Path]) -> Path:
    if not files:
        raise ValueError("empty file list")
    ranked = sorted(files, key=lambda p: (-score_cover(p), natural_key(p.name)))
    return ranked[0]


def compress_cover(src: Path, dest: Path) -> None:
    img = Image.open(src)
    if img.mode in ("RGBA", "P", "LA"):
        if img.mode == "P":
            img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        alpha = img.split()[-1] if img.mode in ("RGBA", "LA") else None
        bg.paste(img.convert("RGBA"), mask=alpha)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    w, h = img.size
    if w > COVER_MAX_WIDTH:
        img = img.resize(
            (COVER_MAX_WIDTH, max(1, int(h * COVER_MAX_WIDTH / w))),
            Image.Resampling.LANCZOS,
        )
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "JPEG", quality=COVER_JPEG_QUALITY, optimize=True)


def copy_gallery_file(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == dest.suffix.lower():
        shutil.copy2(src, dest)
        return
    ext = src.suffix.lower()
    if ext == ".jpeg":
        ext = ".jpg"
    shutil.copy2(src, dest.with_suffix(ext))


def collect_by_model(catalog: set[str]) -> dict[str, list[Path]]:
    grouped: dict[str, list[Path]] = {m: [] for m in catalog}
    sources = image_sources()
    if not sources:
        raise FileNotFoundError("No product image source folders found")

    for source in sources:
        if not source.is_dir():
            print(f"WARN skip missing source: {source}")
            continue
        print(f"Scanning {source} …")
        for path in source.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in IMG_EXT:
                continue
            model = model_for_file(path, source, catalog)
            if not model:
                continue
            grouped[model].append(path)

    return {m: dedupe_images(files) for m, files in grouped.items() if files}


def sync_model(model: str, files: list[Path]) -> dict:
    model_dir = DEST / model.replace(" ", "-")
    gallery_dir = model_dir / "gallery"
    if model_dir.exists():
        shutil.rmtree(model_dir)
    gallery_dir.mkdir(parents=True)

    cover_src = pick_cover(files)
    cover_dest = model_dir / "cover.jpg"
    compress_cover(cover_src, cover_dest)

    items = gallery_files(files, cover_src)
    gallery_urls: list[str] = []
    for i, src in enumerate(items, start=1):
        ext = src.suffix.lower()
        if ext == ".jpeg":
            ext = ".jpg"
        dest = gallery_dir / f"{i:02d}{ext}"
        copy_gallery_file(src, dest)
        gallery_urls.append(f"/images/products/{model_dir.name}/gallery/{dest.name}")

    return {
        "cover": f"/images/products/{model_dir.name}/cover.jpg",
        "gallery": gallery_urls,
        "cover_source": cover_src.name,
        "gallery_count": len(gallery_urls),
        "removed_dupes": max(len(files) - len(items), 0),
    }


def write_ts(mapping: dict[str, dict]) -> None:
    lines = [
        "/** Auto-generated by scripts/sync-product-images.py — do not edit by hand. */",
        "",
        "export type ProductImageSet = {",
        "  cover: string;",
        "  gallery: string[];",
        "};",
        "",
        "export const productImageMap: Record<string, ProductImageSet> = {",
    ]
    for model in sorted(mapping, key=lambda m: natural_key(m)):
        item = mapping[model]
        gallery = json.dumps(item["gallery"], ensure_ascii=False)
        lines.append(f'  "{model}": {{')
        lines.append(f'    cover: "{item["cover"]}",')
        lines.append(f"    gallery: {gallery},")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    lines.append("export function getProductImages(model: string): ProductImageSet | undefined {")
    lines.append("  return productImageMap[model];")
    lines.append("}")
    lines.append("")
    OUT_TS.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    catalog_list = load_catalog_models()
    catalog = set(catalog_list)
    grouped = collect_by_model(catalog)

    mapping: dict[str, dict] = {}
    for model, files in sorted(grouped.items(), key=lambda x: natural_key(x[0])):
        result = sync_model(model, files)
        mapping[model] = result
        print(
            f"{model}: cover={result['cover_source']} "
            f"({result['gallery_count']} gallery, -{result['removed_dupes']} dupes)"
        )

    write_ts(mapping)

    missing = [m for m in catalog_list if m not in mapping]
    print(f"\nSynced {len(mapping)}/{len(catalog_list)} models -> {DEST}")
    print(f"Wrote {OUT_TS}")
    if missing:
        print(f"Missing images ({len(missing)}): {', '.join(missing)}")


if __name__ == "__main__":
    main()
