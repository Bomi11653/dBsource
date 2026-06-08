export const SCENE_SEEDS = [
  {
    sortOrder: 1,
    nameZh: '演唱会 / 音乐节',
    nameEn: 'Concerts & Festivals',
    descZh: 'Tour 级系统，均匀覆盖万人场地',
    descEn: 'Tour-grade coverage for 10,000+ venues',
    image: '/images/scenes/scene-1.png',
  },
  {
    sortOrder: 2,
    nameZh: '体育场馆',
    nameEn: 'Stadiums',
    descZh: '远投、语言清晰度与紧急广播一体化',
    descEn: 'Long-throw, speech intelligibility & PA integration',
    image: '/images/scenes/scene-2.png',
  },
  {
    sortOrder: 3,
    nameZh: '会议 / 礼堂',
    nameEn: 'Conference & Auditorium',
    descZh: '优雅外观与可靠语音还原',
    descEn: 'Elegant design with reliable speech reproduction',
    image: '/images/scenes/scene-3.png',
  },
] as const;

export const DOWNLOAD_SEEDS = [
  { sortOrder: 1, nameZh: 'V225A', nameEn: 'V225A', size: '—', type: 'software' as const, subCategory: 'v225a' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 2, nameZh: 'dBcover 0.0.15 Mac', nameEn: 'dBcover 0.0.15 Mac', size: '—', type: 'software' as const, subCategory: 'dbcover-mac' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 3, nameZh: 'dBcover 0.0.15 Win10-11', nameEn: 'dBcover 0.0.15 Win10-11', size: '—', type: 'software' as const, subCategory: 'dbcover-win' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 4, nameZh: 'Unit48-1.11 软件 + 升级包（2026-5-18）', nameEn: 'Unit48-1.11 Software + Update (2026-5-18)', size: '—', type: 'software' as const, subCategory: 'unit48' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 5, nameZh: 'SOLOC（新版）', nameEn: 'SOLOC (New Edition)', size: '—', type: 'software' as const, subCategory: 'soloc' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 6, nameZh: 'V415A / V225A 预设包', nameEn: 'V415A / V225A Preset Pack', size: '—', type: 'software' as const, subCategory: 'preset-pack' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 7, nameZh: 'SOL12SA', nameEn: 'SOL12SA', size: '—', type: 'software' as const, subCategory: 'sol12sa' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 8, nameZh: 'V415A 功放软件', nameEn: 'V415A Amplifier Software', size: '—', type: 'software' as const, subCategory: 'v415a' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 9, nameZh: '2024 产品画册（中文）', nameEn: '2024 Product Catalog (CN)', size: '24 MB', type: 'catalog' as const, subCategory: 'catalog-cn' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 10, nameZh: '2024 Product Catalog (EN)', nameEn: '2024 Product Catalog (EN)', size: '22 MB', type: 'catalog' as const, subCategory: 'catalog-en' as const, cover: '/images/downloads/cover-unit48.png' },
  { sortOrder: 11, nameZh: '工程案例集', nameEn: 'Case Study Portfolio', size: '18 MB', type: 'catalog' as const, subCategory: 'case-study' as const, cover: '/images/downloads/cover-unit48.png' },
] as const;

export const ABOUT_SEEDS = [
  { sectionKey: 'brandIntro' as const, sortOrder: 1, titleZh: '东莞工厂', titleEn: 'Dongguan Factory', image: '/about/brand-factory.png' },
  { sectionKey: 'origin' as const, sortOrder: 2, titleZh: '消声室', titleEn: 'Anechoic Chamber', image: '/about/anechoic-chamber-trim.png' },
  { sectionKey: 'dbcoverHome' as const, sortOrder: 3, titleZh: 'dBcover 主界面', titleEn: 'dBcover Home', image: '/about/dbcover-home-trim.png' },
  { sectionKey: 'dbcoverEq' as const, sortOrder: 4, titleZh: 'dBcover EQ', titleEn: 'dBcover EQ', image: '/about/dbcover-eq-trim.png' },
  { sectionKey: 'dbcoverSpl' as const, sortOrder: 5, titleZh: 'dBcover SPL', titleEn: 'dBcover SPL', image: '/about/dbcover-spl-trim.png' },
  { sectionKey: 'focus' as const, sortOrder: 6, titleZh: 'Focus 声学软件', titleEn: 'Focus Acoustic Software', image: '/about/focus-app-trim.png' },
  { sectionKey: 'unit48Hardware' as const, sortOrder: 7, titleZh: 'Unit48 硬件', titleEn: 'Unit48 Hardware', image: '/about/unit48-hardware-trim.png' },
  { sectionKey: 'unit48Layout' as const, sortOrder: 8, titleZh: 'Unit48 布局', titleEn: 'Unit48 Layout', image: '/about/unit48-layout-trim.png' },
  { sectionKey: 'unit48Eq' as const, sortOrder: 9, titleZh: 'Unit48 调音', titleEn: 'Unit48 EQ', image: '/about/unit48-eq-trim.png' },
] as const;

/** 11 个有产品的系列 visible=true；4 个空系列 visible=false */
export const PRODUCT_SERIES_SEEDS = [
  { sortOrder: 1, slug: 'la', seriesGroup: 'speaker' as const, nameZh: 'LA 线阵列音箱', nameEn: 'LA Line Array', modelPrefix: 'LA', featuredProductId: 1, visible: true },
  { sortOrder: 2, slug: 'lw', seriesGroup: 'speaker' as const, nameZh: 'LW 中远程防水音箱', nameEn: 'LW Medium-Throw IP', modelPrefix: 'LW', featuredProductId: 10, visible: true },
  { sortOrder: 3, slug: 'mi', seriesGroup: 'speaker' as const, nameZh: 'MI 返送音箱', nameEn: 'MI Stage Monitor', modelPrefix: 'MI', featuredProductId: 19, visible: true },
  { sortOrder: 4, slug: 'do', seriesGroup: 'speaker' as const, nameZh: 'DO 多功能全频音箱', nameEn: 'DO Full-Range', modelPrefix: 'DO', featuredProductId: 21, visible: true },
  { sortOrder: 5, slug: 'sol', seriesGroup: 'speaker' as const, nameZh: 'SOL 多功能防水音柱', nameEn: 'SOL IP Column', modelPrefix: 'SOL', featuredProductId: 31, visible: true },
  { sortOrder: 6, slug: 'k', seriesGroup: 'speaker' as const, nameZh: 'K 系列娱乐音箱', nameEn: 'K Entertainment', modelPrefix: 'K', featuredProductId: 34, visible: true },
  { sortOrder: 7, slug: 're', seriesGroup: 'speaker' as const, nameZh: 'RE 全频音箱', nameEn: 'RE Full-Range', modelPrefix: 'RE', featuredProductId: 38, visible: true },
  { sortOrder: 8, slug: 'tour', seriesGroup: 'speaker' as const, nameZh: '流动演出系统', nameEn: 'Touring Systems', modelPrefix: 'V', featuredProductId: 42, visible: true },
  { sortOrder: 9, slug: 'electronics', seriesGroup: 'speaker' as const, nameZh: '电子产品', nameEn: 'Electronics', modelPrefix: 'EL', featuredProductId: 52, visible: true },
  { sortOrder: 10, slug: 'unit48', seriesGroup: 'dsp' as const, nameZh: 'unit48 系列', nameEn: 'unit48 Series', modelPrefix: 'Unit48', featuredProductId: 54, visible: true },
  { sortOrder: 11, slug: 'suite', seriesGroup: 'software' as const, nameZh: 'dBcover 软件', nameEn: 'dBcover Software', modelPrefix: 'dBcover', featuredProductId: 55, visible: true },
  { sortOrder: 12, slug: 'turnkey', seriesGroup: 'engineering' as const, nameZh: '工程方案', nameEn: 'Engineering', modelPrefix: 'SI', featuredProductId: 14, visible: true },
  { sortOrder: 13, slug: 'p', seriesGroup: 'speaker' as const, nameZh: 'P 系列塑胶音箱', nameEn: 'P Plastic Enclosure', modelPrefix: 'P', featuredProductId: 8, visible: false },
  { sortOrder: 14, slug: 'driver', seriesGroup: 'speaker' as const, nameZh: '喇叭单元', nameEn: 'Drivers', modelPrefix: 'DU', featuredProductId: 9, visible: false },
  { sortOrder: 15, slug: 'accessory', seriesGroup: 'speaker' as const, nameZh: '配件', nameEn: 'Accessories', modelPrefix: 'AC', featuredProductId: 11, visible: false },
] as const;

export type ProductSeed = {
  sortOrder: number;
  model: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  detailZh: string;
  detailEn: string;
  specsZh: string;
  specsEn: string;
  seriesZh: string;
  seriesEn: string;
  productLine: string;
  seriesGroup: string;
  category: string;
  image: string;
  gallery: string[];
};
