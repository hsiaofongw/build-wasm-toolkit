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
import { blue, lightBlue } from "@mui/material/colors";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

function alignToMultiplesOf(size: number, n: number) {
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

const size_per_algorithm: Record<string, number> = {
  md5: 16,
  sha1: 20,
  sha224: 224 / 8,
  sha256: 256 / 8,
  sha384: 384 / 8,
  sha512: 512 / 8,
  sm3: 32,
};

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
      <Box sx={{ marginTop: "6px", wordBreak: "break-all" }}>
        {toHexString(props.item.value)}
      </Box>
    </Box>
  );
}

function FileDigestResult(props: {
  file: LoadedFile;
  checkflags: DigestCheckFlag;
}) {
  const digestQuery = useQuery({
    queryKey: [
      "file",
      props.file.file.name,
      props.file.data.byteLength,
      props.checkflags,
    ],
    queryFn: () => {
      return props.file.data.byteLength > 0
        ? computeDigest(new Uint8Array(props.file.data), props.checkflags)
        : Promise.resolve([]);
    },
  });

  return (
    <Box>
      <Box>
        文件名：{props.file.file.name}&nbsp;（
        {props.file.file.size ?? props.file.data.byteLength}&nbsp;字节）
      </Box>

      <Box
        sx={{
          marginTop: "16px",
          display: "flex",
          flexDirection: "column",
          rowGap: "16px",
        }}
      >
        {!props.checkflags ? (
          "请选择算法"
        ) : digestQuery.isLoading ? (
          <Delayed delayMs={1000}>
            <LinearProgress />
          </Delayed>
        ) : (
          (digestQuery.data ?? []).map((digestResult) => (
            <DisplayDigestResult
              key={digestResult.algorithmName}
              item={digestResult}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

function appendDupId(name: string): string {
  const pattern = /^([^.]+)([.][a-zA-Z0-9\-_]+)$/;
  const res = pattern.exec(name);
  if (res === null) {
    return `${name}_1`;
  }
  return `${res[1]}_1${res[2]}`;
}

type LoadedFile = { file: File; data: ArrayBuffer };
function withNameMangled(f: LoadedFile, fs: LoadedFile[]): LoadedFile {
  if (fs.some((f_) => f_.file.name === f.file.name)) {
    return withNameMangled(
      { ...f, file: { ...f.file, name: appendDupId(f.file.name) } },
      fs
    );
  }
  return f;
}

function DropAccept(props: { onLoaded: (loadedFile: LoadedFile) => void }) {
  const [entered, setEntered] = useState(false);
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        borderStyle: "dashed",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderColor: entered ? lightBlue["600"] : "initial",
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEntered(true);
      }}
      onDragLeave={(e) => {
        setEntered(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEntered(false);
        const items = e.dataTransfer.items;
        if (items) {
          for (let i = 0; i < items.length; ++i) {
            const item = items[i];
            if (item.kind !== "file") {
              continue;
            }

            try {
              const file = item.getAsFile();
              const reader = new FileReader();
              reader.addEventListener("loadend", (e) => {
                if (e.loaded) {
                  if (reader.result instanceof ArrayBuffer) {
                    props.onLoaded({ file, data: reader.result });
                  }
                }
              });
              reader.addEventListener("error", (e) => {
                console.error("Reader error:", e);
              });

              reader.readAsArrayBuffer(file);
            } catch (e) {
              console.log(e);
              continue;
            }
          }
        }
      }}
    >
      {entered ? "松开鼠标放下" : "拖拽文件到这里"}
    </Box>
  );
}

const default_alignment = 64;
const base_workspace_addr = 2 ** 20;
const size_per_page = 2 ** 16;

function format_addr(x: number) {
  return `0x${x.toString(16).padStart(8, "0")}`;
}

function computeDigest(
  inputData: Uint8Array,
  checkflags: DigestCheckFlag
): Promise<DigestResult[]> {
  const msglen = inputData.length;
  const msg_aligned_len = alignToMultiplesOf(msglen, default_alignment);
  const max_result_len =
    alignToMultiplesOf(
      Math.max(...Object.values(size_per_algorithm)),
      default_alignment
    ) * Object.keys(size_per_algorithm).length;

  const size_needed =
    alignToMultiplesOf(base_workspace_addr, default_alignment) +
    msg_aligned_len +
    max_result_len;

  const pages_needed = Math.ceil(size_needed / size_per_page);
  console.debug("[dbg] base_workspace:", format_addr(base_workspace_addr));
  console.debug("[dbg] msglen:", format_addr(msglen));
  console.debug("[dbg] msg_aligned_len:", format_addr(msg_aligned_len));
  console.debug("[dbg] max_result_len:", format_addr(max_result_len));
  console.debug("[dbg] size_needed:", format_addr(size_needed));
  console.debug("[dbg] 64k pages_needed:", pages_needed);

  const shm0 = new WebAssembly.Memory({
    initial: pages_needed,
  });

  const dview = new DataView(shm0.buffer);
  const buf_start = base_workspace_addr;
  for (let i = 0; i < msglen; ++i) {
    dview.setUint8(buf_start + i, inputData[i]);
  }

  return WebAssembly.instantiateStreaming(fetch(pathToToolchainWasm), {
    importobjs: { shm0 },
  })
    .then((vm) => {
      const md5_buffer = vm.instance.exports.md5_buffer as any;
      const md5_result_buf = alignToMultiplesOf(
        buf_start + msglen,
        default_alignment
      );
      const md5_result_len = size_per_algorithm.md5;

      const sha1_buffer = vm.instance.exports.sha1_buffer as any;
      const sha1_result_buf = alignToMultiplesOf(
        md5_result_buf + md5_result_len,
        default_alignment
      );
      const sha1_result_len = size_per_algorithm.sha1;

      const sha224_buffer = vm.instance.exports.sha224_buffer as any;
      const sha224_result_buf = alignToMultiplesOf(
        sha1_result_buf + sha1_result_len,
        default_alignment
      );
      const sha224_result_len = size_per_algorithm.sha224;

      const sha256_buffer = vm.instance.exports.sha256_buffer as any;
      const sha256_result_buf = alignToMultiplesOf(
        sha224_result_buf + sha224_result_len,
        default_alignment
      );
      const sha256_result_len = size_per_algorithm.sha256;

      const sha384_buffer = vm.instance.exports.sha384_buffer as any;
      const sha384_result_buf = alignToMultiplesOf(
        sha256_result_buf + sha256_result_len,
        default_alignment
      );
      const sha384_result_len = size_per_algorithm.sha384;

      const sha512_buffer = vm.instance.exports.sha512_buffer as any;
      const sha512_result_buf = alignToMultiplesOf(
        sha384_result_buf + sha384_result_len,
        default_alignment
      );
      const sha512_result_len = size_per_algorithm.sha512;

      const sm3_buffer = vm.instance.exports.sm3_buffer as any;
      const sm3_result_buf = alignToMultiplesOf(
        sha512_result_buf + sha512_result_len,
        default_alignment
      );
      const sm3_result_len = size_per_algorithm.sm3;

      let result: DigestResult[] = [];
      if (checkflags & DigestCheckFlag.MD5) {
        md5_buffer(buf_start, msglen, md5_result_buf);
        result.push({
          algorithmName: DigestCheckFlag.MD5,
          value: new Uint8Array(shm0.buffer, md5_result_buf, md5_result_len),
        });
      }

      if (checkflags & DigestCheckFlag.SHA1) {
        sha1_buffer(buf_start, msglen, sha1_result_buf);
        result.push({
          algorithmName: DigestCheckFlag.SHA1,
          value: new Uint8Array(shm0.buffer, sha1_result_buf, sha1_result_len),
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
          value: new Uint8Array(shm0.buffer, sm3_result_buf, sm3_result_len),
        });
      }

      return result;
    })
    .catch((e) => {
      console.error(e);
      return [] as DigestResult[];
    });
}

const pathToToolchainWasm = "toolchain.wasm";
export function Main() {
  const [inputType, setInputType] = useState<InputType>(allInputTypes[0]);
  const [checkflags, setCheck] = useState<DigestCheckFlag>(
    DigestCheckFlag.NONE
  );
  const [text, setText] = useState("");
  const textDigestQuery = useQuery({
    queryKey: ["text", text, checkflags],
    queryFn: () => {
      const enc = new TextEncoder();
      const utf8Data = enc.encode(text);
      return utf8Data.length > 0 ? computeDigest(utf8Data, checkflags) : [];
    },
  });

  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);

  const { getName } = useHashAlgNameMap();

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const onDragEnter = (ev: DragEvent) => {
      ev.preventDefault();
      if (inputType !== InputType.File) {
        setInputType(InputType.File);
      }
    };

    window.document.body.addEventListener("dragover", onDragOver);
    window.document.body.addEventListener("dragenter", onDragEnter);
    return () => {
      window.document.body.removeEventListener("dragenter", onDragEnter);
      window.document.body.removeEventListener("dragover", onDragOver);
    };
  }, [inputType, setInputType]);

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
            rows={5}
            value={text}
            onChange={(e) => {
              setText(e.target.value ?? "");
            }}
          />
        ) : inputType === InputType.File ? (
          <Box sx={{ height: "200px", width: "100%" }}>
            <DropAccept
              onLoaded={(f) => {
                setLoadedFiles((prev) =>
                  prev.concat([withNameMangled(f, loadedFiles)])
                );
              }}
            />
          </Box>
        ) : (
          <Box>未知类型</Box>
        )}
      </Box>

      <Box sx={{ marginTop: "16px" }}>
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
          rowGap: "16px",
        }}
      >
        {inputType === InputType.Text ? (
          textDigestQuery.isLoading ? (
            <Delayed delayMs={3000}>
              <LinearProgress />
            </Delayed>
          ) : (
            textDigestQuery.data.map((item) => (
              <DisplayDigestResult key={item.algorithmName} item={item} />
            ))
          )
        ) : inputType === InputType.File ? (
          loadedFiles.map((f, idx) => (
            <FileDigestResult key={idx} file={f} checkflags={checkflags} />
          ))
        ) : (
          <>未知输入类型</>
        )}
      </Box>
    </Box>
  );
}
