import fs from "fs";
import path from "path";

export type LkgContentType =
  | "products"
  | "productSeries"
  | "cases"
  | "downloads"
  | "about"
  | "contact"
  | "globalSetting"
  | "scenes";

export type LkgEnvelope<T = unknown> = {
  payload: T;
  savedAt: string;
  sourceUrl: string;
  contentType: LkgContentType;
};

export type CmsRuntimeStatus = {
  lastSuccessfulFetchAt: string | null;
  lastFailedFetchAt: string | null;
  lastErrorMessage: string | null;
  usingLastKnownGood: boolean;
  perType: Partial<
    Record<
      LkgContentType,
      {
        savedAt: string | null;
        sourceUrl: string | null;
      }
    >
  >;
};

const CACHE_DIR = path.join(process.cwd(), ".data", "cms-cache");

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cacheFilePath(contentType: LkgContentType): string {
  return path.join(CACHE_DIR, `${contentType}.json`);
}

function statusFilePath(): string {
  return path.join(CACHE_DIR, "status.json");
}

function atomicWriteJson(filePath: string, data: unknown) {
  ensureCacheDir();
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    try {
      fs.renameSync(tmp, filePath);
    } catch {
      fs.copyFileSync(tmp, filePath);
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* temp file may remain; harmless */
      }
    }
  } catch (e) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore cleanup errors */
    }
    cmsLog(
      `cache write failed ${path.basename(filePath)}: ${e instanceof Error ? e.message : "unknown"}`
    );
  }
}

export function cmsLog(message: string) {
  console.log(`[CMS] ${message}`);
}

export function writeLkgCache<T>(
  contentType: LkgContentType,
  payload: T,
  sourceUrl: string
): LkgEnvelope<T> {
  const envelope: LkgEnvelope<T> = {
    payload,
    savedAt: new Date().toISOString(),
    sourceUrl,
    contentType,
  };
  atomicWriteJson(cacheFilePath(contentType), envelope);
  cmsLog(`cache saved ${contentType}`);
  const status = readRuntimeStatus();
  status.perType[contentType] = {
    savedAt: envelope.savedAt,
    sourceUrl,
  };
  status.lastSuccessfulFetchAt = envelope.savedAt;
  status.usingLastKnownGood = false;
  status.lastErrorMessage = null;
  writeRuntimeStatus(status);
  return envelope;
}

export function readLkgCache<T>(contentType: LkgContentType): LkgEnvelope<T> | null {
  try {
    const raw = fs.readFileSync(cacheFilePath(contentType), "utf8");
    return JSON.parse(raw) as LkgEnvelope<T>;
  } catch {
    return null;
  }
}

export function readRuntimeStatus(): CmsRuntimeStatus {
  const defaults: CmsRuntimeStatus = {
    lastSuccessfulFetchAt: null,
    lastFailedFetchAt: null,
    lastErrorMessage: null,
    usingLastKnownGood: false,
    perType: {},
  };

  const types: LkgContentType[] = [
    "products",
    "productSeries",
    "cases",
    "downloads",
    "about",
    "contact",
    "globalSetting",
    "scenes",
  ];

  for (const contentType of types) {
    const envelope = readLkgCache(contentType);
    if (envelope) {
      defaults.perType[contentType] = {
        savedAt: envelope.savedAt,
        sourceUrl: envelope.sourceUrl,
      };
      if (
        !defaults.lastSuccessfulFetchAt ||
        envelope.savedAt > defaults.lastSuccessfulFetchAt
      ) {
        defaults.lastSuccessfulFetchAt = envelope.savedAt;
      }
    }
  }

  try {
    const raw = fs.readFileSync(statusFilePath(), "utf8");
    const stored = JSON.parse(raw) as CmsRuntimeStatus;
    return {
      ...defaults,
      ...stored,
      perType: { ...defaults.perType, ...stored.perType },
    };
  } catch {
    return defaults;
  }
}

function writeRuntimeStatus(status: CmsRuntimeStatus) {
  atomicWriteJson(statusFilePath(), status);
}

export function recordLkgFailure(contentType: LkgContentType, errorMessage: string) {
  const status = readRuntimeStatus();
  status.lastFailedFetchAt = new Date().toISOString();
  status.lastErrorMessage = errorMessage;
  writeRuntimeStatus(status);
  cmsLog(`fetch failed ${contentType}, using last-known-good cache`);
}

export function recordLkgHit(contentType: LkgContentType) {
  const status = readRuntimeStatus();
  status.usingLastKnownGood = true;
  writeRuntimeStatus(status);
}

export function recordLkgMiss(contentType: LkgContentType) {
  cmsLog(`no cache available for ${contentType}`);
  const status = readRuntimeStatus();
  status.usingLastKnownGood = false;
  writeRuntimeStatus(status);
}

export function clearAllLkgCaches() {
  ensureCacheDir();
  for (const file of fs.readdirSync(CACHE_DIR)) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    }
  }
  cmsLog("all local caches cleared");
}

export function listLkgCacheSummary(): {
  fileCount: number;
  perType: CmsRuntimeStatus["perType"];
  lastSuccessfulFetchAt: string | null;
  lastFailedFetchAt: string | null;
  lastErrorMessage: string | null;
  usingLastKnownGood: boolean;
} {
  const status = readRuntimeStatus();
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json") && f !== "status.json");
  return {
    fileCount: files.length,
    perType: status.perType,
    lastSuccessfulFetchAt: status.lastSuccessfulFetchAt,
    lastFailedFetchAt: status.lastFailedFetchAt,
    lastErrorMessage: status.lastErrorMessage,
    usingLastKnownGood: status.usingLastKnownGood,
  };
}

export async function withLastKnownGood<T>(
  contentType: LkgContentType,
  sourceUrl: string,
  fetchLive: () => Promise<T>,
  emptyFallback: T
): Promise<T> {
  try {
    const data = await fetchLive();
    writeLkgCache(contentType, data, sourceUrl);
    cmsLog(`fetch success ${contentType}`);
    return data;
  } catch (e) {
    const errorMessage =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Strapi request timeout"
          : e.message
        : "Strapi fetch failed";
    recordLkgFailure(contentType, errorMessage);
    const cached = readLkgCache<T>(contentType);
    if (cached) {
      recordLkgHit(contentType);
      return cached.payload;
    }
    recordLkgMiss(contentType);
    return emptyFallback;
  }
}
