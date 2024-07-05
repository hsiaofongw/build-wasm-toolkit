window.addEventListener("load", entry);

function alignToMultiplesOf(size, n = 256) {
  return Math.ceil(size / n) * n;
}

async function test(filename) {
  const data = await fetch(filename)
    .then((r) => r.arrayBuffer())
    .then((ab) => new Uint8Array(ab));

  console.log("Filename:", filename);
  console.log("Size:", data.length);

  const shm0 = new WebAssembly.Memory({
    initial: 2 * Math.ceil(data.length / 2 ** 16),
  });
  const dview = new DataView(shm0.buffer);
  for (let i = 0; i < data.length; ++i) {
    dview.setUint8(i, data[i]);
  }

  const msg_buf = 0;
  const msg_len = data.length;
  const msg_buf_len = alignToMultiplesOf(msg_len, 64);
  const result_buf = msg_buf + msg_buf_len;
  const result_len = 224 / 8;

  const hex = await WebAssembly.instantiateStreaming(fetch("digest.wasm"), {
    importobjs: { shm1: shm0 },
  })
    .then((obj) => {
      obj.instance.exports.sha224_buffer(msg_buf, msg_len, result_buf);
      const resultDigest = new Uint8Array(shm0.buffer, result_buf, result_len);
      const hexHash = Array.from(resultDigest)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hexHash;
    })
    .catch((e) => {
      console.error(e);
      return "";
    });

  console.log("Hex:", hex);
}

async function entry_async() {
  await test("test512.img");
  await test("test786.img");
  await test("test1k.img");
  await test("test1_5k.img");
}

function entry() {
  entry_async();
}
