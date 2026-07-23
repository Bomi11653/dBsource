"use strict";

/**
 * Server-only PDF text extraction for Next.js API routes (Node runtime).
 *
 * Uses pdf-parse with an *embedded* worker via `pdf-parse/worker` `getData()`
 * (data:text/javascript;base64,...). This avoids:
 * - browser pdfjs / GlobalWorkerOptions in the client
 * - fragile relative `./pdf.worker.mjs` lookups under PM2 / standalone cwd
 * - "Setting up fake worker failed: Cannot find module './pdf.worker.mjs'"
 *
 * Keep this file CommonJS and load it at runtime from disk (not webpack-bundled).
 */

const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

let configured = false;
let PDFParseClass = null;

function listPackageJsonCandidates() {
  const cwd = process.cwd();
  return [
    path.join(cwd, "package.json"),
    path.join(__dirname, "..", "package.json"),
    path.join(cwd, "..", "package.json"),
  ];
}

function createProjectRequire() {
  const errors = [];
  for (const pkg of listPackageJsonCandidates()) {
    if (!fs.existsSync(pkg)) continue;
    try {
      return createRequire(pkg);
    } catch (e) {
      errors.push(`${pkg}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(
    `无法创建 Node require（找不到可用 package.json）。cwd=${process.cwd()} tried=${errors.join(" | ") || "none"}`
  );
}

function ensurePdfParse() {
  if (PDFParseClass) return PDFParseClass;

  const nodeRequire = createProjectRequire();

  // MUST configure embedded worker BEFORE constructing PDFParse.
  const workerApi = nodeRequire("pdf-parse/worker");
  const { PDFParse } = nodeRequire("pdf-parse");

  if (typeof workerApi.getData !== "function") {
    throw new Error("pdf-parse/worker 缺少 getData()，请升级 pdf-parse 依赖后重试。");
  }

  // Embedded worker (data URL) — no filesystem ./pdf.worker.mjs required.
  const workerSrc = workerApi.getData();
  if (typeof workerSrc !== "string" || !workerSrc.startsWith("data:")) {
    throw new Error("pdf-parse/worker getData() 未返回 data: URL，无法在服务端安全配置 worker。");
  }

  PDFParse.setWorker(workerSrc);
  configured = true;
  PDFParseClass = PDFParse;
  return PDFParseClass;
}

/**
 * Extract plain text from a PDF buffer (Node only).
 * @param {Buffer|Uint8Array} data
 * @returns {Promise<string>}
 */
async function extractPdfText(data) {
  const PDFParse = ensurePdfParse();
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return String(parsed?.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}

function getPDFParseClass() {
  return ensurePdfParse();
}

function isWorkerConfigured() {
  return configured;
}

module.exports = {
  extractPdfText,
  getPDFParseClass,
  isWorkerConfigured,
};
