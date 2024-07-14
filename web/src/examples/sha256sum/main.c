#include <config.h>
#include <emscripten.h>
#include <math.h>
#include <sha256.h>
#include <stdlib.h>
#include <string.h>
#include <sys/param.h>

void *malloc(size_t size);
void free(void *);

extern void console_log(void *sbuf, size_t len);

size_t say_hi(char *sbuf, size_t buf_size) {
  char msg[] = "hi!";
  console_log(msg, strlen(msg));
  emscripten_sleep(33);
  size_t msglen = sizeof(msg);
  size_t bytes_w = 0;
  for (int i = 0; i < MIN(buf_size, msglen); ++i) {
    sbuf[i] = msg[i];
    ++bytes_w;
  }

  return bytes_w;
}

typedef struct {
  char *msg_buf;
  size_t msg_len;
  char *result_buf;
  size_t result_len;
} CksumCalcCtx;

enum DigestId {
  DIGEST_MD5 = 1,
  DIGEST_SHA1 = 2,
  DIGEST_SHA224 = 3,
  DIGEST_SHA256 = 4,
  DIGEST_SHA384 = 5,
  DIGEST_SHA512 = 6,
  DIGEST_SM3 = 7,
};

size_t get_result_buf_len(int digest_id) {
  switch (digest_id) {
    case DIGEST_SHA256:
      return 256 / 8;
    default:
      char msg[] = 'unknown digest_id';
      console_log(msg, strlen(msg));
      return 0;
  }
}

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