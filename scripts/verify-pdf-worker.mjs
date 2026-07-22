/**
 * Verify pdf.worker.mjs is present for production / PM2.
 * Usage: node scripts/verify-pdf-worker.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));

const entry = require.resolve("pdf-parse");
const entryDir = path.dirname(entry);
const packageWorkers = [
  path.normalize(path.join(entryDir, "../../worker/pdf.worker.mjs")),
  path.normalize(path.join(entryDir, "pdf.worker.mjs")),
  path.join(root, "node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
  path.join(root, "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"),
];

console.log("pdf-parse entry:", entry);
let packageOk = false;
for (const worker of packageWorkers) {
  const ok = fs.existsSync(worker);
  console.log(`package worker: ${worker} -> ${ok ? "yes" : "no"}`);
  if (ok) packageOk = true;
}

const standaloneRoot = path.join(root, ".next/standalone");
const standaloneWorkers = [
  path.join(standaloneRoot, "node_modules/pdf-parse/dist/worker/pdf.worker.mjs"),
  path.join(standaloneRoot, "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"),
  path.join(standaloneRoot, "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs"),
];

let standaloneOk = false;
if (fs.existsSync(standaloneRoot)) {
  for (const candidate of standaloneWorkers) {
    const ok = fs.existsSync(candidate);
    console.log(`standalone: ${candidate} -> ${ok ? "yes" : "no"}`);
    if (ok) standaloneOk = true;
  }
} else {
  console.log("SKIP: .next/standalone not found (run npm run build first)");
}

if (!packageOk) {
  console.error("FAIL: pdf.worker.mjs missing from node_modules/pdf-parse");
  process.exit(1);
}

if (fs.existsSync(standaloneRoot) && !standaloneOk) {
  console.error("FAIL: pdf.worker.mjs not present in .next/standalone");
  console.error("Hint: run `node scripts/copy-pdf-worker.mjs` after build");
  process.exit(1);
}

if (fs.existsSync(standaloneRoot)) {
  console.log("PASS: standalone build includes pdf worker");
}
console.log("PASS: pdf worker available");
