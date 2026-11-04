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

// homr has no tie symbol: a tie comes out as a slur (stop written before start on a middle note)
const homrNote = (step, octave, dur, slurs, { alter, chord, staff = 1 } = {}) =>
  `<note>${chord ? "<chord/>" : ""}<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch><type>quarter</type><duration>${dur}</duration><staff>${staff}</staff><voice>1</voice>` +
  `<notations>${slurs.map((t) => `<slur type="${t}" number="${staff}"/>`).join("")}</notations></note>`;
const homrScore = (...measures) => `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>M</part-name></score-part></part-list><part id="P1">` +
  measures.map((m, i) => `<measure number="${i + 1}">${i === 0 ? "<attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>" : ""}${m}</measure>`).join("") + `</part></score-partwise>`;

test("slursToTies turns a slur between two notes of the same pitch into a tie", () => {
  const xml = homrScore(
    homrNote("E", 4, 4, []) + homrNote("C", 5, 4, ["start"]),
    homrNote("C", 5, 4, ["stop"]) + homrNote("D", 5, 4, []),
  );
  const out = SM.slursToTies(xml);
  assert.doesNotMatch(out, /<slur/);
  assert.match(out, /<tie type="start"\/>/);
  assert.match(out, /<tied type="stop"\/>/);
  const m = SM.parseScore(out);
  assert.deepEqual(m.notes.map((n) => [n.start, n.dur, n.midi]), [[0, 48, 64], [48, 96, 72], [144, 48, 74]]);
});

test("slursToTies joins a chain of tied notes and keeps the first note's accidental", () => {
  const xml = homrScore(
    homrNote("F", 4, 2, ["start"], { alter: 1 }) + homrNote("F", 4, 2, ["stop", "start"]) + homrNote("F", 4, 4, ["stop"]),
  );
  const m = SM.parseScore(SM.slursToTies(xml));
  assert.deepEqual(m.notes.map((n) => [n.start, n.dur, n.midi]), [[0, 96, 66]]);
});

test("slursToTies leaves real slurs alone", () => {
  // Different pitches, and a slur over several notes that starts and ends on the same pitch
  const xml = homrScore(
    homrNote("C", 5, 4, ["start"]) + homrNote("D", 5, 4, ["stop"]),
    homrNote("E", 5, 2, ["start"]) + homrNote("D", 5, 2, []) + homrNote("E", 5, 4, ["stop"]),
  );
  assert.equal(SM.slursToTies(xml), xml);
});

test("slursToTies ties only the matching notes of a chord", () => {
  const xml = homrScore(
    homrNote("C", 4, 4, ["start"]) + homrNote("E", 4, 4, ["start"], { chord: true }) +
    homrNote("C", 4, 4, ["stop"]) + homrNote("G", 4, 4, ["stop"], { chord: true }),
  );
  const m = SM.parseScore(SM.slursToTies(xml));
  assert.deepEqual(m.notes.map((n) => [n.start, n.dur, n.midi]).sort((a, b) => a[2] - b[2]), [[0, 96, 60], [0, 48, 64], [48, 48, 67]]);
});
