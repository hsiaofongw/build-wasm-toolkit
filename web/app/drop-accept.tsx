"use client";

import { useRef, useState } from "react";
import { LoadedFile } from "./types";
import { lightBlue } from "@mui/material/colors";
import { Box, Link } from "@mui/material";

export function DropAccept(props: {
  onLoaded: (loadedFile: LoadedFile) => void;
}) {
  const [entered, setEntered] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleReaderLoaded = (
    e: ProgressEvent<FileReader>,
    reader: FileReader,
    file: File
  ) => {
    if (e.loaded) {
      if (reader.result instanceof ArrayBuffer) {
        props.onLoaded({ file, data: reader.result });
      }
    }
  };
  const handleReaderError = (e: ProgressEvent<FileReader>) => {
    console.error("Reader error:", e);
  };
  const handleNewFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", (e) =>
      handleReaderLoaded(e, reader, file)
    );
    reader.addEventListener("error", handleReaderError);

    reader.readAsArrayBuffer(file);
  };

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
              handleNewFile(file);
            } catch (e) {
              console.log(e);
              continue;
            }
          }
        }
      }}
    >
      {entered ? (
        "松开鼠标放下"
      ) : (
        <Box>
          拖拽文件到这里，或者
          <Link
            onClick={() => {
              inputRef.current?.click?.();
            }}
            sx={{ cursor: "pointer" }}
            underline="hover"
          >
            选择文件上传
          </Link>
          <input
            onChange={(ev) => {
              const files = ev.target.files;
              if (!files || !(files instanceof FileList)) {
                return;
              }

              for (let i = 0; i < files.length; ++i) {
                const file = files.item(i);
                if (!file || !(file instanceof File)) {
                  continue;
                }

                handleNewFile(file);
              }
            }}
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
          ></input>
        </Box>
      )}
    </Box>
  );
}
