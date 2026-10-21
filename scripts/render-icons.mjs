#!/usr/bin/env node
// Renders public/sheetmusicplayer/icons/icon.svg to the PNG icons:
//   icon-192.png, icon-512.png, apple-touch-icon.png (180, no transparency),
//   icon-maskable-512.png (the mark inside the 80% safe zone on black).
// Requires Playwright, as for scripts/render-og-image.mjs.
//   node scripts/render-icons.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { chromium } = await import("playwright").catch(() => import("playwright-core"));
const dir = new URL("../public/sheetmusicplayer/icons/", import.meta.url);
const svg = await readFile(new URL("icon.svg", dir), "utf8");
const dataUrl = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

// [file, size, background, mark size as a share of the icon]
const ICONS = [
  ["icon-192.png", 192, "transparent", 1],
  ["icon-512.png", 512, "transparent", 1],
  ["apple-touch-icon.png", 180, "#000", 1],
  ["icon-maskable-512.png", 512, "#000", 0.72],
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
for (const [file, size, bg, scale] of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const mark = Math.round(size * scale);
  await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${bg}"><img src="${dataUrl}" width="${mark}" height="${mark}"></body></html>`);
  await page.screenshot({ path: fileURLToPath(new URL(file, dir)), omitBackground: bg === "transparent" });
  await page.close();
  console.log("Wrote icons/" + file);
}
await browser.close();
