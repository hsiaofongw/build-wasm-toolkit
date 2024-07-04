"use client";

import { Box, LinearProgress, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function Delayed(props: { children: any; delayMs: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), props.delayMs);
    return () => window.clearTimeout(timer);
  }, []);
  if (show) {
    return <>{props.children}</>;
  }
  return <></>;
}

const pathToToolchainWasm = "toolchain.wasm";
export function Main() {
  const [text, setText] = useState("");
  const query = useQuery({
    queryKey: [text],
    queryFn: () => {
      const shm0 = new WebAssembly.Memory({ initial: 2 });
      const dview = new DataView(shm0.buffer);
      const enc = new TextEncoder();
      const utf8Data = enc.encode(text);
      const msglen = utf8Data.length;
      const buf_start = 0;
      for (let i = 0; i < msglen; ++i) {
        dview.setUint8(buf_start + i, utf8Data[i]);
      }

      return WebAssembly.instantiateStreaming(fetch(pathToToolchainWasm), {
        importobjs: { shm0 },
      })
        .then((vm) => {
          const sha1_buffer = vm.instance.exports.sha1_buffer as any;
          const sha1_result_buf = buf_start + msglen;
          sha1_buffer(buf_start, msglen, sha1_result_buf);

          const resultDigest = new Uint8Array(shm0.buffer, sha1_result_buf, 20);
          const hexHash = Array.from(resultDigest)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return hexHash;
        })
        .catch((e) => {
          console.error(e);
          return "";
        });
    },
  });

  return (
    <Box sx={{ maxWidth: "400px" }}>
      <TextField
        fullWidth
        multiline
        value={text}
        onChange={(e) => {
          setText(e.target.value ?? "");
        }}
      />

      <Box sx={{ marginTop: "10px" }}>
        {query.isLoading ? (
          <Delayed delayMs={3000}>
            <LinearProgress />
          </Delayed>
        ) : (
          query.data
        )}
      </Box>
    </Box>
  );
}
