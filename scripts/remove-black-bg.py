"""Remove connected black background only — keeps dark product details intact."""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def remove_connected_black_background(
    input_path: Path,
    output_path: Path,
    threshold: int = 22,
    edge_softness: int = 10,
) -> None:
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.uint8)
    h, w = data.shape[:2]
    rgb = data[:, :, :3].astype(np.int16)
    max_channel = np.max(rgb, axis=2)

    is_bg_seed = max_channel <= threshold
    connected = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_bg_seed[y, x]:
                connected[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg_seed[y, x] and not connected[y, x]:
                connected[y, x] = True
                queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and is_bg_seed[ny, nx] and not connected[ny, nx]:
                connected[ny, nx] = True
                queue.append((ny, nx))

    alpha = data[:, :, 3].astype(np.float32)
    alpha[connected] = 0.0

    near = connected & (max_channel > threshold - edge_softness) & (max_channel <= threshold + edge_softness)
    if np.any(near):
        fade = (max_channel[near].astype(np.float32) - (threshold - edge_softness)) / (2 * edge_softness)
        alpha[near] = np.clip(fade * 255.0, 0, 255)

    data[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    Image.fromarray(data, mode="RGBA").save(output_path, optimize=True)
    print(f"OK {output_path} ({output_path.stat().st_size} bytes)")


def main() -> None:
    assets = Path(__file__).resolve().parents[2].parents[0]
    # workspace assets path fallback
    src_map = {
        "home-v212.png": Path(
            r"C:\Users\Administrator\.cursor\projects\c-Users-Administrator-cursor\assets"
            r"\c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_e256499e2208e10804272a1d587d948a_images_____2_4-5b4a1db5-a7df-4d69-bd4b-e7514223b0aa.png"
        ),
        "home-vit.png": Path(
            r"C:\Users\Administrator\.cursor\projects\c-Users-Administrator-cursor\assets"
            r"\c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_e256499e2208e10804272a1d587d948a_images_IMG_0801___png-61d0a49e-d3d9-40fd-b66e-ee9e51e054c2.png"
        ),
    }
    out_dir = Path(__file__).resolve().parents[1] / "public" / "images" / "products"
    out_dir.mkdir(parents=True, exist_ok=True)

    for name, src in src_map.items():
        input_path = src if src.exists() else out_dir / name
        if not input_path.exists():
            print(f"Skip missing: {name}", file=sys.stderr)
            continue
        tmp = out_dir / name.replace(".png", ".tmp.png")
        remove_connected_black_background(input_path, tmp)
        tmp.replace(out_dir / name)


if __name__ == "__main__":
    main()
