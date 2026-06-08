"use client";

import AiAdvisorLinks, { FallbackActions } from "@/components/AiAdvisorLinks";
import AiMessageFeedback from "@/components/AiMessageFeedback";
import AiSalesShortcuts from "@/components/AiSalesShortcuts";
import AiVoiceButton from "@/components/AiVoiceButton";
import { useI18n } from "@/components/I18nProvider";
import { useSiteData } from "@/components/SiteDataProvider";
import type { AiLink } from "@/lib/ai/links";
import {
  pageContextQuickQuestion,
  resolvePageContext,
  type AiPageContext,
} from "@/lib/ai/page-context";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, RotateCcw, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  links?: AiLink[];
  isError?: boolean;
  fallback?: boolean;
  needsHuman?: boolean;
};

const STORAGE_KEY = "dbsource-ai-chat-v2";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function TypingIndicator() {
  return (
    <div className="mr-4 flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white/5 w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function AiAdvisor() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const { products, cases } = useSiteData();
  const pageContext = useMemo(
    () => resolvePageContext(pathname, locale, { products, cases }),
    [pathname, locale, products, cases]
  );
  const quickQuestion = useMemo(
    () => pageContextQuickQuestion(pageContext, locale),
    [pageContext, locale]
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [aiReady, setAiReady] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const closePanel = useCallback(() => setOpen(false), []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(
            parsed.slice(-20).map((m) => ({ ...m, id: m.id || newId() }))
          );
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!messages.length) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.remaining === "number") setRemaining(d.remaining);
        if (typeof d.ready === "boolean") setAiReady(d.ready);
      })
      .catch(() => {});
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function clearChat() {
    setMessages([]);
    setInput("");
    sessionStorage.removeItem(STORAGE_KEY);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: newId(), role: "user", text: q }]);
    setLoading(true);

    const history = messages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          locale,
          history,
          pageContext,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            text: data.reply,
            links: data.links as AiLink[] | undefined,
            fallback: Boolean(data.fallback),
            needsHuman: Boolean(data.needsHuman),
          },
        ]);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      } else {
        setMessages((m) => [
          ...m,
          { id: newId(), role: "assistant", text: data.message || t.ai.error, isError: true },
        ]);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { id: newId(), role: "assistant", text: t.ai.error, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function pageContextLabel(ctx: AiPageContext): string {
    if (ctx.type === "product") return `${ctx.model}`;
    if (ctx.type === "case") return ctx.title;
    if (ctx.type === "configurator") return t.ai.contextConfigurator;
    if (ctx.type === "downloads") return t.nav.downloads;
    return t.nav.contact;
  }

  const lowQuota = remaining !== null && remaining <= 3;
  const charCount = input.length;
  const showSalesFooter = messages.some((m) => m.needsHuman) || !aiReady;

  return (
    <>
      <AnimatePresence>
        {!open ? (
          <motion.button
            type="button"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed z-[90] bottom-5 right-4 sm:right-6 safe-bottom flex items-center gap-2 min-h-[48px] px-4 rounded-full bg-brand-gold/90 text-black text-sm font-medium shadow-lg hover:bg-brand-gold transition-colors touch-active"
            aria-label={t.ai.title}
          >
            <Bot size={18} />
            <span className="hidden sm:inline">{t.ai.title}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed z-[95] bottom-4 right-4 sm:right-6 w-[min(100vw-2rem,400px)] max-h-[min(85vh,640px)] rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden safe-bottom"
            role="dialog"
            aria-label={t.ai.title}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.ai.title}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {!aiReady ? t.ai.offlineMode : t.ai.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="p-2 text-gray-500 hover:text-white"
                    aria-label={t.ai.clearChat}
                    title={t.ai.clearChat}
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-2 text-gray-500 hover:text-white"
                  aria-label={t.nav.menuClose}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 text-sm overscroll-contain"
            >
              {!aiReady ? (
                <p className="text-xs text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  {t.ai.offlineBanner}
                </p>
              ) : null}

              {pageContext && messages.length === 0 ? (
                <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-3 py-2">
                  <p className="text-[11px] text-gray-500 mb-1">{t.ai.pageContext}</p>
                  <p className="text-sm text-brand-gold font-medium truncate">
                    {pageContextLabel(pageContext)}
                  </p>
                  {quickQuestion ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => send(quickQuestion)}
                      className="mt-2 text-xs text-left text-gray-300 hover:text-white underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      {quickQuestion}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {messages.length === 0 ? (
                <div className="space-y-3 text-gray-400">
                  <p>{t.ai.welcome}</p>
                  <p className="text-[11px] text-gray-600">{t.ai.hint}</p>
                  <div className="flex flex-wrap gap-2">
                    {t.ai.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={loading}
                        onClick={() => send(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-brand-gold/40 hover:text-white transition-colors disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/configurator"
                    onClick={closePanel}
                    className="text-brand-gold text-xs hover:underline inline-block"
                  >
                    {t.ai.configuratorLink} →
                  </Link>
                </div>
              ) : null}

              {messages.map((m, i) => {
                const prevUser =
                  m.role === "assistant"
                    ? [...messages.slice(0, i)].reverse().find((x) => x.role === "user")
                    : undefined;
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "ml-6 sm:ml-10 bg-brand-gold/15 text-white"
                        : m.isError
                          ? "mr-2 sm:mr-4 bg-red-500/10 border border-red-500/20 text-red-200"
                          : "mr-2 sm:mr-4 bg-white/5 text-gray-200"
                    }`}
                  >
                    {m.fallback && m.role === "assistant" ? (
                      <span className="block text-[10px] text-amber-500/80 mb-1">
                        {t.ai.fallbackBadge}
                      </span>
                    ) : null}
                    {m.text}
                    {m.role === "assistant" && m.links?.length ? (
                      <AiAdvisorLinks links={m.links} onNavigate={closePanel} />
                    ) : null}
                    {m.role === "assistant" && m.needsHuman ? (
                      <AiSalesShortcuts
                        onNavigate={closePanel}
                        whatsAppText={prevUser?.text}
                        compact
                      />
                    ) : null}
                    {m.role === "assistant" && m.isError ? (
                      <FallbackActions onNavigate={closePanel} />
                    ) : null}
                    {m.role === "assistant" && !m.isError ? (
                      <AiMessageFeedback
                        messageId={m.id}
                        question={prevUser?.text ?? ""}
                        reply={m.text}
                        fallback={m.fallback}
                        pageType={pageContext?.type}
                      />
                    ) : null}
                  </div>
                );
              })}

              {loading ? <TypingIndicator /> : null}
            </div>

            <form onSubmit={onSubmit} className="p-3 border-t border-white/10 shrink-0 space-y-1">
              {showSalesFooter ? (
                <AiSalesShortcuts onNavigate={closePanel} whatsAppText={input || undefined} compact />
              ) : null}
              <div className="flex gap-2 items-end">
                <AiVoiceButton
                  disabled={loading}
                  onTranscript={(text) => setInput((v) => (v ? `${v} ${text}` : text))}
                />
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={
                    pageContext?.type === "product"
                      ? t.ai.placeholderProduct.replace("{model}", pageContext.model)
                      : t.ai.placeholder
                  }
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-gold/40 resize-none min-h-[42px] max-h-[100px] disabled:opacity-50"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-brand-gold/90 text-black disabled:opacity-40 touch-active"
                  aria-label={t.ai.send}
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between px-1 text-[10px] text-gray-600">
                <span>{t.ai.enterHint}</span>
                <span className={charCount > 450 ? "text-amber-500" : ""}>{charCount}/500</span>
              </div>
              {remaining !== null ? (
                <p
                  className={`text-[10px] text-center ${lowQuota ? "text-amber-500" : "text-gray-600"}`}
                >
                  {lowQuota
                    ? t.ai.remainingLow.replace("{n}", String(remaining))
                    : t.ai.remaining.replace("{n}", String(remaining))}
                </p>
              ) : null}
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
