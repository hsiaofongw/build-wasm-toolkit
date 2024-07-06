FROM myubuntu:0.1

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
