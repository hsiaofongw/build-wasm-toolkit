import { MutableRefObject } from "react";
import { DigestId, DigestResult } from "../types";
import { toHex } from "./format";

const default_alignment = 64;
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

function get_result_len_by_alg_id(alg_id: DigestId): number {
  switch (alg_id) {
    case DigestId.MD5:
      return size_per_algorithm.md5;
    case DigestId.SHA1:
      return size_per_algorithm.sha1;
    case DigestId.SHA224:
      return size_per_algorithm.sha224;
    case DigestId.SHA256:
      return size_per_algorithm.sha256;
    case DigestId.SHA384:
      return size_per_algorithm.sha384;
    case DigestId.SHA512:
      return size_per_algorithm.sha512;
    case DigestId.SM3:
      return size_per_algorithm.sm3;
    default:
      console.error("Can't file result length for given algorithm: ", alg_id);
      return 0;
  }
}

function alignToMultiplesOf(size: number, n: number) {
  return Math.ceil(size / n) * n;
}

const pathToToolchainWasm = "toolchain.wasm";

export enum HashProcessStage {
  HASH_STAGE_COMPLETE = 1,
  HASH_STAGE_PROCESSING = 0,
}

export function computeDigest(
  inputData: Uint8Array,
  algId: DigestId,
  elemRef?: MutableRefObject<HTMLDivElement | null>
): ReadableStream<Uint8Array> {
  const initial_pages = 2;
  const shm0 = new WebAssembly.Memory({
    initial: initial_pages,
  });

  let stream_state = { closed: false };

  return new ReadableStream({
    cancel: () => {
      stream_state.closed = true;
    },
    pull: (controller) => {
      return WebAssembly.instantiateStreaming(fetch(pathToToolchainWasm), {
        importobjs: { shm0 },
        env: {
          on_hash_value_update: (
            offset: number,
            alg_id: DigestId,
            stage: HashProcessStage
          ) => {
            if (stage === HashProcessStage.HASH_STAGE_COMPLETE) {
              return;
            }

            const result_len = get_result_len_by_alg_id(alg_id);
            const result_buf = new Uint8Array(shm0.buffer, offset, result_len);
            if (!stream_state.closed) {
              if (elemRef?.current) {
                console.debug("update");
                elemRef.current.textContent = toHex(result_buf);
              }
              controller.enqueue(result_buf);
            }
          },
        },
      })
        .then((obj: any) => {
          const first_addr = obj.instance.exports.get_first_usable_address();
          if (first_addr === undefined) {
            throw new Error("failed to get first usable address.");
          }

          const msg_len = inputData.length;

          const msg_buf = alignToMultiplesOf(first_addr + 1, default_alignment);
          const result_buf_estimate = alignToMultiplesOf(
            msg_buf + msg_len,
            default_alignment
          );

          const size_needed = alignToMultiplesOf(
            result_buf_estimate +
              Math.max(...Object.values(size_per_algorithm)),
            default_alignment
          );
          const initial_size = initial_pages * size_per_page;
          if (size_needed >= initial_size) {
            const need_more = Math.max(1, size_needed - initial_size);
            const need_more_pages = Math.ceil(need_more / size_per_page);
            if (obj.instance.exports.getmorepages(need_more_pages) < 0) {
              throw new Error("failed to get more pages.");
            }
          }

          const dview = new DataView(shm0.buffer);
          for (let i = 0; i < msg_len; ++i) {
            dview.setUint8(msg_buf + i, inputData[i]);
          }

          const result_buf = obj.instance.exports.initiate_buffer_hashing(
            msg_buf,
            msg_len,
            algId
          );

          const result_len = get_result_len_by_alg_id(algId);
          const result = new Uint8Array(shm0.buffer, result_buf, result_len);
          if (!stream_state.closed) {
            controller.enqueue(result);
            controller.close();
          }
        })
        .catch((e) => {
          console.error(e);
          controller.close();
        });
    },
  });
}
