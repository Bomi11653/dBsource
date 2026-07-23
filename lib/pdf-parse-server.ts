import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export type PDFParseInstance = {
  getText: () => Promise<{ text: string }>;
  destroy: () => Promise<void>;
};

type PDFParseClass = new (params: { data: Buffer }) => PDFParseInstance;

type PdfParseLoader = {
  extractPdfText: (data: Buffer | Uint8Array) => Promise<string>;
  getPDFParseClass: () => PDFParseClass;
  isWorkerConfigured: () => boolean;
};

let cachedLoader: PdfParseLoader | null = null;

function resolveLoaderAbs(): string {
  const candidates = [
    path.join(process.cwd(), "lib", "pdf-parse-loader.cjs"),
    path.join(process.cwd(), "..", "lib", "pdf-parse-loader.cjs"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `PDF loader 缺失。已尝试：${candidates.join(" | ")}。请确认部署包含 lib/pdf-parse-loader.cjs 后重启网站进程。`
  );
}

/**
 * Runtime-load CommonJS PDF extractor (embedded worker via pdf-parse/worker getData).
 * Do not statically import pdf-parse in App Router bundles.
 */
function loadLoader(): PdfParseLoader {
  if (cachedLoader) return cachedLoader;

  const loaderAbs = resolveLoaderAbs();
  const pkgJson = path.join(path.dirname(path.dirname(loaderAbs)), "package.json");
  const nodeRequire = createRequire(fs.existsSync(pkgJson) ? pkgJson : loaderAbs);
  cachedLoader = nodeRequire(loaderAbs) as PdfParseLoader;
  return cachedLoader;
}

export async function extractPdfText(data: Buffer | Uint8Array): Promise<string> {
  return loadLoader().extractPdfText(data);
}

export function getPDFParseClass(): PDFParseClass {
  return loadLoader().getPDFParseClass();
}
