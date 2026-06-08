import { intentLabel, scoreLeadIntent } from "@/lib/ai/lead-scoring";
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
  const name = String(body.name ?? "").trim();
  const message = String(body.message ?? "").trim();
  const product = body.product ? String(body.product).trim() : "";

  if (!name || !message) {
    return NextResponse.json(
      { ok: false, message: "请填写姓名和留言内容。" },
      { status: 400 }
    );
  }

  const intent = scoreLeadIntent({
    name,
    message,
    company: body.company ? String(body.company) : undefined,
    email: body.email ? String(body.email) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    product: product || undefined,
  });
  const intentTag = `[意向:${intentLabel(intent, "zh")}]`;
  const productTag = product ? `[产品: ${product}]` : "";
  const fullMessage = [intentTag, productTag, message].filter(Boolean).join("\n");

  const result = await submitContactLead({
    name,
    company: body.company ? String(body.company) : undefined,
    email: body.email ? String(body.email) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    message: fullMessage,
    product: product || undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: "提交失败，请稍后重试或直接致电联系我们。" },
      { status: 502 }
    );
  }

  await notifyLead({
    name,
    company: String(body.company ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    product,
    message: fullMessage,
  });

  return NextResponse.json({
    ok: true,
    message: "Thank you! We will contact you soon.",
  });
}
