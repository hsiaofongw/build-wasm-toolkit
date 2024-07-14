#include <config.h>
#include <emscripten.h>
#include <math.h>
#include <sha256.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <sys/param.h>

void *malloc(size_t size);
void free(void *);

typedef struct CksumCalcCtx {
  char *msg_buf;
  size_t msg_len;
  char *result_buf;
  size_t result_len;
} CksumCalcCtx;

enum DigestId {
  DIGEST_MD5 = 0,
  DIGEST_SHA1 = 1,
  DIGEST_SHA224 = 2,
  DIGEST_SHA256 = 3,
  DIGEST_SHA384 = 4,
  DIGEST_SHA512 = 5,
  DIGEST_SM3 = 6,
};

size_t get_result_buf_len(int digest_id) {
  switch (digest_id) {
    case DIGEST_SHA256:
      return 256 / 8;
    default:
      return 0;
  }
}

CksumCalcCtx const *dummy_ctx = 0;
EMSCRIPTEN_KEEPALIVE size_t MSG_BUF_OFFSET = offsetof(CksumCalcCtx, msg_buf);

CksumCalcCtx *create_cksum_calc_ctx(size_t msglen, int digest_id) {
  CksumCalcCtx *ctx = malloc(sizeof(CksumCalcCtx));
  ctx->msg_buf = malloc(msglen);
  ctx->msg_len = msglen;
  ctx->result_len = get_result_buf_len(digest_id);
  ctx->result_buf = malloc(ctx->result_len);
  return ctx;
}

int calculate_sha256sum(CksumCalcCtx *ctx) {
  sha256_buffer(ctx->msg_buf, ctx->msg_len, ctx->result_buf);
  return 0;
}

void free_cksum_calc_ctx(CksumCalcCtx *ctx) {
  free(ctx->msg_buf);
  free(ctx->result_buf);
  free(ctx);
}

void on_hash_process_block_iterate(uint32_t iter_idx, void *ctx,
                                   uint32_t alg_id) {}