import { SALES_CONTACTS } from "@/data/sales-contacts";

/** 默认 WhatsApp 导流（刘德琰） */
export const PRIMARY_WHATSAPP_PHONE = "8613712769500";

export function whatsAppUrl(phoneE164 = PRIMARY_WHATSAPP_PHONE, text?: string): string {
  const base = `https://wa.me/${phoneE164.replace(/\D/g, "")}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text.trim())}`;
}

export function isComplexProjectQuery(message: string): boolean {
  return /工程|项目|招标|投标|turnkey|万人|大型场馆|施工|勘测|深化设计|系统集成|总包/i.test(
    message
  );
}

export function salesContactAnchor() {
  return "/contact#contact-sales";
}

export function primarySalesPhone(): string {
  return SALES_CONTACTS[0]?.phones[0] ?? "13712769500";
}
