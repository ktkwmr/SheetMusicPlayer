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
const sessions = [], sessionOf = {};
const SEGNET_BATCH = 2;
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
    // homr makes a new segmentation session for every page: reuse the one already loaded, or
    // every page would keep another copy of the model in memory
    let id = sessionOf[key];
    if (id == null) {
      // Without the memory arena and pattern, onnxruntime gives memory back after each run
      // instead of keeping the largest buffers of every model (less memory, about as fast)
      sessions.push(await ort.InferenceSession.create(await modelBytes(key), {
        executionProviders: ["wasm"], graphOptimizationLevel: "all", enableCpuMemArena: false, enableMemPattern: false,
      }));
      id = sessionOf[key] = sessions.length - 1;
    }
    const s = sessions[id];
    return { id, inputNames: s.inputNames, outputNames: s.outputNames };
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
    names = Array.from(names);
    if (id !== sessionOf.segnet) {
      const out = await sessions[id].run(feeds, names);
      return Array.from(names, (n) => out[n]);
    }
    // homr gives the segmentation model 8 image tiles at a time. Its working memory grows with
    // the batch (about 200 MB for 8), and the WebAssembly heap never shrinks: run a few at a time
    const feed = Object.values(feeds)[0], key = Object.keys(feeds)[0];
    const n = feed.dims[0], per = feed.data.length / n, parts = [];
    for (let i = 0; i < n; i += SEGNET_BATCH) {
      const k = Math.min(SEGNET_BATCH, n - i);
      const t = new ort.Tensor(feed.type, feed.data.subarray(i * per, (i + k) * per), [k, ...feed.dims.slice(1)]);
      parts.push(await sessions[id].run({ [key]: t }, names));
    }
    return names.map((name) => {
      const ts = parts.map((p) => p[name]);
      const data = new ts[0].data.constructor(ts.reduce((s, t) => s + t.data.length, 0));
      let o = 0;
      for (const t of ts) { data.set(t.data, o); o += t.data.length; }
      return new ort.Tensor(ts[0].type, data, [n, ...ts[0].dims.slice(1)]);
    });
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
  // One thread for now: with more than one, the first model run never finishes when onnxruntime-web
  // is called from Python through JSPI (onnxruntime-web on its own works with threads). Investigating.
  ort.env.wasm.numThreads = 1;
  const { loadPyodide } = await import(ENGINE + "pyodide/pyodide.mjs");
  py = await withoutAppleMobileCheck(() => loadPyodide({ indexURL: ENGINE + "pyodide/", stdout: () => {}, stderr: () => {} }));
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

// CPython calls Python functions through a "trampoline". It normally uses a small wasm-gc module,
// but on iPhone / iPad (navigator.userAgent, or "MacIntel" with touch points) it falls back to a
// JavaScript trampoline because of a WebKit GC bug seen in iOS 18.3.1 (python/cpython#130418,
// https://bugs.webkit.org/show_bug.cgi?id=293113). With the JavaScript trampoline there are
// JavaScript frames on every Python call, and JSPI cannot suspend through them ("JavaScript frames
// found between WebAssembly.Suspending and WebAssembly.promising"), so recognition always fails.
// The check runs once while Pyodide starts, so hide those values from it during loadPyodide only.
// Every browser with JSPI also has wasm-gc.
const isAppleMobile = (nav) => /iPad|iPhone|iPod/.test(nav.userAgent) ||
  (nav.platform === "MacIntel" && typeof nav.maxTouchPoints !== "undefined" && nav.maxTouchPoints > 1);
async function withoutAppleMobileCheck(fn) {
  const nav = self.navigator;
  if (!nav || !isAppleMobile(nav)) return fn();
  const masked = new Proxy(nav, {
    get(target, key) {
      if (key === "userAgent") return target.userAgent.replace(/iPad|iPhone|iPod/g, "Mobile");
      if (key === "platform" && target.platform === "MacIntel") return "";
      const v = Reflect.get(target, key, target);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  let masking = false;
  try { Object.defineProperty(self, "navigator", { value: masked, configurable: true, writable: true }); masking = true; } catch (e) {}
  try { return await fn(); }
  finally { if (masking) delete self.navigator; }
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
      // Free the page's images now, so the next page reuses that memory instead of growing the heap
      try { py.runPython("import gc; gc.collect()"); } catch (e) {}
    } catch (e) {
      const info = errorInfo(e);
      // Anything but "no staff found" may leave Pyodide unusable (a failed JSPI suspension is a fatal
      // error, and the next call then fails with "undefined is not an object"): ask for a fresh worker.
      post("error", { id: msg.id, ...info, restart: info.code !== "no-staff" });
    }
  }
};

function errorInfo(e) {
  const message = String((e && e.message) || e);
  let code = (e && e.code) || "recognize";
  if (/no-staff/.test(message)) code = "no-staff";
  else if (/JavaScript frames found between|trying to suspend JS frames/i.test(message)) code = "unsupported";
  else if (/memory|Out of bounds|RangeError: Array buffer allocation/i.test(message)) code = "memory";
  return { code, message: message.slice(-2000) };
}
