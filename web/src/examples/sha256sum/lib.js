addToLibrary({
  console_log: function (buf, len) {
    const dec = new TextDecoder();
    const data = Module.HEAPU8.subarray(buf, buf + len);
    const s = dec.decode(data);
    console.debug(`Message from VM (length: ${len} bytes): ${s}`);
  },
});
