#!/bin/bash

scriptDir=$(dirname $0)


emcc \
  -v \
  -I$scriptDir/../../../../coreutils/gnulib/lib \
  -I$scriptDir/../../../../coreutils/lib \
  --no-entry \
  -o $scriptDir/wasm-loader.mjs \
  -sASSERTIONS=2 \
  -sSTACK_OVERFLOW_CHECK=2 \
  -sCHECK_NULL_WRITES=1 \
  -sASYNCIFY=1 \
  -sIMPORTED_MEMORY=0 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINVOKE_RUN=0 \
  -sERROR_ON_UNDEFINED_SYMBOLS=1 \
  -sEXPORTED_RUNTIME_METHODS="[ccall,cwrap,setValue,getValue,addFunction]" \
  -sALLOW_TABLE_GROWTH=1 \
  $scriptDir/../../../../coreutils/gnulib/lib/byteswap.c \
  $scriptDir/../../../../coreutils/gnulib/lib/md5.c \
  $scriptDir/../../../../coreutils/gnulib/lib/sha1.c \
  $scriptDir/../../../../coreutils/gnulib/lib/sha256.c \
  $scriptDir/../../../../coreutils/gnulib/lib/sha512.c \
  $scriptDir/../../../../coreutils/gnulib/lib/sm3.c \
  $scriptDir/main.c
