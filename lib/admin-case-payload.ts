import { richtextToPlain } from "@/lib/case-project-overview";

type CaseDraft = Record<string, unknown>;
type StrapiMedia = { id?: number; url?: string };

/** 后台草稿 → 纯文本（兼容 Strapi richtext 块） */
export function caseDraftText(row: CaseDraft, key: string): string {
  const v = row[key];
  if (key === "detailZh" || key === "detailEn") return richtextToPlain(v);
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

/** 加载/保存后规范化案例草稿（richtext → 纯文本字符串） */
export function normalizeCaseAdminDraft(row: CaseDraft): CaseDraft {
  const next = { ...row };
  for (const key of ["detailZh", "detailEn"] as const) {
    const plain = caseDraftText(next, key);
    if (plain) next[key] = plain;
  }
  return next;
}

/**
 * 工程案例保存 payload：与 Strapi case schema 对齐。
 * 项目概述写入 detailZh/En 与 descZh/En，保证翻译后刷新仍可读到英文。
 */
export function buildCaseAdminSavePayload(draft: CaseDraft): Record<string, unknown> {
  const overviewZh = caseDraftText(draft, "detailZh") || caseDraftText(draft, "descZh");
  const overviewEn = caseDraftText(draft, "detailEn") || caseDraftText(draft, "descEn");

  const payload: Record<string, unknown> = {
    legacyId: draft.legacyId,
    type: draft.type ?? "engineering",
    titleZh: caseDraftText(draft, "titleZh"),
    titleEn: caseDraftText(draft, "titleEn"),
    descZh: overviewZh,
    descEn: overviewEn,
    detailZh: overviewZh,
    detailEn: overviewEn,
    sortOrder: Number(draft.sortOrder) || 0,
    market: draft.market ?? "all",
  };

  for (const key of [
    "sceneSlug",
    "sceneZh",
    "sceneEn",
    "products",
    "highlightsZh",
    "highlightsEn",
  ] as const) {
    const value = draft[key];
    if (value !== undefined && value !== null && value !== "") {
      payload[key] = value;
    }
  }

  if (draft.image === null) {
    payload.image = null;
  } else if (draft.image && typeof draft.image === "object") {
    payload.image = (draft.image as StrapiMedia).id ?? draft.image;
  } else if (draft.image != null) {
    payload.image = draft.image;
  }

  if (Array.isArray(draft.gallery)) {
    payload.gallery = (draft.gallery as StrapiMedia[]).map((item) => item.id ?? item);
  } else if (draft.gallery != null) {
    payload.gallery = draft.gallery;
  }

  return payload;
}
