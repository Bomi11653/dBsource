const buckets = new Map<string, { count: number; day: string }>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getAiDailyLimit(): number {
  const n = Number(process.env.AI_DAILY_LIMIT ?? "20");
  return Number.isFinite(n) && n > 0 ? n : 20;
}

export function peekAiRateLimit(ip: string): { remaining: number; limit: number } {
  const limit = getAiDailyLimit();
  const day = todayKey();
  const entry = buckets.get(ip);
  if (!entry || entry.day !== day) {
    return { remaining: limit, limit };
  }
  return { remaining: Math.max(0, limit - entry.count), limit };
}

export function checkAiRateLimit(ip: string): { ok: boolean; remaining: number } {
  const limit = getAiDailyLimit();
  const day = todayKey();
  const entry = buckets.get(ip);

  if (!entry || entry.day !== day) {
    buckets.set(ip, { count: 1, day });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}
