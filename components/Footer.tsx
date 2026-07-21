"use client";

import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { useI18n } from "./I18nProvider";

const ICP_NUMBER = "粤ICP备2025373674号";
const ICP_URL = "https://beian.miit.gov.cn/";

/** 全站统一页脚：Logo + 版权（无品牌介绍段落） */
export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-12 md:mt-24 border-t border-white/10 bg-black text-white">
      <div className="max-w-6xl mx-auto page-x py-10 md:py-14 text-center">
        <Link href="/" className="inline-block touch-active" aria-label="dBsource">
          <BrandLogo variant="nav" />
        </Link>
      </div>

      <div className="border-t border-white/10 page-x pb-page-safe pt-6 space-y-2 text-center">
        <p className="text-xs text-gray-500">{t.footer.rights}</p>
        <p className="text-xs text-gray-600">
          <a
            href={ICP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors touch-active"
          >
            {ICP_NUMBER}
          </a>
        </p>
      </div>
    </footer>
  );
}
