import { Progress } from "./utils/progress";

export type LoadedFile = {
  name: string;
  file: File;
  data?: Uint8Array;
  loading?: boolean;
  progress?: Progress;
};

export enum DigestId {
  MD5 = 1,
  SHA1 = 2,
  SHA224 = 3,
  SHA256 = 4,
  SHA384 = 5,
  SHA512 = 6,
  SM3 = 7,
}

export const allDigestAlgs: DigestId[] = [
  DigestId.MD5,
  DigestId.SHA1,
  DigestId.SHA224,
  DigestId.SHA256,
  DigestId.SHA384,
  DigestId.SHA512,
  DigestId.SM3,
];

export type DigestResult = {
  algorithmName: DigestId;
  value: Uint8Array;
};
