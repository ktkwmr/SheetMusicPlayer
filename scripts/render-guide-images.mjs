#!/usr/bin/env node
// Makes the pictures and measurements used by the guide articles (scripts/pages/*.mjs):
//   public/sheetmusicplayer/guide/img/*.webp   screenshots of the app (en / ja), the sample score, photo variants
//   scripts/pages/data/photo-results.json      how well each photo variant was read (scripts/pages/photo-tips.mjs)
//
// The sample score is "Ode to Joy" (Beethoven, public domain), arranged here for two staves and drawn
// with the app's own copy of OpenSheetMusicDisplay. The photo variants (tilted, shadowed, blurred, …)
// are made from that page with a canvas, then read by the app like a user's photo, and the result is
// compared note by note with the original.
//
// Requires Playwright (see scripts/render-og-image.mjs) and the app running with its headers:
//   npx wrangler dev            (in another terminal)
//   node scripts/render-guide-images.mjs [--base http://127.0.0.1:8787] [--only sheet|shots|photos]
// Each run uses a new browser profile (no cached engine or Tesseract data). Reading takes about a minute
// per picture, so the whole run takes 10–20 minutes. Run it again when the app's look changes.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const { chromium } = await import("playwright").catch(() => import("playwright-core")).catch(() => require("playwright"));

const arg = (name, def) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; };
const BASE = arg("--base", "http://127.0.0.1:8787").replace(/\/$/, "") + "/sheetmusicplayer/";
const ONLY = arg("--only", "");
const IMG = fileURLToPath(new URL("../public/sheetmusicplayer/guide/img/", import.meta.url));
const DATA = fileURLToPath(new URL("./pages/data/", import.meta.url));
mkdirSync(IMG, { recursive: true });
mkdirSync(DATA, { recursive: true });

// ---------- The sample score: Ode to Joy, 16 measures, melody + simple bass ----------
const DIV = 24; // divisions per quarter note
const STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// Melody: pitch + octave, duration in quarters
const MELODY = [
  "E4 1 E4 1 F4 1 G4 1", "G4 1 F4 1 E4 1 D4 1", "C4 1 C4 1 D4 1 E4 1", "E4 1.5 D4 .5 D4 2",
  "E4 1 E4 1 F4 1 G4 1", "G4 1 F4 1 E4 1 D4 1", "C4 1 C4 1 D4 1 E4 1", "D4 1.5 C4 .5 C4 2",
  "D4 1 D4 1 E4 1 C4 1", "D4 1 E4 .5 F4 .5 E4 1 C4 1", "D4 1 E4 .5 F4 .5 E4 1 D4 1", "C4 1 D4 1 G3 2",
  "E4 1 E4 1 F4 1 G4 1", "G4 1 F4 1 E4 1 D4 1", "C4 1 C4 1 D4 1 E4 1", "D4 1.5 C4 .5 C4 2",
];
// Bass: one chord per half measure (C = C3+G3, G = G2+D3)
const HARMONY = ["CC", "GG", "CC", "GG", "CC", "GG", "CC", "GC", "GC", "GC", "GC", "GG", "CC", "GG", "CC", "GC"];
const CHORD = { C: ["C3", "G3"], G: ["G2", "D3"] };
const TYPE = { 0.5: ["eighth", 0], 1: ["quarter", 0], 1.5: ["quarter", 1], 2: ["half", 0] };

function noteXml(p, q, staff, chord) {
  const [type, dots] = TYPE[q];
  return `<note>${chord ? "<chord/>" : ""}<pitch><step>${p[0]}</step><octave>${p.slice(1)}</octave></pitch><duration>${q * DIV}</duration><voice>${staff === 1 ? 1 : 5}</voice><type>${type}</type>${"<dot/>".repeat(dots)}<stem>${staff === 1 ? (STEPS[p[0]] + 12 * +p.slice(1) >= 71 ? "down" : "up") : "down"}</stem><staff>${staff}</staff></note>`;
}
function sampleXml({ title = "Ode to Joy", drop = null } = {}) {
  const measures = MELODY.map((line, i) => {
    const tokens = line.split(" ");
    let mel = "";
    for (let k = 0; k < tokens.length; k += 2) {
      if (drop && drop.measure === i && drop.note === k / 2) continue;
      mel += noteXml(tokens[k], +tokens[k + 1], 1, false);
    }
    let bass = "";
    for (const h of HARMONY[i]) bass += CHORD[h].map((p, j) => noteXml(p, 2, 2, j > 0)).join("");
    const attrs = i === 0
      ? `<attributes><divisions>${DIV}</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>
<direction placement="above"><direction-type><words font-weight="bold">Moderato</words></direction-type><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>108</per-minute></metronome></direction-type><staff>1</staff><sound tempo="108"/></direction>`
      : "";
    const end = i === MELODY.length - 1 ? `<barline location="right"><bar-style>light-heavy</bar-style></barline>` : "";
    return `<measure number="${i + 1}">${attrs}${mel}<backup><duration>${4 * DIV}</duration></backup>${bass}${end}</measure>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
<work><work-title>${title}</work-title></work>
<identification><creator type="composer">L. van Beethoven</creator></identification>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">
${measures}
</part>
</score-partwise>
`;
}

// ---------- Comparing a reading with the original ----------
const { window } = new JSDOM("");
globalThis.DOMParser = window.DOMParser;
globalThis.XMLSerializer = window.XMLSerializer;
const SM = await import("../public/sheetmusicplayer/score-model.mjs");

// Notes in reading order for each staff: "pitch/length"; chords sorted low to high
function sequence(model, track) {
  return model.notes.filter((n) => n.track === track).sort((a, b) => a.start - b.start || a.midi - b.midi).map((n) => n.midi + "/" + n.dur);
}
function lcs(a, b) {
  const row = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
}
// Share of the original notes read with the right pitch and length, in the right order
// (extra notes count against it: matched / larger of the two counts)
function compare(originalXml, readXml) {
  const a = SM.parseScore(originalXml), b = SM.parseScore(readXml);
  let matched = 0, total = 0;
  for (let t = 0; t < a.tracks.length; t++) {
    const sa = sequence(a, t), sb = t < b.tracks.length ? sequence(b, t) : [];
    matched += lcs(sa, sb);
    total += Math.max(sa.length, sb.length);
  }
  return { notes: b.notes.length, originalNotes: a.notes.length, measures: b.measures.length, flagged: b.measures.filter((m) => m.flagged).length, match: Math.round((matched / total) * 1000) / 10 };
}

// ---------- Browser helpers ----------
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });

async function webp(page, pngBuffer, file, { width = 0, quality = 0.86 } = {}) {
  const data = await page.evaluate(async ({ b64, width, quality }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const w = width || img.naturalWidth, h = Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/webp", quality).split(",")[1];
  }, { b64: pngBuffer.toString("base64"), width, quality });
  writeFileSync(IMG + file, Buffer.from(data, "base64"));
  console.log("Wrote public/sheetmusicplayer/guide/img/" + file);
}

// The sample score as an A4-shaped page (1240 × 1754 px, about 150 dpi), PNG
async function renderSheet(page, xml) {
  await page.route(BASE + "__sheet", (r) => r.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff"><div id="s" style="width:1240px;height:1754px;padding:90px 80px;box-sizing:border-box;background:#fff"></div><script src="vendor/opensheetmusicdisplay.min.js"></script></body>` }));
  await page.goto(BASE + "__sheet");
  await page.evaluate(async (xml) => {
    const o = new opensheetmusicdisplay.OpenSheetMusicDisplay(document.getElementById("s"), { autoResize: false, backend: "canvas", drawTitle: true, drawComposer: true, drawPartNames: false });
    await o.load(xml); o.zoom = 1.15; o.render();
  }, xml);
  return page.locator("#s").screenshot();
}

// Photo-like variants of the page, made with a canvas. Each returns a JPEG (like a phone photo).
// They run in the __sheet page: the app's CSP does not allow new Function()
const VARIANTS = {
  // A flat scan, straight on
  clean: "",
  // The phone held at an angle: the page is tilted by 10 degrees
  tilt: `g.fillStyle = "#6b6b6b"; g.fillRect(0, 0, W, H); g.translate(W / 2, H / 2); g.rotate(10 * Math.PI / 180); g.scale(0.85, 0.85); g.drawImage(img, -w / 2, -h / 2);`,
  // Taken from low on one side: the top of the page is narrower (keystone), as on a desk
  perspective: `g.fillStyle = "#6b6b6b"; g.fillRect(0, 0, W, H);
    for (let y = 0; y < h; y++) { const s = 0.6 + 0.4 * (y / h), lw = w * s; g.drawImage(img, 0, y, w, 1, (W - lw) / 2, 60 + y * 0.92, lw, 1.5); }`,
  // A shadow of the hand / phone across part of the page and dim light
  shadow: `g.drawImage(img, 0, 0); const gr = g.createLinearGradient(0, 0, W, H * 0.6); gr.addColorStop(0, "rgba(0,0,0,0.75)"); gr.addColorStop(0.45, "rgba(0,0,0,0.65)"); gr.addColorStop(0.62, "rgba(0,0,0,0.05)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);`,
  // Out of focus / shaken
  blur: `g.filter = "blur(4px)"; g.drawImage(img, 0, 0);`,
  // Taken from far away: the page is small in the photo (low resolution)
  small: `g.drawImage(img, 0, 0, w * 0.25, h * 0.25); const d = g.getImageData(0, 0, Math.round(w * 0.25), Math.round(h * 0.25)); W = d.width; H = d.height; c.width = W; c.height = H; g.putImageData(d, 0, 0);`,
};
async function makeVariant(page, png, name) {
  const b64 = await page.evaluate(async ({ b64, code }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    let W = w, H = h;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    if (code) new Function("g", "img", "w", "h", "c", "W", "H", code)(g, img, w, h, c, W, H);
    else g.drawImage(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.9).split(",")[1];
  }, { b64: png.toString("base64"), code: VARIANTS[name] });
  return Buffer.from(b64, "base64");
}

// Opens a file in the app and waits until it is read (or fails). Returns the saved MusicXML and tempo.
async function readInApp(page, name, buffer, mimeType, onStatus) {
  // Forget the message of the previous file, so its "Read in … s" is not taken for this one
  await page.evaluate(() => { document.getElementById("statusText").textContent = ""; document.getElementById("error").hidden = true; });
  await page.setInputFiles("#fileInput", { name, mimeType, buffer });
  const deadline = Date.now() + 15 * 60 * 1000;
  let shot = false;
  for (;;) {
    const s = await page.evaluate(() => ({
      status: document.getElementById("statusText").textContent,
      statusShown: !document.getElementById("status").hidden,
      bar: !document.getElementById("statusBar").hidden,
      error: document.getElementById("error").hidden ? "" : document.getElementById("error").textContent,
    }));
    if (onStatus && !shot && s.statusShown && /Reading the staves|段ごと/.test(s.status)) { shot = true; await onStatus(); }
    if (s.error) return { error: s.error };
    if (s.statusShown && !s.bar && /\d/.test(s.status) && /Read in|読み取りました|read in/.test(s.status)) break;
    if (Date.now() > deadline) throw new Error("timeout reading " + name);
    await page.waitForTimeout(500);
  }
  return page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("sheetmusicplayer-state"));
    return { xml: st.xml, bpm: st.bpm, tempoSource: st.tempoSource, status: document.getElementById("statusText").textContent };
  });
}

const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
const page = await context.newPage();
page.on("pageerror", (e) => console.error("pageerror:", e.message));

const xml = sampleXml();
const sheet = await renderSheet(page, xml);
await webp(page, sheet, "sample-score.webp", { width: 900 });
if (ONLY === "sheet") { await browser.close(); process.exit(0); }

// ---------- Screenshots of the app (English and Japanese) ----------
async function shots(lang) {
  const app = await context.newPage();
  await app.goto(BASE + (lang === "ja" ? "ja/" : "?lang=en"));
  await app.evaluate(() => localStorage.clear());
  await app.reload();
  await app.waitForSelector("#fileBtn");
  await app.mouse.move(0, 0);
  await webp(app, await app.screenshot(), `app-start-${lang}.webp`, { width: 1280 });

  const photo = await makeVariant(page, sheet, "clean");
  const r = await readInApp(app, lang === "ja" ? "歓喜の歌.jpg" : "ode-to-joy.jpg", photo, "image/jpeg", async () => {
    await webp(app, await app.screenshot(), `app-reading-${lang}.webp`, { width: 1280 });
  });
  if (r.error) throw new Error(lang + ": " + r.error);
  console.log(lang, r.status, "tempo", r.bpm, r.tempoSource, compare(xml, r.xml));

  // Playing: the cursor a few notes in
  await app.click("#playBtn");
  await app.waitForTimeout(2600);
  await webp(app, await app.screenshot(), `app-playing-${lang}.webp`, { width: 1280 });
  await app.click("#playBtn");

  // The settings menu
  await app.click("#settingsBtn");
  await app.waitForTimeout(200);
  await webp(app, await app.screenshot({ clip: { x: 880, y: 0, width: 400, height: 300 } }), `app-menu-${lang}.webp`);
  await app.keyboard.press("Escape");

  // The editor, with a score where one note of measure 4 is missing (as if the reading had missed it)
  const broken = sampleXml({ drop: { measure: 3, note: 1 } });
  await app.setInputFiles("#fileInput", { name: lang === "ja" ? "歓喜の歌（4小節目に抜け）.musicxml" : "ode-to-joy-missing-note.musicxml", mimeType: "application/xml", buffer: Buffer.from(broken) });
  await app.waitForFunction(() => /MusicXML/.test(document.getElementById("statusText").textContent) && !document.getElementById("status").hidden);
  await app.waitForTimeout(800);
  await app.click("#modeEdit");
  await app.waitForTimeout(800);
  await webp(app, await app.screenshot(), `app-edit-${lang}.webp`, { width: 1280 });
  await app.close();
}

// ---------- Photo variants: read each one and compare ----------
async function photos() {
  const app = await context.newPage();
  await app.goto(BASE + "?lang=en");
  await app.waitForSelector("#fileBtn");
  const results = {};
  for (const name of Object.keys(VARIANTS)) {
    const jpg = await makeVariant(page, sheet, name);
    // A small picture of the variant for the article
    const png = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = "data:image/jpeg;base64," + b64; await img.decode();
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      return c.toDataURL("image/png").split(",")[1];
    }, jpg.toString("base64"));
    await webp(page, Buffer.from(png, "base64"), `photo-${name}.webp`, { width: 360, quality: 0.8 });
    const t0 = Date.now();
    const r = await readInApp(app, name + ".jpg", jpg, "image/jpeg");
    const secs = Math.round((Date.now() - t0) / 1000);
    results[name] = r.error ? { error: true, secs } : { ...compare(xml, r.xml), bpm: r.bpm, tempoSource: r.tempoSource, secs };
    console.log(name, results[name]);
  }
  await app.close();
  writeFileSync(DATA + "photo-results.json", JSON.stringify({
    note: "Generated by scripts/render-guide-images.mjs. Do not edit.",
    score: "Ode to Joy, 16 measures, two staves (" + SM.parseScore(xml).notes.length + " notes), Moderato ♩ = 108",
    results,
  }, null, 2) + "\n");
  console.log("Wrote scripts/pages/data/photo-results.json");
}

if (ONLY !== "photos") { await shots("en"); await shots("ja"); }
if (ONLY !== "shots") await photos();
await browser.close();
