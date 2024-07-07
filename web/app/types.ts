import { Progress } from "./utils/progress";

export type LoadedFile = {
  name: string;
  file: File;
  data?: Uint8Array;
  loading?: boolean;
  progress?: Progress;
};

export enum DigestCheckFlag {
  NONE = 0x0,
  MD5 = 0x1,
  SHA1 = 0x1 << 1,
  SHA224 = 0x1 << 2,
  SHA256 = 0x1 << 3,
  SHA384 = 0x1 << 4,
  SHA512 = 0x1 << 5,
  SM3 = 0x1 << 6,
}

export const allDigestAlgs: DigestCheckFlag[] = [
  DigestCheckFlag.MD5,
  DigestCheckFlag.SHA1,
  DigestCheckFlag.SHA224,
  DigestCheckFlag.SHA256,
  DigestCheckFlag.SHA384,
  DigestCheckFlag.SHA512,
  DigestCheckFlag.SM3,
];

export type DigestResult = {
  algorithmName: DigestCheckFlag;
  value: Uint8Array;
};
