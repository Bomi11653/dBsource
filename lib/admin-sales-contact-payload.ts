type StrapiMediaRef = { id?: number; url?: string } | null | undefined;

const READONLY_KEYS = [
  "documentId",
  "id",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "locale",
  "localizations",
  "createdBy",
  "updatedBy",
] as const;

function mediaId(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as StrapiMediaRef)?.id;
    return typeof id === "number" ? id : undefined;
  }
  return undefined;
}

/** Strip populated relations before Strapi PUT/POST for sales-contact. */
export function serializeSalesContactPayload(
  draft: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...draft };
  for (const key of READONLY_KEYS) {
    delete payload[key];
  }

  const qrImageId = mediaId(payload.qrImage);
  if (qrImageId === null) {
    payload.qrImage = null;
  } else if (typeof qrImageId === "number") {
    payload.qrImage = qrImageId;
  } else {
    delete payload.qrImage;
  }

  if (typeof payload.enabled !== "boolean") {
    payload.enabled = payload.enabled !== false;
  }

  if (payload.sortOrder != null) {
    payload.sortOrder = Number(payload.sortOrder) || 0;
  }

  return payload;
}
