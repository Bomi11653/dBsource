/**
 * 生成项目汇报 PPT
 * 运行: npx -y -p pptxgenjs node scripts/generate-project-report-ppt.mjs
 */
import pptxgen from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "dBsource项目汇报.pptx");

const GOLD = "C9A227";
const DARK = "1A1A1A";
const GRAY = "666666";

function addTitleSlide(pptx) {
  const s = pptx.addSlide();
  s.background = { color: DARK };
  s.addText("dBsource 品牌官网", {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: GOLD,
    align: "center",
  });
  s.addText("东莞新声电子科技有限公司 · 项目汇报", {
    x: 0.5,
    y: 2.9,
    w: 9,
    h: 0.6,
    fontSize: 18,
    color: "FFFFFF",
    align: "center",
  });
  s.addText("2026年6月 · v2.1", {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: GRAY,
    align: "center",
  });
}

function addBulletSlide(pptx, title, bullets, note) {
  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.15,
    fill: { color: GOLD },
  });
  s.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: DARK,
  });
  s.addText(bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })), {
    x: 0.6,
    y: 1.3,
    w: 8.8,
    h: 4,
    fontSize: 16,
    color: "333333",
    paraSpaceAfter: 10,
  });
  if (note) {
    s.addText(`【配图】${note}`, {
      x: 0.5,
      y: 5.2,
      w: 9,
      h: 0.5,
      fontSize: 11,
      italic: true,
      color: GRAY,
    });
  }
}

function addTableSlide(pptx, title, headers, rows) {
  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.15,
    fill: { color: GOLD },
  });
  s.addText(title, {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: DARK,
  });
  const tableData = [headers.map((h) => ({ text: h, options: { bold: true, fill: GOLD, color: DARK } }))];
  for (const row of rows) {
    tableData.push(row.map((c) => ({ text: c })));
  }
  s.addTable(tableData, {
    x: 0.4,
    y: 1.1,
    w: 9.2,
    fontSize: 12,
    border: { pt: 0.5, color: "CCCCCC" },
    colW: [2.2, 6.8],
  });
}

async function main() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "dBsource";
  pptx.title = "dBsource 品牌官网项目汇报";

  addTitleSlide(pptx);

  addBulletSlide(pptx, "项目概述", [
    "专业音响品牌 dBsource 官方网站",
    "中英文双语 · 电脑与手机全功能适配",
    "产品展示 + 案例叙事 + 资料下载 + 智能选型 + AI 顾问",
    "运营人员可在 /admin 后台自主更新内容，无需改代码",
  ]);

  addTableSlide(
    pptx,
    "系统架构（三端一体）",
    ["组件", "说明"],
    [
      ["Next.js 前端 :3003", "访客访问：首页、产品、案例、下载、联系、AI"],
      ["自建后台 /admin", "运营日常改内容（推荐）"],
      ["Strapi CMS :1337", "数据存储、媒体库、API"],
    ]
  );

  addBulletSlide(
    pptx,
    "前台核心功能",
    [
      "首页 WebGL 声波动效与品牌主视觉",
      "产品中心：55+ 型号、系列导航、详情图集",
      "工程案例：滚动叙事、多场景筛选",
      "下载中心：分类下载、分享直链、保留文件名",
      "联系页：询盘表单 + 四位销售联系人",
      "智能选型器 + DeepSeek AI 顾问",
    ],
    "截取首页、产品列表、案例页、下载中心、联系页"
  );

  addBulletSlide(
    pptx,
    "后台管理能力（v2.1）",
    [
      "中文分区后台，与网站结构一一对应",
      "搜索过滤、未保存提示、保存不刷新整页",
      "图集网格预览，单张右上角删除",
      "下载：自动识别大小、直传 Strapi 加速上传",
      "一键预览官网对应页面",
    ],
    "截取 /admin 产品编辑与下载中心编辑界面"
  );

  addBulletSlide(
    pptx,
    "移动端方案",
    [
      "npm run dev:mobile 监听局域网",
      "手机访问 http://<电脑IP>:3003",
      "图片经前端 /strapi-uploads 代理，无需改 CMS 地址",
      "功能与电脑端一致（含 WebGL、AI）",
    ],
    "手机浏览器打开产品页截图"
  );

  addTableSlide(
    pptx,
    "技术栈与仓库",
    ["项目", "内容"],
    [
      ["前端", "Next.js 14 · TypeScript · Tailwind"],
      ["动效", "Three.js · Framer Motion"],
      ["CMS", "Strapi 5（cms/ 目录）"],
      ["AI", "DeepSeek API"],
      ["仓库", "github.com/Bomi11653/dBsource"],
    ]
  );

  addBulletSlide(pptx, "建设成果", [
    "✓ 品牌官网全站上线可演示",
    "✓ 44+ 款产品实拍图同步",
    "✓ 下载中心大文件与分享下载",
    "✓ AI 顾问与选型器落地",
    "✓ 运营后台可用、可培训",
  ]);

  addBulletSlide(pptx, "后续规划", [
    "测试环境：云服务器 + HTTPS 域名",
    "正式上线：备案、CDN、定期备份",
    "运营：飞书文档培训 + 内容持续更新",
    "可选：询盘推送企业微信、GA4 统计",
  ]);

  const s = pptx.addSlide();
  s.background = { color: DARK };
  s.addText("谢谢", {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 40,
    bold: true,
    color: GOLD,
    align: "center",
  });
  s.addText("github.com/Bomi11653/dBsource", {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: "AAAAAA",
    align: "center",
  });

  await pptx.writeFile({ fileName: OUT });
  console.log(`已生成: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
