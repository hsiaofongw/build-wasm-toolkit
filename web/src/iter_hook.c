#include <config.h>

#include "sha256.h"


char intermediate_result_buf[128];

void on_sha256_hash_update(char *res_buf);

void on_sha256_block_process_iter(uint32_t num_iter, const struct sha256_ctx *ctx) {
  uint32_t stride_mask = (2<<14)-1;
  if (num_iter & stride_mask) {
    return;
  }

  sha256_read_ctx(ctx, intermediate_result_buf);
  on_sha256_hash_update(intermediate_result_buf);
  return;
}

