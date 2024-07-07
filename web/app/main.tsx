"use client";

import {
  Box,
  Button,
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
import {
  DigestCheckFlag,
  DigestResult,
  LoadedFile,
  allDigestAlgs,
} from "./types";
import { DropAccept } from "./components/drop-accept";
import { withNameMangled } from "./utils/name-mangling";
import { computeDigest } from "./utils/compute-digest";

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

enum InputType {
  Text = "text",
  File = "file",
}
const allInputTypes: InputType[] = [InputType.Text, InputType.File];

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
      <Box sx={{ maxWidth: "540px" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: "18px",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <FormControl
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: "18px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
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
          <Button>导出</Button>
        </Box>

        <Box sx={{ marginTop: "10px" }}>
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
    </Box>
  );
}
