ARG JOBS=8

# 构建 ubuntu 开发环境
FROM ubuntu:22.04 AS dev

RUN \
  apt-get update && \
  apt-get -y install curl tar build-essential gcc cmake python3 git ninja-build xz-utils


# 预构建 coreutils
FROM dev AS coreutils-build

WORKDIR /build
RUN curl -O https://ftp.gnu.org/gnu/coreutils/coreutils-9.5.tar.xz
RUN tar -xf coreutils-9.5.tar.xz
ENV FORCE_UNSAFE_CONFIGURE 1
WORKDIR /build/coreutils-9.5
RUN ./configure && make -j ${JOBS}
RUN rm /build/coreutils-9.5.tar.xz
## coreutils 构建完毕


# 安装 emcc 
FROM dev AS emcc-build

WORKDIR /build
RUN git clone https://github.com/emscripten-core/emsdk.git
WORKDIR /build/emsdk
RUN ./emsdk install latest
RUN ./emsdk activate latest
# emcc 安装完毕


# 编译 sha2 算法源文件到 wasm 架构
FROM emcc-build AS wasm-stage-0-build

COPY --from=coreutils-build /build/coreutils-9.5 /build/coreutils-9.5

WORKDIR /build
RUN mkdir relocatable
SHELL [ "/bin/bash", "-c" ]
RUN \
  source /build/emsdk/emsdk_env.sh && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/md5.c -O3 -c -o relocatable/md5.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sha1.c -O3 -c -o relocatable/sha1.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sha256.c -O3 -c -o relocatable/sha256.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sha512.c -O3 -c -o relocatable/sha512.rel.wasm && \
  emcc -I/build/coreutils-9.5/lib /build/coreutils-9.5/lib/sm3.c -O3 -c -o relocatable/sm3.rel.wasm

FROM dev AS wabt

ARG JOBS=8
ARG INSTALL_PREFIX=/root/local/wabt

WORKDIR /build
RUN git clone --recursive https://github.com/WebAssembly/wabt
WORKDIR /build/wabt
RUN git submodule update --init
WORKDIR /build/wabt/build
RUN \
  mkdir -p ${INSTALL_PREFIX} && \
  cmake -DCMAKE_INSTALL_PREFIX=${INSTALL_PREFIX} .. && \
  cmake --build . --parallel ${JOBS} && \
  make install

FROM wasm-stage-0-build AS wasm-stage-1-linking

WORKDIR /build  
RUN mkdir src
COPY src/memcpy.wat src
COPY --from=wabt /root/local/wabt /root/local/wabt
ENV PATH="/root/local/wabt/bin:$PATH"
RUN wat2wasm src/memcpy.wat -r -o relocatable/memcpy.rel.wasm

WORKDIR /build
RUN mkdir output
ENV PATH="/build/emsdk/upstream/bin:$PATH"
RUN wasm-ld \
  --export=md5_buffer \
  --export=sha1_buffer \
  --export=sha224_buffer \
  --export=sha256_buffer \
  --export=sha384_buffer \
  --export=sha512_buffer \
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
# wasm 目标文件构建完毕


# 构建打包 next.js 项目
FROM node:lts AS next

WORKDIR /build/web
COPY . .
RUN npm ci && npm run build
# next.js 打包完毕


# 构建打包 nginx 镜像
FROM nginx:1.27.0 AS web

COPY --from=next /build/web/out /usr/share/nginx/html
COPY --from=wasm-stage-1-linking /build/output /usr/share/nginx/html
COPY nginx-conf.d/default.conf /etc/nginx/conf.d
# nginx 镜像打包完毕
