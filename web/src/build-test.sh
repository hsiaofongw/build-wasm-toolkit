#!/bin/bash

emcc \
  -O3 \
  -flto \
  --no-entry \
  -o sayhi1.wasm \
  -sIMPORTED_MEMORY=1 \
  -sEXPORTED_FUNCTIONS="[_say_hi,_get_str_buf,_free_str_buf]" \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINVOKE_RUN=0 \
  -sERROR_ON_UNDEFINED_SYMBOLS=0 \
  test-malloc.c
