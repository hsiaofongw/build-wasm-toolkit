"use client";

import { useState } from "react";
import { LoadedFile } from "./types";
import { lightBlue } from "@mui/material/colors";
import { Box } from "@mui/material";

export function DropAccept(props: {
  onLoaded: (loadedFile: LoadedFile) => void;
}) {
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
