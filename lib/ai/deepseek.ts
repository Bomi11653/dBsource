export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function getDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(
    /\/$/,
    ""
  );
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  return { apiKey, baseUrl, model, ready: Boolean(apiKey) };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const { apiKey, baseUrl, model, ready } = getDeepSeekConfig();
  if (!ready) throw new Error("DEEPSEEK_API_KEY 未配置");

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 800,
      temperature: options?.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    let apiMessage = "";
    try {
      const parsed = JSON.parse(err) as { error?: { message?: string } };
      apiMessage = parsed.error?.message?.trim() || "";
    } catch {
      apiMessage = err.trim();
    }
    if (/insufficient balance/i.test(apiMessage)) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
    throw new Error(apiMessage || `DeepSeek ${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() || "";
}
