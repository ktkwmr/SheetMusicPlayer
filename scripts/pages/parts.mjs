// Shared pieces for the guide articles (scripts/pages/<slug>.mjs).
import { readFileSync } from "node:fs";
import { escapeHtml, pagePath } from "./layout.mjs";

// ---------- Values read from the app itself, so the articles never disagree with it ----------
const APP = readFileSync(new URL("../../public/sheetmusicplayer/index.html", import.meta.url), "utf8");
function appConst(name) {
  const m = APP.match(new RegExp(`const ${name} = (\\d+);`));
  if (!m) throw new Error(`index.html: const ${name} not found`);
  return +m[1];
}
export const DEFAULT_BPM = appConst("DEFAULT_BPM");
export const MAX_PDF_PAGES = appConst("MAX_PDF_PAGES");
// The tempo used for each tempo word found on the page: { grave: 40, … } in the app's order
export const TEMPO_TERMS = (() => {
  const m = APP.match(/const TEMPO_TERMS = \{([^}]+)\}/);
  if (!m) throw new Error("index.html: TEMPO_TERMS not found");
  return Object.fromEntries([...m[1].matchAll(/(\w+):\s*(\d+)/g)].map(([, k, v]) => [k, +v]));
})();
// The tempo range of the app's tempo field and slider
export const BPM_RANGE = (() => {
  const m = APP.match(/id="bpmSlider" type="range" min="(\d+)" max="(\d+)"/);
  if (!m) throw new Error("index.html: bpmSlider not found");
  return [+m[1], +m[2]];
})();

// ---------- Pictures (made by scripts/render-guide-images.mjs) ----------
const IMG = "/sheetmusicplayer/guide/img/";
const SIZES = { app: [1280, 800], menu: [600, 450], sample: [900, 1273], photo: [360, 0] };

// A screenshot of the app; name without the language, e.g. "app-start"
export function shot(lang, name, alt, caption) {
  const file = `${IMG}${name}-${lang}.webp`;
  const [w, h] = name === "app-menu" ? SIZES.menu : SIZES.app;
  return `<figure class="shot">
  <a href="${file}"><img src="${file}" width="${w}" height="${h}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></a>
  <figcaption>${caption}</figcaption>
</figure>`;
}
export function image(file, w, h, alt, caption, cls = "shot") {
  return `<figure class="${cls}">
  <a href="${IMG}${file}"><img src="${IMG}${file}" width="${w}" height="${h}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></a>
  <figcaption>${caption}</figcaption>
</figure>`;
}

// Link to another article in the same language
export const link = (lang, slug, text) => `<a href="${pagePath(lang, slug)}">${text}</a>`;

// <pre> block: the text is used as it is (no indentation from the template literal)
export const pre = (text) => `<pre><code>${escapeHtml(text.replace(/^\n+|\s+$/g, ""))}</code></pre>`;
