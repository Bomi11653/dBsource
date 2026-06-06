/** About 页配图（裁边后素材，铺满容器无留边） */
export type AboutImages = {
  brandIntro: string;
  origin: string;
  system: readonly [string, string, string];
  focus: string;
  dsp: readonly [string, string, string];
};

export const aboutImages: AboutImages = {
  /** 品牌起源区第一张：东莞工厂 */
  brandIntro: "/about/brand-factory.png",
  /** 品牌起源区第二张：消声室 */
  origin: "/about/anechoic-chamber-trim.png",
  /** 系统解决方案：dBcover 主界面 / EQ / SPL */
  system: [
    "/about/dbcover-home-trim.png",
    "/about/dbcover-eq-trim.png",
    "/about/dbcover-spl-trim.png",
  ] as const,
  /** Focus 手机版 */
  focus: "/about/focus-app-trim.png",
  /** Unit48 硬件 / 布局 / 调音 */
  dsp: [
    "/about/unit48-hardware-trim.png",
    "/about/unit48-layout-trim.png",
    "/about/unit48-eq-trim.png",
  ] as const,
};
