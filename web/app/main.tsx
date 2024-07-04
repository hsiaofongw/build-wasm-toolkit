"use client";

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

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
const allDigestAlgs: DigestCheckFlag[] = [
  DigestCheckFlag.MD5,
  DigestCheckFlag.SHA1,
  DigestCheckFlag.SHA224,
  DigestCheckFlag.SHA256,
  DigestCheckFlag.SHA384,
  DigestCheckFlag.SHA512,
  DigestCheckFlag.SM3,
];

enum InputType {
  Text = "text",
  File = "file",
}
const allInputTypes: InputType[] = [InputType.Text, InputType.File];

type DigestResult = {
  algorithmName: DigestCheckFlag;
  value: Uint8Array;
};

function useHashAlgNameMap() {
  const m = useMemo(() => {
    const m: Record<string, string> = {};
    m[String(DigestCheckFlag.MD5)] = "MD5";
    m[String(DigestCheckFlag.SHA1)] = "SHA1";
    m[String(DigestCheckFlag.SHA224)] = "SHA224";
    m[String(DigestCheckFlag.SHA256)] = "SHA256";
    m[String(DigestCheckFlag.SHA384)] = "SHA384";
    m[String(DigestCheckFlag.SHA512)] = "SHA512";
    m[String(DigestCheckFlag.SM3)] = "SM3";
    return m;
  }, []);

  return {
    getName: (t: string | number) => {
      const x = String(t);
      if (x in m) {
        return m[x];
      }
      return x;
    },
  };
}

function DisplayDigestResult(props: { item: DigestResult }) {
  const { getName } = useHashAlgNameMap();

  return (
    <Box>
      <Box>{getName(props.item.algorithmName)}</Box>
      <Box sx={{ marginTop: "6px" }}>{toHexString(props.item.value)}</Box>
    </Box>
  );
}

const pathToToolchainWasm = "toolchain.wasm";
export function Main() {
  const [inputType, setInputType] = useState<InputType>(allInputTypes[0]);
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

          const sm3_buffer = vm.instance.exports.sm3_buffer as any;
          const sm3_result_buf = alignToMultiplesOf(
            sha512_result_buf + sha512_result_len
          );
          const sm3_result_len = 32;

          let result: DigestResult[] = [];
          if (checkflags & DigestCheckFlag.MD5) {
            md5_buffer(buf_start, msglen, md5_result_buf);
            result.push({
              algorithmName: DigestCheckFlag.MD5,
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
              algorithmName: DigestCheckFlag.SHA1,
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
              algorithmName: DigestCheckFlag.SHA224,
              value: new Uint8Array(
                shm0.buffer,
                sha224_result_buf,
                sha224_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SHA256) {
            sha256_buffer(buf_start, msglen, sha256_result_buf);
            result.push({
              algorithmName: DigestCheckFlag.SHA256,
              value: new Uint8Array(
                shm0.buffer,
                sha256_result_buf,
                sha256_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SHA384) {
            sha384_buffer(buf_start, msglen, sha384_result_buf);
            result.push({
              algorithmName: DigestCheckFlag.SHA384,
              value: new Uint8Array(
                shm0.buffer,
                sha384_result_buf,
                sha384_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SHA512) {
            sha512_buffer(buf_start, msglen, sha512_result_buf);
            result.push({
              algorithmName: DigestCheckFlag.SHA512,
              value: new Uint8Array(
                shm0.buffer,
                sha512_result_buf,
                sha512_result_len
              ),
            });
          }

          if (checkflags & DigestCheckFlag.SM3) {
            sm3_buffer(buf_start, msglen, sm3_result_buf);
            result.push({
              algorithmName: DigestCheckFlag.SM3,
              value: new Uint8Array(
                shm0.buffer,
                sm3_result_buf,
                sm3_result_len
              ),
            });
          }

          return result;
        })
        .catch((e) => {
          console.error(e);
          return [] as DigestResult[];
        });
    },
  });

  const { getName } = useHashAlgNameMap();

  return (
    <Box>
      <FormControl>
        <FormLabel>输入方式</FormLabel>
        <RadioGroup
          row
          value={inputType}
          onChange={(_, val) => {
            setInputType(
              allInputTypes.find((s) => s === val) ?? allInputTypes[0]
            );
          }}
        >
          <FormControlLabel
            value={InputType.Text}
            control={<Radio />}
            label="文本"
          />
          <FormControlLabel
            value={InputType.File}
            disabled
            control={<Radio />}
            label="文件"
          />
        </RadioGroup>
      </FormControl>

      <Box sx={{ marginTop: "10px", maxWidth: "600px" }}>
        {inputType === InputType.Text ? (
          <TextField
            fullWidth
            multiline
            value={text}
            onChange={(e) => {
              setText(e.target.value ?? "");
            }}
          />
        ) : inputType === InputType.File ? (
          <Box>未实现</Box>
        ) : (
          <Box>未知类型</Box>
        )}
      </Box>

      <Box sx={{ marginTop: "10px" }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">摘要算法</FormLabel>
          <FormGroup row>
            {allDigestAlgs.map((alg) => (
              <FormControlLabel
                key={alg}
                control={
                  <Checkbox
                    checked={Boolean(checkflags & alg)}
                    onChange={() => setCheck((prev) => prev ^ alg)}
                  />
                }
                label={getName(alg)}
              />
            ))}
          </FormGroup>
        </FormControl>
      </Box>

      <Box
        sx={{
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          rowGap: "10px",
        }}
      >
        {query.isLoading ? (
          <Delayed delayMs={3000}>
            <LinearProgress />
          </Delayed>
        ) : (
          query.data.map((item) => (
            <DisplayDigestResult key={item.algorithmName} item={item} />
          ))
        )}
      </Box>
    </Box>
  );
}
