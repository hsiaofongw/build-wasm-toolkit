window.addEventListener("load", entry);

function alignToMultiplesOf(size, n = 256) {
  return Math.ceil(size / n) * n;
}

const wasmFile = "out.wasm";

const size_per_algorithm = { sha256: 256 / 8 };
const base_workspace_addr = 2 ** 20;
const size_per_page = 2 ** 16;

function toHex(data) {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function test(filename) {
  const data = await fetch(filename)
    .then((r) => r.arrayBuffer())
    .then((ab) => new Uint8Array(ab));

  console.log("Filename:", filename);
  console.log("Size:", data.length);

  const msg_len = data.length;
  const msg_buf_len = alignToMultiplesOf(msg_len, 64);
  const result_len = size_per_algorithm["sha256"];
  const msg_buf = base_workspace_addr;
  const total_size_needed =
    base_workspace_addr + msg_buf_len + alignToMultiplesOf(result_len);

  const shm0 = new WebAssembly.Memory({
    initial: Math.ceil(total_size_needed / size_per_page),
  });

  const result_buf = msg_buf + msg_buf_len;
  const dview = new DataView(shm0.buffer);
  for (let i = 0; i < data.length; ++i) {
    dview.setUint8(msg_buf + i, data[i]);
  }

  const hex = await WebAssembly.instantiateStreaming(fetch(wasmFile), {
    importobjs: { shm0: shm0 },
    env: {
      on_sha256_hash_update: (offset) => {
        const intermediateDigest = new Uint8Array(
          shm0.buffer,
          offset,
          result_len
        );
        console.log(toHex(intermediateDigest));
      },
    },
  })
    .then((obj) => {
      obj.instance.exports.sha256_buffer(msg_buf, msg_len, result_buf);
      const resultDigest = new Uint8Array(shm0.buffer, result_buf, result_len);
      const hexHash = toHex(resultDigest);
      return hexHash;
    })
    .catch((e) => {
      console.error(e);
      return "";
    });

  console.log(hex);
}

async function entry_async() {
  console.log("WASM file:", wasmFile);
  await test("test256m.img");
}

function entry() {
  entry_async();
}
