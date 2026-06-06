import Navbar from "@/components/Navbar";
import PageTransitionProvider from "@/components/PageTransitionProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { siteConfig } from "@/lib/seo";
import { Inter, Noto_Sans_SC, Noto_Serif_SC, Playfair_Display } from "next/font/google";
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

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["专业音响", "线阵列", "dBsource", "音响工程", "东莞新声电子"],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* CSS chunk 加载失败时的兜底，避免白底蓝链 */}
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
        <I18nProvider>
          <PageTransitionProvider>
            <Navbar />
            {children}
          </PageTransitionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
