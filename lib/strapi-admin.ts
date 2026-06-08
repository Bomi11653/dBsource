import { getCmsUrl } from "./strapi-client";

export type StrapiAdminResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export function getAdminToken(): string | null {
  return process.env.STRAPI_API_TOKEN?.trim() || null;
}

export function adminTokenConfigured(): boolean {
  return Boolean(getAdminToken());
}

export async function adminStrapiRequest<T = unknown>(
  method: string,
  apiPath: string,
  body?: unknown
): Promise<StrapiAdminResult<T>> {
  const token = getAdminToken();
  if (!token) {
    return { ok: false, error: "未配置 STRAPI_API_TOKEN，请在 .env.local 添加后重启预览。" };
  }

  try {
    const url = `${getCmsUrl()}/api${apiPath}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: errText || `Strapi ${res.status}` };
    }

    if (res.status === 204) return { ok: true };
    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "请求失败" };
  }
}

export async function adminUploadFile(file: File): Promise<
  StrapiAdminResult<{ id: number; url: string }>
> {
  const token = getAdminToken();
  if (!token) {
    return { ok: false, error: "未配置 STRAPI_API_TOKEN" };
  }

  try {
    const form = new FormData();
    form.append("files", file);
    const res = await fetch(`${getCmsUrl()}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }

    const json = (await res.json()) as Array<{ id: number; url: string }>;
    const uploaded = json[0];
    if (!uploaded?.id) return { ok: false, error: "上传响应无效" };
    return { ok: true, data: { id: uploaded.id, url: uploaded.url } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "上传失败" };
  }
}

export const ADMIN_COLLECTIONS = {
  scenes: "scenes",
  products: "products",
  cases: "cases",
  downloads: "downloads",
  "about-sections": "about-sections",
  "qr-codes": "qr-codes",
  leads: "leads",
  "product-series-configs": "product-series-configs",
} as const;

export type AdminCollection = keyof typeof ADMIN_COLLECTIONS;

export function sectionToCollection(section: string): AdminCollection | "contact-info" | null {
  const map: Record<string, AdminCollection | "contact-info"> = {
    home: "scenes",
    products: "products",
    cases: "cases",
    downloads: "downloads",
    about: "about-sections",
    qr: "qr-codes",
    contact: "contact-info",
    series: "product-series-configs",
  };
  return map[section] ?? null;
}
