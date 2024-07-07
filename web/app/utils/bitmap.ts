export type BitMap = {
  flags: number;
};

export function bitmap_new(): BitMap {
  return { flags: 0 };
}

export function bitmap_is_set(bitmap: BitMap, bit: number): boolean {
  return Boolean(bitmap.flags & bit);
}

export function bitmap_toggle(bitmap: BitMap, bit: number): BitMap {
  return { ...bitmap, flags: bitmap.flags ^ bit };
}
