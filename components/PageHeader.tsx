import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  guide,
  compact,
}: {
  title: string;
  subtitle?: string;
  guide?: ReactNode;
  /** 筛选页缩小标题区，让用户更快看到内容 */
  compact?: boolean;
}) {
  return (
    <div className={`hero-fade-in ${compact ? "mb-6 md:mb-10" : "mb-8 md:mb-12"}`}>
      <h1 className="text-2xl sm:text-3xl md:text-5xl font-light leading-snug">{title}</h1>
      {subtitle && (
        <p className="text-gray-400 mt-2 md:mt-4 text-base md:text-lg leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
      {guide}
    </div>
  );
}
