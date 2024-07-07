import { LoadedFile } from "../types";

function appendDupId(name: string): string {
  const pattern = /^([^.]+)([.][a-zA-Z0-9\-_]+)$/;
  const res = pattern.exec(name);
  if (res === null) {
    return `${name}_1`;
  }
  return `${res[1]}_1${res[2]}`;
}

export function withNameMangled(f: LoadedFile, fs: LoadedFile[]): LoadedFile {
  if (fs.some((f_) => f_.file.name === f.file.name)) {
    return withNameMangled(
      { ...f, file: { ...f.file, name: appendDupId(f.file.name) } },
      fs
    );
  }
  return f;
}
