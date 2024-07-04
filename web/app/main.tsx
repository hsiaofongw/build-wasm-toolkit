"use client";

import { Box, LinearProgress, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function alignToMultiplesOf(size: number, n: number = 64) {
  return Math.ceil(size / n) * n;
}

function toHexString(ua: Uint8Array): string {
  return Array.from(ua)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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
enum DigestCheckFlag {
  NONE = 0x0,
  MD5 = 0x1,
  SHA1 = 0x1 << 1,
  SHA224 = 0x1 << 2,
  SHA256 = 0x1 << 3,
  SHA384 = 0x1 << 4,
  SHA512 = 0x1 << 5,
  SM3 = 0x1 << 6,
}

type DigestResult = {
  name: DigestCheckFlag;
  value: Uint8Array;
};

const pathToToolchainWasm = "toolchain.wasm";
export function Main() {
  const [checkflags, setCheck] = useState<DigestCheckFlag>(
    DigestCheckFlag.NONE
  );
  const [text, setText] = useState("");
  const query = useQuery({
    queryKey: [text, checkflags],
    queryFn: () => {
      const shm0 = new WebAssembly.Memory({ initial: 2 });
      const dview = new DataView(shm0.buffer);
      const enc = new TextEncoder();
      const utf8Data = enc.encode(text);
      const msglen = utf8Data.length;
      const buf_start = alignToMultiplesOf(0);
      for (let i = 0; i < msglen; ++i) {
        dview.setUint8(buf_start + i, utf8Data[i]);
      }

      return WebAssembly.instantiateStreaming(fetch(pathToToolchainWasm), {
        importobjs: { shm0 },
      })
        .then((vm) => {
          const md5_buffer = vm.instance.exports.md5_buffer as any;
          const md5_result_buf = alignToMultiplesOf(buf_start + msglen);
          const md5_result_len = 16;

          const sha1_buffer = vm.instance.exports.sha1_buffer as any;
          const sha1_result_buf = alignToMultiplesOf(
            md5_result_buf + md5_result_len
          );
          const sha1_result_len = 20;

          const sha224_buffer = vm.instance.exports.sha224_buffer as any;
          const sha224_result_buf = alignToMultiplesOf(
            sha1_result_buf + sha1_result_len
          );
          const sha224_result_len = 224 / 8;

          const sha256_buffer = vm.instance.exports.sha256_buffer as any;
          const sha256_result_buf = alignToMultiplesOf(
            sha224_result_buf + sha224_result_len
          );
          const sha256_result_len = 256 / 8;

          const sha384_buffer = vm.instance.exports.sha384_buffer as any;
          const sha384_result_buf = alignToMultiplesOf(
            sha256_result_buf + sha256_result_len
          );
          const sha384_result_len = 384 / 8;

          const sha512_buffer = vm.instance.exports.sha512_buffer as any;
          const sha512_result_buf = alignToMultiplesOf(
            sha384_result_buf + sha384_result_len
          );
          const sha512_result_len = 512 / 8;

          let result: DigestResult[] = [];
          if (checkflags & DigestCheckFlag.MD5) {
            md5_buffer(buf_start, msglen, md5_result_buf);
            result.push({
              name: DigestCheckFlag.MD5,
              value: new Uint8Array(
                shm0.buffer,
                md5_result_buf,
                md5_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SHA1) {
            sha1_buffer(buf_start, msglen, sha1_result_buf);
            result.push({
              name: DigestCheckFlag.SHA1,
              value: new Uint8Array(
                shm0.buffer,
                sha1_result_buf,
                sha1_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SHA224) {
            sha224_buffer(buf_start, msglen, sha224_result_buf);
            result.push({
              name: DigestCheckFlag.SHA224,
              value: new Uint8Array(
                shm0.buffer,
                sha224_result_buf,
                sha224_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SHA256) {
            sha256_buffer(buf_start, msglen, sha224_result_buf);
            result.push({
              name: DigestCheckFlag.SHA256,
              value: new Uint8Array(
                shm0.buffer,
                sha256_result_buf,
                sha256_result_len
              ),
            });
          }

          const sha1Hex = toHexString(
            new Uint8Array(shm0.buffer, sha1_result_buf, sha1_result_buf)
          );

          return sha1Hex;
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
