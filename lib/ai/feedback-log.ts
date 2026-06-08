import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), ".cache", "ai");
const LOG_FILE = path.join(LOG_DIR, "feedback.jsonl");

export type FeedbackEntry = {
  at: string;
  rating: "up" | "down";
  messageId: string;
  question: string;
  reply: string;
  locale: string;
  fallback?: boolean;
  pageType?: string;
};

export function appendFeedback(entry: Omit<FeedbackEntry, "at">) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const line = JSON.stringify({ ...entry, at: new Date().toISOString() }) + "\n";
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch {
    /* ignore log errors */
  }
}
