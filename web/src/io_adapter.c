#include <config.h>

#include "sha256.h"
#include "io_adapter.h"

#define MAX_RESULT_BUF_SIZE 128

char result_buf[MAX_RESULT_BUF_SIZE];

void on_hash_value_update(char *ref_buf, uint32_t alg_id);

void on_hash_process_block_iterate(uint32_t iter_idx, void *ctx, uint32_t alg_id) {
  uint32_t stride_mask = (2<<14)-1;
  if (num_iter & stride_mask) {
    return;
  }

  switch (alg_id) {
    case MD5:
      break;
    case SHA1:
      break;
    case SHA224:
      break;
    case SHA256:
      sha256_read_ctx(ctx, result_buf);
      break;
    case SHA384:
      break;
    case SHA512:
      break;
    case SM3:
      break;
    default:
      return;
  }

  on_hash_value_update(result_buf, alg_id);
}
