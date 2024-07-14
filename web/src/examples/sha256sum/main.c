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

typedef struct {
  char *msg_buf;
  size_t msg_len;
  char *result_buf;
  size_t result_len;
  int alg_id;
} CksumCalcCtx;

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

EMSCRIPTEN_KEEPALIVE char *get_msg_buf_addr(CksumCalcCtx *ctx) {
  return ctx->msg_buf;
}

EMSCRIPTEN_KEEPALIVE char *get_cksum_result_buf(CksumCalcCtx *ctx) {
  return ctx->result_buf;
}

EMSCRIPTEN_KEEPALIVE size_t get_cksum_result_len(CksumCalcCtx *ctx) {
  return ctx->result_len;
}

EMSCRIPTEN_KEEPALIVE void set_msg_buf_len(CksumCalcCtx *ctx,
                                          size_t msg_buf_len) {
  ctx->msg_len = msg_buf_len;
}

EMSCRIPTEN_KEEPALIVE CksumCalcCtx *create_cksum_calc_ctx(size_t msglen,
                                                         int digest_id) {
  CksumCalcCtx *ctx = malloc(sizeof(CksumCalcCtx));
  ctx->msg_buf = malloc(msglen);
  ctx->msg_len = msglen;
  ctx->result_len = get_result_buf_len(digest_id);
  ctx->result_buf = malloc(ctx->result_len);
  ctx->alg_id = digest_id;
  return ctx;
}

EMSCRIPTEN_KEEPALIVE int calculate_sha256sum(CksumCalcCtx *ctx) {
  sha256_buffer(ctx->msg_buf, ctx->msg_len, ctx->result_buf);
  return 0;
}

EMSCRIPTEN_KEEPALIVE void free_cksum_calc_ctx(CksumCalcCtx *ctx) {
  free(ctx->msg_buf);
  free(ctx->result_buf);
  free(ctx);
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
      return;
  }

  // on_hash_value_update_wrap(result_buf, alg_id, stage);
}

void on_hash_process_block_iterate(uint32_t iter_idx, void *ctx,
                                   uint32_t alg_id) {
  uint32_t stride_mask = (1 << 14) - 1;
  if (iter_idx & stride_mask) {
    return;
  }

  // read_result(ctx, alg_id, 0);

  // int sleep_ms = 33;
  // emscripten_sleep(sleep_ms);
}