import fs from "fs";
import path from "path";
import type { RevalidateModule } from "@/lib/revalidate";

export type RevalidationTrigger = "manual" | "automatic" | "test";

export type RevalidationRecord = {
  ok: boolean;
  trigger: RevalidationTrigger;
  modules: string[];
  paths: string[];
  pathCount: number;
  revalidatedAt: string;
  errorMessage?: string;
};

export type RevalidationAudit = {
  manual: RevalidationRecord | null;
  automatic: RevalidationRecord | null;
  test: RevalidationRecord | null;
};

const AUDIT_PATH = path.join(process.cwd(), ".data", "cms-cache", "revalidation-audit.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
}

function readAudit(): RevalidationAudit {
  const defaults: RevalidationAudit = { manual: null, automatic: null, test: null };
  try {
    const raw = fs.readFileSync(AUDIT_PATH, "utf8");
    return { ...defaults, ...(JSON.parse(raw) as RevalidationAudit) };
  } catch {
    return defaults;
  }
}

function writeAudit(audit: RevalidationAudit) {
  ensureDir();
  const tmp = `${AUDIT_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(audit, null, 2), "utf8");
  fs.renameSync(tmp, AUDIT_PATH);
}

export function getRevalidationAudit(): RevalidationAudit {
  return readAudit();
}

export function recordRevalidationAudit(
  trigger: RevalidationTrigger,
  input: {
    ok: boolean;
    modules: RevalidateModule[] | string[];
    paths: string[];
    errorMessage?: string;
  }
): RevalidationRecord {
  const record: RevalidationRecord = {
    ok: input.ok,
    trigger,
    modules: input.modules.map(String),
    paths: input.paths,
    pathCount: input.paths.length,
    revalidatedAt: new Date().toISOString(),
    errorMessage: input.errorMessage,
  };

  const audit = readAudit();
  if (trigger === "manual") audit.manual = record;
  else if (trigger === "automatic") audit.automatic = record;
  else audit.test = record;
  writeAudit(audit);

  if (record.ok) {
    console.log(`[CMS] revalidate success ${record.modules.join(",")}`);
  } else {
    console.log(`[CMS] revalidate failed ${record.modules.join(",")}: ${record.errorMessage}`);
  }

  return record;
}
