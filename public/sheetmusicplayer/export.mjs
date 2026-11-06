// Export of what is played: a Standard MIDI File, and an MP3 rendered with the app's own synthesizer.
//
// events: [start in quarters, length in quarters, MIDI note, track key], sorted by start
// tracks: [{ key, name }] in display order (one per staff)

// ---------- MIDI ----------
const PPQ = 480;

function vlq(n) {
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
}
const ascii = (s) => Array.from(new TextEncoder().encode(s));
function chunk(type, bytes) {
  const n = bytes.length;
  return [...ascii(type), (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255, ...bytes];
}
// msgs: [tick, order, bytes]; note-offs (order 0) come before note-ons (order 1) on the same tick
function trackChunk(msgs) {
  msgs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const bytes = [];
  let last = 0;
  for (const [tick, , data] of msgs) { bytes.push(...vlq(tick - last), ...data); last = tick; }
  bytes.push(0, 0xff, 0x2f, 0);
  return chunk("MTrk", bytes);
}

// A format 1 file: track 0 has the tempo and the first time signature, then one track per staff
export function midiFile({ events, tracks, bpm, timeSig, title }) {
  const us = Math.round(60e6 / bpm);
  const beats = (timeSig && timeSig[0]) || 4, beatType = (timeSig && timeSig[1]) || 4;
  const meta = [
    [0, 0, [0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255]],
    [0, 0, [0xff, 0x58, 4, beats, Math.round(Math.log2(beatType)), 24, 8]],
  ];
  if (title) { const b = ascii(title).slice(0, 120); meta.unshift([0, 0, [0xff, 0x03, ...vlq(b.length), ...b]]); }
  const chunks = [trackChunk(meta)];
  tracks.forEach((tr, i) => {
    const ch = i < 9 ? i : i + 1 < 16 ? i + 1 : 15; // channel 10 is for drums
    const name = ascii(tr.name || "").slice(0, 120);
    const msgs = [[0, 0, [0xff, 0x03, ...vlq(name.length), ...name]], [0, 0, [0xc0 | ch, 0]]];
    for (const e of events) {
      if (e[3] !== tr.key || e[2] < 0 || e[2] > 127) continue;
      const on = Math.round(e[0] * PPQ), off = Math.max(on + 1, Math.round((e[0] + e[1]) * PPQ));
      msgs.push([on, 1, [0x90 | ch, e[2], 80]], [off, 0, [0x80 | ch, e[2], 0]]);
    }
    chunks.push(trackChunk(msgs));
  });
  const n = chunks.length;
  return new Uint8Array([...chunk("MThd", [0, 1, (n >> 8) & 255, n & 255, (PPQ >> 8) & 255, PPQ & 255]), ...chunks.flat()]);
}

// ---------- MP3 ----------
// The piece is rendered in short pieces (OfflineAudioContext) and encoded as it goes, so memory
// stays small even for long pieces. A note started in one piece rings on into the next ones: the
// samples are added into a buffer that is as long as one piece plus the longest note.
// voice(audioContext, destination, midi, start time, duration, volume) is the app's synthesizer.
// lame: the lamejs global (vendor/lame.min.js).
export async function renderMp3({ events, endQ, bpm, gainOf, voice, lame, sampleRate = 44100, kbps = 128, onProgress, isCancelled }) {
  const sec = (q) => q * 60 / bpm;
  const STEP = 20, total = sec(endQ) + 1.5;
  let longest = 0;
  for (const e of events) longest = Math.max(longest, sec(e[1]));
  const tail = Math.min(60, longest + 2);
  const step = Math.round(STEP * sampleRate), span = Math.ceil((STEP + tail) * sampleRate);
  const acc = new Float32Array(span);
  const enc = new lame.Mp3Encoder(1, sampleRate, kbps);
  const parts = [];
  const pcm = new Int16Array(1152);
  let ei = 0;
  for (let k = 0; k * STEP < total; k++) {
    if (isCancelled && isCancelled()) return null;
    const from = k * STEP, to = from + STEP;
    const list = [];
    while (ei < events.length && sec(events[ei][0]) < to) { list.push(events[ei]); ei++; }
    const notes = list.filter((e) => gainOf(e[3]) > 0);
    if (notes.length) {
      const ac = new OfflineAudioContext(1, span, sampleRate);
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
      const master = ac.createGain(); master.gain.value = 0.7;
      master.connect(comp); comp.connect(ac.destination);
      for (const e of notes) voice(ac, master, e[2], Math.max(0, sec(e[0]) - from), sec(e[1]) * 0.96, gainOf(e[3]));
      const buf = await ac.startRendering();
      const d = buf.getChannelData(0);
      for (let i = 0; i < span; i++) acc[i] += d[i];
    }
    // The first STEP seconds are final now: no later piece starts a note before them
    const n = Math.min(step, Math.max(0, Math.round((total - from) * sampleRate)));
    for (let i = 0; i < n; i += 1152) {
      const m = Math.min(1152, n - i);
      for (let j = 0; j < m; j++) { const v = acc[i + j]; pcm[j] = v >= 1 ? 32767 : v <= -1 ? -32768 : Math.round(v * 32767); }
      const out = enc.encodeBuffer(m === 1152 ? pcm : pcm.subarray(0, m));
      if (out.length) parts.push(new Uint8Array(out));
    }
    acc.copyWithin(0, step); acc.fill(0, span - step);
    if (onProgress) onProgress(Math.min(1, to / total));
    await new Promise((r) => setTimeout(r, 0)); // let the page draw the progress
  }
  const out = enc.flush();
  if (out.length) parts.push(new Uint8Array(out));
  return new Blob(parts, { type: "audio/mpeg" });
}
