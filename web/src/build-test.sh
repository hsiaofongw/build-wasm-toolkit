#!/bin/bash

scriptDir=$(dirname $0)

emcc \
  -v \
  --no-entry \
  -o sayhi.js \
  -sASYNCIFY=1 \
  -sIMPORTED_MEMORY=0 \
  -sEXPORTED_FUNCTIONS="[_say_hi,_get_str_buf,_free_str_buf]" \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINVOKE_RUN=0 \
  -sERROR_ON_UNDEFINED_SYMBOLS=1 \
  -sEXPORTED_RUNTIME_METHODS="[addFunction,ccall,cwrap]" \
  -sALLOW_TABLE_GROWTH=1 \
  --js-library $scriptDir/my_lib.js \
  test-malloc.c
