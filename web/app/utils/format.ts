export function removeDotZeros(x: string): string {
  const pattern1 = /^(\d+)[.]0$/;
  const res1 = pattern1.exec(x);
  if (res1) {
    return res1["1"] ? `${res1["1"]}` : x;
  }

  const pattern2 = /^(\d+)[.]([^0]+)0+$/;
  const res2 = pattern2.exec(x);
  if (res2) {
    return res2["1"] && res2["2"] ? `${res2["1"]}.${res2["2"]}` : x;
  }

  const pattern3 = /^(\d+)[.]0+$/;
  const res3 = pattern3.exec(x);
  if (res3) {
    return res3["1"] ? `${res3["1"]}` : x;
  }

  return x;
}

export function toPercent(x: number): string {
  return `${removeDotZeros((x * 100).toFixed(2))}%`;
}

export function toHex(data: Uint8Array) {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
