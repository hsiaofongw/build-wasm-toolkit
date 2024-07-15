window.addEventListener("load", entry);

function hexAddr(addr) {
  return `0x${addr.toString(16).padStart(8, "0")}`;
}

function toHex(data) {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const DIGEST_SHA256 = 3;
const chunksDidId = "chunks_did";
const chunksTotalId = "chunks_total";
const resultId = "results";

async function main(Module) {
  const WASMRuntime = Module;

  const msg = "helloworld";
  const expectedSha256sum =
    "936a185caaa266bb9cbe981e9e05cb78cd732b0b3280eb944412bb6f8f8f07af";
  const enc = new TextEncoder();
  const msgbuf = enc.encode(msg);
  const msgbuflen = msgbuf.length;
  console.debug(
    "Allocating heap object to store checksum calculate context..."
  );
  const ctx_buf = await WASMRuntime._create_cksum_calc_ctx(
    msgbuflen,
    DIGEST_SHA256
  );
  console.debug("Allocated context object:", hexAddr(ctx_buf));

  const ctx_msg_buf_ptr = await WASMRuntime._get_msg_buf_addr(ctx_buf);
  console.debug(`ctx_msg_buf_ptr:`, hexAddr(ctx_msg_buf_ptr));

  console.debug("Populating message buffer...");
  const msgdview = new DataView(msgbuf.buffer);
  for (let i = 0; i < msgbuflen; ++i) {
    WASMRuntime.setValue(ctx_msg_buf_ptr + i, msgdview.getUint8(i));
  }
  await WASMRuntime._set_msg_buf_len(ctx_buf, msgbuflen);
  console.debug("Message buffer is populated.");

  console.debug("Setting up progress report handler...");
  const report_handler_func_ptr = WASMRuntime.addFunction(
    (chunks_did, total_chunks, io_ctx, result_buf, result_len) => {
      const chunksDidEle = window.document.getElementById(chunksDidId);
      chunksDidEle.textContent = String(chunks_did);
      const chunksTotalEle = window.document.getElementById(chunksTotalId);
      chunksTotalEle.textContent = String(total_chunks);
      const resultsEle = window.document.getElementById(resultId);
      const result_u8 = WASMRuntime.HEAPU8.subarray(
        result_buf,
        result_buf + result_len
      );
      resultsEle.textContent = toHex(result_u8);
    },
    "viiiii"
  );
  console.debug("Got function pointer:", report_handler_func_ptr);
  await WASMRuntime._set_progress_report_handler(
    ctx_buf,
    report_handler_func_ptr
  );
  console.debug("Progress handler is set.");

  console.debug("Start invoking checksum calculator...");
  const ret = await WASMRuntime._calculate_checksum(ctx_buf);
  console.debug(`Done, return value: ${ret}`);

  const result_buf = await WASMRuntime._get_cksum_result_buf(ctx_buf);
  const result_len = await WASMRuntime._get_cksum_result_len(ctx_buf);
  console.debug(
    `Extracting result (${result_len} bytes) from:`,
    hexAddr(result_buf)
  );
  const result = WASMRuntime.HEAPU8.subarray(
    result_buf,
    result_buf + result_len
  );
  const hexResult = toHex(result);
  console.debug("Got result (in hex):", hexResult);
  console.debug("As expected:", hexResult === expectedSha256sum);

  console.debug("Freeing context object:", hexAddr(ctx_buf));
  await WASMRuntime._free_cksum_calc_ctx(ctx_buf);
  console.debug(`Context object ${hexAddr(ctx_buf)} is freed now.`);

  return;
}

function entry() {
  import("./wasm-loader.mjs")
    .then((mod) => {
      return mod.default();
    })
    .then((Module) => {
      console.log("Loaded Module:", Module);
      console.log("Called Run:", Module.calledRun);
      main(Module);
    });
}
