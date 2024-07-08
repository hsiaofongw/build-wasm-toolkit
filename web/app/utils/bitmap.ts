export type BitMap = {
  flags: number;
  maxBit: number;
};

export function bitmap_new(maxBit: number): BitMap {
  return { flags: 0, maxBit };
}

export function bitmap_is_set(bitmap: BitMap, bit: number): boolean {
  return Boolean(bitmap.flags & (1 << bit));
}

export function bitmap_toggle(bitmap: BitMap, bit: number): BitMap {
  return { ...bitmap, flags: bitmap.flags ^ (1 << bit) };
}

export function bitmap_get_selecteds(bitmap: BitMap): number[] {
  let result: number[] = [];
  for (let bit = 1; bit <= bitmap.maxBit; ++bit) {
    if (bitmap_is_set(bitmap, bit)) {
      result.push(bit);
    }
  }

  return result;
}
