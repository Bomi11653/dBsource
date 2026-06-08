import { augmentUserMessage, type AiPageContext } from "@/lib/ai/page-context";
import { getCachedReply, setCachedReply } from "@/lib/ai/cache";
import { generateFallbackReply } from "@/lib/ai/fallback";
import { chatCompletion, getDeepSeekConfig, type ChatMessage } from "@/lib/ai/deepseek";
import { buildAiLinks } from "@/lib/ai/links";
import { buildSystemPrompt, retrieveContext } from "@/lib/ai/knowledge";
import { checkAiRateLimit, peekAiRateLimit } from "@/lib/ai/rate-limit";
import { NextRequest, NextResponse } from "next/server";

function parseHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-8)
    .map((m) => ({
      role: m?.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m?.content ?? "").trim().slice(0, 600),
    }))
    .filter((m) => m.content.length > 0);
}

function parsePageContext(raw: unknown): AiPageContext | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const type = o.type;
  if (type === "product" && o.model && o.productId) {
    return {
      type: "product",
      productId: Number(o.productId),
      model: String(o.model),
      name: String(o.name ?? o.model),
      href: String(o.href ?? `/products/${o.productId}`),
    };
  }
  if (type === "case" && o.caseId) {
    return {
      type: "case",
      caseId: Number(o.caseId),
      title: String(o.title ?? ""),
      href: String(o.href ?? `/cases/${o.caseId}`),
    };
  }
  if (type === "configurator") {
    return { type: "configurator", scene: o.scene ? String(o.scene) : undefined, href: "/configurator" };
  }
  if (type === "downloads") {
    return { type: "downloads", tab: o.tab ? String(o.tab) : undefined, href: "/downloads" };
  }
  if (type === "contact") {
    return { type: "contact", href: "/contact" };
  }
  return null;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const body = await request.json();
  const message = String(body.message ?? "").trim();
  const locale = body.locale === "en" ? "en" : "zh";
  const history = parseHistory(body.history);
  const pageContext = parsePageContext(body.pageContext);

  if (!message || message.length > 500) {
    return NextResponse.json(
      {
        ok: false,
        message:
          locale === "en" ? "Enter a question (max 500 chars)." : "请输入有效问题（500字以内）",
      },
      { status: 400 }
    );
  }

  const enrichedMessage = augmentUserMessage(message, pageContext, locale);
  const ctx = await retrieveContext(enrichedMessage, locale);
  const links = buildAiLinks(ctx.products, ctx.cases, ctx.downloads, locale);
  const { remaining: peekRemaining } = peekAiRateLimit(ip);

  function fallbackResponse(reason: "offline" | "rate_limit" | "api_error") {
    const fb = generateFallbackReply(enrichedMessage, locale, ctx);
    const note =
      locale === "zh"
        ? reason === "rate_limit"
          ? "\n\n（今日 AI 次数已用完，以上为离线规则回答）"
          : ""
        : reason === "rate_limit"
          ? "\n\n(Daily AI limit reached — offline rules reply)"
          : "";
    return NextResponse.json({
      ok: true,
      reply: fb.reply + note,
      links,
      fallback: true,
      needsHuman: fb.needsHuman,
      remaining: reason === "rate_limit" ? 0 : peekRemaining,
    });
  }

  const { ready } = getDeepSeekConfig();
  if (!ready) {
    return fallbackResponse("offline");
  }

  const cached = getCachedReply(locale, enrichedMessage);
  if (cached) {
    const fb = generateFallbackReply(enrichedMessage, locale, ctx);
    return NextResponse.json({
      ok: true,
      reply: cached,
      links,
      cached: true,
      remaining: peekRemaining,
      needsHuman: fb.needsHuman,
    });
  }

  const rate = checkAiRateLimit(ip);
  if (!rate.ok) {
    return fallbackResponse("rate_limit");
  }

  try {
    const system = buildSystemPrompt(locale, ctx.contextText);
    const chatMessages: ChatMessage[] = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: enrichedMessage },
    ];
    const reply = await chatCompletion(chatMessages);
    const fb = generateFallbackReply(enrichedMessage, locale, ctx);

    setCachedReply(locale, enrichedMessage, reply);
    return NextResponse.json({
      ok: true,
      reply,
      links,
      cached: false,
      remaining: rate.remaining,
      needsHuman: fb.needsHuman,
    });
  } catch {
    return fallbackResponse("api_error");
  }
}
