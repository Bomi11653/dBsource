/**
 * Safe frontend cache cleanup.
 * Removes: .next, node_modules/.cache (if present)
 * Does NOT remove: node_modules, package-lock.json, cms, public, uploads, user data
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const targets = [".next", join("node_modules", ".cache")];

for (const rel of targets) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    console.log(`[clean] skip ${rel} (not found)`);
    continue;
  }
  rmSync(abs, { recursive: true, force: true });
  console.log(`[clean] removed ${rel}`);
}
