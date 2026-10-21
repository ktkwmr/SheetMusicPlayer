"""A minimal onnxruntime replacement for running homr in the browser.

Only the parts homr uses are implemented. Inference runs in onnxruntime-web
(self.ortShim in omr-worker.mjs) and is called synchronously from Python with
pyodide.ffi.run_sync (JavaScript Promise Integration, JSPI). Tensors stay on the
JS side and are copied to Python only when numpy() is called, so the decoder's
key/value cache does not travel back and forth at every step.
"""
import js
import numpy as np
from pyodide.ffi import run_sync, to_js

_TYPE = {
    np.dtype("float32"): "float32",
    np.dtype("float16"): "float16",
    np.dtype("int64"): "int64",
    np.dtype("int32"): "int32",
    np.dtype("uint8"): "uint8",
    np.dtype("bool"): "bool",
}
_DTYPE = {v: k for k, v in _TYPE.items()}


def _tensor(arr):
    arr = np.ascontiguousarray(arr)
    if arr.dtype not in _TYPE:
        arr = arr.astype(np.float32)
    buf = js.Uint8Array.new(arr.nbytes)
    if arr.nbytes:
        buf.assign(arr.tobytes())
    return js.ortShim.tensor(_TYPE[arr.dtype], buf, to_js([int(d) for d in arr.shape]))


class OrtValue:
    def __init__(self, t):
        self._t = t
        self._np = None

    @staticmethod
    def ortvalue_from_numpy(arr, device_type="cpu", device_id=0):
        return OrtValue(_tensor(arr))

    def numpy(self):
        if self._np is None:
            t = self._t
            shape = tuple(int(d) for d in t.dims)
            data = js.ortShim.bytes(t).to_bytes()
            self._np = np.frombuffer(data, dtype=_DTYPE[t.type]).reshape(shape)
        return self._np

    def shape(self):
        return [int(d) for d in self._t.dims]


class _NodeArg:
    def __init__(self, name):
        self.name = name


class IOBinding:
    def __init__(self, session):
        self._s = session
        self._inputs = {}
        self._outputs = []
        self._result = []

    def bind_cpu_input(self, name, arr):
        self._inputs[name] = _tensor(np.asarray(arr))

    def bind_ortvalue_input(self, name, value):
        self._inputs[name] = value._t

    def bind_output(self, name, device_type="cpu", device_id=0, *args, **kwargs):
        if name not in self._outputs:
            self._outputs.append(name)

    def get_outputs(self):
        return self._result

    def copy_outputs_to_cpu(self):
        return [o.numpy() for o in self._result]

    def clear_binding_inputs(self):
        self._inputs = {}

    def clear_binding_outputs(self):
        self._outputs = []


class SessionOptions:
    def __init__(self):
        self.log_severity_level = 3
        self.graph_optimization_level = None
        self.intra_op_num_threads = 0


class GraphOptimizationLevel:
    ORT_ENABLE_ALL = 99
    ORT_ENABLE_EXTENDED = 2
    ORT_ENABLE_BASIC = 1
    ORT_DISABLE_ALL = 0


class InferenceSession:
    def __init__(self, path_or_bytes, sess_options=None, providers=None, provider_options=None, **kwargs):
        info = run_sync(js.ortShim.create(str(path_or_bytes)))
        self._id = int(info.id)
        self._inputs = [str(n) for n in info.inputNames]
        self._outputs = [str(n) for n in info.outputNames]

    def get_inputs(self):
        return [_NodeArg(n) for n in self._inputs]

    def get_outputs(self):
        return [_NodeArg(n) for n in self._outputs]

    def get_providers(self):
        return ["CPUExecutionProvider"]

    def io_binding(self):
        return IOBinding(self)

    def _run(self, feeds, names):
        feeds_js = to_js(feeds, dict_converter=js.Object.fromEntries)
        res = run_sync(js.ortShim.run(self._id, feeds_js, to_js(names)))
        return [OrtValue(res[i]) for i in range(len(names))]

    def run_with_iobinding(self, iobinding, run_options=None):
        iobinding._result = self._run(iobinding._inputs, list(iobinding._outputs))

    def run(self, output_names, input_feed, run_options=None):
        names = list(output_names) if output_names else list(self._outputs)
        feeds = {k: (v._t if isinstance(v, OrtValue) else _tensor(np.asarray(v))) for k, v in input_feed.items()}
        return [o.numpy() for o in self._run(feeds, names)]


def get_available_providers():
    return ["CPUExecutionProvider"]


def get_device():
    return "CPU"


def preload_dlls(*args, **kwargs):
    pass


def set_default_logger_severity(level):
    pass
