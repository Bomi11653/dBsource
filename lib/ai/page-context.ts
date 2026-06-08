import type { CaseItem, Locale, Product } from "@/data/mock";

export type AiPageContext =
  | { type: "product"; productId: number; model: string; name: string; href: string }
  | { type: "case"; caseId: number; title: string; href: string }
  | { type: "configurator"; scene?: string; href: string }
  | { type: "downloads"; tab?: string; href: string }
  | { type: "contact"; href: string };

export function resolvePageContext(
  pathname: string,
  locale: Locale,
  data: { products: Product[]; cases: CaseItem[] }
): AiPageContext | null {
  const productMatch = pathname.match(/^\/products\/(\d+)$/);
  if (productMatch) {
    const id = Number(productMatch[1]);
    const p = data.products.find((x) => x.id === id);
    if (p) {
      return {
        type: "product",
        productId: id,
        model: p.model,
        name: p.name[locale],
        href: `/products/${id}`,
      };
    }
  }

  const caseMatch = pathname.match(/^\/cases\/(\d+)$/);
  if (caseMatch) {
    const id = Number(caseMatch[1]);
    const c = data.cases.find((x) => x.id === id);
    if (c) {
      return {
        type: "case",
        caseId: id,
        title: c.title[locale],
        href: `/cases/${id}`,
      };
    }
  }

  if (pathname.startsWith("/configurator")) {
    return { type: "configurator", href: "/configurator" };
  }
  if (pathname.startsWith("/downloads")) {
    return { type: "downloads", href: "/downloads" };
  }
  if (pathname.startsWith("/contact")) {
    return { type: "contact", href: "/contact" };
  }

  return null;
}

export function augmentUserMessage(message: string, ctx: AiPageContext | null, locale: Locale): string {
  if (!ctx) return message;
  if (ctx.type === "product") {
    const prefix =
      locale === "zh"
        ? `[当前浏览产品: ${ctx.model} ${ctx.name}]`
        : `[Viewing product: ${ctx.model} ${ctx.name}]`;
    return `${prefix}\n${message}`;
  }
  if (ctx.type === "case") {
    const prefix =
      locale === "zh" ? `[当前浏览案例: ${ctx.title}]` : `[Viewing case: ${ctx.title}]`;
    return `${prefix}\n${message}`;
  }
  return message;
}

export function pageContextQuickQuestion(ctx: AiPageContext | null, locale: Locale): string | null {
  if (!ctx) return null;
  if (ctx.type === "product") {
    return locale === "zh"
      ? `请介绍 ${ctx.model} 的适用场景和搭配建议`
      : `Introduce ${ctx.model} use cases and pairing options`;
  }
  if (ctx.type === "case") {
    return locale === "zh"
      ? `这个案例用了哪些设备？能否做类似项目？`
      : `What gear was used in this project? Can you do similar installs?`;
  }
  return null;
}
