window.addEventListener("load", entry);

const digestIdSHA256 = 4;

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

  const result_len = size_per_algorithm["sha256"];

  const initial_pages = 2;
  const shm0 = new WebAssembly.Memory({
    initial: initial_pages,
  });

  await WebAssembly.instantiateStreaming(fetch(wasmFile), {
    importobjs: { shm0: shm0 },
    env: {
      on_hash_value_update: (offset, alg_id, stage) => {
        const intermediateDigest = new Uint8Array(
          shm0.buffer,
          offset,
          result_len
        );
        console.log(
          `HEX: ${toHex(
            intermediateDigest
          )}, alg_id: ${alg_id}, stage: ${stage}`
        );
      },
    },
  })
    .then((obj) => {
      const first_addr = obj.instance.exports.get_first_usable_address();
      if (first_addr === undefined) {
        throw new Error("failed to get first usable address.");
      }

      const msg_len = data.length;

      const msg_buf = alignToMultiplesOf(first_addr + 1);
      const result_buf = alignToMultiplesOf(msg_buf + msg_len);

      const size_needed = alignToMultiplesOf(
        result_buf + Math.max(...Object.values(size_per_algorithm))
      );
      const initial_size = initial_pages * size_per_page;
      if (size_needed >= initial_size) {
        const need_more = Math.max(1, size_needed - initial_size);
        const need_more_pages = Math.ceil(need_more / size_per_page);
        if (obj.instance.exports.getmorepages(need_more_pages) < 0) {
          throw new Error("failed to get more pages.");
        }
      }

      const dview = new DataView(shm0.buffer);
      for (let i = 0; i < msg_len; ++i) {
        dview.setUint8(msg_buf + i, data[i]);
      }

      obj.instance.exports.initiate_buffer_hashing(
        msg_buf,
        msg_len,
        digestIdSHA256
      );
    })
    .catch((e) => {
      console.error(e);
      return "";
    });
}

async function entry_async() {
  console.log("WASM file:", wasmFile);
  await test("test256m.img");
}

function entry() {
  entry_async();
}
