import { MutableRefObject, useEffect, useRef } from "react";
import { DigestId } from "../types";
import { computeDigest } from "../utils/compute-digest";
import { Box } from "@mui/material";
import { toHex } from "../utils/format";

type StreamEnclosure = {
  stream: ReadableStream<Uint8Array>;
  reader: ReadableStreamDefaultReader | null;
};

function cancelStream(streamRef: MutableRefObject<StreamEnclosure | null>) {
  if (streamRef.current) {
    streamRef.current.reader?.cancel();
    streamRef.current.reader?.releaseLock();
    streamRef.current.stream.cancel();
    streamRef.current = null;
  }
}

export function Digest(props: {
  data: Uint8Array | string;
  algorithm: DigestId;
}) {
  const { data, algorithm } = props;
  const streamRef = useRef<StreamEnclosure | null>(null);

  const eleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    cancelStream(streamRef);

    const length = typeof data === "string" ? data.length : data.byteLength;
    if (length > 0) {
      const enc = new TextEncoder();
      const buf = typeof data === "string" ? enc.encode(data) : data;
      const stream = computeDigest(buf, algorithm, eleRef);
      const reader = stream.getReader();
      const onData = (chunk: ReadableStreamReadResult<Uint8Array>) => {
        if (chunk.value && eleRef.current) {
          const hex = toHex(chunk.value);
          eleRef.current.textContent = hex;
        }

        if (chunk.done) {
          return;
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
      cancelStream(streamRef);
    };
  }, [data, algorithm]);

  return <Box ref={eleRef}></Box>;
}
