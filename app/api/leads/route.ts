import { computeLeadScore, intentLabel, scoreLeadIntent } from "@/lib/ai/lead-scoring";
import { submitContactLead } from "@/lib/cms";
import { NextRequest, NextResponse } from "next/server";

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

async function notifyLead(payload: Record<string, string>) {
  const webhook = process.env.LEAD_WEBHOOK_URL?.trim();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* optional webhook */
  }
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function resolveMarketFromHost(host: string): "cn" | "global" | "all" {
  const lowered = host.toLowerCase();
  if (lowered.includes("cn.")) return "cn";
  if (lowered.includes("global.") || lowered.includes("en.")) return "global";
  return "all";
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, message: "提交过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  const body = await request.json();
  const name = normalizeText(body.name);
  const message = normalizeText(body.message);
  const product = normalizeText(body.product);
  const landingPage = normalizeText(body.landingPage);
  const referrer = normalizeText(body.referrer || request.headers.get("referer"));
  const language = normalizeText(body.language || request.headers.get("accept-language"));
  const country =
    normalizeText(body.country) ||
    normalizeText(
      request.headers.get("x-vercel-ip-country") ||
        request.headers.get("cf-ipcountry") ||
        request.headers.get("x-country-code")
    );
  const host = normalizeText(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  const market = resolveMarketFromHost(host);
  const utmSource = normalizeText(body.utmSource);
  const utmMedium = normalizeText(body.utmMedium);
  const utmCampaign = normalizeText(body.utmCampaign);
  const utmTerm = normalizeText(body.utmTerm);
  const utmContent = normalizeText(body.utmContent);

  if (!name || !message) {
    return NextResponse.json(
      { ok: false, message: "请填写姓名和留言内容。" },
      { status: 400 }
    );
  }

  const intent = scoreLeadIntent({
    name,
    message,
    company: normalizeText(body.company) || undefined,
    email: normalizeText(body.email) || undefined,
    phone: normalizeText(body.phone) || undefined,
    product: product || undefined,
  });
  const intentScore = computeLeadScore({
    name,
    message,
    company: normalizeText(body.company) || undefined,
    email: normalizeText(body.email) || undefined,
    phone: normalizeText(body.phone) || undefined,
    product: product || undefined,
  });
  const intentTag = `[意向:${intentLabel(intent, "zh")}]`;
  const productTag = product ? `[产品: ${product}]` : "";
  const fullMessage = [intentTag, productTag, message].filter(Boolean).join("\n");

  const result = await submitContactLead({
    name,
    company: normalizeText(body.company) || undefined,
    email: normalizeText(body.email) || undefined,
    phone: normalizeText(body.phone) || undefined,
    message: fullMessage,
    product: product || undefined,
    intentScore,
    intentTag: intentLabel(intent, "zh"),
    language: language || undefined,
    country: country || undefined,
    market,
    utmSource: utmSource || undefined,
    utmMedium: utmMedium || undefined,
    utmCampaign: utmCampaign || undefined,
    utmTerm: utmTerm || undefined,
    utmContent: utmContent || undefined,
    landingPage: landingPage || undefined,
    referrer: referrer || undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: "提交失败，请稍后重试或直接致电联系我们。" },
      { status: 502 }
    );
  }

  await notifyLead({
    name,
    company: normalizeText(body.company),
    email: normalizeText(body.email),
    phone: normalizeText(body.phone),
    product,
    country,
    market,
    utmSource,
    landingPage,
    message: fullMessage,
  });

  return NextResponse.json({
    ok: true,
    message: "Thank you! We will contact you soon.",
  });
}
