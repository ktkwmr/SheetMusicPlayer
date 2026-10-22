"""Sheet Music Player: runs homr (https://github.com/liebharc/homr) in the browser.

Called from public/sheetmusicplayer/omr-worker.mjs inside Pyodide. Takes the pixels of
one page and returns MusicXML. Compared with homr's command line (homr/main.py), this
skips file output, the title OCR (rapidocr is not available in Pyodide), the model
download, and the GPU options. homr's own files are not changed.

License: AGPL-3.0 (the same as homr). See LICENSE in the repository.
"""
import sys
import time
import types
from concurrent.futures import Future

# ---- Dependencies that do not exist in the browser ----
sys.modules.setdefault("requests", types.ModuleType("requests"))  # only used to download models
_rapidocr = types.ModuleType("rapidocr")


class _NoOcr:  # homr reads the title with rapidocr; the title is not needed here
    def __init__(self, *args, **kwargs):
        raise RuntimeError("rapidocr is not available in the browser")


_rapidocr.RapidOCR = _NoOcr
sys.modules.setdefault("rapidocr", _rapidocr)

import cv2  # noqa: E402
import numpy as np  # noqa: E402

from homr import main as homr_main  # noqa: E402
from homr import staff_parsing, title_detection  # noqa: E402
from homr.music_xml_generator import XmlGeneratorArguments, generate_xml  # noqa: E402
from homr.transformer.configs import Config  # noqa: E402


def _no_title(*args, **kwargs):
    done = Future()
    done.set_result("")
    return done


# homr starts the title OCR in a thread; Pyodide has no threads
title_detection.detect_title = _no_title
homr_main.detect_title = _no_title

_progress = None
_staff_done = 0
_staff_total = 0


def set_progress(callback):
    """callback(stage: str, done: int, total: int) is called from the JS side."""
    global _progress
    _progress = callback


def _report(stage, done=0, total=0):
    if _progress is not None:
        _progress(stage, done, total)


_parse_staff_tromr = staff_parsing.parse_staff_tromr


def _parse_staff_with_progress(*args, **kwargs):
    global _staff_done
    result = _parse_staff_tromr(*args, **kwargs)
    _staff_done += 1
    _report("staff", _staff_done, _staff_total)
    return result


staff_parsing.parse_staff_tromr = _parse_staff_with_progress

# One staff homr cannot handle (for example a fragment with no width) should not lose the
# whole page: skip it. parse_staffs already skips staves that come back empty.
_parse_staff_image = staff_parsing.parse_staff_image
skipped_staffs = 0


def _parse_staff_image_safely(*args, **kwargs):
    global _staff_done, skipped_staffs
    try:
        return _parse_staff_image(*args, **kwargs)
    except Exception as e:  # noqa: BLE001
        print("Skipping a staff that could not be read:", e, file=sys.stderr)
        skipped_staffs += 1
        _staff_done += 1
        _report("staff", _staff_done, _staff_total)
        return []


staff_parsing.parse_staff_image = _parse_staff_image_safely

# The segmentation model runs over the page in 320 px tiles, a batch at a time: count them for progress
from homr.segmentation import inference_segnet  # noqa: E402

_tiles_done = 0
_tiles_total = 0
_segnet_run = inference_segnet.Segnet.run


def _segnet_run_with_progress(self, input_data):
    global _tiles_done
    out = _segnet_run(self, input_data)
    _tiles_done += len(input_data)
    _report("segment", _tiles_done, _tiles_total)
    if _tiles_done >= _tiles_total:
        _report("analyze")  # finding staves, notes, and bar lines in the model's output
    return out


inference_segnet.Segnet.run = _segnet_run_with_progress
_extract = inference_segnet.extract


def _extract_with_progress(original_image, *args, **kwargs):
    global _tiles_done, _tiles_total
    win = kwargs.get("win_size", 320)
    step = kwargs.get("step_size", -1)
    if step < 0:
        step = win // 2
    h, w = original_image.shape[:2]
    _tiles_done = 0
    _tiles_total = len(range(0, max(h, win), step)) * len(range(0, max(w, win), step))
    _report("segment", 0, _tiles_total)
    return _extract(original_image, *args, **kwargs)


inference_segnet.extract = _extract_with_progress
homr_main.extract = _extract_with_progress


def recognize(rgba, width: int, height: int, tempo=None) -> str:
    """Pixels (RGBA, row by row) of one page -> MusicXML text.

    tempo: quarter notes per minute to write into the MusicXML, or None.
    Raises ValueError("no-staff") when no staff or no notes are found.
    """
    global _staff_done, _staff_total, skipped_staffs
    skipped_staffs = 0
    if hasattr(rgba, "to_bytes"):  # a JS Uint8Array
        rgba = rgba.to_bytes()
    t0 = time.time()
    image = np.frombuffer(rgba, dtype=np.uint8).reshape(int(height), int(width), 4)
    path = "/tmp/page.png"
    cv2.imwrite(path, cv2.cvtColor(image, cv2.COLOR_RGBA2BGR))

    _report("prepare")
    config = homr_main.ProcessingConfig(
        enable_debug=False,
        enable_cache=False,
        write_staff_positions=False,
        read_staff_positions=False,
        selected_staff=-1,
        transformer_use_gpu=False,
        segnet_use_gpu=False,
        coreml_encoder=False,
    )
    try:
        multi_staffs, page, debug, _title = homr_main.detect_staffs_in_image(path, config)
    except Exception as e:  # homr raises a bare Exception when it finds nothing
        if "No noteheads found" in str(e) or "No staffs found" in str(e):
            raise ValueError("no-staff") from e
        raise

    _staff_done = 0
    _staff_total = sum(len(m.staffs) for m in multi_staffs)
    _report("staff", 0, _staff_total)
    transformer = Config()
    transformer.use_gpu_inference = False
    transformer.use_coreml_encoder = False
    staffs = staff_parsing.parse_staffs(debug, multi_staffs, page, selected_staff=-1, config=transformer)

    _report("xml")
    xml = generate_xml(XmlGeneratorArguments(None, None, int(tempo) if tempo else None), staffs, "")
    out = "/tmp/page.musicxml"
    xml.write(out)
    with open(out, encoding="utf-8") as f:
        text = f.read()
    _report("page-done", round((time.time() - t0) * 1000))
    return text
