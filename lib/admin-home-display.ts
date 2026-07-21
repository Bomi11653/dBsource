import { translations } from "@/lib/i18n";
import { PAGE_SEO } from "@/lib/seo";

/** 后台 Hero 管理只读展示（前台文案来自 i18n） */
export const ADMIN_HERO_COPY = {
  slogan: {
    zh: translations.zh.hero.slogan,
    en: translations.en.hero.slogan,
  },
  animationNote:
    "首屏 WebGL 波浪动画由前端代码渲染；性能模式下自动降级为静态背景。",
} as const;

/** 后台首页 SEO 只读展示（前台 metadata 来自 lib/seo.ts） */
export const ADMIN_HOME_SEO = PAGE_SEO.home;
