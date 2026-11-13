// Usage events (how the app and the guides are used), sent with Cloudflare Zaraz (/cdn-cgi/zaraz/i.js,
// loaded just before this file). Zaraz forwards them to Google Analytics 4 only after the visitor agrees
// in its consent banner (the GA4 tool is assigned to the "Analytics" purpose in the Zaraz dashboard).
// Where Zaraz is not there (wrangler dev, preview builds, blocked by the browser), nothing is sent.
//
// Never send what is in a score: no titles, file names, notes, pictures, or error messages with them.
// Only which button was tapped, counts, durations, file kinds, and results.
//
// Events (parameters are registered in GA4 as custom dimensions / metrics, see docs/analytics.md):
//   smp_tap     button              every tap on a button or link (named by its id, see tapName)
//   smp_engaged seconds, play_seconds  time the page was visible (and music played) since the last one,
//                                   sent when the page is hidden or closed
//   smp_open    via, kind, files    files chosen (index.html)
//   smp_read    result, files, pages, seconds, tempo  reading the chosen files (index.html)
//   smp_export  type, result        MusicXML / MIDI / MP3 / share (index.html)
// Every event also has ui_lang (en / ja).
(function () {
  "use strict";
  const lang = () => (document.documentElement.lang || "en").slice(0, 2);

  function track(name, params) {
    try {
      if (window.zaraz && typeof window.zaraz.track === "function") window.zaraz.track(name, Object.assign({ ui_lang: lang() }, params || {}));
    } catch (e) { /* analytics must never break the app */ }
  }

  // ---- Taps -------------------------------------------------------------------------------------
  // The name is the element's id, or data-track, or for links the page (same site) or host (other sites);
  // otherwise the nearest id above it and the element's first class (history items, the file list, ...)
  function tapName(el) {
    if (el.dataset.track) return el.dataset.track;
    if (el.id) return el.id;
    if (el.dataset.bpm) return "bpm" + (+el.dataset.bpm > 0 ? "+" : "") + el.dataset.bpm;
    if (el.tagName === "A" && el.href) {
      try {
        const u = new URL(el.href, document.baseURI);
        if (u.origin === location.origin) return "link:" + u.pathname;
        return "link:" + u.host;
      } catch (e) { return "link"; }
    }
    const box = el.parentElement && el.parentElement.closest("[id]");
    const cls = (el.getAttribute("class") || "").trim().split(/\s+/)[0];
    return (box ? box.id : "page") + ":" + (cls || el.tagName.toLowerCase());
  }
  document.addEventListener("click", function (e) {
    const el = e.target && e.target.closest && e.target.closest("button, a[href], summary, [role=button], input[type=checkbox], input[type=radio]");
    if (!el || el.disabled) return;
    // "Cookie settings" in the footer: open Zaraz's consent banner again
    if (el.classList.contains("cookie-settings")) {
      e.preventDefault();
      try { if (window.zaraz && typeof window.zaraz.showConsentModal === "function") window.zaraz.showConsentModal(); } catch (err) {}
    }
    track("smp_tap", { button: tapName(el).slice(0, 100) });
  }, true);

  // ---- Time on the page ---------------------------------------------------------------------------
  // Counted only while the page is visible; music playing is counted while it plays (also in the
  // background). Sent each time the page is hidden, then counted again from zero.
  let shownAt = document.visibilityState === "visible" ? performance.now() : null, shown = 0;
  let playAt = null, played = 0;
  function flush() {
    const now = performance.now();
    if (shownAt != null) { shown += now - shownAt; shownAt = null; }
    if (playAt != null) { played += now - playAt; playAt = now; }
    const seconds = Math.round(shown / 1000), playSeconds = Math.round(played / 1000);
    shown = 0; played = 0;
    if (seconds >= 1 || playSeconds >= 1) track("smp_engaged", { seconds: seconds, play_seconds: playSeconds });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
    else if (shownAt == null) shownAt = performance.now();
  });
  window.addEventListener("pagehide", function () { if (shownAt != null || playAt != null) flush(); });

  window.smpTrack = track;
  // index.html calls this when playing starts and stops
  window.smpPlaying = function (on) {
    const now = performance.now();
    if (on && playAt == null) playAt = now;
    else if (!on && playAt != null) { played += now - playAt; playAt = null; }
  };
})();
