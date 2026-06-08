import AdminAwareChrome from "@/components/AdminAwareChrome";
import Analytics from "@/components/Analytics";
import JsonLd from "@/components/JsonLd";
import PageTransitionProvider from "@/components/PageTransitionProvider";
import { SeriesConfigProvider } from "@/components/SeriesConfigProvider";
import { SiteDataProvider } from "@/components/SiteDataProvider";
import SmoothScroll from "@/components/SmoothScroll";
import { I18nProvider } from "@/components/I18nProvider";
import { getCases, getDownloads, getProducts } from "@/lib/cms";
import { organizationJsonLd, siteConfig } from "@/lib/seo";
import { getSeriesConfig } from "@/lib/series-config";
import { Inter, Noto_Sans_SC, Noto_Serif_SC, Playfair_Display } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";

const fontMainLatin = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fontAccentLatin = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const fontMainCJK = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-han-sans",
  display: "swap",
});

const fontAccentCJK = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-han-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata = {
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
  const [products, cases, downloads] = await Promise.all([
    getProducts(),
    getCases(),
    getDownloads(),
  ]);
  const seriesConfig = await getSeriesConfig(products);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background: #000 !important; color: #fff !important; margin: 0; font-family: Inter, "Source Han Sans SC", -apple-system, sans-serif; letter-spacing: 0.02em; }
              a { color: inherit; text-decoration: none; }
              img, video { max-width: 100%; height: auto; }
              button { font: inherit; color: inherit; background: transparent; border: none; cursor: pointer; }
            `,
          }}
        />
      </head>
      <body
        className={`${fontMainLatin.variable} ${fontAccentLatin.variable} ${fontMainCJK.variable} ${fontAccentCJK.variable} font-sans antialiased bg-black text-white`}
      >
        <JsonLd data={organizationJsonLd()} />
        <Analytics />
        <I18nProvider>
          <SeriesConfigProvider config={seriesConfig}>
            <SiteDataProvider products={products} cases={cases} downloads={downloads}>
              <PageTransitionProvider>
                <SmoothScroll />
                <AdminAwareChrome>{children}</AdminAwareChrome>
              </PageTransitionProvider>
            </SiteDataProvider>
          </SeriesConfigProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
