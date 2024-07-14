#!/bin/bash

scriptDir=$(dirname $0)


emcc \
  -v \
  -I$scriptDir/../../../../coreutils/gnulib/lib \
  -I$scriptDir/../../../../coreutils/lib \
  --no-entry \
  -o $scriptDir/wasm-loader.js \
  -sASYNCIFY=1 \
  -sIMPORTED_MEMORY=0 \
  -sEXPORTED_FUNCTIONS="[_create_cksum_calc_ctx,_calculate_sha256sum,_free_cksum_calc_ctx]" \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINVOKE_RUN=0 \
  -sERROR_ON_UNDEFINED_SYMBOLS=1 \
  -sEXPORTED_RUNTIME_METHODS="[addFunction,ccall,cwrap]" \
  -sALLOW_TABLE_GROWTH=1 \
  --js-library $scriptDir/lib.js \
  $scriptDir/../../../../coreutils/gnulib/lib/sha256.c \
  $scriptDir/main.c
