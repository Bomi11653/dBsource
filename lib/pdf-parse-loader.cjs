"use strict";

/**
 * CommonJS PDF loader — kept outside the Next/webpack app-route bundle.
 * Production `next start` / standalone must resolve worker via real Node require.
 * Do not convert this file to ESM/TS imports used by the route bundle.
 */

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { createRequire } = require("node:module");

const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));

let workerConfigured = false;
let cachedWorkerPath = null;

function pdfParsePackageName() {
  return ["pdf", "parse"].join("-");
}

function listPdfWorkerCandidates() {
  const cwd = process.cwd();
  const candidates = [
    path.normalize(path.join(cwd, "node_modules/pdf-parse/dist/worker/pdf.worker.mjs")),
    path.normalize(
      path.join(cwd, "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs")
    ),
    path.normalize(
      path.join(cwd, "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs")
    ),
  ];

  try {
    const entry = requireFromCwd.resolve(pdfParsePackageName());
    const entryDir = path.dirname(entry);
    candidates.unshift(
      path.normalize(path.join(entryDir, "../../worker/pdf.worker.mjs")),
      path.normalize(path.join(entryDir, "pdf.worker.mjs")),
      path.normalize(path.join(entryDir, "../web/pdf.worker.mjs")),
      path.normalize(path.join(entryDir, "../esm/pdf.worker.mjs"))
    );
  } catch {
    // cwd candidates remain
  }

  return candidates;
}

function resolvePdfWorkerPath() {
  if (cachedWorkerPath && fs.existsSync(cachedWorkerPath)) {
    return cachedWorkerPath;
  }

  const candidates = listPdfWorkerCandidates();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedWorkerPath = candidate;
      return candidate;
    }
  }

  throw new Error(
    `PDF worker 文件未找到（pdf.worker.mjs）。已尝试：${candidates.join(" | ")}。请确认生产部署包含 pdf-parse 的 worker 文件后重启网站进程。`
  );
}

function resolvePdfWorkerSrc() {
  return pathToFileURL(resolvePdfWorkerPath()).href;
}

function getPDFParseClass() {
  const { PDFParse } = requireFromCwd(pdfParsePackageName());

  if (!workerConfigured) {
    PDFParse.setWorker(resolvePdfWorkerSrc());
    workerConfigured = true;
  }

  return PDFParse;
}

module.exports = {
  listPdfWorkerCandidates,
  resolvePdfWorkerPath,
  resolvePdfWorkerSrc,
  getPDFParseClass,
};
