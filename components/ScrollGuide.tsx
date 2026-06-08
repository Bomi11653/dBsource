"use client";

type ScrollGuideProps = {
  targetId: string;
  label: string;
  ariaLabel?: string;
  className?: string;
};

export default function ScrollGuide({
  targetId,
  label,
  ariaLabel,
  className = "",
}: ScrollGuideProps) {
  function handleScroll() {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleScroll}
      aria-label={ariaLabel ?? label}
      className={`pointer-events-auto group flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors ${className}`}
    >
      <span className="text-xs tracking-[0.28em] uppercase">{label}</span>
      <span className="scroll-guide-chevron touch-target flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm group-hover:border-white/40">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className="text-current"
        >
          <path
            d="M7 2v8M7 10l-3.5-3.5M7 10l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
