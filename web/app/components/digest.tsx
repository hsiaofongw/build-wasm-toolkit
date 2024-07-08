import { useEffect, useRef } from "react";
import { DigestId } from "../types";
import { computeDigest } from "../utils/compute-digest";
import { Box } from "@mui/material";
import { toHex } from "../utils/format";

export function Digest(props: {
  data: Uint8Array | string;
  algorithm: DigestId;
}) {
  const { data, algorithm } = props;
  const streamRef = useRef<{
    stream: ReadableStream<Uint8Array>;
    reader: ReadableStreamDefaultReader | null;
  } | null>(null);

  const eleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.reader.cancel();
      streamRef.current = null;
    }

    const length = typeof data === "string" ? data.length : data.byteLength;
    if (length > 0) {
      const enc = new TextEncoder();
      const buf = typeof data === "string" ? enc.encode(data) : data;
      const stream = computeDigest(buf, algorithm);
      const reader = stream.getReader();
      const onData = (chunk: ReadableStreamReadResult<Uint8Array>) => {
        if (chunk.done) {
          return;
        }

        if (chunk.value) {
          if (eleRef.current) {
            eleRef.current.textContent = toHex(chunk.value);
          }
        }

        reader.read().then(onData);
      };
      reader.read().then(onData);

      streamRef.current = {
        stream,
        reader: reader,
      };
    }

    return () => {
      if (streamRef.current) {
        if (streamRef.current.reader) {
          streamRef.current.reader.releaseLock();
        }
        streamRef.current = null;
      }
    };
  }, [data, algorithm]);

  return <Box ref={eleRef}></Box>;
}
