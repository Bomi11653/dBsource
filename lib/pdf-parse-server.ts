import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export type PDFParseInstance = {
  getText: () => Promise<{ text: string }>;
  destroy: () => Promise<void>;
};

type PDFParseClass = new (params: { data: Buffer }) => PDFParseInstance;

type PdfParseLoader = {
  listPdfWorkerCandidates: () => string[];
  resolvePdfWorkerPath: () => string;
  resolvePdfWorkerSrc: () => string;
  getPDFParseClass: () => PDFParseClass;
};

let cachedLoader: PdfParseLoader | null = null;

/**
 * Load the CommonJS helper from disk at runtime.
 * The app-route webpack bundle must NOT inline pdf-parse / require.resolve("pdf-parse"),
 * otherwise production rewrites resolve to numeric module ids (e.g. 74193) or drops require.
 */
function loadLoader(): PdfParseLoader {
  if (cachedLoader) return cachedLoader;

  const loaderAbs = path.join(process.cwd(), "lib", "pdf-parse-loader.cjs");
  if (!fs.existsSync(loaderAbs)) {
    throw new Error(
      `PDF loader 缺失：${loaderAbs}。请确认部署包含 lib/pdf-parse-loader.cjs 后重启网站进程。`
    );
  }

  // Parent must be a real on-disk filename so Node createRequire works under Next.
  const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));
  cachedLoader = nodeRequire(loaderAbs) as PdfParseLoader;
  return cachedLoader;
}

export function listPdfWorkerCandidates(): string[] {
  return loadLoader().listPdfWorkerCandidates();
}

export function resolvePdfWorkerPath(): string {
  return loadLoader().resolvePdfWorkerPath();
}

export function resolvePdfWorkerSrc(): string {
  return loadLoader().resolvePdfWorkerSrc();
}

/** Configure pdfjs worker once before parsing (fixes production ./pdf.worker.mjs errors). */
export function getPDFParseClass(): PDFParseClass {
  return loadLoader().getPDFParseClass();
}
