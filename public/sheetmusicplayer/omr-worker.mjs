// Recognition worker: runs homr (optical music recognition) in Pyodide.
// The ONNX models run in onnxruntime-web; Python calls them synchronously through
// JavaScript Promise Integration (pyodide.ffi.run_sync), so homr's code is unchanged.
//
// Messages from the page:
//   { type: "init" }                                      download (first time) and start the engine
//   { type: "page", id, rgba, width, height, tempo }      recognize one page -> MusicXML
// Messages to the page:
//   { type: "progress", stage, done, total }              stage: download | start | segment | staff | xml
//   { type: "ready" } / { type: "result", id, xml, ms } / { type: "error", id?, code, message }
//
// The engine files (engine/<version>/, ~130 MB) never change for a version, so they are
// kept in their own Cache Storage entry (cache first). sw.js leaves them to this worker.

const ENGINE_VERSION = "v3";
const BASE = new URL("./", import.meta.url).href;
const ENGINE = BASE + "engine/" + ENGINE_VERSION + "/";
const CACHE = "sheetmusicplayer-engine-" + ENGINE_VERSION;

const post = (type, data = {}) => self.postMessage({ type, ...data });
const nativeFetch = self.fetch.bind(self);

// ---------- Engine files (cache first, with download progress) ----------
let cache = null;
async function openCache() {
  if (cache || !self.caches) return cache;
  try {
    cache = await caches.open(CACHE);
    // Remove older engine versions (only this app's engine caches)
    for (const k of await caches.keys()) if (k.startsWith("sheetmusicplayer-engine-") && k !== CACHE) caches.delete(k);
  } catch (e) { cache = null; }
  return cache;
}

let manifest = null, loaded = 0, total = 0;
async function engineFetch(url, { count = true } = {}) {
  const c = await openCache();
  if (c) {
    const hit = await c.match(url);
    if (hit) return hit;
  }
  let res;
  try { res = await nativeFetch(url); } catch (e) { throw Object.assign(new Error("Network error: " + url), { code: "download" }); }
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${url}`), { code: "download" });
  // Count the bytes as they stream into the cache (nothing large is held in memory)
  let last = 0;
  const counted = !count || !res.body ? res : new Response(res.body.pipeThrough(new TransformStream({
    transform(chunk, ctl) {
      loaded += chunk.byteLength;
      const now = performance.now();
      if (now - last > 120) { last = now; post("progress", { stage: "download", done: loaded, total }); }
      ctl.enqueue(chunk);
    },
  })), { headers: { "content-type": res.headers.get("content-type") || "application/octet-stream" } });
  if (!c) return counted;
  try {
    await c.put(url, counted);
    const stored = await c.match(url);
    if (stored) return stored;
  } catch (e) { /* storage full or blocked: fall back to the network */ }
  return nativeFetch(url);
}

// Pyodide fetches its own files; route the engine URLs through the cache as well
self.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  if (url && url.startsWith(ENGINE) && (!init || !init.method || init.method === "GET")) return engineFetch(url);
  return nativeFetch(input, init);
};

// Download everything once up front, so progress is shown in one bar
async function prefetchAll() {
  manifest = await (await nativeFetch(ENGINE + "manifest.json", { cache: "no-cache" })).json();
  const c = await openCache();
  const files = Object.entries(manifest.files);
  const missing = [];
  for (const [rel, info] of files) {
    if (c && (await c.match(ENGINE + rel))) continue;
    missing.push([rel, info]);
  }
  total = missing.reduce((s, [, i]) => s + i.size, 0);
  loaded = 0;
  if (!missing.length) return false;
  post("progress", { stage: "download", done: 0, total });
  // Two at a time: fast enough, and the progress stays smooth
  const queue = missing.slice();
  async function next() {
    while (queue.length) {
      const [rel] = queue.shift();
      const res = await engineFetch(ENGINE + rel);
      if (!c) await res.arrayBuffer(); // without Cache Storage, at least warm the HTTP cache
    }
  }
  await Promise.all([next(), next()]);
  post("progress", { stage: "download", done: total, total });
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  return true;
}

// ---------- onnxruntime-web layer (called from engine/python/onnxruntime/__init__.py) ----------
let ort = null;
const sessions = [];
const MODELS = {
  segnet: ["models/segnet.int8.onnx"],
  encoder: ["models/encoder.int8.onnx"],
  decoder: ["models/decoder.onnx.part0", "models/decoder.onnx.part1"],
};
const TYPED = { float32: Float32Array, float16: Uint16Array, int64: BigInt64Array, int32: Int32Array, uint8: Uint8Array, bool: Uint8Array };
async function modelBytes(key) {
  const parts = await Promise.all(MODELS[key].map(async (p) => new Uint8Array(await (await engineFetch(ENGINE + p)).arrayBuffer())));
  if (parts.length === 1) return parts[0];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.byteLength, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  return out;
}
self.ortShim = {
  async create(path) {
    const key = Object.keys(MODELS).find((k) => path.includes(k));
    if (!key) throw new Error("Unknown model: " + path);
    const s = await ort.InferenceSession.create(await modelBytes(key), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    sessions.push(s);
    return { id: sessions.length - 1, inputNames: s.inputNames, outputNames: s.outputNames };
  },
  tensor(type, u8, dims) {
    const C = TYPED[type];
    return new ort.Tensor(type, new C(u8.buffer, u8.byteOffset, u8.byteLength / C.BYTES_PER_ELEMENT), Array.from(dims));
  },
  bytes(t) {
    const d = t.data;
    return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
  },
  async run(id, feeds, names) {
    const out = await sessions[id].run(feeds, Array.from(names));
    return Array.from(names, (n) => out[n]);
  },
};

// ---------- Pyodide + homr ----------
let py = null, recognize = null;
async function start() {
  if (typeof WebAssembly.Suspending !== "function") {
    throw Object.assign(new Error("JavaScript Promise Integration is not supported"), { code: "unsupported" });
  }
  await prefetchAll();
  post("progress", { stage: "start" });
  ort = await import(ENGINE + "ort/ort.wasm.min.mjs");
  ort.env.wasm.wasmPaths = ENGINE + "ort/";
  // Threads need cross-origin isolation (COOP/COEP headers in public/_headers)
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 2) - 1)) : 1;
  const { loadPyodide } = await import(ENGINE + "pyodide/pyodide.mjs");
  py = await loadPyodide({ indexURL: ENGINE + "pyodide/", stdout: () => {}, stderr: () => {} });
  await py.loadPackage(["numpy", "opencv-python", "pillow", "typing-extensions",
    ENGINE + "pyodide/" + wheel("verysimpletree"), ENGINE + "pyodide/" + wheel("musicxml")], { messageCallback: () => {} });
  const zip = await (await engineFetch(ENGINE + "homr.zip")).arrayBuffer();
  py.unpackArchive(zip, "zip", { extractDir: "/home/pyodide/app" });
  py.runPython("import sys; sys.path.insert(0, '/home/pyodide/app')");
  await py.runPythonAsync("import smp_omr");
  const mod = py.globals.get("smp_omr");
  mod.set_progress((stage, done, totalStaffs) => post("progress", { stage, done, total: totalStaffs }));
  recognize = mod.recognize;
  post("ready");
}
const wheel = (name) => Object.keys(manifest.files).map((f) => f.split("/").pop()).find((f) => f.startsWith(name + "-") && f.endsWith(".whl"));

let starting = null;
self.onmessage = async (ev) => {
  const msg = ev.data;
  if (msg.type === "init") {
    starting = starting || start().catch((e) => { starting = null; post("error", errorInfo(e)); throw e; });
    return;
  }
  if (msg.type === "page") {
    try {
      starting = starting || start();
      await starting;
      const t0 = performance.now();
      const xml = await recognize.callPromising(new Uint8Array(msg.rgba), msg.width, msg.height, msg.tempo || null);
      post("result", { id: msg.id, xml, ms: Math.round(performance.now() - t0) });
    } catch (e) {
      post("error", { id: msg.id, ...errorInfo(e) });
    }
  }
};

function errorInfo(e) {
  const message = String((e && e.message) || e);
  let code = (e && e.code) || "recognize";
  if (/no-staff/.test(message)) code = "no-staff";
  else if (/memory|Out of bounds|RangeError: Array buffer allocation/i.test(message)) code = "memory";
  return { code, message: message.slice(-2000) };
}
