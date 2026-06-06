import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  guide,
}: {
  title: string;
  subtitle?: string;
  guide?: ReactNode;
}) {
  return (
    <div className="mb-12 hero-fade-in">
      <h1 className="text-4xl md:text-5xl font-light">{title}</h1>
      {subtitle && <p className="text-gray-400 mt-4 text-lg">{subtitle}</p>}
      {guide}
    </div>
  );
}
