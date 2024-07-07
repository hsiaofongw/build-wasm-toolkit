import { DigestId, DigestResult } from "../types";
import { BitMap } from "./bitmap";

const default_alignment = 64;
const base_workspace_addr = 2 ** 20;
const size_per_page = 2 ** 16;

const size_per_algorithm: Record<string, number> = {
  md5: 16,
  sha1: 20,
  sha224: 224 / 8,
  sha256: 256 / 8,
  sha384: 384 / 8,
  sha512: 512 / 8,
  sm3: 32,
};

function format_addr(x: number) {
  return `0x${x.toString(16).padStart(8, "0")}`;
}

function alignToMultiplesOf(size: number, n: number) {
  return Math.ceil(size / n) * n;
}

const pathToToolchainWasm = "toolchain.wasm";

export function computeDigest(
  inputData: Uint8Array,
  selectedAlgs: BitMap
): Promise<DigestResult[]> {
  const msglen = inputData.length;
  const msg_aligned_len = alignToMultiplesOf(msglen, default_alignment);
  const max_result_len =
    alignToMultiplesOf(
      Math.max(...Object.values(size_per_algorithm)),
      default_alignment
    ) * Object.keys(size_per_algorithm).length;

  const size_needed =
    alignToMultiplesOf(base_workspace_addr, default_alignment) +
    msg_aligned_len +
    max_result_len;

  const pages_needed = Math.ceil(size_needed / size_per_page);
  console.debug("[dbg] base_workspace:", format_addr(base_workspace_addr));
  console.debug("[dbg] msglen:", format_addr(msglen));
  console.debug("[dbg] msg_aligned_len:", format_addr(msg_aligned_len));
  console.debug("[dbg] max_result_len:", format_addr(max_result_len));
  console.debug("[dbg] size_needed:", format_addr(size_needed));
  console.debug("[dbg] 64k pages_needed:", pages_needed);

  const shm0 = new WebAssembly.Memory({
    initial: pages_needed,
  });

  const dview = new DataView(shm0.buffer);
  const buf_start = base_workspace_addr;
  for (let i = 0; i < msglen; ++i) {
    dview.setUint8(buf_start + i, inputData[i]);
  }

  return WebAssembly.instantiateStreaming(fetch(pathToToolchainWasm), {
    importobjs: { shm0 },
  })
    .then((vm) => {
      const md5_buffer = vm.instance.exports.md5_buffer as any;
      const md5_result_buf = alignToMultiplesOf(
        buf_start + msglen,
        default_alignment
      );
      const md5_result_len = size_per_algorithm.md5;

      const sha1_buffer = vm.instance.exports.sha1_buffer as any;
      const sha1_result_buf = alignToMultiplesOf(
        md5_result_buf + md5_result_len,
        default_alignment
      );
      const sha1_result_len = size_per_algorithm.sha1;

      const sha224_buffer = vm.instance.exports.sha224_buffer as any;
      const sha224_result_buf = alignToMultiplesOf(
        sha1_result_buf + sha1_result_len,
        default_alignment
      );
      const sha224_result_len = size_per_algorithm.sha224;

      const sha256_buffer = vm.instance.exports.sha256_buffer as any;
      const sha256_result_buf = alignToMultiplesOf(
        sha224_result_buf + sha224_result_len,
        default_alignment
      );
      const sha256_result_len = size_per_algorithm.sha256;

      const sha384_buffer = vm.instance.exports.sha384_buffer as any;
      const sha384_result_buf = alignToMultiplesOf(
        sha256_result_buf + sha256_result_len,
        default_alignment
      );
      const sha384_result_len = size_per_algorithm.sha384;

      const sha512_buffer = vm.instance.exports.sha512_buffer as any;
      const sha512_result_buf = alignToMultiplesOf(
        sha384_result_buf + sha384_result_len,
        default_alignment
      );
      const sha512_result_len = size_per_algorithm.sha512;

      const sm3_buffer = vm.instance.exports.sm3_buffer as any;
      const sm3_result_buf = alignToMultiplesOf(
        sha512_result_buf + sha512_result_len,
        default_alignment
      );
      const sm3_result_len = size_per_algorithm.sm3;

      let result: DigestResult[] = [];
      if (selectedAlgs & DigestId.MD5) {
        md5_buffer(buf_start, msglen, md5_result_buf);
        result.push({
          algorithmName: DigestId.MD5,
          value: new Uint8Array(shm0.buffer, md5_result_buf, md5_result_len),
        });
      }

      if (selectedAlgs & DigestId.SHA1) {
        sha1_buffer(buf_start, msglen, sha1_result_buf);
        result.push({
          algorithmName: DigestId.SHA1,
          value: new Uint8Array(shm0.buffer, sha1_result_buf, sha1_result_len),
        });
      }

      if (selectedAlgs & DigestId.SHA224) {
        sha224_buffer(buf_start, msglen, sha224_result_buf);
        result.push({
          algorithmName: DigestId.SHA224,
          value: new Uint8Array(
            shm0.buffer,
            sha224_result_buf,
            sha224_result_len
          ),
        });
      }

      if (selectedAlgs & DigestId.SHA256) {
        sha256_buffer(buf_start, msglen, sha256_result_buf);
        result.push({
          algorithmName: DigestId.SHA256,
          value: new Uint8Array(
            shm0.buffer,
            sha256_result_buf,
            sha256_result_len
          ),
        });
      }

      if (selectedAlgs & DigestId.SHA384) {
        sha384_buffer(buf_start, msglen, sha384_result_buf);
        result.push({
          algorithmName: DigestId.SHA384,
          value: new Uint8Array(
            shm0.buffer,
            sha384_result_buf,
            sha384_result_len
          ),
        });
      }

      if (selectedAlgs & DigestId.SHA512) {
        sha512_buffer(buf_start, msglen, sha512_result_buf);
        result.push({
          algorithmName: DigestId.SHA512,
          value: new Uint8Array(
            shm0.buffer,
            sha512_result_buf,
            sha512_result_len
          ),
        });
      }

      if (selectedAlgs & DigestId.SM3) {
        sm3_buffer(buf_start, msglen, sm3_result_buf);
        result.push({
          algorithmName: DigestId.SM3,
          value: new Uint8Array(shm0.buffer, sm3_result_buf, sm3_result_len),
        });
      }

      return result;
    })
    .catch((e) => {
      console.error(e);
      return [] as DigestResult[];
    });
}
