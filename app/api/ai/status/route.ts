import { getAiDailyLimit, peekAiRateLimit } from "@/lib/ai/rate-limit";
import { getDeepSeekConfig } from "@/lib/ai/deepseek";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { ready } = getDeepSeekConfig();
  const { remaining, limit } = peekAiRateLimit(ip);

  return NextResponse.json({
    ok: true,
    ready,
    remaining,
    limit,
  });
}
