const DEFAULT_CMS_URL = "http://localhost:1337";

export function getCmsUrl(): string {
  return (
    process.env.CMS_URL ||
    process.env.NEXT_PUBLIC_CMS_URL ||
    DEFAULT_CMS_URL
  ).replace(/\/$/, "");
}

export async function fetchStrapiCollection<T>(
  path: string,
  revalidate = 60
): Promise<T[] | null> {
  try {
    const url = `${getCmsUrl()}/api${path}`;
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T[] };
    return Array.isArray(json.data) ? json.data : null;
  } catch {
    return null;
  }
}
