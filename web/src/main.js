window.addEventListener("load", entry);

function alignToMultiplesOf(size, n = 256) {
  return Math.ceil(size / n) * n;
}

function entry() {
  const shm1 = new WebAssembly.Memory({
    initial: 2,
  });

  const dview = new DataView(shm1.buffer);

  const originmsg = "helloworld";
  const enc = new TextEncoder();
  const utf8encodedmsg = enc.encode(originmsg);
  const msglen = utf8encodedmsg.length;
  const msgbuflen = alignToMultiplesOf(msglen, 256);
  for (let offset = 0; offset < msglen; ++offset) {
    dview.setUint8(offset, utf8encodedmsg[offset]);
  }
  for (let offset = msglen; offset < msgbuflen; ++offset) {
    dview.setUint8(offset, 0);
  }

  const theimportobject = {
    importobjs: {
      shm1,
    },
  };

  WebAssembly.instantiateStreaming(fetch("digest.wasm"), theimportobject).then(
    (obj) => {
      const buf_start = 0;
      const res_buf_start = buf_start + msgbuflen;
      obj.instance.exports.sm3_buffer(buf_start, msglen, res_buf_start);

      const resultDigest = new Uint8Array(shm1.buffer, res_buf_start, 32);
      const hexHash = Array.from(resultDigest)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      console.log(hexHash);
    }
  );
}