import type { Metadata, Viewport } from "next";
import AdminAwareChrome from "@/components/AdminAwareChrome";
import Analytics from "@/components/Analytics";
import JsonLd from "@/components/JsonLd";
import MaintenanceGate from "@/components/MaintenanceGate";
import PageTransitionProvider from "@/components/PageTransitionProvider";
import { PerformanceModeProvider } from "@/components/PerformanceModeProvider";
import { SeriesConfigProvider } from "@/components/SeriesConfigProvider";
import { SiteDataProvider } from "@/components/SiteDataProvider";
import SmoothScroll from "@/components/SmoothScroll";
import { I18nProvider } from "@/components/I18nProvider";
import { contactInfo as mockContactInfo } from "@/data/mock";
import { getCases, getContactInfo, getDownloads, getProducts } from "@/lib/cms";
import {
  getMaintenanceMessage,
  isMaintenanceMode,
} from "@/lib/maintenance";
import { organizationJsonLd, siteConfig } from "@/lib/seo";
import { getSeriesConfig } from "@/lib/series-config";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["专业音响", "线阵列", "dBsource", "音响工程", "东莞新声电子"],
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.png",
    apple: "/brand/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const maintenance = isMaintenanceMode();
  const maintenanceMessage = getMaintenanceMessage();

  let products: Awaited<ReturnType<typeof getProducts>>;
  let cases: Awaited<ReturnType<typeof getCases>>;
  let downloads: Awaited<ReturnType<typeof getDownloads>>;
  let maintenanceContact = mockContactInfo;

  if (maintenance) {
    products = [];
    cases = [];
    downloads = [];
    try {
      maintenanceContact = await getContactInfo();
    } catch {
      maintenanceContact = mockContactInfo;
    }
  } else {
    [products, cases, downloads] = await Promise.all([
      getProducts(),
      getCases(),
      getDownloads(),
    ]);
  }

  const seriesConfig = await getSeriesConfig(products);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background: #000 !important; color: #fff !important; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Arial, sans-serif; }
              a { color: inherit; text-decoration: none; }
              img, video { max-width: 100%; height: auto; }
              button { font: inherit; color: inherit; background: transparent; border: none; cursor: pointer; }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-black text-white">
        <JsonLd data={organizationJsonLd()} />
        <Analytics />
        <I18nProvider>
          <MaintenanceGate
            enabled={maintenance}
            message={maintenanceMessage}
            contact={maintenanceContact}
          >
            <PerformanceModeProvider>
              <SeriesConfigProvider config={seriesConfig}>
                <SiteDataProvider products={products} cases={cases} downloads={downloads}>
                  <PageTransitionProvider>
                    <SmoothScroll />
                    <AdminAwareChrome>{children}</AdminAwareChrome>
                  </PageTransitionProvider>
                </SiteDataProvider>
              </SeriesConfigProvider>
            </PerformanceModeProvider>
          </MaintenanceGate>
        </I18nProvider>
      </body>
    </html>
  );
}
