import { getAdminStats } from "@/lib/admin-stats";
import { probeStrapiApi } from "@/lib/cms-health";
import { resolveDataSource } from "@/lib/cms-data-source";
import { getPublicCmsUrl } from "@/lib/media-url";
import { FRONTEND_REVALIDATE_SECONDS, getCmsUrl } from "@/lib/strapi-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  const cmsUrl = getCmsUrl();
  const publicCmsUrl = getPublicCmsUrl();
  const strapiProbe = await probeStrapiApi();
  const cmsOnline = strapiProbe.ok;
  const dataSource = resolveDataSource(cmsOnline);
  const lastCheckedAt = strapiProbe.checkedAt;

  let counts = { products: 0, cases: 0, downloads: 0 };
  if (cmsOnline && !useMockData) {
    try {
      const stats = await getAdminStats();
      counts = {
        products: stats.products,
        cases: stats.cases,
        downloads: stats.downloads,
      };
    } catch {
      /* counts stay zero */
    }
  }

  return Response.json({
    ok: dataSource !== "strapi-error",
    frontend: "online",
    dataSource,
    cmsOnline,
    strapiApiStatus: strapiProbe.status,
    useMockData,
    cmsUrl,
    publicCmsUrl,
    lastCheckedAt,
    errorMessage: strapiProbe.errorMessage ?? null,
    counts,
    env: {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      nodeEnv: process.env.NODE_ENV,
      strapiApiTokenConfigured: Boolean(process.env.STRAPI_API_TOKEN?.trim()),
      revalidateSecretConfigured: Boolean(process.env.REVALIDATE_SECRET?.trim()),
    },
    cache: {
      frontendRevalidateSeconds: FRONTEND_REVALIDATE_SECONDS,
    },
    mobileHint:
      "手机预览请运行 npm run dev:mobile，浏览器访问 http://<本机局域网IP>:3003",
  });
}
