import { looksLikeCoordPair, parseCoordsFromMapQuery } from "@/lib/amap-map";
import { fetchMapPreviewImage } from "@/lib/map-preview";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lng = Number(searchParams.get("lng"));
  const lat = Number(searchParams.get("lat"));

  if (!looksLikeCoordPair(lng, lat)) {
    const query = searchParams.get("q")?.trim();
    if (query) {
      const parsed = parseCoordsFromMapQuery(query);
      if (parsed) {
        const preview = await fetchMapPreviewImage(parsed);
        return new Response(preview.body, {
          headers: {
            "Content-Type": preview.contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    }
    return new Response("Invalid coordinates", { status: 400 });
  }

  const preview = await fetchMapPreviewImage({ lng, lat });
  return new Response(preview.body, {
    headers: {
      "Content-Type": preview.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
