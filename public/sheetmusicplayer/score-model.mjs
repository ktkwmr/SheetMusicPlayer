// Score model for the editor: MusicXML <-> a flat list of notes on a time grid, and back.
//
// Times are in ticks, 24 per quarter note (PPQ), so 16ths (6), 32nds (3) and triplet
// 8ths (8) and 16ths (4) are whole numbers. The bar lines are taken from the time
// signatures, so a note keeps its place in its measure even when a measure the reader
// got wrong is too long or too short (those measures are flagged for the user).
//
// model = {
//   measures: [{ start, len, beats, beatType, fifths, src, flagged }]   src: index of the measure in the
//                                                                        source XML (-1 for a new one)
//   parts:    [{ id, staves, clefs: { [staff]: { sign, line } } }]
//   tracks:   [{ part, staff }]                                          one per staff (piano: right / left)
//   notes:    [{ id, track, start, dur, midi }]
// }

export const PPQ = 24;

const STEP_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const text = (el, sel) => { const x = el && el.querySelector(sel); return x ? x.textContent.trim() : null; };
const kids = (el, name) => Array.from(el.children).filter((c) => c.localName === name);

let nextId = 1;
export const newId = () => nextId++;

// ---------- Multi-measure rests ----------
// The reader writes "rest for 15 measures" as one measure with <multiple-rest>15</multiple-rest>.
// Add the missing empty measures so the playback and the editor have the right length.
export function expandMultiRests(xml) {
  if (!/<multiple-rest>/.test(xml)) return xml;
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parts = Array.from(doc.querySelectorAll("score-partwise > part"));
  if (!parts.length) return xml;
  const first = kids(parts[0], "measure");
  let changed = false;
  // Walk backwards so the indexes of the measures still to visit stay valid
  for (let i = first.length - 1; i >= 0; i--) {
    const n = +(text(first[i], "multiple-rest") || 0);
    if (n <= 1) continue;
    for (const part of parts) {
      const m = kids(part, "measure")[i];
      if (!m) continue;
      // Only rests in it: then it really is the multi-measure rest
      if (Array.from(m.querySelectorAll("note")).some((x) => !x.querySelector("rest"))) continue;
      const len = measureDivisions(part, i);
      const staves = +(text(part, "attributes staves") || 1);
      let after = m;
      for (let k = 1; k < n; k++) {
        const e = doc.createElement("measure");
        let inner = "";
        for (let s = 1; s <= staves; s++) {
          if (s > 1) inner += `<backup><duration>${len.divs}</duration></backup>`;
          inner += `<note><rest measure="yes"/><duration>${len.divs}</duration><voice>${(s - 1) * 4 + 1}</voice><staff>${s}</staff></note>`;
        }
        e.innerHTML = inner;
        after.after(e);
        after = e;
      }
      changed = true;
    }
  }
  if (!changed) return xml;
  for (const part of parts) kids(part, "measure").forEach((m, i) => m.setAttribute("number", String(i + 1)));
  return new XMLSerializer().serializeToString(doc);
}

// Length of measure i in divisions, from the time signature and divisions in force there
function measureDivisions(part, index) {
  let divisions = 1, beats = 4, beatType = 4;
  kids(part, "measure").slice(0, index + 1).forEach((m) => {
    m.querySelectorAll("attributes").forEach((a) => {
      if (text(a, "divisions")) divisions = +text(a, "divisions");
      if (text(a, "time beats")) { beats = +text(a, "time beats"); beatType = +text(a, "time beat-type"); }
    });
  });
  return { divs: Math.round(beats * 4 / beatType * divisions) };
}

// ---------- MusicXML -> model ----------
export function parseScore(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const partEls = Array.from(doc.querySelectorAll("score-partwise > part"));
  if (!partEls.length) throw new Error("No parts in the score");
  const model = { measures: [], parts: [], tracks: [], notes: [] };

  // Bar lines: from the time signatures of the first part
  let beats = 4, beatType = 4, fifths = 0, start = 0;
  kids(partEls[0], "measure").forEach((m, i) => {
    m.querySelectorAll("attributes").forEach((a) => {
      if (text(a, "time beats")) { beats = +text(a, "time beats"); beatType = +text(a, "time beat-type"); }
      if (text(a, "key fifths") != null) fifths = +text(a, "key fifths");
    });
    const len = Math.round(beats * 4 / beatType * PPQ);
    model.measures.push({ start, len, beats, beatType, fifths, src: i, flagged: false });
    start += len;
  });

  // Tracks, one per staff, in part / staff order (created before the notes so the order is fixed)
  const trackOf = {};
  partEls.forEach((partEl, p) => {
    let staves = 1;
    partEl.querySelectorAll("attributes staves").forEach((x) => { staves = Math.max(staves, +x.textContent || 1); });
    model.parts.push({ id: partEl.getAttribute("id") || "P" + (p + 1), staves, clefs: {} });
    for (let s = 1; s <= staves; s++) { trackOf[p + ":" + s] = model.tracks.length; model.tracks.push({ part: p, staff: s }); }
  });
  const track = (p, staff) => {
    const key = p + ":" + staff;
    if (trackOf[key] == null) { trackOf[key] = model.tracks.length; model.tracks.push({ part: p, staff }); }
    return trackOf[key];
  };

  partEls.forEach((partEl, p) => {
    const part = model.parts[p];
    let divisions = 1;
    const open = []; // tied notes waiting for their continuation
    kids(partEl, "measure").forEach((m, i) => {
      const meas = model.measures[i];
      if (!meas) return;
      let pos = 0, lastStart = 0, maxPos = 0;
      for (const el of Array.from(m.children)) {
        const name = el.localName;
        if (name === "attributes") {
          if (text(el, "divisions")) divisions = +text(el, "divisions");
          el.querySelectorAll("clef").forEach((c) => {
            const s = +(c.getAttribute("number") || 1);
            if (!part.clefs[s]) part.clefs[s] = { sign: text(c, "sign") || "G", line: +(text(c, "line") || 2) };
          });
        } else if (name === "backup") pos -= +(text(el, "duration") || 0);
        else if (name === "forward") { pos += +(text(el, "duration") || 0); maxPos = Math.max(maxPos, pos); }
        else if (name === "note") {
          if (el.querySelector("grace") || el.querySelector("cue")) continue;
          const dur = +(text(el, "duration") || 0);
          const isChord = !!el.querySelector("chord");
          const at = isChord ? lastStart : pos;
          if (!isChord) { lastStart = pos; pos += dur; maxPos = Math.max(maxPos, pos); }
          if (el.querySelector("rest") || !el.querySelector("pitch")) continue;
          const midi = (+(text(el, "pitch octave")) + 1) * 12 + STEP_PC[text(el, "pitch step")] + Math.round(+(text(el, "pitch alter") || 0));
          const t = track(p, +(text(el, "staff") || 1));
          const s = meas.start + Math.round(at * PPQ / divisions);
          const d = Math.max(1, Math.round(dur * PPQ / divisions));
          const ties = Array.from(el.querySelectorAll("tie, tied")).map((x) => x.getAttribute("type"));
          // Continuation of a tied note: lengthen the first note instead
          const prev = ties.includes("stop") && open.find((o) => o.track === t && o.midi === midi && Math.abs(o.start + o.dur - s) <= 1);
          if (prev) {
            prev.dur = s + d - prev.start;
            if (!ties.includes("start")) open.splice(open.indexOf(prev), 1);
            continue;
          }
          const note = { id: newId(), track: t, start: s, dur: d, midi };
          model.notes.push(note);
          if (ties.includes("start")) open.push(note);
        }
      }
      // A measure the reader got the wrong length of: show it to the user
      const actual = Math.round(maxPos * PPQ / divisions);
      if (maxPos > 0 && Math.abs(actual - meas.len) > 1 && !m.querySelector("multiple-rest")) meas.flagged = true;
    });
  });
  return model;
}

// ---------- model -> playback events ----------
// [start in quarters, length in quarters, MIDI note], sorted by start
export function modelEvents(model) {
  return model.notes.map((n) => [n.start / PPQ, n.dur / PPQ, n.midi]).sort((a, b) => a[0] - b[0] || a[2] - b[2]);
}

export const modelEnd = (model) => {
  const m = model.measures[model.measures.length - 1];
  return m ? m.start + m.len : 0;
};

// ---------- Measures ----------
export function measureAt(model, tick) {
  const ms = model.measures;
  let lo = 0, hi = ms.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ms[mid].start <= tick) lo = mid; else hi = mid - 1; }
  return lo;
}

function relayout(model) {
  let s = 0;
  for (const m of model.measures) { m.start = s; s += m.len; }
}

// Insert an empty measure (same time signature and key) after measure i; later notes move back
export function insertMeasure(model, i) {
  const ref = model.measures[i];
  const at = ref.start + ref.len;
  model.measures.splice(i + 1, 0, { start: at, len: ref.len, beats: ref.beats, beatType: ref.beatType, fifths: ref.fifths, src: -1, flagged: false });
  for (const n of model.notes) if (n.start >= at) n.start += ref.len;
  relayout(model);
}

// Delete measure i and the notes that start in it; later notes move forward
export function deleteMeasure(model, i) {
  if (model.measures.length <= 1) return;
  const m = model.measures[i], end = m.start + m.len;
  model.notes = model.notes.filter((n) => n.start < m.start || n.start >= end);
  for (const n of model.notes) {
    if (n.start >= end) n.start -= m.len;
    else if (n.start + n.dur > m.start) n.dur = Math.max(1, Math.min(n.start + n.dur, m.start) - n.start); // cut at the deleted measure
  }
  model.measures.splice(i, 1);
  relayout(model);
}

// ---------- model -> MusicXML ----------
// Note values in ticks: [ticks, type, dots, triplet]
const VALUES = [
  [96, "whole", 0, false], [72, "half", 1, false], [48, "half", 0, false], [36, "quarter", 1, false],
  [32, "half", 0, true], [24, "quarter", 0, false], [18, "eighth", 1, false], [16, "quarter", 0, true],
  [12, "eighth", 0, false], [9, "16th", 1, false], [8, "eighth", 0, true], [6, "16th", 0, false],
  [4, "16th", 0, true], [3, "32nd", 0, false], [2, "32nd", 0, true],
];
// Split a length into values that can be written (tied together)
export function splitValues(d) {
  const out = [];
  while (d >= 2) {
    const binary = d % 3 === 0;
    const v = VALUES.find((x) => x[0] <= d && (binary ? !x[3] : true) && (binary || d - x[0] === 0 || d - x[0] >= 2));
    if (!v) break;
    out.push(v);
    d -= v[0];
  }
  if (!out.length) out.push(VALUES[VALUES.length - 1]);
  return out;
}

const SHARP_NAMES = [["C", 0], ["C", 1], ["D", 0], ["D", 1], ["E", 0], ["F", 0], ["F", 1], ["G", 0], ["G", 1], ["A", 0], ["A", 1], ["B", 0]];
const FLAT_NAMES = [["C", 0], ["D", -1], ["D", 0], ["E", -1], ["E", 0], ["F", 0], ["G", -1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0]];
function spell(midi, fifths) {
  const [step, alter] = (fifths < 0 ? FLAT_NAMES : SHARP_NAMES)[((midi % 12) + 12) % 12];
  // B# / Cb are never needed with these tables, so the octave is simply midi / 12
  return { step, alter, octave: Math.floor(midi / 12) - 1 };
}

function noteXml({ midi, ticks, value, chord, tieStart, tieStop, voice, staff, fifths, rest, measureRest }) {
  const [, type, dots, triplet] = value;
  let x = "<note>";
  if (chord) x += "<chord/>";
  if (rest) x += measureRest ? '<rest measure="yes"/>' : "<rest/>";
  else { const p = spell(midi, fifths); x += `<pitch><step>${p.step}</step>${p.alter ? `<alter>${p.alter}</alter>` : ""}<octave>${p.octave}</octave></pitch>`; }
  x += `<duration>${ticks}</duration>`;
  if (tieStop) x += '<tie type="stop"/>';
  if (tieStart) x += '<tie type="start"/>';
  x += `<voice>${voice}</voice>`;
  if (!measureRest) x += `<type>${type}</type>` + "<dot/>".repeat(dots);
  if (triplet) x += "<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>";
  x += `<staff>${staff}</staff>`;
  if (tieStart || tieStop) x += `<notations>${tieStop ? '<tied type="stop"/>' : ""}${tieStart ? '<tied type="start"/>' : ""}</notations>`;
  return x + "</note>";
}

// Writes the model back as MusicXML. The header, part list and part ids, and each source
// measure's bar lines (repeats, endings) and line breaks are kept from the source XML.
// Lyrics, slurs, articulations and other markings are not kept.
export function buildXml(model, sourceXml, tempo) {
  const doc = new DOMParser().parseFromString(sourceXml, "application/xml");
  const partEls = Array.from(doc.querySelectorAll("score-partwise > part"));
  model.parts.forEach((part, p) => {
    const partEl = partEls[p];
    if (!partEl) return;
    const srcMeasures = kids(partEl, "measure");
    const tracks = model.tracks.map((tr, i) => ({ ...tr, i })).filter((tr) => tr.part === p);
    let xml = "";
    let prev = null;
    model.measures.forEach((meas, mi) => {
      const src = meas.src >= 0 ? srcMeasures[meas.src] : null;
      let body = "";
      if (src) src.querySelectorAll(":scope > print").forEach((pr) => { body += new XMLSerializer().serializeToString(pr); });
      // Attributes at the start and wherever the time signature or key changes
      if (!prev || prev.beats !== meas.beats || prev.beatType !== meas.beatType || prev.fifths !== meas.fifths) {
        body += "<attributes>";
        if (!prev) body += `<divisions>${PPQ}</divisions>`;
        body += `<key><fifths>${meas.fifths}</fifths></key><time><beats>${meas.beats}</beats><beat-type>${meas.beatType}</beat-type></time>`;
        if (!prev) {
          if (part.staves > 1) body += `<staves>${part.staves}</staves>`;
          for (let s = 1; s <= part.staves; s++) {
            const c = part.clefs[s] || (s === 1 ? { sign: "G", line: 2 } : { sign: "F", line: 4 });
            body += `<clef number="${s}"><sign>${c.sign}</sign><line>${c.line}</line></clef>`;
          }
        }
        body += "</attributes>";
      }
      if (mi === 0 && p === 0 && tempo) {
        body += `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${Math.round(tempo)}</per-minute></metronome></direction-type><sound tempo="${Math.round(tempo)}"/></direction>`;
      }
      const mStart = meas.start, mEnd = meas.start + meas.len;
      let wroteAny = false;
      tracks.forEach((tr) => {
        const staff = tr.staff;
        // The part of each note that falls in this measure
        const segs = model.notes
          .filter((n) => n.track === tr.i && n.start < mEnd && n.start + n.dur > mStart)
          .map((n) => {
            const s = Math.max(n.start, mStart), e = Math.min(n.start + n.dur, mEnd);
            return { midi: n.midi, start: s - mStart, dur: e - s, tieStop: n.start < mStart, tieStart: n.start + n.dur > mEnd };
          })
          .filter((s) => s.dur >= 2)
          .sort((a, b) => a.start - b.start || b.dur - a.dur || b.midi - a.midi);
        // Group into chords (same start and length), then put the chords into voices that do not overlap
        const chords = [];
        for (const s of segs) {
          const c = chords.find((x) => x.start === s.start && x.dur === s.dur);
          if (c) c.notes.push(s); else chords.push({ start: s.start, dur: s.dur, notes: [s] });
        }
        const voices = [];
        for (const c of chords) {
          let v = voices.find((x) => x.end <= c.start);
          if (!v) { if (voices.length >= 4) continue; v = { end: 0, chords: [] }; voices.push(v); }
          v.chords.push(c); v.end = c.start + c.dur;
        }
        if (!voices.length) voices.push({ end: 0, chords: [] });
        voices.forEach((v, vi) => {
          const voiceNo = (staff - 1) * 4 + vi + 1;
          if (wroteAny) body += `<backup><duration>${meas.len}</duration></backup>`;
          wroteAny = true;
          let at = 0;
          const gap = (to) => {
            if (to <= at) return;
            if (vi === 0) {
              if (at === 0 && to === meas.len) body += noteXml({ rest: true, measureRest: true, ticks: meas.len, value: VALUES[0], voice: voiceNo, staff });
              else for (const val of splitValues(to - at)) body += noteXml({ rest: true, ticks: val[0], value: val, voice: voiceNo, staff });
            } else body += `<forward><duration>${to - at}</duration><voice>${voiceNo}</voice><staff>${staff}</staff></forward>`;
            at = to;
          };
          for (const c of v.chords) {
            gap(c.start);
            const pieces = splitValues(c.dur);
            pieces.forEach((val, k) => {
              c.notes.forEach((n, j) => {
                body += noteXml({
                  midi: n.midi, ticks: val[0], value: val, chord: j > 0, voice: voiceNo, staff, fifths: meas.fifths,
                  tieStop: k > 0 || n.tieStop, tieStart: k < pieces.length - 1 || n.tieStart,
                });
              });
            });
            at = c.start + c.dur;
          }
          gap(meas.len);
        });
      });
      if (src) src.querySelectorAll(":scope > barline").forEach((b) => { body += new XMLSerializer().serializeToString(b); });
      xml += `<measure number="${mi + 1}">${body}</measure>`;
      prev = meas;
    });
    partEl.innerHTML = xml;
  });
  return new XMLSerializer().serializeToString(doc);
}
