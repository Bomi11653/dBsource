from pathlib import Path

APIS = [
    ("product", "product"),
    ("case", "case"),
    ("download", "download"),
    ("scene", "scene"),
    ("qr-code", "qr-code"),
    ("about-section", "about-section"),
]

ROOT = Path(__file__).resolve().parent.parent / "src" / "api"

for folder, uid in APIS:
    for kind, factory in [
        ("routes", "createCoreRouter"),
        ("controllers", "createCoreController"),
        ("services", "createCoreService"),
    ]:
        path = ROOT / folder / kind / f"{folder}.ts"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            f"import {{ factories }} from '@strapi/strapi';\n\n"
            f"export default factories.{factory}('api::{uid}.{uid}');\n",
            encoding="utf-8",
        )
        print(path)
