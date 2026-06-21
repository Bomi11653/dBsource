const DEFAULT_CMS_URL = "http://localhost:1337";
const FETCH_TIMEOUT_MS = 8000;
export const FRONTEND_REVALIDATE_SECONDS = 300;

export function getCmsUrl(): string {
  return (
    process.env.CMS_URL ||
    process.env.NEXT_PUBLIC_CMS_URL ||
    DEFAULT_CMS_URL
  ).replace(/\/$/, "");
}

export type StrapiFetchCache = {
  /** ISR revalidate seconds; `false` = no-store */
  revalidate?: number | false;
};

function buildFetchInit(
  init: RequestInit = {},
  cache?: StrapiFetchCache
): RequestInit {
  const revalidate = cache?.revalidate;
  if (revalidate === false || revalidate === 0) {
    return { ...init, cache: "no-store" };
  }
  const seconds =
    typeof revalidate === "number" ? revalidate : FRONTEND_REVALIDATE_SECONDS;
  return { ...init, next: { revalidate: seconds } };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  cache?: StrapiFetchCache
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...buildFetchInit(init, cache),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchStrapiCollection<T>(
  path: string,
  revalidate: number | false = FRONTEND_REVALIDATE_SECONDS
): Promise<T[] | null> {
  try {
    const url = `${getCmsUrl()}/api${path}`;
    const res = await fetchWithTimeout(url, {}, { revalidate });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T[] };
    return Array.isArray(json.data) ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchStrapiSingle<T>(
  path: string,
  revalidate: number | false = FRONTEND_REVALIDATE_SECONDS
): Promise<T | null> {
  try {
    const url = `${getCmsUrl()}/api${path}`;
    const res = await fetchWithTimeout(url, {}, { revalidate });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function postStrapiDocument<T extends Record<string, unknown>>(
  collection: string,
  data: T
): Promise<boolean> {
  try {
    const url = `${getCmsUrl()}/api/${collection}`;
    const token = process.env.STRAPI_API_TOKEN?.trim();
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ data }),
      },
      { revalidate: false }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchStrapiWithToken<T>(
  path: string,
  token: string
): Promise<T | null> {
  try {
    const url = `${getCmsUrl()}/api${path}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      { revalidate: false }
    );
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
