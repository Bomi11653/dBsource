import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images");

const files = [
  ["product-1.svg", "X1 Line Array", "#1a1a2e"],
  ["product-2.svg", "S9 Sub", "#16213e"],
  ["product-3.svg", "M6 Monitor", "#0f3460"],
  ["product-4.svg", "P4 Point", "#1a1a2e"],
  ["case-1.svg", "Stadium", "#3d2b1f"],
  ["case-2.svg", "Live House", "#2a1a3a"],
  ["case-3.svg", "Convention", "#1f3d3d"],
  ["scene-1.svg", "Concert", "#2d1b4e"],
  ["scene-2.svg", "Stadium", "#1e3a5f"],
  ["scene-3.svg", "Conference", "#1a3a2e"],
  ["qr-wechat.svg", "WeChat", "#ffffff"],
  ["qr-wecom.svg", "WeCom", "#ffffff"],
  ["qr-douyin.svg", "Douyin", "#ffffff"],
  ["qr-video.svg", "Video", "#ffffff"],
];

function svg(label, bg, qr = false) {
  const size = qr ? 200 : 800;
  const h = qr ? 200 : 500;
  if (qr) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">
      <rect width="${size}" height="${h}" fill="${bg}"/>
      <rect x="30" y="30" width="140" height="140" fill="none" stroke="#333" stroke-width="4"/>
      <rect x="50" y="50" width="30" height="30" fill="#333"/><rect x="120" y="50" width="30" height="30" fill="#333"/>
      <rect x="50" y="120" width="30" height="30" fill="#333"/><rect x="120" y="120" width="30" height="30" fill="#333"/>
      <text x="100" y="185" text-anchor="middle" fill="#666" font-size="12" font-family="system-ui">${label}</text>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#0a0a0a"/></linearGradient></defs>
    <rect width="${size}" height="${h}" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#2eb896" font-size="28" font-family="system-ui">${label}</text>
  </svg>`;
}

const aboutRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "about");
const aboutFiles = [
  ["1.svg", "工厂 · 生产线", "#1a1a2e"],
  ["2.svg", "消声室", "#16213e"],
  ["3.svg", "实验室", "#0f3460"],
  ["4.svg", "演示厅", "#1e3a5f"],
  ["5.svg", "Focus 软件", "#2d1b4e"],
  ["6.svg", "unit48 · 01", "#1a1a2e"],
  ["7.svg", "unit48 · 02", "#16213e"],
  ["8.svg", "unit48 · 03", "#0f3460"],
];

mkdirSync(root, { recursive: true });
for (const [name, label, color] of files) {
  const isQr = name.startsWith("qr-");
  writeFileSync(join(root, name), svg(label, color, isQr));
}

mkdirSync(aboutRoot, { recursive: true });
for (const [name, label, color] of aboutFiles) {
  writeFileSync(join(aboutRoot, name), svg(label, color, false));
}

console.log("Images OK:", files.length + aboutFiles.length);
