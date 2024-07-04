FROM mycoreutils:0.1 AS coreutils-build
FROM myemcc:0.1 as emcc-build
FROM mywabt:0.1 as wabt-build
FROM myllvm:0.1 as llvm-build

FROM myubuntu:0.1

WORKDIR /build

COPY --from=coreutils-build /build/coreutils-9.5 /build/coreutils-9.5
COPY --from=emcc-build /build/emscripten /build/emscripten
COPY --from=emcc-build /root/.emscripten /root
COPY --from=emcc-build /build/llvm /build/llvm
COPY --from=emcc-build /build/node /build/node
COPY --from=emcc-build /build/binaryen /build/binaryen
COPY --from=wabt-build /root/local/wabt /root/local/wabt

ENV PATH="/build/emscripten:${PATH}"
ENV PATH="/build/llvm/bin:${PATH}"
ENV PATH="/build/node/bin:${PATH}"
ENV PATH="/build/binaryen/bin:${PATH}"
ENV PATH="/root/local/wabt/bin:${PATH}"

RUN mkdir relocatable

RUN \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/md5.c -O3 -c -o relocatable/md5.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sha1.c -O3 -c -o relocatable/sha1.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sha256.c -O3 -c -o relocatable/sha256.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sha512.c -O3 -c -o relocatable/sha512.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sm3.c -O3 -c -o relocatable/sm3.rel.wasm

RUN mkdir src
COPY src/memcpy.wat src
RUN wat2wasm src/memcpy.wat -r -o relocatable/memcpy.rel.wasm

RUN mkdir output
RUN wasm-ld \
  --export=md5_buffer \
  --export=sha1_buffer \
  --export=sha256_buffer \
  --export=sha512_buffer \
  --export=sha384_buffer \
  --export=sm3_buffer \
  --no-entry \
  --import-memory=importobjs,shm0 \
  relocatable/memcpy.rel.wasm \
  relocatable/md5.rel.wasm \
  relocatable/sha1.rel.wasm \
  relocatable/sha256.rel.wasm \
  relocatable/sha512.rel.wasm \
  relocatable/sm3.rel.wasm \
  -o output/toolchain.wasm
