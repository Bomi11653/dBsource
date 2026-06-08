import { isCmsAvailable } from "@/lib/cms-health";
import { getCmsUrl } from "@/lib/strapi-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
  const cmsUrl = getCmsUrl();
  const cmsOnline = useMock ? false : await isCmsAvailable();

  return Response.json({
    ok: true,
    frontend: "online",
    dataSource: useMock ? "mock" : cmsOnline ? "strapi" : "mock-fallback",
    cms: {
      url: cmsUrl,
      online: cmsOnline,
    },
    env: {
      useMockData: useMock,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    },
    mobileHint:
      "手机预览请运行 npm run dev:mobile，浏览器访问 http://<本机局域网IP>:3003",
  });
}
