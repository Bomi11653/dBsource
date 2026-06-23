import { resolveBrowserMediaUrl } from "@/lib/media-url";
import { fetchStrapiSingle } from "@/lib/strapi-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const doc = await fetchStrapiSingle<{ logo?: { url?: string } | null }>(
    "/global-setting?populate[logo]=true"
  );
  const logo = resolveBrowserMediaUrl(doc?.logo?.url ?? "") || "/brand/logo.png";
  return Response.json({ logo });
}
