import { assertAdminRequest } from "@/lib/admin-auth";
import { translateBilingualPairs, type BilingualPairInput } from "@/lib/ai/admin-content";
import { getDeepSeekConfig } from "@/lib/ai/deepseek";
import { NextRequest, NextResponse } from "next/server";

type TranslateBody = {
  section?: "cases" | "products";
  pairs?: BilingualPairInput[];
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatTranslateError(raw: string): { status: number; error: string } {
  if (/DEEPSEEK_API_KEY/i.test(raw)) {
    return {
      status: 503,
      error:
        "翻译服务未配置：请在阿里云生产环境设置 DEEPSEEK_API_KEY，并重启网站进程（pm2 restart）后再试。",
    };
  }
  if (/INSUFFICIENT_BALANCE/i.test(raw)) {
    return {
      status: 502,
      error: "翻译服务余额不足，请充值 DeepSeek 账户后重试。",
    };
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network|无法连接/i.test(raw)) {
    return {
      status: 502,
      error: `无法连接翻译服务（${raw}）。请检查服务器出网与 DEEPSEEK_BASE_URL。`,
    };
  }
  return { status: 500, error: raw || "翻译失败" };
}

export async function POST(request: NextRequest) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const { ready, baseUrl, model } = getDeepSeekConfig();
  if (!ready) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "翻译服务未配置：请在生产环境设置 DEEPSEEK_API_KEY（服务端环境变量），并重启网站进程后再试。",
        meta: { baseUrl, model, ready: false },
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as TranslateBody;
  const section = body.section;
  const pairs = body.pairs;
  if (!section || (section !== "cases" && section !== "products")) {
    return NextResponse.json({ ok: false, error: "不支持的翻译类型" }, { status: 400 });
  }
  if (!Array.isArray(pairs) || !pairs.length) {
    return NextResponse.json({ ok: false, error: "缺少翻译字段" }, { status: 400 });
  }

  try {
    const patch = await translateBilingualPairs(section, pairs);
    if (!patch) {
      return NextResponse.json(
        { ok: false, error: "翻译结果无法解析，请稍后重试或检查 DeepSeek 返回内容。" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, data: patch });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "翻译失败";
    const formatted = formatTranslateError(raw);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: formatted.status });
  }
}
