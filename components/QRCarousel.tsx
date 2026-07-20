"use client";

import type { QRItem, SocialLinkItem } from "@/data/mock";
import { SafeImageContain } from "@/components/SafeImage";
import { resolveBrowserMediaUrl } from "@/lib/media-url";
import { ArrowRight } from "lucide-react";
import { useI18n } from "./I18nProvider";

/** 各平台跳转链接与简介（按名称关键词匹配，CMS 数据同样适用） */
const PLATFORM_FALLBACKS: {
  match: RegExp;
  url: string;
  platformKey: SocialLinkItem["platformKey"];
  desc: { zh: string; en: string };
}[] = [
  {
    match: /公众号|服务号|service/i,
    platformKey: "wechat",
    url: "https://mp.weixin.qq.com/s/q0hK-l94-osIJJAtLhnuUw",
    desc: { zh: "获取产品资讯\n与技术支持", en: "Product news\n& tech support" },
  },
  {
    match: /抖音|douyin/i,
    platformKey: "douyin",
    url: "https://v.douyin.com/XCka2kfqans/",
    desc: { zh: "关注我们\n发现更多精彩", en: "Follow us for\nmore highlights" },
  },
  {
    match: /视频号|channels/i,
    platformKey: "channels",
    url: "https://weixin.qq.com/sph/ALudYKClo",
    desc: { zh: "了解产品应用\n与案例分享", en: "Applications\n& case stories" },
  },
];

function resolvePlatform(qr: QRItem) {
  const haystack = `${qr.label.zh} ${qr.label.en}`;
  return PLATFORM_FALLBACKS.find((p) => p.match.test(haystack));
}

function resolveSocialUrl(
  qr: QRItem,
  socialLinks?: SocialLinkItem[]
): { url: string; desc: { zh: string; en: string }; qrImage?: string } | null {
  const fallback = resolvePlatform(qr);
  if (!fallback) return null;
  const cms = socialLinks?.find(
    (x) => x.platformKey === fallback.platformKey && x.enabled
  );
  return {
    url: cms?.url || fallback.url,
    desc: fallback.desc,
    qrImage: cms?.qrImage,
  };
}

const HINTS = {
  zh: { visit: "点击访问", empty: "暂未配置链接" },
  en: { visit: "Tap to visit", empty: "Link not configured" },
} as const;

/** 页脚「关注我们」— 手机横滑卡片，电脑三列网格 */
export default function QRCarousel({
  items,
  socialLinks,
}: {
  items: QRItem[];
  socialLinks?: SocialLinkItem[];
}) {
  const { locale, t } = useI18n();
  const hints = HINTS[locale];

  return (
    <div className="max-w-6xl mx-auto page-x pb-8 md:pb-10">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 sm:px-8 py-8 sm:py-10">
        <p className="type-section-label text-center mb-6 sm:mb-8">
          {t.footer.scan}
        </p>
        <div className="filter-scroll sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible gap-3 pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
          {items.map((qr) => {
            const platform = resolveSocialUrl(qr, socialLinks);
            const url = platform?.url ?? "";
            const desc = platform?.desc[locale] ?? "";
            const qrSrc = platform?.qrImage || qr.image;
            const qrKey = resolveBrowserMediaUrl(qrSrc) || qr.id;

            const inner = (
              <>
                <div className="shrink-0 rounded-xl bg-white p-1.5 transition-transform duration-300 group-hover:scale-105">
                  <SafeImageContain
                    key={qrKey}
                    src={qrSrc}
                    alt={qr.label[locale]}
                    size={88}
                    className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px]"
                    priority
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm sm:text-[15px] font-medium text-white leading-snug">
                    {qr.label[locale]}
                  </p>
                  {desc ? (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed whitespace-pre-line group-hover:text-gray-400 transition-colors">
                      {desc}
                    </p>
                  ) : null}
                  <p
                    className={`text-[11px] mt-2 leading-none ${
                      url ? "text-brand-gold/80" : "text-gray-600"
                    }`}
                  >
                    {url ? hints.visit : hints.empty}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                    url
                      ? "border-white/20 text-gray-400 group-hover:border-brand-gold/40 group-hover:text-brand-gold"
                      : "border-white/10 text-gray-700"
                  }`}
                  aria-hidden
                >
                  <ArrowRight size={15} />
                </span>
              </>
            );

            const cardClass =
              "group flex items-center gap-3 sm:gap-4 rounded-2xl border bg-white/[0.03] p-3.5 sm:p-4 transition-all duration-300 shrink-0 w-[min(100%,288px)] sm:w-auto sm:shrink";

            if (!url) {
              return (
                <div
                  key={qr.id}
                  aria-disabled
                  className={`${cardClass} border-white/10 cursor-default opacity-80`}
                >
                  {inner}
                </div>
              );
            }

            return (
              <a
                key={qr.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${qr.label[locale]} - ${hints.visit}`}
                className={`${cardClass} border-white/10 hover:border-white/35 hover:bg-white/[0.06] md:hover:-translate-y-1 touch-active cursor-pointer`}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
