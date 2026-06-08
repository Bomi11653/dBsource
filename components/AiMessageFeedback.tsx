"use client";

import { useI18n } from "@/components/I18nProvider";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

export default function AiMessageFeedback({
  messageId,
  question,
  reply,
  fallback,
  pageType,
  onRated,
}: {
  messageId: string;
  question: string;
  reply: string;
  fallback?: boolean;
  pageType?: string;
  onRated?: (rating: "up" | "down") => void;
}) {
  const { locale, t } = useI18n();
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [sending, setSending] = useState(false);

  async function rate(value: "up" | "down") {
    if (rating || sending) return;
    setSending(true);
    setRating(value);
    onRated?.(value);
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          rating: value,
          question,
          reply,
          locale,
          fallback,
          pageType,
        }),
      });
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
      <span className="text-[10px] text-gray-600">{t.ai.feedbackPrompt}</span>
      <button
        type="button"
        disabled={!!rating}
        onClick={() => rate("up")}
        className={`p-1 rounded-md transition-colors touch-active ${
          rating === "up" ? "text-emerald-400" : "text-gray-500 hover:text-white"
        }`}
        aria-label={t.ai.feedbackUp}
      >
        <ThumbsUp size={14} />
      </button>
      <button
        type="button"
        disabled={!!rating}
        onClick={() => rate("down")}
        className={`p-1 rounded-md transition-colors touch-active ${
          rating === "down" ? "text-red-400" : "text-gray-500 hover:text-white"
        }`}
        aria-label={t.ai.feedbackDown}
      >
        <ThumbsDown size={14} />
      </button>
      {rating ? (
        <span className="text-[10px] text-gray-600">{t.ai.feedbackThanks}</span>
      ) : null}
    </div>
  );
}
