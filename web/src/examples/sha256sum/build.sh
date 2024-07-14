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
  -sALLOW_MEMORY_GROWTH=1 \
  -sINVOKE_RUN=0 \
  -sERROR_ON_UNDEFINED_SYMBOLS=1 \
  -sEXPORTED_RUNTIME_METHODS="[ccall,cwrap,setValue,getValue]" \
  -sALLOW_TABLE_GROWTH=1 \
  $scriptDir/../../../../coreutils/gnulib/lib/sha256.c \
  $scriptDir/main.c
