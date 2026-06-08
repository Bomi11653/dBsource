import crypto from "crypto";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache", "ai");

function ttlMs() {
  const hours = Number(process.env.AI_CACHE_TTL_HOURS ?? "24");
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
}

function cachePath(key: string) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const hash = crypto.createHash("md5").update(key).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

export function getCachedReply(locale: string, question: string): string | null {
  try {
    const file = cachePath(`${locale}:${question.trim().toLowerCase()}`);
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { at: number; reply: string };
    if (Date.now() - raw.at > ttlMs()) {
      fs.unlinkSync(file);
      return null;
    }
    return raw.reply;
  } catch {
    return null;
  }
}

export function setCachedReply(locale: string, question: string, reply: string) {
  try {
    const file = cachePath(`${locale}:${question.trim().toLowerCase()}`);
    fs.writeFileSync(file, JSON.stringify({ at: Date.now(), reply }), "utf8");
  } catch {
    /* ignore cache write errors */
  }
}
