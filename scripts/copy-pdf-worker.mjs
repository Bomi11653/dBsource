/**
 * After `next build`, copy the CJS PDF loader into `.next/standalone`.
 * Runtime parsing uses pdf-parse/worker getData() (embedded data URL) —
 * disk pdf.worker.mjs is optional and NOT required for production.
 *
 * Usage: node scripts/copy-pdf-worker.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copied -> ${path.relative(root, dest)}`);
}

const standaloneRoot = path.join(root, ".next/standalone");
if (!fs.existsSync(standaloneRoot)) {
  console.log("SKIP: .next/standalone missing (not using standalone output yet)");
  process.exit(0);
}

const loaderSrc = path.join(root, "lib/pdf-parse-loader.cjs");
const loaderDest = path.join(standaloneRoot, "lib/pdf-parse-loader.cjs");
if (!fs.existsSync(loaderSrc)) {
  console.error("FAIL: lib/pdf-parse-loader.cjs missing");
  process.exit(1);
}
copyFile(loaderSrc, loaderDest);

console.log("PASS: PDF server loader (embedded getData) copied into .next/standalone");
console.log("NOTE: production does not require ./pdf.worker.mjs on disk");
