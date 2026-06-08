import { appendFeedback } from "@/lib/ai/feedback-log";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rating = body.rating === "down" ? "down" : body.rating === "up" ? "up" : null;
  if (!rating) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  appendFeedback({
    rating,
    messageId: String(body.messageId ?? "").slice(0, 64),
    question: String(body.question ?? "").slice(0, 500),
    reply: String(body.reply ?? "").slice(0, 2000),
    locale: body.locale === "en" ? "en" : "zh",
    fallback: Boolean(body.fallback),
    pageType: body.pageType ? String(body.pageType).slice(0, 32) : undefined,
  });

  return NextResponse.json({ ok: true });
}
