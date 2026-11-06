// Unit tests for public/sheetmusicplayer/score-model.mjs (MusicXML <-> note list).
// Run: npm install && npm test
// The module uses the browser's DOMParser / XMLSerializer; jsdom provides them here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const { window } = new JSDOM("");
globalThis.DOMParser = window.DOMParser;
globalThis.XMLSerializer = window.XMLSerializer;
const SM = await import("../public/sheetmusicplayer/score-model.mjs");

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const key = (model) => model.notes.map((n) => [n.track, n.start, n.dur, n.midi].join(",")).sort().join(";");

// Scores used in the tests: single melody, 3/4 waltz, and a grand staff
const SCORES = ["twinkle.musicxml", "waltz.musicxml", "piano.musicxml"];

for (const name of SCORES) {
  test(`${name}: read -> write -> read keeps every note and measure`, () => {
    const xml = fixture(name);
    const a = SM.parseScore(xml);
    assert.ok(a.notes.length > 0, "has notes");
    assert.ok(a.measures.length > 0, "has measures");
    assert.equal(a.measures.filter((m) => m.flagged).length, 0, "no measure is flagged as too long / short");
    const out = SM.buildXml(a, xml, 100);
    assert.match(out, /<score-partwise/);
    const b = SM.parseScore(out);
    assert.equal(b.measures.length, a.measures.length);
    assert.equal(key(b), key(a));
    assert.match(out, /<sound tempo="100"/, "tempo is written");
  });
}

test("piano.musicxml: the grand staff gives two tracks", () => {
  const m = SM.parseScore(fixture("piano.musicxml"));
  assert.equal(m.tracks.length, 2);
  assert.deepEqual(new Set(m.notes.map((n) => n.track)), new Set([0, 1]));
});

test("measures follow the time signature", () => {
  const m = SM.parseScore(fixture("waltz.musicxml"));
  assert.equal(m.measures[0].beats, 3);
  assert.equal(m.measures[0].len, 3 * SM.PPQ);
  m.measures.forEach((x, i) => { if (i) assert.equal(x.start, m.measures[i - 1].start + m.measures[i - 1].len); });
});

test("edited notes are written and read back", () => {
  const xml = fixture("twinkle.musicxml");
  const m = SM.parseScore(xml);
  // Move the first note up a tone, add a dotted eighth and a triplet quarter, change a length
  m.notes[0].midi += 2;
  m.notes.push({ id: SM.newId(), track: 0, start: SM.PPQ * 4, dur: 18, midi: 79 });
  m.notes.push({ id: SM.newId(), track: 0, start: SM.PPQ * 8, dur: 16, midi: 81 });
  m.notes[1].dur = SM.PPQ * 3; // crosses the bar line: written as tied notes
  const b = SM.parseScore(SM.buildXml(m, xml, null));
  assert.equal(key(b), key(m));
});

test("insertMeasure / deleteMeasure move the later notes", () => {
  const m = SM.parseScore(fixture("twinkle.musicxml"));
  const n = m.measures.length, len = m.measures[0].len;
  const later = m.notes.filter((x) => x.start >= len).map((x) => x.start);
  SM.insertMeasure(m, 0);
  assert.equal(m.measures.length, n + 1);
  assert.deepEqual(m.notes.filter((x) => x.start >= 2 * len).map((x) => x.start), later.map((s) => s + len));
  SM.deleteMeasure(m, 1);
  assert.equal(m.measures.length, n);
  assert.deepEqual(m.notes.filter((x) => x.start >= len).map((x) => x.start), later);
  assert.equal(SM.modelEnd(m), m.measures.reduce((s, x) => s + x.len, 0));
});

test("measureAt finds the measure of a tick", () => {
  const m = SM.parseScore(fixture("waltz.musicxml"));
  assert.equal(SM.measureAt(m, 0), 0);
  assert.equal(SM.measureAt(m, m.measures[2].start), 2);
  assert.equal(SM.measureAt(m, m.measures[2].start + 1), 2);
});

test("splitValues writes any length as notes that add up to it", () => {
  for (let d = 2; d <= 4 * 96; d++) {
    const parts = SM.splitValues(d);
    const sum = parts.reduce((s, v) => s + v[0], 0);
    assert.ok(Math.abs(sum - d) <= 1, `length ${d}: ${sum}`);
  }
  assert.deepEqual(SM.splitValues(36).map((v) => v[1] + ".".repeat(v[2])), ["quarter."]);
  assert.deepEqual(SM.splitValues(120).map((v) => v[0]), [96, 24]);
});

test("modelEvents are sorted and in quarter notes", () => {
  const m = SM.parseScore(fixture("piano.musicxml"));
  const ev = SM.modelEvents(m);
  assert.equal(ev.length, m.notes.length);
  for (let i = 1; i < ev.length; i++) assert.ok(ev[i][0] >= ev[i - 1][0]);
  assert.equal(ev[0][0], 0);
});

test("expandMultiRests turns a multi-measure rest into that many measures", () => {
  const xml = `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>M</part-name></score-part></part-list>
<part id="P1">
<measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef><measure-style><multiple-rest>3</multiple-rest></measure-style></attributes><note><rest measure="yes"/><duration>4</duration></note></measure>
<measure number="2"><note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>whole</type></note></measure>
</part></score-partwise>`;
  const before = SM.parseScore(xml);
  const after = SM.parseScore(SM.expandMultiRests(xml));
  assert.equal(before.measures.length, 2);
  assert.equal(after.measures.length, 4);
  assert.equal(after.notes[0].start, 3 * 4 * SM.PPQ);
  assert.equal(after.notes[0].midi, 72);
});

test("a score with no notes or a non-MusicXML file does not crash", () => {
  assert.doesNotThrow(() => SM.expandMultiRests("<foo/>"));
});

// ---------- Transposition ----------
const pitches = (xml) => SM.parseScore(xml).notes.map((n) => n.midi);
const one = (key, notes) => `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>M</part-name></score-part></part-list>
<part id="P1"><measure number="1"><attributes><divisions>1</divisions>${key == null ? "" : `<key><fifths>${key}</fifths></key>`}<time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
${notes.map(([s, a, o]) => `<note><pitch><step>${s}</step>${a ? `<alter>${a}</alter>` : ""}<octave>${o}</octave></pitch><duration>1</duration>${a ? "<accidental>sharp</accidental>" : ""}<type>quarter</type></note>`).join("")}
</measure></part></score-partwise>`;
const spelled = (xml) => Array.from(new DOMParser().parseFromString(xml, "application/xml").querySelectorAll("note pitch"))
  .map((p) => p.querySelector("step").textContent + (+(p.querySelector("alter") || { textContent: 0 }).textContent || "") + p.querySelector("octave").textContent);

for (const name of SCORES) {
  for (const semis of [-5, 2, 7, 12]) {
    test(`${name}: transposing by ${semis} moves every note by ${semis} semitones`, () => {
      const xml = fixture(name);
      const out = SM.transposeXml(xml, semis);
      assert.deepEqual(pitches(out), pitches(xml).map((m) => m + semis));
    });
  }
}

test("transposeXml: 0 returns the same file", () => {
  const xml = fixture("twinkle.musicxml");
  assert.equal(SM.transposeXml(xml, 0), xml);
});

test("transposeXml: the key signature follows, and notes keep their spelling in the key", () => {
  // C major: C E F# G  -> up a major 2nd: D major, D F# G# A
  const out = SM.transposeXml(one(0, [["C", 0, 4], ["E", 0, 4], ["F", 1, 4], ["G", 0, 4]]), 2);
  assert.match(out, /<fifths>2<\/fifths>/);
  assert.deepEqual(spelled(out), ["D4", "F14", "G14", "A4"]);
  assert.doesNotMatch(out, /<accidental>/, "printed accidentals are left to the display");
});

test("transposeXml: flat keys stay on the flat side", () => {
  // F major (1 flat), B flat -> down a semitone: E major (4 sharps), A
  const down = SM.transposeXml(one(-1, [["B", -1, 4]]), -1);
  assert.match(down, /<fifths>4<\/fifths>/);
  assert.deepEqual(spelled(down), ["A4"]);
  // E flat major (3 flats) up 3 semitones: G flat major (6 flats), not F sharp
  const up = SM.transposeXml(one(-3, [["E", -1, 4]]), 3);
  assert.match(up, /<fifths>-6<\/fifths>/);
  assert.deepEqual(spelled(up), ["G-14"]);
  // Octave: across B -> C the octave number changes
  assert.deepEqual(spelled(SM.transposeXml(one(0, [["B", 0, 4]]), 1)), ["C5"]);
});

test("transposedFifths keeps the number of accidentals small", () => {
  assert.equal(SM.transposedFifths(0, 1), -5);  // C -> Db
  assert.equal(SM.transposedFifths(0, 6), 6);   // C -> F#
  assert.equal(SM.transposedFifths(-1, 1), -6); // F -> Gb
  assert.equal(SM.transposedFifths(2, -2), 0);  // D -> C
});

// ---------- Title ----------
test("scoreTitle / withTitle", () => {
  assert.equal(SM.scoreTitle(fixture("piano.musicxml")), "Piano Duet Line (test)");
  const noTitle = one(0, [["C", 0, 4]]);
  assert.equal(SM.scoreTitle(noTitle), "");
  const out = SM.withTitle(noTitle, "Ode & Joy <1>");
  assert.equal(SM.scoreTitle(out), "Ode & Joy <1>");
  assert.match(out, /<score-partwise[^>]*><work><work-title>/, "work comes first");
  assert.deepEqual(pitches(out), pitches(noTitle));
});
