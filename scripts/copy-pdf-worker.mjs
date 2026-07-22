/**
 * After `next build`, ensure pdf.worker.mjs is present under .next/standalone
 * for PM2 / `node server.js` deploys (belt-and-suspenders beyond file tracing).
 *
 * Usage: node scripts/copy-pdf-worker.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));

function findSourceWorker() {
  const entry = require.resolve("pdf-parse");
  const entryDir = path.dirname(entry);
  const candidates = [
    path.normalize(path.join(entryDir, "../../worker/pdf.worker.mjs")),
    path.normalize(path.join(entryDir, "pdf.worker.mjs")),
    path.join(root, "node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
    path.join(root, "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copied -> ${path.relative(root, dest)}`);
}

const src = findSourceWorker();
if (!src) {
  console.error("FAIL: source pdf.worker.mjs not found in node_modules/pdf-parse");
  process.exit(1);
}

console.log("source:", src);

const standaloneRoot = path.join(root, ".next/standalone");
if (!fs.existsSync(standaloneRoot)) {
  console.log("SKIP: .next/standalone missing (not using standalone output yet)");
  process.exit(0);
}

const targets = [
  path.join(standaloneRoot, "node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
  path.join(standaloneRoot, "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"),
  path.join(standaloneRoot, "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs"),
];

for (const dest of targets) {
  copyFile(src, dest);
}

// Standalone deploys need the CJS loader next to traced server files.
const loaderSrc = path.join(root, "lib/pdf-parse-loader.cjs");
const loaderDest = path.join(standaloneRoot, "lib/pdf-parse-loader.cjs");
if (fs.existsSync(loaderSrc)) {
  copyFile(loaderSrc, loaderDest);
} else {
  console.warn("WARN: lib/pdf-parse-loader.cjs missing — PDF recognize may fail in standalone");
}

console.log("PASS: pdf.worker.mjs copied into .next/standalone");
