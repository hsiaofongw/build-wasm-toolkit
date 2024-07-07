import { LoadedFile } from "../types";

function appendDupId(name: string): string {
  const pattern = /^([^.]+)([.][a-zA-Z0-9\-_]+)$/;
  const res = pattern.exec(name);
  if (res === null) {
    return `${name}_1`;
  }
  return `${res[1]}_1${res[2]}`;
}

export function withNameMangled(name: string, names: string[]): string {
  if (names.includes(name)) {
    return withNameMangled(appendDupId(name), names);
  }
  return name;
}
