FROM myllvm:0.1 AS llvm-build
FROM mynodejs:0.1 AS node-build
FROM mybinaryen:0.1 AS binaryen-build

FROM myubuntu:0.1

COPY --from=llvm-build /build/llvm-project/build /build/llvm
COPY --from=node-build /root/local/node /build/node
COPY --from=binaryen-build /build/binaryen /build/binaryen

# 安装 emscripten
WORKDIR /build
ENV NODE_JS_ROOT="/build/node/bin"
ENV BINARYEN_ROOT="/build/binaryen/bin"
ENV EM_LLVM_ROOT="/build/llvm/bin"
ENV PATH="${EM_LLVM_ROOT}:${BINARYEN_ROOT}:${NODE_JS_ROOT}:${PATH}"
RUN git clone https://github.com/emscripten-core/emscripten.git
RUN echo "EM_LLVM_ROOT=\"${EM_LLVM_ROOT}\"" >> $HOME/.emscripten
WORKDIR /build/emscripten
RUN ./bootstrap
