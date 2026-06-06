# -*- coding: utf-8 -*-
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

PDFS = [
    Path(r"d:\1\xwechat_files\wxid_6f7gm6kb5vnk22_5899\msg\file\2026-05\（已压缩）dBsource 2026 C端(1).pdf"),
    Path(r"c:\Users\Administrator\Desktop\dbsource\图片\dBsource 2026 B端.pdf"),
]

MODEL_PATTERN = re.compile(
    r"(V\d+[A-Z]*|VIT|LA\d*|LW\d*|MI\d*|DO\d*|SOL\d*|RE\d*|P\d+|206M|15N|unit48|Unit48|V221S?|V212|V415A|V225A)",
    re.I,
)

out = {}
for pdf in PDFS:
    if not pdf.exists():
        continue
    reader = PdfReader(str(pdf))
    full = []
    for page in reader.pages:
        t = page.extract_text() or ""
        full.append(t)
    text = "\n".join(full)
    out[pdf.name] = {"chars": len(text), "text": text[:50000]}

out_path = Path(__file__).parent / "pdf-extract.json"
out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("written", out_path, "files", list(out.keys()))
