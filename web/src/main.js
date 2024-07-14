window.addEventListener("load", entry);

const wasmFile = "sayhi.wasm";

function hexAddr(addr) {
  return `0x${addr.toString(16).padStart(8, "0")}`;
}

async function test() {
  const initial_pages = 256;
  const maximum_pages = 32768;

  const shm0 = new WebAssembly.Memory({
    initial: initial_pages,
    maximum: maximum_pages,
  });

  await WebAssembly.instantiateStreaming(fetch(wasmFile), {
    env: {
      memory: shm0,
      emscripten_notify_memory_growth: (idx) => {
        window.alert(
          `Memory at index: ${idx} has grown! you need to update memory view!`
        );
      },
    },
  })
    .then((vm) => {
      vm.instance.exports._initialize();
      console.debug("VM instance intialized!");

      const buf_size = 3;
      const str_buf = vm.instance.exports.get_str_buf(buf_size);
      console.debug(
        `Allocated heap object at: ${hexAddr(str_buf)}, size: ${buf_size}`
      );

      const n_bytes_written = vm.instance.exports.say_hi(str_buf, buf_size);
      console.debug(`sayhi() is called! ${n_bytes_written} bytes written.`);

      const result_buf = new Uint8Array(shm0.buffer, str_buf, n_bytes_written);
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
      vm.instance.exports.free_str_buf(str_buf);
      console.debug(`Heap object ${hexAddr(str_buf)} is freed now.`);
    })
    .catch((e) => {
      console.error(e);
      return "";
    });
}

async function entry_async() {
  console.log("WASM file:", wasmFile);
  await test();
}

function entry() {
  entry_async();
}
