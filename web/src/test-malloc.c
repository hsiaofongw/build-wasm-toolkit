#include <math.h>
#include <stdlib.h>
#include <sys/param.h>

void *malloc(size_t size);
void free(void *);

void *get_str_buf(size_t size) { return malloc(size); }

void free_str_buf(void *sbuf) { free(sbuf); }

size_t say_hi(char *sbuf, size_t buf_size) {
  char msg[] = "hi!";
  size_t msglen = sizeof(msg);
  size_t bytes_w = 0;
  for (int i = 0; i < MIN(buf_size, msglen); ++i) {
    sbuf[i] = msg[i];
    ++bytes_w;
  }

  return bytes_w;
}