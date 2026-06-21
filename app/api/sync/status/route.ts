import { getAdminStats } from "@/lib/admin-stats";
import { isCmsAvailable } from "@/lib/cms-health";
import { getCmsUrl } from "@/lib/strapi-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  const cmsUrl = getCmsUrl();
  const cmsOnline = useMock ? false : await isCmsAvailable();

  let dataSource: "mock" | "strapi" | "mock-fallback";
  if (useMock) dataSource = "mock";
  else if (cmsOnline) dataSource = "strapi";
  else dataSource = "mock-fallback";

  let counts = { products: 0, cases: 0, downloads: 0 };
  if (cmsOnline && !useMock) {
    const stats = await getAdminStats();
    counts = {
      products: stats.products,
      cases: stats.cases,
      downloads: stats.downloads,
    };
  }

  return Response.json({
    ok: true,
    frontend: "online",
    dataSource,
    cms: {
      url: cmsUrl,
      online: cmsOnline,
    },
    counts,
    env: {
      useMockData: useMock,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      nodeEnv: process.env.NODE_ENV,
    },
    cache: {
      frontendRevalidateSeconds: 300,
    },
    mobileHint:
      "手机预览请运行 npm run dev:mobile，浏览器访问 http://<本机局域网IP>:3003",
  });
}
