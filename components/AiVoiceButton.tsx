"use client";

import { useI18n } from "@/components/I18nProvider";
import { Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VoiceRec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { [j: number]: { transcript: string }; isFinal: boolean } } }) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type VoiceRecCtor = new () => VoiceRec;

function getSpeechRecognition(): VoiceRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { SpeechRecognition?: VoiceRecCtor; webkitSpeechRecognition?: VoiceRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function AiVoiceButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const { locale, t } = useI18n();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<VoiceRec | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPress = useRef(false);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
    return () => {
      recRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || disabled) return;

    const rec = new Ctor();
    rec.lang = locale === "zh" ? "zh-CN" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      if (text.trim()) onTranscript(text.trim());
    };

    rec.onerror = () => stop();
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      stop();
    }
  }, [disabled, locale, onTranscript, stop]);

  function onPressStart() {
    longPress.current = false;
    pressTimer.current = setTimeout(() => {
      longPress.current = true;
      start();
    }, 450);
  }

  function onPressEnd() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (longPress.current) {
      stop();
    } else if (!listening && supported && !disabled) {
      start();
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onMouseLeave={listening ? stop : undefined}
      onTouchStart={(e) => {
        e.preventDefault();
        onPressStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onPressEnd();
      }}
      className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border transition-colors touch-active select-none ${
        listening
          ? "border-red-500/50 bg-red-500/20 text-red-400 animate-pulse"
          : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"
      } disabled:opacity-40`}
      aria-label={t.ai.voiceHold}
      title={t.ai.voiceHint}
    >
      <Mic size={16} />
    </button>
  );
}
