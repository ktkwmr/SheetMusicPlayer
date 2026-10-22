// Piano-roll editor: pitch goes up, time goes right, and each note is a box.
// Drag a box to move it (up/down: pitch, left/right: time), drag its right edge to change
// its length, click an empty spot to add a note, and Delete to remove the selected notes.
// Works on the model from score-model.mjs; the app turns the model back into MusicXML.

import { PPQ, newId, measureAt, insertMeasure, deleteMeasure, modelEnd } from "./score-model.mjs";

const KW = 46;      // keyboard width
const RH = 26;      // ruler height
const ROW = 12;     // pixels per semitone
const LOW = 21, HIGH = 108; // A0..C8
const ROWS = HIGH - LOW + 1;
const BLACK = new Set([1, 3, 6, 8, 10]);
const GRIDS = [[24, "♩"], [12, "♪"], [6, "𝅘𝅥𝅯"], [8, "♪³"]];
const ZOOMS = [0.75, 1, 1.5, 2, 3, 4]; // pixels per tick

function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

export function createEditor(host, opts) {
  const { t } = opts;
  let model = opts.model;
  let track = Math.max(0, model.tracks.findIndex((_, i) => model.notes.some((n) => n.track === i)));
  let grid = 6, zoomIdx = 2, ppt = ZOOMS[zoomIdx];
  let lastDur = 24;
  let selected = new Set();
  let selMeasure = null;
  let playQ = null;
  const undoStack = [], redoStack = [];

  // ---------- DOM ----------
  host.innerHTML = "";
  const bar = el("div", "ed-bar");
  const tracksBox = el("div", "ed-group ed-tracks");
  const gridBox = el("div", "ed-group");
  const zoomBox = el("div", "ed-group");
  const histBox = el("div", "ed-group");
  const measBox = el("div", "ed-group");
  bar.append(tracksBox, gridBox, zoomBox, histBox, measBox);
  const scroller = el("div", "ed-scroll");
  scroller.tabIndex = 0;
  scroller.setAttribute("role", "application");
  scroller.setAttribute("aria-label", t("ed.area"));
  const canvas = el("canvas", "ed-canvas");
  const space = el("div", "ed-space");
  scroller.append(canvas, space);
  const hint = el("p", "ed-hint");
  hint.innerHTML = t("ed.hint");
  host.append(bar, scroller, hint);

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function chip(label, onClick, attrs = {}) {
    const b = el("button", "chip"); b.type = "button"; b.textContent = label; b.onclick = onClick;
    for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
    return b;
  }

  function renderBar() {
    tracksBox.innerHTML = "";
    if (model.tracks.length > 1) {
      tracksBox.append(Object.assign(el("span", "ed-label"), { textContent: t("ed.track") }));
      model.tracks.forEach((_, i) => tracksBox.append(chip(opts.trackName(i), () => { track = i; selected.clear(); renderBar(); centerOnTrack(); draw(); }, { "aria-pressed": String(i === track) })));
    }
    gridBox.innerHTML = "";
    gridBox.append(Object.assign(el("span", "ed-label"), { textContent: t("ed.grid") }));
    GRIDS.forEach(([g, label]) => gridBox.append(chip(label, () => { grid = g; lastDur = Math.max(lastDur - (lastDur % g), g); renderBar(); draw(); }, { "aria-pressed": String(g === grid), "aria-label": t("ed.grid." + g) })));
    zoomBox.innerHTML = "";
    zoomBox.append(chip("−", () => setZoom(-1), { "aria-label": t("ed.zoomOut") }), chip("+", () => setZoom(1), { "aria-label": t("ed.zoomIn") }));
    histBox.innerHTML = "";
    const u = chip("↶", undo, { "aria-label": t("ed.undo"), title: t("ed.undo") + " (Ctrl+Z)" }); u.disabled = !undoStack.length;
    const r = chip("↷", redo, { "aria-label": t("ed.redo"), title: t("ed.redo") + " (Ctrl+Y)" }); r.disabled = !redoStack.length;
    histBox.append(u, r);
    measBox.innerHTML = "";
    const count = el("input", "ed-count"); count.type = "number"; count.min = "1"; count.max = "64"; count.value = measBox.dataset.count || "1";
    count.setAttribute("aria-label", t("ed.measCount"));
    count.oninput = () => { measBox.dataset.count = count.value; };
    const add = chip(t("ed.measAdd"), () => {
      const n = Math.max(1, Math.min(64, Math.round(+count.value || 1)));
      change(() => { for (let k = 0; k < n; k++) insertMeasure(model, selMeasure); });
    });
    const del = chip(t("ed.measDel"), () => change(() => { deleteMeasure(model, selMeasure); selMeasure = Math.min(selMeasure, model.measures.length - 1); }));
    add.disabled = del.disabled = count.disabled = selMeasure == null;
    const label = Object.assign(el("span", "ed-label"), { textContent: selMeasure == null ? t("ed.measPick") : t("ed.measSel", { n: selMeasure + 1 }) });
    measBox.append(label, count, add, del);
  }

  // ---------- geometry ----------
  const totalW = () => KW + modelEnd(model) * ppt + 240;
  const totalH = () => RH + ROWS * ROW;
  const xOf = (tick) => KW + tick * ppt - scroller.scrollLeft;
  const yOf = (midi) => RH + (HIGH - midi) * ROW - scroller.scrollTop;
  const tickAt = (x) => (x - KW + scroller.scrollLeft) / ppt;
  const midiAt = (y) => HIGH - Math.floor((y - RH + scroller.scrollTop) / ROW);
  const snap = (tick) => Math.round(tick / grid) * grid;
  const snapDown = (tick) => Math.floor(tick / grid) * grid;

  function resize() {
    const w = scroller.clientWidth, h = scroller.clientHeight, dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    space.style.width = totalW() + "px"; space.style.height = totalH() + "px";
    space.style.marginTop = -h + "px";
    draw();
  }
  function setZoom(d) {
    const center = tickAt(scroller.clientWidth / 2);
    zoomIdx = Math.max(0, Math.min(ZOOMS.length - 1, zoomIdx + d)); ppt = ZOOMS[zoomIdx];
    space.style.width = totalW() + "px";
    scroller.scrollLeft = Math.max(0, KW + center * ppt - scroller.clientWidth / 2);
    draw();
  }
  function centerOnTrack() {
    const ns = model.notes.filter((n) => n.track === track);
    if (!ns.length) return;
    const mid = ns.reduce((s, n) => s + n.midi, 0) / ns.length;
    scroller.scrollTop = Math.max(0, (HIGH - mid) * ROW - scroller.clientHeight / 2 + RH);
  }

  // ---------- drawing ----------
  let raf = 0;
  function draw() { if (!raf) raf = requestAnimationFrame(paint); }
  function paint() {
    raf = 0;
    const dpr = window.devicePixelRatio || 1, w = canvas.width / dpr, h = canvas.height / dpr;
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const C = { ink: css("--ink"), paper: css("--paper"), line: css("--line"), strong: css("--line-strong"), muted: css("--muted"), subtle: css("--subtle"),
      fill: css("--hover-fill"), cursor: css("--cursor"), cursorFill: css("--cursor-fill"), warn: css("--warn") || "#b45309" };
    g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
    const t0 = Math.max(0, tickAt(KW)), t1 = tickAt(w);
    const mLo = Math.min(HIGH, midiAt(RH)), mHi = Math.max(LOW, midiAt(h));
    // rows (black keys shaded)
    for (let m = mHi; m <= mLo; m++) {
      const y = yOf(m);
      if (BLACK.has(m % 12)) { g.fillStyle = C.fill; g.fillRect(KW, y, w - KW, ROW); }
      if (m % 12 === 0) { g.fillStyle = C.strong; g.fillRect(KW, y + ROW - 1, w - KW, 1); }
    }
    // measures, beats, and the grid
    const ms = model.measures;
    for (let i = measureAt(model, t0); i < ms.length && ms[i].start <= t1; i++) {
      const m = ms[i], x = xOf(m.start), beat = PPQ * 4 / m.beatType;
      if (m.flagged) { g.fillStyle = "rgba(245, 158, 11, .10)"; g.fillRect(x, RH, m.len * ppt, h - RH); }
      if (i === selMeasure) { g.fillStyle = C.cursorFill; g.fillRect(x, RH, m.len * ppt, h - RH); }
      for (let tk = 0; tk < m.len; tk += grid) {
        const gx = xOf(m.start + tk);
        g.fillStyle = tk === 0 ? C.ink : tk % beat === 0 ? C.strong : C.line;
        g.fillRect(Math.round(gx), RH, tk === 0 ? 1.5 : 1, h - RH);
      }
    }
    // notes: other tracks faint, this track black, selected blue
    for (const pass of [0, 1]) {
      for (const n of model.notes) {
        const mine = n.track === track;
        if ((pass === 0) === mine) continue;
        const x = xOf(n.start), y = yOf(n.midi), nw = Math.max(3, n.dur * ppt - 1);
        if (x > w || x + nw < KW || y > h || y + ROW < RH) continue;
        if (!mine) { g.fillStyle = C.strong; roundRect(g, x, y + 2, nw, ROW - 4, 2); g.fill(); continue; }
        g.fillStyle = selected.has(n.id) ? C.cursor : C.ink;
        roundRect(g, x, y + 1, nw, ROW - 2, 3); g.fill();
        if (nw > 8) { g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(x + nw - 3, y + 3, 1.5, ROW - 6); } // resize handle
      }
    }
    // marquee
    if (drag && drag.mode === "marquee") {
      g.strokeStyle = C.cursor; g.fillStyle = C.cursorFill; g.lineWidth = 1;
      const x = Math.min(drag.x0, drag.x), y = Math.min(drag.y0, drag.y);
      g.fillRect(x, y, Math.abs(drag.x - drag.x0), Math.abs(drag.y - drag.y0));
      g.strokeRect(x + 0.5, y + 0.5, Math.abs(drag.x - drag.x0), Math.abs(drag.y - drag.y0));
    }
    // playhead
    if (playQ != null) { g.fillStyle = C.cursor; g.fillRect(Math.round(xOf(playQ * PPQ)) - 1, RH, 2, h - RH); }
    // ruler
    g.fillStyle = C.paper; g.fillRect(0, 0, w, RH);
    g.fillStyle = C.strong; g.fillRect(0, RH - 1, w, 1);
    g.font = "11px " + css("--mono"); g.textBaseline = "middle";
    for (let i = measureAt(model, t0); i < ms.length && ms[i].start <= t1; i++) {
      const m = ms[i], x = xOf(m.start);
      if (i === selMeasure) { g.fillStyle = C.cursor; g.fillRect(x, 0, m.len * ppt, RH - 1); }
      else if (m.flagged) { g.fillStyle = "rgba(245, 158, 11, .35)"; g.fillRect(x, 0, m.len * ppt, RH - 1); }
      g.fillStyle = i === selMeasure ? C.paper : C.ink;
      g.fillText(String(i + 1) + (m.flagged ? " !" : ""), x + 4, RH / 2);
      if (i === 0 || ms[i - 1].beats !== m.beats || ms[i - 1].beatType !== m.beatType) {
        g.fillStyle = i === selMeasure ? C.paper : C.subtle; g.fillText(m.beats + "/" + m.beatType, x + 4 + g.measureText(String(i + 1) + "   ").width, RH / 2);
      }
      g.fillStyle = C.ink; g.fillRect(Math.round(x), 0, 1, RH);
    }
    if (playQ != null) { g.fillStyle = C.cursor; g.fillRect(Math.round(xOf(playQ * PPQ)) - 1, 0, 2, RH); }
    // keyboard
    g.fillStyle = C.paper; g.fillRect(0, RH, KW, h - RH);
    for (let m = mHi; m <= mLo; m++) {
      const y = yOf(m);
      if (BLACK.has(m % 12)) { g.fillStyle = C.ink; g.fillRect(0, y, KW * 0.6, ROW); }
      else { g.fillStyle = C.line; g.fillRect(0, y + ROW - 1, KW, 1); }
      if (m % 12 === 0) { g.fillStyle = C.muted; g.fillText("C" + (m / 12 - 1), KW * 0.62, y + ROW / 2); }
    }
    g.fillStyle = C.strong; g.fillRect(KW - 1, RH, 1, h - RH);
    g.fillStyle = C.paper; g.fillRect(0, 0, KW, RH);
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // ---------- changes and undo ----------
  const snapshot = () => JSON.stringify({ measures: model.measures, notes: model.notes });
  function restore(s) { const o = JSON.parse(s); model.measures = o.measures; model.notes = o.notes; }
  function change(fn, keepRedo) {
    undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift();
    if (!keepRedo) redoStack.length = 0;
    fn();
    space.style.width = totalW() + "px";
    renderBar(); draw(); opts.onChange();
  }
  function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); after(); }
  function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); after(); }
  function after() {
    const ids = new Set(model.notes.map((n) => n.id));
    selected = new Set([...selected].filter((id) => ids.has(id)));
    if (selMeasure != null && selMeasure >= model.measures.length) selMeasure = null;
    space.style.width = totalW() + "px"; renderBar(); draw(); opts.onChange();
  }
  // A measure the user has worked on is no longer flagged
  function reviewed(notes) { for (const n of notes) { const m = model.measures[measureAt(model, n.start)]; if (m) m.flagged = false; } }

  // ---------- mouse / touch ----------
  let drag = null;
  const hitNote = (x, y) => {
    const tk = tickAt(x), m = midiAt(y);
    for (let i = model.notes.length - 1; i >= 0; i--) {
      const n = model.notes[i];
      if (n.track === track && n.midi === m && tk >= n.start && tk < n.start + n.dur) return n;
    }
    // A faint note of another track: switch to that track
    for (let i = model.notes.length - 1; i >= 0; i--) {
      const n = model.notes[i];
      if (n.midi === m && tk >= n.start && tk < n.start + n.dur) return n;
    }
    return null;
  };
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect(), n = hitNote(e.clientX - r.left, e.clientY - r.top);
    if (n && n.track === track) change(() => { reviewed([n]); model.notes = model.notes.filter((x) => x !== n); selected.delete(n.id); });
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    scroller.focus({ preventScroll: true });
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y < RH) { // ruler: pick a measure
      const tk = tickAt(x);
      if (tk >= 0 && tk < modelEnd(model)) { const i = measureAt(model, tk); selMeasure = selMeasure === i ? null : i; renderBar(); draw(); }
      return;
    }
    if (x < KW) { const m = midiAt(y); if (m >= LOW && m <= HIGH) opts.preview(m); return; }
    canvas.setPointerCapture(e.pointerId);
    let n = hitNote(x, y);
    if (n && n.track !== track) { track = n.track; selected.clear(); renderBar(); }
    if (n) {
      if (e.shiftKey || e.ctrlKey || e.metaKey) { if (selected.has(n.id)) selected.delete(n.id); else selected.add(n.id); }
      else if (!selected.has(n.id)) selected = new Set([n.id]);
      const edge = xOf(n.start + n.dur) - x < 7 && n.dur * ppt > 12;
      const sel = model.notes.filter((m) => selected.has(m.id));
      drag = { mode: edge ? "resize" : "move", x0: x, y0: y, x, y, anchor: n, before: snapshot(), orig: sel.map((m) => ({ n: m, start: m.start, dur: m.dur, midi: m.midi })), moved: false, lastMidi: n.midi };
      opts.preview(n.midi);
    } else {
      if (!e.shiftKey) selected.clear();
      drag = { mode: "pending", x0: x, y0: y, x, y };
    }
    draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (!drag) {
      const n = y > RH && x > KW ? hitNote(x, y) : null;
      canvas.style.cursor = n && n.track === track ? (xOf(n.start + n.dur) - x < 7 && n.dur * ppt > 12 ? "ew-resize" : "grab") : y < RH ? "pointer" : "crosshair";
      return;
    }
    drag.x = x; drag.y = y;
    if (drag.mode === "pending" && Math.hypot(x - drag.x0, y - drag.y0) > 5) drag.mode = "marquee";
    if (drag.mode === "marquee") {
      const ta = tickAt(Math.min(x, drag.x0)), tb = tickAt(Math.max(x, drag.x0)), ma = midiAt(Math.max(y, drag.y0)), mb = midiAt(Math.min(y, drag.y0));
      for (const n of model.notes) if (n.track === track && n.start < tb && n.start + n.dur > ta && n.midi >= ma && n.midi <= mb) selected.add(n.id);
    } else if (drag.mode === "move") {
      const a = drag.orig.find((o) => o.n === drag.anchor);
      const dt = Math.max(-Math.min(...drag.orig.map((o) => o.start)), snap(a.start + (x - drag.x0) / ppt) - a.start);
      const dp = Math.round((drag.y0 - y) / ROW);
      for (const o of drag.orig) { o.n.start = o.start + dt; o.n.midi = Math.max(LOW, Math.min(HIGH, o.midi + dp)); }
      drag.moved = drag.moved || dt !== 0 || dp !== 0;
      if (drag.anchor.midi !== drag.lastMidi) { drag.lastMidi = drag.anchor.midi; opts.preview(drag.anchor.midi); }
    } else if (drag.mode === "resize") {
      const a = drag.orig.find((o) => o.n === drag.anchor);
      const end = Math.max(a.start + grid, snap(a.start + a.dur + (x - drag.x0) / ppt));
      const dd = end - (a.start + a.dur);
      for (const o of drag.orig) o.n.dur = Math.max(grid, o.dur + dd);
      drag.moved = drag.moved || dd !== 0;
    }
    draw();
    autoScroll(x, y);
  });
  const finish = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.mode === "pending") {
      const tk = snapDown(tickAt(d.x0)), m = midiAt(d.y0);
      if (tk >= 0 && tk < modelEnd(model) && m >= LOW && m <= HIGH) {
        const n = { id: newId(), track, start: tk, dur: lastDur, midi: m };
        change(() => { model.notes.push(n); reviewed([n]); });
        selected = new Set([n.id]);
        opts.preview(m);
      }
    } else if ((d.mode === "move" || d.mode === "resize") && d.moved) {
      // Record the state before the drag for undo
      const now = snapshot(); restore(d.before);
      change(() => { restore(now); });
      const moved = model.notes.filter((n) => selected.has(n.id));
      reviewed(moved); reviewed(d.orig);
      if (d.mode === "resize" || moved.length === 1) lastDur = moved[0] ? moved[0].dur : lastDur;
    }
    draw();
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  function autoScroll(x, y) {
    const w = scroller.clientWidth, h = scroller.clientHeight;
    if (x > w - 30) scroller.scrollLeft += 12; else if (x < KW + 20) scroller.scrollLeft -= 12;
    if (y > h - 20) scroller.scrollTop += 8; else if (y < RH + 10) scroller.scrollTop -= 8;
  }
  scroller.addEventListener("scroll", draw);

  // ---------- keyboard ----------
  scroller.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const sel = () => model.notes.filter((n) => selected.has(n.id));
    if (mod && (e.key === "z" || e.key === "Z")) { e.preventDefault(); e.stopPropagation(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (e.key === "y" || e.key === "Y")) { e.preventDefault(); e.stopPropagation(); redo(); return; }
    if (mod && (e.key === "a" || e.key === "A")) { e.preventDefault(); e.stopPropagation(); selected = new Set(model.notes.filter((n) => n.track === track).map((n) => n.id)); draw(); return; }
    if (e.key === "Escape") { selected.clear(); selMeasure = null; renderBar(); draw(); e.stopPropagation(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && selected.size) {
      e.preventDefault(); e.stopPropagation();
      change(() => { reviewed(sel()); model.notes = model.notes.filter((n) => !selected.has(n.id)); selected.clear(); });
      return;
    }
    const arrows = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (arrows[e.key] && selected.size && !mod) {
      e.preventDefault(); e.stopPropagation();
      const [dx, dy] = arrows[e.key];
      const ns = sel();
      if (dx && Math.min(...ns.map((n) => n.start)) + dx * grid < 0) return;
      change(() => {
        for (const n of ns) { n.start += dx * grid; n.midi = Math.max(LOW, Math.min(HIGH, n.midi + dy * (e.shiftKey ? 12 : 1))); }
        reviewed(ns);
      });
      if (dy && ns[0]) opts.preview(ns[0].midi);
    }
  });

  // ---------- public ----------
  const ro = new ResizeObserver(resize);
  ro.observe(scroller);
  renderBar();
  requestAnimationFrame(() => { resize(); centerOnTrack(); });

  return {
    setPlayhead(q, follow) {
      playQ = q;
      if (q != null && follow) {
        const x = xOf(q * PPQ);
        if (x < KW + 20 || x > scroller.clientWidth - 60) scroller.scrollLeft = Math.max(0, KW + q * PPQ * ppt - KW - 60);
      }
      draw();
    },
    // Click on the ruler is for measures; the app asks where to start playing from here
    positionQ() { return selMeasure != null ? model.measures[selMeasure].start / PPQ : null; },
    focus() { scroller.focus({ preventScroll: true }); },
    destroy() { ro.disconnect(); cancelAnimationFrame(raf); host.innerHTML = ""; },
  };
}
