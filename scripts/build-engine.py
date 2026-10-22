#!/usr/bin/env python3
"""Builds the recognition engine in public/sheetmusicplayer/engine/<version>/.

The engine is everything the browser needs to run homr (optical music recognition)
and the tempo OCR without a server:

  pyodide/     Pyodide (Python in WebAssembly) and the wheels homr needs
  ort/         onnxruntime-web (runs the ONNX models)
  models/      homr's ONNX models. segnet and encoder are quantized to int8
               (about 4x smaller and faster, same results on the test scores);
               the decoder is already int8 and is split into parts under 25 MiB
               (the Cloudflare Workers per-file limit)
  homr.zip     homr's Python source (unchanged) + engine/python/ (the browser glue)
  tesseract/   Tesseract.js, its WebAssembly core (SIMD + LSTM build), and English data (tempo marking OCR)
  manifest.json  file list with sizes (the worker shows download progress with it)

It also copies the page's own libraries into public/sheetmusicplayer/vendor/
(OpenSheetMusicDisplay, PDF.js) and writes public/sheetmusicplayer/THIRD_PARTY_LICENSES.md
with the license of every library above (texts from the packages, or from the
projects' GitHub repositories for the version used).

The licenses of these libraries are listed in public/sheetmusicplayer/THIRD_PARTY_LICENSES.md.

The files are large but never change for a given version, so the Service Worker
caches them once (cache first). To change anything, bump VERSION here and
ENGINE_VERSION in omr-worker.mjs and sw.js, run this script, and delete the old folder.

Requirements: Python 3.10+, pip, npm, curl, tar (bzip2), and in the Python used:
  pip install onnx onnxruntime
Usage:
  python3 scripts/build-engine.py            # build (downloads ~400 MB into .engine-cache/)
  python3 scripts/build-engine.py --check    # only verify that the built files are complete
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import zipfile
from pathlib import Path

VERSION = "v2"
PYODIDE = "314.0.7"
HOMR = "0.7.0"
ORT_WEB = "1.30.0"
TESSERACT_JS = "7.0.0"
TESSERACT_CORE = "7.0.0"
TESSERACT_ENG = "1.0.0"
MUSICXML = "1.6.3"
VERYSIMPLETREE = "2.1.5"
HOMR_MODELS = "https://github.com/liebharc/homr/releases/download/onnx_checkpoints/"
SEGNET = "segnet_308-3296ccd40960f90ca6ab9c035cca945675d30a0f"
TRANSFORMER = "pytorch_model_396-f6feedb42ff90087d898b0941a55d040fa6b2903"
PYODIDE_PACKAGES = ["numpy", "opencv-python", "pillow", "typing-extensions"]
# Libraries used by the page itself (public/sheetmusicplayer/vendor/)
OSMD = "2.2.1"
PDFJS = "5.4.394"  # 5.5+ uses Map.prototype.getOrInsertComputed, which current browsers do not have yet
PART_SIZE = 24 * 1024 * 1024  # below Cloudflare's 25 MiB per-file limit

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sheetmusicplayer" / "engine" / VERSION
CACHE = ROOT / ".engine-cache"
CHECK = "--check" in sys.argv


def run(*cmd, cwd=None):
    print("+", " ".join(str(c) for c in cmd), flush=True)
    subprocess.run([str(c) for c in cmd], check=True, cwd=cwd)


def download(url, dest: Path):
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    run("curl", "-fsSL", "-o", dest.with_suffix(dest.suffix + ".part"), url)
    dest.with_suffix(dest.suffix + ".part").replace(dest)
    return dest


def npm_package(spec: str) -> Path:
    """Unpacks an npm package into .engine-cache/npm/<name>/package/ and returns that folder."""
    name = spec.rsplit("@", 1)[0].replace("/", "-").lstrip("@")
    target = CACHE / "npm" / name
    if not (target / "package").exists():
        target.mkdir(parents=True, exist_ok=True)
        out = subprocess.run(["npm", "pack", spec, "--silent"], cwd=target, check=True, capture_output=True, text=True)
        tgz = target / out.stdout.strip().splitlines()[-1]
        with tarfile.open(tgz) as t:
            t.extractall(target, filter="data")
        tgz.unlink()
    return target / "package"


def pip_wheel(name: str, version: str) -> Path:
    target = CACHE / "wheels"
    target.mkdir(parents=True, exist_ok=True)
    found = list(target.glob(f"{name.replace('-', '_')}-{version}-*.whl"))
    if not found:
        run(sys.executable, "-m", "pip", "download", f"{name}=={version}", "--no-deps", "--only-binary", ":all:",
            "-q", "-d", target)
        found = list(target.glob(f"{name.replace('-', '_')}-{version}-*.whl"))
    return found[0]


def copy(src: Path, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)


def build_pyodide():
    tar = download(f"https://github.com/pyodide/pyodide/releases/download/{PYODIDE}/pyodide-{PYODIDE}.tar.bz2",
                   CACHE / f"pyodide-{PYODIDE}.tar.bz2")
    with tarfile.open(tar) as t:
        lock = json.load(t.extractfile("pyodide/pyodide-lock.json"))
        wanted = {"pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json",
                  "package.json"}
        todo = list(PYODIDE_PACKAGES)
        while todo:  # the packages and everything they depend on
            p = lock["packages"][todo.pop()]
            wanted.add(p["file_name"])
            todo += [d for d in p["depends"] if lock["packages"][d]["file_name"] not in wanted]
        for member in t.getmembers():
            name = member.name.split("/", 1)[-1]
            if name in wanted:
                with t.extractfile(member) as f, open(OUT / "pyodide" / name, "wb") as o:
                    shutil.copyfileobj(f, o)
    # Pure-Python wheels from PyPI that Pyodide does not ship
    for name, version in [("musicxml", MUSICXML), ("verysimpletree", VERYSIMPLETREE)]:
        copy(pip_wheel(name, version), OUT / "pyodide" / pip_wheel(name, version).name)


def build_homr_zip():
    wheel = pip_wheel("homr", HOMR)
    with zipfile.ZipFile(wheel) as src, zipfile.ZipFile(OUT / "homr.zip", "w", zipfile.ZIP_DEFLATED) as dst:
        for info in src.infolist():
            n = info.filename
            if n.startswith("homr/") and not n.endswith((".onnx", ".pth")):
                dst.writestr(n, src.read(n))
            elif n.endswith("/LICENSE") and ".dist-info/" in n:
                dst.writestr("homr/LICENSE", src.read(n))
        glue = ROOT / "engine" / "python"
        for f in sorted(glue.rglob("*.py")):
            dst.write(f, f.relative_to(glue).as_posix())


def build_models():
    from onnxruntime.quantization import QuantType, quantize_dynamic

    models = CACHE / "models"
    for base in [SEGNET, f"encoder_{TRANSFORMER}", f"decoder_{TRANSFORMER}"]:
        if not (models / f"{base}.onnx").exists():
            z = download(HOMR_MODELS + base + ".zip", models / f"{base}.zip")
            with zipfile.ZipFile(z) as f:
                f.extractall(models)
    out = OUT / "models"
    if not (out / "segnet.int8.onnx").exists():
        quantize_dynamic(models / f"{SEGNET}.onnx", out / "segnet.int8.onnx", weight_type=QuantType.QUInt8)
    if not (out / "encoder.int8.onnx").exists():
        quantize_dynamic(models / f"encoder_{TRANSFORMER}.onnx", out / "encoder.int8.onnx", weight_type=QuantType.QInt8)
    # The decoder is already quantized; split it into parts the worker joins again
    data = (models / f"decoder_{TRANSFORMER}.onnx").read_bytes()
    for i in range(0, len(data), PART_SIZE):
        (out / f"decoder.onnx.part{i // PART_SIZE}").write_bytes(data[i:i + PART_SIZE])


def build_ort():
    pkg = npm_package(f"onnxruntime-web@{ORT_WEB}")
    for f in ["ort.wasm.min.mjs", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]:
        copy(pkg / "dist" / f, OUT / "ort" / f)


def build_tesseract():
    js = npm_package(f"tesseract.js@{TESSERACT_JS}")
    core = npm_package(f"tesseract.js-core@{TESSERACT_CORE}")
    eng = npm_package(f"@tesseract.js-data/eng@{TESSERACT_ENG}")
    copy(js / "dist" / "tesseract.esm.min.js", OUT / "tesseract" / "tesseract.esm.min.js")
    copy(js / "dist" / "worker.min.js", OUT / "tesseract" / "worker.min.js")
    # The app points corePath at this file, so only the SIMD + LSTM build is needed (all current browsers have SIMD)
    for f in ["tesseract-core-simd-lstm.js", "tesseract-core-simd-lstm.wasm"]:
        copy(core / f, OUT / "tesseract" / f)  # next to worker.min.js, which looks for the .wasm there
    copy(eng / "4.0.0_best_int" / "eng.traineddata.gz", OUT / "tesseract" / "lang" / "eng.traineddata.gz")


def build_vendor():
    vendor = ROOT / "public" / "sheetmusicplayer" / "vendor"
    copy(npm_package(f"opensheetmusicdisplay@{OSMD}") / "build" / "opensheetmusicdisplay.min.js",
         vendor / "opensheetmusicdisplay.min.js")
    pdf = npm_package(f"pdfjs-dist@{PDFJS}")
    for f in ["pdf.min.mjs", "pdf.worker.min.mjs"]:
        copy(pdf / "build" / f, vendor / f)


def raw_github(repo, ref, path):
    dest = CACHE / "licenses" / repo.replace("/", "_") / ref / path
    return download(f"https://raw.githubusercontent.com/{repo}/{ref}/{path}", dest).read_text(encoding="utf-8")


def wheel_member(wheel: Path, suffix: str) -> str:
    with zipfile.ZipFile(wheel) as z:
        name = next(n for n in z.namelist() if n.endswith(suffix))
        return z.read(name).decode("utf-8", "replace")


def write_licenses():
    pyo = OUT / "pyodide"

    def whl(prefix):
        return next(pyo.glob(prefix + "-*.whl"))

    python_version = json.loads((pyo / "pyodide-lock.json").read_text())["info"]["python"]
    entries = [
        ("homr", "AGPL-3.0", "Copyright (c) homr contributors (https://github.com/liebharc/homr)",
         "Optical music recognition (reads the notes). Its Python code and models run in the reading engine.",
         wheel_member(pip_wheel("homr", HOMR), ".dist-info/licenses/LICENSE")),
        ("Pyodide", "MPL-2.0", "Copyright (c) Pyodide contributors and Mozilla", "Runs Python in WebAssembly",
         raw_github("pyodide/pyodide", PYODIDE, "LICENSE")),
        ("CPython (the Python standard library, part of Pyodide)", "PSF-2.0", "Copyright (c) Python Software Foundation", "",
         raw_github("python/cpython", "v" + python_version, "LICENSE")),
        ("NumPy", "BSD-3-Clause", "Copyright (c) NumPy Developers", "",
         wheel_member(whl("numpy"), ".dist-info/licenses/LICENSE.txt")),
        ("OpenCV (opencv-python)", "Apache-2.0", "Copyright (c) OpenCV team", "",
         wheel_member(whl("opencv_python"), ".dist-info/LICENSE.txt")),
        ("Pillow", "MIT-CMU", "Copyright (c) Jeffrey A. Clark and contributors", "",
         wheel_member(whl("pillow"), ".dist-info/licenses/LICENSE")),
        ("typing_extensions", "PSF-2.0", "Copyright (c) Python Software Foundation", "",
         wheel_member(whl("typing_extensions"), ".dist-info/licenses/LICENSE")),
        ("musicxml", "MIT", "Copyright (c) Alex Gorji", "Writes the MusicXML file",
         wheel_member(whl("musicxml"), ".dist-info/LICENSE")),
        ("verysimpletree", "MIT", "Copyright (c) Alex Gorji", "Used by musicxml",
         "MIT License. The wheel has no license file; the text is the same as for musicxml above, by the same author."),
        ("ONNX Runtime Web (onnxruntime-web)", "MIT", "Copyright (c) Microsoft Corporation", "Runs homr's models",
         raw_github("microsoft/onnxruntime", f"v{ORT_WEB}", "LICENSE")),
        ("Tesseract.js", "Apache-2.0", "Copyright (c) Tesseract.js contributors", "Reads the tempo marking",
         (npm_package(f"tesseract.js@{TESSERACT_JS}") / "LICENSE.md").read_text()),
        ("tesseract.js-core (Tesseract OCR and Leptonica compiled to WebAssembly)", "Apache-2.0",
         "Copyright (c) Tesseract.js contributors, Google, and the Tesseract OCR contributors", "",
         (npm_package(f"tesseract.js-core@{TESSERACT_CORE}") / "LICENSE").read_text()),
        ("Tesseract English data (tessdata_best, eng)", "Apache-2.0", "Copyright (c) Google and the Tesseract OCR contributors",
         "Distributed as @tesseract.js-data/eng", raw_github("tesseract-ocr/tessdata_best", "main", "LICENSE")),
        ("OpenSheetMusicDisplay", "BSD-3-Clause", "Copyright (c) PhonicScore",
         "Draws the score. Includes VexFlow (MIT, Copyright (c) Mohit Muthanna Cheppudira).",
         (npm_package(f"opensheetmusicdisplay@{OSMD}") / "LICENSE").read_text()),
        ("PDF.js (pdfjs-dist)", "Apache-2.0", "Copyright (c) Mozilla Foundation", "Opens PDF files",
         (npm_package(f"pdfjs-dist@{PDFJS}") / "LICENSE").read_text()),
    ]
    fence = "`" * 3
    lines = ["# Third-Party Software Notices", "", "Sheet Music Player", "",
             "Sheet Music Player is licensed under the GNU Affero General Public License v3",
             "(LICENSE in https://github.com/ktkwmr/SheetMusicPlayer). It includes the software below.",
             "Every file is served from this site; nothing is loaded from other websites.", ""]
    for name, lic, holder, note, text in entries:
        lines += ["---", "", f"## {name}", "", f"- License: {lic}", f"- Copyright: {holder}"]
        if note:
            lines.append(f"- Used for: {note}")
        lines += ["", fence, text.strip().replace(fence, "'''"), fence, ""]
    lines += ["<!-- New libraries are added above this line by scripts/update-third-party-licenses.mjs -->", ""]
    out = ROOT / "public" / "sheetmusicplayer" / "THIRD_PARTY_LICENSES.md"
    out.write_text("\n".join(lines), encoding="utf-8")


def write_manifest():
    files = {}
    for f in sorted(OUT.rglob("*")):
        if f.is_file() and f.name != "manifest.json":
            rel = f.relative_to(OUT).as_posix()
            files[rel] = {"size": f.stat().st_size, "sha256": hashlib.sha256(f.read_bytes()).hexdigest()[:16]}
    (OUT / "manifest.json").write_text(json.dumps({"version": VERSION, "files": files}, indent=1) + "\n")
    return files


def check():
    m = json.loads((OUT / "manifest.json").read_text())
    bad = []
    for rel, info in m["files"].items():
        f = OUT / rel
        if not f.exists() or f.stat().st_size != info["size"]:
            bad.append(rel)
        elif f.stat().st_size > 25 * 1024 * 1024:
            bad.append(rel + " (over 25 MiB)")
    if bad:
        print("Engine files missing, changed, or too large:", *bad, sep="\n  ")
        sys.exit(1)
    total = sum(i["size"] for i in m["files"].values())
    print(f"Engine {m['version']}: {len(m['files'])} files, {total / 1e6:.1f} MB, all present.")


if __name__ == "__main__":
    if CHECK:
        check()
        sys.exit(0)
    for d in ["pyodide", "ort", "models", "tesseract/lang"]:
        (OUT / d).mkdir(parents=True, exist_ok=True)
    build_pyodide()
    build_homr_zip()
    build_ort()
    build_tesseract()
    build_models()
    build_vendor()
    files = write_manifest()
    write_licenses()
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(files)} files, {sum(f['size'] for f in files.values()) / 1e6:.1f} MB")
    check()
