import type { ContactInfo } from "@/data/mock";
import { PRIMARY_WHATSAPP_PHONE, primarySalesPhone } from "@/lib/sales-routing";

const DEFAULT_MESSAGE =
  "我们正在进行系统升级与内容维护，部分页面可能暂时不可用。感谢您的理解。";

export function isMaintenanceMode(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

export function getMaintenanceMessage(): string {
  const custom = process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE?.trim();
  return custom || DEFAULT_MESSAGE;
}

/** Paths that must never show the public maintenance screen */
export function shouldBypassMaintenance(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/brand") || pathname.startsWith("/images")) return true;
  if (pathname === "/favicon.png" || pathname === "/icon.png") return true;
  return false;
}

export type MaintenanceContacts = {
  email: string;
  phone: string;
  whatsAppPhone: string;
  weChatLabel: string;
  weChatValue: string;
};

export function getMaintenanceContacts(contact: ContactInfo): MaintenanceContacts {
  const phone =
    process.env.NEXT_PUBLIC_MAINTENANCE_PHONE?.trim() ||
    contact.phones[0] ||
    primarySalesPhone();

  return {
    email:
      process.env.NEXT_PUBLIC_MAINTENANCE_EMAIL?.trim() || contact.email,
    phone,
    whatsAppPhone:
      process.env.NEXT_PUBLIC_MAINTENANCE_WHATSAPP?.trim() ||
      PRIMARY_WHATSAPP_PHONE,
    weChatLabel: process.env.NEXT_PUBLIC_MAINTENANCE_WECHAT_LABEL?.trim() || "WeChat",
    weChatValue:
      process.env.NEXT_PUBLIC_MAINTENANCE_WECHAT?.trim() || phone,
  };
}
