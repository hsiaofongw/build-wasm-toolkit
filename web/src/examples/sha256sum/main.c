#include <config.h>
#include <emscripten.h>
#include <io_adapter.h>
#include <math.h>
#include <md5.h>
#include <sha1.h>
#include <sha256.h>
#include <sha512.h>
#include <sm3.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <sys/param.h>

void *malloc(size_t size);
void free(void *);

size_t get_result_buf_len(int digest_id) {
  switch (digest_id) {
    case DIGEST_MD5:
      return MD5_DIGEST_SIZE;
    case DIGEST_SHA1:
      return SHA1_DIGEST_SIZE;
    case DIGEST_SHA224:
      return SHA224_DIGEST_SIZE;
    case DIGEST_SHA256:
      return SHA256_DIGEST_SIZE;
    case DIGEST_SHA384:
      return SHA384_DIGEST_SIZE;
    case DIGEST_SHA512:
      return SHA512_DIGEST_SIZE;
    case DIGEST_SM3:
      return SM3_DIGEST_SIZE;
    default:
      EM_ASM({ console.error('Unknown digest_id'); });
      return 0;
  }
}

EMSCRIPTEN_KEEPALIVE char *get_msg_buf_addr(CksumIOCtx *io_ctx) {
  return io_ctx->msg_buf;
}

EMSCRIPTEN_KEEPALIVE char *get_cksum_result_buf(CksumIOCtx *io_ctx) {
  return io_ctx->result_buf;
}

EMSCRIPTEN_KEEPALIVE size_t get_cksum_result_len(CksumIOCtx *io_ctx) {
  return io_ctx->result_len;
}

EMSCRIPTEN_KEEPALIVE void set_msg_buf_len(CksumIOCtx *io_ctx,
                                          size_t msg_buf_len) {
  io_ctx->msg_len = msg_buf_len;
}

EMSCRIPTEN_KEEPALIVE void set_progress_report_handler(
    CksumIOCtx *io_ctx,
    void (*report_progress_to_upstream)(uint32_t, uint32_t, void *, char *,
                                        size_t)) {
  io_ctx->report_progress_to_upstream = report_progress_to_upstream;
}

void read_result(void *ctx, uint32_t alg_id, char *result_buf) {
  switch (alg_id) {
    case DIGEST_MD5:
      md5_read_ctx(ctx, result_buf);
      break;
    case DIGEST_SHA1:
      sha1_read_ctx(ctx, result_buf);
      break;
    case DIGEST_SHA224:
      sha224_read_ctx(ctx, result_buf);
      break;
    case DIGEST_SHA256:
      sha256_read_ctx(ctx, result_buf);
      break;
    case DIGEST_SHA384:
      sha384_read_ctx(ctx, result_buf);
      break;
    case DIGEST_SHA512:
      sha512_read_ctx(ctx, result_buf);
      break;
    case DIGEST_SM3:
      sm3_read_ctx(ctx, result_buf);
      break;
    default:
      EM_ASM({ console.error('Unknown digest_id'); });
      return;
  }
}

void handle_notify_progress(uint32_t sub_chunks_did, uint32_t total_sub_chunks,
                            void *calc_ctx, void *io_ctx_any) {
  uint32_t stride_mask = (1 << 14) - 1;
  if (sub_chunks_did & stride_mask) {
    return;
  }

  CksumIOCtx *io_ctx = io_ctx_any;

  read_result(calc_ctx, io_ctx->alg_id, io_ctx->result_buf);

  io_ctx->report_progress_to_upstream(sub_chunks_did, total_sub_chunks, io_ctx,
                                      io_ctx->result_buf, io_ctx->result_len);
  int sleep_ms = 33;
  emscripten_sleep(sleep_ms);
}

EMSCRIPTEN_KEEPALIVE CksumIOCtx *create_cksum_calc_ctx(size_t msglen,
                                                       int digest_id) {
  CksumIOCtx *io_ctx = malloc(sizeof(CksumIOCtx));
  io_ctx->msg_buf = malloc(msglen);
  io_ctx->msg_len = msglen;
  io_ctx->result_len = get_result_buf_len(digest_id);
  io_ctx->result_buf = malloc(io_ctx->result_len);
  io_ctx->alg_id = digest_id;
  io_ctx->notify_progress = handle_notify_progress;
  return io_ctx;
}

EMSCRIPTEN_KEEPALIVE int calculate_checksum(CksumIOCtx *io_ctx) {
  switch (io_ctx->alg_id) {
    case DIGEST_MD5:
      EM_ASM({ console.error('Unknown digest_id'); });
      return -1;
    case DIGEST_SHA1:
      EM_ASM({ console.error('Unknown digest_id'); });
      return -1;
    case DIGEST_SHA224:
      sha224_calc(io_ctx);
      break;
    case DIGEST_SHA256:
      sha256_calc(io_ctx);
      break;
    case DIGEST_SHA384:
      EM_ASM({ console.error('Unknown digest_id'); });
      return -1;
    case DIGEST_SHA512:
      EM_ASM({ console.error('Unknown digest_id'); });
      return -1;
    case DIGEST_SM3:
      EM_ASM({ console.error('Unknown digest_id'); });
      return -1;
    default:
      EM_ASM({ console.error('Unknown digest_id'); });
      return -1;
  }
  return 0;
}

EMSCRIPTEN_KEEPALIVE void free_cksum_calc_ctx(CksumIOCtx *io_ctx) {
  free(io_ctx->msg_buf);
  free(io_ctx->result_buf);
  free(io_ctx);
}
