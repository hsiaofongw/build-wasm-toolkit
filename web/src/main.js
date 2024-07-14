window.addEventListener("load", entry);

const wasmLoaderFile = "sayhi.js";

function hexAddr(addr) {
  return `0x${addr.toString(16).padStart(8, "0")}`;
}

async function main() {
  const WASMRuntime = Module;

  console.log("Loaded WASMRuntime object:", WASMRuntime);

  // console.debug("VM instance initializing...");
  // WASMRuntime._initialize();
  // console.debug("VM instance intialized!");

  const buf_size = 3;
  console.debug(
    "Allocating heap object that are being use to store string content..."
  );

  const get_str_buf = WASMRuntime.cwrap("get_str_buf", "number", ["number"], {
    async: true,
  });
  const say_hi = WASMRuntime.cwrap("say_hi", null, ["number", "number"], {
    async: true,
  });
  const free_str_buf = WASMRuntime.cwrap("free_str_buf", null, ["number"], {
    async: true,
  });

  const str_buf = await get_str_buf(buf_size);
  console.debug(
    `Allocated heap object at: ${hexAddr(str_buf)}, size: ${buf_size}`
  );

  console.debug("Calling sayhi()...");
  const n_bytes_written = await say_hi(str_buf, buf_size);
  console.debug(`sayhi() is called! ${n_bytes_written} bytes written.`);

  const result_buf = WASMRuntime.HEAPU8.subarray(
    str_buf,
    str_buf + n_bytes_written
  );
  console.debug("Result is collected!");

  console.debug("Try decoding data...");
  try {
    const dec = new TextDecoder();
    const s = dec.decode(result_buf);
    console.debug("Decoded:", s);
  } catch (err) {
    console.error("Failed to decode:", err);
  }

  console.debug(`Freeing heap object: ${hexAddr(str_buf)}`);
  await free_str_buf(str_buf);
  console.debug(`Heap object ${hexAddr(str_buf)} is freed now.`);
}

function entry() {
  console.log("WASM Loader file:", wasmLoaderFile);
  Module["onRuntimeInitialized"] = main;
}
