// Piano-roll editor: pitch goes up, time goes right, and each note is a box.
// Drag a box to move it (up/down: pitch, left/right: time), drag its right edge to change
// its length, click an empty spot to add a note, and Delete to remove the selected notes.
// Touch: drag an empty spot to scroll, pinch to zoom in time, hold then drag to select several.
// Mouse: the wheel scrolls (Shift: sideways), Ctrl + wheel (or a trackpad pinch) zooms in time.
// Works on the model from score-model.mjs; the app turns the model back into MusicXML.
// The notes are shown and heard moved by the app's transposition (opts.transpose); the model keeps
// the notes as written, so what is drawn is model pitch + off, and what is entered is drawn pitch − off.

import { PPQ, newId, measureAt, insertMeasure, deleteMeasure, modelEnd } from "./score-model.mjs";

const KW = 46;      // keyboard width
const RH = 26;      // ruler height
const ROW = 12;     // pixels per semitone
const PIANO_LO = 21, PIANO_HI = 108; // A0..C8: the notes as written stay on the piano
const LOW = PIANO_LO - 12, HIGH = PIANO_HI + 12; // rows shown: an octave to spare either way, for transposed notes
const ROWS = HIGH - LOW + 1;
const BLACK = new Set([1, 3, 6, 8, 10]);
// Grid icons drawn as SVG: the sixteenth-note character (U+1D161) is missing from most phone fonts and fell back
// to an eighth note, and the font's ♩ ♪ came out at different sizes
const NOTE_HEAD = '<ellipse cx="6.2" cy="15" rx="3.1" ry="2.2" transform="rotate(-20 6.2 15)" fill="currentColor"/><path d="M9 14.4V2.5" stroke="currentColor" stroke-width="1.3"/>';
const FLAG = (y) => '<path d="M9 ' + y + 'c.4 2.4 3.6 3 3.4 6.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
const noteIcon = (body, w = 16) => '<svg class="note-ic" viewBox="0 0 ' + w + ' 18" width="' + w + '" height="18" aria-hidden="true">' + NOTE_HEAD + body + '</svg>';
const GRIDS = [[24, noteIcon("")], [12, noteIcon(FLAG(2.5))], [6, noteIcon(FLAG(2.5) + FLAG(5.8))], [8, noteIcon(FLAG(2.5) + '<text x="13.5" y="7" font-size="7.5" font-weight="700" fill="currentColor" font-family="inherit">3</text>', 19)]];
const PPT_MIN = 0.4, PPT_MAX = 6; // pixels per tick (zoom in time)
const HOLD_MS = 450; // touch: hold this long without moving, then drag to select several

function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

export function createEditor(host, opts) {
  const { t } = opts;
  let model = opts.model;
  let track = Math.max(0, model.tracks.findIndex((_, i) => model.notes.some((n) => n.track === i)));
  let grid = 6, ppt = 1.5;
  let off = opts.transpose || 0; // semitones the notes are shown and heard moved by
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
  const histBox = el("div", "ed-group");
  const measBox = el("div", "ed-group");
  const trBox = el("div", "ed-group ed-tr");
  bar.append(tracksBox, gridBox, histBox, measBox, trBox);
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
    const b = el("button", "chip"); b.type = "button"; b.onclick = onClick;
    if (label.startsWith("<svg")) b.innerHTML = label; else b.textContent = label; // (only our own icons are HTML)
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
    trBox.textContent = off ? t("ed.transposed", { n: (off > 0 ? "+" : "−") + Math.abs(off) }) : "";
    trBox.hidden = !off;
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
  // Zoom in time, keeping the tick under x (in the canvas) where it is
  function zoomTo(p, x, tick) {
    if (tick == null) tick = tickAt(x);
    ppt = Math.max(PPT_MIN, Math.min(PPT_MAX, p));
    space.style.width = totalW() + "px";
    scroller.scrollLeft = Math.max(0, tick * ppt + KW - x);
    draw();
  }
  const zoomBy = (f, x) => zoomTo(ppt * f, x == null ? (KW + scroller.clientWidth) / 2 : x);
  function centerOnTrack() {
    const ns = model.notes.filter((n) => n.track === track);
    if (!ns.length) return;
    const mid = ns.reduce((s, n) => s + n.midi, 0) / ns.length + off;
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
        const x = xOf(n.start), y = yOf(n.midi + off), nw = Math.max(3, n.dur * ppt - 1);
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
      if (n.track === track && n.midi + off === m && tk >= n.start && tk < n.start + n.dur) return n;
    }
    // A faint note of another track: switch to that track
    for (let i = model.notes.length - 1; i >= 0; i--) {
      const n = model.notes[i];
      if (n.midi + off === m && tk >= n.start && tk < n.start + n.dur) return n;
    }
    return null;
  };
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect(), n = hitNote(e.clientX - r.left, e.clientY - r.top);
    if (n && n.track === track) change(() => { reviewed([n]); model.notes = model.notes.filter((x) => x !== n); selected.delete(n.id); });
  });
  // Touch points (for the pinch), and the pinch itself
  const touches = new Map();
  let pinch = null, holdTimer = 0;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  // Stop what one finger was doing when a second one comes down (a note moved so far goes back)
  function cancelDrag() {
    clearTimeout(holdTimer);
    if (drag && (drag.mode === "move" || drag.mode === "resize") && drag.moved) restore(drag.before);
    drag = null;
  }
  function startPinch() {
    const [a, b] = [...touches.values()], midX = (a.x + b.x) / 2;
    pinch = { dx0: Math.max(40, Math.abs(a.x - b.x)), ppt0: ppt, tick: tickAt(midX), midY0: (a.y + b.y) / 2, st0: scroller.scrollTop };
  }
  function movePinch() {
    const [a, b] = [...touches.values()];
    zoomTo(pinch.ppt0 * Math.max(40, Math.abs(a.x - b.x)) / pinch.dx0, (a.x + b.x) / 2, pinch.tick);
    scroller.scrollTop = pinch.st0 - ((a.y + b.y) / 2 - pinch.midY0);
  }
  const clearMeasure = () => { if (selMeasure == null) return false; selMeasure = null; renderBar(); draw(); return true; };

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    scroller.focus({ preventScroll: true });
    const { x, y } = pos(e), touch = e.pointerType === "touch";
    if (touch) {
      touches.set(e.pointerId, { x, y });
      if (touches.size === 2) { cancelDrag(); startPinch(); draw(); return; }
      if (touches.size > 2) return;
    }
    canvas.setPointerCapture(e.pointerId);
    const base = { x0: x, y0: y, x, y, touch, sl0: scroller.scrollLeft, st0: scroller.scrollTop };
    // The ruler picks a measure (on release, so that a finger can also scroll from there)
    if (y < RH) { drag = Object.assign(base, { mode: "ruler" }); return; }
    // The keyboard plays the key; tapping it (or anywhere off the selected measure) ends the measure selection
    if (x < KW) { clearMeasure(); const m = midiAt(y); if (m >= LOW && m <= HIGH) opts.preview(m); drag = Object.assign(base, { mode: "keys" }); return; }
    let n = hitNote(x, y);
    if (n && n.track !== track) { track = n.track; selected.clear(); renderBar(); }
    if (n) {
      if (e.shiftKey || e.ctrlKey || e.metaKey) { if (selected.has(n.id)) selected.delete(n.id); else selected.add(n.id); }
      else if (!selected.has(n.id)) selected = new Set([n.id]);
      const edge = xOf(n.start + n.dur) - x < (touch ? 14 : 7) && n.dur * ppt > (touch ? 24 : 12);
      const sel = model.notes.filter((m) => selected.has(m.id));
      drag = Object.assign(base, { mode: edge ? "resize" : "move", anchor: n, before: snapshot(), orig: sel.map((m) => ({ n: m, start: m.start, dur: m.dur, midi: m.midi })), moved: false, lastMidi: n.midi });
      opts.preview(n.midi + off);
    } else {
      if (!e.shiftKey) selected.clear();
      drag = Object.assign(base, { mode: "tap" });
      // Touch: a drag scrolls, so selecting several starts with holding still for a moment
      if (touch) holdTimer = setTimeout(() => { if (drag && drag.mode === "tap") { drag.mode = "marquee"; try { navigator.vibrate && navigator.vibrate(10); } catch (err) {} draw(); } }, HOLD_MS);
    }
    draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = pos(e);
    if (e.pointerType === "touch" && touches.has(e.pointerId)) {
      touches.set(e.pointerId, { x, y });
      if (pinch) { if (touches.size >= 2) movePinch(); return; }
    }
    if (!drag) {
      if (e.pointerType !== "mouse") return;
      const n = y > RH && x > KW ? hitNote(x, y) : null;
      canvas.style.cursor = n && n.track === track ? (xOf(n.start + n.dur) - x < 7 && n.dur * ppt > 12 ? "ew-resize" : "grab") : y < RH ? "pointer" : "crosshair";
      return;
    }
    drag.x = x; drag.y = y;
    const far = Math.hypot(x - drag.x0, y - drag.y0) > (drag.touch ? 8 : 5);
    if (far && (drag.mode === "tap" || drag.mode === "ruler" || drag.mode === "keys")) {
      clearTimeout(holdTimer);
      // Touch: drag to scroll. Mouse: drag an empty spot to select several (the wheel scrolls)
      drag.mode = drag.touch ? "pan" : drag.mode === "tap" ? "marquee" : "none";
    }
    if (drag.mode === "pan") {
      scroller.scrollLeft = drag.sl0 - (x - drag.x0);
      scroller.scrollTop = drag.st0 - (y - drag.y0);
      return;
    }
    if (drag.mode === "marquee") {
      const ta = tickAt(Math.min(x, drag.x0)), tb = tickAt(Math.max(x, drag.x0)), ma = midiAt(Math.max(y, drag.y0)), mb = midiAt(Math.min(y, drag.y0));
      for (const n of model.notes) if (n.track === track && n.start < tb && n.start + n.dur > ta && n.midi + off >= ma && n.midi + off <= mb) selected.add(n.id);
    } else if (drag.mode === "move") {
      const a = drag.orig.find((o) => o.n === drag.anchor);
      const dt = Math.max(-Math.min(...drag.orig.map((o) => o.start)), snap(a.start + (x - drag.x0) / ppt) - a.start);
      const dp = Math.round((drag.y0 - y) / ROW);
      for (const o of drag.orig) { o.n.start = o.start + dt; o.n.midi = Math.max(PIANO_LO, Math.min(PIANO_HI, o.midi + dp)); }
      drag.moved = drag.moved || dt !== 0 || dp !== 0;
      if (drag.anchor.midi !== drag.lastMidi) { drag.lastMidi = drag.anchor.midi; opts.preview(drag.anchor.midi + off); }
    } else if (drag.mode === "resize") {
      const a = drag.orig.find((o) => o.n === drag.anchor);
      const end = Math.max(a.start + grid, snap(a.start + a.dur + (x - drag.x0) / ppt));
      const dd = end - (a.start + a.dur);
      for (const o of drag.orig) o.n.dur = Math.max(grid, o.dur + dd);
      drag.moved = drag.moved || dd !== 0;
    } else return;
    draw();
    autoScroll(x, y);
  });
  const finish = (e) => {
    if (e.pointerType === "touch") {
      touches.delete(e.pointerId);
      if (pinch) { if (touches.size < 2) pinch = null; return; }
    }
    clearTimeout(holdTimer);
    if (!drag) return;
    const d = drag; drag = null;
    if (e.type === "pointercancel") { if ((d.mode === "move" || d.mode === "resize") && d.moved) restore(d.before); draw(); return; }
    if (d.mode === "ruler") {
      const tk = tickAt(d.x0);
      if (tk >= 0 && tk < modelEnd(model)) { const i = measureAt(model, tk); selMeasure = selMeasure === i ? null : i; renderBar(); }
      else clearMeasure();
    } else if (d.mode === "tap") {
      // With a measure selected, a tap off it only ends the selection
      if (clearMeasure()) return;
      const tk = snapDown(tickAt(d.x0)), m = midiAt(d.y0);
      if (tk >= 0 && tk < modelEnd(model) && m - off >= PIANO_LO && m - off <= PIANO_HI) {
        const n = { id: newId(), track, start: tk, dur: lastDur, midi: m - off };
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
  // Ctrl + wheel, and a trackpad pinch (Chrome and Firefox send it as Ctrl + wheel): zoom in time
  scroller.addEventListener("wheel", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomBy(Math.exp(-Math.max(-50, Math.min(50, e.deltaY)) * 0.01), pos(e).x);
  }, { passive: false });
  // Safari's trackpad pinch
  let gesturePpt = 0;
  scroller.addEventListener("gesturestart", (e) => { e.preventDefault(); gesturePpt = ppt; });
  scroller.addEventListener("gesturechange", (e) => { e.preventDefault(); if (gesturePpt) zoomTo(gesturePpt * e.scale, pos(e).x); });
  scroller.addEventListener("gestureend", (e) => { e.preventDefault(); gesturePpt = 0; });
  // A tap anywhere else on the page ends the measure selection (not the player: Play starts from the measure)
  const keepSel = opts.keepSelectionIn || "";
  function outside(e) {
    if (selMeasure == null || canvas.contains(e.target) || bar.contains(e.target)) return;
    if (keepSel && e.target.closest && e.target.closest(keepSel)) return;
    clearMeasure();
  }
  document.addEventListener("pointerdown", outside);
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
        for (const n of ns) { n.start += dx * grid; n.midi = Math.max(PIANO_LO, Math.min(PIANO_HI, n.midi + dy * (e.shiftKey ? 12 : 1))); }
        reviewed(ns);
      });
      if (dy && ns[0]) opts.preview(ns[0].midi + off);
      return;
    }
    // + and − zoom in time
    if (!mod && (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "_")) { e.preventDefault(); e.stopPropagation(); zoomBy(e.key === "+" || e.key === "=" ? 1.25 : 0.8); }
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
    // The app's transposition changed: show the notes moved by n semitones (the model does not change)
    setTranspose(n) {
      const d = (n || 0) - off;
      if (!d) return;
      off = n || 0;
      scroller.scrollTop = Math.max(0, scroller.scrollTop - d * ROW); // keep the notes where they were on screen
      renderBar(); draw();
    },
    destroy() { ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(holdTimer); document.removeEventListener("pointerdown", outside); host.innerHTML = ""; },
  };
}
