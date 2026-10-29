// Shared HTML template for the guide and info pages (public/sheetmusicplayer/<slug>/ and ja/<slug>/).
// Used by scripts/build-pages.mjs.

export const ORIGIN = "https://ktkwmr.com";
export const APP_PATH = { en: "/sheetmusicplayer/", ja: "/sheetmusicplayer/ja/" };
export const PUBLISHED = "2026-10-21";

export const pagePath = (lang, slug) => APP_PATH[lang] + slug + "/";

// A table that may be wider than a phone screen: edge shadows plus a hint shown on phones
export const wideTable = (lang, table) =>
  `<p class="scroll-hint" aria-hidden="true">${lang === "ja" ? "表は横にスクロールできます →" : "Scroll the table sideways →"}</p>
<div class="table-wrap wide">
${table}
</div>`;

export const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const UI = {
  en: {
    locale: "en_US",
    openApp: "Open the app",
    other: { lang: "ja", label: "日本語" },
    guides: "Guides",
    cta: "Hear your sheet music",
    ctaBody: "Take a photo of a score or open an image or PDF, and play it with a cursor that follows the staff. Free, no sign-up, and your music stays on your device.",
    footer: "Sheet Music Player · © 2026 ktkwmr",
    source: "Source code on GitHub",
    feedback: "Feedback",
  },
  ja: {
    locale: "ja_JP",
    openApp: "アプリを開く",
    other: { lang: "en", label: "English" },
    guides: "ガイド",
    cta: "楽譜を音で確かめる",
    ctaBody: "楽譜の写真や画像・PDFを読み取って、五線譜の上をカーソルが進みながら再生します。無料・登録不要、楽譜は端末の外に出ません。",
    footer: "Sheet Music Player · © 2026 ktkwmr",
    source: "GitHub のソースコード",
    feedback: "ご意見・ご質問",
  },
};

const MARK =
  '<svg class="mark" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="#000"></rect><path d="M5 9.5h18M5 12.5h18M5 15.5h18M5 18.5h18" stroke="#fff" stroke-width="1" stroke-linecap="round"></path><rect x="9.4" y="6.5" width="2.8" height="15" rx="1.4" fill="#fff" fill-opacity=".45"></rect><path d="M18.6 6.8v10.4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"></path><ellipse cx="16.7" cy="17.6" rx="2.3" ry="1.7" transform="rotate(-20 16.7 17.6)" fill="#fff"></ellipse></svg>';

const CSS = `
    :root {
      color-scheme: light;
      --ink: #000;
      --paper: #fff;
      --muted: #525252;
      --subtle: #737373;
      --line: #e5e5e5;
      --line-strong: #d4d4d4;
      --fill: #f5f5f5;
      --radius: 8px;
      --mono: "Cascadia Mono", "Consolas", "DejaVu Sans Mono", "MS Gothic", monospace;
      --sans: "Segoe UI Variable Text", "Segoe UI", "Yu Gothic UI", "Meiryo UI", "Meiryo", system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
    }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); font-size: 16px; line-height: 1.75; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-underline-offset: 3px; }
    a:focus-visible, .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

    .site-head { position: sticky; top: 0; z-index: 1; background: var(--paper); border-bottom: 1px solid var(--line); }
    .site-head .inner { display: flex; align-items: center; gap: 16px; max-width: 960px; margin: 0 auto; padding: calc(10px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left)); }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .mark { width: 28px; height: 28px; flex: none; }
    .head-links { display: flex; align-items: center; gap: 16px; margin-left: auto; font-size: 14px; }
    .head-links .lang { color: var(--muted); }
    .btn { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: var(--radius); background: var(--ink); color: var(--paper); font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .btn:hover { background: #262626; }

    main { max-width: 760px; margin: 0 auto; padding: 40px 16px 24px; }
    h1 { margin: 0 0 12px; font-size: 30px; line-height: 1.35; letter-spacing: -0.01em; }
    .lead { margin: 0 0 32px; color: var(--muted); font-size: 17px; }
    h2 { margin: 48px 0 12px; padding-top: 8px; font-size: 22px; line-height: 1.4; }
    h3 { margin: 32px 0 8px; font-size: 18px; line-height: 1.5; }
    p, ul, ol { margin: 0 0 16px; }
    li { margin: 4px 0; }
    li > ul, li > ol { margin: 4px 0 0; }
    code { font-family: var(--mono); font-size: 0.9em; background: var(--fill); padding: 1px 5px; border-radius: 4px; }
    pre { margin: 0 0 20px; padding: 14px 16px; overflow-x: auto; font-family: var(--mono); font-size: 14px; line-height: 1.6; background: var(--fill); border: 1px solid var(--line); border-radius: var(--radius); }
    pre code { background: none; padding: 0; font-size: inherit; }
    .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin: 0 0 20px; }
    .pair pre { margin: 0; }
    .pair figcaption, figure.shot figcaption, .table-wrap + .cap { color: var(--subtle); font-size: 13px; }
    figure { margin: 0 0 24px; }
    figure.shot img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: var(--radius); }
    figure.shot a { display: block; }
    figure.shot.phone img { max-width: 320px; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px 14px; margin: 0 0 20px; }
    .gallery figure { margin: 0; }
    figure.shot figcaption { margin-top: 6px; }
    .note { margin: 0 0 20px; padding: 12px 16px; border-left: 3px solid var(--ink); background: var(--fill); border-radius: 0 var(--radius) var(--radius) 0; }
    .note p:last-child, .note ul:last-child { margin-bottom: 0; }
    .toc { margin: 0 0 32px; padding: 14px 18px; border: 1px solid var(--line); border-radius: var(--radius); font-size: 15px; }
    .toc b { display: block; margin-bottom: 4px; }
    .toc ol { margin: 0; padding-left: 1.4em; }

    .table-wrap { margin: 0 0 8px; overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
    /* Wide tables: shadows at the edges show that the table scrolls sideways */
    .table-wrap.wide {
      background:
        linear-gradient(to right, var(--paper) 30%, rgba(255,255,255,0)) left / 40px 100% no-repeat local,
        linear-gradient(to left, var(--paper) 30%, rgba(255,255,255,0)) right / 40px 100% no-repeat local,
        radial-gradient(farthest-side at 0 50%, rgba(0,0,0,0.18), rgba(0,0,0,0)) left / 14px 100% no-repeat scroll,
        radial-gradient(farthest-side at 100% 50%, rgba(0,0,0,0.18), rgba(0,0,0,0)) right / 14px 100% no-repeat scroll;
    }
    .scroll-hint { display: none; margin: 0 0 6px; color: var(--subtle); font-size: 13px; }
    .table-wrap + .cap { margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 7px 10px; border-bottom: 1px solid var(--line); text-align: center; white-space: nowrap; }
    tr:last-child > * { border-bottom: 0; }
    thead th { background: var(--fill); font-weight: 600; }
    tbody th { text-align: left; font-weight: 600; background: var(--paper); position: sticky; left: 0; }
    td.num { font-family: var(--mono); font-variant-numeric: tabular-nums; }
    /* Rhythm pictures (scripts/pages/shuffle-and-swing.mjs) */
    table.rhythm td { text-align: left; }
    table.rhythm td code { background: none; padding: 0; letter-spacing: 0; }
    td.dim { color: var(--muted); background: var(--fill); }
    td.hit { background: var(--ink); color: var(--paper); font-weight: 700; }
    table.text td, table.text th { white-space: normal; text-align: left; }
    td.wrap { white-space: normal; text-align: left; min-width: 11em; }
    tbody th small { font-size: 12px; font-weight: 400; color: var(--muted); }
    td code, th code { white-space: nowrap; }
    table.text tbody th { white-space: nowrap; }
    th.group { font-weight: 400; color: var(--muted); font-size: 13px; }
    .table-wrap.wide tbody th { background: var(--paper); }

    dl.faq dt { margin: 28px 0 6px; font-weight: 700; font-size: 17px; }
    dl.faq dd { margin: 0; }

    .cta { margin: 48px 0 0; padding: 24px; border: 1px solid var(--line-strong); border-radius: 12px; text-align: center; }
    .cta h2 { margin: 0 0 8px; padding: 0; font-size: 20px; }
    .cta p { color: var(--muted); font-size: 15px; }
    .cta .btn { height: 44px; padding: 0 24px; font-size: 15px; }

    .site-foot { margin-top: 56px; border-top: 1px solid var(--line); font-size: 14px; color: var(--muted); }
    .site-foot .inner { max-width: 760px; margin: 0 auto; padding: 28px 16px calc(32px + env(safe-area-inset-bottom)); }
    .site-foot h2 { margin: 0 0 8px; padding: 0; font-size: 14px; color: var(--ink); }
    .site-foot ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 2px 24px; margin: 0 0 24px; padding: 0; list-style: none; }
    .site-foot a { text-decoration: none; }
    .site-foot a:hover { text-decoration: underline; }
    .site-foot [aria-current] { color: var(--ink); font-weight: 600; }
    .site-foot .meta { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; }

    @media (max-width: 600px) {
      .scroll-hint { display: block; }
      /* Two-column and text tables become stacked cards on phones */
      table.stack, table.stack tbody, table.stack tr, table.stack th, table.stack td { display: block; width: auto; }
      table.stack thead { display: none; }
      table.stack tr { padding: 10px 12px; border-bottom: 1px solid var(--line); }
      table.stack tr:last-child { border-bottom: 0; }
      table.stack th, table.stack td { padding: 2px 0; border: 0; text-align: left; white-space: normal; position: static; background: none; }
      table.stack td:empty { display: none; }
      table.stack td[data-label]::before { content: attr(data-label) " "; color: var(--subtle); font-family: var(--sans); }
      main { padding-top: 28px; }
      h1 { font-size: 25px; }
      h2 { font-size: 20px; }
      .head-links { gap: 12px; }
      .brand span { display: none; }
    }
    @media print {
      .site-head, .site-foot, .cta { display: none; }
    }`;

// pages: [{ slug, [lang]: { nav } }] in footer order
export function renderPage({ lang, page, pages, infoPages = [], body, jsonLd }) {
  const ui = UI[lang];
  const t = page[lang];
  const otherLang = ui.other.lang;
  const url = ORIGIN + pagePath(lang, page.slug);
  const enUrl = ORIGIN + pagePath("en", page.slug);
  const jaUrl = ORIGIN + pagePath("ja", page.slug);
  const fullTitle = `${t.title} | Sheet Music Player`;

  const nav = pages
    .map((p) => {
      const current = p.slug === page.slug ? ' aria-current="page"' : "";
      return `          <li><a href="${pagePath(lang, p.slug)}"${current}>${escapeHtml(p[lang].nav)}</a></li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<!-- Generated by scripts/build-pages.mjs from scripts/pages/${page.slug}.mjs. Do not edit. -->
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#ffffff" />
  <link rel="icon" type="image/svg+xml" href="/sheetmusicplayer/icons/icon.svg" />
  <link rel="apple-touch-icon" href="/sheetmusicplayer/icons/apple-touch-icon.png" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(t.description)}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="ja" href="${jaUrl}" />
  <link rel="alternate" hreflang="x-default" href="${enUrl}" />
  <meta property="og:type" content="${page.info ? "website" : "article"}" />
  <meta property="og:site_name" content="Sheet Music Player" />
  <meta property="og:title" content="${escapeHtml(t.title)}" />
  <meta property="og:description" content="${escapeHtml(t.description)}" />
  <meta property="og:locale" content="${ui.locale}" />
  <meta property="og:locale:alternate" content="${UI[otherLang].locale}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ORIGIN}/sheetmusicplayer/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2).replace(/</g, "\\u003c").replace(/^/gm, "  ")}
  </script>
  <style>${CSS}
  </style>
</head>
<body>
  <header class="site-head">
    <div class="inner">
      <a class="brand" href="${APP_PATH[lang]}">${MARK}<span>Sheet Music Player</span></a>
      <nav class="head-links" aria-label="${lang === "ja" ? "サイト" : "Site"}">
        <a class="lang" href="${pagePath(otherLang, page.slug)}" hreflang="${otherLang}" lang="${otherLang}">${ui.other.label}</a>
        <a class="btn" href="${APP_PATH[lang]}">${ui.openApp}</a>
      </nav>
    </div>
  </header>
  <main>
    <article>
      <h1>${escapeHtml(t.heading || t.title)}</h1>
${body.trim()}
    </article>
    <aside class="cta">
      <h2>${ui.cta}</h2>
      <p>${ui.ctaBody}</p>
      <a class="btn" href="${APP_PATH[lang]}">${ui.openApp}</a>
    </aside>
  </main>
  <footer class="site-foot">
    <div class="inner">
${pages.length ? `      <nav aria-labelledby="guides-title">
        <h2 id="guides-title">${ui.guides}</h2>
        <ul>
${nav}
        </ul>
      </nav>
` : ""}      <p class="meta">
        <span>${ui.footer}</span>
${infoPages.map((p) => `        <a href="${pagePath(lang, p.slug)}"${p.slug === page.slug ? ' aria-current="page"' : ""}>${escapeHtml(p[lang].nav)}</a>`).join("\n")}
        <a href="https://github.com/ktkwmr/SheetMusicPlayer" rel="noopener">${ui.source}</a>
        <a href="https://github.com/ktkwmr/SheetMusicPlayer/issues" rel="noopener">${ui.feedback}</a>
      </p>
    </div>
  </footer>
  <!-- Cloudflare Web Analytics (page views; no cookies) -->
  <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "5c53079cb9a64d819d1ca53e8533ca63"}'></script>
</body>
</html>
`;
}
