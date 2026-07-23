/**
 * Verify server-side PDF extraction is ready for production / PM2.
 * Primary check: embedded worker via pdf-parse/worker getData() (no ./pdf.worker.mjs).
 *
 * Usage: node scripts/verify-pdf-worker.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));

let failed = false;

function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}`);
  if (!ok) failed = true;
}

const loaderPath = path.join(root, "lib/pdf-parse-loader.cjs");
check(`loader exists (${loaderPath})`, fs.existsSync(loaderPath));

let getDataOk = false;
try {
  const { getData } = require("pdf-parse/worker");
  const data = getData();
  getDataOk = typeof data === "string" && data.startsWith("data:");
  console.log("pdf-parse/worker getData:", getDataOk ? `ok (${data.slice(0, 32)}…)` : "invalid");
} catch (e) {
  console.error("pdf-parse/worker getData error:", e instanceof Error ? e.message : e);
}
check("embedded worker getData()", getDataOk);

const standaloneRoot = path.join(root, ".next/standalone");
const standaloneLoader = path.join(standaloneRoot, "lib/pdf-parse-loader.cjs");
if (fs.existsSync(path.join(standaloneRoot, "server.js"))) {
  check(`standalone loader (${standaloneLoader})`, fs.existsSync(standaloneLoader));
} else if (fs.existsSync(standaloneRoot)) {
  console.log("INFO: .next/standalone incomplete (no server.js) — run npm run build");
} else {
  console.log("INFO: .next/standalone not present yet (run after npm run build)");
}

try {
  const { extractPdfText } = require(loaderPath);
  const pdf = Buffer.from(
    `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 12 Tf 50 700 Td (Verify Specs) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000360 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
437
%%EOF
`.replace(/\r?\n/g, "\n")
  );
  const text = await extractPdfText(pdf);
  const ok = /Verify Specs/i.test(text);
  console.log("extract smoke text:", JSON.stringify(text.slice(0, 80)));
  check("extractPdfText smoke (no ./pdf.worker.mjs)", ok);
} catch (e) {
  console.error("extract smoke error:", e instanceof Error ? e.stack || e.message : e);
  check("extractPdfText smoke (no ./pdf.worker.mjs)", false);
}

if (failed) {
  console.error("FAIL: PDF server extractor verification failed");
  process.exit(1);
}

console.log("PASS: PDF server extractor ready (embedded getData worker, no ./pdf.worker.mjs)");
