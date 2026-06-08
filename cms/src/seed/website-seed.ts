import fs from 'fs';
import path from 'path';
import type { Core } from '@strapi/strapi';
import {
  ABOUT_SEEDS,
  DOWNLOAD_SEEDS,
  PRODUCT_SERIES_SEEDS,
  SCENE_SEEDS,
  type ProductSeed,
} from './seed-data';

const DEFAULT_PUBLIC =
  'C:\\Users\\Administrator\\Desktop\\dbsource\\dbsource-audio-site\\public';

type SceneSlug =
  | 'stadium'
  | 'festival'
  | 'livehouse'
  | 'convention'
  | 'corporate'
  | 'auditorium';

type CaseSeed = {
  legacyId: number;
  sortOrder: number;
  type: 'engineering' | 'performance';
  sceneSlug: SceneSlug;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  detailZh: string;
  detailEn: string;
  sceneZh: string;
  sceneEn: string;
  products: string;
  highlightsZh: string[];
  highlightsEn: string[];
  cover: string;
  gallery: string[];
};

const CASE_SEEDS: CaseSeed[] = [
  {
    legacyId: 1,
    sortOrder: 1,
    type: 'engineering',
    sceneSlug: 'livehouse',
    titleZh: 'AK Live House',
    titleEn: 'AK Live House',
    descZh: '万江 AK Live House，dBsource 音响系统稳定运营一周年',
    descEn: 'Wanjiang AK Live House — one year of reliable dBsource sound',
    detailZh:
      '万江 AK Live House 采用 dBsource 专业音响系统，自投入使用以来已稳定经营一年。系统覆盖主扩、超低与舞台监听需求，满足日常演出与活动混音，成为东莞万江地区具有代表性的 Live House 声场案例。',
    detailEn:
      'Wanjiang AK Live House runs on dBsource professional audio and has operated reliably for one year, covering mains, subs and stage monitoring for daily shows and events.',
    sceneZh: 'Live House',
    sceneEn: 'Live House',
    products: 'dBsource 全系统',
    highlightsZh: ['稳定运营一年', '万江 Live House', 'dBsource 全系统'],
    highlightsEn: ['One year operation', 'Wanjiang venue', 'Full dBsource system'],
    cover: '/images/cases/1/01.jpg',
    gallery: [
      '/images/cases/1/01.jpg',
      '/images/cases/1/02.jpg',
      '/images/cases/1/03.jpg',
      '/images/cases/1/04.jpg',
      '/images/cases/1/05.jpg',
      '/images/cases/1/06.jpg',
      '/images/cases/1/07.jpg',
      '/images/cases/1/08.jpg',
      '/images/cases/1/09.jpg',
      '/images/cases/1/10.jpg',
      '/images/cases/1/11.jpg',
      '/images/cases/1/12.jpg',
      '/images/cases/1/13.jpg',
      '/images/cases/1/14.jpg',
      '/images/cases/1/15.jpg',
      '/images/cases/1/16.jpg',
    ],
  },
  {
    legacyId: 2,
    sortOrder: 2,
    type: 'engineering',
    sceneSlug: 'livehouse',
    titleZh: '梅州 YoYo Music',
    titleEn: 'Meizhou YoYo Music',
    descZh: 'DO 系列主扩 + 多路乐队输入，精宏音响科技交付',
    descEn: 'DO-series PA with full band I/O — Jinghong AV integration',
    detailZh:
      '工程案例：梅州 YoYo Music。音响配置：dBsource DO115 × 16、D0118S × 8、D0218S × 2。乐队配置：鼓麦 11 只、bass 1 路、吉他 2 路、键盘 6 路、伴唱 3 路、歌手 6 路、Cue 麦 5 路。在此再次感谢广东精宏音响科技有限公司的支持与协作。',
    detailEn:
      'Meizhou YoYo Music: dBsource DO115 ×16, D0118S ×8, D0218S ×2. Band I/O includes 11 drum mics, bass, guitars, keys, BVs, vocals and cue mixes. Delivered with Guangdong Jinghong Audio Technology.',
    sceneZh: '演艺空间',
    sceneEn: 'Music Venue',
    products: 'DO115 ×16, D0118S ×8, D0218S ×2',
    highlightsZh: ['DO115 ×16', '34 路乐队输入', '精宏音响科技'],
    highlightsEn: ['DO115 ×16', '34-channel band I/O', 'Jinghong AV'],
    cover: '/images/cases/2/01.png',
    gallery: [
      '/images/cases/2/01.png',
      '/images/cases/2/02.png',
      '/images/cases/2/03.png',
      '/images/cases/2/04.png',
      '/images/cases/2/05.png',
      '/images/cases/2/06.png',
      '/images/cases/2/07.png',
    ],
  },
  {
    legacyId: 3,
    sortOrder: 6,
    type: 'performance',
    sceneSlug: 'auditorium',
    titleZh: '乐山师范学院 2025 年迎新晚会',
    titleEn: 'Leshan Normal University Welcome Gala 2025',
    descZh: 'VIT 音响系统护航全校迎新文艺晚会',
    descEn: 'VIT sound system for the university welcome gala',
    detailZh:
      '乐山师范学院 2025 年迎新晚会采用 VIT 音响系统，为全校师生呈现高清晰度、高动态的现场听感。系统覆盖礼堂主扩声与舞台监听，满足合唱、舞蹈、器乐等多元节目形式。',
    detailEn:
      "Leshan Normal University's 2025 welcome gala used a VIT sound system for clear, dynamic coverage across choral, dance and instrumental programs.",
    sceneZh: '校园礼堂',
    sceneEn: 'Campus Auditorium',
    products: 'VIT 音响系统',
    highlightsZh: ['全校迎新晚会', 'VIT 系统', '多节目形式覆盖'],
    highlightsEn: ['Campus welcome gala', 'VIT system', 'Multi-format shows'],
    cover: '/images/cases/3/01.jpg',
    gallery: ['/images/cases/3/01.jpg'],
  },
  {
    legacyId: 4,
    sortOrder: 3,
    type: 'engineering',
    sceneSlug: 'corporate',
    titleZh: '乌兰浩特 城市声场',
    titleEn: 'Ulanhot Urban Soundscape',
    descZh: '城市公共声场扩声系统工程交付',
    descEn: 'Urban public sound field engineering project',
    detailZh:
      '乌兰浩特城市声场项目采用 dBsource 专业音响系统，为城市公共声场空间提供稳定、均匀、清晰的扩声覆盖，满足日常广播与大型活动需求。',
    detailEn:
      'The Ulanhot urban soundscape project deploys dBsource systems for stable, even PA coverage across public spaces and events.',
    sceneZh: '城市声场',
    sceneEn: 'Urban PA',
    products: 'dBsource 扩声系统',
    highlightsZh: ['城市公共声场', '均匀覆盖', '大型活动支持'],
    highlightsEn: ['Urban sound field', 'Even coverage', 'Event-ready'],
    cover: '/images/cases/4/01.jpg',
    gallery: [
      '/images/cases/4/01.jpg',
      '/images/cases/4/02.jpg',
      '/images/cases/4/03.jpg',
      '/images/cases/4/04.jpg',
      '/images/cases/4/05.jpg',
      '/images/cases/4/06.jpg',
      '/images/cases/4/07.jpg',
      '/images/cases/4/08.jpg',
      '/images/cases/4/09.jpg',
      '/images/cases/4/10.jpg',
      '/images/cases/4/11.jpg',
      '/images/cases/4/12.jpg',
      '/images/cases/4/13.jpg',
      '/images/cases/4/14.jpg',
      '/images/cases/4/15.jpg',
      '/images/cases/4/16.jpg',
      '/images/cases/4/17.jpg',
      '/images/cases/4/18.png',
      '/images/cases/4/19.png',
    ],
  },
  {
    legacyId: 5,
    sortOrder: 5,
    type: 'performance',
    sceneSlug: 'festival',
    titleZh: '贵州大方彝族新年晚会',
    titleEn: 'Guizhou Dafang Yi New Year Gala',
    descZh: '奢香故里庆彝年，58 只 dBsource 音箱打造精准声场',
    descEn: '58 dBsource loudspeakers for the Yi New Year celebration',
    detailZh:
      '2025 年贵州「彝族新年」晚会在大方隆重举行，活动以「奢香故里庆彝年·民族团结谱新篇」为主题，展现彝族文化的独特魅力。精彩纷呈的文艺演出在灯光秀中拉开帷幕；现场旋律优美，舞姿翩跹，由 dBsource 音响系统带来的精准声场还原，更让每首乐曲都焕发出最动人的光彩，将这场彝族新年晚会的魅力推向极致。\n\n本场晚会采用 dBsource V12 线阵列音箱 16 只，V18/V21 超低频箱 16 只，206M 返听音箱 12 只，DO 系列辅助音箱 12 只及监听音箱等共计 58 只；整个系统角度精准、能量集中，完美覆盖整个晚会现场。无论是细腻的民谣吟唱，还是炸裂的电子节奏，这套系统都能精准还原每一刻的乐感，让每位观众都能感受到最真实的音乐感受。',
    detailEn:
      'The 2025 Yi New Year gala in Dafang, Guizhou featured 58 dBsource loudspeakers — V12 line arrays, V18/V21 subs, 206M monitors and DO fills — delivering precise coverage from folk ballads to electronic peaks.',
    sceneZh: '民族晚会',
    sceneEn: 'Cultural Gala',
    products: 'V12 ×16, V18/V21 ×16, 206M ×12, DO ×12 等共 58 只',
    highlightsZh: ['58 只音箱', 'V12 线阵列', '彝族新年晚会'],
    highlightsEn: ['58 loudspeakers', 'V12 line array', 'Yi New Year gala'],
    cover: '/images/cases/5/01.png',
    gallery: [
      '/images/cases/5/01.png',
      '/images/cases/5/02.png',
      '/images/cases/5/03.png',
      '/images/cases/5/04.png',
      '/images/cases/5/05.png',
      '/images/cases/5/06.png',
      '/images/cases/5/07.png',
      '/images/cases/5/08.png',
      '/images/cases/5/09.png',
      '/images/cases/5/10.png',
      '/images/cases/5/11.png',
    ],
  },
  {
    legacyId: 6,
    sortOrder: 4,
    type: 'performance',
    sceneSlug: 'festival',
    titleZh: '贵州大方第一中学百年校庆',
    titleEn: 'Dafang No.1 Middle School Centenary Gala',
    descZh: '百年校庆文艺晚会，68 只 dBsource 系统覆盖全校师生',
    descEn: 'Centenary gala with 68 dBsource loudspeakers on campus',
    detailZh:
      '贵州大方第一中学建校 100 周年文艺晚会在新校区隆重举行，灯光璀璨，人头攒动，欢声盈耳，几千名师生及历届校友代表欢聚一堂，共同回顾百年峥嵘，启航崭新征程。晚会华章在掌声中开启，当《长大后我就成了你》旋律响起，许多两鬓斑白的校友情不自禁轻声跟唱，手中摇曳的点点星光，汇成一片温暖的星海，将深厚的师生情谊渲染到极致。校歌《翰墨飘香》的旋律响彻云霄，全体师生校友齐声高唱，激昂的歌声在夜空中久久回荡。\n\n本场晚会采用 dBsource V12 线阵列音箱 16 只，V18/V21 超低频箱 16 只，206M 返听音箱 12 只，LA 系列辅助音箱及监听音箱等共计 68 只；整个系统角度精准、能量集中，完美覆盖整个晚会现场。无论是细腻的民谣吟唱，还是劲爆的摇滚乐表演，这套系统都能精准还原每一刻的乐感，让每位师生都能感受到最真实的音乐感受。',
    detailEn:
      "Dafang No.1 Middle School's centenary gala welcomed thousands of students and alumni with 68 dBsource boxes — V12 arrays, V18/V21 subs, 206M monitors and LA fills — covering folk and rock performances with precision.",
    sceneZh: '百年校庆',
    sceneEn: 'Centenary',
    products: 'V12 ×16, V18/V21 ×16, 206M ×12, LA 系列等共 68 只',
    highlightsZh: ['建校 100 周年', '68 只音箱', '全校师生覆盖'],
    highlightsEn: ['100th anniversary', '68 loudspeakers', 'Full campus coverage'],
    cover: '/images/cases/6/01.png',
    gallery: [
      '/images/cases/6/01.png',
      '/images/cases/6/02.png',
      '/images/cases/6/03.png',
      '/images/cases/6/04.png',
      '/images/cases/6/05.png',
      '/images/cases/6/06.png',
      '/images/cases/6/07.png',
      '/images/cases/6/08.png',
    ],
  },
];

const QR_SEEDS = [
  {
    sortOrder: 1,
    labelZh: '微信服务号',
    labelEn: 'WeChat Service',
    image: '/images/qr/wechat-service.png',
  },
  {
    sortOrder: 2,
    labelZh: '抖音',
    labelEn: 'Douyin',
    image: '/images/qr/douyin.png',
  },
  {
    sortOrder: 3,
    labelZh: '视频号',
    labelEn: 'WeChat Channels',
    image: '/images/qr/channels.png',
  },
];

function mimeFor(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function uploadPublicFile(
  strapi: Core.Strapi,
  publicRoot: string,
  publicPath: string,
  cache: Map<string, number>
): Promise<number> {
  const cached = cache.get(publicPath);
  if (cached) return cached;

  const absolute = path.join(publicRoot, publicPath.replace(/^\//, ''));
  if (!fs.existsSync(absolute)) {
    throw new Error(`[seed] Missing file: ${absolute}`);
  }

  const stat = fs.statSync(absolute);
  const name = path.basename(absolute);
  const type = mimeFor(path.extname(name));

  const [file] = await strapi.plugin('upload').service('upload').upload({
    data: {
      fileInfo: {
        name,
        alternativeText: name,
        caption: '',
      },
    },
    files: {
      filepath: absolute,
      originalFilename: name,
      mimetype: type,
      size: stat.size,
    },
  });

  const id = file.id as number;
  cache.set(publicPath, id);
  return id;
}

function loadProductSeeds(): ProductSeed[] {
  const jsonPath = path.resolve(process.cwd(), 'src/seed/products.json');
  if (!fs.existsSync(jsonPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as ProductSeed[];
}

export async function seedWebsiteContent(strapi: Core.Strapi) {
  const publicRoot = process.env.WEBSITE_PUBLIC_PATH || DEFAULT_PUBLIC;
  if (!fs.existsSync(publicRoot)) {
    strapi.log.warn(`[seed] WEBSITE_PUBLIC_PATH not found: ${publicRoot}`);
    return;
  }

  const uploadCache = new Map<string, number>();

  const caseCount = await strapi.documents('api::case.case').count({});
  if (caseCount === 0) {
    strapi.log.info('[seed] Importing 6 cases from website public assets…');
    for (const item of CASE_SEEDS) {
      const coverId = await uploadPublicFile(strapi, publicRoot, item.cover, uploadCache);
      const galleryIds: number[] = [];
      for (const rel of item.gallery) {
        galleryIds.push(await uploadPublicFile(strapi, publicRoot, rel, uploadCache));
      }

      await strapi.documents('api::case.case').create({
        data: {
          legacyId: item.legacyId,
          sortOrder: item.sortOrder,
          type: item.type,
          sceneSlug: item.sceneSlug,
          titleZh: item.titleZh,
          titleEn: item.titleEn,
          descZh: item.descZh,
          descEn: item.descEn,
          detailZh: item.detailZh,
          detailEn: item.detailEn,
          sceneZh: item.sceneZh,
          sceneEn: item.sceneEn,
          products: item.products,
          highlightsZh: item.highlightsZh,
          highlightsEn: item.highlightsEn,
          image: coverId,
          gallery: galleryIds,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] Case legacyId=${item.legacyId} published.`);
    }
  }

  const qrCount = await strapi.documents('api::qr-code.qr-code').count({});
  if (qrCount === 0) {
    strapi.log.info('[seed] Importing 3 QR codes…');
    for (const item of QR_SEEDS) {
      const imageId = await uploadPublicFile(strapi, publicRoot, item.image, uploadCache);
      await strapi.documents('api::qr-code.qr-code').create({
        data: {
          sortOrder: item.sortOrder,
          labelZh: item.labelZh,
          labelEn: item.labelEn,
          image: imageId,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] QR "${item.labelZh}" published.`);
    }
  }

  const sceneCount = await strapi.documents('api::scene.scene').count({});
  if (sceneCount === 0) {
    strapi.log.info('[seed] Importing 3 scenes…');
    for (const item of SCENE_SEEDS) {
      const imageId = await uploadPublicFile(strapi, publicRoot, item.image, uploadCache);
      await strapi.documents('api::scene.scene').create({
        data: {
          sortOrder: item.sortOrder,
          nameZh: item.nameZh,
          nameEn: item.nameEn,
          descZh: item.descZh,
          descEn: item.descEn,
          image: imageId,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] Scene "${item.nameZh}" published.`);
    }
  }

  const aboutCount = await strapi.documents('api::about-section.about-section').count({});
  if (aboutCount === 0) {
    strapi.log.info('[seed] Importing 9 about sections…');
    for (const item of ABOUT_SEEDS) {
      const imageId = await uploadPublicFile(strapi, publicRoot, item.image, uploadCache);
      await strapi.documents('api::about-section.about-section').create({
        data: {
          sectionKey: item.sectionKey,
          sortOrder: item.sortOrder,
          titleZh: item.titleZh,
          titleEn: item.titleEn,
          image: imageId,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] About "${item.sectionKey}" published.`);
    }
  }

  const downloadCount = await strapi.documents('api::download.download').count({});
  if (downloadCount === 0) {
    strapi.log.info('[seed] Importing 11 downloads…');
    for (const item of DOWNLOAD_SEEDS) {
      const coverId = await uploadPublicFile(strapi, publicRoot, item.cover, uploadCache);
      await strapi.documents('api::download.download').create({
        data: {
          sortOrder: item.sortOrder,
          nameZh: item.nameZh,
          nameEn: item.nameEn,
          size: item.size,
          fileUrl: '#',
          type: item.type,
          subCategory: item.subCategory,
          cover: coverId,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] Download "${item.nameZh}" published (fileUrl=# placeholder).`);
    }
  }

  const productCount = await strapi.documents('api::product.product').count({});
  const productSeeds = loadProductSeeds();
  if (productCount === 0 && productSeeds.length > 0) {
    strapi.log.info(`[seed] Importing ${productSeeds.length} products…`);
    for (const item of productSeeds) {
      const imageId = item.image
        ? await uploadPublicFile(strapi, publicRoot, item.image, uploadCache)
        : undefined;
      const galleryIds: number[] = [];
      for (const rel of item.gallery ?? []) {
        galleryIds.push(await uploadPublicFile(strapi, publicRoot, rel, uploadCache));
      }

      const productData = {
        sortOrder: item.sortOrder,
        model: item.model,
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        descZh: item.descZh,
        descEn: item.descEn,
        detailZh: item.detailZh,
        detailEn: item.detailEn,
        specsZh: item.specsZh,
        specsEn: item.specsEn,
        seriesZh: item.seriesZh,
        seriesEn: item.seriesEn,
        productLine: item.productLine,
        seriesGroup: item.seriesGroup,
        category: item.category,
        image: imageId,
        gallery: galleryIds.length ? galleryIds : undefined,
      };

      await strapi.documents('api::product.product').create({
        data: productData as never,
        status: 'published',
      });
    }
    strapi.log.info(`[seed] ${productSeeds.length} products published.`);
  }

  const seriesCount = await strapi.documents('api::product-series.product-series').count({});
  if (seriesCount === 0) {
    strapi.log.info(`[seed] Importing ${PRODUCT_SERIES_SEEDS.length} product series…`);
    for (const item of PRODUCT_SERIES_SEEDS) {
      await strapi.documents('api::product-series.product-series').create({
        data: {
          slug: item.slug,
          seriesGroup: item.seriesGroup,
          nameZh: item.nameZh,
          nameEn: item.nameEn,
          modelPrefix: item.modelPrefix,
          sortOrder: item.sortOrder,
          visible: item.visible,
          featuredProductId: item.featuredProductId,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] Series "${item.slug}" published (visible=${item.visible}).`);
    }
  }

  const existingContact = await strapi.documents('api::contact-info.contact-info').findFirst({});
  if (!existingContact) {
    await strapi.documents('api::contact-info.contact-info').create({
      data: {
        companyZh: '东莞新声电子科技有限公司',
        companyEn: 'Dongguan Xinsheng Electronics Technology Co., Ltd.',
        phones: '15362862396\n13713323136',
        email: '939611016@qq.com',
        addressZh: '广东省东莞市万江街道莫屋新丰西三路1号',
        addressEn: 'No.1 Xinfeng West 3rd Rd, Mowu, Wanjiang, Dongguan, Guangdong',
        mapQuery: '广东省东莞市万江街道莫屋新丰西三路1号',
        footerIntroZh:
          'dBsource 专注专业音响系统研发与工程交付，为演出、体育、政企等场景提供从设计到调试的一站式声场解决方案。',
        footerIntroEn:
          'dBsource delivers professional audio systems and turnkey sound solutions for live events, sports venues and corporate projects.',
      },
      status: 'published',
    });
    strapi.log.info('[seed] ContactInfo published.');
  }

  strapi.log.info('[seed] Website content import complete.');
}
