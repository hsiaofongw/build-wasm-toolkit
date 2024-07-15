window.addEventListener("load", entry);

function hexAddr(addr) {
  return `0x${addr.toString(16).padStart(8, "0")}`;
}

function toHex(data) {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function removeDotZeros(x) {
  const pattern1 = /^(\d+)[.]0$/;
  const res1 = pattern1.exec(x);
  if (res1) {
    return res1["1"] ? `${res1["1"]}` : x;
  }

  const pattern2 = /^(\d+)[.]([^0]+)0+$/;
  const res2 = pattern2.exec(x);
  if (res2) {
    return res2["1"] && res2["2"] ? `${res2["1"]}.${res2["2"]}` : x;
  }

  const pattern3 = /^(\d+)[.]0+$/;
  const res3 = pattern3.exec(x);
  if (res3) {
    return res3["1"] ? `${res3["1"]}` : x;
  }

  return x;
}

function toPercent(x) {
  return `${removeDotZeros((x * 100).toFixed(2))}%`;
}

const DIGEST_SHA256 = 3;
const mainId = "main";
const progressId = "progress";
const totalBytesId = "totallength";
const fetchedBytesId = "fetchedlength";
const chunksDidId = "chunks_did";
const chunksTotalId = "chunks_total";
const resultId = "result";

function tryParseNum(s) {
  if (s) {
    try {
      let total = parseInt(s);
      if (typeof total !== "number" || !Number.isFinite(total)) {
        throw new Error("Failed to parse content-length");
      }
      return total;
    } catch (e) {
      console.error(e);
    }
  }
}

function updateProgress(fetched, total) {
  let ele = window.document.getElementById(fetchedBytesId);
  if (ele) {
    ele.textContent = `Fetched: ${fetched} bytes`;
  }

  ele = window.document.getElementById(progressId);
  if (ele && total !== 0) {
    ele.textContent = `Download Progress: ${toPercent(fetched / total)}`;
  }
}

async function main(Module) {
  let total = 0;
  let fetched = 0;
  let msgbuf = new Uint8Array();
  await fetch("test20m.bin")
    .then((r) => {
      const hdrs = r.headers;
      console.log("Headers:", hdrs);
      const lenStr = hdrs.get("content-length");
      const len = tryParseNum(lenStr);
      if (len !== undefined) {
        total = len;

        msgbuf = new Uint8Array(len);

        const mainEle = window.document.getElementById(mainId);
        let ele = window.document.createElement("div");
        ele.setAttribute("id", totalBytesId);
        ele.textContent = `Total: ${len} bytes`;
        mainEle.appendChild(ele);

        ele = window.document.createElement("div");
        ele.setAttribute("id", fetchedBytesId);
        ele.textContent = `Fetched: ${fetched} bytes`;
        mainEle.appendChild(ele);

        ele = window.document.createElement("div");
        ele.setAttribute("id", progressId);
        ele.textContent = "Download Progress: 0%";
        mainEle.appendChild(ele);
      }

      return r.body;
    })
    .then((bodyStream) => {
      return new Promise((res) => {
        const rdr = bodyStream.getReader();

        function doRead(rdr) {
          rdr.read().then(({ done, value }) => {
            if (value) {
              const dview = new DataView(msgbuf.buffer);
              const len = value.byteLength;
              for (let i = 0; i < len; ++i) {
                dview.setUint8(fetched + i, value.at(i));
              }

              fetched += len;

              console.log(`Got ${value.byteLength} bytes data:`, value);
              console.log(`Progress: ${fetched}/${total}`);
              updateProgress(fetched, total);
            }

            if (done) {
              res();
              return;
            }

            doRead(rdr);
          });
        }

        doRead(rdr);
      });
    })
    .then(() => {
      let mainEle = window.document.getElementById(mainId);

      let ele = window.document.createElement("div");
      ele.setAttribute("id", chunksDidId);
      ele.textContent = `ChunksDid: 0`;
      mainEle.appendChild(ele);

      ele = window.document.createElement("div");
      ele.setAttribute("id", chunksTotalId);
      ele.textContent = `ChunksTotal: 0`;
      mainEle.appendChild(ele);

      ele = window.document.createElement("div");
      ele.setAttribute("id", resultId);
      ele.textContent = ``;
      mainEle.appendChild(ele);
    })
    .then(async () => {
      const WASMRuntime = Module;

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
          chunksDidEle.textContent = `ChunksDid: ${String(chunks_did)}`;
          const chunksTotalEle = window.document.getElementById(chunksTotalId);
          chunksTotalEle.textContent = `ChunksTotal: ${String(total_chunks)}`;
          const resultsEle = window.document.getElementById(resultId);
          const result_u8 = WASMRuntime.HEAPU8.subarray(
            result_buf,
            result_buf + result_len
          );
          resultsEle.textContent = `Result: ${toHex(result_u8)}`;
          console.log("Update:", `Result: ${toHex(result_u8)}`);
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
      const ele = window.document.getElementById(resultId);
      ele.textContent = `Result: ${hexResult}`;

      console.debug("Freeing context object:", hexAddr(ctx_buf));
      await WASMRuntime._free_cksum_calc_ctx(ctx_buf);
      console.debug(`Context object ${hexAddr(ctx_buf)} is freed now.`);
    });
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
